// Hottest deals carousel. Add a deal by adding one object here (photo in /public/launch, cropped wide and short).
const DEALS = [
  { img: "/launch/iphone-18-pro.webp", w: 736, h: 440, alt: "iPhone 18 Pro in black, silver, blue and purple",
    kick: "Just landed", title: "iPhone 18 Pro<br>series is out", cta: "Shop now" },
];

const track = document.getElementById("d-track");
const dotsEl = document.getElementById("d-dots");
if (track && dotsEl) {
  const arrow = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>';
  track.dataset.n = DEALS.length;
  dotsEl.dataset.n = DEALS.length;
  track.innerHTML = DEALS.map((d, i) => `
    <article class="d-card">
      <img src="${d.img}" width="${d.w}" height="${d.h}" style="--ar:${d.w} / ${d.h}" alt="${d.alt}" ${i ? 'loading="lazy"' : ""} decoding="async" draggable="false" />
      <div class="d-row">
        <div class="d-text"><span class="d-kick">${d.kick}</span><h3>${d.title}</h3></div>
        <button class="d-btn" type="button">${d.cta} ${arrow}</button>
      </div>
    </article>`).join("");
  dotsEl.innerHTML = DEALS.map((_, i) => `<i${i ? "" : ' class="on"'}></i>`).join("");
  const dots = dotsEl.querySelectorAll("i");
  track.addEventListener("scroll", () => {
    const card = track.firstElementChild;
    const step = card.offsetWidth + 12;
    let i = Math.round(track.scrollLeft / step);
    if (track.scrollLeft + track.clientWidth >= track.scrollWidth - 4) i = dots.length - 1;
    dots.forEach((d, k) => d.classList.toggle("on", k === i));
  }, { passive: true });
}
