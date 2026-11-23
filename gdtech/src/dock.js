// Bottom bar. Three layers: the bar's glass, a glass droplet that follows the active icon, then the icons.
// The droplet is its own glass (a sibling, not a child), so it bends the page behind it like a drop of water.
// Motion is a spring: tapping stretches it across and it wobbles in, pressing lifts and magnifies it,
// dragging stretches it with your speed. The lens swells with the movement.
import { lensBoost } from "./glass.js";

const dock = document.getElementById("dock");

if (dock) {
  const btns = [...dock.querySelectorAll("button")];
  const bar = document.createElement("span");
  bar.className = "dock-glass glass";
  bar.setAttribute("aria-hidden", "true");
  const lens = document.createElement("i");
  lens.className = "dock-lens glass";
  lens.dataset.lensBezel = "0.5";
  lens.dataset.lensDepth = "1.5";
  lens.setAttribute("aria-hidden", "true");
  dock.prepend(bar, lens);

  const W = 62;
  let centers = [];
  let cur = Math.max(0, btns.findIndex((b) => b.classList.contains("on")));

  // spring state
  let x = 0, vx = 0, tx = 0;       // position of the droplet centre
  let l = 1, vl = 0, tl = 1;       // lift (magnify)
  let p = 0, vp = 0;               // pulse: the whole bar reacts, kicked on every press and every tab change
  let downAt = 0, liftTimer = 0;
  let raf = 0, t0 = 0, dragging = false;

  const measure = () => { centers = btns.map((b) => b.offsetLeft + b.offsetWidth / 2); };
  const nearest = (px) => centers.reduce((best, c, i) => (Math.abs(c - px) < Math.abs(centers[best] - px) ? i : best), 0);
  const mark = (i) => btns.forEach((b, n) => b.classList.toggle("on", n === i));
  const hot = (i) => btns.forEach((b, n) => b.classList.toggle("hot", n === i));

  function paint() {
    const s = 1 + Math.min(Math.abs(vx) / 1100, 0.7);          // faster movement stretches it
    const sx = s * l, sy = l / Math.sqrt(s);
    lens.style.transform = `translate3d(${x - W / 2}px,0,0) scale(${sx.toFixed(3)},${sy.toFixed(3)})`;
    // the lens swells with speed and with the press
    lensBoost(lens, 1 + Math.min(Math.abs(vx) / 700, 1) * 0.9 + (l - 1) * 2.4);
    const pa = Math.abs(p);
    lensBoost(bar, 1 + pa * 1.1 + (dock.classList.contains("lifted") ? 0.3 : 0));
    bar.style.transform = `scale(${(1 + pa * 0.09).toFixed(4)},${(1 - pa * 0.11).toFixed(4)})`;
  }

  function step(t) {
    const dt = Math.min((t - t0) / 1000, 1 / 30) || 1 / 60;
    t0 = t;
    if (dragging) {
      const nx = x + (tx - x) * Math.min(1, dt * 32);
      vx = (nx - x) / dt;
      x = nx;
    } else {
      vx += (300 * (tx - x) - 22 * vx) * dt;            // underdamped spring: overshoots, then settles
      x += vx * dt;
    }
    vl += (320 * (tl - l) - 21 * vl) * dt;
    l += vl * dt;
    vp += (190 * -p - 11 * vp) * dt;           // wobbly spring back to rest
    p += vp * dt;
    paint();
    hot(down ? nearest(x) : -1);
    const calm = !dragging && Math.abs(tx - x) < 0.15 && Math.abs(vx) < 4 && Math.abs(tl - l) < 0.002 && Math.abs(vl) < 0.05 && Math.abs(p) < 0.004 && Math.abs(vp) < 0.05;
    if (calm) { x = tx; l = tl; vx = vl = 0; p = vp = 0; paint(); raf = 0; return; }
    raf = requestAnimationFrame(step);
  }
  const run = () => { if (!raf) { t0 = performance.now(); raf = requestAnimationFrame(step); } };

  let down = false, moved = false, startX = 0;
  const local = (e) => e.clientX - dock.getBoundingClientRect().left;

  dock.addEventListener("pointerdown", (e) => {
    down = true; moved = false; dragging = false;
    startX = local(e);
    dock.setPointerCapture?.(e.pointerId);
    clearTimeout(liftTimer);
    downAt = performance.now();
    dock.classList.add("lifted");
    tl = 1.22;
    tx = centers[nearest(startX)];
    vp += 4;
    run();
  });

  dock.addEventListener("pointermove", (e) => {
    if (!down) return;
    const px = local(e);
    if (!moved && Math.abs(px - startX) > 6) { moved = true; dragging = true; }
    if (!moved) return;
    tx = Math.min(Math.max(px, centers[0]), centers[centers.length - 1]);
    run();
  });

  const end = () => {
    if (!down) return;
    down = false; dragging = false;
    const prev = cur;
    cur = nearest(moved ? x : tx);
    tx = centers[cur]; tl = 1;
    mark(cur); hot(-1);
    if (cur !== prev) vp += 7 + Math.min(Math.abs(centers[cur] - centers[prev]) / 50, 5);   // bigger jump, bigger ripple
    // a quick tap still gets the full lift: hold it for at least 220ms
    const hold = Math.max(0, 220 - (performance.now() - downAt));
    clearTimeout(liftTimer);
    liftTimer = setTimeout(() => dock.classList.remove("lifted"), hold);
    run();
  };
  dock.addEventListener("pointerup", end);
  dock.addEventListener("pointercancel", end);

  btns.forEach((b, i) => b.addEventListener("click", (e) => {
    if (e.detail !== 0 || i === cur) return;       // pointer taps are handled above
    const prev = cur;
    cur = i; tx = centers[i];
    mark(i);
    vp += 7 + Math.min(Math.abs(centers[i] - centers[prev]) / 50, 5);
    run();
  }));

  const place = () => { measure(); x = tx = centers[cur]; paint(); };
  new ResizeObserver(place).observe(dock);
  place();
  mark(cur);
}
