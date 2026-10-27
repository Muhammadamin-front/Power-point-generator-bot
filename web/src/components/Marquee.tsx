/** Cheksiz aylanuvchi kalit so‘zlar tasmasi */
export function Marquee({ items }: { items: string[] }) {
  const list = [...items, ...items];
  return (
    <div className="marquee overflow-hidden border-y border-mist py-6 [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
      <div className="marquee__track gap-14 pr-14">
        {list.map((name, i) => (
          <span key={i} className="vn text-[1.7rem] whitespace-nowrap text-depth" aria-hidden={i >= items.length}>
            {name}
          </span>
        ))}
      </div>
    </div>
  );
}
