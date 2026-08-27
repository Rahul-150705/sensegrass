// The Recast logo mark (the gradient "R" with the code brackets). Used anywhere
// the brand appears — app rail, landing header/footer, login. The full lockup
// (mark + wordmark + tagline) lives at /recast-logo.png for larger surfaces.
export default function RecastMark({ className = 'h-6 w-6' }: { className?: string }) {
  return (
    <img
      src="/recast-mark.png"
      alt="Recast"
      className={`shrink-0 object-contain select-none ${className}`}
      draggable={false}
    />
  );
}
