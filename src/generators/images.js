import { config } from "../config.js";

// Pexels'dan slayd uchun rasm oladi (ixtiyoriy: PEXELS_API_KEY bo'lmasa rasmsiz ishlaydi).
// Rasm slayddagi ramkaga moslab kesiladi (standart: 3.8 × 5.625 dyuym, premium: 4.48 × 5.1).
const SIZES = { standard: [760, 1125], premium: [880, 1000] };

async function fetchImage(query, [width, height]) {
  const url = new URL("https://api.pexels.com/v1/search");
  url.searchParams.set("query", query);
  url.searchParams.set("per_page", "3");
  url.searchParams.set("orientation", "portrait");
  const search = await fetch(url, {
    headers: { Authorization: config.pexelsKey },
    signal: AbortSignal.timeout(10_000),
  });
  if (!search.ok) return null;
  const { photos = [] } = await search.json();
  const photo = photos[0];
  if (!photo?.src?.original) return null;

  const imageUrl = `${photo.src.original}?auto=compress&cs=tinysrgb&fit=crop&w=${width}&h=${height}`;
  const image = await fetch(imageUrl, { signal: AbortSignal.timeout(15_000) });
  if (!image.ok) return null;
  const buffer = Buffer.from(await image.arrayBuffer());
  return `image/jpeg;base64,${buffer.toString("base64")}`;
}

/**
 * Veb-taqdimotning birinchi bo'limi uchun bitta keng (landshaft) rasm: data-URL yoki "" (kalit yo'q / topilmadi).
 * Veb-taqdimot ichiga joylangani uchun hajmi ~300 KB atrofida tutiladi.
 */
export async function fetchLandscapeImage(query) {
  if (!config.pexelsKey || !query) return "";
  try {
    const url = new URL("https://api.pexels.com/v1/search");
    url.searchParams.set("query", query);
    url.searchParams.set("per_page", "3");
    url.searchParams.set("orientation", "landscape");
    const search = await fetch(url, { headers: { Authorization: config.pexelsKey }, signal: AbortSignal.timeout(10_000) });
    if (!search.ok) return "";
    const photo = (await search.json()).photos?.[0];
    if (!photo?.src?.original) return "";
    const image = await fetch(`${photo.src.original}?auto=compress&cs=tinysrgb&fit=crop&w=1800&h=1100`, { signal: AbortSignal.timeout(20_000) });
    if (!image.ok) return "";
    const buffer = Buffer.from(await image.arrayBuffer());
    return buffer.length > 1_500_000 ? "" : `data:image/jpeg;base64,${buffer.toString("base64")}`;
  } catch {
    return "";
  }
}

/** "bullets" turidagi slaydlar uchun rasmlar: { slaydIndeksi: base64 }. */
export async function fetchSlideImages(slides, kind = "standard") {
  if (!config.pexelsKey) return {};
  const images = {};
  await Promise.all(
    slides.map(async (slide, i) => {
      if (slide.type !== "bullets" || !slide.image_query) return;
      try {
        const image = await fetchImage(slide.image_query, SIZES[kind]);
        if (image) images[i] = image;
      } catch {
        // Rasm topilmasa slayd "asosiy fikr" kartasi bilan chiqadi.
      }
    }),
  );
  return images;
}
