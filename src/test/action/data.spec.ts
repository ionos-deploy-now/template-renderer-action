import { beforeEach, describe } from 'mocha';
import * as sinon from 'sinon';
import { expect } from 'chai';
import * as core from '@actions/core';
import Data from '../../main/action/input/data';

describe('Test data extraction from input', () => {
  let getInput;

  beforeEach(() => {
    getInput = sinon.stub();
    sinon.replace(core, 'getInput', getInput);
  });

  afterEach(() => {
    sinon.restore();
  });

  it('Get data for supplied deployment-id', () => {
    getInput.returns(`{
    "IONOS_DEPLOYMENT_ff3f20ab_5cd4_49c8_8424_fef76d766229_DB_USER": "db-user",
    "IONOS_DEPLOYMENT_ff3f20ab_5cd4_49c8_8424_fef76d766229_DB_PASSWORD": "db-password",
    "IONOS_DEPLOYMENT_b486c8a2_501f_48b5_b1bf_2c3c75ccaf87_DB_USER": "db-user-2",
    "IONOS_DEPLOYMENT_b486c8a2_501f_48b5_b1bf_2c3c75ccaf87_DB_PASSWORD": "db-password-2",
    "IONOS_MAIL_USER": "mail-user",
    "IONOS_MAIL_PASSWORD": "mail-password"
    }`);

    const data = Data.fromInput('ff3f20ab-5cd4-49c8-8424-fef76d766229');

    expect(data).to.deep.equal(
      new Map<string, string>([
        ['IONOS_DB_USER', 'db-user'],
        ['IONOS_DB_PASSWORD', 'db-password'],
        ['IONOS_MAIL_USER', 'mail-user'],
        ['IONOS_MAIL_PASSWORD', 'mail-password'],
      ]),
    );
  });

  it('Show error, if data was empty', () => {
    getInput.returns('');

    expect(() => Data.fromInput('ff3f20ab-5cd4-49c8-8424-fef76d766229')).to.throw(
      'Property "data" was not supplied properly. Please add "data: \'[ ${{ toJson(secrets) }}, ${{ steps.deployment.outputs.template-variables }} ]\'" to the "with" section of this action.',
    );
  });

  it('Use only common values when no deployment-id is provided', () => {
    getInput.returns(`{
    "IONOS_DEPLOYMENT_ff3f20ab_5cd4_49c8_8424_fef76d766229_DB_USER": "db-user",
    "IONOS_DEPLOYMENT_ff3f20ab_5cd4_49c8_8424_fef76d766229_DB_PASSWORD": "db-password",
    "IONOS_DEPLOYMENT_b486c8a2_501f_48b5_b1bf_2c3c75ccaf87_DB_USER": "db-user-2",
    "IONOS_DEPLOYMENT_b486c8a2_501f_48b5_b1bf_2c3c75ccaf87_DB_PASSWORD": "db-password-2",
    "IONOS_MAIL_USER": "mail-user",
    "IONOS_MAIL_PASSWORD": "mail-password"
    }`);

    const data = Data.fromInput(null);

    expect(data).to.deep.equal(
      new Map<string, string>([
        ['IONOS_MAIL_USER', 'mail-user'],
        ['IONOS_MAIL_PASSWORD', 'mail-password'],
      ]),
    );
  });

  it('Mixed upper and lower case names', () => {
    getInput.returns(`{
    "IONOS_deployment_ff3f20ab_5cd4_49c8_8424_fef76d766229_DB_USER": "db-user",
    "IONOS_DEPLOYMENT_ff3f20ab_5cd4_49c8_8424_fef76d766229_db_password": "db-password",
    "IONOS_DEPLOYMENT_b486c8a2_501f_48b5_b1bf_2c3c75ccaf87_DB_USER": "db-user-2",
    "ionos_deployment_b486c8a2_501f_48b5_b1bf_2c3c75ccaf87_DB_PASSWORD": "db-password-2",
    "IONOS_MAIL_USER": "mail-user",
    "IONOS_mail_PASSWORD": "mail-password"
    }`);

    const data = Data.fromInput('ff3f20ab-5cd4-49c8-8424-fef76d766229');

    expect(data).to.deep.equal(
      new Map<string, string>([
        ['IONOS_DB_USER', 'db-user'],
        ['IONOS_DB_PASSWORD', 'db-password'],
        ['IONOS_MAIL_USER', 'mail-user'],
        ['IONOS_MAIL_PASSWORD', 'mail-password'],
      ]),
    );
  });

  it('Get data form array', () => {
    getInput.returns(`[{
    "IONOS_DEPLOYMENT_ff3f20ab_5cd4_49c8_8424_fef76d766229_DB_USER": "db-user",
    "IONOS_DEPLOYMENT_ff3f20ab_5cd4_49c8_8424_fef76d766229_DB_PASSWORD": "db-password",
    "IONOS_DEPLOYMENT_b486c8a2_501f_48b5_b1bf_2c3c75ccaf87_DB_USER": "db-user-2",
    "IONOS_DEPLOYMENT_b486c8a2_501f_48b5_b1bf_2c3c75ccaf87_DB_PASSWORD": "db-password-2",
    "IONOS_MAIL_USER": "mail-user",
    "IONOS_MAIL_PASSWORD": "mail-password"
    },
    {
    "APP_URL": "app-url"
    }]`);

    const data = Data.fromInput('ff3f20ab-5cd4-49c8-8424-fef76d766229');

    expect(data).to.deep.equal(
      new Map<string, string>([
        ['IONOS_DB_USER', 'db-user'],
        ['IONOS_DB_PASSWORD', 'db-password'],
        ['IONOS_MAIL_USER', 'mail-user'],
        ['IONOS_MAIL_PASSWORD', 'mail-password'],
        ['APP_URL', 'app-url'],
      ]),
    );
  });
});
