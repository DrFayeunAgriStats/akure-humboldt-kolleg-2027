/** Conference mark: three overlapping fields (biodiversity, climate, food) meeting at one point. Decorative. */
export function NexusMark({size = 36, className}: {size?: number; className?: string}) {
  return <svg className={className} width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" focusable="false">
    <circle cx="15" cy="15" r="10" fill="none" stroke="currentColor" strokeWidth="2" opacity=".9" />
    <circle cx="25" cy="15" r="10" fill="none" stroke="currentColor" strokeWidth="2" opacity=".9" />
    <circle cx="20" cy="24" r="10" fill="none" stroke="var(--gold-500)" strokeWidth="2" />
    <circle cx="20" cy="18" r="2.4" fill="var(--gold-500)" />
  </svg>;
}
