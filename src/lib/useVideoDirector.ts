import { useCallback, useEffect, useRef, type RefObject } from 'react';

const MAX_PLAYING = 3;
const VISIBLE_RATIO = 0.45;

type NodeEntry = {
  card: HTMLElement;
  video: HTMLVideoElement;
};

export type VideoRegister = (id: string, card: HTMLElement, video: HTMLVideoElement) => () => void;

export function useVideoDirector(
  scrollRef: RefObject<HTMLElement | null>,
  suspended: boolean,
): VideoRegister {
  const nodes = useRef(new Map<string, NodeEntry>());
  const visible = useRef(new Set<string>());
  const observerRef = useRef<IntersectionObserver | null>(null);
  const suspendedRef = useRef(suspended);
  const frame = useRef(0);
  suspendedRef.current = suspended;

  const pick = useCallback(() => {
    const root = scrollRef.current;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!root || suspendedRef.current || reduce) {
      for (const node of nodes.current.values()) node.video.pause();
      return;
    }

    const rootRect = root.getBoundingClientRect();
    const mid = rootRect.top + rootRect.height / 2;
    const ranked: { id: string; dist: number }[] = [];

    for (const [id, node] of nodes.current) {
      if (!visible.current.has(id)) {
        node.video.pause();
        continue;
      }
      const rect = node.card.getBoundingClientRect();
      const center = rect.top + rect.height / 2;
      ranked.push({ id, dist: Math.abs(center - mid) });
    }

    ranked.sort((a, b) => a.dist - b.dist);
    const allow = new Set(ranked.slice(0, MAX_PLAYING).map((item) => item.id));
    for (const [id, node] of nodes.current) {
      if (!allow.has(id)) {
        node.video.pause();
        continue;
      }
      node.video.muted = true;
      if (node.video.paused) void node.video.play().catch(() => undefined);
    }
  }, [scrollRef]);

  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = entry.target.getAttribute('data-video-id');
          if (!id) continue;
          if (entry.isIntersecting && entry.intersectionRatio >= VISIBLE_RATIO) visible.current.add(id);
          else visible.current.delete(id);
        }
        pick();
      },
      { root, threshold: [0, 0.25, 0.45, 0.7, 1] },
    );
    observerRef.current = observer;

    for (const [id, node] of nodes.current) {
      node.card.setAttribute('data-video-id', id);
      observer.observe(node.card);
    }

    const onScroll = () => {
      if (frame.current) return;
      frame.current = window.requestAnimationFrame(() => {
        frame.current = 0;
        pick();
      });
    };
    root.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    pick();

    return () => {
      observer.disconnect();
      observerRef.current = null;
      root.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame.current) window.cancelAnimationFrame(frame.current);
    };
  }, [pick, scrollRef]);

  useEffect(() => {
    pick();
  }, [pick, suspended]);

  return useCallback<VideoRegister>(
    (id, card, video) => {
      nodes.current.set(id, { card, video });
      card.setAttribute('data-video-id', id);
      observerRef.current?.observe(card);
      pick();
      return () => {
        observerRef.current?.unobserve(card);
        nodes.current.delete(id);
        visible.current.delete(id);
        video.pause();
        pick();
      };
    },
    [pick],
  );
}
