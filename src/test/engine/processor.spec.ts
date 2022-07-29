import { describe } from 'mocha';
import { expect } from 'chai';
import * as uuid from 'uuid';
import { Literal, LiteralType } from '../../main/engine/literal';
import { IntermediateProcessor, SimpleProcessor } from '../../main/engine/processor';
import ReferenceSupplier from '../../main/engine/referenceSupplier';

describe('Test processor without references for templating', () => {
  it('Render template with simple variables', () => {
    const processor = new SimpleProcessor((value) => value);
    const literals = [
      new Literal('1: ', LiteralType.String),
      new Literal('A', LiteralType.Variable),
      new Literal('\n2: ', LiteralType.String),
      new Literal('B', LiteralType.Variable),
    ];
    const data = new Map<string, string>([
      ['A', '123'],
      ['B', '456'],
    ]);

    expect(processor.renderTemplate(literals, data)).to.equal('1: 123\n2: 456');
  });

  it('Render template with invalid input', () => {
    const processor = new SimpleProcessor((value) => value);
    const literals = [
      new Literal('1: ', LiteralType.String),
      new Literal(uuid.v4(), LiteralType.Reference),
      new Literal('\n2: ', LiteralType.String),
      new Literal('B', LiteralType.Variable),
    ];
    const data = new Map<string, string>([
      ['A', '123'],
      ['B', '456'],
    ]);

    expect(() => processor.renderTemplate(literals, data)).to.throw(
      'References are not supported in this mode. This should not happen, please contact the deploy-now team.'
    );
  });

  it('Render template with unknown variables', () => {
    const processor = new SimpleProcessor((value) => '$' + value);
    const literals = [
      new Literal('1: ', LiteralType.String),
      new Literal('A', LiteralType.Variable),
      new Literal('\n2: ', LiteralType.String),
      new Literal('B', LiteralType.Variable),
    ];
    const data = new Map<string, string>([['A', '123']]);

    expect(processor.renderTemplate(literals, data)).to.equal('1: 123\n2: $B');
  });
});

describe('Test processor for template preparation', () => {
  it('Prepare template for rendering step', () => {
    const reference1 = uuid.v4();
    const reference2 = uuid.v4();
    const references = [reference2, reference1];

    const processor = new IntermediateProcessor(new ReferenceSupplier(() => references.pop()), (value) => value);
    const literals = [
      new Literal('1: ', LiteralType.String),
      new Literal('A', LiteralType.Variable),
      new Literal('\n2: ', LiteralType.String),
      new Literal('B', LiteralType.Variable),
    ];

    expect(processor.prepareTemplate(literals)).to.equal(`1: ${reference1}\n2: ${reference2}`);
  });

  it('Prepare template for rendering step with invalid input', () => {
    const processor = new IntermediateProcessor(new ReferenceSupplier(() => uuid.v4()), (value) => value);
    const literals = [
      new Literal('1: ', LiteralType.String),
      new Literal('A', LiteralType.Reference),
      new Literal('\n2: ', LiteralType.String),
      new Literal('B', LiteralType.Variable),
    ];

    expect(() => processor.prepareTemplate(literals)).to.throw(
      'References are not supported in this mode. This should not happen, please contact the deploy-now team.'
    );
  });
});

describe('Test processor with references for templating', () => {
  it('Render template with references', () => {
    const reference1 = uuid.v4();
    const reference2 = uuid.v4();

    const processor = new IntermediateProcessor(new ReferenceSupplier(() => uuid.v4()), (value) => value);
    const literals = [
      new Literal('1: ', LiteralType.String),
      new Literal(reference1, LiteralType.Reference),
      new Literal('\n2: ', LiteralType.String),
      new Literal(reference2, LiteralType.Reference),
    ];
    const references = new Map<string, string>([
      [reference1, 'A'],
      [reference2, 'B'],
    ]);
    const data = new Map<string, string>([
      ['A', '123'],
      ['B', '456'],
    ]);

    expect(processor.renderTemplate(literals, data, references)).to.equal('1: 123\n2: 456');
  });

  it('Render template with references and variables', () => {
    const reference = uuid.v4();

    const processor = new IntermediateProcessor(new ReferenceSupplier(() => uuid.v4()), (value) => '$' + value);
    const literals = [
      new Literal('1: ', LiteralType.String),
      new Literal('A', LiteralType.Variable),
      new Literal('\n2: ', LiteralType.String),
      new Literal(reference, LiteralType.Reference),
    ];
    const references = new Map<string, string>([[reference, 'B']]);

    expect(processor.renderTemplate(literals, new Map<string, string>(), references)).to.equal('1: $A\n2: $B');
  });

  it('Render template with unknown references', () => {
    const reference = uuid.v4();

    const processor = new IntermediateProcessor(new ReferenceSupplier(() => uuid.v4()), (value) => '$' + value);
    const literals = [
      new Literal('1: ', LiteralType.String),
      new Literal('A', LiteralType.Variable),
      new Literal('\n2: ', LiteralType.String),
      new Literal(reference, LiteralType.Reference),
    ];

    expect(() => processor.renderTemplate(literals, new Map<string, string>(), new Map<string, string>())).to.throw(
      `Could not resolve reference ${reference}. This should not happen, please contact the deploy-now team.`
    );
  });

  it('Render template with unknown variable', () => {
    const reference1 = uuid.v4();
    const reference2 = uuid.v4();

    const processor = new IntermediateProcessor(new ReferenceSupplier(() => uuid.v4()), (value) => '$' + value);
    const literals = [
      new Literal('1: ', LiteralType.String),
      new Literal(reference1, LiteralType.Reference),
      new Literal('\n2: ', LiteralType.String),
      new Literal(reference2, LiteralType.Reference),
    ];
    const references = new Map<string, string>([
      [reference1, 'A'],
      [reference2, 'B'],
    ]);
    const data = new Map<string, string>([['A', '123']]);

    expect(processor.renderTemplate(literals, data, references)).to.equal('1: 123\n2: $B');
  });
});
