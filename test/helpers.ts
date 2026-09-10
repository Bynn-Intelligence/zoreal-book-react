import { vi } from 'vitest';

export const ORIGIN = 'https://book.zoreal.com';

export function frames(): HTMLIFrameElement[] {
  const found: HTMLIFrameElement[] = [];
  for (const host of document.querySelectorAll('[data-zoreal-book]')) {
    const frame = host.shadowRoot?.querySelector('iframe');
    if (frame) found.push(frame as HTMLIFrameElement);
  }
  return found;
}

/**
 * A frame that never loaded reports no window, and the SDK refuses messages
 * from one. Tests stand a window in its place so the channel behaves as it
 * does in a browser.
 */
export function attach(frame: HTMLIFrameElement) {
  const existing = frame.contentWindow as (Window & { postMessage: ReturnType<typeof vi.fn> }) | null;
  if (existing && typeof (existing as { postMessage?: unknown }).postMessage === 'function') {
    return existing.postMessage as ReturnType<typeof vi.fn>;
  }
  const post = vi.fn();
  Object.defineProperty(frame, 'contentWindow', { configurable: true, value: { postMessage: post } });
  return post;
}

export function send(
  frame: HTMLIFrameElement,
  type: string,
  payload: unknown = {},
  ns = 'default',
): void {
  attach(frame);
  const event = new MessageEvent('message', {
    data: { v: 1, ns, type, payload },
    origin: ORIGIN,
  });
  Object.defineProperty(event, 'source', { value: frame.contentWindow });
  window.dispatchEvent(event);
}
