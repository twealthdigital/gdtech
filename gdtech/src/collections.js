import "./collections.css";
import { CATS, svg } from "./data/categories.js";
import { picked, setCategory } from "./categories.js";
import { lensBoost } from "./glass.js";
import { isLow, isHigh, observeLazyImages } from "./perf.js";

const $ = (id) => document.getElementById(id);

// Display names for collections (falls back to the brand name)
export const TITLES = {
  "mobile:Apple": "iPhone", "mobile:Samsung": "Galaxy", "mobile:Google": "Pixel",
  "laptops:Apple": "MacBook", "laptops:Samsung": "Galaxy Book", "tablets:Apple": "iPad", "tablets:Samsung": "Galaxy Tab",
  "headsets:Beats": "Beats",
};
// Photos we have so far. Everything else shows the category icon until you add one.
export const IMAGES = {
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
  "tablets:Apple": { src: "/tablets/apple.webp", w: 664, h: 760, z: 0.78, up: 16 },
  "tablets:Samsung": { src: "/tablets/samsung.webp", w: 1118, h: 760, z: 1.05, up: 26, x: -7 },
  "tablets:Lenovo": { src: "/tablets/lenovo.webp", w: 1194, h: 760, z: 1.3, up: 14 },
  "tablets:Infinix": { src: "/tablets/infinix.webp", w: 505, h: 760, z: 1, up: 4 },
  "tablets:Huawei": { src: "/tablets/huawei.webp", w: 1050, h: 760, z: 1, up: 0 },
  "gaming:PS5": { src: "/gaming/playstation.webp", w: 525, h: 760, z: 1, up: 4 },
  "gaming:Xbox": { src: "/gaming/xbox.webp", w: 644, h: 760, z: 1, up: 4 },
  "gaming:Switch": { src: "/gaming/nintendo.webp", w: 956, h: 760, z: 1.05, up: 18 },
  "gaming:ROG": { src: "/gaming/rog.webp", w: 1320, h: 760, z: 1.1, up: 24 },
  "gaming:Logitech": { src: "/gaming/logitech.webp", w: 2227, h: 760, z: 0.95, up: 18 },
  "headsets:Sony": { src: "/headsets/sony.webp", w: 495, h: 760 },
  "headsets:JBL": { src: "/headsets/jbl.webp", w: 494, h: 760 },
  "headsets:Bose": { src: "/headsets/bose.webp", w: 578, h: 760 },
  "headsets:Anker": { src: "/headsets/anker.webp", w: 614, h: 760 },
  "headsets:Beats": { src: "/headsets/beats.webp", w: 597, h: 760 },
};
// Same colour blocks as the home banners
const TONES = ["orange", "slate", "cream", "ink"];
// Cards that need their own colour (matched to the phone)
export const TONE_OF = {
  "mobile:itel": "plum",
  // Laptops: light silver ones sit on dark cards, dark ones on light cards
  "laptops:Apple": "silver", "laptops:Dell": "pewter", "laptops:HP": "navy",
  "laptops:Lenovo": "onyx", "laptops:Asus": "graphite", "laptops:Samsung": "steel",
  // Tablets
  "tablets:Apple": "cream", "tablets:Samsung": "slate", "tablets:Lenovo": "orange",
  "tablets:Infinix": "cream", "tablets:Huawei": "ink",
  // Gaming
  "gaming:PS5": "slate", "gaming:Xbox": "cream", "gaming:Switch": "steel",
  "gaming:ROG": "orange", "gaming:Logitech": "plum",
  // Headsets: colour contrasts with each headset
  "headsets:Sony": "cream", "headsets:JBL": "orange", "headsets:Bose": "graphite",
  "headsets:Anker": "cream", "headsets:Beats": "ink",
};

const TAB_LABEL = { mobile: "Phones", laptops: "Laptops", headsets: "Headsets", tablets: "Tablets", gaming: "Gaming" };
const TABS = [{ id: "all", name: "All" }, ...CATS.map((c) => ({ id: c.id, name: TAB_LABEL[c.id] || c.name }))];

