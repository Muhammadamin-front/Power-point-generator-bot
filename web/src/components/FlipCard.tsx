import { useState } from "react";
import { RotateCw } from "lucide-react";
import { cn } from "../lib/utils";

/** 3D aylanadigan karta: old tomonda asosiy so‘z, orqada izoh */
export function FlipCard({ word, label, meaning, text, className }: { word: string; label: string; meaning: string; text: string; className?: string }) {
  const [hover, setHover] = useState(false);
  const [pinned, setPinned] = useState(false);
  const flipped = hover || pinned;
  return (
    <button
      type="button"
      aria-pressed={pinned}
      aria-label={`${label ? `${label}: ` : ""}${word}. ${meaning}. ${text}`}
      className={cn("group relative h-[320px] w-full cursor-pointer text-left [perspective:2000px]", className)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={() => setPinned((p) => !p)}
    >
      <div
        className={cn(
          "relative h-full w-full [transform-style:preserve-3d]",
          "transition-[transform] duration-700 ease-[cubic-bezier(0.77,0,0.175,1)] motion-reduce:transition-none",
          flipped ? "[transform:rotateY(180deg)]" : "[transform:rotateY(0deg)]",
        )}
      >
        <div className="absolute inset-0 flex flex-col justify-between rounded-2xl border border-mist bg-paper p-6 [backface-visibility:hidden]">
          <div className="flex items-start justify-between gap-3">
            <span className="label text-dilute">{label}</span>
            <RotateCw aria-hidden="true" className="size-4 shrink-0 text-feather transition-transform duration-500 group-hover:-rotate-12" />
          </div>
          <span className="vn self-center text-center text-[clamp(1.7rem,2.5vw,2.5rem)] leading-tight text-balance text-depth">{word}</span>
          <span className="text-base font-normal text-ink">{meaning}</span>
        </div>
        <div className="absolute inset-0 flex flex-col overflow-hidden rounded-2xl bg-depth p-6 text-paper [backface-visibility:hidden] [transform:rotateY(180deg)]">
          <span className="vn text-2xl text-seal-dark">{word}</span>
          <span className="mt-2 text-lg font-normal">{meaning}</span>
          <p className="mt-3 text-[0.92rem] leading-relaxed text-mist">{text}</p>
          <span className="label mt-auto pt-3 text-feather">{label}</span>
        </div>
      </div>
    </button>
  );
}
