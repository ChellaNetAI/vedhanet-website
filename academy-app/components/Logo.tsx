"use client";

import { useId } from "react";

export function Logo({ size = 38 }: { size?: number }) {
  const uid = useId();
  const ring = `mRing-${uid}`;
  const v = `mV-${uid}`;
  const bg = `mBg-${uid}`;

  return (
    <span
      style={{ width: size, height: size, background: "#0A0714" }}
      className="flex flex-shrink-0 items-center justify-center overflow-hidden rounded-full"
    >
      <svg viewBox="0 0 100 100" role="img" aria-label="VedhaNet Academy logo" style={{ width: "100%", height: "100%" }}>
        <defs>
          <linearGradient id={ring} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3B5BFF" />
            <stop offset="50%" stopColor="#8E3FE8" />
            <stop offset="100%" stopColor="#EC4899" />
          </linearGradient>
          <linearGradient id={v} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8E7FE8" />
            <stop offset="55%" stopColor="#C13BE0" />
            <stop offset="100%" stopColor="#FF2E86" />
          </linearGradient>
          <radialGradient id={bg} cx="50%" cy="38%" r="72%">
            <stop offset="0%" stopColor="#2A1B54" />
            <stop offset="100%" stopColor="#140B2B" />
          </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="47" fill={`url(#${bg})`} stroke={`url(#${ring})`} strokeWidth="5" />
        <path d="M28 30 L44 30 L50 58 L56 30 L72 30 L58 74 L42 74 Z" fill={`url(#${v})`} />
      </svg>
    </span>
  );
}
