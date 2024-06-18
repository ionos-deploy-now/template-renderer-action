import fs from 'fs';
import path from 'path';
import { FileMetadata } from './fileMetadata';
import { TemplateFile } from './templateFile';

export class Directory {
  constructor(
    readonly relativePath: string,
    readonly directories: Directory[],
    readonly templateFiles: TemplateFile[],
    readonly metadata: FileMetadata,
  ) {}

  static openFromRepo(basePath: string, templateExtension: string): Directory {
    return this.open(basePath, '', templateExtension);
  }

  private static open(basePath: string, relativePath: string, templateExtension: string): Directory {
    const files = fs.readdirSync(path.join(basePath, relativePath));
    const directories: Directory[] = [];
    const templateFiles: TemplateFile[] = [];
    files.forEach((file) => {
      const stats = fs.lstatSync(path.join(basePath, relativePath, file));
      if (stats.isDirectory()) {
        directories.push(this.open(basePath, path.join(relativePath, file), templateExtension));
      } else if (stats.isFile() && file.endsWith(templateExtension) && file != templateExtension) {
        templateFiles.push(TemplateFile.open(basePath, path.join(relativePath, file), templateExtension));
      }
    });
    return new Directory(
      relativePath,
      directories,
      templateFiles,
      FileMetadata.of(fs.lstatSync(path.join(basePath, relativePath))),
    );
  }

  processTemplateFiles(renderAction: (content: string) => string, options: ProcessingOptions): Directory {
    if (options.copyDirectories) {
      const dirPath = path.join(options.outputDirectory, this.relativePath);
      if ((this.directories.length > 0 || this.templateFiles.length > 0) && !fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { mode: this.metadata.mode, recursive: this.relativePath == '' });
        fs.chownSync(dirPath, this.metadata.uid, this.metadata.gid);
      }
    }
    this.templateFiles.forEach((templateFile) => {
      const renderedTemplateFile = templateFile.renderWith(renderAction);
      if (options.mode == 'create') {
        renderedTemplateFile.saveResultTo(options.outputDirectory);
      } else if (options.mode == 'update') {
        renderedTemplateFile.updateFile(options.outputDirectory);
      }
    });
    this.directories.forEach((directory) => directory.processTemplateFiles(renderAction, options));
    return this;
  }

  getAllTemplateFiles(): string[] {
    return [
      ...this.templateFiles.map((templateFile) => templateFile.relativePath),
      ...this.directories.flatMap((directory) => directory.getAllTemplateFiles()),
    ];
  }
}

type ProcessingOptions = {
  copyDirectories: boolean;
  outputDirectory: string;
  mode: 'create' | 'update';
};
