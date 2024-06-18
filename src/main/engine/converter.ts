import { Literal, LiteralType } from './literal';
import { methods } from './methods';
import ReferenceProvider from './referenceProvider';
import DataProvider from './dataProvider';

export type Converter = (literal: Literal) => Literal;

const insertReferences = (referenceProvider: ReferenceProvider) => (literal) => {
  switch (literal.type) {
    case LiteralType.String:
      return literal;
    case LiteralType.Variable:
      return new Literal(referenceProvider.createKeyReference(literal.value), LiteralType.String);
    case LiteralType.Expression:
      return new Literal(referenceProvider.createExpressionReference(literal.value), LiteralType.String);
    case LiteralType.Reference:
      throw new Error(
        'References are not supported in this mode. This should not happen, please contact the deploy-now team.',
      );
  }
};

const resolveReferences = (referenceProvider: ReferenceProvider) => (literal) => {
  if (literal.type == LiteralType.Reference) {
    const referenceValue = referenceProvider.knownReferences.get(literal.value);
    if (referenceValue?.key != undefined) {
      return new Literal(referenceValue.key, LiteralType.Variable);
    }
    if (referenceValue?.expression != undefined) {
      return new Literal(referenceValue.expression, LiteralType.Expression);
    }
    throw new Error(
      `Could not resolve reference ${literal.value}. This should not happen, please contact the deploy-now team.`,
    );
  }
  return literal;
};

const replaceData = (dataProvider: DataProvider) => (literal) => {
  switch (literal.type) {
    case LiteralType.String:
      return literal;
    case LiteralType.Variable:
      return new Literal(dataProvider.get(literal.value), LiteralType.String);
    case LiteralType.Expression:
      return new Literal(evaluateExpression(literal.value, dataProvider), LiteralType.String);
    case LiteralType.Reference:
      throw new Error(
        'References are not supported in this mode. This should not happen, please contact the deploy-now team.',
      );
  }
};

const expressionRegex = new RegExp('^(?<variable>[A-Za-z_][A-Za-z0-9_]*)([.](?<method>[A-Za-z_][A-Za-z0-9_]*)[(][)])?');

function evaluateExpression(expression: string, dataProvider: DataProvider): string {
  const groups = expressionRegex.exec(expression)?.groups;
  if (groups != undefined && groups.variable != undefined) {
    if (!dataProvider.has(groups.variable)) {
      return '${' + expression + '}';
    }
    if (groups.method != undefined) {
      return methods[groups.method](dataProvider.get(groups.variable));
    }
    return dataProvider.get(groups.variable);
  }
  throw new Error(`Invalid expression: ${expression}`);
}

export const converters = {
  insertReferences,
  resolveReferences,
  replaceData,
};
