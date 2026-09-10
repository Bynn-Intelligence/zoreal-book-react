export { ZorealBook, type ZorealBookProps } from './ZorealBook';
export { ZorealBookProvider, useZorealBook, type ZorealBookProviderProps } from './context';
export { useZorealBookEvent } from './useZorealBookEvent';
export { SDK_VERSION } from './wire';

// Re-exported so an app needs one import for the component and the types it
// takes, rather than reaching into the core package for them.
export type {
  Booking,
  BookConfig,
  BookEventMap,
  BookEventName,
  BookNamespace,
  EventTypeSummary,
  FloatingButtonOptions,
  InlineHandle,
  LinkFailureReason,
  Location,
  ModalHandle,
  Requirement,
  Theme,
  UiConfig,
} from '@zoreal/book-js';
