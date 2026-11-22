// Adaptive Liquid Glass renderer shared by every page.
// Keep the full effect on capable devices and avoid SVG refraction on weaker phones.
const root = document.documentElement;
const ua = navigator.userAgent || "";
const platform = navigator.userAgentData?.platform || navigator.platform || "";
const isAndroid = /Android/i.test(ua + " " + platform);
const memory = Number(navigator.deviceMemory) || 0;
const cores = Number(navigator.hardwareConcurrency) || 0;

let quality = "full";

if (isAndroid) {
  if ((memory > 0 && memory <= 3) || (cores > 0 && cores <= 4)) {
    quality = "lite";
  } else if ((!memory && !cores) || (memory > 0 && memory <= 4) || (cores > 0 && cores <= 6)) {
    quality = "balanced";
  }
} else if ((memory > 0 && memory <= 2) || (cores > 0 && cores <= 2)) {
  quality = "lite";
} else if ((memory > 0 && memory <= 4) || (cores > 0 && cores <= 4)) {
  quality = "balanced";
}

root.classList.add(`lg-${quality}`);

const isChromium =
  navigator.userAgentData?.brands?.some((brand) => /Chromium/i.test(brand.brand)) ||
  /Chrome|Chromium|CriOS|Edg\//i.test(ua);

// SVG displacement is the most expensive part of this effect.
// Only create and enable it on higher-capability Chromium devices.
if (quality === "full" && isChromium) {
  if (!document.getElementById("lg")) {
    document.body.insertAdjacentHTML(
      "afterbegin",
      '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><filter id="lg" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="0.011 0.02" numOctaves="2" seed="4" result="n"/><feGaussianBlur in="n" stdDeviation="2.5" result="nb"/><feDisplacementMap in="SourceGraphic" in2="nb" scale="26" xChannelSelector="R" yChannelSelector="G"/></filter></svg>'
    );
  }
  root.classList.add("lg-refract");
}
