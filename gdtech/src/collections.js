import "./collections.css";
import { CATS, svg } from "./data/categories.js";
import { picked, setCategory } from "./categories.js";

const $ = (id) => document.getElementById(id);
const DEFAULT_CAT = "mobile";

// Display names for collections (falls back to the brand name)
const TITLES = {
  "mobile:Apple": "iPhone", "mobile:Samsung": "Galaxy", "mobile:Google": "Pixel",
  "laptops:Apple": "MacBook", "laptops:Samsung": "Galaxy Book", "tablets:Apple": "iPad", "tablets:Samsung": "Galaxy Tab",
  "headsets:Anker": "Soundcore", "headsets:Beats": "Beats", "wearables:Apple Watch": "Apple Watch",
  "tvs:Samsung": "Samsung TV", "tvs:LG": "LG TV", "tvs:Sony": "Sony TV",
};
// Photos we have so far. Everything else shows the category icon until you add one.
const IMAGES = {
  "mobile:Apple": { src: "/phones/banner-1.webp", w: 672, h: 760 },
  "mobile:Samsung": { src: "/phones/banner-2.webp", w: 632, h: 760 },
  "mobile:Google": { src: "/phones/banner-3.webp", w: 512, h: 760 },
  "mobile:itel": { src: "/phones/itel.webp", w: 604, h: 760 },
  "laptops:Apple": { src: "/laptops/apple.webp", w: 1150, h: 760, z: 1.2, up: 15 },
  "laptops:Dell": { src: "/laptops/dell.webp", w: 599, h: 760, z: 1.5, up: 0 },
  "laptops:HP": { src: "/laptops/hp.webp", w: 1227, h: 760, z: 1.50, up: 10 },
  "laptops:Lenovo": { src: "/laptops/lenovo.webp", w: 844, h: 760, z: 1.9, up: 5 },
  "laptops:Asus": { src: "/laptops/asus.webp", w: 1237, h: 760, z: 1.5, up: 10 },
  "laptops:Samsung": { src: "/laptops/samsung.webp", w: 1238, h: 760, z: 1.2, up: 20 },
  "headsets:Sony": { src: "/headsets/sony.webp", w: 495, h: 760 },
  "headsets:JBL": { src: "/headsets/jbl.webp", w: 494, h: 760 },
  "headsets:Bose": { src: "/headsets/bose.webp", w: 578, h: 760 },
  "headsets:Anker": { src: "/headsets/anker.webp", w: 614, h: 760 },
  "headsets:Beats": { src: "/headsets/beats.webp", w: 597, h: 760 },
};
// Same colour blocks as the home banners
const TONES = ["orange", "slate", "cream", "ink"];
// Cards that need their own colour (matched to the phone)
const TONE_OF = {
  "mobile:itel": "plum",
  // Laptops: light silver ones sit on dark cards, dark ones on light cards
  "laptops:Apple": "silver", "laptops:Dell": "pewter", "laptops:HP": "navy",
  "laptops:Lenovo": "onyx", "laptops:Asus": "graphite", "laptops:Samsung": "steel",
  // Headsets: colour contrasts with each headset
  "headsets:Sony": "cream", "headsets:JBL": "orange", "headsets:Bose": "graphite",
  "headsets:Anker": "cream", "headsets:Beats": "ink",
};

const tabsEl = $("col-tabs");
const gridEl = $("col-grid");

tabsEl.innerHTML = CATS.map((c) => `<button class="c-tab" type="button" role="tab" data-id="${c.id}">${c.name}</button>`).join("");

function card(cat, brand, i) {
  const key = cat.id + ":" + brand;
  const title = TITLES[key] || brand;
  const sub = title !== brand ? brand : "";
  const img = IMAGES[key];
  const art = img
    ? `<img src="${img.src}" width="${img.w}" height="${img.h}" alt="${title}"${img.z ? ` style="--z:${img.z};--up:${img.up}%"` : ""} loading="lazy" decoding="async" draggable="false" />`
    : `<span class="k-ico">${svg(cat.icon)}</span>`;
  return `<button class="k-card ${TONE_OF[key] || TONES[i % TONES.length]}${img ? " has-img" : ""}" type="button" data-cat="${cat.id}" data-brand="${brand}" style="--i:${i}">
    <span class="k-art">${art}</span>
    <span class="k-text">${sub ? `<small>${sub}</small>` : ""}<b>${title}</b></span>
    <span class="k-go" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg></span>
  </button>`;
}

let shown = null;
function render() {
  const id = picked.cat || DEFAULT_CAT;
  tabsEl.querySelectorAll(".c-tab").forEach((t) => {
    const on = t.dataset.id === id;
    t.classList.toggle("on", on);
    t.setAttribute("aria-selected", on);
    if (on && shown !== id) tabsEl.scrollTo({ left: t.offsetLeft - (tabsEl.clientWidth - t.offsetWidth) / 2, behavior: "smooth" });
  });
  if (shown === id) return;
  shown = id;
  const cat = CATS.find((c) => c.id === id);
  gridEl.innerHTML = cat.brands.map((b, i) => card(cat, b, i)).join("");
  gridEl.dataset.cat = id;
}

tabsEl.addEventListener("click", (e) => {
  const t = e.target.closest(".c-tab");
  if (t) setCategory(t.dataset.id);
});

// Tilt: the card leans toward the pointer and the phone rotates a little and shifts with it (mouse hover or finger)
const lean = (card, e) => {
  const r = card.getBoundingClientRect();
  const px = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width) * 2 - 1));
  const py = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height) * 2 - 1));
  card.style.setProperty("--px", px.toFixed(3));
  card.style.setProperty("--py", py.toFixed(3));
  card.classList.add("hot");
};
const settle = (card) => {
  card.classList.remove("hot");
  card.style.removeProperty("--px");
  card.style.removeProperty("--py");
};
const onMove = (e) => { const c = e.target.closest(".k-card"); if (c) lean(c, e); };
gridEl.addEventListener("pointerover", onMove);
gridEl.addEventListener("pointermove", onMove);
gridEl.addEventListener("pointerdown", onMove);
gridEl.addEventListener("pointerout", (e) => {
  const c = e.target.closest(".k-card");
  if (c && !c.contains(e.relatedTarget)) settle(c);
});
gridEl.addEventListener("pointerup", (e) => { const c = e.target.closest(".k-card"); if (c) setTimeout(() => settle(c), 220); });
gridEl.addEventListener("pointercancel", (e) => { const c = e.target.closest(".k-card"); if (c) settle(c); });

// Tapping a collection tells the rest of the app which one was opened
gridEl.addEventListener("click", (e) => {
  const c = e.target.closest(".k-card");
  if (c) document.dispatchEvent(new CustomEvent("collection:open", { detail: { cat: c.dataset.cat, brand: c.dataset.brand } }));
});

// Follows the category bubbles and the "All categories" dropdown too
document.addEventListener("category:change", render);

// Mobile is the default collection
if (!picked.cat) setCategory(DEFAULT_CAT); else render();
