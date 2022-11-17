import { FileMetadata } from './fileMetadata';
import fs from 'fs';
import path from 'path';

export class TemplateFile {
  constructor(readonly relativePath: string, readonly content: string, readonly metadata: FileMetadata) {}

  static open(basePath: string, relativePath: string, templateExtension: string): TemplateFile {
    if (relativePath == templateExtension || relativePath.endsWith('/' + templateExtension)) {
      throw new Error('Cannot open template file with empty name.')
    }
    const filePath = path.join(basePath, relativePath);
    return new TemplateFile(
      relativePath.replace(templateExtension, ''),
      fs.readFileSync(filePath, { encoding: 'utf8', flag: 'r' }),
      FileMetadata.of(fs.lstatSync(filePath))
    );
  }

  renderWith(renderingAction: (content: string) => string): RenderedTemplateFile {
    return new RenderedTemplateFile(this.relativePath, renderingAction(this.content), this.metadata);
  }
}

export class RenderedTemplateFile {
  constructor(readonly relativePath: string, readonly content: string, readonly metadata: FileMetadata) {}

  updateFile(basePath: string) {
    fs.writeFileSync(path.join(basePath, this.relativePath), this.content);
  }

  saveResultTo(basePath: string) {
    const filePath = path.join(basePath, this.relativePath);
    fs.writeFileSync(filePath, this.content, { mode: this.metadata.mode });
    fs.chownSync(filePath, this.metadata.uid, this.metadata.gid);
  }
}
