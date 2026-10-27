import { useEffect, useRef, useState } from "react";
import NumberFlow from "@number-flow/react";

/** Ko‘rinish maydoniga kirganda 0 dan qiymatgacha aylanib chiqadigan raqam */
export function Counter({
  value,
  decimals = 0,
  prefix,
  suffix,
  className,
}: {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(value);
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) {
          setShown(value);
          io.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [value]);
  return (
    <span ref={ref} className={className}>
      <NumberFlow
        value={shown}
        locales="ru-RU"
        prefix={prefix}
        suffix={suffix}
        format={{ minimumFractionDigits: decimals, maximumFractionDigits: decimals }}
        transformTiming={{ duration: 1400, easing: "cubic-bezier(0.16, 1, 0.3, 1)" }}
        spinTiming={{ duration: 1400, easing: "cubic-bezier(0.16, 1, 0.3, 1)" }}
      />
    </span>
  );
}
