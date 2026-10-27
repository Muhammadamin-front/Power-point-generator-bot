import type { ElementType, ReactNode } from "react";
import { cn } from "../lib/utils";

/** So‘zma-so‘z xiralikdan chiqib keladigan sarlavha */
export function Words({ text, as: Tag = "span", className, start = 0 }: { text: string; as?: ElementType; className?: string; start?: number }) {
  const words = text.split(" ");
  return (
    <Tag className={cn(className)} data-words="">
      {words.map((w, i) => (
        <span key={i}>
          <span className="w" style={{ "--i": i + start } as React.CSSProperties}>
            {w}
          </span>
          {i < words.length - 1 ? " " : null}
        </span>
      ))}
    </Tag>
  );
}

/** Chap tomonda vertikal yozuv + kontent */
export function Vertical({ label, children, className, tone = "text-dilute" }: { label: string; children: ReactNode; className?: string; tone?: string }) {
  if (!label) return <div className={className}>{children}</div>;
  return (
    <div className={cn("flex items-start gap-[clamp(1rem,2vw,1.75rem)]", className)}>
      <span
        className={cn("vn shrink-0 pt-2 text-[clamp(1.05rem,1.5vw,1.45rem)] leading-none tracking-[0.18em] whitespace-nowrap [writing-mode:vertical-rl]", tone)}
        aria-hidden="true"
      >
        {label}
      </span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
