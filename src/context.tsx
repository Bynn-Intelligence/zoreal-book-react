import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react';
import ZorealBookCore, { ns, type BookNamespace, type UiConfig } from '@zoreal/book-js';

export interface ZorealBookContextValue {
  /** Defaults to the public Book origin. Set it only if you were told to. */
  origin?: string;
  /** Appearance applied to every embed under this provider. */
  ui?: UiConfig;
}

const ZorealBookContext = createContext<ZorealBookContextValue>({});

export interface ZorealBookProviderProps extends ZorealBookContextValue {
  children: ReactNode;
}

/**
 * Optional. Wrap the part of your app that books, and every embed under it
 * shares an origin and an appearance instead of repeating them.
 */
export function ZorealBookProvider({ origin, ui, children }: ZorealBookProviderProps) {
  const value = useMemo(() => ({ origin, ui }), [origin, ui]);
  return <ZorealBookContext.Provider value={value}>{children}</ZorealBookContext.Provider>;
}

/**
 * The imperative API for a namespace.
 *
 * The core loads once per page however many components ask for it, so calling
 * this in ten components costs one script and one set of listeners.
 */
export function useZorealBook(namespace = 'default'): BookNamespace {
  const { origin, ui } = useContext(ZorealBookContext);
  const api = useMemo(() => ns(namespace), [namespace]);

  // Binding click-to-open here means markup carrying data-zoreal-book-link
  // works anywhere in a React app without the app reaching past this package
  // into the core. The core binds once however many components ask.
  useEffect(() => {
    ZorealBookCore.init();
  }, []);

  // Stringified so an inline object literal in a parent's JSX does not
  // reapply the appearance on every render.
  const uiKey = ui ? JSON.stringify(ui) : '';

  useEffect(() => {
    if (origin) api.init({ origin });
  }, [api, origin]);

  useEffect(() => {
    if (uiKey) api.ui(JSON.parse(uiKey) as UiConfig);
  }, [api, uiKey]);

  return api;
}

export { ZorealBookContext };
