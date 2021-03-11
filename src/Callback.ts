export interface Callback {
  (element?: Element): void | ((removedElement?: Element) => void);
}
