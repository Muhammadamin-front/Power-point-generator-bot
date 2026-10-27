import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "../lib/utils";
import { hsl, palette, rgbString } from "../theme";

/* Oqim maydoni bo‘ylab suzuvchi zarrachalar (lak izlari) */
const DENSITY = { sparse: 600, medium: 1200, dense: 2000 } as const;
/** Zarrachalar rangi tanlangan asosiy rangdan olinadi */
function themeFor() {
  const t = palette();
  const [h, sat, light] = hsl(t.ink);
  const [hAccent] = hsl(t.seal);
  let range = ((hAccent - h + 540) % 360) - 180; // asosiy rangdan urg'u rangiga eng qisqa yo'l
  range = Math.max(-40, Math.min(40, range));
  return { hueStart: h, hueRange: range, saturation: Math.max(35, Math.min(80, sat)), lightness: Math.max(28, Math.min(48, light + 8)), bg: rgbString(t.paper), trail: 0.045, size: 0.9 };
}

function angleAt(x: number, y: number, t: number) {
  const s = 0.0025;
  return (
    Math.sin(x * s + t * 7e-4) * Math.PI +
    Math.cos(y * s + t * 5e-4) * Math.PI +
    Math.sin((x + y) * s * 0.6 + t * 9e-4) * Math.PI * 0.6 +
    Math.cos((x - y) * s * 0.4 + t * 6e-4) * Math.PI * 0.4
  );
}

export function ParticleFlow({
  className,
  children,
  density = "medium",
}: {
  className?: string;
  children?: ReactNode;
  density?: keyof typeof DENSITY;
}) {
  const host = useRef<HTMLDivElement>(null);
  const cvs = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = host.current;
    const canvas = cvs.current;
    if (!el || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const th = themeFor();
    const count = DENSITY[density];
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0;
    let h = 0;
    let raf = 0;
    let t = 0;
    let visible = false;
    type P = { x: number; y: number; speed: number; hue: number; life: number; max: number };
    let ps: P[] = [];
    const spawn = (): P => {
      const max = 200 + Math.floor(Math.random() * 300);
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        speed: 0.9 + Math.random() * 1.5,
        hue: th.hueStart + Math.random() * th.hueRange,
        life: Math.floor(Math.random() * max),
        max,
      };
    };
    const fit = () => {
      const r = el.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = Math.max(1, r.width);
      h = Math.max(1, r.height);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = `rgb(${th.bg})`;
      ctx.fillRect(0, 0, w, h);
      ps = Array.from({ length: count }, spawn);
    };
    const frame = () => {
      raf = 0;
      t++;
      ctx.fillStyle = `rgba(${th.bg}, ${th.trail})`;
      ctx.fillRect(0, 0, w, h);
      for (const p of ps) {
        const a = angleAt(p.x, p.y, t);
        p.x += Math.cos(a) * p.speed;
        p.y += Math.sin(a) * p.speed;
        p.life++;
        if (p.life > p.max) {
          p.x = Math.random() * w;
          p.y = Math.random() * h;
          p.life = 0;
          p.hue = th.hueStart + Math.random() * th.hueRange;
          continue;
        }
        if (p.x < 0) p.x += w;
        else if (p.x > w) p.x -= w;
        if (p.y < 0) p.y += h;
        else if (p.y > h) p.y -= h;
        const k = p.life / p.max;
        const alpha = Math.min(k * 8, 1) * Math.min((1 - k) * 6, 1) * 0.8;
        const hue = (p.hue + (a / (Math.PI * 2)) * 12 + 360) % 360;
        ctx.beginPath();
        ctx.arc(p.x, p.y, th.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${hue}, ${th.saturation}%, ${th.lightness}%, ${alpha})`;
        ctx.fill();
      }
      if (visible && !reduced) raf = requestAnimationFrame(frame);
    };
    const io = new IntersectionObserver(([e]) => {
      visible = e?.isIntersecting ?? false;
      if (visible && !raf) raf = requestAnimationFrame(frame);
    });
    const ro = new ResizeObserver(fit);
    fit();
    if (reduced) for (let i = 0; i < 160; i++) frame();
    ro.observe(el);
    io.observe(el);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
    };
  }, [density]);

  const bg = rgbString(palette().paper);
  return (
    <div ref={host} className={cn("relative w-full overflow-hidden", className)} style={{ background: `rgb(${bg})` }}>
      <canvas ref={cvs} aria-hidden="true" className="pointer-events-none absolute inset-0" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ background: `radial-gradient(ellipse 70% 62% at 50% 50%, transparent 20%, rgba(${bg}, 0.9) 100%)` }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-40"
        style={{ background: `linear-gradient(to bottom, rgb(${bg}), transparent)` }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-40"
        style={{ background: `linear-gradient(to top, rgb(${bg}), transparent)` }}
      />
      {children}
    </div>
  );
}
