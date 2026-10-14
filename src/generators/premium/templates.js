// Premium animatsiyali shablonlar. Har biri Desktop/Prompt'dagi bitta effekt "dunyosi"dan olingan;
// fon va dekor rasmlari scripts/bake/ bilan oldindan chizilgan (assets/premium/).
import path from "node:path";
import { ROOT } from "../../config.js";

const asset = (...parts) => path.join(ROOT, "assets", "premium", ...parts);

// Dekor pozitsiyalari: [x, y, o'lcham] dyuymda (slayd 13.33 × 7.5). Slayddan chiqib ketishi mumkin —
// Morph o'tishi ularni slayddan slaydga silliq suzdiradi.
export const PREMIUM = {
  aura: {
    id: "aura",
    name: "Aura",
    description: "Shader nur: qora fon ustida oqib turgan cyan va to'q sariq yorug'lik",
    source: "shader.md",
    surfaces: { cover: "dark", content: "dark", section: "dark", end: "dark" },
    bg: { cover: asset("aura/cover.jpg"), content: asset("aura/content.jpg"), section: asset("aura/section.jpg"), end: asset("aura/end.jpg") },
    fonts: { title: "Segoe UI Semibold", display: "Segoe UI Black", light: "Segoe UI Light", body: "Segoe UI", number: "Segoe UI Light" },
    accent: "22D3EE",
    accent2: "FB923C",
    palette: {
      dark: { text: "FFFFFF", muted: "A8C2CB", panel: "FFFFFF", panelAlpha: 93, line: "FFFFFF", lineAlpha: 82 },
    },
    twoTone: { lightStops: ["FFFFFF", "67E8F9", "FB923C"] },
    valueStops: ["67E8F9", "FB923C"],
    bullet: "25CF",
    decor: {
      items: { "!!aura-a": { img: asset("aura/orb-cyan.png"), alpha: 30 }, "!!aura-b": { img: asset("aura/orb-orange.png"), alpha: 35 } },
      cover: { "!!aura-a": [8.6, -2.6, 7.4], "!!aura-b": [-2.8, 4.4, 6.2] },
      section: { "!!aura-a": [8.2, 0.6, 6.8], "!!aura-b": [-1.8, 3.8, 5.0] },
      end: { "!!aura-a": [-2.4, -2.8, 7.0], "!!aura-b": [9.0, 3.9, 6.0] },
      content: [
        { "!!aura-a": [10.4, 3.9, 5.4], "!!aura-b": [-3.3, -2.7, 5.0] },
        { "!!aura-a": [9.6, -2.6, 5.0], "!!aura-b": [3.8, 5.7, 4.4] },
        { "!!aura-a": [-2.8, 4.5, 5.2], "!!aura-b": [10.9, -1.9, 4.8] },
        { "!!aura-a": [5.4, 5.9, 4.6], "!!aura-b": [10.6, 4.1, 5.0] },
      ],
    },
  },

  neon: {
    id: "neon",
    name: "Neon",
    description: "Yonib turgan neon trubkalar: qora sahna, pushti, binafsha va yashil nurlar",
    source: "Hero animate.md",
    surfaces: { cover: "dark", content: "dark", section: "dark", end: "dark" },
    bg: { cover: asset("neon/cover.jpg"), content: asset("neon/content.jpg"), section: asset("neon/section.jpg"), end: asset("neon/end.jpg") },
    fonts: { title: "Segoe UI Black", display: "Segoe UI Black", light: "Segoe UI Light", body: "Segoe UI", number: "Segoe UI Black" },
    accent: "FF3FA4",
    accent2: "60AED5",
    palette: {
      dark: { text: "FFFFFF", muted: "C9C1DA", panel: "FFFFFF", panelAlpha: 94, line: "F967FB", lineAlpha: 70 },
    },
    titleGlow: { size: 14, opacity: 0.35, color: "FF008A" },
    valueStops: ["FF3FA4", "F967FB", "60AED5"],
    bullet: "25CF",
    decor: {
      items: { "!!neon-ring": { img: asset("neon/ring.png"), alpha: 20 }, "!!neon-spark": { img: asset("neon/orb.png"), alpha: 30 } },
      cover: { "!!neon-ring": [10.9, 5.3, 1.6], "!!neon-spark": [11.6, -0.6, 2.0] },
      section: { "!!neon-ring": [-1.4, 4.6, 4.4], "!!neon-spark": [1.2, -0.8, 2.2] },
      end: { "!!neon-ring": [10.6, 0.3, 2.0], "!!neon-spark": [0.2, 5.6, 2.2] },
      content: [
        { "!!neon-ring": [10.7, 4.5, 3.8], "!!neon-spark": [11.4, -0.7, 2.2] },
        { "!!neon-ring": [-1.9, 4.9, 3.6], "!!neon-spark": [5.6, 6.3, 1.8] },
        { "!!neon-ring": [11.1, -1.5, 3.6], "!!neon-spark": [-0.9, 5.9, 2.2] },
        { "!!neon-ring": [9.4, 5.1, 3.0], "!!neon-spark": [12.0, 2.6, 1.8] },
      ],
    },
  },

  kinetic: {
    id: "kinetic",
    name: "Kinetic",
    description: "Kinetik to'r: qora fon, egilgan neon-yashil mato va monospace yozuvlar",
    source: "kinetic.md · kinetic-grid",
    surfaces: { cover: "dark", content: "dark", section: "dark", end: "dark" },
    bg: { cover: asset("kinetic/cover.jpg"), content: asset("kinetic/content.jpg"), section: asset("kinetic/section.jpg"), end: asset("kinetic/end.jpg") },
    fonts: { title: "Consolas", display: "Consolas", light: "Consolas", body: "Segoe UI", number: "Consolas" },
    titleBold: true,
    accent: "BEF202",
    accent2: "84CC16",
    palette: {
      dark: { text: "F7FEE7", muted: "B5C79A", panel: "BEF202", panelAlpha: 95, line: "BEF202", lineAlpha: 70 },
    },
    letterTitle: true,
    bullet: "25A0",
    decor: {
      items: { "!!kin-node": { img: asset("kinetic/orb.png"), alpha: 10 } },
      cover: { "!!kin-node": [9.55, 4.95, 1.5] },
      section: { "!!kin-node": [11.75, 0.45, 1.1] },
      end: { "!!kin-node": [5.95, 3.4, 1.4] },
      content: [{ "!!kin-node": [12.05, 6.1, 1.0] }, { "!!kin-node": [11.7, 0.35, 1.0] }, { "!!kin-node": [0.15, 6.35, 0.9] }, { "!!kin-node": [6.1, 6.55, 0.8] }],
    },
  },

  aurora: {
    id: "aurora",
    name: "Aurora",
    description: "Yorug' va nafis: oq fon ustida ko'k-binafsha shimol yog'dusi",
    source: "prompt-background-light.md",
    surfaces: { cover: "light", content: "light", section: "light", end: "light" },
    bg: { cover: asset("aurora/cover.jpg"), content: asset("aurora/content.jpg"), section: asset("aurora/section.jpg"), end: asset("aurora/end.jpg") },
    fonts: { title: "Segoe UI Semibold", display: "Segoe UI Semibold", light: "Segoe UI Light", body: "Segoe UI", number: "Segoe UI Light" },
    accent: "3B82F6",
    accent2: "8B5CF6",
    palette: {
      light: { text: "0F172A", muted: "475569", panel: "FFFFFF", panelAlpha: 18, line: "CBD5E1", lineAlpha: 30, shadow: true },
    },
    twoTone: { lightStops: ["3B82F6", "8B5CF6"] },
    valueStops: ["3B82F6", "8B5CF6"],
    bullet: "25CF",
    decor: {
      items: { "!!aur-a": { img: asset("aurora/orb-indigo.png"), alpha: 55 }, "!!aur-b": { img: asset("aurora/orb-sky.png"), alpha: 50 } },
      cover: { "!!aur-a": [-2.4, 4.6, 6.0], "!!aur-b": [9.8, 3.8, 5.0] },
      section: { "!!aur-a": [9.3, 3.9, 5.6], "!!aur-b": [-2.0, -2.0, 5.0] },
      end: { "!!aur-a": [-1.8, 3.6, 6.0], "!!aur-b": [8.9, 3.4, 6.0] },
      content: [
        { "!!aur-a": [10.6, 4.4, 4.6], "!!aur-b": [-2.9, 5.1, 4.2] },
        { "!!aur-a": [-3.0, -2.2, 4.6], "!!aur-b": [10.9, 5.0, 4.0] },
        { "!!aur-a": [11.0, -1.8, 4.4], "!!aur-b": [3.6, 5.8, 4.0] },
        { "!!aur-a": [-2.6, 4.9, 4.6], "!!aur-b": [11.2, 1.2, 3.6] },
      ],
    },
  },

  cosmos: {
    id: "cosmos",
    name: "Cosmos",
    description: "Koinot: yulduzlar, tumanliklar va slayddan slaydga suzib o'tadigan sayyoralar",
    source: "animated-planets.md",
    surfaces: { cover: "dark", content: "dark", section: "dark", end: "dark" },
    bg: { cover: asset("cosmos/cover.jpg"), content: asset("cosmos/content.jpg"), section: asset("cosmos/section.jpg"), end: asset("cosmos/end.jpg") },
    fonts: { title: "Segoe UI Light", display: "Segoe UI Light", light: "Segoe UI Light", body: "Segoe UI", number: "Segoe UI Light" },
    upperCover: true,
    accent: "FF8A4C",
    accent2: "8ECBFF",
    palette: {
      dark: { text: "FFFFFF", muted: "B8C0D6", panel: "FFFFFF", panelAlpha: 94, line: "8ECBFF", lineAlpha: 75 },
    },
    valueStops: ["FFB088", "FF8A4C"],
    bullet: "25CF",
    decor: {
      items: {
        "!!planet-a": { img: asset("cosmos/mars.png"), alpha: 0 },
        "!!planet-b": { img: asset("cosmos/ice.png"), alpha: 0 },
        "!!planet-c": { img: asset("cosmos/giant.png"), alpha: 0 },
      },
      cover: { "!!planet-a": [7.9, 2.1, 7.6], "!!planet-b": [11.4, 0.5, 1.4], "!!planet-c": [14.2, -2.0, 2.0] },
      section: { "!!planet-a": [-1.4, 5.75, 2.4], "!!planet-b": [12.2, -0.35, 1.0], "!!planet-c": [10.6, 5.05, 3.8] },
      end: { "!!planet-a": [-2.2, 4.4, 5.0], "!!planet-b": [11.5, 0.6, 1.6], "!!planet-c": [9.4, 4.3, 4.6] },
      content: [
        { "!!planet-a": [11.45, 0.4, 1.5], "!!planet-b": [-0.75, 6.3, 1.4], "!!planet-c": [14.2, 6.6, 2.0] },
        { "!!planet-a": [12.15, 6.3, 1.25], "!!planet-b": [11.85, 0.35, 0.95], "!!planet-c": [-2.6, -2.4, 2.0] },
        { "!!planet-a": [-0.8, 6.0, 1.6], "!!planet-b": [12.0, 5.95, 1.0], "!!planet-c": [11.0, -0.75, 2.2] },
        { "!!planet-a": [11.5, 0.3, 1.6], "!!planet-b": [5.9, 6.8, 0.9], "!!planet-c": [-1.3, 5.5, 2.4] },
      ],
    },
  },

  editorial: {
    id: "editorial",
    name: "Editorial",
    description: "Ko'rgazma plakati uslubi: siyoh va qog'oz, signal to'q sariq, katta raqamlar",
    source: "scroll-web.md · Glacier",
    surfaces: { cover: "dark", content: "light", section: "dark", end: "dark" },
    bg: { cover: asset("editorial/ink.jpg"), content: asset("editorial/paper.jpg"), section: asset("editorial/ink.jpg"), end: asset("editorial/ink.jpg") },
    fonts: { title: "Georgia", display: "Georgia", light: "Georgia", body: "Segoe UI", number: "Georgia" },
    titleBold: true,
    accent: "FF4D00",
    accent2: "FF4D00",
    palette: {
      dark: { text: "F2F4F1", muted: "AEB4BE", panel: "FFFFFF", panelAlpha: 95, line: "F2F4F1", lineAlpha: 75 },
      light: { text: "0B0E14", muted: "4A515C", panel: "0B0E14", panelAlpha: 96, line: "0B0E14", lineAlpha: 80 },
    },
    italicAccent: true,
    bullet: "25A0",
    decor: {
      shapes: { "!!disc": { color: "FF4D00" } },
      cover: { "!!disc": [9.75, 1.0, 3.2] },
      section: { "!!disc": [11.55, 5.85, 1.15] },
      end: { "!!disc": [5.95, 0.9, 1.45] },
      content: [{ "!!disc": [11.95, 0.78, 0.42] }, { "!!disc": [11.95, 0.78, 0.42] }],
    },
  },
};


