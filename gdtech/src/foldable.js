import { isLow, imgSrc } from "./perf.js";

// Galaxy Foldable video: nothing is downloaded until the card is near the screen, and it pauses when it leaves.
const card = document.getElementById("v-card");
const video = document.getElementById("v-video");

if (card && video) {
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches || navigator.connection?.saveData;
  let loaded = false;

  const ensurePoster = () => {
    if (video.dataset.poster) {
      video.poster = imgSrc(video.dataset.poster);
      video.removeAttribute("data-poster");
    }
  };
  const start = () => {
    ensurePoster();
    if (isLow || calm) return;
    if (!loaded) {
      video.src = video.dataset.src;
      loaded = true;
    }
    video.play().catch(() => {});
  };

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) start();
        else video.pause();
        if (!isLow && !calm) card.classList.toggle("on", e.isIntersecting);
      },
      { rootMargin: isLow ? "220px 0px" : "260px 0px" }
    ).observe(card);
  } else {
    ensurePoster();
  }
}
