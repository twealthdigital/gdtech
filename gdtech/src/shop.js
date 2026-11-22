import "./shop.css";
import { CATS, svg } from "./data/categories.js";
import { filters } from "./filter.js";
import { picked, setCategory } from "./categories.js";

const $ = (id) => document.getElementById(id);
const naira = (n) => "₦" + Number(n).toLocaleString("en-NG");

// Placeholder catalogue: swap in real stock, prices and photos here.
// tone: orange | slate | cream | ink (same colour blocks as the home banners)
const PRODUCTS = [
  { id: 1,  name: "iPhone 16 Pro Max", spec: "256GB",          brand: "Apple",       cat: "mobile",    cond: "New",  price: 2450000, tone: "orange", img: "/phones/banner-1.webp", w: 672, h: 760 },
  { id: 2,  name: "Galaxy S25 Ultra",  spec: "256GB",          brand: "Samsung",     cat: "mobile",    cond: "New",  price: 2100000, tone: "slate",  img: "/phones/banner-2.webp", w: 632, h: 760 },
  { id: 3,  name: "Pixel 9 Pro",       spec: "128GB",          brand: "Google",      cat: "mobile",    cond: "New",  price: 1450000, tone: "cream",  img: "/phones/banner-3.webp", w: 512, h: 760 },
  { id: 4,  name: "iPhone 15 Pro",     spec: "128GB",          brand: "Apple",       cat: "mobile",    cond: "Used", price: 1150000, tone: "ink",    img: "/phones/banner-1.webp", w: 672, h: 760 },
  { id: 5,  name: "MacBook Air M2",    spec: "13-inch, 8GB",   brand: "Apple",       cat: "laptops",   cond: "New",  price: 1850000, tone: "slate" },
  { id: 6,  name: "AirPods Pro 2",     spec: "USB-C",          brand: "Apple",       cat: "headsets",  cond: "New",  price: 285000,  tone: "cream" },
  { id: 7,  name: "Galaxy Tab S9",     spec: "128GB",          brand: "Samsung",     cat: "tablets",   cond: "New",  price: 980000,  tone: "orange" },
  { id: 8,  name: "WH-1000XM5",        spec: "Noise cancelling", brand: "Sony",      cat: "headsets",  cond: "New",  price: 420000,  tone: "ink" },
  { id: 9,  name: "PlayStation 5 Slim", spec: "1TB",           brand: "PlayStation", cat: "gaming",    cond: "New",  price: 780000,  tone: "slate" },
  { id: 10, name: "Galaxy S24 Ultra",  spec: "256GB",          brand: "Samsung",     cat: "mobile",    cond: "Used", price: 1300000, tone: "cream",  img: "/phones/banner-2.webp", w: 632, h: 760 },
  { id: 11, name: "Anker 65W GaN",     spec: "Fast charger",   brand: "Anker",       cat: "power",     cond: "New",  price: 38000,   tone: "orange" },
  { id: 12, name: "iPad Air M2",       spec: "11-inch, 128GB", brand: "Apple",       cat: "tablets",   cond: "New",  price: 1100000, tone: "ink" },
];

// Filter chips use shop wording; map them to category ids
const CHIP_CAT = { Phones: "mobile", Tablets: "tablets", Accessories: "accessories", Chargers: "power" };
const icon = (id) => svg(CATS.find((c) => c.id === id)?.icon || "");

const tabsEl = $("shop-tabs");
const gridEl = $("shop-grid");
const emptyEl = $("shop-empty");
const countEl = $("shop-count");
const searchEl = document.querySelector("#home .search input");
const added = new Set();

// Tabs: All + every category that has stock
const tabCats = CATS.filter((c) => PRODUCTS.some((p) => p.cat === c.id));
tabsEl.innerHTML =
  `<button class="s-tab" type="button" role="tab" data-id="">All</button>` +
  tabCats.map((c) => `<button class="s-tab" type="button" role="tab" data-id="${c.id}">${c.name}</button>`).join("");

function visible() {
  const q = (searchEl?.value || "").trim().toLowerCase();
  const chipCats = filters.cat.map((v) => CHIP_CAT[v]).filter(Boolean);
  let list = PRODUCTS.filter((p) =>
    (!picked.cat || p.cat === picked.cat) &&
    (!picked.brands.length || picked.brands.includes(p.brand)) &&
    (!chipCats.length || chipCats.includes(p.cat)) &&
    (!filters.brand.length || filters.brand.includes(p.brand)) &&
    (filters.cond === "Any" || p.cond === filters.cond) &&
    p.price <= filters.price &&
    (!q || (p.name + " " + p.brand + " " + p.spec).toLowerCase().includes(q)));
  if (filters.sort === "Price low") list = [...list].sort((a, b) => a.price - b.price);
  else if (filters.sort === "Price high") list = [...list].sort((a, b) => b.price - a.price);
  else if (filters.sort === "Newest") list = [...list].sort((a, b) => b.id - a.id);
  return list;
}

function card(p) {
  const media = p.img
    ? `<img src="${p.img}" width="${p.w}" height="${p.h}" alt="${p.brand} ${p.name}" loading="lazy" decoding="async" />`
    : `<span class="p-ico">${icon(p.cat)}</span>`;
  const on = added.has(p.id);
  return `<article class="p-card ${p.tone}">
    <div class="p-stage">
      <span class="p-tag${p.cond === "Used" ? " used" : ""}">${p.cond === "Used" ? "USED" : "NEW"}</span>
      ${media}
    </div>
    <div class="p-info">
      <p class="p-brand">${p.brand}</p>
      <h3 class="p-name">${p.name}</h3>
      <p class="p-spec">${p.spec}</p>
      <div class="p-buy">
        <b class="p-price">${naira(p.price)}</b>
        <button class="p-add${on ? " on" : ""}" type="button" data-id="${p.id}" aria-label="${on ? "Remove" : "Add"} ${p.name} ${on ? "from" : "to"} bag" aria-pressed="${on}">
          <span>${on ? "Added" : "Add to bag"}</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${on ? '<path d="M5 12.5l4.5 4.5L19 7.5"/>' : '<path d="M12 5v14M5 12h14"/>'}</svg>
        </button>
      </div>
    </div>
  </article>`;
}

function render() {
  const list = visible();
  gridEl.innerHTML = list.map(card).join("");
  gridEl.hidden = !list.length;
  emptyEl.hidden = !!list.length;
  countEl.textContent = list.length + (list.length === 1 ? " item" : " items");
  tabsEl.querySelectorAll(".s-tab").forEach((t) => {
    const on = (t.dataset.id || null) === (picked.cat || null);
    t.classList.toggle("on", on);
    t.setAttribute("aria-selected", on);
  });
}

tabsEl.addEventListener("click", (e) => {
  const t = e.target.closest(".s-tab");
  if (!t) return;
  setCategory(t.dataset.id || null);
  t.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
});

gridEl.addEventListener("click", (e) => {
  const b = e.target.closest(".p-add");
  if (!b) return;
  const id = +b.dataset.id;
  added.has(id) ? added.delete(id) : added.add(id);
  render();
});

$("shop-reset").addEventListener("click", () => {
  setCategory(null);
  $("fm-reset").click();
  if (searchEl) searchEl.value = "";
  render();
});

document.addEventListener("shop:update", render);
searchEl?.addEventListener("input", render);
render();
