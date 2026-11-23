// Pure helpers for shop hero geometry and category/brand dropdown state.

export const BASES = [1, 0.88, 0.78, 0.7, 0.62];

export function heroGeomCalc({ keys, single, width, height, images, cat }) {
  const W = width || 335;
  const H = height || 176;
  const isWideCat = cat === "laptops" || cat === "tablets";
  const O = isWideCat && !single ? 0.64 : 0.42;
  const budget = (isWideCat ? 0.72 : 0.62) * W;
  const right0 = (isWideCat ? -0.09 : -0.02) * W;
  const bottom = isWideCat
    ? (single ? 0.01 : 0) * H
    : (single ? -0.08 : -0.06) * H;

  const items = keys.map((k, j) => {
    const h = H * (single ? (isWideCat ? 1.2 : 1.12) : BASES[j]);
    const meta = images[k] || { w: 600, h: 760 };
    return { k, h, w: (h * meta.w) / meta.h };
  });

  if (!items.length) return [];

  let span = items[0].w;
  for (let j = 1; j < items.length; j++) span += items[j].w * (1 - O);
  const s = Math.min(1, budget / span);

  let prev = null;
  items.forEach((it, j) => {
    it.h *= s;
    it.w *= s;
    it.right = prev ? prev.right + prev.w - O * it.w : right0;
    it.bottom = bottom;
    it.z = 10 - j;
    prev = it;
  });
  return items;
}

export function reduceShopFilter(state, action) {
  switch (action.type) {
    case "pick-cat": {
      const catId = action.catId || null;
      if (!catId) return { cat: null, group: null, dropOpen: false };
      if (catId !== state.cat) return { cat: catId, group: null, dropOpen: false };
      return { ...state, dropOpen: !state.dropOpen };
    }
    case "pick-brand":
      return { cat: state.cat, group: action.brand || null, dropOpen: false };
    case "close-drop":
      return state.dropOpen ? { ...state, dropOpen: false } : state;
    case "search":
      return { cat: null, group: null, dropOpen: false };
    default:
      return state;
  }
}

export function hasDropdownArrow(isGeneral, catId, activeCat) {
  return Boolean(isGeneral && catId && catId === activeCat);
}

export function chipLabelFor(catId, activeCat, activeGroup, catLabel, brandTitle) {
  if (catId && catId === activeCat && activeGroup && brandTitle) return brandTitle;
  return catLabel;
}

export function dropOptionIndexForY(tops, rowHeight, localY) {
  if (!tops || !tops.length) return -1;
  const h = rowHeight || 42;
  let best = 0;
  let bestDist = Infinity;
  for (let i = 0; i < tops.length; i++) {
    const center = tops[i] + h / 2;
    const d = Math.abs(localY - center);
    if (d < bestDist) {
      bestDist = d;
      best = i;
    }
  }
  return best;
}
