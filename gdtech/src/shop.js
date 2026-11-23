import "./shop.css";
import { CATS, svg } from "./data/categories.js";
import { priceFor } from "./data/phones.js";
import { SHOPS, OPT } from "./data/gadgets.js";
import { galleryOf, cardPhoto, registerArt } from "./data/gallery.js";
import { IMAGES, TITLES, TONE_OF } from "./collections.js";
import { lensBoost } from "./glass.js";
import { heroGeomCalc, reduceShopFilter, hasDropdownArrow, chipLabelFor, dropOptionIndexForY, toggleFavId, orderedFavIds } from "./shop-logic.js";

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
const favEl = $("fav");
const fvScroll = $("fv-scroll");
const fvGrid = $("fv-grid");
const fvMeta = $("fv-meta");
const fvEmpty = $("fv-empty");
const fvTop = favEl.querySelector(".h-top");
const ALL = { cat: "all", brand: "all", focus: null };
const naira = (n) => "₦" + Number(n).toLocaleString("en-NG");

const ICONS = {
  phone: CATS.find((c) => c.id === "mobile").icon,
  fold: '<rect x="3" y="5" width="18" height="14" rx="2.4"/><path d="M12 5v14"/>',
  flip: '<rect x="6.5" y="3" width="11" height="18" rx="2.6"/><path d="M6.5 12h11"/>',
};
const iconFor = (item) => {
  if (item.cat && item.cat !== "mobile") return (CATS.find((c) => c.id === item.cat) || CATS[0]).icon;
  return !item.fold ? ICONS.phone : /flip/i.test(item.name) ? ICONS.flip : ICONS.fold;
};
const CAT_LABEL = { mobile: "Phones", laptops: "Laptops", headsets: "Headsets", tablets: "Tablets", gaming: "Gaming" };
const brandsOf = (cat) => Object.values(SHOPS).filter((c) => c.cat === cat);
const CHEV = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';
const CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const CARD_HEART = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20.5s-7.5-4.6-9-9.6A4.9 4.9 0 0 1 12 7.6a4.9 4.9 0 0 1 9 3.3c-1.5 5-9 9.6-9 9.6z"/></svg>';
const BAG = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M5.7 8.6a1 1 0 0 1 1-.9h10.6a1 1 0 0 1 1 .9l.95 10.5a2 2 0 0 1-1.99 2.2H6.74a2 2 0 0 1-1.99-2.2L5.7 8.6z"/><path d="M9 9V6.5a3 3 0 0 1 6 0V9" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>';

const state = { route: null, view: null, cat: null, group: null, dropOpen: false, searching: false, trigger: null, open: false, favOpen: false, fvTrigger: null, pid: null, ptrigger: null, pOpen: false };

