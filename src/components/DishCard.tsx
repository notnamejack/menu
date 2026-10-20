import { useEffect, useRef, useState } from 'react';
import { assetUrl } from '../lib/assets';
import { formatPrice } from '../lib/format';
import type { VideoRegister } from '../lib/useVideoDirector';
import type { MenuItem } from '../types';

type DishCardProps = {
  item: MenuItem;
  register: VideoRegister;
  onOpen: (item: MenuItem) => void;
  delayMs?: number;
};

export function DishCard({ item, register, onOpen, delayMs = 0 }: DishCardProps) {
  const cardRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const playable = Boolean(item.video) && item.available;

  useEffect(() => {
    if (!playable || !cardRef.current || !videoRef.current) return;
    return register(item.id, cardRef.current, videoRef.current);
  }, [item.id, playable, register]);

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
      ref={cardRef}
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
      style={{ animationDelay: `${delayMs}ms` }}
      className={`dish-card group flex h-full cursor-pointer flex-col bg-transparent outline-none focus-visible:ring-1 focus-visible:ring-ink/30 ${
        item.available ? '' : 'is-stopped'
      }`}
    >
      <div className="relative aspect-[5/4] overflow-hidden bg-paper">
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
            preload="metadata"
          />
        ) : null}
      </div>
      <div className="mt-4 flex items-end gap-3">
        <h3 className="font-serif text-[1.85rem] leading-none font-normal tracking-tight text-ink">{item.name}</h3>
        <span aria-hidden className="mb-[0.35rem] h-px min-w-6 flex-1 border-b border-dotted border-ink/35" />
        <p className={`shrink-0 font-serif text-[1.65rem] leading-none ${item.available ? 'text-ink' : 'text-muted'}`}>
          {formatPrice(item.price)}
        </p>
      </div>
      <p className="mt-2 line-clamp-2 min-h-[3.15rem] font-serif text-[1.15rem] leading-snug text-muted italic">
        {item.description}
      </p>
      <p className="mt-2 text-base tracking-wide text-ink">{item.weight}</p>
      {!item.available ? (
        <p className="mt-1 text-base tracking-[0.08em] text-muted uppercase">Нет в наличии</p>
      ) : (
        <p className="mt-1 text-base tracking-[0.08em] text-transparent uppercase" aria-hidden>
          Нет в наличии
        </p>
      )}
    </article>
  );
}
