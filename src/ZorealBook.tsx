import { useEffect, useRef, type HTMLAttributes } from 'react';
import type { BookConfig, InlineHandle } from '@zoreal/book-js';
import { useZorealBook } from './context';

export interface ZorealBookProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** `<handle>` for the whole page, or `<handle>/<slug>` for one event type. */
  link: string;
  /** Prefill and metadata. Changing it updates the frame in place. */
  config?: BookConfig;
  /** An independent embed. Two namespaces on one page never cross. */
  namespace?: string;
}

/**
 * The booking screens, inline, sized to their own content.
 *
 * Nothing renders on the server: the frame is created after mount, so this is
 * safe in any server-rendered app. Every other div attribute you pass lands on
 * the wrapper, so it takes your className and your style as normal.
 */
export function ZorealBook({ link, config, namespace, ...rest }: ZorealBookProps) {
  const api = useZorealBook(namespace);
  const mount = useRef<HTMLDivElement | null>(null);
  const handle = useRef<InlineHandle | null>(null);

  // Held in a ref so a new object literal on every render does not tear the
  // frame down and reload it; the effect below pushes changes in place.
  const latestConfig = useRef(config);
  latestConfig.current = config;

  const configKey = config ? JSON.stringify(config) : '';
  const firstConfig = useRef(true);

  useEffect(() => {
    const element = mount.current;
    if (!element) return;

    const created = api.inline({ link, element, config: latestConfig.current });
    handle.current = created;
    firstConfig.current = true;

    return () => {
      created.destroy();
      handle.current = null;
    };
  }, [api, link]);

  useEffect(() => {
    // The frame was created with the current config; only later changes need
    // to be pushed.
    if (firstConfig.current) {
      firstConfig.current = false;
      return;
    }
    handle.current?.setConfig(latestConfig.current ?? {});
  }, [configKey]);

  return <div ref={mount} {...rest} />;
}

export default ZorealBook;
