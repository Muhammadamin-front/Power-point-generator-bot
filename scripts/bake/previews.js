// Premium shablonlarning muqova ko'rinishlarini (Mini App galereyasi va bot vitrinasi uchun) chizadi.
// Haqiqiy fon/dekor rasmlari va shablon ranglari ishlatiladi. Natija: public/premium/*.jpg
//   node scripts/bake/previews.js
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PREMIUM } from "../../src/generators/premium/templates.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(here, "../../public/premium");
const CHROME = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PX = 1280 / 13.333; // dyuym → piksel

const SAMPLE = {
  subject: "Iqtisodiyot nazariyasi",
  title: "Raqamli iqtisodiyot va uning rivojlanishi",
  subtitle: "Tushuncha, asosiy yoʻnalishlar va istiqbollar",
};

function fontCss(face) {
  if (face === "Consolas") return "font-family: Consolas, Menlo, monospace; font-weight: 700;";
  if (face === "Georgia") return "font-family: Georgia, serif; font-weight: 700;";
  if (face.startsWith("Bodoni")) return `font-family: 'Bodoni MT', 'Bodoni 72', Didot, serif; font-weight: ${face.endsWith("Black") ? 900 : 400};`;
  if (face === "Gill Sans MT") return "font-family: 'Gill Sans MT', 'Gill Sans', sans-serif; font-weight: 400;";
  const weight = { "Segoe UI Light": 300, "Segoe UI": 400, "Segoe UI Semibold": 600, "Segoe UI Black": 900 }[face] ?? 400;
  return `font-family: 'Segoe UI', -apple-system, 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif; font-weight: ${weight};`;
}

function coverHtml(t) {
  const p = t.palette[t.surfaces.cover];
  const decor = Object.entries(t.decor.cover)
    .map(([name, [x, y, size]]) => {
      const box = `position:absolute; left:${x * PX}px; top:${y * PX}px; width:${size * PX}px; height:${size * PX}px;`;
      const image = t.decor.items?.[name];
      if (image) return `<img src="file://${image.img}" style="${box} opacity:${1 - image.alpha / 100};">`;
      const shape = t.decor.shapes[name];
      return shape.outline
        ? `<div style="${box} border-radius:50%; border:${shape.outline * 1.4}px solid #${shape.color}; box-sizing:border-box;"></div>`
        : `<div style="${box} border-radius:50%; background:#${shape.color};"></div>`;
    })
    .join("");

  const words = SAMPLE.title.split(" ");
  let title;
  if (t.twoTone) {
    const k = Math.round(words.length * 0.45);
    const stops = t.twoTone.lightStops.map((c) => `#${c}`).join(", ");
    title = `<span style="${fontCss(t.fonts.light)} background: linear-gradient(90deg, ${stops}); -webkit-background-clip: text; color: transparent;">${words.slice(0, k).join(" ")}</span><br><span style="${fontCss(t.fonts.display)} color:#${p.text};">${words.slice(k).join(" ")}</span>`;
  } else if (t.goldTitle) {
    const stops = t.goldTitle.map((c) => `#${c}`).join(", ");
    title = `<span style="background: linear-gradient(180deg, ${stops}); -webkit-background-clip: text; color: transparent;">${SAMPLE.title.toUpperCase()}</span>`;
  } else if (t.italicAccent) {
    const k = Math.round(words.length * (t.accentSplit ?? 0.6));
    title = `<span style="color:#${p.text};">${words.slice(0, k).join(" ")} </span><span style="color:#${p.accent ?? t.accent}; font-style: italic;">${words.slice(k).join(" ")}</span>`;
  } else {
    const glow = t.titleGlow ? `text-shadow: 0 0 22px #${t.titleGlow.color}99;` : "";
    title = `<span style="color:#${p.text}; ${glow}">${t.upperCover ? SAMPLE.title.toUpperCase() : SAMPLE.title}</span>`;
  }
  const titleFont = t.twoTone ? "" : fontCss(t.fonts.display);
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    html, body { margin: 0; width: 1280px; height: 720px; overflow: hidden; }
    .slide { position: relative; width: 1280px; height: 720px; overflow: hidden; background: url("file://${t.bg.cover}") center / cover; }
  </style></head><body><div class="slide">
    ${decor}
    <div style="position:absolute; left:${0.9 * PX}px; top:${1.0 * PX}px; ${fontCss("Segoe UI Semibold")} font-size:13px; letter-spacing:4px; color:#${p.accent ?? t.accent};">${SAMPLE.subject.toUpperCase()}</div>
    <div style="position:absolute; left:${0.9 * PX}px; top:${1.55 * PX}px; width:${8.4 * PX}px; height:${3.15 * PX}px; display:flex; align-items:flex-end;">
      <div style="${titleFont} font-size:${t.upperCover ? 48 : 60}px; line-height:1.06; letter-spacing:${t.upperCover ? "3px" : "-0.5px"};">${title}</div>
    </div>
    <div style="position:absolute; left:${0.9 * PX}px; top:${4.9 * PX}px; width:${7.8 * PX}px; ${fontCss("Segoe UI")} font-size:21px; color:#${p.muted};">${SAMPLE.subtitle}</div>
  </div></body></html>`;
}

function shoot(html, file, w, h, tmp) {
  const page = path.join(tmp, `${path.basename(file)}.html`);
  const png = path.join(tmp, `${path.basename(file)}.png`);
  fs.writeFileSync(page, html);
  execFileSync(
    CHROME,
    [
      "--headless=new",
      `--user-data-dir=${path.join(tmp, "profile")}`,
      "--no-first-run",
      "--disable-gpu",
      "--hide-scrollbars",
      "--force-device-scale-factor=1",
      "--allow-file-access-from-files",
      `--window-size=${w},${h}`,
      "--virtual-time-budget=3000",
      `--screenshot=${png}`,
      `file://${page}`,
    ],
    { stdio: "ignore", timeout: 120_000 },
  );
  execFileSync("sips", ["-s", "format", "jpeg", "-s", "formatOptions", "82", png, "--out", file], { stdio: "ignore" });
  console.log(`${path.relative(process.cwd(), file)} (${Math.round(fs.statSync(file).size / 1024)} KB)`);
}

