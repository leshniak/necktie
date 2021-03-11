export interface Bindable {
    new (element?: Element): this;
    destroy(element?: Element): void;
}
