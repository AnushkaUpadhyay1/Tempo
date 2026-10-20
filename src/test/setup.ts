import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
  localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
  document.documentElement.removeAttribute('data-reduced-motion');
  document.documentElement.style.removeProperty('--cw-text-scale');
});

// jsdom lacks these browser APIs; provide inert versions so components can feature-detect.
if (!window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}
// jsdom's scrollTo only logs "not implemented".
window.scrollTo = () => {};
Element.prototype.scrollIntoView ??= function scrollIntoView() {};

// jsdom does not implement <dialog>; add the minimal behaviour Clearway's Dialog relies on.
if (typeof HTMLDialogElement !== 'undefined' && !HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    this.removeAttribute('open');
    this.dispatchEvent(new Event('close'));
  };
}

// axe probes canvas for some checks; jsdom has none. Report "no 2D context" instead of logging errors.
HTMLCanvasElement.prototype.getContext = (() =>
  null) as typeof HTMLCanvasElement.prototype.getContext;

// Route modules load lazily, so give async queries enough time on a cold start.
import { configure } from '@testing-library/react';
configure({ asyncUtilTimeout: 5000 });

// jsdom has no PointerEvent; a MouseEvent subclass carries the fields swipe gestures read.
if (typeof window.PointerEvent === 'undefined') {
  class PointerEventPolyfill extends MouseEvent {
    pointerId: number;
    pointerType: string;
    constructor(type: string, init: PointerEventInit = {}) {
      super(type, init);
      this.pointerId = init.pointerId ?? 1;
      this.pointerType = init.pointerType ?? 'mouse';
    }
  }
  window.PointerEvent = PointerEventPolyfill as unknown as typeof PointerEvent;
}
