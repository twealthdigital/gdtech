import "./shop.css";
import { CATS, svg } from "./data/categories.js";
import { PHONE_SHOPS } from "./data/phones.js";
import { IMAGES, TITLES, TONE_OF } from "./collections.js";

// The shop page. Anything can open it:
//   <button data-shop="mobile:Apple">          the iPhone shop
//   <button data-shop="mobile:Samsung">        Samsung: S series first, its foldables next
//   <button data-shop="mobile:Samsung:fold">   Samsung: foldables first, then the S series
//   <button data-shop="laptops:Dell">          any collection card (category:brand)
//   <button data-shop="all:all">               the general shop page (every phone, grouped by brand)
// or from JS: openShop({ cat: "mobile", brand: "Samsung", focus: "fold" })
// Tap any product card to open its page: openProduct("galaxy-s26-ultra")

const $ = (id) => document.getElementById(id);
const home = $("home");
const shop = $("shop");
const scroller = $("sp-scroll");
const heroEl = $("sp-hero");
const chipsEl = $("sp-chips");
const bodyEl = $("sp-body");
const titleEl = $("sp-title");
const topEl = shop.querySelector(".h-top");
const pd = $("pd");
const pdScroll = $("pd-scroll");
const pdBody = $("pd-body");
const pdTitle = $("pd-title");
const pdTop = pd.querySelector(".h-top");
const ALL = { cat: "all", brand: "all", focus: null };
const naira = (n) => "₦" + Number(n).toLocaleString("en-NG");

// Photos dropped into src/assets/models/ (named after the product id) are picked up automatically
const MODEL_IMG = {};
const found = import.meta.glob("./assets/models/*.{webp,png,jpg,jpeg,avif}", { eager: true, query: "?url", import: "default" });
for (const [path, url] of Object.entries(found)) MODEL_IMG[path.split("/").pop().replace(/\.[^.]+$/, "")] = url;

const ICONS = {
  phone: CATS.find((c) => c.id === "mobile").icon,
  fold: '<rect x="3" y="5" width="18" height="14" rx="2.4"/><path d="M12 5v14"/>',
  flip: '<rect x="6.5" y="3" width="11" height="18" rx="2.6"/><path d="M6.5 12h11"/>',
};
const iconFor = (item) => (!item.fold ? ICONS.phone : /flip/i.test(item.name) ? ICONS.flip : ICONS.fold);
const BAG = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M5.7 8.6a1 1 0 0 1 1-.9h10.6a1 1 0 0 1 1 .9l.95 10.5a2 2 0 0 1-1.99 2.2H6.74a2 2 0 0 1-1.99-2.2L5.7 8.6z"/><path d="M9 9V6.5a3 3 0 0 1 6 0V9" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>';

const state = { route: null, view: null, group: null, trigger: null, open: false, pid: null, ptrigger: null, pOpen: false };

// Every phone by id, so a product page can find its photo, its series and its neighbours
const PRODUCTS = {};
for (const [brand, cfg] of Object.entries(PHONE_SHOPS)) {
  for (const g of cfg.groups) for (const item of g.items) PRODUCTS[item.id] = { item, group: g, brand, cfg };
}

const parse = (str) => { const [cat, brand, focus] = String(str).split(":"); return { cat, brand, focus: focus || null }; };
const keyOf = (r) => [r.cat, r.brand, r.focus].filter(Boolean).join(":");

/* ---------- what to show ---------- */
function orderedGroups(cfg, focus) {
  const gs = cfg.groups.map((g) => ({
    ...g,
    items: focus === "fold" ? [...g.items.filter((i) => i.fold), ...g.items.filter((i) => !i.fold)] : g.items,
  }));
  // Arrived through a foldable button: foldables first, then their brand partner. Otherwise the normal phones lead.
  return focus === "fold" ? [...gs.filter((g) => g.fold), ...gs.filter((g) => !g.fold)] : gs;
}

// One view = the chips on top and the sections below. A brand shop chips by series; the general shop chips by brand.
function viewOf(route) {
  if (route.cat === "all") {
    const brands = Object.entries(PHONE_SHOPS);
    return {
      chips: brands.map(([k, c]) => ({ id: k, label: c.title })),
      groups: brands.flatMap(([k, c]) => c.groups.map((g) => ({ ...g, key: k }))),
    };
  }
  const cfg = route.cat === "mobile" ? PHONE_SHOPS[route.brand] : null;
  if (!cfg) return null;
  const groups = orderedGroups(cfg, route.focus).map((g) => ({ ...g, key: g.id }));
  return { chips: groups.map((g) => ({ id: g.id, label: g.chip })), groups };
}