// Every phone by id, so a product page can find its photo, its series and its neighbours
const PRODUCTS = {};
for (const cfg of Object.values(SHOPS)) {
  for (const g of cfg.groups) for (const item of g.items) {
    PRODUCTS[item.id] = { item, group: g, brand: cfg.brand, cfg };
    // Until a product has its own photo, laptops, tablets, headsets and gaming show their brand photo
    if (cfg.cat !== "mobile" && IMAGES[cfg.art]) registerArt(item.id, IMAGES[cfg.art].src);
  }
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

// One view = the chips on top and the sections below. A brand shop chips by series. The general shop (All gadgets)
// chips by category, and once a category is picked a second row chips by brand.
function viewOf(route) {
  if (route.cat === "all") return { general: true };
  const cfg = SHOPS[route.cat + ":" + route.brand];
  if (!cfg) return null;
  const groups = orderedGroups(cfg, route.focus).map((g) => ({ ...g, key: g.id }));
  return { chips: groups.map((g) => ({ id: g.id, label: g.chip })), groups };
}

function card(item, tone, i, wide, liked = favs().includes(item.id)) {
  const ph = cardPhoto(item.id);
  const art = ph
    ? `<img class="${ph.kind === "cut" ? "" : "photo"}" src="${ph.src}" alt="${item.name}" loading="lazy" decoding="async" draggable="false" />`
    : `<span class="sp-ico">${svg(iconFor(item))}</span>`;
  const buy = item.price
    ? `<div class="sp-buy"><b>${naira(priceFor(item, 0))}</b></div>`
    : "";
  return `<article class="sp-card ${tone}${wide ? " wide" : ""}" style="--i:${i}" data-pid="${item.id}" role="button" tabindex="0" aria-label="View ${item.name}">
    <div class="sp-art">${item.fold ? '<span class="sp-tag">Foldable</span>' : ""}${art}</div>
    <button class="sp-fav glass${liked ? " on" : ""}" type="button" data-fav-btn="${item.id}" data-lens-bezel="0.5" data-lens-depth="1.4" aria-pressed="${liked}" aria-label="${liked ? `Remove ${item.name} from favourites` : `Save ${item.name} to favourites`}">${CARD_HEART}</button>
    <div class="sp-info"><h4>${item.name}</h4>${buy}</div>
  </article>`;
}

const dropEl = $("sp-drop");
const dropGlass = $("sp-drop-glass");
const dropList = $("sp-drop-list");
const dropLens = $("sp-drop-lens");
const dropItems = $("sp-drop-items");
const dropBd = $("sp-drop-bd");
dropEl.inert = true;
let chipsMode = null;
let pillRaf = 0;

const catTab = (id, label) => `<button class="c-tab" type="button" role="tab" data-c="${id}"><span class="c-lbl">${label}</span>${id ? `<span class="c-chev" aria-hidden="true">${CHEV}</span>` : ""}</button>`;
const seriesTab = (id, label, on) => `<button class="c-tab${on ? " on" : ""}" type="button" role="tab" data-g="${id}"><span class="c-lbl">${label}</span></button>`;
const section = (title, items, tone, n) => `<section class="sp-sec" aria-label="${title}">
        <h3>${title}</h3>
        <div class="sp-grid">${items.map((it, k) => card(it, tone, n + k, items.length % 2 === 1 && k === items.length - 1)).join("")}</div>
      </section>`;

function movePill(instant = false) {
  cancelAnimationFrame(pillRaf);
  pillRaf = requestAnimationFrame(() => {
    const pill = chipsEl.querySelector(".sp-pill");
    const active = chipsEl.querySelector(".c-tab.on");
    if (!pill || !active) return;
    if (instant || !pill.dataset.ready) chipsEl.classList.add("no-pill-t");
    pill.style.width = active.offsetWidth + "px";
    pill.style.transform = `translateX(${active.offsetLeft}px)`;
    if (instant || !pill.dataset.ready) {
      void pill.offsetWidth;
      chipsEl.classList.remove("no-pill-t");
      pill.dataset.ready = "1";
    }
  });
}

function centerChip(el, instant = false) {
  if (!el) return;
  const target = Math.max(0, el.offsetLeft - (chipsEl.clientWidth - el.offsetWidth) / 2);
  chipsEl.scrollTo({ left: target, behavior: instant ? "auto" : "smooth" });
}

function syncChips({ scroll = true, instant = false, animateLabel = false } = {}) {
  const isGeneral = Boolean(state.view && state.view.general);
  let activeEl = null;
  chipsEl.querySelectorAll(".c-tab").forEach((btn) => {
    if (isGeneral) {
      const id = btn.dataset.c || "";
      const isAll = !id;
      const active = isAll ? !state.cat : id === state.cat;
      const arrow = hasDropdownArrow(true, id, state.cat);
      const brandObj = active && state.group ? brandsOf(state.cat).find((b) => b.brand === state.group) : null;
      const label = chipLabelFor(id, state.cat, state.group, isAll ? "All" : CAT_LABEL[id], brandObj ? brandObj.title : "");
      const lbl = btn.querySelector(".c-lbl");
      if (lbl && lbl.textContent !== label) {
        lbl.textContent = label;
        if (animateLabel) {
          lbl.classList.remove("swap");
          void lbl.offsetWidth;
          lbl.classList.add("swap");
        }
      }
      btn.classList.toggle("on", active);
      btn.classList.toggle("has-arrow", arrow);
      btn.setAttribute("aria-selected", String(active));
      if (arrow) {
        btn.setAttribute("aria-haspopup", "listbox");
        btn.setAttribute("aria-expanded", String(state.dropOpen));
      } else {
        btn.removeAttribute("aria-haspopup");
        btn.removeAttribute("aria-expanded");
      }
      if (active) activeEl = btn;
    } else {
      const id = btn.dataset.g || "";
      const active = !id ? !state.group : id === state.group;
      btn.classList.toggle("on", active);
      btn.setAttribute("aria-selected", String(active));
      if (active) activeEl = btn;
    }
  });
  movePill(instant);
  if (scroll && activeEl) centerChip(activeEl, instant);
}

// Liquid glass droplet spring inside the brand dropdown (matches bottom dock bar)
const dLens = { y: 8, vy: 0, ty: 8, l: 1, vl: 0, tl: 1, raf: 0, t0: 0, tops: [], rowH: 42, activeIdx: 0, down: false, dragged: false, startY: 0, startIdx: 0, pickTimer: 0, suppressClick: false };
const optEls = () => [...dropItems.querySelectorAll(".sp-opt")];
function measureDropLens() {
  const opts = optEls();
  dLens.rowH = opts[0] ? opts[0].offsetHeight || 42 : 42;
  dLens.tops = opts.map((b) => b.offsetTop + 8);
  const idx = Math.max(0, opts.findIndex((b) => b.classList.contains("on")));
  dLens.activeIdx = idx;
  return dLens.tops[idx] ?? 8;
}
function paintDropLens() {
  if (!dropLens) return;
  const s = 1 + Math.min(Math.abs(dLens.vy) / 900, 0.55);
  const sy = s * dLens.l;
  const sx = dLens.l / Math.sqrt(s);
  dropLens.style.height = dLens.rowH + "px";
  dropLens.style.transform = `translate3d(0,${dLens.y.toFixed(2)}px,0) scale(${sx.toFixed(3)},${sy.toFixed(3)})`;
  lensBoost(dropLens, 1 + Math.min(Math.abs(dLens.vy) / 600, 1) * 0.9 + (dLens.l - 1) * 3.5);
}
function stepDropLens(t) {
  const dt = Math.min((t - dLens.t0) / 1000, 1 / 30) || 1 / 60;
  dLens.t0 = t;
  if (dLens.dragged) {
    const ny = dLens.y + (dLens.ty - dLens.y) * Math.min(1, dt * 32);
    dLens.vy = (ny - dLens.y) / dt;
    dLens.y = ny;
  } else {
    dLens.vy += (320 * (dLens.ty - dLens.y) - 23 * dLens.vy) * dt;
    dLens.y += dLens.vy * dt;
  }
  dLens.vl += (340 * (dLens.tl - dLens.l) - 21 * dLens.vl) * dt;
  dLens.l += dLens.vl * dt;
  paintDropLens();
  const calm = !dLens.dragged && Math.abs(dLens.ty - dLens.y) < 0.15 && Math.abs(dLens.vy) < 4 && Math.abs(dLens.tl - dLens.l) < 0.002 && Math.abs(dLens.vl) < 0.05;
  if (calm) { dLens.y = dLens.ty; dLens.l = dLens.tl; dLens.vy = dLens.vl = 0; paintDropLens(); dLens.raf = 0; return; }
  dLens.raf = requestAnimationFrame(stepDropLens);
}
function moveDropLens(targetY, { lift = false, instant = false } = {}) {
  dLens.ty = targetY;
  dLens.tl = lift ? 1.045 : 1;
  if (instant || reduceMotion()) {
    cancelAnimationFrame(dLens.raf);
    dLens.raf = 0;
    dLens.y = dLens.ty; dLens.l = dLens.tl; dLens.vy = dLens.vl = 0;
    paintDropLens();
    return;
  }
  if (!dLens.raf) { dLens.t0 = performance.now(); dLens.raf = requestAnimationFrame(stepDropLens); }
}
const markDropHot = (idx) => optEls().forEach((b, i) => b.classList.toggle("hot", i === idx));

function renderDrop() {
  if (!state.cat) return;
  const opts = [{ id: "", label: "All" }, ...brandsOf(state.cat).map((b) => ({ id: b.brand, label: b.title }))];
  dropItems.innerHTML = opts.map((o, i) => {
    const on = !o.id ? !state.group : state.group === o.id;
    return `<button class="sp-opt${on ? " on" : ""}" type="button" role="option" aria-selected="${on}" data-g="${o.id}" style="--i:${i}"><span>${o.label}</span><span class="sp-opt-chk" aria-hidden="true">${CHECK}</span></button>`;
  }).join("");
}

function positionDrop(anchor) {
  const sr = shop.getBoundingClientRect();
  const ar = anchor.getBoundingClientRect();
  const dropW = Math.min(214, Math.max(168, sr.width - 32));
  const top = Math.round(ar.bottom - sr.top + 8);
  const left = Math.round(Math.max(16, Math.min(ar.left - sr.left, sr.width - dropW - 16)));
  const ox = Math.round(ar.left + ar.width / 2 - sr.left - left);
  dropBd.style.setProperty("--cut", Math.round(ar.bottom - sr.top + 4) + "px");
  dropEl.style.top = top + "px";
  dropEl.style.left = left + "px";
  dropEl.style.width = dropW + "px";
  dropEl.style.setProperty("--ox", ox + "px");
  dropEl.style.setProperty("--oy", "-8px");
}

function openDrop() {
  if (!state.view || !state.view.general || !state.cat) return;
  const anchor = chipsEl.querySelector(".c-tab.on");
  if (!anchor) return;
  centerChip(anchor, true);
  renderDrop();
  positionDrop(anchor);
  dropList.scrollTop = 0;
  const activeY = measureDropLens();
  moveDropLens(activeY, { instant: true });
  state.dropOpen = true;
  dLens.suppressClick = false;
  clearTimeout(dLens.pickTimer); dLens.pickTimer = 0;
  scroller.classList.add("drop-lock");
  dropEl.inert = false;
  dropEl.setAttribute("aria-hidden", "false");
  dropBd.classList.add("open");
  dropEl.classList.add("open");
  anchor.setAttribute("aria-expanded", "true");
  if (dropGlass) {
    lensBoost(dropGlass, 1.45);
    setTimeout(() => state.dropOpen && lensBoost(dropGlass, 1), 320);
  }
}

function closeDrop() {
  if (!state.dropOpen) return;
  state.dropOpen = false;
  clearTimeout(dLens.pickTimer); dLens.pickTimer = 0;
  dLens.down = false; dLens.dragged = false;
  cancelAnimationFrame(dLens.raf); dLens.raf = 0;
  dropEl.classList.remove("open", "lifted");
  dropBd.classList.remove("open");
  scroller.classList.remove("drop-lock");
  dropEl.setAttribute("aria-hidden", "true");
  dropEl.inert = true;
  markDropHot(-1);
  if (dropGlass) lensBoost(dropGlass, 1);
  const anchor = chipsEl.querySelector('.c-tab.on[aria-expanded]');
  if (anchor) anchor.setAttribute("aria-expanded", "false");
}

// A few of the newest products from each brand of a category, one brand at a time, for the All gadgets overview
function featured(cat, count = 4) {
  const lists = brandsOf(cat).map((b) => b.groups[0].items.map((item) => ({ item, tone: b.groups[0].tone })));
  const out = [];
  for (let i = 0; out.length < count && lists.some((l) => l[i]); i++) lists.forEach((l) => { if (l[i] && out.length < count) out.push(l[i]); });
  return out;
}

function renderGeneralBody() {
  let n = 0;
  if (state.searching) {
    // Searching: every product, so nothing is hidden from the search
    return CATS.flatMap((c) => brandsOf(c.id).flatMap((b) => b.groups.map((g) => section(g.title, g.items, g.tone, (n += 2))))).join("");
  }
  if (state.cat) {
    return brandsOf(state.cat).filter((b) => !state.group || b.brand === state.group)
      .flatMap((b) => b.groups.map((g) => section(g.title, g.items, g.tone, (n += 2)))).join("");
  }
  return CATS.map((c) => {
    const picks = featured(c.id);
    return `<section class="sp-sec" aria-label="${CAT_LABEL[c.id]}">
        <div class="sp-sec-head"><h3>${CAT_LABEL[c.id]}</h3><button class="sp-more" type="button" data-cat="${c.id}">See all</button></div>
        <div class="sp-grid">${picks.map((p, k) => card(p.item, p.tone, (n += 1) + k, false)).join("")}</div>
      </section>`;
  }).join("");
}

function renderBody(view, { instantChips = false, animateLabel = false } = {}) {
  if (view.general) {
    if (chipsMode !== "general") {
      chipsEl.innerHTML = '<i class="sp-pill" aria-hidden="true"></i>' + catTab("", "All") + CATS.map((c) => catTab(c.id, CAT_LABEL[c.id])).join("");
      chipsMode = "general";
      instantChips = true;
    }
    chipsEl.hidden = false;
    syncChips({ scroll: !instantChips, instant: instantChips, animateLabel });
    bodyEl.innerHTML = renderGeneralBody();
    return;
  }
  closeDrop();
  chipsMode = "brand";
  chipsEl.innerHTML = '<i class="sp-pill" aria-hidden="true"></i>' + seriesTab("", "All", !state.group) + view.chips.map((c) => seriesTab(c.id, c.label, state.group === c.id)).join("");
  chipsEl.hidden = false;
  syncChips({ scroll: false, instant: true });
  let n = 0;
  bodyEl.innerHTML = view.groups
    .filter((g) => !state.group || g.key === state.group)
    .map((g) => section(g.title, g.items, g.tone, (n += 2))).join("");
}

/* ---------- the general shop hero ----------
   All gadgets shows a mix (phone, console, headphones, laptop). Pick a category and it becomes that category's fan
   (for example All phones). Pick a brand and it becomes that brand's single hero. Every photo lives in one pool:
   the ones that are not needed slide out to the right, the needed ones slide in and settle into new sizes. */
const CAT_HERO = {
  all: { tone: "ink", title: "All<br>gadgets", fan: ["mobile:Apple", "gaming:PS5", "headsets:Sony", "laptops:Apple"] },
  mobile: { tone: "ink", title: "All<br>phones", fan: ["mobile:Apple", "mobile:Samsung", "mobile:Google"] },
  laptops: { tone: "navy", title: "All<br>laptops", fan: ["laptops:Apple", "laptops:Dell", "laptops:Samsung"] },
  headsets: { tone: "orange", title: "All<br>headsets", fan: ["headsets:Beats", "headsets:Sony", "headsets:Bose"] },
  tablets: { tone: "slate", title: "All<br>tablets", fan: ["tablets:Apple", "tablets:Samsung", "tablets:Huawei"] },
  gaming: { tone: "onyx", title: "All<br>gaming", fan: ["gaming:PS5", "gaming:Xbox", "gaming:Switch"] },
};
const PARKED = "translateX(130%)";
const pool = new Map();
let heroTimer = 0, arriveTimer = 0;

function poolImg(key) {
  let im = pool.get(key);
  if (im && im.isConnected) return im;
  im = new Image();
  im.alt = ""; im.decoding = "async"; im.draggable = false; im.src = IMAGES[key].src;
  im.style.opacity = "0"; im.style.transform = PARKED;
  heroEl.prepend(im);
  pool.set(key, im);
  return im;
}

// Sizes and positions in pixels, front photo on the right, the others tucked behind it to the left
function heroGeom(keys, single, cat) {
  return heroGeomCalc({
    keys,
    single,
    width: heroEl.clientWidth,
    height: heroEl.clientHeight,
    images: IMAGES,
    cat,
  });
}
const place = (im, g) => { im.style.right = g.right + "px"; im.style.bottom = g.bottom + "px"; im.style.height = g.h + "px"; im.style.zIndex = g.z; };

function setHero(sel, { instant = false } = {}) {
  const cfg = sel.brand ? SHOPS[sel.cat + ":" + sel.brand] : null;
  const def = CAT_HERO[sel.cat || "all"];
  const keys = (cfg ? [sel.cat + ":" + sel.brand] : def.fan).filter((k) => IMAGES[k]);
  const arrive = heroEl.classList.contains("arrive");
  heroEl.className = "sp-hero " + (cfg ? cfg.tone : def.tone) + " fan" + (arrive ? " arrive" : "");
  if (cfg) heroEl.dataset.focus = keys[0]; else delete heroEl.dataset.focus;

  if (instant) heroEl.classList.add("no-t");
  const geo = heroGeom(keys, !!cfg, sel.cat || "all");
  geo.forEach((g) => { const fresh = !pool.has(g.k); const im = poolImg(g.k); if (fresh) place(im, g); });
  void heroEl.offsetWidth;                       // new photos start parked, then slide in
  pool.forEach((im, k) => {
    const j = geo.findIndex((g) => g.k === k);
    if (j > -1) {
      place(im, geo[j]);
      im.style.transitionDelay = instant ? "0s" : j * 0.05 + "s";
      im.style.opacity = "1"; im.style.transform = "none";
    } else {
      im.style.transitionDelay = "0s";
      im.style.opacity = "0"; im.style.transform = PARKED;
    }
  });
  if (instant) requestAnimationFrame(() => requestAnimationFrame(() => heroEl.classList.remove("no-t")));

  const h = heroEl.querySelector("h2"), k = heroEl.querySelector(".sp-kick");
  if (!h || !k) return;
  const title = cfg ? TITLES[keys[0]] || cfg.title : def.title;
  const kick = cfg ? "Shop" : "GDTech";
  clearTimeout(heroTimer);
  if (instant) { h.innerHTML = title; k.textContent = kick; return; }
  h.classList.add("swap");
  heroTimer = setTimeout(() => { h.innerHTML = title; k.textContent = kick; h.classList.remove("swap"); }, 170);
}
const heroFor = () => setHero({ cat: state.cat || "all", brand: state.cat && state.group ? state.group : null });

const qEl = $("sp-q");
let filtered = false;
// Search inside the shop page: hides cards that don't match, and sections that end up empty
function filterBody() {
  const q = (qEl.value || "").trim().toLowerCase();
  bodyEl.querySelector(".sp-none")?.remove();
  if (!q) {
    if (filtered) { filtered = false; state.searching = false; if (state.view) renderBody(state.view); }
    return;
  }
  filtered = true;
  let shown = 0;
  bodyEl.querySelectorAll(".sp-sec").forEach((sec) => {
    const cards = [...sec.querySelectorAll(".sp-card")];
    cards.forEach((c) => { c.hidden = !c.querySelector("h4").textContent.toLowerCase().includes(q); c.classList.remove("wide"); });
    const vis = cards.filter((c) => !c.hidden);
    if (vis.length % 2 === 1) vis[vis.length - 1].classList.add("wide");
    sec.hidden = vis.length === 0;
    shown += vis.length;
  });
  if (!shown) bodyEl.insertAdjacentHTML("beforeend", `<div class="sp-none">Nothing matches "${q.replace(/[<>&"]/g, "")}"</div>`);
}

function render(route) {
  if (qEl) { qEl.value = ""; filtered = false; }
  state.searching = false;
  const view = viewOf(route);
  state.view = view;
  pool.clear();

  // The general shop page: a mix of everything, the categories below
  if (route.cat === "all") {
    titleEl.textContent = "Shop";
    delete heroEl.dataset.cat;
    heroEl.className = "sp-hero ink fan";
    heroEl.innerHTML = `<p class="sp-kick">GDTech</p><h2>All<br>gadgets</h2>`;
    heroEl.classList.add("arrive");
    clearTimeout(arriveTimer);
    arriveTimer = setTimeout(() => heroEl.classList.remove("arrive"), 1600);
    setHero({ cat: "all", brand: null }, { instant: true });
    renderBody(view, { instantChips: true });
    return;
  }

  const key = route.cat + ":" + route.brand;
  const cfg = SHOPS[key] || null;
  const fold = route.focus === "fold" && cfg && cfg.cat === "mobile";
  const title = fold ? "Foldables" : cfg ? cfg.title : TITLES[key] || route.brand;
  const tone = fold ? "ink" : cfg ? cfg.tone : TONE_OF[key] || "ink";
  const art = IMAGES[cfg ? cfg.art : key];

  titleEl.textContent = title;
  heroEl.dataset.cat = route.cat;
  heroEl.className = "sp-hero " + tone + (fold ? " fold" : "") + " arrive";
  clearTimeout(arriveTimer);
  arriveTimer = setTimeout(() => heroEl.classList.remove("arrive"), 1600);
  delete heroEl.dataset.focus;
  heroEl.innerHTML =
    (fold ? "" : art ? `<img src="${art.src}" alt="" decoding="async" draggable="false" />` : "") +
    `<p class="sp-kick">${fold ? "Samsung Galaxy Z" : "Shop"}</p><h2>${title}</h2>`;

  if (view) {
    renderBody(view, { instantChips: true });
  } else {
    closeDrop();
    chipsEl.hidden = true;
    chipsEl.innerHTML = "";
    chipsMode = null;
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
function renderFavs({ animate = true } = {}) {
  const recs = orderedFavIds(favs()).map((id) => PRODUCTS[id]).filter(Boolean);
  fvGrid.classList.toggle("no-in", !animate);
  fvMeta.hidden = recs.length === 0;
  if (recs.length) fvMeta.textContent = `${recs.length} saved gadget${recs.length === 1 ? "" : "s"}`;
  fvEmpty.hidden = recs.length > 0;
  fvGrid.innerHTML = recs.map((rec, i) => card(rec.item, rec.group.tone, i, recs.length % 2 === 1 && i === recs.length - 1, true)).join("");
}
function syncFavButtons(id, on) {
  const rec = PRODUCTS[id];
  const name = rec ? rec.item.name : "gadget";
  document.querySelectorAll(`[data-fav-btn="${id}"]`).forEach((b) => {
    b.classList.toggle("on", on);
    b.setAttribute("aria-pressed", String(on));
    b.setAttribute("aria-label", on ? `Remove ${name} from favourites` : `Save ${name} to favourites`);
  });
  if (sel.rec && sel.rec.item.id === id) {
    const b = $("pd-fav");
    if (b) { b.classList.toggle("on", on); b.setAttribute("aria-pressed", String(on)); }
  }
}
function toggleFav(id, { btnEl = null, cardEl = null } = {}) {
  if (!PRODUCTS[id]) return false;
  const next = toggleFavId(favs(), id);
  const on = next.includes(id);
  saveFavs(next);
  syncFavButtons(id, on);
  if (btnEl) {
    btnEl.classList.remove("pop");
    void btnEl.offsetWidth;
    btnEl.classList.add("pop");
    lensBoost(btnEl, 1.38);
    setTimeout(() => lensBoost(btnEl, 1), 220);
  }
  if (!on && cardEl && cardEl.closest("#fv-grid") && !reduceMotion()) {
    cardEl.classList.add("leaving");
    setTimeout(() => renderFavs({ animate: false }), 175);
  } else if (state.favOpen) {
    renderFavs({ animate: false });
  }
  document.dispatchEvent(new CustomEvent("fav:change", { detail: { ids: next, id, on } }));
  return on;
}
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
  const opt = OPT[item.cat] || { label: "Select storage", guide: "Storage Guide", note: GUIDE };

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
      <div class="pd-label"><b>${opt.label}</b>${opt.guide ? `<button class="pd-guide" id="pd-guide" type="button" aria-expanded="false">${opt.guide}</button>` : ""}</div>
      ${opt.guide ? `<p class="pd-note" id="pd-note" hidden>${opt.note}</p>` : ""}
      <div class="pd-sizes" role="radiogroup" aria-label="${opt.label.replace("Select ", "")}">${item.storage.map((v, i) => `<button class="pd-chip${i ? "" : " on"}" type="button" role="radio" aria-checked="${i === 0}" data-s="${i}">${v}</button>`).join("")}</div>
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
    toggleFav(sel.rec.item.id, { btnEl: $("pd-fav") });
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
  state.cat = null;
  state.group = null;
  closeDrop();
  if (!wasOpen) state.trigger = trigger || document.activeElement;
  render(route);
  scroller.scrollTop = 0;
  topEl.classList.remove("stuck");

  if (instant) shop.classList.add("no-anim");
  shop.inert = false;
  shop.setAttribute("aria-hidden", "false");
  shop.classList.add("open");
  home.classList.add("shop-open");
  if (instant) requestAnimationFrame(() => requestAnimationFrame(() => { shop.classList.remove("no-anim"); movePill(true); }));
  else setTimeout(() => movePill(true), 60);
  state.open = true;
  dockTab("shop");
  if (!instant && !wasOpen) setTimeout(() => $("sp-back").focus({ preventScroll: true }), 420);
}

function hideShop({ quiet = false } = {}) {
  if (!state.open) return;
  closeDrop();
  state.open = false;
  shop.classList.remove("open", "behind");
  if (!state.pOpen && !state.favOpen && !quiet) { home.classList.remove("shop-open"); dockTab("home"); }
  shop.setAttribute("aria-hidden", "true");
  shop.inert = true;
  if (!quiet && !state.favOpen) {
    const t = state.trigger;
    if (t && t.isConnected && typeof t.focus === "function") t.focus({ preventScroll: true });
  }
}

function showFavs({ instant = false, trigger = null } = {}) {
  const wasOpen = state.favOpen;
  if (!wasOpen) state.fvTrigger = trigger || document.activeElement;
  renderFavs();
  fvScroll.scrollTop = 0;
  fvTop.classList.remove("stuck");

  if (instant) favEl.classList.add("no-anim");
  favEl.inert = false;
  favEl.setAttribute("aria-hidden", "false");
  favEl.classList.add("open");
  home.classList.add("shop-open");
  if (instant) requestAnimationFrame(() => requestAnimationFrame(() => favEl.classList.remove("no-anim")));
  state.favOpen = true;
  dockTab("fav");
  if (!instant && !wasOpen) setTimeout(() => $("fv-back").focus({ preventScroll: true }), 420);
}

function hideFavs({ quiet = false } = {}) {
  if (!state.favOpen) return;
  state.favOpen = false;
  favEl.classList.remove("open", "behind");
  if (!state.pOpen && !state.open && !quiet) { home.classList.remove("shop-open"); dockTab("home"); }
  favEl.setAttribute("aria-hidden", "true");
  favEl.inert = true;
  if (!quiet && !state.open) {
    const t = state.fvTrigger;
    if (t && t.isConnected && typeof t.focus === "function") t.focus({ preventScroll: true });
  }
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
  if (state.favOpen) favEl.classList.add("behind");
  if (instant) requestAnimationFrame(() => requestAnimationFrame(() => pd.classList.remove("no-anim")));
  state.pOpen = true;
  dockTab(state.favOpen ? "fav" : "shop");
  if (!instant && !wasOpen) setTimeout(() => $("pd-back").focus({ preventScroll: true }), 420);
}

function hideProduct(quiet = false) {
  if (!state.pOpen) return;
  state.pOpen = false;
  pd.classList.remove("open");
  home.classList.remove("pd-open");
  shop.classList.remove("behind");
  favEl.classList.remove("behind");
  pd.setAttribute("aria-hidden", "true");
  pd.inert = true;
  if (!state.open && !state.favOpen) { home.classList.remove("shop-open"); if (!quiet) dockTab("home"); }
  else if (!quiet) dockTab(state.open ? "shop" : "fav");
  const t = state.ptrigger;
  if (t && t.isConnected && typeof t.focus === "function") t.focus({ preventScroll: true });
}

export function openShop(route, { push = true, instant = false, trigger = null } = {}) {
  if (!route || !route.cat || !route.brand) return;
  const had = state.open || state.favOpen || state.pOpen;
  hideProduct(true);
  hideFavs({ quiet: true });
  showShop(route, { instant, trigger });
  if (push) writeHash("#shop=" + encodeURIComponent(keyOf(route)), had);
}

export function openFavs({ push = true, instant = false, trigger = null } = {}) {
  const had = state.open || state.favOpen || state.pOpen;
  hideProduct(true);
  hideShop({ quiet: true });
  showFavs({ instant, trigger });
  if (push) writeHash("#fav", had);
}

export function openProduct(id, { push = true, instant = false, trigger = null } = {}) {
  if (!PRODUCTS[id]) return;
  const had = state.pOpen;
  showProduct(id, { instant, trigger });
  if (push) writeHash("#product=" + encodeURIComponent(id), had);
}

// One step back: the page on top closes, whatever is under it shows again
function back() {
  if (!state.open && !state.favOpen && !state.pOpen) return;
  if (depth > 0) { history.back(); return; }
  hideProduct();
  hideShop();
  hideFavs();
  if (location.hash) clean();
}
export function closeShop() { back(); }

// Make the screen match the address bar
function sync({ instant = false } = {}) {
  const p = location.hash.match(/^#product=(.+)$/);
  const s = location.hash.match(/^#shop=(.+)$/);
  const f = /^#fav$/.test(location.hash);
  if (p) {
    const id = decodeURIComponent(p[1]);
    if (PRODUCTS[id]) { if (!state.pOpen || state.pid !== id) showProduct(id, { instant }); return; }
  }
  hideProduct();
  if (s) {
    hideFavs({ quiet: true });
    const r = parse(decodeURIComponent(s[1]));
    if (!state.open || keyOf(state.route) !== keyOf(r)) showShop(r, { instant });
  } else if (f) {
    hideShop({ quiet: true });
    if (!state.favOpen) showFavs({ instant });
  } else {
    hideShop();
    hideFavs();
  }
}

/* ---------- wiring ---------- */
shop.inert = true;
favEl.inert = true;
pd.inert = true;
$("sp-back").addEventListener("click", back);
$("fv-back").addEventListener("click", back);
$("pd-back").addEventListener("click", back);
$("fv-browse").addEventListener("click", () => openShop(ALL, { trigger: $("fv-browse") }));
document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  if (state.dropOpen) { closeDrop(); return; }
  back();
});
window.addEventListener("popstate", (e) => { depth = (e.state && e.state.d) || 0; sync(); });

// Bottom bar: Home goes back to the home page, Shop goes to the general shop page, Favourites opens saved gadgets
document.addEventListener("dock:go", (e) => {
  const tab = e.detail && e.detail.tab;
  if (tab === "home") {
    if (!state.open && !state.favOpen && !state.pOpen) return;
    hideProduct(true);
    hideShop();
    hideFavs();
    toBase();
  } else if (tab === "shop") {
    if (state.open && !state.pOpen && state.route.cat === "all") { scroller.scrollTo({ top: 0, behavior: "smooth" }); return; }
    openShop(ALL, { trigger: document.activeElement });
  } else if (tab === "fav") {
    if (state.favOpen && !state.pOpen) { fvScroll.scrollTo({ top: 0, behavior: "smooth" }); return; }
    openFavs({ trigger: document.activeElement });
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

// Tap a card heart to save/remove, or tap anywhere else on a product card to open its page
document.addEventListener("click", (e) => {
  const favBtn = e.target.closest("[data-fav-btn]");
  if (favBtn) {
    e.stopPropagation();
    toggleFav(favBtn.dataset.favBtn, { btnEl: favBtn, cardEl: favBtn.closest(".sp-card") });
    return;
  }
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

// Chips. General shop: single row of gadget types; tapping a gadget type glides to it with All selected silently,
// and tapping the active gadget type's dropdown arrow opens the liquid brand dropdown.
// A brand shop: one row of series.
function afterPick({ animateLabel = false } = {}) {
  qEl.value = "";
  filtered = false;
  state.searching = false;
  if (state.view.general) heroFor();
  renderBody(state.view, { animateLabel });
}
chipsEl.addEventListener("click", (e) => {
  const c = e.target.closest(".c-tab");
  if (!c || !state.view) return;
  if (state.view.general) {
    const catId = c.dataset.c || null;
    const prevCat = state.cat;
    const next = reduceShopFilter({ cat: state.cat, group: state.group, dropOpen: state.dropOpen }, { type: "pick-cat", catId });
    if (catId && catId === prevCat) {
      next.dropOpen ? openDrop() : closeDrop();
      return;
    }
    closeDrop();
    state.cat = next.cat;
    state.group = next.group;
    afterPick({ animateLabel: true });
    return;
  }
  state.group = c.dataset.g || null;
  afterPick();
});
function pickDropBrand(brand) {
  if (!state.view || !state.view.general || !state.cat) return;
  const next = reduceShopFilter({ cat: state.cat, group: state.group, dropOpen: state.dropOpen }, { type: "pick-brand", brand: brand || null });
  closeDrop();
  if (state.group === next.group) return;
  state.group = next.group;
  afterPick({ animateLabel: true });
}
function commitDropOpt(idx, delayMs = 120) {
  const target = optEls()[idx];
  if (!target) return;
  const targetY = dLens.tops[idx] ?? 8;
  markDropHot(idx);
  moveDropLens(targetY, { lift: false });
  clearTimeout(dLens.pickTimer);
  const near = Math.abs(dLens.y - targetY) < 4;
  const waitMs = (reduceMotion() || idx === dLens.activeIdx || delayMs <= 0 || near) ? 0 : delayMs;
  dLens.suppressClick = true;
  setTimeout(() => { dLens.suppressClick = false; }, 350);
  if (waitMs === 0) {
    dLens.pickTimer = 0;
    markDropHot(-1);
    pickDropBrand(target.dataset.g);
    return;
  }
  dLens.pickTimer = setTimeout(() => {
    dLens.pickTimer = 0;
    markDropHot(-1);
    pickDropBrand(target.dataset.g);
  }, waitMs);
}
const dropLocalY = (e) => e.clientY - dropList.getBoundingClientRect().top + dropList.scrollTop;
dropList.addEventListener("pointerover", (e) => {
  if (!state.dropOpen || dLens.down || dLens.pickTimer || e.pointerType !== "mouse") return;
  const opt = e.target.closest(".sp-opt");
  if (!opt) return;
  const idx = optEls().indexOf(opt);
  if (idx < 0) return;
  markDropHot(idx);
  moveDropLens(dLens.tops[idx] ?? 8);
});
dropList.addEventListener("pointerleave", () => {
  if (!state.dropOpen || dLens.down || dLens.pickTimer) return;
  markDropHot(-1);
  moveDropLens(dLens.tops[dLens.activeIdx] ?? 8);
});
dropList.addEventListener("pointerdown", (e) => {
  if (!state.dropOpen || dLens.pickTimer) return;
  const opt = e.target.closest(".sp-opt");
  if (!opt) return;
  if (!dLens.tops.length) measureDropLens();
  dLens.down = true;
  dLens.dragged = false;
  dLens.startY = dropLocalY(e);
  const optIdx = optEls().indexOf(opt);
  const idx = optIdx >= 0 ? optIdx : Math.max(0, dropOptionIndexForY(dLens.tops, dLens.rowH, dLens.startY));
  dLens.startIdx = idx;
  dropEl.classList.add("lifted");
  dropList.setPointerCapture?.(e.pointerId);
  markDropHot(idx);
  moveDropLens(dLens.tops[idx] ?? 8, { lift: true });
});
dropList.addEventListener("pointermove", (e) => {
  if (!dLens.down || !state.dropOpen) return;
  const py = dropLocalY(e);
  if (!dLens.dragged && Math.abs(py - dLens.startY) > 6) dLens.dragged = true;
  if (!dLens.dragged) return;
  const minY = dLens.tops[0] ?? 8;
  const maxY = dLens.tops[dLens.tops.length - 1] ?? minY;
  const clamped = Math.min(Math.max(py - dLens.rowH / 2, minY), maxY);
  const idx = dropOptionIndexForY(dLens.tops, dLens.rowH, py);
  markDropHot(idx);
  moveDropLens(clamped, { lift: true });
});
const endDropPointer = (e) => {
  if (!dLens.down) return;
  const wasDragged = dLens.dragged;
  const startIdx = dLens.startIdx;
  if (dropList.hasPointerCapture?.(e.pointerId)) dropList.releasePointerCapture(e.pointerId);
  dLens.down = false;
  dLens.dragged = false;
  dropEl.classList.remove("lifted");
  if (e.type === "pointercancel") {
    markDropHot(-1);
    moveDropLens(dLens.tops[dLens.activeIdx] ?? 8, { lift: false });
    return;
  }
  const idx = wasDragged ? dropOptionIndexForY(dLens.tops, dLens.rowH, dropLocalY(e)) : startIdx;
  if (idx >= 0) {
    commitDropOpt(idx, wasDragged ? 140 : 120);
    return;
  }
  markDropHot(-1);
  moveDropLens(dLens.tops[dLens.activeIdx] ?? 8, { lift: false });
};
dropList.addEventListener("pointerup", endDropPointer);
dropList.addEventListener("pointercancel", endDropPointer);
dropEl.addEventListener("click", (e) => {
  if (dLens.suppressClick || dLens.pickTimer) return;
  const opt = e.target.closest(".sp-opt");
  if (!opt) return;
  const idx = optEls().indexOf(opt);
  if (idx >= 0) commitDropOpt(idx, e.detail === 0 ? 0 : 120);
});
dropBd.addEventListener("click", closeDrop);
document.addEventListener("click", (e) => {
  if (!state.dropOpen) return;
  if (e.target.closest("#sp-drop") || e.target.closest("#sp-chips")) return;
  closeDrop();
});
bodyEl.addEventListener("click", (e) => {
  if (e.target.closest("#sp-soon-back")) { back(); return; }
  const m = e.target.closest(".sp-more");
  if (m && state.view && state.view.general) {
    closeDrop();
    state.cat = m.dataset.cat;
    state.group = null;
    afterPick({ animateLabel: true });
    scroller.scrollTo({ top: 0, behavior: "smooth" });
  }
});

// Search bar: typing searches everything, so any chip filter steps aside
qEl.addEventListener("input", () => {
  if (!state.view) return;
  if (qEl.value.trim()) {
    closeDrop();
    if (state.view.general && !state.searching) {
      state.searching = true;
      state.cat = null;
      state.group = null;
      heroFor();
      renderBody(state.view, { animateLabel: true });
    } else if (!state.view.general && state.group) {
      state.group = null;
      renderBody(state.view);
    }
  }
  filterBody();
});
qEl.addEventListener("keydown", (e) => { if (e.key === "Enter") qEl.blur(); if (e.key === "Escape") e.stopPropagation(); });

// Headers: fade-blur once content scrolls under them
scroller.addEventListener("scroll", () => topEl.classList.toggle("stuck", scroller.scrollTop > 4), { passive: true });
fvScroll.addEventListener("scroll", () => fvTop.classList.toggle("stuck", fvScroll.scrollTop > 4), { passive: true });
pdScroll.addEventListener("scroll", () => pdTop.classList.toggle("stuck", pdScroll.scrollTop > 4), { passive: true });

// Bag buttons here open the same bag panel as the home page
const bags = [$("sp-bag"), $("fv-bag"), $("pd-bag")];
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
if (/^#(shop=|product=|fav$)/.test(location.hash)) sync({ instant: true });
