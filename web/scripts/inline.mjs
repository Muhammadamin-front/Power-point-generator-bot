// dist/index.html + dist/assets/* ni bitta o'z-o'zidan yetarli faylga birlashtiradi (../assets/web/template.html).
// Inline <script type="module"> file:// orqali ham ishlaydi, shuning uchun talaba faylni ikki marta bosib ocha oladi.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
let html = fs.readFileSync(path.join(dist, "index.html"), "utf8");
const read = (href) => fs.readFileSync(path.join(dist, href.replace(/^\.?\//, "")), "utf8");

html = html.replace(/<link rel="modulepreload"[^>]*>\s*/g, "");
html = html.replace(/<link rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g, (_, href) => `<style>${read(href)}</style>`);
const scripts = [];
html = html.replace(/<script type="module"[^>]*src="([^"]+)"[^>]*><\/script>\s*/g, (_, src) => {
  // </script> va <!-- JS ichida HTML'ni buzmasligi uchun
  scripts.push(read(src).replace(/<\/script/gi, "<\\/script").replace(/<!--/g, "<\\!--"));
  return "";
});
html = html.replace("</body>", () => `<script type="module">${scripts.join("\n")}</script>\n</body>`);

const out = path.resolve(root, "..", "assets", "web", "template.html");
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, html);
console.log(`✓ ${path.relative(process.cwd(), out)} — ${(html.length / 1024).toFixed(0)} KB`);

// Namunaviy mazmun (Mini App'dagi "Jonli namuna" uchun) serverga shu fayl orqali yetib boradi.
fs.copyFileSync(path.join(root, "samples", "full.json"), path.resolve(root, "..", "assets", "web", "sample.json"));
