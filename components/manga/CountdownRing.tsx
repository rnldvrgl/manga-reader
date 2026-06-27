"use client";

interface Props {
  seconds: number;
  total: number;
}

export function CountdownRing({ seconds, total }: Props) {
  const r = 14;
  const circ = 2 * Math.PI * r;
  const dash = circ * Math.max(0, seconds / total);
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 40 40"
      className="absolute inset-0 pointer-events-none -rotate-90"
      aria-hidden
    >
      <circle
        cx="20"
        cy="20"
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="text-muted"
      />
      <circle
        cx="20"
        cy="20"
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        style={{ transition: "stroke-dasharray 1s linear" }}
        className="text-foreground"
      />
    </svg>
  );
}
