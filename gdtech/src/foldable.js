// Galaxy Foldable video: nothing is downloaded until the card is near the screen, and it pauses when it leaves.
const card = document.getElementById("v-card");
const video = document.getElementById("v-video");

if (card && video) {
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches || navigator.connection?.saveData;
  let loaded = false;

  const start = () => {
    if (!loaded) {
      video.src = video.dataset.src;
      loaded = true;
    }
    video.play().catch(() => {});
  };

  if (!calm && "IntersectionObserver" in window) {
    new IntersectionObserver(
      ([e]) => {
        card.classList.toggle("on", e.isIntersecting);
        if (e.isIntersecting) start();
        else video.pause();
      },
      { rootMargin: "240px 0px" }
    ).observe(card);
  }
}
