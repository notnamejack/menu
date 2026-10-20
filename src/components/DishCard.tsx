import { useEffect, useRef, useState } from 'react';
import { assetUrl } from '../lib/assets';
import { formatPrice } from '../lib/format';
import type { VideoRegister } from '../lib/useVideoDirector';
import type { MenuItem } from '../types';

type DishCardProps = {
  item: MenuItem;
  register: VideoRegister;
  onOpen: (item: MenuItem) => void;
};

export function DishCard({ item, register, onOpen }: DishCardProps) {
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
      className={`group cursor-pointer border border-white/10 bg-ember/80 outline-none transition duration-500 hover:border-copper/50 ${
        item.available ? '' : 'is-stopped'
      }`}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-bark">
        <img
          src={assetUrl(item.image)}
          alt=""
          className={`h-full w-full object-cover transition duration-700 ${
            item.available ? 'group-hover:scale-[1.03]' : ''
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
        <div className="photo-scrim pointer-events-none absolute inset-0" />
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-4">
          <h3 className="font-serif text-[1.7rem] leading-none tracking-tight text-cream">{item.name}</h3>
          <p className="shrink-0 font-serif text-[1.35rem] leading-none text-copper">{formatPrice(item.price)}</p>
        </div>
        {!item.available ? (
          <span className="absolute left-4 top-4 bg-coal/85 px-3 py-2 text-sm tracking-[0.14em] text-cream uppercase">
            Нет в наличии
          </span>
        ) : null}
      </div>
      <div className="space-y-3 px-4 py-4">
        <p className="line-clamp-2 text-sand">{item.description}</p>
        <ul className="flex flex-wrap gap-2">
          {item.tags.map((tag) => (
            <li key={tag} className="tag border border-copper/30 px-2.5 py-1 text-[13px] tracking-[0.12em] text-sand uppercase">
              {tag}
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}
