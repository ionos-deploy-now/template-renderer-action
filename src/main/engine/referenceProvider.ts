import { ReferenceValue } from './literal';
import * as uuid from 'uuid';

export default class ReferenceProvider {
  private _createdReferences = new Map<string, ReferenceValue>();

  constructor(
    readonly existingReferences: Map<string, ReferenceValue>,
    private keySupplier: (originalValue: string) => string = uuid.v4(),
  ) {}

  createKeyReference(value: string): string {
    const reference = this.keySupplier(value);
    this._createdReferences.set(reference, { key: value });
    return reference;
  }

  createExpressionReference(value: string): string {
    const reference = this.keySupplier(value);
    this._createdReferences.set(reference, { expression: value });
    return reference;
  }

  get createdReferences(): Map<string, ReferenceValue> {
    return this._createdReferences;
  }

  get knownReferences(): Map<string, ReferenceValue> {
    const all = new Map<string, ReferenceValue>();
    this.existingReferences.forEach((value, key) => all.set(key, value));
    this._createdReferences.forEach((value, key) => all.set(key, value));
    return all;
  }
}
