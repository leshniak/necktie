export interface Callback {
    (node?: Node): void | ((destroyedNode?: Node) => void);
}
