// Shared by every page: refraction filter plus the Chromium check
if (!document.getElementById("lg")) {
  document.body.insertAdjacentHTML("afterbegin",
    '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><filter id="lg" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="0.011 0.02" numOctaves="2" seed="4" result="n"/><feGaussianBlur in="n" stdDeviation="2.5" result="nb"/><feDisplacementMap in="SourceGraphic" in2="nb" scale="26" xChannelSelector="R" yChannelSelector="G"/></filter></svg>');
}
// Only Chromium can bend the backdrop with an SVG filter; everything else keeps the blur glass
if (navigator.userAgentData?.brands?.some((b) => /Chromium/.test(b.brand))) document.documentElement.classList.add("lg-refract");
