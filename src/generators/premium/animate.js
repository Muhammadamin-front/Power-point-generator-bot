// pptxgenjs animatsiya va Morph o'tishlarini yoza olmaydi, shuning uchun tayyor .pptx ichidagi
// slayd XML'lariga PowerPoint formatidagi <p:transition> va <p:timing> qo'shiladi.
// Effektlar PowerPoint'ning o'z presetlari bilan bir xil (presetID'lar LibreOffice'ning
// oox/source/ppt/commontimenodecontext.cxx jadvali bo'yicha tekshirilgan):
//   10 Fade · 42 Float In (Ascend) · 53 Fade + Zoom · 2 Fly In · 22 Wipe
import crypto from "node:crypto";
import JSZip from "jszip";

const esc = (value) => String(value).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

// ---------- Effektlar ----------

function target(spid, paragraph) {
  const text = paragraph === undefined ? "" : `<p:txEl><p:pRg st="${paragraph}" end="${paragraph}"/></p:txEl>`;
  return `<p:tgtEl><p:spTgt spid="${spid}">${text}</p:spTgt></p:tgtEl>`;
}

function behaviors(effect, tgt, dur, next) {
  const set = `<p:set><p:cBhvr><p:cTn id="${next()}" dur="1" fill="hold"><p:stCondLst><p:cond delay="0"/></p:stCondLst></p:cTn>${tgt}<p:attrNameLst><p:attrName>style.visibility</p:attrName></p:attrNameLst></p:cBhvr><p:to><p:strVal val="visible"/></p:to></p:set>`;
  const fade = (d = dur) => `<p:animEffect transition="in" filter="fade"><p:cBhvr><p:cTn id="${next()}" dur="${d}"/>${tgt}</p:cBhvr></p:animEffect>`;
  const anim = (attr, from, to, ease = true) =>
    `<p:anim calcmode="lin" valueType="num"><p:cBhvr additive="base"><p:cTn id="${next()}" dur="${dur}"${ease ? ' decel="100000"' : ""} fill="hold"/>${tgt}<p:attrNameLst><p:attrName>${attr}</p:attrName></p:attrNameLst></p:cBhvr><p:tavLst><p:tav tm="0"><p:val><p:strVal val="${from}"/></p:val></p:tav><p:tav tm="100000"><p:val><p:strVal val="${to}"/></p:val></p:tav></p:tavLst></p:anim>`;

  switch (effect) {
    case "float":
      return set + fade() + anim("ppt_x", "#ppt_x", "#ppt_x", false) + anim("ppt_y", "#ppt_y+.08", "#ppt_y");
    case "zoom":
      return set + anim("ppt_w", "#ppt_w*0.7", "#ppt_w") + anim("ppt_h", "#ppt_h*0.7", "#ppt_h") + fade();
    case "flyLeft":
      return set + anim("ppt_x", "0-#ppt_w/2", "#ppt_x") + anim("ppt_y", "#ppt_y", "#ppt_y", false);
    case "flyRight":
      return set + anim("ppt_x", "1+#ppt_w/2", "#ppt_x") + anim("ppt_y", "#ppt_y", "#ppt_y", false);
    case "rise":
      return set + fade() + anim("ppt_x", "#ppt_x", "#ppt_x", false) + anim("ppt_y", "#ppt_y+.25", "#ppt_y");
    case "wipe":
      return set + `<p:animEffect transition="in" filter="wipe(left)"><p:cBhvr><p:cTn id="${next()}" dur="${dur}"/>${tgt}</p:cBhvr></p:animEffect>`;
    default:
      return set + fade();
  }
}

const PRESETS = {
  fade: [10, 0],
  float: [42, 0],
  rise: [42, 0],
  zoom: [53, 0],
  flyLeft: [2, 8],
  flyRight: [2, 2],
  wipe: [22, 8],
};

/**
 * effects: [{ spid, effect, delay, dur, paragraph?, iterate?: "lt" | "wd" }]
 * build:   [{ spid, kind: "text" | "paragraphs" | "shape" }]  (rasm uchun yozuv kerak emas)
 */
