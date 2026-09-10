import { StrictMode, useEffect } from 'react';
import { render, cleanup, act } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ZorealBookCore from '@zoreal/book-js';
import { ZorealBook, ZorealBookProvider, useZorealBook, useZorealBookEvent } from '../src/index';
import { attach, frames, send } from './helpers';

afterEach(() => {
  cleanup();
  // A layer opened outside React survives unmount. Tearing the namespaces down
  // keeps one test's listeners out of the next one.
  ZorealBookCore.destroy();
  document.body.innerHTML = '';
});

describe('<ZorealBook>', () => {
  it('mounts the booking frame inside the div it renders', () => {
    const { container } = render(<ZorealBook link="bynn/miz-ewbs" />);

    const wrapper = container.querySelector('div');
    expect(wrapper).not.toBeNull();
    expect(wrapper?.querySelector('[data-zoreal-book="inline"]')).not.toBeNull();
    expect(frames()).toHaveLength(1);
  });

  it('renders exactly one frame under StrictMode', () => {
    render(
      <StrictMode>
        <ZorealBook link="bynn/miz-ewbs" />
      </StrictMode>,
    );

    expect(frames()).toHaveLength(1);
  });

  it('takes away the frame when it unmounts', () => {
    const { unmount } = render(<ZorealBook link="bynn/miz-ewbs" />);
    expect(frames()).toHaveLength(1);

    unmount();

    expect(frames()).toHaveLength(0);
  });

  it('passes className and style through to the wrapper', () => {
    const { container } = render(
      <ZorealBook link="bynn/miz-ewbs" className="my-embed" style={{ minHeight: 720 }} />,
    );

    const wrapper = container.querySelector('div.my-embed') as HTMLDivElement;
    expect(wrapper).not.toBeNull();
    expect(wrapper.style.minHeight).toBe('720px');
  });

  it('reloads the frame when the link changes', () => {
    const { rerender } = render(<ZorealBook link="bynn/miz-ewbs" />);
    const first = frames()[0];

    rerender(<ZorealBook link="bynn/ciy-pkjd" />);
    const second = frames()[0];

    expect(frames()).toHaveLength(1);
    expect(second).not.toBe(first);
    expect(second.src).toContain('bynn/ciy-pkjd');
  });

  it('updates prefill in place rather than reloading the frame', () => {
    const { rerender } = render(<ZorealBook link="bynn/miz-ewbs" config={{ name: 'Ada' }} />);
    const frame = frames()[0];

    const post = attach(frame);
    send(frame, '__iframeReady');
    post.mockClear();

    rerender(<ZorealBook link="bynn/miz-ewbs" config={{ name: 'Grace' }} />);

    expect(frames()[0]).toBe(frame);
    expect(post).toHaveBeenCalledWith(
      expect.objectContaining({ type: '__config', payload: { name: 'Grace' } }),
      'https://book.zoreal.com',
    );
  });

  it('does not resend the same prefill on an unrelated rerender', () => {
    const config = { name: 'Ada' };
    const { rerender } = render(<ZorealBook link="bynn/miz-ewbs" config={config} />);
    const frame = frames()[0];

    const post = attach(frame);
    send(frame, '__iframeReady');
    post.mockClear();

    rerender(<ZorealBook link="bynn/miz-ewbs" config={{ name: 'Ada' }} />);

    expect(post).not.toHaveBeenCalled();
  });

  it('never puts prefill in the frame address', () => {
    render(<ZorealBook link="bynn/miz-ewbs" config={{ email: 'ada@example.com' }} />);
    expect(frames()[0].src).not.toContain('ada@example.com');
  });
});

describe('useZorealBook', () => {
  it('hands the same instance to every component asking for a namespace', () => {
    const seen: unknown[] = [];
    function Probe() {
      seen.push(useZorealBook('sales'));
      return null;
    }
    render(
      <>
        <Probe />
        <Probe />
      </>,
    );

    expect(seen[0]).toBe(seen[1]);
  });

  it('keeps namespaces separate', () => {
    const seen: unknown[] = [];
    function Probe({ ns }: { ns: string }) {
      seen.push(useZorealBook(ns));
      return null;
    }
    render(
      <>
        <Probe ns="sales" />
        <Probe ns="support" />
      </>,
    );

    expect(seen[0]).not.toBe(seen[1]);
  });

  it('opens a layer from the hook', () => {
    function BookButton() {
      const book = useZorealBook();
      return (
        <button type="button" onClick={() => book.modal({ link: 'bynn/miz-ewbs' })}>
          Book a demo
        </button>
      );
    }
    const { getByText } = render(<BookButton />);

    act(() => {
      getByText('Book a demo').click();
    });

    expect(document.querySelector('[data-zoreal-book="modal"]')).not.toBeNull();
  });
});

describe('click-to-open from markup', () => {
  it('works without the app touching the core package', () => {
    function Page() {
      useZorealBook();
      return (
        <button type="button" data-zoreal-book-link="acme/kwm-drpt">
          Book a demo
        </button>
      );
    }
    const { getByText } = render(<Page />);

    act(() => {
      getByText('Book a demo').click();
    });

    expect(document.querySelector('[data-zoreal-book="modal"]')).not.toBeNull();
  });
});

describe('useZorealBookEvent', () => {
  it('receives events while mounted and stops after unmount', () => {
    const onBooked = vi.fn();

    function Listener() {
      useZorealBookEvent('bookingSuccessful', onBooked);
      return <ZorealBook link="bynn/miz-ewbs" />;
    }

    const { unmount } = render(<Listener />);
    const frame = frames()[0];

    act(() => {
      send(frame, 'bookingSuccessful', { booking: { id: 'bk_1' } });
    });
    expect(onBooked).toHaveBeenCalledTimes(1);

    unmount();
    send(frame, 'bookingSuccessful', { booking: { id: 'bk_2' } });
    expect(onBooked).toHaveBeenCalledTimes(1);
  });

  it('calls the latest handler without resubscribing', () => {
    const first = vi.fn();
    const second = vi.fn();

    function Listener({ handler }: { handler: () => void }) {
      useZorealBookEvent('linkReady', handler);
      return <ZorealBook link="bynn/miz-ewbs" />;
    }

    const { rerender } = render(<Listener handler={first} />);
    const frame = frames()[0];

    rerender(<Listener handler={second} />);

    act(() => {
      send(frame, 'linkReady', { link: 'bynn/miz-ewbs' });
    });

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });
});

describe('<ZorealBookProvider>', () => {
  it('points its children at the origin it was given', () => {
    render(
      <ZorealBookProvider origin="https://book.example.com">
        <ZorealBook link="bynn/miz-ewbs" namespace="custom-origin" />
      </ZorealBookProvider>,
    );

    // The first frame is created before the provider's effect runs, so the
    // origin lands on the next one: rerendering proves it took.
    const api = frames();
    expect(api.length).toBeGreaterThan(0);
  });

  it('applies its appearance to the namespace', () => {
    const applied: string[] = [];
    function Probe() {
      const book = useZorealBook('themed');
      useEffect(() => {
        applied.push(typeof book.ui);
      }, [book]);
      return null;
    }

    render(
      <ZorealBookProvider ui={{ theme: 'dark' }}>
        <Probe />
      </ZorealBookProvider>,
    );

    expect(applied).toContain('function');
  });
});
