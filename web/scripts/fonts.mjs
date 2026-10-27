// Bepul (OFL) shriftlarni fontsource paketlaridan ../assets/web/fonts ga ko'chiradi va manifest.json yozadi.
// Faqat o'zbek (lotin va kirill), rus va ingliz tillarini to'liq qamrab oladigan shriftlar kiritilgan:
// oʻ gʻ ʼ  ў қ ғ ҳ  ё № — hammasi tekshirilgan (fontTools cmap).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = path.resolve(root, "..", "assets", "web", "fonts");
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

const FONTS = [
  { id: "commissioner", name: "Commissioner", kind: "sans" },
  { id: "inter", name: "Inter", kind: "sans" },
  { id: "montserrat", name: "Montserrat", kind: "sans" },
  { id: "nunito", name: "Nunito", kind: "sans" },
  { id: "onest", name: "Onest", kind: "sans" },
  { id: "raleway", name: "Raleway", kind: "sans" },
  { id: "cormorant-garamond", name: "Cormorant Garamond", kind: "serif" },
  { id: "lora", name: "Lora", kind: "serif" },
  { id: "merriweather", name: "Merriweather", kind: "serif" },
  { id: "noto-serif", name: "Noto Serif", kind: "serif" },
];
const SUBSETS = ["latin", "latin-ext", "cyrillic", "cyrillic-ext"];

const manifest = {};
for (const font of FONTS) {
  const dir = path.join(root, "node_modules", "@fontsource-variable", font.id);
  const css = fs.readFileSync(path.join(dir, "index.css"), "utf8");
  const faces = [];
  for (const block of css.match(/@font-face\s*\{[^}]*\}/g) ?? []) {
    const file = /url\(\.\/files\/([^)]+-wght-normal\.woff2)\)/.exec(block)?.[1];
    const subset = file && SUBSETS.find((s) => file === `${font.id}-${s}-wght-normal.woff2`);
    if (!subset) continue;
    const weight = /font-weight:\s*([^;]+);/.exec(block)[1].trim();
    const range = /unicode-range:\s*([^;]+);/.exec(block)[1].trim();
    const name = `${font.id}-${subset}.woff2`;
    fs.copyFileSync(path.join(dir, "files", file), path.join(out, name));
    faces.push({ file: name, weight, range });
  }
  if (faces.length !== SUBSETS.length) throw new Error(`${font.id}: ${faces.length} ta qism topildi`);
  manifest[font.id] = { name: font.name, kind: font.kind, faces };
}
fs.writeFileSync(path.join(out, "manifest.json"), `${JSON.stringify(manifest, null, 1)}\n`);
const size = fs.readdirSync(out).reduce((n, f) => n + fs.statSync(path.join(out, f)).size, 0);
console.log(`✓ ${FONTS.length} ta shrift, ${(size / 1024).toFixed(0)} KB`);