fs.mkdirSync(OUT, { recursive: true });
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "previews-"));
for (const t of Object.values(PREMIUM)) {
  const file = path.join(OUT, `${t.id}.jpg`);
  shoot(coverHtml(t), file, 1280, 720, tmp);
  // Mini App uchun yengil eskiz
  execFileSync("sips", ["-Z", "640", "-s", "formatOptions", "78", file, "--out", path.join(OUT, `${t.id}-sm.jpg`)], { stdio: "ignore" });
}

// Bot vitrinasi: 3 × 2 kollaj
const tiles = Object.values(PREMIUM)
  .map(
    (t) => `<figure><img src="file://${path.join(OUT, `${t.id}.jpg`)}"><figcaption>${t.name}</figcaption></figure>`,
  )
  .join("");
shoot(
  `<!doctype html><html><head><meta charset="utf-8"><style>
    html, body { margin: 0; background: #0b0d12; }
    .grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 18px; padding: 70px 26px 26px; width: 1600px; box-sizing: border-box; }
    h1 { position: absolute; top: 16px; left: 26px; margin: 0; font: 700 30px -apple-system, "Segoe UI", sans-serif; color: #fff; letter-spacing: -0.5px; }
    h1 span { color: #22d3ee; }
    figure { margin: 0; position: relative; border-radius: 14px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,.45); }
    img { display: block; width: 100%; aspect-ratio: 16 / 9; object-fit: cover; }
    figcaption { position: absolute; left: 12px; bottom: 10px; padding: 4px 10px; border-radius: 999px; background: rgba(0,0,0,.55); color: #fff; font: 600 15px -apple-system, "Segoe UI", sans-serif; }
  </style></head><body><h1>Premium <span>animatsiyali</span> taqdimotlar</h1><div class="grid">${tiles}</div></body></html>`,
  path.join(OUT, "showcase.jpg"),
  1600,
  70 + Math.ceil(Object.keys(PREMIUM).length / 5) * 184 + 10,
  tmp,
);
fs.rmSync(tmp, { recursive: true, force: true });
