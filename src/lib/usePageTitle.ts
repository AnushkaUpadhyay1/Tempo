import { useEffect } from 'react';

/** Sets document.title as "Page · Section" so each screen is named in tabs and history. */
export function usePageTitle(page: string, section = 'Steady') {
  useEffect(() => {
    document.title = page ? `${page} · ${section}` : section;
  }, [page, section]);
}