function card(item, tone, i, wide) {
  const img = MODEL_IMG[item.id];
  const art = img
    ? `<img src="${img}" alt="${item.name}" loading="lazy" decoding="async" draggable="false" />`
    : `<span class="sp-ico">${svg(iconFor(item))}</span>`;
  const buy = item.price
    ? `<div class="sp-buy"><b>${naira(item.price)}</b>
         <button class="sp-add" type="button" data-add-to-cart data-id="${item.id}" data-name="${item.name}" data-price="${item.price}"${img ? ` data-img="${img}"` : ""} aria-label="Add ${item.name} to bag">${BAG}</button></div>`
    : "";
  return `<article class="sp-card ${tone}${wide ? " wide" : ""}" style="--i:${i}" data-pid="${item.id}" role="button" tabindex="0" aria-label="View ${item.name}">
    <div class="sp-art">${item.fold ? '<span class="sp-tag">Foldable</span>' : ""}${art}</div>
    <div class="sp-info"><h4>${item.name}</h4>${buy}</div>
  </article>`;
}

function renderBody(view) {
  chipsEl.innerHTML =
    `<button class="c-tab${state.group ? "" : " on"}" type="button" role="tab" data-g="">All</button>` +
    view.chips.map((c) => `<button class="c-tab${state.group === c.id ? " on" : ""}" type="button" role="tab" data-g="${c.id}">${c.label}</button>`).join("");
  chipsEl.hidden = false;
  let n = 0;
  bodyEl.innerHTML = view.groups
    .filter((g) => !state.group || g.key === state.group)
    .map((g) => `<section class="sp-sec" aria-label="${g.title}">
        <h3>${g.title}</h3>
        <div class="sp-grid">${g.items.map((it, k) => card(it, g.tone, n++, g.items.length % 2 === 1 && k === g.items.length - 1)).join("")}</div>
      </section>`).join("");
}

function render(route) {
  const view = viewOf(route);
  state.view = view;

  // The general shop page: a fan of the phones, then every series
  if (route.cat === "all") {
    titleEl.textContent = "Shop";
    heroEl.className = "sp-hero ink fan";
    heroEl.innerHTML =
      ["mobile:Google", "mobile:Samsung", "mobile:Apple"].map((k) => `<img src="${IMAGES[k].src}" alt="" decoding="async" draggable="false" />`).join("") +
      `<p class="sp-kick">GDTech</p><h2>All<br>phones</h2>`;
    renderBody(view);
    return;
  }

  const key = route.cat + ":" + route.brand;
  const cfg = route.cat === "mobile" ? PHONE_SHOPS[route.brand] : null;
  const fold = route.focus === "fold" && cfg;
  const title = fold ? "Foldables" : cfg ? cfg.title : TITLES[key] || route.brand;
  const tone = fold ? "ink" : cfg ? cfg.tone : TONE_OF[key] || "ink";
  const art = IMAGES[cfg ? cfg.art : key];

  titleEl.textContent = title;
  heroEl.className = "sp-hero " + tone + (fold ? " fold" : "");
  heroEl.innerHTML =
    (fold ? "" : art ? `<img src="${art.src}" alt="" decoding="async" draggable="false" />` : "") +
    `<p class="sp-kick">${fold ? "Samsung Galaxy Z" : "Shop"}</p><h2>${title}</h2>`;

  if (view) {
    renderBody(view);
  } else {
    chipsEl.hidden = true;
    chipsEl.innerHTML = "";
    bodyEl.innerHTML = `<div class="sp-soon"><b>COMING SOON</b><p>We are adding the latest ${title} models.</p>
      <button type="button" id="sp-soon-back">Back to collections</button></div>`;
  }
}

/* ---------- the product page ---------- */
const PERKS = [
  { t: "100% genuine", d: '<path d="M12 3l7.5 3v5.5c0 4.4-3.1 7.9-7.5 9.5-4.4-1.6-7.5-5.1-7.5-9.5V6L12 3z"/><path d="M8.8 12l2.3 2.3 4.2-4.6"/>' },
  { t: "Fast delivery", d: '<path d="M3 6.5h10v9H3zM13 9.5h4l3 3v3h-7"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="16.5" cy="17.5" r="1.8"/>' },
  { t: "Trade in your old phone", d: '<path d="M5 9h13l-3-3M19 15H6l3 3"/>' },
];

