import { useEffect, useState } from 'react';
import { MenuScreen } from './components/MenuScreen';
import { loadFreshMenu, loadMenu, MENU_POLL_MS, menuSnapshot } from './lib/menu';
import type { MenuData } from './types';

type LoadState =
  | { status: 'loading' }
  | { status: 'ready'; menu: MenuData }
  | { status: 'error'; message: string };

const menuPromise = loadMenu();

export function App() {
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    menuPromise.then(
      (menu) => {
        if (!cancelled) setState({ status: 'ready', menu });
      },
      (error: unknown) => {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : 'Неизвестная ошибка при чтении меню.';
        setState({ status: 'error', message });
      },
    );
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (state.status === 'loading') return;
    let cancelled = false;

    const tick = () => {
      loadFreshMenu().then(
        (menu) => {
          if (cancelled) return;
          setState((current) => {
            if (current.status === 'ready' && menuSnapshot(current.menu) === menuSnapshot(menu)) return current;
            return { status: 'ready', menu };
          });
        },
        () => undefined,
      );
    };

    const timer = window.setInterval(tick, MENU_POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === 'visible') tick();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [state.status]);

  if (state.status === 'ready') return <MenuScreen menu={state.menu} />;

  return (
    <div className="flex min-h-dvh items-center justify-center bg-paper px-6 text-ink">
      <div className="max-w-lg">
        <h1 className="wordmark">Osteria Alba</h1>
        <p className="eyebrow mt-3 text-[13px] tracking-[0.16em] text-muted lowercase">cucina italiana</p>
        {state.status === 'loading' ? (
          <p className="mt-8 text-base text-muted">Открываем меню…</p>
        ) : (
          <>
            <p className="mt-8 text-2xl">Меню не открылось</p>
            <p className="mt-3 leading-relaxed text-muted">{state.message}</p>
          </>
        )}
      </div>
    </div>
  );
}
