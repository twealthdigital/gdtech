import "./base.css";
import "./glass.js";
import "./home.css";
import "./filter.js";
import "./categories.js";
import "./tradein.css";
import "./launch.css";
import "./launch.js";
import "./foldable.css";
import "./foldable.js";
import "./collections.js";

const $ = (id) => document.getElementById(id);


// Home: banners auto-slide, swipe by hand, dots follow
const bTrack = $("b-track");
const bDots = document.querySelectorAll("#b-dots i");
let cur = 0;
let holdUntil = 0;

bTrack.addEventListener("scroll", () => {
  const step = bTrack.children[0].offsetWidth + 12;
  let i = Math.round(bTrack.scrollLeft / step);
  if (bTrack.scrollLeft + bTrack.clientWidth >= bTrack.scrollWidth - 4) i = bDots.length - 1;
  cur = i;
  bDots.forEach((d, n) => d.classList.toggle("on", n === i));
}, { passive: true });

// While a finger is on the banners, pause the auto slide
const hold = () => { holdUntil = Date.now() + 5000; };
bTrack.addEventListener("touchstart", hold, { passive: true });
bTrack.addEventListener("touchmove", hold, { passive: true });
bTrack.addEventListener("touchend", hold, { passive: true });
bTrack.addEventListener("pointerdown", hold);

// Mouse / pen drag (touch already drags natively): grab, drag, release with a fling, snap to the nearest card
let drag = null;
let suppressClick = false;
bTrack.addEventListener("pointerdown", (e) => {
  if (e.pointerType === "touch" || e.button !== 0) return;
  drag = { x: e.clientX, left: bTrack.scrollLeft, lastX: e.clientX, lastT: performance.now(), v: 0, moved: false, id: e.pointerId };
});
bTrack.addEventListener("pointermove", (e) => {
  if (!drag || e.pointerId !== drag.id) return;
  const dx = e.clientX - drag.x;
  if (!drag.moved) {
    if (Math.abs(dx) < 6) return;
    drag.moved = true;
    bTrack.classList.add("dragging");
    bTrack.setPointerCapture(e.pointerId);
  }
  const now = performance.now();
  drag.v = (e.clientX - drag.lastX) / Math.max(1, now - drag.lastT);
  drag.lastX = e.clientX; drag.lastT = now;
  bTrack.scrollLeft = drag.left - dx;
  hold();
});
const endDrag = (e) => {
  if (!drag || e.pointerId !== drag.id) return;
  const d = drag; drag = null;
  if (!d.moved) return;
  suppressClick = true;
  setTimeout(() => { suppressClick = false; }, 0);
  const step = bTrack.children[0].offsetWidth + 12;
  const fling = Math.max(-1, Math.min(1, -d.v * 220 / step));
  let i = Math.round(bTrack.scrollLeft / step + fling);
  i = Math.max(0, Math.min(bDots.length - 1, i));
  bTrack.classList.remove("dragging");
  bTrack.scrollTo({ left: i * step, behavior: "smooth" });
  hold();
};
bTrack.addEventListener("pointerup", endDrag);
bTrack.addEventListener("pointercancel", endDrag);
// A drag must not count as a tap on the Details button
bTrack.addEventListener("click", (e) => { if (suppressClick) { e.preventDefault(); e.stopPropagation(); } }, true);

setInterval(() => {
  if (Date.now() < holdUntil) return;
  const step = bTrack.children[0].offsetWidth + 12;
  const next = (cur + 1) % bDots.length;
  bTrack.scrollTo({ left: next * step, behavior: "smooth" });
}, 3500);

// Home: bottom nav
document.querySelectorAll("#dock button").forEach((b) => {
  b.addEventListener("click", () => {
    document.querySelectorAll("#dock button").forEach((x) => x.classList.toggle("on", x === b));
  });
});

// Home: header stays fixed at the top; give it a solid backing once content scrolls under it
const homeEl = $("h-scroll");
const hTop = document.querySelector("#home .h-top");
homeEl.addEventListener("scroll", () => {
  hTop.classList.toggle("stuck", homeEl.scrollTop > 4);
}, { passive: true });
