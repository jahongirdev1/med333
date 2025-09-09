import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const GLOBAL_TITLE = 'Med Alatau';

/**
 * Locks document.title to a single global value on every route change.
 * Mount this once in the root layout so ALL pages get the same title.
 */
export default function GlobalTitleLock() {
  const loc = useLocation();

  useEffect(() => {
    document.title = GLOBAL_TITLE;
  }, [loc.pathname, loc.search, loc.hash]);

  return null;
}
