import { Literal, LiteralType } from './literal';

export abstract class Parser {
  protected constructor(readonly regex: RegExp) {}

  abstract handleMatch(match: string): Literal;

  public parse(input: string): Literal[] {
    const matchResults = [...input.matchAll(this.regex)];
    let startIndex = 0;
    const ast: Literal[] = [];
    for (const matchResult of matchResults) {
      ast.push(new Literal(input.slice(startIndex, matchResult.index).toString(), LiteralType.String));
      ast.push(this.handleMatch(matchResult[0]));
      startIndex = matchResult.index! + matchResult[0].length;
    }
    ast.push(new Literal(input.slice(startIndex, input.length).toString(), LiteralType.String));

    return ast;
  }
}

export class DefaultParser extends Parser {
  constructor() {
    super(
      new RegExp(
        '([$][A-Za-z_][A-Za-z0-9_]*)|([$][{] *[A-Za-z_][A-Za-z0-9_]*([.][A-Za-z_][A-Za-z0-9_]*[(][)])? *[}])',
        'g'
      )
    );
  }

  handleMatch(match: string): Literal {
    if (match.startsWith('${')) {
      const s = match.replace('${', '').replace('}', '').replace(/ /g, '').split('.');
      if (s.length > 1) {
        return new Literal(s[0].toUpperCase() + '.' + s[1], LiteralType.Expression);
      }
      return new Literal(s[0].toUpperCase(), LiteralType.Expression);
    }
    return new Literal(match.replace('$', '').toUpperCase(), LiteralType.Variable);
  }
}

export class IntermediateParser extends Parser {
  constructor(private references: string[]) {
    super(new RegExp(references.map((value) => `(${value})`).join('|'), 'g'));
  }

  handleMatch(match: string): Literal {
    return new Literal(match, LiteralType.Reference);
  }
}
