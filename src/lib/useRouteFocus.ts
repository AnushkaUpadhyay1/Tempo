import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router';

/**
 * After in-app navigation, move focus to the new page's main heading so
 * screen reader and keyboard users start at the top of the new content.
 * The first page load is left alone.
 */
export function useRouteFocus(containerSelector = 'main') {
  const { pathname } = useLocation();
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const frame = window.requestAnimationFrame(() => {
      const heading = document.querySelector<HTMLElement>(`${containerSelector} h1`);
      if (!heading) return;
      if (!heading.hasAttribute('tabindex')) heading.setAttribute('tabindex', '-1');
      heading.focus({ preventScroll: false });
      window.scrollTo(0, 0);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [pathname, containerSelector]);
}
