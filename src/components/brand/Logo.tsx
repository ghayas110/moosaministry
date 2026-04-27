/**
 * Moosa Ministry brand mark — split bowl with chopsticks and dumplings.
 * Pure SVG, scales via the `size` prop. Colors fixed to brand palette.
 */
import { cn } from "@/lib/utils";

type Props = {
  size?: number;
  withWordmark?: boolean;
  variant?: "full" | "mark";
  className?: string;
};

export function Logo({ size = 64, withWordmark = false, variant = "full", className }: Props) {
  const w = size;
  const h = withWordmark ? size : size;
  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Moosa Ministry"
      className={cn("select-none", className)}
    >
      {/* Split background — left cream, right tan */}
      <defs>
        <clipPath id="mm-circle">
          <circle cx="100" cy="100" r="92" />
        </clipPath>
      </defs>
      <g clipPath="url(#mm-circle)">
        <rect x="0" y="0" width="100" height="200" fill="#F5F0DC" />
        <rect x="100" y="0" width="100" height="200" fill="#D4A07A" />
      </g>

      {/* Bowl outer arc */}
      <path
        d="M 18 96 A 82 82 0 0 1 182 96"
        fill="none"
        stroke="#5C1A2E"
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* Bowl rim */}
      <line x1="22" y1="110" x2="178" y2="110" stroke="#5C1A2E" strokeWidth="3" />

      {/* Bowl body curve */}
      <path
        d="M 28 110 Q 100 196 172 110"
        fill="none"
        stroke="#5C1A2E"
        strokeWidth="3"
      />

      {/* Dumplings — left side (3 swirly) */}
      <g stroke="#5C1A2E" strokeWidth="2" fill="none" strokeLinecap="round">
        <ellipse cx="48" cy="92" rx="16" ry="14" />
        <path d="M 36 92 Q 48 80 60 92" />
        <path d="M 40 96 Q 48 88 56 96" />

        <ellipse cx="80" cy="94" rx="15" ry="13" />
        <path d="M 70 94 Q 80 84 90 94" />
        <path d="M 74 98 Q 80 92 86 98" />
      </g>

      {/* Dumplings — right side (2, with eyes) */}
      <g stroke="#5C1A2E" strokeWidth="2" fill="none" strokeLinecap="round">
        <ellipse cx="120" cy="94" rx="14" ry="13" />
        <line x1="113" y1="92" x2="118" y2="92" strokeWidth="2.5" />
        <line x1="123" y1="92" x2="128" y2="92" strokeWidth="2.5" />

        <ellipse cx="150" cy="94" rx="14" ry="13" />
        <line x1="143" y1="92" x2="148" y2="92" strokeWidth="2.5" />
        <line x1="153" y1="92" x2="158" y2="92" strokeWidth="2.5" />
      </g>

      {/* Chopsticks crossing into bowl */}
      <g stroke="#3A1F12" strokeWidth="6" strokeLinecap="round">
        <line x1="80" y1="90" x2="158" y2="22" />
        <line x1="92" y1="92" x2="170" y2="28" />
      </g>

      {/* Steam lines under bowl base */}
      <g stroke="#5C1A2E" strokeWidth="2" strokeLinecap="round">
        <line x1="58" y1="148" x2="142" y2="148" />
        <line x1="48" y1="160" x2="152" y2="160" />
        <line x1="58" y1="172" x2="142" y2="172" />
      </g>

      {/* Wordmark inside bowl */}
      <text
        x="100"
        y="138"
        textAnchor="middle"
        fontSize="14"
        fontFamily="'Noto Serif KR', Georgia, serif"
        fontWeight="700"
        fill="#3A1F12"
        letterSpacing="1.2"
      >
        MOOSA MINISTRY
      </text>
    </svg>
  );
}

export function LogoWordmark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "font-display text-xl tracking-[0.18em] text-cream",
        className
      )}
    >
      MOOSA · MINISTRY
    </span>
  );
}