// Foydalanuvchining o'z veb-taqdimotlari (Misr, Meksika, Vatikan, Avstraliya) uslubidagi shablonlar.
Object.assign(PREMIUM, {
  misr: {
    id: "misr",
    // Shu uslub olingan jonli veb-taqdimot (public/demo/misr)
    demo: "/demo/misr/",
    name: "Misr",
    description: "Fir'avnlar uslubi: qora bronza fon, oltin bosh harfli sarlavhalar va piramidalar",
    source: "Misr-Taqdimoti",
    surfaces: { cover: "dark", content: "dark", section: "dark", end: "dark" },
    bg: { cover: asset("misr/cover.jpg"), content: asset("misr/content.jpg"), section: asset("misr/section.jpg"), end: asset("misr/end.jpg") },
    fonts: { title: "Georgia", display: "Georgia", light: "Georgia", body: "Segoe UI", number: "Georgia" },
    titleBold: true,
    upperTitles: true,
    upperCover: true,
    goldTitle: ["F6DFA0", "D4A856", "9C6E25"],
    accent: "D4A856",
    accent2: "E8C27A",
    palette: {
      dark: { text: "F4E9D4", muted: "B9A88A", panel: "D4A856", panelAlpha: 93, line: "D4A856", lineAlpha: 55 },
    },
    valueStops: ["F6DFA0", "C4923C"],
    bullet: "25C6",
    decor: {
      items: { "!!sun": { img: asset("misr/sun.png"), alpha: 20 } },
      cover: { "!!sun": [10.3, 0.35, 2.3] },
      section: { "!!sun": [11.3, 0.3, 1.5] },
      end: { "!!sun": [5.95, 0.25, 1.45] },
      content: [{ "!!sun": [11.9, 0.3, 1.0] }, { "!!sun": [12.2, 6.3, 1.1] }, { "!!sun": [-0.4, 6.3, 1.1] }, { "!!sun": [12.0, 3.2, 0.9] }],
    },
  },

  meksika: {
    id: "meksika",
    // Shu uslub olingan jonli veb-taqdimot (public/demo/meksika)
    demo: "/demo/meksika/",
    name: "Meksika",
    description: "Fiesta: krem qog'oz, rang-barang papel picado bayroqchalari va pushti kursiv aksent",
    source: "Presentation-Website-for-Mexico",
    surfaces: { cover: "light", content: "light", section: "dark", end: "light" },
    bg: { cover: asset("meksika/cover.jpg"), content: asset("meksika/content.jpg"), section: asset("meksika/section.jpg"), end: asset("meksika/end.jpg") },
    fonts: { title: "Bodoni MT Black", display: "Bodoni MT Black", light: "Bodoni MT", body: "Segoe UI", number: "Bodoni MT Black" },
    italicAccent: true,
    accentSplit: 0.5,
    accent: "E6007E",
    accent2: "0F9B9B",
    palette: {
      light: { text: "2B1A12", muted: "6B5344", panel: "FFFFFF", panelAlpha: 25, line: "E9CFA9", lineAlpha: 10, shadow: true },
      dark: { text: "FDF3E1", muted: "E2C9D8", panel: "FFFFFF", panelAlpha: 92, line: "F59F00", lineAlpha: 55, accent: "F59F00", accent2: "FF5CA8" },
    },
    valueStops: ["E6007E", "F59F00"],
    bullet: "25CF",
    decor: {
      shapes: { "!!c1": { color: "E6007E" }, "!!c2": { color: "F59F00" }, "!!c3": { color: "0F9B9B" } },
      cover: { "!!c1": [9.9, 2.1, 1.15], "!!c2": [11.6, 4.7, 0.5], "!!c3": [8.7, 5.7, 0.32] },
      section: { "!!c1": [12.1, 5.9, 0.8], "!!c2": [11.4, 6.5, 0.4], "!!c3": [12.6, 5.3, 0.3] },
      end: { "!!c1": [3.0, 5.2, 0.9], "!!c2": [9.6, 5.0, 0.7], "!!c3": [6.4, 5.6, 0.4] },
      content: [
        { "!!c1": [12.15, 0.85, 0.42], "!!c2": [12.6, 6.6, 0.32], "!!c3": [-0.1, 6.8, 0.26] },
        { "!!c1": [12.4, 6.4, 0.55], "!!c2": [12.15, 0.9, 0.36], "!!c3": [0.2, 7.0, 0.22] },
        { "!!c1": [12.2, 0.8, 0.4], "!!c2": [-0.15, 6.4, 0.42], "!!c3": [12.7, 6.9, 0.25] },
      ],
    },
  },

  vatikan: {
    id: "vatikan",
    // Shu uslub olingan jonli veb-taqdimot (public/demo/vatikan)
    demo: "/demo/vatikan/",
    name: "Vatikan",
    description: "Bog' rejasi: shag'al-bej fon, oltin ingichka ramka, Rim bosh harflari va to'q yashil",
    source: "Japan-presentation (Vatikan)",
    surfaces: { cover: "light", content: "light", section: "dark", end: "dark" },
    bg: { cover: asset("vatikan/cover.jpg"), content: asset("vatikan/content.jpg"), section: asset("vatikan/section.jpg"), end: asset("vatikan/end.jpg") },
    fonts: { title: "Georgia", display: "Georgia", light: "Georgia", body: "Gill Sans MT", number: "Georgia" },
    upperTitles: true,
    upperCover: true,
    accent: "8A6A26",
    accent2: "1F3B2A",
    palette: {
      light: { text: "1F3B2A", muted: "555D4B", panel: "F6F5EF", panelAlpha: 25, line: "A9853A", lineAlpha: 35 },
      dark: { text: "F6F5EF", muted: "C9D2B8", panel: "F6F5EF", panelAlpha: 93, line: "D2B46C", lineAlpha: 50, accent: "D2B46C", accent2: "9FB28F" },
    },
    valueStops: ["A9853A", "D2B46C"],
    bullet: "25C6",
    decor: {
      shapes: { "!!basin": { color: "A9853A", outline: 1.25 }, "!!fleuron": { color: "A9853A" } },
      cover: { "!!basin": [9.25, 2.85, 2.1], "!!fleuron": [10.2, 3.8, 0.2] },
      section: { "!!basin": [9.4, 2.75, 2.0], "!!fleuron": [10.32, 3.65, 0.18] },
      end: { "!!basin": [5.67, 4.3, 2.0], "!!fleuron": [6.57, 5.2, 0.2] },
      content: [
        { "!!basin": [12.3, 6.35, 1.4], "!!fleuron": [12.2, 0.95, 0.16] },
        { "!!basin": [12.4, -0.6, 1.3], "!!fleuron": [12.2, 6.75, 0.16] },
      ],
    },
  },

  avstraliya: {
    id: "avstraliya",
    // Shu uslub olingan jonli veb-taqdimot (public/demo/avstraliya)
    demo: "/demo/avstraliya/",
    name: "Avstraliya",
    description: "Janubiy Xoch: shom osmoni va yulduzlar, qumrang sahifalar va topografik chiziqlar",
    source: "Australia-presentation",
    surfaces: { cover: "dark", content: "light", section: "dark", end: "dark" },
    bg: { cover: asset("avstraliya/cover.jpg"), content: asset("avstraliya/content.jpg"), section: asset("avstraliya/section.jpg"), end: asset("avstraliya/end.jpg") },
    fonts: { title: "Georgia", display: "Georgia", light: "Georgia", body: "Segoe UI", number: "Georgia" },
    titleBold: true,
    italicAccent: true,
    accentSplit: 0.55,
    accent: "F2B33D",
    accent2: "8ECBFF",
    palette: {
      dark: { text: "FFFFFF", muted: "C8D2E6", panel: "FFFFFF", panelAlpha: 92, line: "F2B33D", lineAlpha: 60 },
      light: { text: "14294A", muted: "5B5446", panel: "FFFFFF", panelAlpha: 35, line: "B0682A", lineAlpha: 70, shadow: true, accent: "B0682A", accent2: "2C5F8A" },
    },
    valueStops: ["F2B33D", "F7D58A"],
    bullet: "25CF",
    decor: {
      items: { "!!star": { img: asset("avstraliya/star.png"), alpha: 15 } },
      shapes: { "!!pin": { color: "B0682A" } },
      cover: { "!!star": [11.8, 5.2, 1.0] },
      section: { "!!star": [11.9, 0.35, 0.9] },
      end: { "!!star": [11.2, 5.4, 1.0] },
      content: [{ "!!pin": [12.2, 0.95, 0.2] }, { "!!pin": [12.2, 0.95, 0.2] }],
    },
  },
});

export const PREMIUM_IDS = Object.keys(PREMIUM);

export function isPremium(theme) {
  return Object.hasOwn(PREMIUM, theme);
}
