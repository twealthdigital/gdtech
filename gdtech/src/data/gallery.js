// Photos for each phone. The first photo is the one the shop card uses; the product page shows all of them as thumbnails.
//   cut    a transparent cut-out phone (sits on the page's soft background)
//   wide   a banner that already has the model's name written on it (shown whole, over a blurred copy of itself)
//   poster a dark square photo
// Drop your own photo into src/assets/models/ named after the product id (for example galaxy-s26-ultra.webp)
// and it becomes the first photo of that phone automatically.

const own = {};
const found = import.meta.glob("../assets/models/*.{webp,png,jpg,jpeg,avif}", { eager: true, query: "?url", import: "default" });
for (const [path, url] of Object.entries(found)) own[path.split("/").pop().replace(/\.[^.]+$/, "")] = url;

const cut = (src) => ({ src, kind: "cut" });
const wide = (src) => ({ src, kind: "wide" });
const poster = (src) => ({ src, kind: "poster" });

const ORANGE_IPHONE = cut("/phones/banner-1.webp");        // orange iPhone, front and back
const NAVY_IPHONE = cut("/phones/hero.webp");              // navy and titanium iPhones, backs
const GALAXY_ULTRA = cut("/phones/banner-2.webp");         // Galaxy Ultra with S Pen
const PIXEL = cut("/phones/banner-3.webp");                // cream Pixel
const ITEL = cut("/phones/itel.webp");                     // magenta itel
const IPHONE_18_PRO_NAME = wide("/launch/iphone-18-pro.webp");
const S26_ULTRA_NAME = wide("/launch/galaxy-s26-ultra.webp");
const FOLD8_NAME = wide("/launch/galaxy-z-fold8.webp");    // Fold8 Ultra, Fold8 and Flip8 written on it
const FOLDABLE = poster("/foldable/galaxy-fold-poster.webp");

const BY_ID = {
  "iphone-18-pro": [ORANGE_IPHONE, IPHONE_18_PRO_NAME, NAVY_IPHONE],
  "iphone-18-pro-max": [ORANGE_IPHONE, IPHONE_18_PRO_NAME, NAVY_IPHONE],
  "iphone-duo": [NAVY_IPHONE],
  "galaxy-s26-ultra": [GALAXY_ULTRA, S26_ULTRA_NAME],
  "galaxy-z-fold8-ultra": [FOLD8_NAME, FOLDABLE],
  "galaxy-z-fold8": [FOLD8_NAME, FOLDABLE],
  "galaxy-z-flip8": [FOLD8_NAME, FOLDABLE],
  "galaxy-z-fold7": [FOLDABLE],
  "galaxy-z-flip7": [FOLDABLE],
};
const BY_PREFIX = [
  ["iphone-", [NAVY_IPHONE, ORANGE_IPHONE]],     // iPhone 17 series and Air
  ["galaxy-", [GALAXY_ULTRA]],                   // S series
  ["pixel-", [PIXEL]],
  ["itel-", [ITEL]],
];

// Laptops, tablets, headsets and gaming use their brand photo until the product has its own (see shop.js)
const brandArt = {};
export const registerArt = (id, src) => { brandArt[id] = [cut(src)]; };

export function galleryOf(id) {
  const list = BY_ID[id] || brandArt[id] || (BY_PREFIX.find(([p]) => id.startsWith(p)) || [, []])[1];
  return own[id] ? [cut(own[id]), ...list] : list;
}

// The picture for a shop card: a cut-out if there is one, otherwise the first photo
export function cardPhoto(id) {
  const g = galleryOf(id);
  return g.find((p) => p.kind === "cut") || g.find((p) => p.kind === "poster") || g[0] || null;
}
