import "./style.css";

const $ = (id) => document.getElementById(id);

const slides = [
  { title: "Every phone you want, in one place", text: "Browse the latest iPhones, Samsung flagships and top gadgets from a dealer you can trust." },
  { title: "Real gadgets, real prices", text: "Clear pricing, genuine devices and accessories that actually fit your phone." },
  { title: "Fast, simple and made for you", text: "Pick, pay and pick up or get it delivered. No stress, just clean tech." },
];

let index = 0;

function show(id) {
  document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
  $(id).classList.add("active");

  // Page background follows the screen so the safe areas blend in
  // Auth: white on top (header and status bar), orange underneath
  const bg = id === "auth" ? "linear-gradient(#ffffff 46%, #ff7a1a 46%)" : "#ffffff";
  document.documentElement.style.background = bg;
  document.body.style.background = "transparent";
}

function render() {
  const copy = document.querySelector(".copy");
  $("ob-title").textContent = slides[index].title;
  $("ob-text").textContent = slides[index].text;
  copy.classList.remove("swap");
  void copy.offsetWidth;
  copy.classList.add("swap");

  $("dots").innerHTML = slides.map((_, i) => `<i class="${i === index ? "on" : ""}"></i>`).join("");
  $("back").classList.toggle("hide", index === 0);
  $("next").textContent = index === slides.length - 1 ? "Get Started" : "Continue";
}

const wave = $("wave");
let busy = false;

function waveTo(id, originEl) {
  if (busy) return;
  busy = true;
  const o = originEl.getBoundingClientRect();
  const app = $("app").getBoundingClientRect();
  wave.style.setProperty("--x", `${o.left - app.left + o.width / 2}px`);
  wave.style.setProperty("--y", `${o.top - app.top + o.height / 2}px`);

  wave.classList.add("grow");
  if (id === "auth") {
    setTimeout(() => show("auth"), 850);
    setTimeout(() => {
      wave.classList.remove("grow");
      $("auth").classList.add("play");
      busy = false;
    }, 1500);
    return;
  }
  setTimeout(() => show(id), 850);
  setTimeout(() => wave.classList.add("lift"), 1000);
  setTimeout(() => {
    wave.classList.remove("grow", "lift");
    busy = false;
  }, 1900);
}

$("next").addEventListener("click", (e) => {
  if (index < slides.length - 1) { index++; render(); }
  else waveTo("auth", e.currentTarget);
});
$("back").addEventListener("click", () => { if (index > 0) { index--; render(); } });
$("skip").addEventListener("click", (e) => waveTo("auth", e.currentTarget));

// If the video file is missing, hide it so the orange fallback shows
$("ob-video").addEventListener("error", (e) => (e.target.style.display = "none"));

render();
setTimeout(() => show("onboarding"), 2400);

// Auth
const card = document.querySelector(".card");
// Card grows upward when its content gets taller
function rise(change) {
  const from = card.offsetHeight;
  change();
  const to = card.offsetHeight;
  card.style.overflow = "hidden";
  card.style.transition = "height 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)";
  card.style.height = from + "px";
  void card.offsetHeight;
  card.style.height = to + "px";
  setTimeout(() => {
    card.style.height = "";
    card.style.transition = "";
    card.style.overflow = "";
  }, 520);
}

document.querySelectorAll(".tab").forEach((t) => {
  t.addEventListener("click", () => {
    const up = t.dataset.t === "up";
    if (card.classList.contains("up") === up) return;
    rise(() => {
      card.classList.toggle("up", up);
      document.querySelectorAll(".tab").forEach((x) => x.classList.toggle("on", x === t));
      $("auth-btn").textContent = up ? "Create account" : "Sign in";
    });
  });
});
$("auth-form").addEventListener("submit", (e) => { e.preventDefault(); show("welcome"); });
$("guest").addEventListener("click", () => show("welcome"));
$("google").addEventListener("click", () => show("welcome"));

// Show or hide password
document.querySelectorAll(".eye").forEach((btn) => {
  btn.addEventListener("click", () => {
    const field = btn.parentElement.querySelector("input");
    const hidden = field.type === "password";
    field.type = hidden ? "text" : "password";
    btn.textContent = hidden ? "Hide" : "Show";
  });
});
