class Binding {
    constructor(selector, bindCallback, unbindCallback) {
        this._selector = selector;
        this._callback = bindCallback;
        this._unbindCallback = unbindCallback;
    }
    hasSameCallback(callback) {
        return this._callback === callback;
    }
    match(element) {
        return element.matches(this._selector);
    }
    destroy(element) {
        if (typeof this._unbindCallback === 'function') {
            this._unbindCallback(element);
        }
    }
}

class Necktie {
    constructor(_window = window, _document = document) {
        this._window = _window;
        this._document = _document;
        this._selectorsToCallbacks = new Map();
        this._nodesToBinds = new Map();
        this._dummyFragment = this._document.createDocumentFragment();
        this._areAttributesObserved = false;
        this._isListening = false;
    }
    bind(selector, callback) {
        if (!this._isSelectorValid(selector)) {
            throw new Error('Invalid selector');
        }
        if (typeof callback !== 'function') {
            throw new Error('Callback parameter has to be a function');
        }
        if (!this._selectorsToCallbacks.has(selector)) {
            this._selectorsToCallbacks.set(selector, new Set());
        }
        if (this._selectorsToCallbacks.get(selector).has(callback)) {
            throw new Error('Callback already registered');
        }
        this._selectorsToCallbacks.get(selector).add(callback);
        if (this._isListening) {
            this._document.querySelectorAll(selector).forEach((node) => {
                if (!this._nodesToBinds.has(node)) {
                    this._nodesToBinds.set(node, []);
                }
                this._nodesToBinds.get(node).push(new Binding(selector, callback, callback(node)));
            });
        }
        return this;
    }
    bindClass(selector, Bindable) {
        return this.bind(selector, (element) => {
            const bindable = new Bindable(element);
            return (removedElement) => {
                bindable.destroy(removedElement);
            };
        });
    }
    observeAttributes(isEnabled = true) {
        if (this._isListening) {
            throw new Error('Cannot change observing mode once started');
        }
        this._areAttributesObserved = isEnabled;
        return this;
    }
    startListening() {
        this._bindToDOM();
        this._isListening = true;
        return this;
    }
    _isSelectorValid(selector) {
        try {
            this._dummyFragment.querySelector(selector);
            return true;
        }
        catch (error) {
            return false;
        }
    }
    _bindNodes(nodes) {
        nodes.forEach((node) => {
            if (node.nodeType !== Node.ELEMENT_NODE) {
                return;
            }
            const binds = [];
            for (const [selector, callbacks] of this._selectorsToCallbacks.entries()) {
                const isMatch = node.matches(selector);
                if (!isMatch) {
                    continue;
                }
                for (const callback of callbacks.values()) {
                    binds.push(new Binding(selector, callback, callback(node)));
                }
            }
            if (binds.length) {
                this._nodesToBinds.set(node, binds);
            }
        });
    }
    _unbindNodes(nodes) {
        nodes.forEach((node) => {
            if (node.nodeType !== Node.ELEMENT_NODE) {
                return;
            }
            for (const [bindedNode, binds] of this._nodesToBinds.entries()) {
                if (node.contains(bindedNode)) {
                    binds.forEach((binding) => binding.destroy(node));
                    this._nodesToBinds.delete(bindedNode);
                }
            }
        });
    }
    _rebindNode(node) {
        if (node.nodeType !== Node.ELEMENT_NODE) {
            return;
        }
        const binds = this._nodesToBinds.get(node) || [];
        const matchedBinds = binds.filter((binding) => binding.match(node));
        const unmatchedBinds = binds.filter((binding) => !binding.match(node));
        unmatchedBinds.forEach((binding) => binding.destroy(node));
        for (const [selector, callbacks] of this._selectorsToCallbacks.entries()) {
            const isMatch = node.matches(selector);
            if (!isMatch) {
                continue;
            }
            for (const callback of callbacks.values()) {
                const isNewCallback = !matchedBinds.find((binding) => binding.hasSameCallback(callback));
                if (isNewCallback) {
                    matchedBinds.push(new Binding(selector, callback, callback(node)));
                }
            }
        }
        if (matchedBinds.length) {
            this._nodesToBinds.set(node, matchedBinds);
        }
        else {
            this._nodesToBinds.delete(node);
        }
    }
    _bindToDOM() {
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

export { Necktie };