function renderProduct({ item, group, cfg }) {
  const img = MODEL_IMG[item.id];
  const art = img
    ? `<img src="${img}" alt="${item.name}" decoding="async" draggable="false" />`
    : `<span class="sp-ico">${svg(iconFor(item))}</span>`;
  const buy = item.price
    ? `<div class="pd-buy"><div class="pd-price"><span>Price</span><b>${naira(item.price)}</b></div>
         <button class="pd-add" type="button" data-add-to-cart data-id="${item.id}" data-name="${item.name}" data-price="${item.price}"${img ? ` data-img="${img}"` : ""}>${BAG}<span>Add to bag</span></button></div>`
    : `<div class="pd-buy"><div class="pd-price"><span>Price</span><b class="soon">Coming soon</b></div></div>`;
  const more = group.items.filter((i) => i.id !== item.id);

  pdTitle.textContent = item.name;
  pdBody.innerHTML = `
    <div class="pd-hero ${group.tone}">${item.fold ? '<span class="sp-tag">Foldable</span>' : ""}${art}</div>
    <div class="pd-main">
      <p class="pd-kick">${group.title}</p>
      <h2>${item.name}</h2>
      ${buy}
      <ul class="pd-perks">${PERKS.map((p) => `<li><span>${svg(p.d)}</span>${p.t}</li>`).join("")}</ul>
    </div>
    ${more.length ? `<section class="pd-more" aria-label="More from ${group.title}"><h3>More from ${group.title}</h3>
      <div class="pd-row">${more.map((it, k) => card(it, group.tone, k, false)).join("")}</div></section>` : ""}`;
}

/* ---------- history ----------
   Every page we push on top of the home page is one history entry, and "depth" counts them,
   so the phone's back button, our back buttons and the Home tab all agree. */
let depth = (history.state && history.state.d) || 0;
const clean = () => history.replaceState(null, "", location.pathname + location.search);
function writeHash(hash, replace) {
  if (replace) history.replaceState({ gd: 1, d: depth }, "", hash);
  else { depth += 1; history.pushState({ gd: 1, d: depth }, "", hash); }
}
function toBase() {
  if (depth > 0) { const n = depth; depth = 0; history.go(-n); }
  else if (location.hash) clean();
}
const dockTab = (tab) => document.dispatchEvent(new CustomEvent("dock:set", { detail: { tab } }));

/* ---------- open / close ---------- */
function showShop(route, { instant = false, trigger = null } = {}) {
  const wasOpen = state.open;
  state.route = route;
  state.group = null;
  if (!wasOpen) state.trigger = trigger || document.activeElement;
  render(route);
  scroller.scrollTop = 0;
  topEl.classList.remove("stuck");

  if (instant) shop.classList.add("no-anim");
  shop.inert = false;
  shop.setAttribute("aria-hidden", "false");
  shop.classList.add("open");
  home.classList.add("shop-open");
  if (instant) requestAnimationFrame(() => requestAnimationFrame(() => shop.classList.remove("no-anim")));
  state.open = true;
  dockTab("shop");
  if (!instant && !wasOpen) setTimeout(() => $("sp-back").focus({ preventScroll: true }), 420);
}

function hideShop() {
  if (!state.open) return;
  state.open = false;
  shop.classList.remove("open", "behind");
  if (!state.pOpen) { home.classList.remove("shop-open"); dockTab("home"); }
  shop.setAttribute("aria-hidden", "true");
  shop.inert = true;
  const t = state.trigger;
  if (t && t.isConnected && typeof t.focus === "function") t.focus({ preventScroll: true });
}

function showProduct(id, { instant = false, trigger = null } = {}) {
  const rec = PRODUCTS[id];
  if (!rec) return;
  const wasOpen = state.pOpen;
  state.pid = id;
  if (!wasOpen) state.ptrigger = trigger || document.activeElement;
  renderProduct(rec);
  pdScroll.scrollTop = 0;
  pdTop.classList.remove("stuck");

  if (instant) pd.classList.add("no-anim");
  pd.inert = false;
  pd.setAttribute("aria-hidden", "false");
  pd.classList.add("open");
  home.classList.add("shop-open");
  if (state.open) shop.classList.add("behind");
  if (instant) requestAnimationFrame(() => requestAnimationFrame(() => pd.classList.remove("no-anim")));
  state.pOpen = true;
  dockTab("shop");
  if (!instant && !wasOpen) setTimeout(() => $("pd-back").focus({ preventScroll: true }), 420);
}

function hideProduct(quiet = false) {
  if (!state.pOpen) return;
  state.pOpen = false;
  pd.classList.remove("open");
  shop.classList.remove("behind");
  pd.setAttribute("aria-hidden", "true");
  pd.inert = true;
  if (!state.open) { home.classList.remove("shop-open"); if (!quiet) dockTab("home"); }
  const t = state.ptrigger;
  if (t && t.isConnected && typeof t.focus === "function") t.focus({ preventScroll: true });
}

