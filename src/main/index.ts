import { renderTemplates } from './action';
import Action from '@ionos-deploy-now/actions-core';
import Configuration from './action/input/types';

Action.run<Configuration, Record<string, never>>(
  renderTemplates,
  (input) =>
    <Configuration>{
      deploymentId: input.optional('deployment-id'),
      inputDirectory: input.required('input-directory'),
      outputDirectory: input.required('output-directory'),
      intermediateDataFile: input.optional('intermediate-data-file'),
      templateExtension: input.required('template-extension'),
      useContextSensitiveReferences: input.required('use-context-sensitive-references') === 'true',
    },
);
