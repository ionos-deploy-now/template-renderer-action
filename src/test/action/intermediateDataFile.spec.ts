import { beforeEach, describe } from 'mocha';
import * as sinon from 'sinon';
import { expect } from 'chai';
import fs from 'fs';
import { IntermediateDataFile } from '../../main/action/files/intermediateDataFile';
import { ReferenceValue } from '../../main/engine/literal';

describe('Test interactions with intermediate data file', () => {
  let mkdirSync, existsSync, readFileSync, writeFileSync;

  beforeEach(() => {
    mkdirSync = sinon.stub();
    sinon.replace(fs, 'mkdirSync', mkdirSync);
    existsSync = sinon.stub();
    sinon.replace(fs, 'existsSync', existsSync);
    readFileSync = sinon.stub();
    sinon.replace(fs, 'readFileSync', readFileSync);
    writeFileSync = sinon.stub();
    sinon.replace(fs, 'writeFileSync', writeFileSync);
  });

  afterEach(() => {
    sinon.restore();
  });

  it('Read from file', () => {
    existsSync.withArgs('out/intermediate.json').returns(true);
    readFileSync.withArgs('out/intermediate.json').returns(`{
    "createdFiles": [".env", "subFolder/config.yaml"],
    "references": {
     "b486c8a2-501f-48b5-b1bf-2c3c75ccaf87": "ABC",
     "https://ff3f20ab-5cd4-49c8-8424-fef76d766229": "BCD",
     "50000": "CDE" 
     }
    }`);

    const intermediateDataFile = IntermediateDataFile.readOrDefault('out/intermediate.json');

    expect(intermediateDataFile.content.createdFiles).to.have.length(2);
    expect(intermediateDataFile.content.createdFiles[0]).to.equal('.env');
    expect(intermediateDataFile.content.createdFiles[1]).to.equal('subFolder/config.yaml');

    expect(Object.keys(intermediateDataFile.content.references)).to.have.length(3);
    expect(intermediateDataFile.content.references).includes.keys('b486c8a2-501f-48b5-b1bf-2c3c75ccaf87');
    expect(intermediateDataFile.content.references['b486c8a2-501f-48b5-b1bf-2c3c75ccaf87']).to.equal('ABC');
    expect(intermediateDataFile.content.references).includes.keys('https://ff3f20ab-5cd4-49c8-8424-fef76d766229');
    expect(intermediateDataFile.content.references['https://ff3f20ab-5cd4-49c8-8424-fef76d766229']).to.equal('BCD');
    expect(intermediateDataFile.content.references).includes.keys('50000');
    expect(intermediateDataFile.content.references['50000']).to.equal('CDE');
  });

  it('Use empty config when file does not exist', () => {
    existsSync.withArgs('out/intermediate.json').returns(false);

    const intermediateDataFile = IntermediateDataFile.readOrDefault('out/intermediate.json');

    expect(intermediateDataFile.content.createdFiles).to.have.length(0);
    expect(Object.keys(intermediateDataFile.content.references)).to.have.length(0);
  });

  it('Use empty config when no path was provided', () => {
    const intermediateDataFile = IntermediateDataFile.readOrDefault(null);

    expect(intermediateDataFile.content.createdFiles).to.have.length(0);
    expect(Object.keys(intermediateDataFile.content.references)).to.have.length(0);
  });

  it('Save to file', () => {
    new IntermediateDataFile({
      createdFiles: ['.env', 'subFolder/config.yaml'],
      references: {
        'b486c8a2-501f-48b5-b1bf-2c3c75ccaf87': { key: 'ABC' },
        'https://ff3f20ab-5cd4-49c8-8424-fef76d766229': { key: 'BCD' },
        '50000': { key: 'CDE' },
      },
    }).save('out/intermediate.json');

    expect(mkdirSync.calledWith('out', { recursive: true })).to.be.true;
    const expected =
      '{"createdFiles":[".env","subFolder/config.yaml"],"references":{"50000":{"key":"CDE"},"b486c8a2-501f-48b5-b1bf-2c3c75ccaf87":{"key":"ABC"},"https://ff3f20ab-5cd4-49c8-8424-fef76d766229":{"key":"BCD"}}}';
    expect(writeFileSync.calledWith('out/intermediate.json', expected)).to.be.true;
  });

  it('Get references map', () => {
    const intermediateDataFile = new IntermediateDataFile({
      createdFiles: ['.env', 'subFolder/config.yaml'],
      references: {
        'b486c8a2-501f-48b5-b1bf-2c3c75ccaf87': { key: 'ABC' },
        'https://ff3f20ab-5cd4-49c8-8424-fef76d766229': { key: 'BCD' },
        '50000': { key: 'CDE' },
      },
    });

    expect(intermediateDataFile.getReferencesMap()).to.deep.equal(
      new Map<string, ReferenceValue>([
        ['b486c8a2-501f-48b5-b1bf-2c3c75ccaf87', { key: 'ABC' }],
        ['https://ff3f20ab-5cd4-49c8-8424-fef76d766229', { key: 'BCD' }],
        ['50000', { key: 'CDE' }],
      ]),
    );
  });
});
