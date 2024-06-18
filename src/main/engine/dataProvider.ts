export default class DataProvider {
  constructor(
    private readonly data: Map<string, string> | undefined = undefined,
    private readonly defaultAction: (key: string) => string = (key) => '$' + key,
  ) {}

  has(key: string): boolean {
    return this.data?.has(key) ?? false;
  }

  get(key: string): string {
    if (this.data == undefined) {
      return this.defaultAction(key);
    }
    return this.data.get(key) ?? this.defaultAction(key);
  }
}
