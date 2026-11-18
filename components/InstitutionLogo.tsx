'use client';
import {useState} from 'react';

/** Approved institutional logo (remote file) with a text fallback if it cannot be loaded. */
export function InstitutionLogo({src, alt, fallback, width, height, className = ''}: {
  src: string; alt: string; fallback: string; width: number; height: number; className?: string;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) return <span className={'inst-logo-fallback ' + className} role="img" aria-label={alt}>{fallback}</span>;
  // eslint-disable-next-line @next/next/no-img-element -- approved remote logo; no image optimisation proxy needed
  return <img className={'inst-logo ' + className} src={src} alt={alt} width={width} height={height} loading="lazy" decoding="async"
    onError={() => setFailed(true)} />;
}
