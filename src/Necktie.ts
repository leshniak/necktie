import { Bindable } from './Bindable';
import { Binding } from './Binding';
import { Callback } from './Callback';

const MAX_UNBIND_DEPTH = 1;

export class Necktie {
  private readonly _window: Window;
  private readonly _document: Document;
  private readonly _selectorsToCallbacks: Map<string, Set<Callback>>;
  private readonly _nodesToBinds: Map<Node, Array<Binding>>;
  private readonly _dummyFragment: DocumentFragment;
  private _areAttributesObserved: boolean;
  private _isListening: boolean;

  public constructor(_window = window, _document = document) {
    this._window = _window;
    this._document = _document;
    this._selectorsToCallbacks = new Map();
    this._nodesToBinds = new Map();
    this._dummyFragment = this._document.createDocumentFragment();
    this._areAttributesObserved = false;
    this._isListening = false;
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
      this._document.querySelectorAll(selector).forEach((node) => {
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
        const isMatch = (node as HTMLElement).matches(selector);

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

  private _unbindNodes(nodes: NodeList | Array<Node>, depth = 0) {
    nodes.forEach((node: Node) => {
      if (node.nodeType !== Node.ELEMENT_NODE) {
        return;
      }

      const binds = this._nodesToBinds.get(node) || [];

      binds.forEach((binding) => binding.destroy(node as Element));
      this._nodesToBinds.delete(node);

      if (depth >= MAX_UNBIND_DEPTH) {
        return;
      }

      const bindedChildNodes = Array.from(this._nodesToBinds.keys()).filter((bindedNode) => node.contains(bindedNode));

      if (bindedChildNodes.length) {
        this._unbindNodes(bindedChildNodes, depth + 1);
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
      const isMatch = (node as HTMLElement).matches(selector);

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
    const observer = new MutationObserver((mutations) => {
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

    if (aggregatedSelector) {
      const matchedNodes = this._document.querySelectorAll(aggregatedSelector);

      this._bindNodes(matchedNodes);
    }

    observer.observe(this._document, {
      childList: true,
      subtree: true,
      attributes: this._areAttributesObserved,
    });

    this._window.addEventListener('unload', () => {
      observer.disconnect();
    });
  }
}