function timingXml(effects, build) {
  let id = 4;
  const next = () => ++id;
  const nodes = effects
    .map((e) => {
      const [presetId, subtype] = PRESETS[e.effect] ?? PRESETS.fade;
      const effectId = next();
      const iterate = e.iterate ? `<p:iterate type="${e.iterate}"><p:tmPct val="${e.iterate === "lt" ? 6000 : 12000}"/></p:iterate>` : "";
      const body = behaviors(e.effect, target(e.spid, e.paragraph), e.dur, next);
      return `<p:par><p:cTn id="${effectId}" presetID="${presetId}" presetClass="entr" presetSubtype="${subtype}" fill="hold" grpId="0" nodeType="withEffect"><p:stCondLst><p:cond delay="${Math.round(e.delay)}"/></p:stCondLst>${iterate}<p:childTnLst>${body}</p:childTnLst></p:cTn></p:par>`;
    })
    .join("");

  const bld = build
    .map((b) => {
      if (b.kind === "paragraphs") return `<p:bldP spid="${b.spid}" grpId="0" build="p"/>`;
      if (b.kind === "shape") return `<p:bldP spid="${b.spid}" grpId="0" animBg="1"/>`;
      return `<p:bldP spid="${b.spid}" grpId="0"/>`;
    })
    .join("");

  return (
    `<p:timing><p:tnLst><p:par><p:cTn id="1" dur="indefinite" restart="never" nodeType="tmRoot"><p:childTnLst>` +
    `<p:seq concurrent="1" nextAc="seek"><p:cTn id="2" dur="indefinite" nodeType="mainSeq"><p:childTnLst>` +
    // Slayd ochilishi bilan avtomatik boshlanadi — taqdimotchi qo'shimcha bosishi shart emas.
    `<p:par><p:cTn id="3" fill="hold"><p:stCondLst><p:cond delay="indefinite"/><p:cond evt="onBegin" delay="0"><p:tn val="2"/></p:cond></p:stCondLst><p:childTnLst>` +
    `<p:par><p:cTn id="4" fill="hold"><p:stCondLst><p:cond delay="0"/></p:stCondLst><p:childTnLst>${nodes}</p:childTnLst></p:cTn></p:par>` +
    `</p:childTnLst></p:cTn></p:par>` +
    `</p:childTnLst></p:cTn><p:prevCondLst><p:cond evt="onPrev" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:prevCondLst>` +
    `<p:nextCondLst><p:cond evt="onNext" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:nextCondLst></p:seq>` +
    `</p:childTnLst></p:cTn></p:par></p:tnLst>` +
    (bld ? `<p:bldLst>${bld}</p:bldLst>` : "") +
    `</p:timing>`
  );
}

function transitionXml(kind) {
  if (kind === "morph") {
    // Morph faqat PowerPoint 2019 / 365 da; eski versiyalar Fallback'dagi Fade'ni ko'rsatadi.
    return (
      `<mc:AlternateContent xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006">` +
      `<mc:Choice xmlns:p159="http://schemas.microsoft.com/office/powerpoint/2015/09/main" Requires="p159">` +
      `<p:transition spd="slow"><p159:morph option="byObject"/></p:transition></mc:Choice>` +
      `<mc:Fallback><p:transition spd="slow"><p:fade/></p:transition></mc:Fallback></mc:AlternateContent>`
    );
  }
  return `<p:transition spd="med"><p:fade/></p:transition>`;
}

// ---------- Shakl XML'iga tuzatishlar ----------

/** Slayddagi har bir <p:sp>/<p:pic> blokini nomi bo'yicha topadi. */
function shapeBlocks(xml) {
  const blocks = [];
  const re = /<p:(sp|pic)>[\s\S]*?<\/p:\1>/g;
  let m;
  while ((m = re.exec(xml))) {
    const head = /<p:cNvPr id="(\d+)" name="([^"]*)"/.exec(m[0]);
    if (head) blocks.push({ start: m.index, end: m.index + m[0].length, xml: m[0], id: Number(head[1]), name: head[2], type: m[1] });
  }
  return blocks;
}

const gradFill = (stops, angle = 0) =>
  `<a:gradFill flip="none" rotWithShape="1"><a:gsLst>${stops
    .map((c, i) => `<a:gs pos="${Math.round((i / Math.max(1, stops.length - 1)) * 100000)}"><a:srgbClr val="${c}"/></a:gs>`)
    .join("")}</a:gsLst><a:lin ang="${angle * 60000}" scaled="1"/></a:gradFill>`;

