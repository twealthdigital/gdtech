// Adaptive device capability engine.
// Detects RAM, CPU cores, network constraints, GPU tier, and a 2ms CPU micro-benchmark
// once per session, grading the device into "low" (2GB RAM / budget), "mid", or "high".

const KEY = "gd.perf";
const PROBED_KEY = "gd.perf.probed";
const VALID = new Set(["low", "mid", "high"]);

function readOverride() {
  try {
    const p = new URLSearchParams(location.search).get("perf");
    if (VALID.has(p)) {
      sessionStorage.setItem(KEY, p);
      sessionStorage.setItem(PROBED_KEY, "override");
      return p;
    }
    if (p === "auto") {
      sessionStorage.removeItem(KEY);
      sessionStorage.removeItem(PROBED_KEY);
    }
  } catch { /* ignore */ }
  return null;
}

function gpuTier() {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    const gl = canvas.getContext("webgl", { powerPreference: "low-power", antialias: false, depth: false, stencil: false });
    if (!gl) return "low";
    let renderer = "";
    const dbg = gl.getExtension("WEBGL_debug_renderer_info");
    if (dbg) renderer = String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) || "");
    const maxTex = gl.getParameter(gl.MAX_TEXTURE_SIZE) || 0;
    gl.getExtension("WEBGL_lose_context")?.loseContext();

    if (/SwiftShader|llvmpipe|Software|Mali-4\d\d|Mali-T[678]\d\d|Mali-G31|Mali-G52|PowerVR.*GE8|PowerVR Rogue|Adreno \(TM\) [234]\d\d|Adreno \(TM\) 50[4568]|Adreno \(TM\) 610|Apple A[789] GPU|Apple A10 GPU/i.test(renderer)) {
      return "low";
    }
    if (maxTex > 0 && maxTex <= 4096) return "low";
    if (/Mali-G57|Mali-G68|Mali-G72|Mali-G76|Adreno \(TM\) 51\d|Adreno \(TM\) 61[25689]|Adreno \(TM\) 620|Apple A11|Apple A12/i.test(renderer)) {
      return "mid";
    }
  } catch {
    return "mid";
  }
  return "high";
}

function cpuProbe() {
  try {
    const t0 = performance.now();
    let acc = 0;
    for (let i = 1; i <= 45000; i++) acc = (acc + (i * 2654435761)) | 0;
    const dt = performance.now() - t0;
    void acc;
    if (dt > 5.5) return "low";
    if (dt > 2.4) return "mid";
  } catch { /* ignore */ }
  return "high";
}

function detectTier() {
  const override = readOverride();
  if (override) return override;

  try {
    const probed = sessionStorage.getItem(PROBED_KEY);
    const cached = sessionStorage.getItem(KEY);
    if (probed && VALID.has(cached)) return cached;
  } catch { /* ignore */ }

  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const ram = navigator.deviceMemory;
  const cores = navigator.hardwareConcurrency;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  let tier = "high";
  if (
    reduced ||
    (conn && (conn.saveData || conn.effectiveType === "slow-2g" || conn.effectiveType === "2g")) ||
    (typeof ram === "number" && ram <= 2) ||
    (typeof cores === "number" && cores <= 2)
  ) {
    tier = "low";
  } else {
    const gpu = gpuTier();
    const cpu = cpuProbe();
    const rank = { low: 0, mid: 1, high: 2 };
    let score = 2;

    if (typeof ram === "number" && ram <= 4) score = Math.min(score, 1);
    if (typeof cores === "number" && cores <= 4) score = Math.min(score, typeof ram === "number" && ram <= 4 ? 0 : 1);
    if (conn && conn.effectiveType === "3g") score = Math.min(score, 1);
    score = Math.min(score, rank[gpu], rank[cpu]);

    // iOS Safari hides deviceMemory & cores; low DPR + slow probe catches older 2GB iPhones
    if (ram == null && /iPhone|iPad|iPod/i.test(navigator.userAgent) && (window.devicePixelRatio || 1) <= 2 && cpu !== "high") {
      score = Math.min(score, 0);
    }

    tier = score === 0 ? "low" : score === 1 ? "mid" : "high";
  }

  try {
    sessionStorage.setItem(KEY, tier);
    sessionStorage.setItem(PROBED_KEY, "1");
  } catch { /* ignore */ }

  return tier;
}

export const perfTier = detectTier();
export const isLow = perfTier === "low";
export const isMid = perfTier === "mid";
export const isHigh = perfTier === "high";

const root = document.documentElement;
root.classList.remove("perf-low", "perf-mid", "perf-high");
root.classList.add("perf-" + perfTier);
root.dataset.perf = perfTier;

// Resolve optimal image path for the detected device tier.
// Low-tier (2GB RAM) always uses scaled /lite/*.webp; mid uses /lite/ for grids & cards.
export function imgSrc(src, { fullOnMid = false } = {}) {
  if (!src || typeof src !== "string") return src;
  if (!src.startsWith("/") || src.startsWith("/lite/") || !src.endsWith(".webp")) return src;
  if (perfTier === "low") return "/lite" + src;
  if (perfTier === "mid" && !fullOnMid) return "/lite" + src;
  return src;
}

const observers = new WeakMap();

function loadImg(img) {
  const ds = img.dataset.src;
  if (!ds) return;
  const fullOnMid = img.dataset.fullMid === "1";
  if (isLow) img.fetchPriority = "low";
  img.decoding = "async";
  img.src = imgSrc(ds, { fullOnMid });
  img.removeAttribute("data-src");
}

// Lazy-loads any <img data-src="..."> inside container relative to scrollRoot.
export function observeLazyImages(scrollRoot, container = scrollRoot) {
  if (!container) return;
  const imgs = container.querySelectorAll("img[data-src]");
  if (!imgs.length) return;

  if (isHigh || !("IntersectionObserver" in window)) {
    imgs.forEach(loadImg);
    return;
  }

  let io = observers.get(scrollRoot || document);
  if (!io) {
    io = new IntersectionObserver(
      (entries) => {
        for (const en of entries) {
          if (!en.isIntersecting) continue;
          loadImg(en.target);
          io.unobserve(en.target);
        }
      },
      {
        root: scrollRoot || null,
        rootMargin: isLow ? "140px 220px" : "260px 320px",
        threshold: 0.01,
      }
    );
    observers.set(scrollRoot || document, io);
  }
  imgs.forEach((im) => io.observe(im));
}

export function hydrateAllImages(container) {
  if (!container) return;
  container.querySelectorAll("img[data-src]").forEach(loadImg);
}
