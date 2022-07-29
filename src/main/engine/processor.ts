import { Literal, LiteralType } from './literal';
import ReferenceSupplier from './referenceSupplier';

export class SimpleProcessor {
  constructor(private dataNotFoundAction: (value: string) => string) {}

  renderTemplate(ast: Literal[], data: Map<string, string>): string {
    return ast
      .map((value) => {
        switch (value.type) {
          case LiteralType.String:
            return value.value;
          case LiteralType.Variable:
            return data.get(value.value) || this.dataNotFoundAction(value.value);
          case LiteralType.Reference:
            throw new Error(
              'References are not supported in this mode. This should not happen, please contact the deploy-now team.'
            );
        }
      })
      .join('');
  }
}

export class IntermediateProcessor {
  constructor(private referenceSupplier: ReferenceSupplier, private dataNotFoundAction: (value: string) => string) {}

  prepareTemplate(ast: Literal[]): string {
    return ast
      .map((value) => {
        switch (value.type) {
          case LiteralType.String:
            return value.value;
          case LiteralType.Variable: {
            return this.referenceSupplier.createNewReference(value.value);
          }
          case LiteralType.Reference:
            throw new Error(
              'References are not supported in this mode. This should not happen, please contact the deploy-now team.'
            );
        }
      })
      .join('');
  }

  renderTemplate(ast: Literal[], data: Map<string, string>, values: Map<string, string>): string {
    return ast
      .map((value) => {
        switch (value.type) {
          case LiteralType.String:
            return value.value;
          case LiteralType.Variable: {
            return data.get(value.value) || this.dataNotFoundAction(value.value);
          }
          case LiteralType.Reference: {
            const key = values.get(value.value);
            if (key == undefined) {
              throw new Error(
                `Could not resolve reference ${value.value}. This should not happen, please contact the deploy-now team.`
              );
            }
            return data.get(key) || this.dataNotFoundAction(key);
          }
        }
      })
      .join('');
  }
}
