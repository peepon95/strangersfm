import { motion } from "motion/react";
import plane from "@/assets/plane.png";

/** Deterministic pseudo random so every plane keeps its own flight path. */
function rand(seed: number, salt: number) {
  const x = Math.sin(seed * 9301 + salt * 49297) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * Ambient hand-drawn paper planes drifting across the page.
 * One plane per note collected, so the sky fills up as strangers are added.
 */
export function PaperPlanes({ count = 4 }: { count?: number }) {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {Array.from({ length: count }).map((_, i) => {
        const top = `${6 + rand(i + 1, 1) * 82}%`;
        const size = 26 + rand(i + 1, 2) * 34;
        const delay = rand(i + 1, 3) * 12;
        const duration = 12 + rand(i + 1, 4) * 9;
        const drift = (rand(i + 1, 5) - 0.5) * 180;
        const tilt = (rand(i + 1, 6) - 0.5) * 22;
        const opacity = 0.09 + rand(i + 1, 7) * 0.09;
        const reverse = rand(i + 1, 8) > 0.6;

        return (
          <motion.img
            key={i}
            src={plane}
            alt=""
            loading="lazy"
            width={816}
            height={816}
            className="absolute h-auto"
            style={{ top, width: size, opacity, scaleX: reverse ? -1 : 1 }}
            initial={{ x: reverse ? "110vw" : "-20vw", y: 0, rotate: tilt }}
            animate={{
              x: reverse ? "-20vw" : "110vw",
              y: [0, drift * 0.4, -drift * 0.3, drift],
              rotate: [tilt, tilt + 7, tilt - 6, tilt + 2],
            }}
            transition={{
              duration,
              delay,
              repeat: Infinity,
              repeatDelay: 2,
              ease: "linear",
              y: { duration, delay, repeat: Infinity, repeatDelay: 2, ease: "easeInOut" },
              rotate: { duration, delay, repeat: Infinity, repeatDelay: 2, ease: "easeInOut" },
            }}
          />
        );
      })}
    </div>
  );
}
