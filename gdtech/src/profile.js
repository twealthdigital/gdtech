// Profile: only for signed in users. The user icon in the bar drops a liquid sheet up (profile, orders, customer care, sign out).
import "./profile.css";
import { currentUser, signOut } from "./auth.js";

const $ = (id) => document.getElementById(id);

// Put your real customer care details here. A button only shows when its value is filled in.
// whatsapp: digits only with country code, for example "2348012345678". phone: for example "+2348012345678".
const CARE = { whatsapp: "", phone: "" };

const user = currentUser();
if (!user) {
  // No valid account: back to the sign in screen
  signOut();
  location.replace("/");
} else {
  const pf = $("pf"), bd = $("pf-bd"), catcher = $("pf-catch");
  const first = user.name.trim().split(/\s+/)[0] || user.name;

  $("pf-av").textContent = (user.name.trim()[0] || "G");
  $("pf-name").textContent = user.name;
  $("pf-mail").textContent = user.email;
  $("pf-d-name").textContent = user.name;
  $("pf-d-mail").textContent = user.email;
  $("pf-d-phone").textContent = user.phone || "Not added";
  $("pf-d-since").textContent = new Date(user.created).toLocaleDateString(undefined, { month: "long", year: "numeric" });
  pf.setAttribute("aria-label", first + "'s account");

  if (CARE.whatsapp) { const a = $("pf-wa"); a.href = "https://wa.me/" + CARE.whatsapp.replace(/\D/g, ""); a.hidden = false; }
  if (CARE.phone) { const a = $("pf-tel"); a.href = "tel:" + CARE.phone; a.hidden = false; }
  if (CARE.whatsapp || CARE.phone) $("pf-care-note").textContent = "Questions about an order, a payment or a phone? Tap below and our team will help.";

  pf.inert = true;
  let isOpen = false;
  let last = "home";       // the tab the bar goes back to when the sheet closes

  function view(name) {
    pf.querySelectorAll(".pf-view").forEach((v) => { v.hidden = v.dataset.view !== name; });
  }

  function openSheet() {
    if (isOpen) return;
    isOpen = true;
    view("main");
    pf.inert = false;
    pf.setAttribute("aria-hidden", "false");
    bd.classList.add("open");
    catcher.classList.add("open");
    pf.classList.add("open");
  }

  // restore = true puts the bar's droplet back on the tab we came from
  function closeSheet(restore) {
    if (!isOpen) return;
    isOpen = false;
    pf.classList.remove("open");
    bd.classList.remove("open");
    catcher.classList.remove("open");
    pf.setAttribute("aria-hidden", "true");
    pf.inert = true;
    if (restore) document.dispatchEvent(new CustomEvent("dock:set", { detail: { tab: last, from: "profile" } }));
  }

  document.addEventListener("dock:go", (e) => {
    const tab = e.detail && e.detail.tab;
    if (tab === "me") { isOpen ? closeSheet(true) : openSheet(); return; }
    if (tab) last = tab;
    closeSheet(false);
  });
  document.addEventListener("dock:set", (e) => {
    const d = e.detail || {};
    if (d.from === "profile") return;
    if (d.tab && d.tab !== "me") last = d.tab;
  });

  catcher.addEventListener("click", () => closeSheet(true));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && isOpen) closeSheet(true); });

  pf.addEventListener("click", (e) => {
    const go = e.target.closest("[data-go]");
    if (go) { view(go.dataset.go); return; }
    if (e.target.closest("#pf-signout")) {
      closeSheet(false);
      setTimeout(() => { signOut(); location.replace("/#signin"); }, 380);
    }
  });
}
