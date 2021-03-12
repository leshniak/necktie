import { JSDOM } from 'jsdom';

import { Necktie } from '@lib/Necktie';
import { emptyDocument } from './contentMocks';

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

  beforeAll(() => {
    global.MutationObserver = MutationObserverMock;
  });

  beforeEach(() => {
    mutationObserverContexts = [];
  });

  afterEach(() => {
    mutationObserverContexts = [];
  });

  it('should create an instance', () => {
    const doc = emptyDocument();

    expect(getInstance(doc)).toBeDefined();
  });
});
