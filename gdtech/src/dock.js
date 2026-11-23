// Bottom bar. Three layers: the bar's glass, a glass droplet that follows the active icon, then the icons.
// The droplet is its own glass (a sibling, not a child), so it bends the page behind it like a drop of water.
// Motion is a spring: tapping stretches it across and it wobbles in, pressing lifts and magnifies it,
// dragging stretches it with your speed. The lens swells with the movement.
// The active tab opens up to show its name next to its icon, and the droplet is exactly that wide.
// Taps and drags announce themselves with a "dock:go" event; pages that change the tab call back with "dock:set".
import { lensBoost } from "./glass.js";
import { isLow } from "./perf.js";

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

  // Layout model, kept in step with home.css: the active tab grows G times wider than the others.
  const G = 2.35, PAD = 6;
  let W = 120;                      // width of the active tab (and of the droplet)
  let centers = [];                 // where the droplet sits for each tab, once that tab is the active one
  let cur = Math.max(0, btns.findIndex((b) => b.classList.contains("on")));

  // spring state
  let x = 0, vx = 0, tx = 0;       // position of the droplet centre
  let l = 1, vl = 0, tl = 1;       // lift (magnify)
  let p = 0, vp = 0;               // pulse: the whole bar reacts, kicked on every press and every tab change
  let downAt = 0, liftTimer = 0;
  let raf = 0, t0 = 0, dragging = false;

  const measure = () => {
    const u = (dock.clientWidth - PAD * 2) / (btns.length - 1 + G);
    W = u * G;
    centers = btns.map((_, i) => PAD + i * u + W / 2);
    lens.style.width = Math.round(W - 2) + "px";
  };
  const nearest = (px) => centers.reduce((best, c, i) => (Math.abs(c - px) < Math.abs(centers[best] - px) ? i : best), 0);
  const mark = (i) => btns.forEach((b, n) => b.classList.toggle("on", n === i));
  const hot = (i) => btns.forEach((b, n) => b.classList.toggle("hot", n === i));

  function paint() {
    if (isLow) {
      lens.style.transform = `translate3d(${(x - (W - 2) / 2).toFixed(1)}px,0,0) scale(${l.toFixed(3)})`;
      lensBoost(lens, l > 1.05 ? 1.6 : 1);
      return;
    }
    const s = 1 + Math.min(Math.abs(vx) / 1100, 0.7);          // faster movement stretches it
    const sx = s * l, sy = l / Math.sqrt(s);
    lens.style.transform = `translate3d(${x - (W - 2) / 2}px,0,0) scale(${sx.toFixed(3)},${sy.toFixed(3)})`;
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
  const run = () => {
    if (isLow) {
      x = tx; l = tl; vx = vl = p = vp = 0;
      paint();
      return;
    }
    if (!raf) { t0 = performance.now(); raf = requestAnimationFrame(step); }
  };

  let down = false, moved = false, startX = 0, startTab = 0;
  const local = (e) => e.clientX - dock.getBoundingClientRect().left;
  const tabOf = (btn) => btn?.dataset.tab;
  const go = (i) => document.dispatchEvent(new CustomEvent("dock:go", { detail: { tab: tabOf(btns[i]), index: i } }));

  // Move the active tab (and the droplet) to tab i
  function activate(i, kick = true) {
    if (i === cur) return;
    const prev = cur;
    cur = i;
    mark(i);
    if (kick) vp += 7 + Math.min(Math.abs(centers[i] - centers[prev]) / 50, 5);   // bigger jump, bigger ripple
  }

  dock.addEventListener("pointerdown", (e) => {
    down = true; moved = false; dragging = false;
    startX = local(e);
    startTab = cur;
    dock.setPointerCapture?.(e.pointerId);
    clearTimeout(liftTimer);
    downAt = performance.now();
    dock.classList.add("lifted");
    tl = 1.22;
    const under = btns.indexOf(e.target.closest("button"));
    const i = under >= 0 ? under : nearest(startX);
    activate(i);
    tx = centers[i];
    vp += 4;
    run();
  });

  dock.addEventListener("pointermove", (e) => {
    if (!down) return;
    const px = local(e);
    if (!moved && Math.abs(px - startX) > 6) { moved = true; dragging = true; }
    if (!moved) return;
    tx = Math.min(Math.max(px, centers[0]), centers[centers.length - 1]);
    activate(nearest(tx));
    run();
  });

  const end = (e) => {
    if (!down) return;
    down = false; dragging = false;
    activate(nearest(moved ? x : tx));
    tx = centers[cur]; tl = 1;
    hot(-1);
    // a quick tap still gets the full lift: hold it for at least 220ms
    const hold = Math.max(0, 220 - (performance.now() - downAt));
    clearTimeout(liftTimer);
    liftTimer = setTimeout(() => dock.classList.remove("lifted"), hold);
    run();
    if (e.type === "pointerup" && (!moved || cur !== startTab)) go(cur);
  };
  dock.addEventListener("pointerup", end);
  dock.addEventListener("pointercancel", end);

  // Keyboard and screen readers (a pointer tap is handled above)
  btns.forEach((b, i) => b.addEventListener("click", (e) => {
    if (e.detail !== 0) return;
    activate(i);
    tx = centers[i];
    run();
    go(i);
  }));

  // A page changed on its own (the shop opened, the shop closed): follow it without announcing it back
  document.addEventListener("dock:set", (e) => {
    const i = btns.findIndex((b) => tabOf(b) === e.detail?.tab);
    if (i < 0 || down) return;
    activate(i);
    tx = centers[i];
    run();
  });

  const place = () => { measure(); x = tx = centers[cur]; paint(); };
  new ResizeObserver(place).observe(dock);
  place();
  mark(cur);
}
