import Configuration from './input/types';
import TemplateEngine from '../engine';
import { IntermediateDataFile } from './files/intermediateDataFile';
import { Directory } from './files/directory';
import { TemplateFile } from './files/templateFile';
import Data from './input/data';
import { generateContextSensitiveReference } from './referenceGenerator';
import ReferenceProvider from '../engine/referenceProvider';
import DataProvider from '../engine/dataProvider';

export async function renderTemplates(configuration: Configuration): Promise<Record<string, never>> {
  const isDataSet = Data.isSet();
  const isIntermediateDataFileSet = configuration.intermediateDataFile != null;
  const intermediateDataFile = IntermediateDataFile.readOrDefault(configuration.intermediateDataFile);
  const referenceProvider = new ReferenceProvider(
    intermediateDataFile.getReferencesMap(),
    configuration.useContextSensitiveReferences ? generateContextSensitiveReference : undefined,
  );
  const dataProvider = new DataProvider(isDataSet ? Data.fromInput(configuration.deploymentId) : undefined);
  const templateEngine = new TemplateEngine(referenceProvider, dataProvider);

  if (isDataSet) {
    if (isIntermediateDataFileSet) {
      renderWithReferences(configuration, templateEngine, intermediateDataFile);
    } else {
      renderWithoutReferences(configuration, templateEngine);
    }
  } else {
    if (isIntermediateDataFileSet) {
      insertReferences(configuration, templateEngine, referenceProvider);
    } else {
      throw new Error(
        'At least one of the input properties "data" and "intermediate-data-file" need to be supplied. Additionally you could supply a "deployment-id" to use deployment specific values',
      );
    }
  }
  return {};
}

function renderWithoutReferences(
  { inputDirectory, templateExtension, outputDirectory }: Configuration,
  templateEngine: TemplateEngine,
) {
  const renderer = templateEngine.newRenderer().parse('default').steps('replaceData').render;

  Directory.openFromRepo(inputDirectory, templateExtension).processTemplateFiles(renderer, {
    outputDirectory,
    copyDirectories: true,
    mode: 'create',
  });
}

function renderWithReferences(
  { inputDirectory, outputDirectory, templateExtension }: Configuration,
  templateEngine: TemplateEngine,
  intermediateDataFile: IntermediateDataFile,
) {
  if (inputDirectory !== outputDirectory) {
    throw new Error('"input-directory" and "output-directory" should be the same when completing the templating');
  }

  const renderer = templateEngine.newRenderer().parse('references').steps('resolveReferences', 'replaceData').render;

  intermediateDataFile.forEachCreatedFile((filePath) =>
    TemplateFile.open(inputDirectory, filePath, templateExtension).renderWith(renderer).updateFile(outputDirectory),
  );
}

function insertReferences(
  { inputDirectory, outputDirectory, templateExtension, intermediateDataFile }: Required<Configuration>,
  templateEngine: TemplateEngine,
  referenceProvider: ReferenceProvider,
) {
  const renderer = templateEngine.newRenderer().parse('default').steps('insertReferences').render;

  const createdFiles = Directory.openFromRepo(inputDirectory, templateExtension)
    .processTemplateFiles(renderer, { outputDirectory, mode: 'create', copyDirectories: true })
    .getAllTemplateFiles();
  const references = Object.fromEntries([...referenceProvider.knownReferences.entries()]);
  new IntermediateDataFile({ createdFiles, references }).save(intermediateDataFile!);
}
