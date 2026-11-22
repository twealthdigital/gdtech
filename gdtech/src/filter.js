import "./filter.css";

const $ = (id) => document.getElementById(id);

const DEFAULTS = { cat: [], brand: [], cond: "Any", sort: "Popular", price: 3000000 };
export const filters = structuredClone(DEFAULTS);

const btn = document.querySelector(".s-filter");
const panel = $("fm");
const backdrop = $("fm-bd");
const badge = $("fm-badge");
const range = $("fm-price");
const priceVal = $("fm-price-val");
const seg = panel.querySelector(".seg");

const naira = (n) => "₦" + Number(n).toLocaleString("en-NG");

function sync() {
  // chips follow state
  panel.querySelectorAll(".chips").forEach((g) => {
    const key = g.dataset.key;
    g.querySelectorAll(".chip").forEach((c) => {
      const v = c.dataset.v;
      c.classList.toggle("on", Array.isArray(filters[key]) ? filters[key].includes(v) : filters[key] === v);
    });
  });
  // segmented control
  const btns = [...seg.querySelectorAll("button")];
  btns.forEach((b, i) => {
    const on = b.dataset.v === filters.cond;
    b.classList.toggle("on", on);
    if (on) seg.style.setProperty("--k", i);
  });
  // price
  range.value = filters.price;
  const pct = ((filters.price - range.min) / (range.max - range.min)) * 100;
  range.style.setProperty("--p", pct + "%");
  priceVal.textContent = filters.price >= +range.max ? "Any price" : "Up to " + naira(filters.price);
}

function count() {
  return filters.cat.length + filters.brand.length + (filters.cond !== "Any") + (filters.sort !== "Popular") + (filters.price < +range.max);
}

function paintBadge() {
  const n = count();
  badge.textContent = n;
  badge.classList.toggle("on", n > 0);
}

function open() {
  // grow from the button: set the panel's transform origin to the button centre
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
  panel.classList.remove("open");
  backdrop.classList.remove("open");
  btn.setAttribute("aria-expanded", "false");
  panel.setAttribute("aria-hidden", "true");
  paintBadge();
}

btn.addEventListener("click", (e) => {
  e.preventDefault();
  panel.classList.contains("open") ? close() : open();
});
backdrop.addEventListener("click", close);
document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
$("fm-apply").addEventListener("click", close);

panel.querySelectorAll(".chips").forEach((g) => {
  g.addEventListener("click", (e) => {
    const c = e.target.closest(".chip");
    if (!c) return;
    const key = g.dataset.key, v = c.dataset.v;
    if (Array.isArray(filters[key])) {
      const i = filters[key].indexOf(v);
      i > -1 ? filters[key].splice(i, 1) : filters[key].push(v);
    } else filters[key] = v;
    sync();
  });
});

seg.addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (!b) return;
  filters.cond = b.dataset.v;
  sync();
});

range.addEventListener("input", () => { filters.price = +range.value; sync(); });

$("fm-reset").addEventListener("click", () => {
  Object.assign(filters, structuredClone(DEFAULTS), { price: +range.max });
  sync();
});

filters.price = +range.max;
sync();
paintBadge();
