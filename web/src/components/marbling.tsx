import { useEffect, useState, type ComponentProps } from "react";
import { cn } from "../lib/utils";

/* Suminagashi / lak-marmar: tomchilar + taroq chiziqlari + to‘lqinlar,
   har piksel uchun teskari xaritalash orqali hisoblanadi (canvas → PNG). */

type RGB = [number, number, number];
const hex = (h: string): RGB => {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 1831565813) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

import { blend, palette } from "../theme";

/** Palitralar tanlangan ranglardan hosil bo'ladi */
export function palettes() {
  const t = palette();
  const dark = blend(t.depth, "#000000", 0.2);
  return {
    /** Qorong'i fon — tugma foni */
    ink: {
      bg: dark,
      inks: [t.ink, blend(t.ink, t.seal, 0.35), blend(t.ink, "#000000", 0.3), blend(t.ink, t.seal, 0.6)],
      clear: blend(dark, t.ink, 0.22),
    },
    /** Och qog'oz — «Kelajak» foni */
    mist: {
      bg: t.paper,
      inks: [blend(t.paper, t.ink, 0.06), blend(t.paper, t.seal, 0.09), blend(t.paper, t.ink, 0.1), blend(t.paper, t.seal, 0.05)],
      clear: t.paper,
    },
    /** Rangli chiziq */
    endpaper: { bg: t.paper, inks: [t.seal, t.dilute, t.depth, t.ink], clear: t.paper },
  };
}
export type PaletteName = "ink" | "mist" | "endpaper";

type Op =
  | { kind: "drop"; x: number; y: number; r: number; color: RGB }
  | { kind: "tine"; x: number; y: number; dx: number; dy: number; alpha: number; lambda: number }
  | { kind: "wave"; axis: "x" | "y"; amp: number; period: number; phase: number };

function buildOps(w: number, h: number, name: PaletteName, seed: number) {
  const rand = rng(seed);
  const p = palettes()[name];
  const ops: Op[] = [];
  const clusters = name === "endpaper" ? 7 : 4;
  const base = Math.sqrt(((name === "mist" ? 0.55 : 0.8) * w * h) / (Math.PI * clusters * 9 * 0.47));
  for (let c = 0; c < clusters; c++) {
    const x = ((c + 0.5 + (rand() - 0.5) * 0.6) / clusters) * w;
    const y = (0.2 + rand() * 0.6) * h;
    const rings = 7 + Math.floor(rand() * 5);
    for (let i = 0; i < rings; i++) {
      const pigment = i % 2 === 0;
      ops.push({
        kind: "drop",
        x,
        y,
        r: base * (pigment ? 0.35 + rand() * 0.25 : 0.6 + rand() * 0.5),
        color: hex(pigment ? p.inks[Math.floor(rand() * p.inks.length)] : p.clear),
      });
    }
  }
  for (let i = 0; i < 5; i++) {
    ops.push({
      kind: "tine",
      x: 0,
      y: ((i + 0.5) / 5) * h,
      dx: i % 2 === 0 ? 1 : -1,
      dy: 0,
      alpha: w * 0.12,
      lambda: h * 0.06,
    });
  }
  ops.push({ kind: "wave", axis: "y", amp: h * 0.05, period: w * 0.45, phase: rand() * Math.PI * 2 });
  ops.push({ kind: "wave", axis: "x", amp: w * 0.015, period: h * 0.9, phase: rand() * Math.PI * 2 });
  return ops;
}

function sample(px: number, py: number, ops: Op[], bg: RGB): RGB {
  let x = px;
  let y = py;
  for (let i = ops.length - 1; i >= 0; i--) {
    const o = ops[i];
    if (o.kind === "wave") {
      if (o.axis === "y") y -= o.amp * Math.sin((2 * Math.PI * x) / o.period + o.phase);
      else x -= o.amp * Math.sin((2 * Math.PI * y) / o.period + o.phase);
    } else if (o.kind === "tine") {
      const d = Math.abs((x - o.x) * o.dy - (y - o.y) * o.dx);
      const m = (o.alpha * o.lambda) / (d + o.lambda);
      x -= m * o.dx;
      y -= m * o.dy;
    } else {
      const dx = x - o.x;
      const dy = y - o.y;
      const d2 = dx * dx + dy * dy;
      const r2 = o.r * o.r;
      if (d2 < r2) return o.color;
      const s = Math.sqrt(1 - r2 / d2);
      x = o.x + dx * s;
      y = o.y + dy * s;
    }
  }
  return bg;
}

const cache = new Map<string, string>();
function render(name: PaletteName, w: number, h: number, seed: number) {
  const key = `${name}-${w}-${h}-${seed}-${palette().ink}-${palette().seal}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  const img = ctx.createImageData(w, h);
  const ops = buildOps(w, h, name, seed);
  const bg = hex(palettes()[name].bg);
  const sub = [
    [0.25, 0.25],
    [0.75, 0.25],
    [0.25, 0.75],
    [0.75, 0.75],
  ];
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let r = 0;
      let g = 0;
      let b = 0;
      for (const [ox, oy] of sub) {
        const c = sample(x + ox, y + oy, ops, bg);
        r += c[0];
        g += c[1];
        b += c[2];
      }
      const i = (y * w + x) * 4;
      img.data[i] = r / 4;
      img.data[i + 1] = g / 4;
      img.data[i + 2] = b / 4;
      img.data[i + 3] = 255;
    }
  ctx.putImageData(img, 0, 0);
  const url = canvas.toDataURL("image/png");
  cache.set(key, url);
  return url;
}

/** Marmar teksturasini bo‘sh vaqtda hisoblab, data-URL qaytaradi */
export function useMarble(name: PaletteName, w = 640, h = 220, seed = 7) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    const run = () => setUrl(render(name, w, h, seed));
    const idle = (window as Window & { requestIdleCallback?: (cb: () => void) => number }).requestIdleCallback;
    if (idle) idle(run);
    else setTimeout(run, 60);
  }, [name, w, h, seed]);
  return url;
}

/** Sekin suzib yuruvchi marmar fon (aurora) */
export function AuroraBackground({
  className,
  children,
  showRadialGradient = true,
  ...rest
}: ComponentProps<"div"> & { showRadialGradient?: boolean }) {
  const url = useMarble("mist", 900, 520, 23);
  return (
    <div className={cn("relative isolate bg-paper text-depth", className)} {...rest}>
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div
          className={cn(
            "absolute inset-0 bg-[length:160%_auto] bg-repeat-x transition-opacity duration-1000 motion-safe:animate-aurora",
            url ? "opacity-100" : "opacity-0",
            showRadialGradient &&
              "[mask-image:radial-gradient(ellipse_at_85%_10%,black_20%,transparent_78%)]",
          )}
          style={url ? { backgroundImage: `url(${url})` } : undefined}
        />
      </div>
      {children}
    </div>
  );
}

/** Kitob forzatsi kabi rangli marmar chiziq */
export function Endpaper({ className, seed = 11 }: { className?: string; seed?: number }) {
  const url = useMarble("endpaper", 900, 160, seed);
  return (
    <div
      aria-hidden="true"
      className={cn(
        "h-28 w-full bg-paper bg-cover bg-center transition-opacity duration-1000",
        url ? "opacity-100" : "opacity-0",
        className,
      )}
      style={url ? { backgroundImage: `url(${url})` } : undefined}
    />
  );
}
