import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useT } from "../lib/deck";
import { scrollToY, step } from "../lib/scroll";

export function KeyboardHelp() {
  const t = useT();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el.closest("input, textarea, [contenteditable]") || e.metaKey || e.ctrlKey || e.altKey) return;
      switch (e.key) {
        case "ArrowRight":
        case "ArrowDown":
        case "PageDown":
        case " ":
          if (el.closest("button") && e.key === " ") return;
          e.preventDefault();
          step(1);
          break;
        case "ArrowLeft":
        case "ArrowUp":
        case "PageUp":
          e.preventDefault();
          step(-1);
          break;
        case "Home":
          e.preventDefault();
          scrollToY(0);
          break;
        case "End":
          e.preventDefault();
          scrollToY(document.documentElement.scrollHeight);
          break;
        case "f":
        case "F":
          if (document.fullscreenElement) document.exitFullscreen();
          else document.documentElement.requestFullscreen?.();
          break;
        case "?":
          setOpen((o) => !o);
          break;
        case "Escape":
          setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!open) return null;
  const keys: [string, string][] = [
    ["→  ↓  PageDown  ␣", t.help.next],
    ["←  ↑  PageUp", t.help.prev],
    [t.help.home, t.help.homeEnd],
    ["F", t.help.fullscreen],
    ["?", t.help.toggle],
  ];
  return (
    <div
      role="dialog"
      aria-label={t.help.title}
      className="fixed right-6 bottom-6 z-50 w-[340px] max-w-[calc(100vw-2rem)] rounded-2xl border border-mist bg-paper p-6 shadow-[0_18px_40px_-18px_color-mix(in_srgb,var(--color-depth)_45%,transparent)]"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-normal text-depth">{t.help.title}</h2>
        <button type="button" onClick={() => setOpen(false)} aria-label={t.help.close} className="grid size-8 place-items-center rounded-full text-dilute hover:bg-mist hover:text-depth">
          <X className="size-4" />
        </button>
      </div>
      <dl className="mt-4 divide-y divide-mist">
        {keys.map(([k, v]) => (
          <div key={k} className="flex items-baseline justify-between gap-4 py-2.5">
            <dt className="text-sm text-depth">{k}</dt>
            <dd className="text-sm text-dilute">{v}</dd>
          </div>
        ))}
      </dl>
      <h3 className="label mt-6 text-dilute">{t.help.live}</h3>
      <dl className="mt-2 divide-y divide-mist">
        {t.help.liveItems.map(([k, v]) => (
          <div key={k} className="py-2.5">
            <dt className="text-sm text-depth">{k}</dt>
            <dd className="text-sm text-dilute">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="note mt-4">{t.help.clicker}</p>
    </div>
  );
}
