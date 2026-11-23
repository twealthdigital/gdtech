import "./shop.css";
import { CATS, svg } from "./data/categories.js";
import { PHONE_SHOPS, priceFor } from "./data/phones.js";
import { galleryOf, cardPhoto } from "./data/gallery.js";
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
const pdTop = pd.querySelector(".h-top");
const ALL = { cat: "all", brand: "all", focus: null };
const naira = (n) => "₦" + Number(n).toLocaleString("en-NG");

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
  const ph = cardPhoto(item.id);
  const art = ph
    ? `<img class="${ph.kind === "cut" ? "" : "photo"}" src="${ph.src}" alt="${item.name}" loading="lazy" decoding="async" draggable="false" />`
    : `<span class="sp-ico">${svg(iconFor(item))}</span>`;
  const buy = item.price
    ? `<div class="sp-buy"><b>${naira(priceFor(item, 0))}</b></div>`
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

// General shop hero: picking a brand chip slides the other phones out, the brand's phone settles into place,
// and the colour and title change with it. "All" brings the fan back.
let heroTimer = 0;
function focusHero(key) {
  if (!state.route || state.route.cat !== "all") return;
  const cfg = key ? PHONE_SHOPS[key] : null;
  heroEl.className = "sp-hero " + (cfg ? cfg.tone : "ink") + " fan";
  if (cfg) heroEl.dataset.focus = key; else delete heroEl.dataset.focus;
  const h = heroEl.querySelector("h2"), k = heroEl.querySelector(".sp-kick");
  if (!h || !k) return;
  h.classList.add("swap");
  clearTimeout(heroTimer);
  heroTimer = setTimeout(() => { h.innerHTML = cfg ? cfg.title : "All<br>phones"; k.textContent = cfg ? "Shop" : "GDTech"; h.classList.remove("swap"); }, 170);
}

