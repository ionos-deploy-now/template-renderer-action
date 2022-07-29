import Configuration from './input/types';
import TemplateEngine from '../engine';
import { IntermediateDataFile } from './files/intermediateDataFile';
import { Directory } from './files/directory';
import { TemplateFile } from './files/templateFile';
import Data from './input/data';
import { generateContextSensitiveReference } from './referenceGenerator';

export async function renderTemplates(configuration: Configuration): Promise<Record<string, never>> {
  const intermediateDataFile = IntermediateDataFile.readOrDefault(configuration.intermediateDataFile);
  const templateEngine = new TemplateEngine(
    intermediateDataFile.getReferencesMap(),
    configuration.useContextSensitiveReferences ? generateContextSensitiveReference : undefined,
    undefined
  );

  if (Data.isSet()) {
    const data = Data.fromInput(configuration.deploymentId);

    if (configuration.intermediateDataFile === null) {
      Directory.openFromRepo(configuration.inputDirectory, configuration.templateExtension)
        .createDirectoryTreeAt(configuration.outputDirectory)
        .forEachTemplateFile((templateFile) =>
          templateFile
            .renderWith((content) => templateEngine.process(content, data))
            .saveResultTo(configuration.outputDirectory)
        );
    } else {
      if (configuration.inputDirectory !== configuration.outputDirectory) {
        throw new Error('"input-directory" and "output-directory" should be the same when completing the templating');
      }
      intermediateDataFile.forEachCreatedFile((filePath) =>
        TemplateFile.open(configuration.inputDirectory, filePath, configuration.templateExtension)
          .renderWith((content) => templateEngine.processIntermediate(content, data))
          .updateFile(configuration.outputDirectory)
      );
    }
  } else {
    if (configuration.intermediateDataFile !== null) {
      const createdFiles = Directory.openFromRepo(configuration.inputDirectory, configuration.templateExtension)
        .createDirectoryTreeAt(configuration.outputDirectory)
        .forEachTemplateFile((templateFile) =>
          templateFile
            .renderWith((content) => templateEngine.processIntermediate(content))
            .saveResultTo(configuration.outputDirectory)
        )
        .getAllTemplateFiles();
      const references = Object.fromEntries([...templateEngine.getKnownReferences().entries()]);
      new IntermediateDataFile({ createdFiles, references }).save(configuration.intermediateDataFile);
    } else {
      throw new Error(
        'At least one of the input properties "deployment-id" and "intermediate-data-file" need to be supplied'
      );
    }
  }
  return {};
}
