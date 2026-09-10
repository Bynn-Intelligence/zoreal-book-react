import { useEffect, useRef } from 'react';
import type { BookEventHandler, BookEventMap, BookEventName } from '@zoreal/book-js';
import { useZorealBook } from './context';

/**
 * Subscribes to one booking event for as long as the component is mounted.
 *
 * The handler is held in a ref, so passing an inline arrow function does not
 * resubscribe on every render and the callback never goes stale.
 */
export function useZorealBookEvent<K extends BookEventName>(
  event: K,
  handler: BookEventHandler<K>,
  namespace?: string,
): void {
  const api = useZorealBook(namespace);
  const latest = useRef(handler);
  latest.current = handler;

  useEffect(() => {
    const forward = (payload: BookEventMap[K]) => latest.current(payload);
    api.on(event, forward);
    return () => {
      api.off(event, forward);
    };
  }, [api, event]);
}
