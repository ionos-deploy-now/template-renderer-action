import { beforeEach, describe } from 'mocha';
import * as sinon from 'sinon';
import { expect } from 'chai';
import { Directory } from '../../main/action/files/directory';
import fs from 'fs';

describe('Test file and directory handling', () => {
  let readdirSync, lstatSync, mkdirSync, chownSync, readFileSync, writeFileSync, existsSync;

  beforeEach(() => {
    readdirSync = sinon.stub();
    sinon.replace(fs, 'readdirSync', readdirSync);
    lstatSync = sinon.stub();
    sinon.replace(fs, 'lstatSync', lstatSync);
    mkdirSync = sinon.stub();
    sinon.replace(fs, 'mkdirSync', mkdirSync);
    chownSync = sinon.stub();
    sinon.replace(fs, 'chownSync', chownSync);
    readFileSync = sinon.stub();
    sinon.replace(fs, 'readFileSync', readFileSync);
    writeFileSync = sinon.stub();
    sinon.replace(fs, 'writeFileSync', writeFileSync);
    existsSync = sinon.stub();
    sinon.replace(fs, 'existsSync', existsSync);
  });

  afterEach(() => {
    sinon.restore();
  });

  it('Load template files from directory', () => {
    readdirSync.withArgs('config').returns(['.env.template', 'subFolder']);
    readdirSync.withArgs('config/subFolder').returns(['config.yaml.template']);
    readFileSync.withArgs('config/.env.template').returns('Template');
    readFileSync.withArgs('config/subFolder/config.yaml.template').returns('Template');
    lstatSync.withArgs('config').returns(new DirectoryStats());
    lstatSync.withArgs('config/subFolder').returns(new DirectoryStats());
    lstatSync.withArgs('config/.env.template').returns(new FileStats());
    lstatSync.withArgs('config/subFolder/config.yaml.template').returns(new FileStats());

    const directory = Directory.openFromRepo('config', '.template');

    expect(directory.relativePath).to.equal('');
    expect(directory.directories).to.have.length(1);
    expect(directory.templateFiles).to.have.length(1);
    expect(directory.getAllTemplateFiles()).to.have.length(2);

    expect(directory.directories[0].relativePath).to.equal('subFolder');
    expect(directory.directories[0].directories).to.have.length(0);
    expect(directory.directories[0].templateFiles).to.have.length(1);

    expect(directory.templateFiles[0].relativePath).to.equal('.env');
    expect(directory.templateFiles[0].content).to.equal('Template');

    expect(directory.directories[0].templateFiles[0].relativePath).to.equal('subFolder/config.yaml');
    expect(directory.directories[0].templateFiles[0].content).to.equal('Template');
  });

  it('Create directory tree at output location', () => {
    readdirSync.withArgs('config').returns(['.env.template', 'subFolder1', 'subFolder2']);
    readdirSync.withArgs('config/subFolder1').returns(['config.yaml']);
    readdirSync.withArgs('config/subFolder2').returns(['config.yaml.template']);
    readFileSync.withArgs('config/.env.template').returns('Template');
    readFileSync.withArgs('config/subFolder2/config.yaml.template').returns('Template');
    lstatSync.withArgs('config').returns(new DirectoryStats());
    lstatSync.withArgs('config/subFolder1').returns(new DirectoryStats());
    lstatSync.withArgs('config/subFolder2').returns(new DirectoryStats());
    lstatSync.withArgs('config/.env.template').returns(new FileStats());
    lstatSync.withArgs('config/subFolder1/config.yaml').returns(new FileStats());
    lstatSync.withArgs('config/subFolder2/config.yaml.template').returns(new FileStats());
    existsSync.withArgs('out').returns(false);
    existsSync.withArgs('out/subFolder1').returns(false);
    existsSync.withArgs('out/subFolder2').returns(false);

    Directory.openFromRepo('config', '.template').processTemplateFiles((content) => 'Rendered ' + content, {
      outputDirectory: 'out',
      copyDirectories: true,
      mode: 'create',
    });

    expect(mkdirSync.calledWith('out', { mode: 0, recursive: true })).to.be.true;
    expect(chownSync.calledWith('out', 0, 0)).to.be.true;
    expect(mkdirSync.calledWith('out/subFolder1', { mode: 0, recursive: false })).to.be.false;
    expect(chownSync.calledWith('out/subFolder1', 0, 0)).to.be.false;
    expect(mkdirSync.calledWith('out/subFolder2', { mode: 0, recursive: false })).to.be.true;
    expect(chownSync.calledWith('out/subFolder2', 0, 0)).to.be.true;
  });

  it('Save rendered templates at output location', () => {
    readdirSync.withArgs('config').returns(['.env.template', 'subFolder1', 'subFolder2']);
    readdirSync.withArgs('config/subFolder1').returns(['config.yaml']);
    readdirSync.withArgs('config/subFolder2').returns(['config.yaml.template']);
    readFileSync.withArgs('config/.env.template').returns('Template');
    readFileSync.withArgs('config/subFolder2/config.yaml.template').returns('Template');
    lstatSync.withArgs('config').returns(new DirectoryStats());
    lstatSync.withArgs('config/subFolder1').returns(new DirectoryStats());
    lstatSync.withArgs('config/subFolder2').returns(new DirectoryStats());
    lstatSync.withArgs('config/.env.template').returns(new FileStats());
    lstatSync.withArgs('config/subFolder1/config.yaml').returns(new FileStats());
    lstatSync.withArgs('config/subFolder2/config.yaml.template').returns(new FileStats());

    Directory.openFromRepo('config', '.template').processTemplateFiles((content) => 'Rendered ' + content, {
      outputDirectory: 'out',
      copyDirectories: false,
      mode: 'create',
    });

    expect(writeFileSync.calledWith('out/.env', 'Rendered Template', { mode: 0 })).to.be.true;
    expect(chownSync.calledWith('out/.env', 0, 0)).to.be.true;
    expect(writeFileSync.calledWith('out/subFolder1/config.yaml')).to.be.false;
    expect(chownSync.calledWith('out/subFolder1/config.yaml')).to.be.false;
    expect(writeFileSync.calledWith('out/subFolder2/config.yaml', 'Rendered Template', { mode: 0 })).to.be.true;
    expect(chownSync.calledWith('out/subFolder2/config.yaml', 0, 0)).to.be.true;
  });

  it('Update prepared templates at output location', () => {
    readdirSync.withArgs('config').returns(['.env.template', 'subFolder1', 'subFolder2']);
    readdirSync.withArgs('config/subFolder1').returns(['config.yaml']);
    readdirSync.withArgs('config/subFolder2').returns(['config.yaml.template']);
    readFileSync.withArgs('config/.env.template').returns('Template');
    readFileSync.withArgs('config/subFolder2/config.yaml.template').returns('Template');
    lstatSync.withArgs('config').returns(new DirectoryStats());
    lstatSync.withArgs('config/subFolder1').returns(new DirectoryStats());
    lstatSync.withArgs('config/subFolder2').returns(new DirectoryStats());
    lstatSync.withArgs('config/.env.template').returns(new FileStats());
    lstatSync.withArgs('config/subFolder1/config.yaml').returns(new FileStats());
    lstatSync.withArgs('config/subFolder2/config.yaml.template').returns(new FileStats());

    Directory.openFromRepo('config', '.template').processTemplateFiles((content) => 'Rendered ' + content, {
      outputDirectory: 'out',
      copyDirectories: false,
      mode: 'update',
    });

    expect(writeFileSync.calledWith('out/.env', 'Rendered Template')).to.be.true;
    expect(writeFileSync.calledWith('out/subFolder1/config.yaml')).to.be.false;
    expect(writeFileSync.calledWith('out/subFolder2/config.yaml', 'Rendered Template')).to.be.true;
  });
});

class DirectoryStats extends fs.Stats {
  constructor() {
    super();
    this.mode = 0;
    this.gid = 0;
    this.uid = 0;
  }

  override isDirectory(): boolean {
    return true;
  }

  override isFile(): boolean {
    return false;
  }
}

class FileStats extends fs.Stats {
  constructor() {
    super();
    this.mode = 0;
    this.gid = 0;
    this.uid = 0;
  }

  override isDirectory(): boolean {
    return false;
  }

  override isFile(): boolean {
    return true;
  }
}
