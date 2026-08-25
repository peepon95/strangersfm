import { motion } from "motion/react";
import { useMemo } from "react";
import scrap from "@/assets/note-scrap.png.asset.json";

/** Deterministic pseudo-random so SSR and the client render the same pile. */
function seeded(seed: number) {
  let t = seed + 0x6d2b79f5;
  return () => {
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Scrap = {
  left: number; // vw %
  bottom: number; // px above the floor of the pile
  size: number; // px width
  rotate: number; // final resting rotation
  spin: number; // rotation during the fall
  flip: boolean;
  delay: number;
  drift: number; // horizontal sway while falling (px)
  brightness: number;
};

/**
 * One crumpled note per collected stranger. On page load they tumble
 * from the top of the screen and land in a loose pile along the bottom,
 * like the jar filling up on textjar.
 */
export function FallingNotes({ count }: { count: number }) {
  const scraps = useMemo<Scrap[]>(
    () =>
      Array.from({ length: count }, (_, i) => {
        const rnd = seeded(i * 97 + 13);
        const row = Math.floor(i / 9); // stack a new layer every 9 notes
        return {
          left: 2 + rnd() * 88,
          bottom: row * 26 + rnd() * 18,
          size: 64 + rnd() * 64,
          rotate: -24 + rnd() * 48,
          spin: -140 + rnd() * 280,
          flip: rnd() > 0.5,
          delay: 0.35 + i * 0.16 + rnd() * 0.1,
          drift: -50 + rnd() * 100,
          brightness: 0.92 + rnd() * 0.14,
        };
      }),
    [count],
  );

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-[5] overflow-hidden"
    >
      {scraps.map((s, i) => (
        <motion.img
          key={i}
          src={scrap.url}
          alt=""
          width={s.size}
          height={s.size}
          className="absolute will-change-transform"
          style={{
            left: `${s.left}%`,
            bottom: s.bottom,
            filter: `brightness(${s.brightness}) drop-shadow(0 6px 8px hsl(var(--ink) / 0.18))`,
          }}
          initial={{ y: "-115vh", x: s.drift, rotate: s.spin, opacity: 0, scaleX: s.flip ? -1 : 1 }}
          animate={{ y: 0, x: 0, rotate: s.rotate, opacity: 1, scaleX: s.flip ? -1 : 1 }}
          transition={{
            delay: s.delay,
            opacity: { duration: 0.25, delay: s.delay },
            type: "spring",
            stiffness: 52,
            damping: 11,
            mass: 1.1,
          }}
        />
      ))}
    </div>
  );
}
