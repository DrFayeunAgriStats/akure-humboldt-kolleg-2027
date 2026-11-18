'use client';
import {useEffect, useRef, useState} from 'react';

/** Approved institutional logo (self-hosted copy) with a text fallback if it cannot be loaded. */
export function InstitutionLogo({src, alt, fallback, width, height, className = ''}: {
  src: string; alt: string; fallback: string; width: number; height: number; className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const ref = useRef<HTMLImageElement>(null);
  // An image that failed before hydration never fires onError in React, so check once on mount.
  useEffect(() => { const i = ref.current; if (i && i.complete && i.naturalWidth === 0) setFailed(true); }, []);
  if (failed) return <span className={'inst-logo-fallback ' + className} role="img" aria-label={alt}>{fallback}</span>;
  // eslint-disable-next-line @next/next/no-img-element -- approved remote logo; no image optimisation proxy needed
  return <img ref={ref} className={'inst-logo ' + className} src={src} alt={alt} width={width} height={height} loading="lazy" decoding="async"
    onError={() => setFailed(true)} />;
}
