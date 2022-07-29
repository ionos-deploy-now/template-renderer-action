export class Literal {
  constructor(readonly value: string, readonly type: LiteralType) {}
}

export enum LiteralType {
  String,
  Variable,
  Reference,
}
