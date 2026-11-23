import "./shop.css";
import { CATS, svg } from "./data/categories.js";
import { PHONE_SHOPS } from "./data/phones.js";
import { IMAGES, TITLES, TONE_OF } from "./collections.js";

// The shop page. Anything can open it:
//   <button data-shop="mobile:Apple">          the iPhone shop
//   <button data-shop="mobile:Samsung">        Samsung: S series first, its foldables next
//   <button data-shop="mobile:Samsung:fold">   Samsung: foldables first, then the S series
//   <button data-shop="laptops:Dell">          any collection card (category:brand)
// or from JS: openShop({ cat: "mobile", brand: "Samsung", focus: "fold" })

const $ = (id) => document.getElementById(id);
const home = $("home");
const shop = $("shop");
const scroller = $("sp-scroll");
const heroEl = $("sp-hero");
const chipsEl = $("sp-chips");
const bodyEl = $("sp-body");
const titleEl = $("sp-title");
const topEl = shop.querySelector(".h-top");
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

const state = { route: null, group: null, trigger: null, open: false };

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

function card(item, tone, i, wide) {
  const img = MODEL_IMG[item.id];
  const art = img
    ? `<img src="${img}" alt="${item.name}" loading="lazy" decoding="async" draggable="false" />`
    : `<span class="sp-ico">${svg(iconFor(item))}</span>`;
  const buy = item.price
    ? `<div class="sp-buy"><b>${naira(item.price)}</b>
         <button class="sp-add" type="button" data-add-to-cart data-id="${item.id}" data-name="${item.name}" data-price="${item.price}"${img ? ` data-img="${img}"` : ""} aria-label="Add ${item.name} to bag">${BAG}</button></div>`
    : "";
  return `<article class="sp-card ${tone}${wide ? " wide" : ""}" style="--i:${i}">
    <div class="sp-art">${item.fold ? '<span class="sp-tag">Foldable</span>' : ""}${art}</div>
    <div class="sp-info"><h4>${item.name}</h4>${buy}</div>
  </article>`;
}

function renderBody(cfg, route) {
  const groups = orderedGroups(cfg, route.focus);
  chipsEl.innerHTML =
    `<button class="c-tab${state.group ? "" : " on"}" type="button" role="tab" data-g="">All</button>` +
    groups.map((g) => `<button class="c-tab${state.group === g.id ? " on" : ""}" type="button" role="tab" data-g="${g.id}">${g.chip}</button>`).join("");
  chipsEl.hidden = false;
  let n = 0;
  bodyEl.innerHTML = groups
    .filter((g) => !state.group || g.id === state.group)
    .map((g) => `<section class="sp-sec" aria-label="${g.title}">
        <h3>${g.title}</h3>
        <div class="sp-grid">${g.items.map((it, k) => card(it, g.tone, n++, g.items.length % 2 === 1 && k === g.items.length - 1)).join("")}</div>
      </section>`).join("");
}

function render(route) {
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

  if (cfg) {
    renderBody(cfg, route);
  } else {
    chipsEl.hidden = true;
    chipsEl.innerHTML = "";
    bodyEl.innerHTML = `<div class="sp-soon"><b>COMING SOON</b><p>We are adding the latest ${title} models.</p>
      <button type="button" id="sp-soon-back">Back to collections</button></div>`;
  }
}

/* ---------- open / close ---------- */
export function openShop(route, { push = true, instant = false, trigger = null } = {}) {
  if (!route || !route.cat || !route.brand) return;
  state.route = route;
  state.group = null;
  state.trigger = trigger || document.activeElement;
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

  if (push) {
    const hash = "#shop=" + encodeURIComponent(keyOf(route));
    if (history.state && history.state.gdShop) history.replaceState({ gdShop: keyOf(route) }, "", hash);
    else history.pushState({ gdShop: keyOf(route) }, "", hash);
  }
  if (!instant) setTimeout(() => $("sp-back").focus({ preventScroll: true }), 420);
}

function hide() {
  if (!state.open) return;
  state.open = false;
  shop.classList.remove("open");
  home.classList.remove("shop-open");
  shop.setAttribute("aria-hidden", "true");
  shop.inert = true;
  const t = state.trigger;
  if (t && t.isConnected && typeof t.focus === "function") t.focus({ preventScroll: true });
}

export function closeShop() {
  if (!state.open) return;
  hide();
  // Drop the history entry we added, so the phone's back button and our back button agree
  if (history.state && history.state.gdShop) history.back();
}

/* ---------- wiring ---------- */
shop.inert = true;
$("sp-back").addEventListener("click", closeShop);
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && state.open) closeShop(); });
window.addEventListener("popstate", () => {
  const m = location.hash.match(/^#shop=(.+)$/);
  if (m) { if (!state.open) openShop(parse(decodeURIComponent(m[1])), { push: false }); }
  else hide();
});

// Home tab in the bottom bar goes back to the home page
document.querySelector("#dock button")?.addEventListener("click", closeShop);

// Any button marked data-shop, and every collection card
document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-shop]");
  if (t) openShop(parse(t.dataset.shop), { trigger: t });
});
document.addEventListener("collection:open", (e) => {
  const { cat, brand } = e.detail;
  openShop({ cat, brand, focus: null }, { trigger: document.activeElement });
});

// Chips: All / each series
chipsEl.addEventListener("click", (e) => {
  const c = e.target.closest(".c-tab");
  if (!c || !state.route) return;
  state.group = c.dataset.g || null;
  renderBody(PHONE_SHOPS[state.route.brand], state.route);
});
bodyEl.addEventListener("click", (e) => { if (e.target.closest("#sp-soon-back")) closeShop(); });

// Header: fade-blur once content scrolls under it
scroller.addEventListener("scroll", () => topEl.classList.toggle("stuck", scroller.scrollTop > 4), { passive: true });

// Bag button here opens the same bag panel as the home page
const spBag = $("sp-bag");
spBag.addEventListener("click", () => document.querySelector("#home > .h-top .bag").click());
const syncBag = () => {
  const n = window.GDCart ? window.GDCart.count() : 0;
  spBag.classList.toggle("has", n > 0);
  spBag.querySelector("b").textContent = n > 99 ? "99+" : n;
};
document.addEventListener("cart:change", syncBag);
syncBag();

// Opened from a shared link or a refresh
const first = location.hash.match(/^#shop=(.+)$/);
if (first) openShop(parse(decodeURIComponent(first[1])), { push: false, instant: true });
