export interface Bindable {
  new(node?: Node): this;
  destroy(node?: Node): void;
}
