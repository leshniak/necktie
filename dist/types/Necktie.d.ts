import { Bindable } from './Bindable';
import { Callback } from './Callback';
export declare class Necktie {
    private readonly _window;
    private readonly _document;
    private readonly _selectorsToCallbacks;
    private readonly _nodesToBinds;
    private readonly _dummyFragment;
    private _areAttributesObserved;
    private _isListening;
    constructor(_window?: Window & typeof globalThis, _document?: Document);
    bind(selector: string, callback: Callback): this;
    bindClass(selector: string, Bindable: Bindable): this;
    observeAttributes(isEnabled?: boolean): this;
    startListening(): this;
    private _isSelectorValid;
    private _bindNodes;
    private _unbindNodes;
    private _rebindNode;
    private _bindToDOM;
}
