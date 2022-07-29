import fs from 'fs';
import path from 'path';
import { ReferenceValue } from '../../engine/literal';

export type IntermediateDataFileContent = {
  createdFiles: string[];
  references: { [reference: string]: ReferenceValue };
};

export class IntermediateDataFile {
  constructor(readonly content: IntermediateDataFileContent) {}

  static readOrDefault(filePath: string | null): IntermediateDataFile {
    if (filePath === null || !fs.existsSync(filePath)) {
      return new IntermediateDataFile({ createdFiles: [], references: {} });
    }
    const fileContent = fs.readFileSync(filePath, { encoding: 'utf8', flag: 'r' });
    return new IntermediateDataFile(JSON.parse(fileContent));
  }

  save(filePath: string) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(this.content));
  }

  forEachCreatedFile(action: (filePath: string) => void) {
    this.content.createdFiles.forEach((file) => action(file));
  }

  getReferencesMap(): Map<string, ReferenceValue> {
    return new Map(Object.entries(this.content.references));
  }
}
