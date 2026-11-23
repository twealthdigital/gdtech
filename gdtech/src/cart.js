import "./cart.css";

// Bag: a liquid-glass dropdown that grows out of the bag button (same panel as the filters).
//
// Add a product from anywhere:
//   <button data-add-to-cart data-id="iphone-16-pro" data-name="iPhone 16 Pro" data-price="1450000"
//           data-img="/phones/iphone.webp" data-variant="256GB, Black">Add to bag</button>
// or from JS:
//   GDCart.add({ id, name, price, img, variant }, { open: true });
// Other helpers: GDCart.remove(key), GDCart.setQty(key, n), GDCart.clear(), GDCart.items(), GDCart.count(), GDCart.total()
// Listen for changes with document.addEventListener("cart:change", e => e.detail), checkout with "cart:checkout".

const $ = (id) => document.getElementById(id);
const KEY = "gdtech-cart";
const naira = (n) => "₦" + Number(n).toLocaleString("en-NG");

const btn = document.querySelector(".bag");
const panel = $("cart");
const backdrop = $("cart-bd");
const list = $("cart-list");
const empty = $("cart-empty");
const foot = $("cart-foot");
const subtotal = $("cart-sub");
const countPill = $("cart-count");
const badge = btn.querySelector("b");

const keyOf = (p) => p.id + (p.variant ? "|" + p.variant : "");
const valid = (p) => p && p.id != null && typeof p.name === "string" && Number.isFinite(+p.price) && +p.price >= 0 && +p.qty > 0;

function load() {
  try {
    const a = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(a) ? a.filter(valid) : [];
  } catch { return []; }
}
let items = load();
let lastAdded = null;

const save = () => { try { localStorage.setItem(KEY, JSON.stringify(items)); } catch { /* private mode: bag still works for this visit */ } };
const count = () => items.reduce((n, p) => n + p.qty, 0);
// The badge counts different products in the bag, not how many of each (3 phones of one kind is still 1)
const kinds = () => items.length;
const total = () => items.reduce((n, p) => n + p.qty * p.price, 0);

function icon(paths, size = 16) {
  const s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  s.setAttribute("viewBox", "0 0 24 24"); s.setAttribute("fill", "none"); s.setAttribute("stroke", "currentColor");
  s.setAttribute("stroke-width", "2.4"); s.setAttribute("stroke-linecap", "round"); s.setAttribute("stroke-linejoin", "round");
  s.setAttribute("aria-hidden", "true"); s.setAttribute("width", size); s.setAttribute("height", size);
  s.innerHTML = paths;
  return s;
}
const MINUS = '<path d="M6 12h12"/>';
const PLUS = '<path d="M12 6v12M6 12h12"/>';
const TRASH = '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>';

function row(p) {
  const key = keyOf(p);
  const li = document.createElement("li");
  li.className = "ci" + (key === lastAdded ? " new" : "");
  li.dataset.key = key;

  const thumb = document.createElement("span");
  thumb.className = "ci-img";
  if (p.img) {
    const im = document.createElement("img");
    im.src = p.img; im.alt = ""; im.decoding = "async";
    im.onerror = () => im.remove();
    thumb.appendChild(im);
  }

  const info = document.createElement("div");
  info.className = "ci-info";
  const name = document.createElement("p"); name.className = "ci-name"; name.textContent = p.name;
  info.appendChild(name);
  if (p.variant) { const v = document.createElement("p"); v.className = "ci-var"; v.textContent = p.variant; info.appendChild(v); }
  const price = document.createElement("b"); price.className = "ci-price"; price.textContent = naira(p.price * p.qty);
  info.appendChild(price);

  const qty = document.createElement("div");
  qty.className = "ci-qty";
  const dec = document.createElement("button");
  dec.type = "button"; dec.dataset.act = "dec";
  dec.setAttribute("aria-label", p.qty > 1 ? "Decrease quantity" : "Remove from bag");
  dec.appendChild(icon(p.qty > 1 ? MINUS : TRASH, 15));
  if (p.qty === 1) dec.classList.add("rm");
  const n = document.createElement("span"); n.textContent = p.qty; n.setAttribute("aria-live", "polite");
  const inc = document.createElement("button");
  inc.type = "button"; inc.dataset.act = "inc"; inc.setAttribute("aria-label", "Increase quantity");
  inc.appendChild(icon(PLUS, 15));
  qty.append(dec, n, inc);

  li.append(thumb, info, qty);
  return li;
}

function render() {
  list.replaceChildren(...items.map(row));
  const c = kinds();
  const has = c > 0;
  empty.hidden = has;
  list.hidden = !has;
  foot.hidden = !has;
  panel.classList.toggle("is-empty", !has);
  subtotal.textContent = naira(total());
  countPill.textContent = c;
  countPill.hidden = !has;
  badge.textContent = c > 99 ? "99+" : c;
  btn.classList.toggle("has", has);
  btn.setAttribute("aria-label", has ? `Bag, ${c} product${c === 1 ? "" : "s"}` : "Bag");
  lastAdded = null;
}