export function openShop(route, { push = true, instant = false, trigger = null } = {}) {
  if (!route || !route.cat || !route.brand) return;
  const had = state.open || state.pOpen;
  hideProduct(true);
  showShop(route, { instant, trigger });
  if (push) writeHash("#shop=" + encodeURIComponent(keyOf(route)), had);
}

export function openProduct(id, { push = true, instant = false, trigger = null } = {}) {
  if (!PRODUCTS[id]) return;
  const had = state.pOpen;
  showProduct(id, { instant, trigger });
  if (push) writeHash("#product=" + encodeURIComponent(id), had);
}

// One step back: the page on top closes, whatever is under it shows again
function back() {
  if (!state.open && !state.pOpen) return;
  if (depth > 0) { history.back(); return; }
  hideProduct();
  hideShop();
  if (location.hash) clean();
}
export function closeShop() { back(); }

// Make the screen match the address bar
function sync({ instant = false } = {}) {
  const p = location.hash.match(/^#product=(.+)$/);
  const s = location.hash.match(/^#shop=(.+)$/);
  if (p) {
    const id = decodeURIComponent(p[1]);
    if (PRODUCTS[id]) { if (!state.pOpen || state.pid !== id) showProduct(id, { instant }); return; }
  }
  hideProduct();
  if (s) {
    const r = parse(decodeURIComponent(s[1]));
    if (!state.open || keyOf(state.route) !== keyOf(r)) showShop(r, { instant });
  } else {
    hideShop();
  }
}

/* ---------- wiring ---------- */
shop.inert = true;
pd.inert = true;
$("sp-back").addEventListener("click", back);
$("pd-back").addEventListener("click", back);
document.addEventListener("keydown", (e) => { if (e.key === "Escape") back(); });
window.addEventListener("popstate", (e) => { depth = (e.state && e.state.d) || 0; sync(); });

// Bottom bar: Home goes back to the home page, Shop goes to the general shop page
document.addEventListener("dock:go", (e) => {
  const tab = e.detail && e.detail.tab;
  if (tab === "home") {
    if (!state.open && !state.pOpen) return;
    hideProduct(true);
    hideShop();
    toBase();
  } else if (tab === "shop") {
    if (state.open && !state.pOpen && state.route.cat === "all") { scroller.scrollTo({ top: 0, behavior: "smooth" }); return; }
    openShop(ALL, { trigger: document.activeElement });
  }
});

// Any button marked data-shop, and every collection card
document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-shop]");
  if (t) openShop(parse(t.dataset.shop), { trigger: t });
});
document.addEventListener("collection:open", (e) => {
  const { cat, brand } = e.detail;
  openShop({ cat, brand, focus: null }, { trigger: document.activeElement });
});

// Tap a product: its page opens (the bag button on a card only adds it to the bag)
document.addEventListener("click", (e) => {
  if (e.target.closest("[data-add-to-cart]")) return;
  const c = e.target.closest(".sp-card[data-pid]");
  if (c) openProduct(c.dataset.pid, { trigger: c });
});
document.addEventListener("keydown", (e) => {
  if (e.key !== "Enter" && e.key !== " ") return;
  const c = e.target.closest && e.target.closest(".sp-card[data-pid]");
  if (!c || e.target !== c) return;
  e.preventDefault();
  openProduct(c.dataset.pid, { trigger: c });
});

// Chips: All / each series (or each brand on the general shop)
chipsEl.addEventListener("click", (e) => {
  const c = e.target.closest(".c-tab");
  if (!c || !state.view) return;
  state.group = c.dataset.g || null;
  renderBody(state.view);
});
bodyEl.addEventListener("click", (e) => { if (e.target.closest("#sp-soon-back")) back(); });

// Headers: fade-blur once content scrolls under them
scroller.addEventListener("scroll", () => topEl.classList.toggle("stuck", scroller.scrollTop > 4), { passive: true });
pdScroll.addEventListener("scroll", () => pdTop.classList.toggle("stuck", pdScroll.scrollTop > 4), { passive: true });

// Bag buttons here open the same bag panel as the home page
const bags = [$("sp-bag"), $("pd-bag")];
bags.forEach((b) => b.addEventListener("click", () => document.querySelector("#home > .h-top .bag").click()));
const syncBag = () => {
  const n = window.GDCart ? window.GDCart.count() : 0;
  bags.forEach((b) => {
    b.classList.toggle("has", n > 0);
    b.querySelector("b").textContent = n > 99 ? "99+" : n;
  });
};
document.addEventListener("cart:change", syncBag);
syncBag();

// Opened from a shared link or a refresh
if (/^#(shop|product)=/.test(location.hash)) sync({ instant: true });
