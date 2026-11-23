import "./base.css";
import { isLow, isMid, isHigh, imgSrc } from "./perf.js";
import "./glass.js";
import "./style.css";
import { register, login } from "./auth.js";

const $ = (id) => document.getElementById(id);

const slides = [
  { title: "Every phone you want, in one place", text: "Browse the latest iPhones, Samsung flagships and top gadgets from a dealer you can trust." },
  { title: "Real gadgets, real prices", text: "Clear pricing, genuine devices and accessories that actually fit your phone." },
  { title: "Fast, simple and made for you", text: "Pick, pay and pick up or get it delivered. No stress, just clean tech." },
];

let index = 0;

const obVideo = $("ob-video");
const authHero = document.querySelector(".auth .hero");
const calmVideo = isLow || navigator.connection?.saveData || matchMedia("(prefers-reduced-motion: reduce)").matches;
if (obVideo && obVideo.dataset.poster) obVideo.poster = imgSrc(obVideo.dataset.poster);

function hydrateMediaFor(id) {
  if (id === "onboarding" && obVideo) {
    if (!calmVideo && obVideo.dataset.src && !obVideo.getAttribute("src")) {
      obVideo.src = obVideo.dataset.src;
    }
    if (!calmVideo) obVideo.play().catch(() => {});
  } else if (obVideo && !obVideo.paused) {
    obVideo.pause();
  }
  if (id === "auth" && authHero && authHero.dataset.src) {
    authHero.src = imgSrc(authHero.dataset.src);
    authHero.removeAttribute("data-src");
  }
}

function show(id) {
  hydrateMediaFor(id);
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
    if (authHero && authHero.dataset.src) {
      authHero.src = imgSrc(authHero.dataset.src);
      authHero.removeAttribute("data-src");
    }
    setTimeout(() => show("auth"), 850);
    setTimeout(() => {
      wave.classList.remove("grow");
      $("auth").classList.add("play");
      setTimeout(() => $("auth").classList.add("settled"), 1100);
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
if (location.hash === "#signin") {
  // Signed out: go straight to the sign in card, no splash or onboarding
  show("auth");
  $("auth").classList.add("play");
  setTimeout(() => $("auth").classList.add("settled"), 1100);
} else {
  setTimeout(() => show("onboarding"), 2400);
}

// Warm the cache for the home page while the user is still on onboarding and auth
const warm = isLow
  ? ["/home.html", "/lite/phones/banner-1.webp"]
  : isMid
    ? ["/home.html", "/lite/phones/banner-1.webp", "/lite/phones/banner-2.webp"]
    : ["/home.html", "/phones/banner-1.webp", "/phones/banner-2.webp", "/phones/banner-3.webp"];
setTimeout(() => warm.forEach((href) => {
  const l = document.createElement("link");
  l.rel = "prefetch";
  l.href = href;
  document.head.appendChild(l);
}), isLow ? 3400 : 2800);
if (isHigh && authHero && authHero.dataset.src) {
  setTimeout(() => {
    if (authHero.dataset.src) { authHero.src = authHero.dataset.src; authHero.removeAttribute("data-src"); }
  }, 1500);
}

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
      $("auth").classList.toggle("signup", up);
      document.querySelectorAll(".tab").forEach((x) => x.classList.toggle("on", x === t));
      $("auth-btn").querySelector(".lbl").textContent = up ? "Create account" : "Sign in";
    });
  });
});

// Sign in / sign up: validate, the button loads, then the phone rises, rings, then home
let signing = false;
const errEl = $("auth-err");
const val = (id) => $(id).value.trim();

function showError(msg) {
  rise(() => { errEl.textContent = msg; errEl.hidden = !msg; });
}
function busyOn(btn) {
  signing = true;
  btn.classList.add("loading");
  btn.disabled = true;
  $("google").disabled = true;
}
function busyOff(btn) {
  signing = false;
  btn.classList.remove("loading");
  btn.disabled = false;
  $("google").disabled = false;
}

async function submitAuth() {
  if (signing) return;
  const btn = $("auth-btn");
  const up = card.classList.contains("up");
  if (!errEl.hidden) showError("");

  let problem = "";
  if (up) {
    if (val("a-name").length < 2) problem = "Enter your full name.";
    else if (!/^\S+@\S+\.\S+$/.test(val("a-email"))) problem = "Enter a valid email address.";
    else if (val("a-phone").replace(/\D/g, "").length < 10) problem = "Enter a valid phone number.";
    else if ($("a-pw").value.length < 6) problem = "Your password needs at least 6 characters.";
    else if ($("a-pw").value !== $("a-pw2").value) problem = "The two passwords do not match.";
    else if (!$("a-agree").checked) problem = "Please agree to the Terms and Privacy Policy.";
  } else {
    if (!val("a-id")) problem = "Enter your email or phone number.";
    else if (!$("a-pw").value) problem = "Enter your password.";
  }
  if (problem) return showError(problem);

  busyOn(btn);
  const wait = new Promise((r) => setTimeout(r, 1200));
  const result = up
    ? await register({ name: val("a-name"), email: val("a-email"), phone: val("a-phone"), password: $("a-pw").value })
    : await login(val("a-id"), $("a-pw").value, $("a-remember").checked);
  await wait;
  if (!result.ok) { busyOff(btn); return showError(result.error); }
  busyOff(btn);
  signing = true;               // stays locked until the page changes
  playCall();
}

function playCall() {
  const call = $("call");
  call.classList.add("on");
  setTimeout(() => call.classList.add("rise"), 80);          // smooth lift to center
  setTimeout(() => {                                         // one ring + buzz
    call.classList.add("ringing");
    if (navigator.vibrate) navigator.vibrate([380]);
  }, 1100);
  // Swap to the home screen while the overlay is still solid,
  // so the sign in / sign up form is never seen again
  setTimeout(() => location.replace("/home.html"), 2300);
  setTimeout(() => call.classList.add("leave"), 2900);       // then fade away
  setTimeout(() => {
    call.classList.remove("on", "rise", "ringing", "leave");
  }, 3800);
}

$("auth-form").addEventListener("submit", (e) => { e.preventDefault(); submitAuth(); });
// Google needs a real backend, so for now it points people to email sign in
$("google").addEventListener("click", () => { if (!signing) showError("Google sign in is not set up yet. Please use your email and password."); });
// Switching between sign in and sign up clears any old message
document.querySelectorAll(".tab").forEach((t) => t.addEventListener("click", () => { if (!errEl.hidden) { errEl.hidden = true; errEl.textContent = ""; } }));

// Show or hide password
document.querySelectorAll(".eye").forEach((btn) => {
  btn.addEventListener("click", () => {
    const field = btn.parentElement.querySelector("input");
    const hidden = field.type === "password";
    field.type = hidden ? "text" : "password";
    btn.textContent = hidden ? "Hide" : "Show";
  });
});