function patchShape(block, patch) {
  let x = block.xml;
  if (patch.gradientText) {
    // Belgilangan rangdagi matn bo'laklariga gradient beriladi (PowerPoint "Gradient fill" matn).
    const { marker, stops } = patch.gradientText;
    x = x.replace(new RegExp(`(<a:rPr[^>]*>)<a:solidFill><a:srgbClr val="${marker}"/></a:solidFill>`, "g"), `$1${gradFill(stops)}`);
  }
  if (patch.bulletColor) {
    x = x.replace(/<a:buSzPct val="100000"\/>/g, `<a:buClr><a:srgbClr val="${patch.bulletColor}"/></a:buClr><a:buSzPct val="${patch.bulletSize ?? 100000}"/>`);
  }
  if (patch.lineAlpha !== undefined) {
    x = x.replace(/(<a:ln\b[^>]*>\s*<a:solidFill>\s*<a:srgbClr val="[0-9A-Fa-f]{6}")\/>/, `$1><a:alpha val="${Math.round((100 - patch.lineAlpha) * 1000)}"/></a:srgbClr>`);
  }
  if (patch.round) {
    x = x.replace(/<a:prstGeom prst="rect">\s*<a:avLst\/>\s*<\/a:prstGeom>/, `<a:prstGeom prst="roundRect"><a:avLst><a:gd name="adj" fmla="val ${patch.round}"/></a:avLst></a:prstGeom>`);
  }
  if (patch.rename) {
    x = x.replace(/(<p:cNvPr id="\d+" name=")[^"]*(")/, `$1${esc(patch.rename)}$2`);
  }
  return x;
}

// ---------- Media takrorlarini olib tashlash ----------

async function dedupeMedia(zip) {
  const canonical = new Map();
  const rename = new Map();
  for (const name of Object.keys(zip.files).filter((n) => n.startsWith("ppt/media/") && !zip.files[n].dir).sort()) {
    const data = await zip.file(name).async("nodebuffer");
    const hash = crypto.createHash("sha1").update(data).digest("hex") + name.slice(name.lastIndexOf("."));
    if (canonical.has(hash)) rename.set(name.slice("ppt/media/".length), canonical.get(hash));
    else canonical.set(hash, name.slice("ppt/media/".length));
  }
  if (!rename.size) return;
  for (const rels of Object.keys(zip.files).filter((n) => n.endsWith(".rels"))) {
    let x = await zip.file(rels).async("string");
    let changed = false;
    x = x.replace(/Target="\.\.\/media\/([^"]+)"/g, (all, file) => {
      if (!rename.has(file)) return all;
      changed = true;
      return `Target="../media/${rename.get(file)}"`;
    });
    if (changed) zip.file(rels, x);
  }
  for (const file of rename.keys()) zip.remove(`ppt/media/${file}`);
}

/**
 * Tayyor .pptx'ga animatsiya, o'tishlar va XML tuzatishlarini qo'shadi.
 * slides[i] = { transition: "fade" | "morph", titleName?, effects: [{ name, kind, effect, delay, dur, paragraphs?, stagger?, iterate? }], patches: { [name]: {...} } }
 */
export async function finalizeDeck(buffer, slides) {
  const zip = await JSZip.loadAsync(buffer);
  for (let i = 0; i < slides.length; i++) {
    const spec = slides[i];
    const file = `ppt/slides/slide${i + 1}.xml`;
    // pptxgenjs bir paragrafdagi turli uslubli bo'laklar orasiga ortiqcha <a:pPr> yozadi — sxemaga zid.
    let xml = (await zip.file(file).async("string")).replace(/(<\/a:r>|<\/a:fld>)<a:pPr\b[^>]*?(?:\/>|>[\s\S]*?<\/a:pPr>)/g, "$1");

    // Sarlavha placeholder'iga nom (pptxgenjs objectName'ni placeholder'larga yozmaydi)
    const patches = { ...spec.patches };
    if (spec.titleName) {
      const title = shapeBlocks(xml).find((b) => /<p:ph[^>]*type="title"/.test(b.xml));
      if (title) patches[title.name] = { ...patches[spec.titleName], rename: spec.titleName };
    }

    const blocks = shapeBlocks(xml);
    for (const block of [...blocks].reverse()) {
      const patch = patches[block.name];
      if (!patch) continue;
      xml = xml.slice(0, block.start) + patchShape(block, patch) + xml.slice(block.end);
    }

    const ids = new Map(shapeBlocks(xml).map((b) => [b.name, b.id]));
    const effects = [];
    const build = [];
    for (const e of spec.effects ?? []) {
      const spid = ids.get(e.name);
      if (!spid) continue;
      if (e.paragraphs) {
        for (let p = 0; p < e.paragraphs; p++) {
          effects.push({ ...e, spid, paragraph: p, delay: e.delay + p * (e.stagger ?? 120) });
        }
        build.push({ spid, kind: "paragraphs" });
      } else {
        effects.push({ ...e, spid });
        if (e.kind !== "pic") build.push({ spid, kind: e.kind === "shape" ? "shape" : "text" });
      }
    }

    const tail = transitionXml(spec.transition) + (effects.length ? timingXml(effects, build) : "");
    xml = xml.replace("</p:sld>", `${tail}</p:sld>`);
    zip.file(file, xml);
  }
  await dedupeMedia(zip);
  return zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE", compressionOptions: { level: 6 } });
}
