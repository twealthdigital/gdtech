import { imgSrc, observeLazyImages } from "./perf.js";

// Hottest deals carousel. Add a deal by adding one object here (photo in /public/launch, cropped wide and short).
const DEALS = [
  { img: "/launch/iphone-18-pro.webp", w: 736, h: 440, alt: "iPhone 18 Pro in black, silver, blue and purple",
    kick: "Just landed", title: "iPhone 18 Pro<br>series is out", cta: "Shop now", shop: "mobile:Apple", bg: "#0b0b0c", ink: "#fff" },
  { img: "/launch/galaxy-s26-ultra.webp", w: 736, h: 440, alt: "Samsung Galaxy S26 Ultra in four colours with the S Pen",
    kick: "Hot pick", title: "Galaxy S26<br>Ultra is here", cta: "Shop now", shop: "mobile:Samsung", bg: "#2a1a63", ink: "#fff" },
  { img: "/launch/galaxy-z-fold8.webp", w: 736, h: 440, alt: "Samsung Galaxy Z Fold8 Ultra, Fold8 and Flip8 foldables",
    kick: "New foldables", title: "Galaxy Z Fold8<br>and Flip8", cta: "Shop now", shop: "mobile:Samsung:fold", bg: "#f3eef9", ink: "#17171a" },
];

const track = document.getElementById("d-track");
const dotsEl = document.getElementById("d-dots");
if (track && dotsEl) {
  const arrow = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>';
  track.dataset.n = DEALS.length;
  dotsEl.dataset.n = DEALS.length;
  track.innerHTML = DEALS.map((d, i) => `
    <article class="d-card" style="--d-bg:${d.bg};--d-ink:${d.ink}">
      <img ${i ? `data-src="${d.img}" loading="lazy"` : `src="${imgSrc(d.img)}"`} width="${d.w}" height="${d.h}" style="--ar:${d.w} / ${d.h}" alt="${d.alt}" decoding="async" draggable="false" />
      <div class="d-row">
        <div class="d-text"><span class="d-kick">${d.kick}</span><h3>${d.title}</h3></div>
        <button class="d-btn" type="button" data-shop="${d.shop}">${d.cta} ${arrow}</button>
      </div>
    </article>`).join("");
  observeLazyImages(track, track);
  dotsEl.innerHTML = DEALS.map((_, i) => `<i${i ? "" : ' class="on"'}></i>`).join("");
  const dots = dotsEl.querySelectorAll("i");
  const stepOf = () => track.firstElementChild.offsetWidth + 12;
  let cur = 0;
  let holdUntil = 0;
  let visible = true;

  // Dots follow the swipe
  track.addEventListener("scroll", () => {
    let i = Math.round(track.scrollLeft / stepOf());
    if (track.scrollLeft + track.clientWidth >= track.scrollWidth - 4) i = dots.length - 1;
    cur = i;
    dots.forEach((d, k) => d.classList.toggle("on", k === i));
  }, { passive: true });

  // Same as the hero banners: a finger or mouse pauses the auto slide for a few seconds
  const hold = () => { holdUntil = Date.now() + 5000; };
  ["touchstart", "touchmove", "touchend"].forEach((t) => track.addEventListener(t, hold, { passive: true }));
  track.addEventListener("pointerdown", hold);

  // Mouse / pen drag (touch already drags natively): grab, drag, release with a fling, snap to the nearest card
  let drag = null;
  let suppressClick = false;
  track.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "touch" || e.button !== 0) return;
    drag = { x: e.clientX, left: track.scrollLeft, lastX: e.clientX, lastT: performance.now(), v: 0, moved: false, id: e.pointerId };
  });
  track.addEventListener("pointermove", (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x;
    if (!drag.moved) {
      if (Math.abs(dx) < 6) return;
      drag.moved = true;
      track.classList.add("dragging");
      track.setPointerCapture(e.pointerId);
    }
    const now = performance.now();
    drag.v = (e.clientX - drag.lastX) / Math.max(1, now - drag.lastT);
    drag.lastX = e.clientX; drag.lastT = now;
    track.scrollLeft = drag.left - dx;
    hold();
  });
  const endDrag = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const d = drag; drag = null;
    if (!d.moved) return;
    suppressClick = true;
    setTimeout(() => { suppressClick = false; }, 0);
    const step = stepOf();
    const fling = Math.max(-1, Math.min(1, -d.v * 220 / step));
    let i = Math.round(track.scrollLeft / step + fling);
    i = Math.max(0, Math.min(dots.length - 1, i));
    track.classList.remove("dragging");
    track.scrollTo({ left: i * step, behavior: "smooth" });
    hold();
  };
  track.addEventListener("pointerup", endDrag);
  track.addEventListener("pointercancel", endDrag);
  // A drag must not count as a tap on the Shop button
  track.addEventListener("click", (e) => { if (suppressClick) { e.preventDefault(); e.stopPropagation(); } }, true);

  // Auto slide, looping back to the first card; only while the section is on screen
  new IntersectionObserver(([en]) => { visible = en.isIntersecting; }, { threshold: 0.4 }).observe(track);
  if (DEALS.length > 1) {
    setInterval(() => {
      if (document.hidden || !visible || Date.now() < holdUntil) return;
      track.scrollTo({ left: ((cur + 1) % dots.length) * stepOf(), behavior: "smooth" });
    }, 4200);
  }
}
