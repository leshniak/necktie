import { Callback } from '@lib/Callback';
export declare class Binding {
    private readonly _selector;
    private readonly _callback;
    private readonly _unbindCallback;
    constructor(selector: string, bindCallback: Callback, unbindCallback: ReturnType<Callback>);
    hasSameCallback(callback: Callback): boolean;
    match(element: Element): boolean;
    destroy(element: Element): void;
}
