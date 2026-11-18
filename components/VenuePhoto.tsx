'use client';
import {useEffect, useRef, useState} from 'react';

/** Original supplied campus gate photograph; if the locally hosted image cannot load, show a neutral placeholder. */
export function VenuePhoto({src, alt}: {src: string; alt: string}) {
  const [failed, setFailed] = useState(false);
  const ref = useRef<HTMLImageElement>(null);
  // An image that failed before hydration never fires onError in React, so check once on mount.
  useEffect(() => { const i = ref.current; if (i && i.complete && i.naturalWidth === 0) setFailed(true); }, []);
  if (failed) return <div className="venue-photo-fallback" role="img" aria-label={alt}><span>FUTA · Akure</span></div>;
  // eslint-disable-next-line @next/next/no-img-element -- original supplied photograph served unmodified
  return <img ref={ref} src={src} alt={alt} width={1200} height={800} loading="lazy" decoding="async" onError={() => setFailed(true)} />;
}
