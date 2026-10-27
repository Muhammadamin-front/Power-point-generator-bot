import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "../lib/utils";
import { palette, rgbString } from "../theme";

const SPACING = 42;

/** Verlet fizikasidagi 3D mato (ipak) to‘ri: sichqonchaga qarab bukiladi */
export function ClothGrid({ className, children }: { className?: string; children?: ReactNode }) {
  const host = useRef<HTMLDivElement>(null);
  const cvs = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = cvs.current;
    const el = host.current;
    if (!canvas || !el) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;
    const theme = palette();
    const BG = theme.paper;
    const LINE = rgbString(theme.depth);
    const HOT = theme.seal;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    type Pt = {
      x: number; y: number; z: number;
      ox: number; oy: number; oz: number;
      bx: number; by: number; bz: number;
      pinned: boolean; px: number; py: number; ps: number;
    };
    let raf = 0;
    let w = 0;
    let h = 0;
    let visible = false;
    const mouse = { x: -1e3, y: -1e3, tax: 0.2, tay: -0.3, ax: 0.2, ay: -0.3, radius: 180 };
    let pts: Pt[] = [];
    let links: { a: Pt; b: Pt; len: number }[] = [];

    const build = () => {
      pts = [];
      links = [];
      const cols = Math.ceil((w * 1.1) / SPACING) + 1;
      const rows = Math.ceil((h * 1.1) / SPACING) + 1;
      const grid: Pt[][] = [];
      const x0 = -(cols * SPACING) / 2;
      const y0 = -(rows * SPACING) / 2;
      for (let r = 0; r < rows; r++) {
        grid[r] = [];
        for (let c = 0; c < cols; c++) {
          const x = x0 + c * SPACING;
          const y = y0 + r * SPACING;
          const p: Pt = {
            x, y, z: 0, ox: x, oy: y, oz: 0, bx: x, by: y, bz: 0,
            pinned: c === 0 || c === cols - 1 || r === 0 || r === rows - 1,
            px: 0, py: 0, ps: 1,
          };
          pts.push(p);
          grid[r][c] = p;
        }
      }
      for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++) {
          if (c < cols - 1) links.push({ a: grid[r][c], b: grid[r][c + 1], len: SPACING });
          if (r < rows - 1) links.push({ a: grid[r][c], b: grid[r + 1][c], len: SPACING });
        }
    };
    const fit = () => {
      const r = el.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = r.width;
      h = r.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      build();
    };
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
      mouse.tay = (mouse.x / w - 0.5) * 2 * 0.45;
      mouse.tax = -(mouse.y / h - 0.5) * 2 * 0.35 + 0.2;
    };
    const onLeave = () => {
      mouse.x = -1e3;
      mouse.y = -1e3;
      mouse.tax = 0.2;
      mouse.tay = 0;
    };

    let t = 0;
    const frame = () => {
      raf = 0;
      t += 0.025;
      mouse.ax += (mouse.tax - mouse.ax) * 0.05;
      mouse.ay += (mouse.tay - mouse.ay) * 0.05;
      const cx = Math.cos(mouse.ax);
      const sx = Math.sin(mouse.ax);
      const cy = Math.cos(mouse.ay);
      const sy = Math.sin(mouse.ay);
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, w, h);

      for (const p of pts) {
        if (p.pinned) continue;
        const vx = (p.x - p.ox) * 0.93;
        const vy = (p.y - p.oy) * 0.93;
        const vz = (p.z - p.oz) * 0.93;
        p.ox = p.x; p.oy = p.y; p.oz = p.z;
        p.x += vx; p.y += vy; p.z += vz;
        const wave = Math.sin(p.bx * 0.015 + p.by * 0.015 + t) * 18;
        p.x += (p.bx - p.x) * 0.04;
        p.y += (p.by - p.y) * 0.04;
        p.z += (p.bz + wave - p.z) * 0.04;
      }
      const hw = w / 2;
      const hh = h / 2;
      for (const p of pts) {
        const rx = p.x * cy + p.z * sy;
        const rz = -p.x * sy + p.z * cy;
        const ry = p.y * cx - rz * sx;
        const depth = p.y * sx + rz * cx + 400;
        const s = 600 / Math.max(1, depth);
        p.ps = s;
        p.px = hw + rx * s;
        p.py = hh + ry * s;
        if (!p.pinned) {
          const dx = p.px - mouse.x;
          const dy = p.py - mouse.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < mouse.radius && d > 0) {
            const f = (1 - d / mouse.radius) * 22;
            const a = Math.atan2(dy, dx);
            p.x += (Math.cos(a) * f) / p.ps;
            p.y += (Math.sin(a) * f) / p.ps;
            p.z -= (f * 1.5) / p.ps;
          }
        }
      }
      for (let k = 0; k < 4; k++)
        for (const l of links) {
          const dx = l.b.x - l.a.x;
          const dy = l.b.y - l.a.y;
          const dz = l.b.z - l.a.z;
          const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
          const diff = (d - l.len) / (d || 1);
          if (!l.a.pinned) {
            l.a.x += dx * 0.5 * diff; l.a.y += dy * 0.5 * diff; l.a.z += dz * 0.5 * diff;
          }
          if (!l.b.pinned) {
            l.b.x -= dx * 0.5 * diff; l.b.y -= dy * 0.5 * diff; l.b.z -= dz * 0.5 * diff;
          }
        }
      for (const l of links) {
        const mx = (l.a.px + l.b.px) / 2;
        const my = (l.a.py + l.b.py) / 2;
        const near = Math.hypot(mouse.x - mx, mouse.y - my) < mouse.radius;
        const s = (l.a.ps + l.b.ps) / 2;
        ctx.strokeStyle = near ? HOT : `rgba(${LINE}, ${Math.min(1, Math.max(0.1, 0.32 * s))})`;
        ctx.lineWidth = near ? 1.6 * s : 0.7 * s;
        ctx.beginPath();
        ctx.moveTo(l.a.px, l.a.py);
        ctx.lineTo(l.b.px, l.b.py);
        ctx.stroke();
      }
      for (const p of pts)
        if (Math.hypot(mouse.x - p.px, mouse.y - p.py) < 100) {
          ctx.fillStyle = HOT;
          ctx.beginPath();
          ctx.arc(p.px, p.py, 2.4 * p.ps, 0, Math.PI * 2);
          ctx.fill();
        }
      if (visible && !reduced) raf = requestAnimationFrame(frame);
    };

    const io = new IntersectionObserver(([e]) => {
      visible = e?.isIntersecting ?? false;
      if (visible && !raf) raf = requestAnimationFrame(frame);
    });
    const ro = new ResizeObserver(() => {
      fit();
      if (reduced) frame();
    });
    fit();
    ro.observe(el);
    io.observe(el);
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <div ref={host} className={cn("relative w-full overflow-hidden bg-paper select-none", className)}>
      <canvas ref={cvs} aria-hidden="true" className="absolute inset-0 block cursor-crosshair" />
      {children}
    </div>
  );
}
