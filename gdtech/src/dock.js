// Bottom bar: a glass droplet sits under the active icon. Tapping stretches it across to the next
// icon and settles with a small wobble. Pressing lifts and magnifies it, and you can drag it along the bar.
const dock = document.getElementById("dock");

if (dock) {
  const btns = [...dock.querySelectorAll("button")];
  const lens = document.createElement("i");
  lens.className = "dock-lens";
  lens.setAttribute("aria-hidden", "true");
  dock.prepend(lens);

  const W = 62;
  let centers = [];
  let cur = Math.max(0, btns.findIndex((b) => b.classList.contains("on")));
  let x = 0;
  let anim = null;

  const T = (px, sx = 1, sy = 1) => `translate3d(${px - W / 2}px,0,0) scale(${sx},${sy})`;
  const measure = () => { centers = btns.map((b) => b.offsetLeft + b.offsetWidth / 2); };
  const set = (px, sx = 1, sy = 1) => { x = px; lens.style.transform = T(px, sx, sy); };
  const nearest = (px) => centers.reduce((best, c, i) => (Math.abs(c - px) < Math.abs(centers[best] - px) ? i : best), 0);
  const mark = (i) => btns.forEach((b, n) => b.classList.toggle("on", n === i));
  const hot = (i) => btns.forEach((b, n) => b.classList.toggle("hot", n === i));

  const read = () => new DOMMatrixReadOnly(getComputedStyle(lens).transform).m41 + W / 2;

  function glide(i) {
    const from = anim ? read() : x;
    const to = centers[i];
    if (anim) { anim.cancel(); anim = null; }
    const dist = Math.abs(to - from);
    if (dist < 1) { set(to); return; }
    const s = 1 + Math.min(dist / 80, 0.85);   // stretch grows with the distance travelled
    const dir = Math.sign(to - from);
    anim = lens.animate(
      [
        { transform: T(from) },
        { transform: T(from + (to - from) * 0.45, s, 1 / Math.sqrt(s)), offset: 0.4 },
        { transform: T(to + dir * 5, 0.96, 1.05), offset: 0.74 },
        { transform: T(to) },
      ],
      { duration: 620, easing: "cubic-bezier(0.3, 0.9, 0.35, 1)" }
    );
    const done = () => { if (anim) { anim = null; } set(to); };
    anim.onfinish = done;
    anim.oncancel = () => {};
    x = to;
  }

  let down = false, moved = false, lastX = 0, startX = 0;
  const local = (e) => e.clientX - dock.getBoundingClientRect().left;

  dock.addEventListener("pointerdown", (e) => {
    down = true; moved = false;
    startX = lastX = local(e);
    dock.setPointerCapture?.(e.pointerId);
    dock.classList.add("lifted");
    const i = nearest(startX);
    hot(i);
    glide(i);
  });

  dock.addEventListener("pointermove", (e) => {
    if (!down) return;
    const px = local(e);
    if (!moved && Math.abs(px - startX) > 6) {
      moved = true;
      if (anim) { const at = read(); anim.cancel(); anim = null; set(at); }
    }
    if (!moved) return;
    const c = Math.min(Math.max(px, centers[0]), centers[centers.length - 1]);
    const v = Math.abs(px - lastX);
    lastX = px;
    const s = 1 + Math.min(v * 0.045, 0.4);   // faster drag stretches the droplet more
    set(c, s, 1 / Math.sqrt(s));
    hot(nearest(c));
  });

  const end = (e) => {
    if (!down) return;
    down = false;
    dock.classList.remove("lifted");
    const i = nearest(moved ? x : local(e));
    cur = i;
    mark(i); hot(-1);
    glide(i);
  };
  dock.addEventListener("pointerup", end);
  dock.addEventListener("pointercancel", end);

  const place = () => { measure(); set(centers[cur]); };
  new ResizeObserver(place).observe(dock);
  place();
  mark(cur);
}
