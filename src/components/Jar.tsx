import { motion } from "motion/react";
import jar from "@/assets/jar.png";

export function Jar({ onPull, idle }: { onPull: () => void; idle: boolean }) {
  return (
    <motion.button
      type="button"
      onClick={onPull}
      aria-label="Pull a note out of the jar"
      className="group relative block cursor-pointer select-none focus-visible:outline-none"
      initial={{ y: "-125vh", rotate: -14 }}
      animate={{
        y: [null, 0, -132, 0, -46, 0, -14, 0, -4, 0],
        rotate: [null, 5, 1.5, -2.5, 1, -1, 0.4, 0, 0, 0],
      }}
      transition={{
        duration: 2.4,
        delay: 0.15,
        times: [0, 0.26, 0.42, 0.56, 0.67, 0.76, 0.84, 0.9, 0.95, 1],
        ease: [
          "easeIn",
          "easeOut",
          "easeIn",
          "easeOut",
          "easeIn",
          "easeOut",
          "easeIn",
          "easeOut",
          "easeIn",
        ],
      }}
      whileHover={{ rotate: -2, y: -6 }}
      whileTap={{ scale: 0.96, rotate: 3 }}
      style={{ transformOrigin: "50% 100%" }}
    >
      {/* squash & stretch on landing */}
      <motion.span
        className="block origin-bottom"
        initial={{ scaleY: 1.16, scaleX: 0.89 }}
        animate={{
          scaleY: [1.16, 0.74, 1.09, 0.9, 1.04, 0.97, 1.01, 1],
          scaleX: [0.89, 1.24, 0.95, 1.07, 0.98, 1.02, 0.99, 1],
        }}
        transition={{
          duration: 1.75,
          delay: 0.77,
          times: [0, 0.05, 0.18, 0.36, 0.53, 0.7, 0.86, 1],
          ease: "easeOut",
        }}
      >
        <motion.span
          className="block"
          animate={idle ? { rotate: [0, -1.6, 0, 1.6, 0] } : { rotate: 0 }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2.6 }}
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
        className="pointer-events-none absolute inset-x-0 -bottom-3 mx-auto h-3 rounded-[100%] bg-ink/15 blur-[7px]"
        initial={{ width: "14%", opacity: 0 }}
        animate={{
          width: ["14%", "84%", "40%", "74%", "52%", "70%", "62%", "68%"],
          opacity: [0, 1, 0.6, 0.92, 0.74, 0.9, 0.84, 0.88],
        }}
        transition={{
          duration: 1.7,
          delay: 0.72,
          times: [0, 0.05, 0.18, 0.36, 0.53, 0.7, 0.86, 1],
          ease: "easeOut",
        }}
      />

    </motion.button>
  );
}