function changed() {
  save();
  render();
  document.dispatchEvent(new CustomEvent("cart:change", { detail: { items: items.map((p) => ({ ...p })), count: count(), kinds: kinds(), total: total() } }));
}

function bump() {
  btn.classList.remove("bump");
  void btn.offsetWidth; // restart the animation
  btn.classList.add("bump");
}

function add(p, opts = {}) {
  const item = { id: p.id, name: String(p.name ?? ""), price: +p.price, img: p.img || "", variant: p.variant || "", qty: Math.max(1, Math.floor(+p.qty || 1)) };
  if (item.id == null || item.id === "" || !item.name || !Number.isFinite(item.price) || item.price < 0) {
    console.warn("GDCart.add needs id, name and price", p);
    return false;
  }
  const key = keyOf(item);
  const found = items.find((x) => keyOf(x) === key);
  if (found) found.qty = Math.min(99, found.qty + item.qty); else items.push({ ...item, qty: Math.min(99, item.qty) });
  lastAdded = key;
  changed();
  bump();
  if (opts.open) open();
  return true;
}

function setQty(key, q) {
  const i = items.findIndex((x) => keyOf(x) === key);
  if (i < 0) return;
  q = Math.floor(q);
  if (q <= 0) items.splice(i, 1); else items[i].qty = Math.min(q, 99);
  changed();
}

const remove = (key) => setQty(key, 0);
function clear() { items = []; changed(); }

/* Open / close: the panel grows out of the bag button, the page blurs behind it */
function open() {
  ["fm-bd", "cm-bd"].forEach((id) => { const b = $(id); if (b && b.classList.contains("open")) b.click(); });
  const home = $("home");
  home.style.setProperty("--st", home.scrollTop + "px");
  home.classList.add("lock");
  const b = btn.getBoundingClientRect();
  const p = panel.getBoundingClientRect();
  panel.style.setProperty("--ox", b.left + b.width / 2 - p.left + "px");
  panel.style.setProperty("--oy", b.top + b.height / 2 - p.top + "px");
  panel.classList.add("open");
  backdrop.classList.add("open");
  btn.setAttribute("aria-expanded", "true");
  panel.setAttribute("aria-hidden", "false");
}

function close() {
  $("home").classList.remove("lock");
  panel.classList.remove("open");
  backdrop.classList.remove("open");
  btn.setAttribute("aria-expanded", "false");
  panel.setAttribute("aria-hidden", "true");
}

const isOpen = () => panel.classList.contains("open");

btn.addEventListener("click", (e) => { e.preventDefault(); isOpen() ? close() : open(); });
backdrop.addEventListener("click", close);
$("cart-close").addEventListener("click", close);
$("cart-shop").addEventListener("click", close);
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && isOpen()) close(); });

$("cart-checkout").addEventListener("click", () => {
  document.dispatchEvent(new CustomEvent("cart:checkout", { detail: { items: items.map((p) => ({ ...p })), count: count(), total: total() } }));
  close();
});

/* Quantity buttons */
list.addEventListener("click", (e) => {
  const b = e.target.closest("button[data-act]");
  if (!b) return;
  const li = b.closest(".ci");
  const key = li.dataset.key;
  const p = items.find((x) => keyOf(x) === key);
  if (!p) return;
  if (b.dataset.act === "inc") return setQty(key, p.qty + 1);
  if (p.qty > 1) return setQty(key, p.qty - 1);
  li.classList.add("out");                     // last one: shrink the row away, then remove it
  setTimeout(() => setQty(key, 0), 260);
});

/* Drag the header up to push the bag back into the button */
{
  const head = panel.querySelector(".cart-head");
  let y0 = null, dy = 0, id = null;
  head.addEventListener("pointerdown", (e) => {
    if (e.target.closest("button")) return;
    y0 = e.clientY; dy = 0; id = e.pointerId;
    head.setPointerCapture(id);
    panel.style.transition = "none";
  });
  head.addEventListener("pointermove", (e) => {
    if (y0 == null) return;
    const raw = e.clientY - y0;
    dy = raw < 0 ? raw : raw * 0.18;            // easy to pull up, stiff when pulled down
    panel.style.transform = `translateY(${dy}px) scale(${1 + Math.min(0, dy) / 1400})`;
  });
  const end = () => {
    if (y0 == null) return;
    const shut = dy < -70;
    y0 = null;
    panel.style.transition = "";
    panel.style.transform = "";
    if (shut) close();
  };
  head.addEventListener("pointerup", end);
  head.addEventListener("pointercancel", end);
}

/* Any element marked data-add-to-cart adds its product, so product cards need no extra script */
document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-add-to-cart]");
  if (!t) return;
  const d = t.dataset;
  add({ id: d.id, name: d.name, price: d.price, img: d.img, variant: d.variant, qty: d.qty }, { open: "openCart" in d });
});

window.GDCart = { add, remove, setQty, clear, open, close, items: () => items.map((p) => ({ ...p })), count, kinds, total };
render();
