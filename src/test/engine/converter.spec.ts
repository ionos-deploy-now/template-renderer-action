import { describe } from 'mocha';
import { expect } from 'chai';
import * as uuid from 'uuid';
import { Literal, LiteralType, ReferenceValue } from '../../main/engine/literal';
import { converters } from '../../main/engine/converter';
import DataProvider from '../../main/engine/dataProvider';
import ReferenceProvider from '../../main/engine/referenceProvider';

describe('Test processor without references for templating', () => {
  it('Render template with simple variables', () => {
    const dataProvider = new DataProvider(
      new Map<string, string>([
        ['A', '123'],
        ['B', 'Ä'],
      ]),
    );
    const convert = converters.replaceData(dataProvider);

    expect(convert(new Literal('1: ', LiteralType.String))).to.deep.equal(new Literal('1: ', LiteralType.String));
    expect(convert(new Literal('A', LiteralType.Variable))).to.deep.equal(new Literal('123', LiteralType.String));
    expect(convert(new Literal('\n2: ', LiteralType.String))).to.deep.equal(new Literal('\n2: ', LiteralType.String));
    expect(convert(new Literal('B.urlEncoded()', LiteralType.Expression))).to.deep.equal(
      new Literal('%C3%84', LiteralType.String),
    );
  });

  it('Render template with invalid input', () => {
    const convert = converters.replaceData(new DataProvider());

    expect(() => convert(new Literal(uuid.v4(), LiteralType.Reference))).to.throw(
      'References are not supported in this mode. This should not happen, please contact the deploy-now team.',
    );
  });

  it('Render template with unknown variables', () => {
    const dataProvider = new DataProvider(new Map<string, string>([['A', '123']]));
    const convert = converters.replaceData(dataProvider);

    expect(convert(new Literal('1: ', LiteralType.String))).to.deep.equal(new Literal('1: ', LiteralType.String));
    expect(convert(new Literal('A', LiteralType.Variable))).to.deep.equal(new Literal('123', LiteralType.String));
    expect(convert(new Literal('\n2: ', LiteralType.String))).to.deep.equal(new Literal('\n2: ', LiteralType.String));
    expect(convert(new Literal('B', LiteralType.Variable))).to.deep.equal(new Literal('$B', LiteralType.String));
  });
});

describe('Test processor for template preparation', () => {
  it('Prepare template for rendering step', () => {
    const reference1 = uuid.v4();
    const reference2 = uuid.v4();
    const references = [reference2, reference1];

    const referenceProvider = new ReferenceProvider(new Map<string, ReferenceValue>(), () => references.pop());
    const convert = converters.insertReferences(referenceProvider);

    expect(convert(new Literal('1: ', LiteralType.String))).to.deep.equal(new Literal('1: ', LiteralType.String));
    expect(convert(new Literal('A', LiteralType.Variable))).to.deep.equal(new Literal(reference1, LiteralType.String));
    expect(convert(new Literal('\n2: ', LiteralType.String))).to.deep.equal(new Literal('\n2: ', LiteralType.String));
    expect(convert(new Literal('B', LiteralType.Variable))).to.deep.equal(new Literal(reference2, LiteralType.String));
  });

  it('Prepare template for rendering step with invalid input', () => {
    const convert = converters.insertReferences(new ReferenceProvider(new Map<string, ReferenceValue>()));

    expect(() => convert(new Literal(uuid.v4(), LiteralType.Reference))).to.throw(
      'References are not supported in this mode. This should not happen, please contact the deploy-now team.',
    );
  });
});

describe('Test processor with references for templating', () => {
  it('Render template with references', () => {
    const reference1 = uuid.v4();
    const reference2 = uuid.v4();

    const referenceProvider = new ReferenceProvider(
      new Map<string, ReferenceValue>([
        [reference1, { key: 'A' }],
        [reference2, { key: 'B' }],
      ]),
    );
    const dataProvider = new DataProvider(
      new Map<string, string>([
        ['A', '123'],
        ['B', '456'],
      ]),
    );
    const convert = (l: Literal) =>
      converters.replaceData(dataProvider)(converters.resolveReferences(referenceProvider)(l));

    expect(convert(new Literal('1: ', LiteralType.String))).to.deep.equal(new Literal('1: ', LiteralType.String));
    expect(convert(new Literal(reference1, LiteralType.Reference))).to.deep.equal(
      new Literal('123', LiteralType.String),
    );
    expect(convert(new Literal('\n2: ', LiteralType.String))).to.deep.equal(new Literal('\n2: ', LiteralType.String));
    expect(convert(new Literal(reference2, LiteralType.Reference))).to.deep.equal(
      new Literal('456', LiteralType.String),
    );
  });

  it('Render template with references and variables', () => {
    const reference = uuid.v4();

    const referenceProvider = new ReferenceProvider(new Map<string, ReferenceValue>([[reference, { key: 'B' }]]));
    const dataProvider = new DataProvider(
      new Map<string, string>([
        ['A', '123'],
        ['B', '456'],
      ]),
    );
    const convert = (l: Literal) =>
      converters.replaceData(dataProvider)(converters.resolveReferences(referenceProvider)(l));

    expect(convert(new Literal('1: ', LiteralType.String))).to.deep.equal(new Literal('1: ', LiteralType.String));
    expect(convert(new Literal('A', LiteralType.Variable))).to.deep.equal(new Literal('123', LiteralType.String));
    expect(convert(new Literal('\n2: ', LiteralType.String))).to.deep.equal(new Literal('\n2: ', LiteralType.String));
    expect(convert(new Literal(reference, LiteralType.Reference))).to.deep.equal(
      new Literal('456', LiteralType.String),
    );
  });

  it('Render template with unknown references', () => {
    const reference = uuid.v4();

    const referenceProvider = new ReferenceProvider(new Map<string, ReferenceValue>());
    const dataProvider = new DataProvider(
      new Map<string, string>([
        ['A', '123'],
        ['B', '456'],
      ]),
    );
    const convert = (l: Literal) =>
      converters.replaceData(dataProvider)(converters.resolveReferences(referenceProvider)(l));

    expect(() => convert(new Literal(reference, LiteralType.Reference))).to.throw(
      `Could not resolve reference ${reference}. This should not happen, please contact the deploy-now team.`,
    );
  });

  it('Render template with unknown variable', () => {
    const reference1 = uuid.v4();
    const reference2 = uuid.v4();

    const referenceProvider = new ReferenceProvider(
      new Map<string, ReferenceValue>([
        [reference1, { key: 'A' }],
        [reference2, { key: 'B' }],
      ]),
    );
    const dataProvider = new DataProvider(new Map<string, string>([['A', '123']]));
    const convert = (l: Literal) =>
      converters.replaceData(dataProvider)(converters.resolveReferences(referenceProvider)(l));

    expect(convert(new Literal('1: ', LiteralType.String))).to.deep.equal(new Literal('1: ', LiteralType.String));
    expect(convert(new Literal(reference1, LiteralType.Reference))).to.deep.equal(
      new Literal('123', LiteralType.String),
    );
    expect(convert(new Literal('\n2: ', LiteralType.String))).to.deep.equal(new Literal('\n2: ', LiteralType.String));
    expect(convert(new Literal(reference2, LiteralType.Reference))).to.deep.equal(
      new Literal('$B', LiteralType.String),
    );
  });
});
