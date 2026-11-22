import "./base.css";
import "./glass.js";
import "./home.css";
import "./filter.js";
import "./categories.js";
import "./tradein.css";

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
const homeEl = $("home");
const hTop = homeEl.querySelector(".h-top");
homeEl.addEventListener("scroll", () => {
  hTop.classList.toggle("stuck", homeEl.scrollTop > 4);
}, { passive: true });