function render(route) {
  const view = viewOf(route);
  state.view = view;

  // The general shop page: a fan of the phones, then every series
  if (route.cat === "all") {
    titleEl.textContent = "Shop";
    heroEl.className = "sp-hero ink fan";
    delete heroEl.dataset.focus;
    heroEl.innerHTML =
      ["Google", "Samsung", "Apple", "itel"].filter((b) => IMAGES["mobile:" + b]).map((b) => `<img data-b="${b}" src="${IMAGES["mobile:" + b].src}" alt="" decoding="async" draggable="false" />`).join("") +
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

/* ---------- the product page ----------
   Photos on top (thumbnails down the side), then a white sheet: badges, name, storage, amount, total, Add to Bag.
   Add to Bag loads, ticks, then the photo flies into the bag button; nothing can be pressed until that is finished. */
const FAV_KEY = "gdtech-fav";
const favs = () => { try { const a = JSON.parse(localStorage.getItem(FAV_KEY) || "[]"); return Array.isArray(a) ? a : []; } catch { return []; } };
const saveFavs = (a) => { try { localStorage.setItem(FAV_KEY, JSON.stringify(a)); } catch { /* private mode */ } };
const HEART = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20.5s-7.5-4.6-9-9.6A4.9 4.9 0 0 1 12 7.6a4.9 4.9 0 0 1 9 3.3c-1.5 5-9 9.6-9 9.6z"/></svg>';
const MINUS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M6 12h12"/></svg>';
const PLUS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M12 6v12M6 12h12"/></svg>';
const SPIN = '<svg class="spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9" opacity=".25"/><path d="M12 3a9 9 0 0 1 9 9"/></svg>';
const TICK = '<svg class="ok" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const BAG_LINE = '<svg class="bagi" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 8h12l-1 12H7L6 8z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/></svg>';
const GUIDE = "Storage is the space for your photos, videos and apps. Pick more if you film a lot or keep many apps.";

const sel = { rec: null, gallery: [], g: 0, s: 0, q: 1, adding: false };
const reduceMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const wait = (ms) => new Promise((r) => setTimeout(r, reduceMotion() ? Math.min(ms, 120) : ms));
const clampQty = (n) => Math.max(1, Math.min(99, Math.floor(+n) || 1));
const totalOf = () => priceFor(sel.rec.item, sel.s) * clampQty(sel.q);
const wasOf = () => { const it = sel.rec.item; return it.was ? Math.round((priceFor(it, sel.s) * it.was) / it.price / 1000) * 1000 * clampQty(sel.q) : 0; };

function renderProduct(rec) {
  const { item, group } = rec;
  Object.assign(sel, { rec, gallery: galleryOf(item.id), g: 0, s: 0, q: 1, adding: false });
  const off = item.was ? Math.round((1 - item.price / item.was) * 100) : 0;
  const tags = (group.isNew ? '<span class="pd-tag new">New</span>' : "") + (off > 0 ? `<span class="pd-tag off">Discount ${off}%</span>` : "");
  const thumbs = sel.gallery.length > 1
    ? `<div class="pd-thumbs" role="tablist" aria-label="Photos">${sel.gallery.map((p, i) => `<button class="pd-th${i ? "" : " on"}" type="button" role="tab" data-i="${i}" aria-label="Photo ${i + 1}"><img src="${p.src}" alt="" loading="lazy" decoding="async" draggable="false" /></button>`).join("")}</div>`
    : "";
  const isFav = favs().includes(item.id);

  pdBody.innerHTML = `
    <div class="pd-stage">
      <div class="pd-bg" id="pd-bg"></div>
      <img class="pd-img" id="pd-img" alt="${item.name}" decoding="async" draggable="false" />
      ${thumbs}
    </div>
    <div class="pd-sheet">
      ${tags ? `<div class="pd-tags">${tags}</div>` : ""}
      <div class="pd-name">
        <div><h2>${item.name}</h2><p>${group.title}</p></div>
        <button class="pd-fav${isFav ? " on" : ""}" id="pd-fav" type="button" aria-pressed="${isFav}" aria-label="Save ${item.name}">${HEART}</button>
      </div>
      <div class="pd-label"><b>Select storage</b><button class="pd-guide" id="pd-guide" type="button" aria-expanded="false">Storage Guide</button></div>
      <p class="pd-note" id="pd-note" hidden>${GUIDE}</p>
      <div class="pd-sizes" role="radiogroup" aria-label="Storage">${item.storage.map((v, i) => `<button class="pd-chip${i ? "" : " on"}" type="button" role="radio" aria-checked="${i === 0}" data-s="${i}">${v}</button>`).join("")}</div>
      <div class="pd-foot">
        <div class="pd-qty"><b>Qty</b>
          <div class="pd-step"><button class="pd-minus" type="button" aria-label="One less">${MINUS}</button>
            <input id="pd-q" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="2" value="1" aria-label="Quantity" autocomplete="off" />
            <button class="pd-plus" type="button" aria-label="One more">${PLUS}</button></div>
        </div>
        <div class="pd-total"><span>Total price</span><s id="pd-was"></s><b id="pd-sum"></b></div>
      </div>
      <button class="pd-add" id="pd-add" type="button"><span class="ic">${BAG_LINE}${SPIN}${TICK}</span><span class="lbl">Add to Bag</span></button>
    </div>`;
  paintStage();
  paintTotal();
}

function paintStage() {
  const p = sel.gallery[sel.g];
  const img = $("pd-img");
  const bg = $("pd-bg");
  if (!p) { img.removeAttribute("src"); img.hidden = true; return; }
  img.hidden = false;
  img.src = p.src;
  img.className = "pd-img " + p.kind;
  bg.style.backgroundImage = p.kind === "cut" ? "" : `url("${p.src}")`;
  bg.classList.toggle("blur", p.kind !== "cut");
  pdBody.querySelectorAll(".pd-th").forEach((b, i) => { b.classList.toggle("on", i === sel.g); b.setAttribute("aria-selected", i === sel.g); });
}

function paintTotal() {
  const was = wasOf();
  $("pd-sum").textContent = naira(totalOf());
  const w = $("pd-was");
  w.textContent = was ? naira(was) : "";
  w.hidden = !was;
}

function setQty(n, { keepText = false } = {}) {
  sel.q = n;
  const input = $("pd-q");
  if (!keepText) input.value = String(clampQty(n));
  paintTotal();
}

// Fly a copy of the photo into the bag button
async function fly(from, target) {
  const hb = home.getBoundingClientRect();
  const a = from.getBoundingClientRect();
  const t = target.getBoundingClientRect();
  if (!from.animate || reduceMotion() || a.width < 4) return;
  const el = from.cloneNode(false);
  el.removeAttribute("id");
  el.className = from.className + " pd-fly";
  Object.assign(el.style, { left: a.left - hb.left + "px", top: a.top - hb.top + "px", width: a.width + "px", height: a.height + "px" });
  home.appendChild(el);
  from.style.transition = "none";
  from.style.opacity = "0";
  const dx = t.left + t.width / 2 - (a.left + a.width / 2);
  const dy = t.top + t.height / 2 - (a.top + a.height / 2);
  const end = 30 / Math.max(a.width, a.height);
  const anim = el.animate([
    { transform: "translate(0,0) scale(1)", opacity: 1, offset: 0 },
    { transform: `translate(${dx * 0.12}px,${dy * 0.18 + 10}px) scale(0.78)`, opacity: 1, offset: 0.22 },
    { transform: `translate(${dx * 0.62}px,${dy * 0.7}px) scale(${Math.max(end, 0.3)})`, opacity: 1, offset: 0.7 },
    { transform: `translate(${dx}px,${dy}px) scale(${end})`, opacity: 0.85, offset: 1 },
  ], { duration: 900, easing: "cubic-bezier(0.55, 0, 0.3, 1)", fill: "forwards" });
  try { await anim.finished; } catch { /* cancelled */ }
  el.remove();
  from.style.transition = "opacity 0.5s ease";
  from.style.opacity = "";
}

async function addToBag() {
  if (sel.adding || !sel.rec) return;
  sel.adding = true;
  const { item } = sel.rec;
  const btn = $("pd-add");
  const lbl = btn.querySelector(".lbl");
  const qty = clampQty(sel.q);
  const variant = item.storage[sel.s];
  const ph = sel.gallery[sel.g] || cardPhoto(item.id);
  const line = { id: item.id, name: item.name, price: priceFor(item, sel.s), img: (cardPhoto(item.id) || ph || {}).src || "", variant, qty };
  setQty(qty);

  // 1. loading: the button shrinks to a ring and spins; everything else on the page is locked
  pdBody.classList.add("busy");
  $("pd-q").readOnly = true;
  btn.disabled = true;
  btn.setAttribute("aria-busy", "true");
  btn.classList.add("loading");
  lbl.textContent = "Adding";
  await wait(850);

  // 2. success: it grows back, turns green and ticks
  btn.classList.remove("loading");
  btn.classList.add("done");
  lbl.textContent = "Added to bag";
  await wait(420);

  // 3. the photo flies into the bag button above, then the bag takes it in
  const target = $("pd-bag");
  if (state.pOpen) await fly($("pd-img"), target);
  if (window.GDCart) window.GDCart.add(line);
  target.classList.remove("bump");
  void target.offsetWidth;
  target.classList.add("bump");
  await wait(650);

  // 4. ready again
  btn.classList.remove("done");
  btn.disabled = false;
  btn.removeAttribute("aria-busy");
  lbl.textContent = "Add to Bag";
  $("pd-q").readOnly = false;
  pdBody.classList.remove("busy");
  sel.adding = false;
}

pdBody.addEventListener("click", (e) => {
  if (sel.adding) return;
  const t = e.target;
  const th = t.closest(".pd-th");
  const chip = t.closest(".pd-chip");
  if (th) {
    const i = +th.dataset.i;
    if (i === sel.g) return;
    const img = $("pd-img");
    img.classList.add("swap");
    setTimeout(() => { sel.g = i; paintStage(); img.classList.remove("swap"); }, 140);
  } else if (chip) {
    sel.s = +chip.dataset.s;
    pdBody.querySelectorAll(".pd-chip").forEach((b) => { const on = b === chip; b.classList.toggle("on", on); b.setAttribute("aria-checked", on); });
    paintTotal();
  } else if (t.closest(".pd-minus")) setQty(clampQty(sel.q) - 1);
  else if (t.closest(".pd-plus")) setQty(clampQty(sel.q) + 1);
  else if (t.closest("#pd-guide")) {
    const note = $("pd-note");
    note.hidden = !note.hidden;
    $("pd-guide").setAttribute("aria-expanded", String(!note.hidden));
  } else if (t.closest("#pd-fav")) {
    const b = $("pd-fav");
    const id = sel.rec.item.id;
    const list = favs();
    const on = !list.includes(id);
    saveFavs(on ? [...list, id] : list.filter((x) => x !== id));
    b.classList.toggle("on", on);
    b.setAttribute("aria-pressed", on);
  } else if (t.closest("#pd-add")) addToBag();
});

// Type an amount instead of pressing plus: digits only, up to 99
pdBody.addEventListener("input", (e) => {
  if (e.target.id !== "pd-q") return;
  const v = e.target.value.replace(/\D/g, "").slice(0, 2);
  e.target.value = v;
  setQty(v === "" ? 1 : +v, { keepText: true });
});
pdBody.addEventListener("focusout", (e) => { if (e.target.id === "pd-q") setQty(clampQty(e.target.value)); });
pdBody.addEventListener("keydown", (e) => { if (e.target.id === "pd-q" && e.key === "Enter") e.target.blur(); });

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
  home.classList.add("shop-open", "pd-open");
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
  home.classList.remove("pd-open");
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
  focusHero(state.group);
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
  const n = window.GDCart ? window.GDCart.kinds() : 0;
  bags.forEach((b) => {
    b.classList.toggle("has", n > 0);
    b.querySelector("b").textContent = n > 99 ? "99+" : n;
  });
};
document.addEventListener("cart:change", syncBag);
syncBag();

// Opened from a shared link or a refresh
if (/^#(shop|product)=/.test(location.hash)) sync({ instant: true });
