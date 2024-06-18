import { DefaultParser, IntermediateParser, Parser } from './parser';
import { LiteralType } from './literal';
import { Converter, converters } from './converter';
import ReferenceProvider from './referenceProvider';
import DataProvider from './dataProvider';

export default class TemplateEngine {
  private readonly parserModes: Record<'default' | 'references', Parser>;
  private readonly converters: Record<'resolveReferences' | 'insertReferences' | 'replaceData', Converter>;

  constructor(
    referenceProvider: ReferenceProvider,
    private dataProvider: DataProvider,
  ) {
    this.parserModes = {
      default: new DefaultParser(),
      references: new IntermediateParser([...referenceProvider.knownReferences.keys()]),
    };
    this.converters = {
      resolveReferences: converters.resolveReferences(referenceProvider),
      insertReferences: converters.insertReferences(referenceProvider),
      replaceData: converters.replaceData(dataProvider),
    };
  }

  newRenderer() {
    return {
      parse: (parserMode: keyof typeof this.parserModes) => ({
        steps: (...converterNames: (keyof typeof this.converters)[]) => ({
          render: (content: string) => {
            const parser = this.parserModes[parserMode];
            const steps = converterNames.map((stepName) => this.converters[stepName]);
            const result = parser.parse(content).map((value) => steps.reduce((literal, step) => step(literal), value));
            if (result.some((value) => value.type != LiteralType.String)) {
              throw new Error(
                'Not all literals were converted during rendering. This should not happen, please contact the deploy-now team.',
              );
            }
            return result.map((value) => value.value).join('');
          },
        }),
      }),
    };
  }
}
