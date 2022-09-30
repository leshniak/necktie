import { Bindable } from '@lib/Bindable';
import { Binding } from '@lib/Binding';
import { Callback } from '@lib/Callback';

export class Necktie {
  private readonly _parent: ParentNode;
  private readonly _window: Window;
  private readonly _document: Document;
  private readonly _selectorsToCallbacks: Map<string, Set<Callback>>;
  private readonly _nodesToBinds: Map<Node, Array<Binding>>;
  private readonly _dummyFragment: DocumentFragment;
  private _mutationObserver: MutationObserver;
  private _areAttributesObserved: boolean;
  private _isListening: boolean;

  public constructor(parent: ParentNode = document, _window = window, _document = document) {
    this._parent = parent;
    this._window = _window;
    this._document = _document;
    this._selectorsToCallbacks = new Map();
    this._nodesToBinds = new Map();
    this._dummyFragment = this._document.createDocumentFragment();
    this._areAttributesObserved = false;
    this._isListening = false;

    this._mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        switch (mutation.type) {
          case 'attributes':
            this._rebindNode(mutation.target);
            break;
          case 'childList':
            this._unbindNodes(mutation.removedNodes);
            this._bindNodes(mutation.addedNodes);
            break;
        }
      });
    });
  }

  public bind(selector: string, callback: Callback) {
    if (!this._isSelectorValid(selector)) {
      throw new Error('Invalid selector');
    }

    if (typeof callback !== 'function') {
      throw new Error('Callback parameter has to be a function');
    }

    if (!this._selectorsToCallbacks.has(selector)) {
      this._selectorsToCallbacks.set(selector, new Set());
    }

    if (this._selectorsToCallbacks.get(selector)!.has(callback)) {
      throw new Error('Callback already registered');
    }

    this._selectorsToCallbacks.get(selector)!.add(callback);

    if (this._isListening) {
      this._parent.querySelectorAll(selector).forEach((node) => {
        if (!this._nodesToBinds.has(node)) {
          this._nodesToBinds.set(node, []);
        }

        this._nodesToBinds.get(node)!.push(new Binding(selector, callback, callback(node)));
      });
    }

    return this;
  }

  public bindClass(selector: string, Bindable: Bindable) {
    return this.bind(selector, (element) => {
      const bindable = new Bindable(element);

      return (removedElement) => {
        bindable.destroy(removedElement);
      };
    });
  }

  public observeAttributes(isEnabled = true) {
    if (this._isListening) {
      throw new Error('Cannot change observing mode once started');
    }

    this._areAttributesObserved = isEnabled;

    return this;
  }

  public startListening() {
    this._bindToDOM();
    this._isListening = true;

    return this;
  }

  public stopListening() {
    this._window.removeEventListener('unload', this._onDocumentUnload);
    this._mutationObserver.disconnect();
    this._isListening = false;

    return this;
  }

  private _isSelectorValid(selector: string) {
    try {
      this._dummyFragment.querySelector(selector);
      return true;
    } catch (error) {
      return false;
    }
  }

  private _bindNodes(nodes: NodeList) {
    nodes.forEach((node) => {
      if (node.nodeType !== Node.ELEMENT_NODE) {
        return;
      }

      const binds: Array<Binding> = [];

      for (const [selector, callbacks] of this._selectorsToCallbacks.entries()) {
        const isMatch = (node as Element).matches(selector);

        if (!isMatch) {
          continue;
        }

        for (const callback of callbacks.values()) {
          binds.push(new Binding(selector, callback, callback(node as Element)));
        }
      }

      if (binds.length) {
        this._nodesToBinds.set(node, binds);
      }
    });
  }

  private _unbindNodes(nodes: NodeList) {
    nodes.forEach((node) => {
      if (node.nodeType !== Node.ELEMENT_NODE) {
        return;
      }

      for (const [bindedNode, binds] of this._nodesToBinds.entries()) {
        if (node.contains(bindedNode)) {
          binds.forEach((binding) => binding.destroy(node as Element));
          this._nodesToBinds.delete(bindedNode);
        }
      }
    });
  }

  private _rebindNode(node: Node) {
    if (node.nodeType !== Node.ELEMENT_NODE) {
      return;
    }

    const binds = this._nodesToBinds.get(node) || [];

    const matchedBinds = binds.filter((binding) => binding.match(node as Element));
    const unmatchedBinds = binds.filter((binding) => !binding.match(node as Element));

    unmatchedBinds.forEach((binding) => binding.destroy(node as Element));

    for (const [selector, callbacks] of this._selectorsToCallbacks.entries()) {
      const isMatch = (node as Element).matches(selector);

      if (!isMatch) {
        continue;
      }

      for (const callback of callbacks.values()) {
        const isNewCallback = !matchedBinds.find((binding) => binding.hasSameCallback(callback));

        if (isNewCallback) {
          matchedBinds.push(new Binding(selector, callback, callback(node as Element)));
        }
      }
    }

    if (matchedBinds.length) {
      this._nodesToBinds.set(node, matchedBinds);
    } else {
      this._nodesToBinds.delete(node);
    }
  }

  private _bindToDOM() {
    const aggregatedSelector = Array.from(this._selectorsToCallbacks.keys()).join(',');

    if (aggregatedSelector) {
      const matchedNodes = this._parent.querySelectorAll(aggregatedSelector);

      this._bindNodes(matchedNodes);
    }

    this._mutationObserver.observe((this._parent as unknown) as Node, {
      childList: true,
      subtree: true,
      attributes: this._areAttributesObserved,
    });

    this._window.addEventListener('unload', this._onDocumentUnload);
  }

  private _onDocumentUnload = () => {
    if (this._isListening) {
      this._mutationObserver.disconnect();
    }
  };
}
