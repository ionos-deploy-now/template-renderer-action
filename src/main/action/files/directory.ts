import fs from 'fs';
import path from 'path';
import { FileMetadata } from './fileMetadata';
import { TemplateFile } from './templateFile';

export class Directory {
  constructor(
    readonly relativePath: string,
    readonly directories: Directory[],
    readonly templateFiles: TemplateFile[],
    readonly metadata: FileMetadata
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
      } else if (stats.isFile() && file.endsWith(templateExtension)) {
        templateFiles.push(TemplateFile.open(basePath, path.join(relativePath, file), templateExtension));
      }
    });
    return new Directory(
      relativePath,
      directories,
      templateFiles,
      FileMetadata.of(fs.lstatSync(path.join(basePath, relativePath)))
    );
  }

  createDirectoryTreeAt(basePath: string, isRoot: boolean = true): Directory {
    const dirPath = path.join(basePath, this.relativePath);
    if (this.directories.length > 0 || (this.templateFiles.length > 0 && !fs.existsSync(dirPath))) {
      fs.mkdirSync(dirPath, { mode: this.metadata.mode, recursive: isRoot });
      fs.chownSync(dirPath, this.metadata.uid, this.metadata.gid);
    }
    this.directories.forEach((directory) => directory.createDirectoryTreeAt(basePath, false));
    return this;
  }

  forEachTemplateFile(action: (templateFile: TemplateFile, parent: Directory) => void): Directory {
    this.templateFiles.forEach((templateFile) => action(templateFile, this));
    this.directories.forEach((directory) => directory.forEachTemplateFile(action));
    return this;
  }

  getAllTemplateFiles(): string[] {
    return [
      ...this.templateFiles.map((templateFile) => templateFile.relativePath),
      ...this.directories.flatMap((directory) => directory.getAllTemplateFiles()),
    ];
  }
}
