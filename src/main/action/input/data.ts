import * as core from '@actions/core';
import { NIL as NIL_UUID } from 'uuid';

export default class Data extends Map<string, string> {
  static isSet(): boolean {
    return core.getInput('data') !== '';
  }

  static fromInput(deploymentId: string | null): Data {
    const inputData = this.parseData(core.getInput('data'));

    const deploymentPrefix = 'IONOS_DEPLOYMENT_' + (deploymentId || NIL_UUID).replace(/-/g, '_').toUpperCase() + '_';
    const resultData = new Data();

    Object.keys(inputData)
      .filter((key) => key.toUpperCase().startsWith(deploymentPrefix))
      .forEach((key) => resultData.set(key.toUpperCase().replace(deploymentPrefix, 'IONOS_'), inputData[key]));

    Object.keys(inputData)
      .filter((key) => !key.toUpperCase().includes('IONOS_DEPLOYMENT_'))
      .filter((key) => key != 'github_token')
      .forEach((key) => {
        if (!resultData.has(key.toUpperCase())) {
          resultData.set(key.toUpperCase(), inputData[key]);
        }
      });

    return resultData;
  }

  private static parseData(input: string): Record<string, string> {
    try {
      const data = JSON.parse(input);
      if (Array.isArray(data)) {
        return data.reduce((result, current) => ({ ...current, ...result }), {});
      }
      return data;
    } catch (e) {
      throw new Error(
        'Property "data" was not supplied properly. Please add "data: \'[ ${{ toJson(secrets) }}, ${{ steps.deployment.outputs.template-variables }} ]\'" to the "with" section of this action.'
      );
    }
  }
}
