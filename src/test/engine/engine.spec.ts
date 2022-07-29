import * as uuid from 'uuid';
import { describe } from 'mocha';
import { expect } from 'chai';
import TemplateEngine from '../../main/engine';

describe('Test template engine', () => {
  it('Render simple template without multiple steps', () => {
    const engine = new TemplateEngine();
    const data = new Map<string, string>([
      ['A', '123'],
      ['B', '456'],
    ]);

    expect(engine.process('1: $A\n2: $B\n3: $C', data)).to.equal('1: 123\n2: 456\n3: $C');
  });

  it('Prepare template for rendering in another step', () => {
    const reference1 = uuid.v4();
    const reference2 = uuid.v4();
    const reference3 = uuid.v4();
    const references = [reference3, reference2, reference1];

    const engine = new TemplateEngine(new Map<string, string>(), () => references.pop());

    expect(engine.processIntermediate('1: $A\n2: $B\n3: $C')).to.equal(
      `1: ${reference1}\n2: ${reference2}\n3: ${reference3}`
    );
    expect(engine.getKnownReferences()).to.deep.equal(
      new Map<string, string>([
        [reference1, 'A'],
        [reference2, 'B'],
        [reference3, 'C'],
      ])
    );
  });

  it('Render prepared template from previous step', () => {
    const reference1 = uuid.v4();
    const reference2 = uuid.v4();
    const reference3 = uuid.v4();

    const engine = new TemplateEngine(
      new Map<string, string>([
        [reference1, 'A'],
        [reference2, 'B'],
        [reference3, 'C'],
      ])
    );

    expect(
      engine.processIntermediate(
        `1: ${reference1}\n2: ${reference2}\n3: ${reference3}`,
        new Map<string, string>([
          ['A', '123'],
          ['B', '456'],
        ])
      )
    ).to.equal('1: 123\n2: 456\n3: $C');
    expect(engine.getKnownReferences()).to.deep.equal(
      new Map<string, string>([
        [reference1, 'A'],
        [reference2, 'B'],
        [reference3, 'C'],
      ])
    );
  });
});
