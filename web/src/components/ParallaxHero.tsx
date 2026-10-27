import { useEffect, useRef, type ReactNode } from "react";
import { gsap, ScrollTrigger } from "../lib/scroll";

/** GSAP ScrollTrigger: rasm, sarlavha va tuman qatlami turli tezlikda siljiydi */
export function ParallaxHero({ title, image, alt }: { title: ReactNode; image: string; alt: string }) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const layers = root.current?.querySelector<HTMLElement>("[data-parallax-layers]");
    if (!layers) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ scrollTrigger: { trigger: layers, start: "0% 0%", end: "100% 0%", scrub: 0 } });
      [
        { layer: "2", yPercent: 55 },
        { layer: "3", yPercent: 40 },
        { layer: "4", yPercent: 10 },
      ].forEach((l, i) => {
        tl.to(layers.querySelectorAll(`[data-parallax-layer="${l.layer}"]`), { yPercent: l.yPercent, ease: "none" }, i === 0 ? undefined : "<");
      });
    }, root);
    ScrollTrigger.refresh();
    return () => ctx.revert();
  }, []);

  return (
    <div ref={root} className="relative h-svh min-h-[620px] overflow-hidden bg-paper">
      <div data-parallax-layers className="absolute inset-0">
        <img
          data-parallax-layer="2"
          src={image}
          alt={alt}
          loading="eager"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover object-[50%_55%] saturate-[0.85] will-change-transform"
        />
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-[60%] bg-[radial-gradient(ellipse_60%_70%_at_50%_0%,color-mix(in_srgb,var(--color-paper)_88%,transparent)_0%,color-mix(in_srgb,var(--color-paper)_50%,transparent)_45%,transparent_100%)]"
        />
        <div data-parallax-layer="3" className="absolute inset-x-0 top-[5%] flex flex-col items-center px-6 text-center will-change-transform">
          {title}
        </div>
        <div
          data-parallax-layer="4"
          aria-hidden="true"
          className="absolute inset-x-0 -bottom-[14%] h-[48%] bg-[linear-gradient(180deg,transparent_0%,color-mix(in_srgb,var(--color-paper)_80%,transparent)_38%,var(--color-paper)_62%)] will-change-transform"
        />
      </div>
    </div>
  );
}
