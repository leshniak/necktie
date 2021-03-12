import { JSDOM } from 'jsdom';

import { Necktie } from '@lib/Necktie';
import { emptyDocument } from './contentMocks';

const getInstance = (doc: JSDOM) =>
  new Necktie((doc.window as unknown) as Window & typeof globalThis, doc.window.document);

describe('Necktie', () => {
  it('should create an instance', () => {
    const doc = emptyDocument();

    expect(getInstance(doc)).toBeDefined();
  });
});
