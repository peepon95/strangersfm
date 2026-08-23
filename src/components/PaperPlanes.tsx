import { motion } from "motion/react";
import plane from "@/assets/plane.png";

type Flight = {
  top: string;
  size: number;
  delay: number;
  duration: number;
  drift: number;
  tilt: number;
  opacity: number;
  reverse?: boolean;
};

const FLIGHTS: Flight[] = [
  { top: "12%", size: 54, delay: 0.6, duration: 13, drift: 60, tilt: -8, opacity: 0.16 },
  { top: "34%", size: 34, delay: 4.2, duration: 17, drift: -70, tilt: 6, opacity: 0.12 },
  { top: "62%", size: 44, delay: 2.4, duration: 15, drift: 90, tilt: -12, opacity: 0.14, reverse: true },
  { top: "82%", size: 28, delay: 7.5, duration: 19, drift: -40, tilt: 10, opacity: 0.1 },
];

/** Ambient hand-drawn paper planes drifting across the page. */
export function PaperPlanes() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {FLIGHTS.map((f, i) => (
        <motion.img
          key={i}
          src={plane}
          alt=""
          loading="lazy"
          width={816}
          height={816}
          className="absolute h-auto"
          style={{
            top: f.top,
            width: f.size,
            opacity: f.opacity,
            scaleX: f.reverse ? -1 : 1,
          }}
          initial={{ x: f.reverse ? "110vw" : "-20vw", y: 0, rotate: f.tilt }}
          animate={{
            x: f.reverse ? "-20vw" : "110vw",
            y: [0, f.drift * 0.4, -f.drift * 0.3, f.drift],
            rotate: [f.tilt, f.tilt + 7, f.tilt - 6, f.tilt + 2],
          }}
          transition={{
            duration: f.duration,
            delay: f.delay,
            repeat: Infinity,
            repeatDelay: 3,
            ease: "linear",
            y: { duration: f.duration, delay: f.delay, repeat: Infinity, repeatDelay: 3, ease: "easeInOut" },
            rotate: { duration: f.duration, delay: f.delay, repeat: Infinity, repeatDelay: 3, ease: "easeInOut" },
          }}
        />
      ))}
    </div>
  );
}