const scrollEl = $("col-scroll");
const tabsEl = $("col-tabs");
const gridEl = $("col-grid");
const midEl = $("col-mid");
const searchBox = $("col-search");
const qEl = $("col-q");
const reduceMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

tabsEl.innerHTML = TABS.map((t) => `<button class="c-tab" type="button" role="tab" data-id="${t.id}">${t.name}</button>`).join("");

function cardHtml(cat, brand, i) {
  const key = cat.id + ":" + brand;
  const title = TITLES[key] || brand;
  const sub = title !== brand ? brand : "";
  const img = IMAGES[key];
  const catLabel = TAB_LABEL[cat.id] || cat.name;
  const searchStr = `${title} ${brand} ${catLabel}`.toLowerCase();
  const art = img
    ? `<img data-src="${img.src}" width="${img.w}" height="${img.h}" alt="${title}"${img.z ? ` style="--z:${img.z};--up:${img.up}%${img.x ? `;--x:${img.x}%` : ""}"` : ""} loading="lazy" decoding="async" draggable="false" />`
    : `<span class="k-ico">${svg(cat.icon)}</span>`;
  return `<button class="k-card ${TONE_OF[key] || TONES[i % TONES.length]}${img ? " has-img" : ""}" type="button" data-cat="${cat.id}" data-brand="${brand}" data-key="${key}" data-search="${searchStr}" style="--i:${i}">
    <span class="k-art">${art}</span>
    <span class="k-text">${sub ? `<small>${sub}</small>` : ""}<b>${title}</b></span>
    <span class="k-go" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg></span>
  </button>`;
}

// Build all collection cards at once so all categories appear in a 2x2 grid
const ALL_ENTRIES = [];
let idx = 0;
for (const cat of CATS) {
  for (const brand of cat.brands) {
    ALL_ENTRIES.push({ cat, brand, key: cat.id + ":" + brand, idx: idx++ });
  }
}
const cardByKey = new Map();
let activeTab = "all";
let built = false;

export function ensureCollectionsRendered() {
  if (!built) {
    built = true;
    const ordered = orderedEntries(activeTab);
    gridEl.innerHTML = ordered.map((e, i) => cardHtml(e.cat, e.brand, i)).join("");
    gridEl.querySelectorAll(".k-card").forEach((el) => cardByKey.set(el.dataset.key, el));
    updateWide();
  }
  observeLazyImages(scrollEl, gridEl);
}

function updateWide() {
  gridEl.querySelector(".sp-none")?.remove();
  const cards = [...gridEl.querySelectorAll(".k-card")];
  cards.forEach((c) => c.classList.remove("wide"));
  const vis = cards.filter((c) => !c.hidden);
  if (vis.length % 2 === 1) vis[vis.length - 1].classList.add("wide");
  const q = (qEl?.value || "").trim();
  if (!vis.length && q) {
    gridEl.insertAdjacentHTML("beforeend", `<div class="sp-none">Nothing matches "${q.replace(/[<>&"]/g, "")}"</div>`);
  }
}

function orderedEntries(tabId) {
  if (!tabId || tabId === "all") return ALL_ENTRIES;
  const top = ALL_ENTRIES.filter((e) => e.cat.id === tabId);
  const rest = ALL_ENTRIES.filter((e) => e.cat.id !== tabId);
  return [...top, ...rest];
}

function syncTabs(tabId, instant = false) {
  tabsEl.querySelectorAll(".c-tab").forEach((t) => {
    const on = t.dataset.id === tabId;
    t.classList.toggle("on", on);
    t.setAttribute("aria-selected", String(on));
    if (on) tabsEl.scrollTo({ left: Math.max(0, t.offsetLeft - (tabsEl.clientWidth - t.offsetWidth) / 2), behavior: instant ? "auto" : "smooth" });
  });
}

