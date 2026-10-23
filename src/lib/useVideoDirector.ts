import { useCallback, useEffect, useRef, type RefObject } from 'react';

const VISIBLE_RATIO = 0.5;

type Node = {
  video: HTMLVideoElement;
  ratio: number;
};

type Entry = {
  id: string;
  video: HTMLVideoElement;
};

export type VideoRegister = (id: string, video: HTMLVideoElement) => () => void;

function visibleEntries(nodes: Map<string, Node>): Entry[] {
  const list: Entry[] = [];
  for (const [id, node] of nodes) {
    if (node.ratio >= VISIBLE_RATIO && node.video.isConnected) list.push({ id, video: node.video });
  }
  list.sort((a, b) => {
    if (a.video === b.video) return 0;
    const position = a.video.compareDocumentPosition(b.video);
    if (position & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
    if (position & Node.DOCUMENT_POSITION_PRECEDING) return 1;
    return 0;
  });
  return list;
}

function pickNext(nodes: Map<string, Node>, visible: Entry[], fromId: string | null): string | null {
  if (visible.length === 0) return null;
  if (!fromId) return visible[0].id;
  const index = visible.findIndex((entry) => entry.id === fromId);
  if (index !== -1) return visible[(index + 1) % visible.length].id;
  const from = nodes.get(fromId)?.video;
  if (!from) return visible[0].id;
  const after = visible.find((entry) => from.compareDocumentPosition(entry.video) & Node.DOCUMENT_POSITION_FOLLOWING);
  return (after ?? visible[0]).id;
}

function applyPreload(nodes: Map<string, Node>, visible: Entry[], current: string | null) {
  const upcoming = current ? pickNext(nodes, visible, current) : null;
  for (const [id, node] of nodes) {
    const want = id === current || id === upcoming ? 'auto' : 'none';
    if (node.video.preload !== want) node.video.preload = want;
  }
}

function pauseAll(nodes: Map<string, Node>) {
  for (const node of nodes.values()) node.video.pause();
}

export function useVideoDirector(scrollRef: RefObject<HTMLElement | null>, live: boolean): VideoRegister {
  const nodes = useRef(new Map<string, Node>());
  const activeId = useRef<string | null>(null);
  const liveRef = useRef(live);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const frame = useRef(0);
  const syncRef = useRef<() => void>(() => undefined);
  const beginRef = useRef<(id: string, fromStart: boolean, failed: Set<string>) => void>(() => undefined);
  const registerRef = useRef<VideoRegister>(() => () => undefined);

  liveRef.current = live;

  const schedule = useCallback(() => {
    if (frame.current) return;
    frame.current = window.requestAnimationFrame(() => {
      frame.current = 0;
      syncRef.current();
    });
  }, []);

  const ensureObserver = useCallback(() => {
    if (observerRef.current) return;
    const root = scrollRef.current;
    if (!root) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!(entry.target instanceof HTMLVideoElement)) continue;
          const id = entry.target.dataset.videoId;
          if (!id) continue;
          const node = nodes.current.get(id);
          if (node) node.ratio = entry.intersectionRatio;
        }
        schedule();
      },
      { root, threshold: [0, 0.5, 1] },
    );
    observerRef.current = observer;
    for (const node of nodes.current.values()) observer.observe(node.video);
  }, [schedule, scrollRef]);

  beginRef.current = (id, fromStart, failed) => {
    if (!liveRef.current || failed.has(id)) return;
    const node = nodes.current.get(id);
    if (!node) return;
    const { video } = node;
    activeId.current = id;
    for (const [otherId, other] of nodes.current) {
      if (otherId !== id) other.video.pause();
    }
    video.muted = true;
    if (fromStart) {
      try {
        if (video.currentTime > 0) video.currentTime = 0;
      } catch {
        // метаданные ещё не приехали, play() стартует с нуля
      }
    }
    applyPreload(nodes.current, visibleEntries(nodes.current), id);
    void video.play().then(
      () => {
        if (!liveRef.current || activeId.current !== id) video.pause();
      },
      () => {
        if (!liveRef.current || activeId.current !== id) return;
        failed.add(id);
        const visible = visibleEntries(nodes.current);
        if (failed.size >= visible.length) {
          video.pause();
          return;
        }
        const next = pickNext(nodes.current, visible, id);
        if (!next || next === id || failed.has(next)) {
          video.pause();
          return;
        }
        beginRef.current(next, true, failed);
      },
    );
  };

  syncRef.current = () => {
    ensureObserver();
    if (!liveRef.current) {
      pauseAll(nodes.current);
      return;
    }
    const visible = visibleEntries(nodes.current);
    const active = activeId.current;
    const activeEntry = active ? visible.find((entry) => entry.id === active) : undefined;
    if (activeEntry && !activeEntry.video.paused && !activeEntry.video.ended) {
      applyPreload(nodes.current, visible, activeEntry.id);
      return;
    }
    if (activeEntry && !activeEntry.video.ended) {
      beginRef.current(activeEntry.id, false, new Set());
      return;
    }
    const next = pickNext(nodes.current, visible, active);
    if (!next) {
      pauseAll(nodes.current);
      return;
    }
    beginRef.current(next, true, new Set());
  };

  registerRef.current = (id, video) => {
    nodes.current.set(id, { video, ratio: 0 });
    video.dataset.videoId = id;
    const onEnded = () => {
      if (!liveRef.current || activeId.current !== id) return;
      const next = pickNext(nodes.current, visibleEntries(nodes.current), id);
      if (!next) return;
      beginRef.current(next, true, new Set());
    };
    const onError = () => {
      if (!liveRef.current || activeId.current !== id) return;
      const visible = visibleEntries(nodes.current);
      const next = pickNext(nodes.current, visible, id);
      if (!next || next === id) {
        video.pause();
        return;
      }
      beginRef.current(next, true, new Set([id]));
    };
    video.addEventListener('ended', onEnded);
    video.addEventListener('error', onError);
    ensureObserver();
    observerRef.current?.observe(video);
    schedule();
    return () => {
      video.removeEventListener('ended', onEnded);
      video.removeEventListener('error', onError);
      observerRef.current?.unobserve(video);
      video.pause();
      delete video.dataset.videoId;
      nodes.current.delete(id);
      if (activeId.current === id) activeId.current = null;
      schedule();
    };
  };

  useEffect(() => {
    schedule();
  }, [live, schedule]);

  useEffect(() => {
    const registered = nodes.current;
    return () => {
      if (frame.current) window.cancelAnimationFrame(frame.current);
      frame.current = 0;
      observerRef.current?.disconnect();
      observerRef.current = null;
      pauseAll(registered);
      registered.clear();
    };
  }, []);

  return useCallback<VideoRegister>((id, video) => registerRef.current(id, video), []);
}
