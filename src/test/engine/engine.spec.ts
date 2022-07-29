import * as uuid from 'uuid';
import { describe } from 'mocha';
import { expect } from 'chai';
import TemplateEngine from '../../main/engine';
import ReferenceProvider from '../../main/engine/referenceProvider';
import DataProvider from '../../main/engine/dataProvider';
import { ReferenceValue } from '../../main/engine/literal';

describe('Test template engine', () => {
  it('Render simple template without multiple steps', () => {
    const referenceProvider = new ReferenceProvider(new Map<string, ReferenceValue>());
    const dataProvider = new DataProvider(
      new Map<string, string>([
        ['A', '123'],
        ['B', '456'],
        ['C', 'Ä'],
      ])
    );
    const engine = new TemplateEngine(referenceProvider, dataProvider);

    expect(
      engine.newRenderer().parse('default').steps('replaceData').render('1: $A\n2: ${B}\n3: ${C.urlEncoded()}\n4: $D')
    ).to.equal('1: 123\n2: 456\n3: %C3%84\n4: $D');
  });

  it('Prepare template for rendering in another step', () => {
    const reference1 = uuid.v4();
    const reference2 = uuid.v4();
    const reference3 = uuid.v4();
    const references = [reference3, reference2, reference1];

    const referenceProvider = new ReferenceProvider(new Map<string, ReferenceValue>(), () => references.pop());
    const engine = new TemplateEngine(referenceProvider, new DataProvider());

    expect(engine.newRenderer().parse('default').steps('insertReferences').render('1: $A\n2: $B\n3: $C')).to.equal(
      `1: ${reference1}\n2: ${reference2}\n3: ${reference3}`
    );
    expect(referenceProvider.knownReferences).to.deep.equal(
      new Map<string, ReferenceValue>([
        [reference1, { key: 'A' }],
        [reference2, { key: 'B' }],
        [reference3, { key: 'C' }],
      ])
    );
  });

  it('Render prepared template from previous step', () => {
    const reference1 = uuid.v4();
    const reference2 = uuid.v4();
    const reference3 = uuid.v4();

    const referenceProvider = new ReferenceProvider(
      new Map<string, ReferenceValue>([
        [reference1, { key: 'A' }],
        [reference2, { key: 'B' }],
        [reference3, { key: 'C' }],
      ])
    );
    const dataProvider = new DataProvider(
      new Map<string, string>([
        ['A', '123'],
        ['B', '456'],
      ])
    );
    const engine = new TemplateEngine(referenceProvider, dataProvider);

    expect(
      engine
        .newRenderer()
        .parse('references')
        .steps('resolveReferences', 'replaceData')
        .render(`1: ${reference1}\n2: ${reference2}\n3: ${reference3}`)
    ).to.equal('1: 123\n2: 456\n3: $C');
    expect(referenceProvider.knownReferences).to.deep.equal(
      new Map<string, ReferenceValue>([
        [reference1, { key: 'A' }],
        [reference2, { key: 'B' }],
        [reference3, { key: 'C' }],
      ])
    );
  });
});
