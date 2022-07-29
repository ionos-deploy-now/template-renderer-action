import * as uuid from 'uuid';

export function generateContextSensitiveReference(value: string): string {
  if (value.endsWith('_URL')) {
    return 'https://' + uuid.v4();
  } else if (value.endsWith('_PORT')) {
    return Math.floor(Math.random() * (65536 - 49152) + 49152).toString();
  }
  return uuid.v4();
}
