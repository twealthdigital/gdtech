// Liquid glass for every page.
// Chromium can run an SVG filter on what is behind an element, so each .glass element gets its own
// lens: a displacement map built from the element's real size and corner radius. The middle stays
// clear and the rim bends the background inwards like a thick piece of glass, with a slight
// red/green/blue split at the edge. Other browsers keep the CSS-only glass (blur, rim light, sheen).
const NS = "http://www.w3.org/2000/svg";
const supported = !!navigator.userAgentData?.brands?.some((b) => /Chromium/.test(b.brand));
let boostImpl = () => {};
// Make one element's lens stronger or weaker live (1 is normal). Used for the water swell while pressing and dragging.
export const lensBoost = (node, m) => boostImpl(node, m);

if (supported) {
  document.documentElement.classList.add("lg-refract");

  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("width", "0"); svg.setAttribute("height", "0");
  svg.setAttribute("aria-hidden", "true"); svg.style.cssText = "position:absolute;pointer-events:none";
  const defs = document.createElementNS(NS, "defs");
  svg.appendChild(defs);
  document.body.insertAdjacentElement("afterbegin", svg);

  let uid = 0;
  const lenses = new WeakMap();
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });

  const el = (name, attrs) => {
    const n = document.createElementNS(NS, name);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    return n;
  };

  // Displacement map: R and G hold the x and y shift, 128 means no shift.
  // Distance to the rounded-rect edge decides how strong it is (convex lens profile),
  // the direction is the edge normal pointing back into the glass.
  function buildMap(w, h, radius, bezel, depth) {
    canvas.width = w; canvas.height = h;
    const img = ctx.createImageData(w, h), d = img.data;
    const hw = w / 2, hh = h / 2, r = Math.min(radius, hw, hh);
    const bx = hw - r, by = hh - r;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const px = x + 0.5 - hw, py = y + 0.5 - hh;
        const qx = Math.abs(px) - bx, qy = Math.abs(py) - by;
        const ox = Math.max(qx, 0), oy = Math.max(qy, 0), out = Math.hypot(ox, oy);
        const inside = -(out + Math.min(Math.max(qx, qy), 0) - r); // distance in from the edge
        let nx = 0, ny = 0, m = 0;
        if (inside < bezel) {
          if (qx > 0 && qy > 0) { nx = (ox / out) * Math.sign(px); ny = (oy / out) * Math.sign(py); }
          else if (qx > qy) nx = Math.sign(px);
          else ny = Math.sign(py);
          const t = Math.max(0, inside) / bezel;
          m = 1 - Math.sqrt(1 - (1 - t) * (1 - t)); // 1 at the very edge, 0 where the bezel ends
        }
        const i = (y * w + x) * 4;
        d[i] = Math.round(127.5 - nx * m * 127.5);
        d[i + 1] = Math.round(127.5 - ny * m * 127.5);
        d[i + 2] = 128; d[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    return canvas.toDataURL("image/png");
  }

  function radiusOf(cs, w, h) {
    const v = cs.borderTopLeftRadius || "0px";
    return v.endsWith("%") ? (parseFloat(v) / 100) * Math.min(w, h) : parseFloat(v) || 0;
  }

  function build(node) {
    const w = Math.round(node.offsetWidth), h = Math.round(node.offsetHeight);
    if (w < 8 || h < 8) return;
    let lens = lenses.get(node);
    if (lens && lens.w === w && lens.h === h) return;
    const cs = getComputedStyle(node);
    const short = Math.min(w, h);
    const bezel = Math.max(8, Math.min(30, short * (parseFloat(node.dataset.lensBezel) || 0.34)));
    const depth = bezel * (short < 80 ? 0.72 : 0.85) * 1.12 * (parseFloat(node.dataset.lensDepth) || 1); // how far the rim pulls the background, in px
    const url = buildMap(w, h, radiusOf(cs, w, h), bezel, depth);

    if (!lens) {
      const id = "lg" + ++uid;
      const f = el("filter", { id, x: "0", y: "0", width: "100%", height: "100%", "color-interpolation-filters": "sRGB" });
      const map = el("feImage", { result: "map", x: "0", y: "0", preserveAspectRatio: "none" });
      f.appendChild(map);
      // one displacement per colour channel, each a touch stronger or weaker, then recombined
      const chans = [["r", 1.0, "1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"],
                     ["g", 0.9, "0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0"],
                     ["b", 0.8, "0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0"]];
      const disp = chans.map(([c, k, mx]) => {
        const dm = el("feDisplacementMap", { in: "SourceGraphic", in2: "map", xChannelSelector: "R", yChannelSelector: "G", result: "d" + c });
        f.appendChild(dm);
        f.appendChild(el("feColorMatrix", { in: "d" + c, type: "matrix", values: mx, result: c }));
        return [dm, k];
      });
      f.appendChild(el("feBlend", { in: "r", in2: "g", mode: "screen", result: "rg" }));
      f.appendChild(el("feBlend", { in: "rg", in2: "b", mode: "screen" }));
      defs.appendChild(f);
      lens = { id, map, disp, w: 0, h: 0, depth: 0, boost: 1 };
      lenses.set(node, lens);
      node.style.setProperty("--lens", `url(#${id})`);
    }
    lens.w = w; lens.h = h;
    lens.map.setAttribute("width", w); lens.map.setAttribute("height", h);
    lens.map.setAttribute("href", url);
    lens.depth = depth;
    for (const [dm, k] of lens.disp) dm.setAttribute("scale", (2 * depth * k * lens.boost).toFixed(2));
  }

  boostImpl = (node, m) => {
    const lens = lenses.get(node);
    if (!lens || Math.abs(lens.boost - m) < 0.02) return;
    lens.boost = m;
    for (const [dm, k] of lens.disp) dm.setAttribute("scale", (2 * lens.depth * k * m).toFixed(2));
  };

  const ro = new ResizeObserver((entries) => entries.forEach((e) => build(e.target)));
  const watch = (node) => { if (!lenses.has(node) && !node.__lgw) { node.__lgw = true; ro.observe(node); } };
  const scan = (root) => {
    if (root.matches?.(".glass")) watch(root);
    root.querySelectorAll?.(".glass").forEach(watch);
  };
  scan(document);
  new MutationObserver((ms) => ms.forEach((m) => m.addedNodes.forEach((n) => n.nodeType === 1 && scan(n))))
    .observe(document.documentElement, { childList: true, subtree: true });
}

// Moving light: the rim highlight and the sheen drift with scroll, pointer and phone tilt, like light on real glass.
{
  const root = document.documentElement;
  let px = 0, sy = 0, tilt = 0, raf = 0, last = "";
  const paint = () => {
    raf = 0;
    const a = Math.round(135 + Math.max(-45, Math.min(45, sy * 0.05)) + px * 40 + tilt);
    const s = Math.round(18 + px * 34 + tilt * 0.8);
    const key = a + "|" + s;
    if (key === last) return;
    last = key;
    root.style.setProperty("--spec", a + "deg");
    root.style.setProperty("--sx", s + "%");
  };
  const kick = () => { if (!raf) raf = requestAnimationFrame(paint); };
  addEventListener("pointermove", (e) => { px = e.clientX / innerWidth - 0.5; kick(); }, { passive: true });
  document.addEventListener("scroll", (e) => { if (e.target && e.target.scrollTop !== undefined) { sy = e.target.scrollTop; kick(); } }, { capture: true, passive: true });
  addEventListener("deviceorientation", (e) => { if (e.gamma != null) { tilt = Math.max(-30, Math.min(30, e.gamma)) * 0.8; kick(); } }, { passive: true });
}

