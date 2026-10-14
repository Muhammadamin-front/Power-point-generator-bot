// Premium shablon rasmlarini qayta "pishiradi" (faqat ishlab chiqishda, macOS + Google Chrome kerak).
// Natija assets/premium/ ga yoziladi va repozitoriyga qo'shiladi — serverda Chrome kerak emas.
//   node scripts/bake/bake.js            # hammasi
//   node scripts/bake/bake.js aura neon  # faqat tanlanganlar
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(here, "../../assets/premium");
const CHROME = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const BG = { w: 1920, h: 1080, format: "jpg" };
const ORB = { w: 600, h: 600, format: "png" };
const PLANET = { w: 720, h: 720, format: "png" };

const ASSETS = {
  "aura-cover": BG,
  "aura-content": BG,
  "aura-section": BG,
  "aura-end": BG,
  "aura-orb-cyan": ORB,
  "aura-orb-orange": ORB,
  "neon-cover": BG,
  "neon-content": BG,
  "neon-section": BG,
  "neon-end": BG,
  "neon-ring": { w: 800, h: 800, format: "png" },
  "neon-orb": ORB,
  "kinetic-cover": BG,
  "kinetic-content": BG,
  "kinetic-section": BG,
  "kinetic-end": BG,
  "kinetic-orb": ORB,
  "aurora-cover": BG,
  "aurora-content": BG,
  "aurora-section": BG,
  "aurora-end": BG,
  "aurora-orb-indigo": ORB,
  "aurora-orb-sky": ORB,
  "cosmos-cover": BG,
  "cosmos-content": BG,
  "cosmos-section": BG,
  "cosmos-end": BG,
  "cosmos-mars": PLANET,
  "cosmos-ice": PLANET,
  "cosmos-giant": PLANET,
  "misr-cover": BG,
  "misr-content": BG,
  "misr-section": BG,
  "misr-end": BG,
  "misr-sun": ORB,
  "meksika-cover": BG,
  "meksika-content": BG,
  "meksika-section": BG,
  "meksika-end": BG,
  "vatikan-cover": BG,
  "vatikan-content": BG,
  "vatikan-section": BG,
  "vatikan-end": BG,
  "avstraliya-cover": BG,
  "avstraliya-content": BG,
  "avstraliya-section": BG,
  "avstraliya-end": BG,
  "avstraliya-star": ORB,
  "editorial-paper": BG,
  "editorial-ink": BG,
};

const only = process.argv.slice(2);
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "bake-"));
const profile = path.join(tmp, "chrome-profile");

for (const [name, spec] of Object.entries(ASSETS)) {
  const [template, ...rest] = name.split("-");
  if (only.length && !only.includes(template) && !only.includes(name)) continue;
  const dir = path.join(OUT, template);
  fs.mkdirSync(dir, { recursive: true });
  const png = path.join(tmp, `${name}.png`);
  const url = `file://${path.join(here, "art.html")}?asset=${name}&w=${spec.w}&h=${spec.h}`;
  execFileSync(
    CHROME,
    [
      "--headless=new",
      `--user-data-dir=${profile}`,
      "--no-first-run",
      "--disable-gpu",
      "--hide-scrollbars",
      "--force-device-scale-factor=1",
      "--default-background-color=00000000",
      `--window-size=${spec.w},${spec.h}`,
      "--virtual-time-budget=3000",
      `--screenshot=${png}`,
      url,
    ],
    { stdio: "ignore", timeout: 120_000 },
  );
  const file = path.join(dir, `${rest.join("-")}.${spec.format}`);
  if (spec.format === "jpg") {
    execFileSync("sips", ["-s", "format", "jpeg", "-s", "formatOptions", "84", png, "--out", file], { stdio: "ignore" });
  } else {
    fs.copyFileSync(png, file);
  }
  console.log(`${name} → ${path.relative(process.cwd(), file)} (${Math.round(fs.statSync(file).size / 1024)} KB)`);
}
fs.rmSync(tmp, { recursive: true, force: true });
