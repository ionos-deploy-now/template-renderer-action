import { DefaultParser, IntermediateParser } from './parser';
import { IntermediateProcessor, SimpleProcessor } from './processor';
import * as uuid from 'uuid';
import ReferenceSupplier from './referenceSupplier';

export default class TemplateEngine {
  private readonly referenceSupplier: ReferenceSupplier;

  private defaultParser: DefaultParser;
  private intermediateParser: IntermediateParser;

  private simpleProcessor: SimpleProcessor;
  private intermediateProcessor: IntermediateProcessor;

  constructor(
    private references: Map<string, string> = new Map<string, string>(),
    referenceSupplier: (value: string) => string = () => uuid.v4(),
    private dataNotFoundAction: (value: string) => string = (value) => '$' + value
  ) {
    this.referenceSupplier = new ReferenceSupplier(referenceSupplier);
    this.defaultParser = new DefaultParser();
    this.intermediateParser = new IntermediateParser([...references.keys()]);
    this.simpleProcessor = new SimpleProcessor(dataNotFoundAction);
    this.intermediateProcessor = new IntermediateProcessor(this.referenceSupplier, dataNotFoundAction);
  }

  process(template: string, data: Map<string, string>): string {
    return this.simpleProcessor.renderTemplate(this.defaultParser.parse(template), data);
  }

  processIntermediate(template: string, data: Map<string, string> | undefined = undefined): string {
    if (data === undefined) {
      return this.intermediateProcessor.prepareTemplate(this.defaultParser.parse(template));
    } else {
      return this.intermediateProcessor.renderTemplate(this.intermediateParser.parse(template), data, this.references);
    }
  }

  getKnownReferences(): Map<string, string> {
    const result = new Map<string, string>();
    this.references.forEach((value, key) => result.set(key, value));
    this.referenceSupplier.usedReferences.forEach((value, key) => result.set(key, value));
    return result;
  }
}
