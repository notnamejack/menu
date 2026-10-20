import { useEffect, useState } from 'react';

const STORAGE_KEY = 'osteria-kiosk';
const IDLE_MS = 60_000;

function readKioskFlag(): boolean {
  const params = new URLSearchParams(window.location.search);
  if (params.get('kiosk') === '1') {
    sessionStorage.setItem(STORAGE_KEY, '1');
    return true;
  }
  if (params.get('kiosk') === '0') {
    sessionStorage.removeItem(STORAGE_KEY);
    return false;
  }
  return sessionStorage.getItem(STORAGE_KEY) === '1';
}

export function useKioskMode(): [boolean, () => void] {
  const [kiosk, setKiosk] = useState(readKioskFlag);

  const toggle = () => {
    setKiosk((current) => {
      const next = !current;
      if (next) sessionStorage.setItem(STORAGE_KEY, '1');
      else sessionStorage.removeItem(STORAGE_KEY);
      return next;
    });
  };

  return [kiosk, toggle];
}

export function useKioskIdle(enabled: boolean, onIdle: () => void): void {
  useEffect(() => {
    if (!enabled) return;
    let timer = window.setTimeout(onIdle, IDLE_MS);
    const bump = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(onIdle, IDLE_MS);
    };
    const options: AddEventListenerOptions = { capture: true, passive: true };
    const events: Array<keyof WindowEventMap> = ['pointerdown', 'keydown', 'touchstart', 'wheel', 'scroll'];
    for (const event of events) window.addEventListener(event, bump, options);
    return () => {
      window.clearTimeout(timer);
      for (const event of events) window.removeEventListener(event, bump, options);
    };
  }, [enabled, onIdle]);
}
