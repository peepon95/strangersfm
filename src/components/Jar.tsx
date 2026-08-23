import { motion } from "motion/react";
import jar from "@/assets/jar.png";

export function Jar({ onPull, idle }: { onPull: () => void; idle: boolean }) {
  return (
    <motion.button
      type="button"
      onClick={onPull}
      aria-label="Pull a note out of the jar"
      className="group relative block cursor-pointer select-none focus-visible:outline-none"
      initial={{ y: "-115vh", rotate: -18 }}
      animate={{
        y: [null, 0, -90, 0, -28, 0, -8, 0],
        rotate: [null, 6, 2, -3, 1, -1, 0, 0],
      }}
      transition={{
        duration: 2.1,
        delay: 0.2,
        times: [0, 0.34, 0.5, 0.63, 0.75, 0.85, 0.93, 1],
        ease: ["easeIn", "easeOut", "easeIn", "easeOut", "easeIn", "easeOut", "easeIn"],
      }}
      whileHover={{ rotate: -2, y: -6 }}
      whileTap={{ scale: 0.96, rotate: 3 }}
      style={{ transformOrigin: "50% 100%" }}
    >
      {/* squash & stretch on landing */}
      <motion.span
        className="block origin-bottom"
        initial={{ scaleY: 1.12, scaleX: 0.92 }}
        animate={{
          scaleY: [1.12, 0.82, 1.06, 0.93, 1.02, 0.98, 1],
          scaleX: [0.92, 1.16, 0.96, 1.05, 0.99, 1.01, 1],
        }}
        transition={{
          duration: 1.5,
          delay: 0.74,
          times: [0, 0.06, 0.2, 0.42, 0.6, 0.8, 1],
          ease: "easeOut",
        }}
      >
        <motion.span
          className="block"
          animate={idle ? { rotate: [0, -1.6, 0, 1.6, 0] } : { rotate: 0 }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2.4 }}
        >
          <img
            src={jar}
            alt="A hand-drawn jar full of folded handwritten notes"
            width={896}
            height={1024}
            className="h-[52vh] max-h-[540px] w-auto"
          />
        </motion.span>
      </motion.span>

      {/* contact shadow that reacts to the drop */}
      <motion.span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -bottom-3 mx-auto h-3 rounded-[100%] bg-ink/15 blur-[6px]"
        initial={{ width: "18%", opacity: 0 }}
        animate={{
          width: ["18%", "72%", "48%", "66%", "58%", "64%"],
          opacity: [0, 1, 0.75, 0.95, 0.85, 0.9],
        }}
        transition={{ duration: 1.6, delay: 0.68, ease: "easeOut" }}
      />
    </motion.button>
  );
}
