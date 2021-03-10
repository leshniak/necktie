import { Callback } from './Callback';

export class Binding {
  private readonly _selector: string;
  private readonly _callback: Callback;
  private readonly _unbindCallback: ReturnType<Callback>;

  public constructor(selector: string, bindCallback: Callback, unbindCallback: ReturnType<Callback>) {
    this._selector = selector;
    this._callback = bindCallback;
    this._unbindCallback = unbindCallback;
  }

  public hasSameCallback(callback: Callback) {
    return this._callback === callback;
  }

  public match(node: Node) {
    return (node as HTMLElement).matches(this._selector);
  }

  public destroy(node: Node) {
    if (typeof this._unbindCallback === 'function') {
      this._unbindCallback(node);
    }
  }
}
