import { motion } from "motion/react";

/** Harflar 3D o‘q atrofida aylanib almashadigan matn */
export function FlipText({
  children,
  duration = 0.5,
  className,
}: {
  children: string;
  duration?: number;
  className?: string;
}) {
  const chars = children.split("");
  return (
    <span className={className}>
      {chars.map((c, i) => {
        const ch = c === " " ? " " : c;
        return (
          <span
            key={i}
            className="relative inline-block [perspective:10000px] [transform-style:preserve-3d]"
            aria-hidden="true"
          >
            <motion.span
              className="absolute inline-block [backface-visibility:hidden] [transform-origin:50%_25%]"
              initial={{ rotateX: 0 }}
              animate={{ rotateX: 90 }}
              transition={{ ease: "easeIn", duration, delay: i * 0.1 }}
            >
              {ch}
            </motion.span>
            <motion.span
              className="absolute inline-block [backface-visibility:hidden] [transform-origin:50%_100%]"
              initial={{ rotateX: 90 }}
              animate={{ rotateX: 0 }}
              transition={{ ease: "easeIn", duration, delay: i * 0.1 + 0.2 }}
            >
              {ch}
            </motion.span>
            <span className="invisible">{ch}</span>
          </span>
        );
      })}
      <span className="sr-only">{children}</span>
    </span>
  );
}
