export default class ReferenceSupplier {
  private _usedReferences = new Map<string, string>();

  constructor(private supplierAction: (originalValue: string) => string) {}

  createNewReference(value: string): string {
    const reference = this.supplierAction(value);
    this._usedReferences.set(reference, value);
    return reference;
  }

  get usedReferences(): Map<string, string> {
    return this._usedReferences;
  }
}
