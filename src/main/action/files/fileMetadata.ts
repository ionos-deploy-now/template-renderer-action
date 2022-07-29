import fs from 'fs';

export class FileMetadata {
  constructor(readonly mode: number, readonly gid: number, readonly uid: number) {}

  static of(stats: fs.Stats): FileMetadata {
    return new FileMetadata(stats.mode, stats.gid, stats.uid);
  }
}
