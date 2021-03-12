import { JSDOM } from 'jsdom';

import { Necktie } from '@lib/Necktie';
import { emptyDocument, exampleDocument } from './contentMocks';

const getInstance = (doc: JSDOM) =>
  new Necktie((doc.window as unknown) as Window & typeof globalThis, doc.window.document);

describe('Necktie', () => {
  let mutationObserverContexts: Array<MutationObserverMock>;

  class MutationObserverMock implements MutationObserver {
    public readonly observer: MutationCallback;

    constructor(observer: MutationCallback) {
      this.observer = observer;
      mutationObserverContexts.push(this);
    }

    observe = jest.fn<void, [Node, MutationObserverInit]>();
    disconnect = jest.fn<void, []>();
    takeRecords = jest.fn<Array<MutationRecord>, []>();
  }

  class NodeMock {
    static ELEMENT_NODE = 1;
    static TEXT_NODE = 3;
  }

  beforeAll(() => {
    global.MutationObserver = MutationObserverMock;
    global.Node = NodeMock as typeof Node;
  });

  beforeEach(() => {
    mutationObserverContexts = [];
  });

  afterEach(() => {
    mutationObserverContexts = [];
  });

  it('creates an instance', () => {
    const doc = emptyDocument();
    const necktie = getInstance(doc);

    expect(necktie).toBeDefined();
    expect(necktie).toBeInstanceOf(Necktie);
  });

  it('does not observe atrribute mutations by default', () => {
    const doc = exampleDocument();
    const necktie = getInstance(doc);

    necktie.startListening();

    expect(mutationObserverContexts[0].observe).toBeCalledWith(doc.window.document, {
      childList: true,
      subtree: true,
      attributes: false,
    });
  });

  it('enables an optional atrribute mutations observer', () => {
    const doc = exampleDocument();
    const necktie = getInstance(doc);

    necktie.observeAttributes();
    necktie.startListening();

    expect(mutationObserverContexts[0].observe).toBeCalledWith(doc.window.document, {
      childList: true,
      subtree: true,
      attributes: true,
    });
  });

  it('binds to existing nodes', () => {
    const doc = exampleDocument();
    const necktie = getInstance(doc);
    const selector = '.button-primary[data-add-list-item]';
    const existingElement = doc.window.document.querySelector(selector);
    const stub = jest.fn();

    necktie.bind(selector, stub);
    necktie.startListening();

    expect(stub).toBeCalledWith(existingElement);
  });

  it('binds to an added node', () => {
    const doc = exampleDocument();
    const necktie = getInstance(doc);
    const selector = 'span.foo';
    const stub = jest.fn();
    const element = doc.window.document.createElement('span');

    element.className = 'foo';

    necktie.bind(selector, stub);
    necktie.startListening();

    expect(stub).not.toBeCalled();

    const mutation = {
      type: 'childList',
      addedNodes: ([element as Node] as unknown) as NodeList,
      removedNodes: ([] as unknown) as NodeList,
    } as MutationRecord;

    mutationObserverContexts[0].observer([mutation], mutationObserverContexts[0]);

    expect(stub).toBeCalledWith(element);
  });

  it('unbinds from a removed node', () => {
    const doc = exampleDocument();
    const necktie = getInstance(doc);
    const selector = '.button-primary[data-add-list-item]';
    const element = doc.window.document.querySelector(selector);
    const stub = jest.fn();

    necktie.bind(selector, () => stub);
    necktie.startListening();

    expect(stub).not.toBeCalled();

    const mutation = {
      type: 'childList',
      addedNodes: ([] as unknown) as NodeList,
      removedNodes: ([element as Node] as unknown) as NodeList,
    } as MutationRecord;

    mutationObserverContexts[0].observer([mutation], mutationObserverContexts[0]);

    expect(stub).toBeCalledWith(element);
  });

  it('rebinds when an attribute has changed', () => {
    const doc = exampleDocument();
    const necktie = getInstance(doc);
    const selector = '.button-primary[data-add-list-item]';
    const nextSelector = '.button-secondary';
    const element = doc.window.document.querySelector(selector);
    const bindStub = jest.fn();
    const unbindStub = jest.fn();
    const nextBindStub = jest.fn();

    necktie.observeAttributes();
    necktie.bind(selector, (node) => {
      bindStub(node);

      return unbindStub;
    });
    necktie.bind(nextSelector, nextBindStub);
    necktie.startListening();

    expect(bindStub).toBeCalledWith(element);
    expect(unbindStub).not.toBeCalled();

    element?.classList.remove('button-primary');
    element?.classList.add('button-secondary');

    const mutation = {
      type: 'attributes',
      target: element as Node,
    } as MutationRecord;

    mutationObserverContexts[0].observer([mutation], mutationObserverContexts[0]);

    expect(unbindStub).toBeCalledWith(element);
    expect(nextBindStub).toBeCalledWith(element);
  });

  it('unbinds children of the removed node', () => {
    const doc = exampleDocument();
    const necktie = getInstance(doc);
    const childrenSelector = 'li.list-item';
    const parent = doc.window.document.querySelector('#list');
    const children = doc.window.document.querySelectorAll(childrenSelector);
    const unbindStub = jest.fn();

    necktie.bind(childrenSelector, () => unbindStub);
    necktie.startListening();

    expect(unbindStub).not.toBeCalled();

    const mutation = {
      type: 'childList',
      addedNodes: ([] as unknown) as NodeList,
      removedNodes: ([parent as Node] as unknown) as NodeList,
    } as MutationRecord;

    mutationObserverContexts[0].observer([mutation], mutationObserverContexts[0]);

    expect(unbindStub).toBeCalledTimes(children.length);
  });
});
