import { describe } from 'mocha';
import { expect } from 'chai';
import * as uuid from 'uuid';
import { DefaultParser, IntermediateParser } from '../../main/engine/parser';
import { Literal, LiteralType } from '../../main/engine/literal';

describe('Test parsing functions for templating', () => {
  it('Test parsing with multiple variables', () => {
    const parser = new DefaultParser();
    const literals = parser.parse('1: $A\n, 2: ${ B_C }');

    expect(literals).to.have.length(5);
    expect(literals[0]).to.deep.equal(new Literal('1: ', LiteralType.String));
    expect(literals[1]).to.deep.equal(new Literal('A', LiteralType.Variable));
    expect(literals[2]).to.deep.equal(new Literal('\n, 2: ', LiteralType.String));
    expect(literals[3]).to.deep.equal(new Literal('B_C', LiteralType.Expression));
    expect(literals[4]).to.deep.equal(new Literal('', LiteralType.String));
  });

  it('Test parsing with not recognized chars', () => {
    const parser = new DefaultParser();
    const literals = parser.parse('1: $Ab\n, 2: $9');

    expect(literals).to.have.length(3);
    expect(literals[0]).to.deep.equal(new Literal('1: ', LiteralType.String));
    expect(literals[1]).to.deep.equal(new Literal('AB', LiteralType.Variable));
    expect(literals[2]).to.deep.equal(new Literal('\n, 2: $9', LiteralType.String));
  });

  it('Test parsing with one reference', () => {
    const reference = uuid.v4();
    const unknownReference = uuid.v4();

    const parser = new IntermediateParser([reference]);
    const literals = parser.parse(`1: ${reference}\n, 2: ${unknownReference}`);

    expect(literals).to.have.length(3);
    expect(literals[0]).to.deep.equal(new Literal('1: ', LiteralType.String));
    expect(literals[1]).to.deep.equal(new Literal(reference, LiteralType.Reference));
    expect(literals[2]).to.deep.equal(new Literal(`\n, 2: ${unknownReference}`, LiteralType.String));
  });

  it('Test parsing with multiple references', () => {
    const reference1 = uuid.v4();
    const reference2 = uuid.v4();

    const parser = new IntermediateParser([reference1, reference2]);
    const literals = parser.parse(`1: ${reference1}\n, 2: ${reference2}`);

    expect(literals).to.have.length(5);
    expect(literals[0]).to.deep.equal(new Literal('1: ', LiteralType.String));
    expect(literals[1]).to.deep.equal(new Literal(reference1, LiteralType.Reference));
    expect(literals[2]).to.deep.equal(new Literal('\n, 2: ', LiteralType.String));
    expect(literals[3]).to.deep.equal(new Literal(reference2, LiteralType.Reference));
    expect(literals[4]).to.deep.equal(new Literal('', LiteralType.String));
  });
});