// Reorder cards so the selected category moves to the top and phones shift down smoothly
export function setCollectionFilter(tabId = "all", { animate = true, scrollTop = false } = {}) {
  const nextTab = tabId && TABS.some((t) => t.id === tabId) ? tabId : "all";
  syncTabs(nextTab, !animate);
  if (activeTab === nextTab) {
    if (scrollTop && scrollEl) scrollEl.scrollTo({ top: 0, behavior: animate ? "smooth" : "auto" });
    return;
  }
  activeTab = nextTab;
  if (!built) {
    if (scrollTop && scrollEl) scrollEl.scrollTop = 0;
    return;
  }

  const canFlip = animate && !isLow && !reduceMotion() && gridEl.offsetParent !== null;
  const firstRects = new Map();
  if (canFlip) {
    cardByKey.forEach((el, k) => {
      if (!el.hidden) firstRects.set(k, el.getBoundingClientRect());
    });
  }

  const ordered = orderedEntries(nextTab);
  const frag = document.createDocumentFragment();
  ordered.forEach((e) => {
    const el = cardByKey.get(e.key);
    if (el) frag.appendChild(el);
  });
  gridEl.appendChild(frag);
  updateWide();
  observeLazyImages(scrollEl, gridEl);

  if (canFlip) {
    cardByKey.forEach((el, k) => {
      const first = firstRects.get(k);
      if (!first || el.hidden) return;
      const last = el.getBoundingClientRect();
      const dx = first.left - last.left;
      const dy = first.top - last.top;
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
      el.animate(
        [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "none" }],
        { duration: 440, easing: "cubic-bezier(0.22, 1.08, 0.36, 1)" }
      );
    });
  }

  if (scrollTop && scrollEl && scrollEl.scrollTop > 12) {
    scrollEl.scrollTo({ top: 0, behavior: animate ? "smooth" : "auto" });
  }
}

export function resetCollectionSearch() {
  if (!qEl) return;
  qEl.value = "";
  midEl?.classList.remove("searching");
  if (!built) return;
  cardByKey.forEach((el) => { el.hidden = false; });
  updateWide();
}

function filterGrid() {
  if (!built) ensureCollectionsRendered();
  const q = (qEl?.value || "").trim().toLowerCase();
  cardByKey.forEach((el) => {
    el.hidden = q ? !el.dataset.search.includes(q) : false;
  });
  updateWide();
  observeLazyImages(scrollEl, gridEl);
}

tabsEl.addEventListener("click", (e) => {
  const t = e.target.closest(".c-tab");
  if (!t) return;
  const id = t.dataset.id;
  setCollectionFilter(id, { animate: true, scrollTop: true });
  setCategory(id === "all" ? null : id);
});

// Liquid glass search circle: smoothly expands left over the "Collections" title on click/focus
function syncSearchClass() {
  if (!midEl || !qEl) return;
  const on = document.activeElement === qEl || qEl.value.trim().length > 0;
  midEl.classList.toggle("searching", on);
}
if (searchBox && qEl) {
  searchBox.addEventListener("click", () => {
    if (document.activeElement !== qEl) {
      qEl.focus();
      lensBoost(searchBox, 1.35);
      setTimeout(() => lensBoost(searchBox, 1), 240);
    }
  });
  qEl.addEventListener("focus", syncSearchClass);
  qEl.addEventListener("blur", syncSearchClass);
  qEl.addEventListener("input", () => {
    syncSearchClass();
    filterGrid();
  });
  qEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { qEl.blur(); return; }
    if (e.key === "Escape") {
      e.stopPropagation();
      if (qEl.value) { qEl.value = ""; filterGrid(); }
      qEl.blur();
      syncSearchClass();
    }
  });
}

// Tilt: the card leans toward the pointer and the device rotates a little and shifts with it
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
if (!isLow) {
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
}

// Tapping a collection card opens its brand shop on top of Collections
gridEl.addEventListener("click", (e) => {
  const c = e.target.closest(".k-card");
  if (c) document.dispatchEvent(new CustomEvent("collection:open", { detail: { cat: c.dataset.cat, brand: c.dataset.brand, trigger: c } }));
});

// Follow category selections from Home
document.addEventListener("category:change", () => {
  setCollectionFilter(picked.cat || "all", { animate: false });
});

// Initial render: All tab active; pre-build in idle time only on high-end devices
syncTabs("all", true);
if (isHigh) {
  const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 700));
  idle(() => ensureCollectionsRendered());
}
