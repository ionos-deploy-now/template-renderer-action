export default interface Configuration {
  readonly deploymentId: string | null;
  readonly inputDirectory: string;
  readonly outputDirectory: string;
  readonly intermediateDataFile: string | null;
  readonly templateExtension: string;
  readonly useContextSensitiveReferences: boolean;
}
