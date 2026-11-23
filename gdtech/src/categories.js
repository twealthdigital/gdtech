import "./categories.css";
import { CATS, svg } from "./data/categories.js";

const $ = (id) => document.getElementById(id);
const home = $("home");
const list = $("cat-list");
const grid = $("cm-grid");
const brandBox = $("cm-brands");
const brandWrap = $("cm-brand-wrap");
const allBtn = $("cat-all");
const panel = $("cm");
const backdrop = $("cm-bd");
const apply = $("cm-apply");

export const picked = { cat: null, brands: [] };

// ---------- render from the shared data ----------
list.innerHTML = CATS.filter((c) => c.circle).map((c) => `
  <button class="cat" type="button" data-id="${c.id}" data-tilt="orb">
    <span class="c-orb glass"><span class="c-ico">${svg(c.icon)}</span></span>
    <span class="c-name">${c.name}</span>
  </button>`).join("");

grid.innerHTML = CATS.map((c) => `
  <button class="cm-tile" type="button" data-id="${c.id}" data-tilt="tile">
    <span class="cm-ico">${svg(c.icon)}</span><span class="cm-name">${c.name}</span>
  </button>`).join("");

// ---------- liquid hover and touch: zoom, tilt, the icon and label drift ----------
function tilt(el) {
  const strong = el.dataset.tilt === "orb";
  const max = strong ? 24 : 7;
  const move = (e) => {
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty("--rx", (-y * max).toFixed(1) + "deg");
    el.style.setProperty("--ry", (x * max).toFixed(1) + "deg");
    el.style.setProperty("--tx", (x * 7).toFixed(1) + "px");
    el.style.setProperty("--ty", (y * 7).toFixed(1) + "px");
    el.style.setProperty("--rz", (x * 7).toFixed(1) + "deg");
    el.style.setProperty("--mx", (x + 0.5) * 100 + "%");
    el.style.setProperty("--my", (y + 0.5) * 100 + "%");
    el.classList.add("hot");
  };
  const rest = () => {
    el.classList.remove("hot");
    ["--rx", "--ry", "--tx", "--ty", "--rz", "--mx", "--my"].forEach((k) => el.style.removeProperty(k));
  };
  el.addEventListener("pointerenter", move);
  el.addEventListener("pointermove", move);
  el.addEventListener("pointerdown", move);
  el.addEventListener("pointerleave", rest);
  el.addEventListener("pointerup", () => setTimeout(rest, 220));
  el.addEventListener("pointercancel", rest);
}
document.querySelectorAll("[data-tilt]").forEach(tilt);
tilt(allBtn);

// ---------- selection ----------
const byId = (id) => CATS.find((c) => c.id === id);

function paint() {
  document.querySelectorAll(".cat[data-id], .cm-tile").forEach((b) => b.classList.toggle("on", b.dataset.id === picked.cat));
  allBtn.classList.toggle("has", !!picked.cat && !byId(picked.cat).circle);
  const c = byId(picked.cat);
  brandWrap.classList.toggle("open", !!c);
  if (c) {
    brandBox.innerHTML = c.brands.map((b) => `<button class="chip${picked.brands.includes(b) ? " on" : ""}" type="button" data-v="${b}">${b}</button>`).join("");
    apply.textContent = picked.brands.length ? `Show ${picked.brands.length === 1 ? picked.brands[0] : picked.brands.length + " brands"} ${c.name}` : `Show ${c.name}`;
  } else {
    apply.textContent = "Show all gadgets";
  }
  document.dispatchEvent(new CustomEvent("category:change"));
}

export function setCategory(id) {
  picked.cat = id;
  picked.brands = [];
  paint();
}

function choose(id) {
  picked.cat = picked.cat === id ? null : id;
  picked.brands = [];
  paint();
}

list.addEventListener("click", (e) => {
  const b = e.target.closest(".cat");
  if (!b) return;
  setCategory(b.dataset.id);
  document.dispatchEvent(new CustomEvent("collections:open", { detail: { cat: b.dataset.id, trigger: b } }));
});
grid.addEventListener("click", (e) => { const b = e.target.closest(".cm-tile"); if (b) choose(b.dataset.id); });
brandBox.addEventListener("click", (e) => {
  const c = e.target.closest(".chip");
  if (!c) return;
  const v = c.dataset.v, i = picked.brands.indexOf(v);
  i > -1 ? picked.brands.splice(i, 1) : picked.brands.push(v);
  paint();
});
$("cm-clear").addEventListener("click", () => { picked.cat = null; picked.brands = []; paint(); });

// ---------- dropdown: same liquid drop as the filters ----------
function open() {
  home.style.setProperty("--st", home.scrollTop + "px");
  home.classList.add("lock");
  const b = allBtn.getBoundingClientRect();
  const p = panel.getBoundingClientRect();
  panel.style.setProperty("--ox", b.left + b.width / 2 - p.left + "px");
  panel.style.setProperty("--oy", b.top + b.height / 2 - p.top + "px");
  panel.classList.add("open");
  backdrop.classList.add("open");
  allBtn.setAttribute("aria-expanded", "true");
  panel.setAttribute("aria-hidden", "false");
}
function close() {
  panel.classList.remove("open");
  backdrop.classList.remove("open");
  home.classList.remove("lock");
  allBtn.setAttribute("aria-expanded", "false");
  panel.setAttribute("aria-hidden", "true");
}
allBtn.addEventListener("click", () => (panel.classList.contains("open") ? close() : open()));
backdrop.addEventListener("click", close);
apply.addEventListener("click", () => {
  close();
  if (picked.cat && picked.brands.length === 1) {
    document.dispatchEvent(new CustomEvent("collection:open", { detail: { cat: picked.cat, brand: picked.brands[0], trigger: apply } }));
  } else {
    document.dispatchEvent(new CustomEvent("collections:open", { detail: { cat: picked.cat || "all", trigger: apply } }));
  }
});
document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });

paint();
