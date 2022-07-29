import { beforeEach, describe } from 'mocha';
import * as sinon from 'sinon';
import chia, { expect, assert } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import Data from '../../main/action/input/data';
import fs from 'fs';
import * as core from '@actions/core';
import * as referenceGenerator from '../../main/action/referenceGenerator';
import { renderTemplates } from '../../main/action';

const testDir = './src/test/action/resources';
const tempDir = './tmp';

describe('Test main action function', () => {
  before(() => {
    chia.should();
    chia.use(chaiAsPromised);
  });

  beforeEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true });
    }
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true });
    sinon.restore();
  });

  it('Render in one step', async () => {
    withData(
      new Map([
        ['IONOS_MAIL_USER', 'mail-user'],
        ['IONOS_MAIL_PASSWORD', 'mail-password'],
        ['IONOS_DB_USER', 'db-user'],
        ['IONOS_DB_PASSWORD', 'db-password'],
      ])
    );

    await renderTemplates({
      deploymentId: null,
      inputDirectory: testDir + '/project-1/.deploy-now',
      intermediateDataFile: null,
      outputDirectory: tempDir + '/project-1',
      templateExtension: '.template',
      useContextSensitiveReferences: true,
    });

    expect(tempFile('project-1/.env')).to.equal(testFile('result-1/.env'));
  });

  it('Prepare for second step', async () => {
    withFixedReferences(
      '030662b7-d260-4c51-855f-19847ec9ac36',
      '14588eb2-e5e0-42a9-a4fd-7e9a5a0c435a',
      'caf2ba9d-de63-4b31-b3fa-7b69a5158988',
      '9acd4997-c4b6-44fe-b7be-17f7d9e33881'
    );

    await renderTemplates({
      deploymentId: null,
      inputDirectory: testDir + '/project-1/.deploy-now',
      intermediateDataFile: tempDir + '/project-1/intermediate.json',
      outputDirectory: tempDir + '/project-1/deployment',
      templateExtension: '.template',
      useContextSensitiveReferences: true,
    });

    expect(tempFile('project-1/deployment/.env')).to.equal(testFile('result-2/.env'));
    expect(tempFile('project-1/intermediate.json')).to.equal(testFile('result-2/intermediate.json'));
  });

  it('Complete templating', async () => {
    fs.mkdirSync(tempDir + '/project-2/deployment', { recursive: true });
    fs.cpSync(testDir + '/project-2/deployment', tempDir + '/project-2/deployment', { recursive: true });

    withData(
      new Map([
        ['IONOS_MAIL_USER', 'mail-user'],
        ['IONOS_MAIL_PASSWORD', 'mail-password'],
        ['IONOS_DB_USER', 'db-user'],
        ['IONOS_DB_PASSWORD', 'db-password'],
      ])
    );

    await renderTemplates({
      deploymentId: '29ed115b-0e7e-4f27-89b0-50c6436d7d5e',
      inputDirectory: tempDir + '/project-2/deployment',
      intermediateDataFile: testDir + '/project-2/deployment/intermediate.json',
      outputDirectory: tempDir + '/project-2/deployment',
      templateExtension: '.template',
      useContextSensitiveReferences: true,
    });

    expect(tempFile('project-2/deployment/.env')).to.equal(testFile('result-1/.env'));
  });

  it('Test prepare and complete', async () => {
    withFixedReferences(
      '030662b7-d260-4c51-855f-19847ec9ac36',
      '14588eb2-e5e0-42a9-a4fd-7e9a5a0c435a',
      'caf2ba9d-de63-4b31-b3fa-7b69a5158988',
      '9acd4997-c4b6-44fe-b7be-17f7d9e33881'
    );

    await renderTemplates({
      deploymentId: null,
      inputDirectory: testDir + '/project-1/.deploy-now',
      intermediateDataFile: tempDir + '/project-1/intermediate.json',
      outputDirectory: tempDir + '/project-1/deployment',
      templateExtension: '.template',
      useContextSensitiveReferences: true,
    });

    expect(tempFile('project-1/intermediate.json')).to.equal(testFile('result-2/intermediate.json'));

    withDataInput({
      IONOS_MAIL_USER: 'mail-user',
      IONOS_MAIL_PASSWORD: 'mail-password',
      IONOS_DEPLOYMENT_29ed115b_0e7e_4f27_89b0_50c6436d7d5e_DB_USER: 'db-user',
      IONOS_DEPLOYMENT_29ed115b_0e7e_4f27_89b0_50c6436d7d5e_DB_PASSWORD: 'db-password',
      IONOS_DEPLOYMENT_6f58389a_ab90_4070_a2fe_b19d1a8a8e12_DB_USER: 'db-user-2',
      IONOS_DEPLOYMENT_6f58389a_ab90_4070_a2fe_b19d1a8a8e12_DB_PASSWORD: 'db-password-2',
    });

    await renderTemplates({
      deploymentId: '29ed115b-0e7e-4f27-89b0-50c6436d7d5e',
      inputDirectory: tempDir + '/project-1/deployment',
      intermediateDataFile: tempDir + '/project-1/intermediate.json',
      outputDirectory: tempDir + '/project-1/deployment',
      templateExtension: '.template',
      useContextSensitiveReferences: true,
    });

    expect(tempFile('project-1/deployment/.env')).to.equal(testFile('result-1/.env'));
  });

  it('Test invalid input', async () => {
    await renderTemplates({
      deploymentId: '29ed115b-0e7e-4f27-89b0-50c6436d7d5e',
      inputDirectory: tempDir + '/project-2/deployment',
      intermediateDataFile: null,
      outputDirectory: tempDir + '/project-2/deployment',
      templateExtension: '.template',
      useContextSensitiveReferences: true,
    }).should.be.rejectedWith(
      'At least one of the input properties "data" and "intermediate-data-file" need to be supplied. Additionally you could supply a "deployment-id" to use deployment specific values'
    );
  });

  it('Test invalid input-directory and output-directory for template completion', async () => {
    withData(new Map<string, string>());

    await renderTemplates({
      deploymentId: '29ed115b-0e7e-4f27-89b0-50c6436d7d5e',
      inputDirectory: tempDir + '/project-1/deployment',
      intermediateDataFile: testDir + '/project-2/intermediate.json',
      outputDirectory: tempDir + '/project-2/deployment',
      templateExtension: '.template',
      useContextSensitiveReferences: true,
    }).should.be.rejectedWith(
      '"input-directory" and "output-directory" should be the same when completing the templating'
    );
  });

  it('Test full action', async () => {
    await renderTemplates({
      deploymentId: null,
      inputDirectory: testDir + '/project-3/.deploy-now',
      intermediateDataFile: tempDir + '/project-3/intermediate.json',
      outputDirectory: tempDir + '/project-3/deployment',
      templateExtension: '.template',
      useContextSensitiveReferences: true,
    });

    withDataInput({
      IONOS_MAIL_USER: 'mail-user',
      IONOS_MAIL_PASSWORD: 'mail-password',
      ionos_mail_url: 'smpt://mail.com',
      ionos_mail_port: '1234',
      IONOS_DEPLOYMENT_29ed115b_0e7e_4f27_89b0_50c6436d7d5e_DB_USER: 'db-user',
      IONOS_DEPLOYMENT_29ed115b_0e7e_4f27_89b0_50c6436d7d5e_DB_PASSWORD: 'db-password',
      IONOS_DEPLOYMENT_29ed115b_0e7e_4f27_89b0_50c6436d7d5e_DB_URL: 'db://host.com',
      IONOS_DEPLOYMENT_29ed115b_0e7e_4f27_89b0_50c6436d7d5e_DB_PORT: '4567',
      IONOS_DEPLOYMENT_6f58389a_ab90_4070_a2fe_b19d1a8a8e12_DB_USER: 'db-user-2',
      IONOS_DEPLOYMENT_6f58389a_ab90_4070_a2fe_b19d1a8a8e12_DB_PASSWORD: 'db-password-2',
      IONOS_DEPLOYMENT_6f58389a_ab90_4070_a2fe_b19d1a8a8e12_DB_URL: 'db://host.com',
      IONOS_DEPLOYMENT_6f58389a_ab90_4070_a2fe_b19d1a8a8e12_DB_PORT: '4567',
      secret_1: 'secure',
      SECRET_2: 'also secure',
    });

    await renderTemplates({
      deploymentId: '29ed115b-0e7e-4f27-89b0-50c6436d7d5e',
      inputDirectory: tempDir + '/project-3/deployment',
      intermediateDataFile: tempDir + '/project-3/intermediate.json',
      outputDirectory: tempDir + '/project-3/deployment',
      templateExtension: '.template',
      useContextSensitiveReferences: true,
    });

    expect(tempFile('project-3/deployment/.env')).to.equal(testFile('result-3/.env'));
    expect(tempFile('project-3/deployment/config/app.yaml')).to.equal(testFile('result-3/app.yaml'));

    const intermediate = JSON.parse(tempFile('project-3/intermediate.json'));
    const references = Object.keys(intermediate.references);
    expect(references.some((reference) => reference.startsWith('https://'))).to.be.true;
    expect(references.some((reference) => !isNaN(Number(reference)))).to.be.true;
  });
});

function withData(data: Map<string, string>) {
  sinon.replace(Data, 'isSet', () => true);
  sinon.replace(Data, 'fromInput', () => data);
}

function withDataInput(data: { [key: string]: string }) {
  sinon.replace(core, 'getInput', sinon.stub().withArgs('data').returns(JSON.stringify(data)));
}

function withFixedReferences(...references: string[]) {
  const reverseReferences = references.reverse();
  sinon.replace(
    referenceGenerator,
    'generateContextSensitiveReference',
    () => reverseReferences.pop() || assert.fail('More references used than expected')
  );
}

function testFile(path: string): string {
  return fs.readFileSync(testDir + '/' + path, { encoding: 'utf8', flag: 'r' });
}

function tempFile(path: string): string {
  return fs.readFileSync(tempDir + '/' + path, { encoding: 'utf8', flag: 'r' });
}
