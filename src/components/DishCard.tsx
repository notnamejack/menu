import { useEffect, useRef, useState } from 'react';
import { assetUrl } from '../lib/assets';
import { formatPrice } from '../lib/format';
import type { MenuItem } from '../types';

type DishCardProps = {
  item: MenuItem;
  onOpen: (item: MenuItem) => void;
  delayMs?: number;
  videosLive?: boolean;
};

export function DishCard({ item, onOpen, delayMs = 0, videosLive = true }: DishCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hot, setHot] = useState(false);
  const [playing, setPlaying] = useState(false);
  const playable = Boolean(item.video) && item.available;

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !playable) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (hot && videosLive && !reduce) {
      video.muted = true;
      void video.play().catch(() => undefined);
      return;
    }
    video.pause();
  }, [hot, playable, videosLive]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    return () => {
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
    };
  }, [playable]);

  return (
    <article
      role="button"
      tabIndex={0}
      aria-label={item.available ? `Открыть «${item.name}»` : `«${item.name}», нет в наличии`}
      onClick={() => onOpen(item)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpen(item);
        }
      }}
      onPointerEnter={() => setHot(true)}
      onPointerLeave={() => setHot(false)}
      onFocus={() => setHot(true)}
      onBlur={() => setHot(false)}
      style={{ animationDelay: `${delayMs}ms` }}
      className={`dish-card group flex h-full cursor-pointer flex-col bg-transparent outline-none focus-visible:ring-1 focus-visible:ring-ink/30 ${
        item.available ? '' : 'is-stopped'
      }`}
    >
      <div className="relative aspect-[5/4] overflow-hidden bg-white">
        <img
          src={assetUrl(item.image)}
          alt=""
          className={`h-full w-full object-cover transition duration-700 ${
            item.available ? 'group-hover:scale-[1.02]' : ''
          }`}
        />
        {playable && item.video ? (
          <video
            ref={videoRef}
            className={`dish-video pointer-events-none absolute inset-0 h-full w-full object-cover ${
              playing ? 'is-on' : ''
            }`}
            src={assetUrl(item.video)}
            muted
            loop
            playsInline
            preload="none"
          />
        ) : null}
      </div>
      <div className="mt-4 flex items-baseline justify-between gap-4">
        <h3 className="font-serif text-[1.75rem] leading-none font-normal text-ink">{item.name}</h3>
        <p className={`shrink-0 font-serif text-[1.45rem] leading-none tabular-nums ${item.available ? 'text-ink' : 'text-muted'}`}>
          {formatPrice(item.price)}
        </p>
      </div>
      <p className="mt-2 line-clamp-2 min-h-[2.75rem] text-[15px] leading-snug text-muted">{item.description}</p>
      <p className="mt-3 text-[13px] tracking-[0.14em] text-muted uppercase">
        {item.weight}
        {item.available ? '' : ' · Нет в наличии'}
      </p>
    </article>
  );
}
