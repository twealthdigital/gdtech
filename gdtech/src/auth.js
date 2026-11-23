// Frontend only sign in. Accounts live in this browser (localStorage), so this is a stand in until a real backend exists.
// When the backend arrives, keep these function names and swap what is inside them for real requests.
const USERS = "gd.users";
const SESSION = "gd.session";

const read = () => { try { return JSON.parse(localStorage.getItem(USERS)) || []; } catch { return []; } };
const write = (list) => localStorage.setItem(USERS, JSON.stringify(list));
const digits = (s) => String(s || "").replace(/\D/g, "").slice(-10);
const same = (u, id) => {
  const v = String(id || "").trim().toLowerCase();
  return u.email === v || (digits(v).length >= 7 && digits(u.phone) === digits(v));
};

async function hash(text) {
  try {
    if (crypto && crypto.subtle) {
      const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("gdtech:" + text));
      return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
    }
  } catch { /* fall through */ }
  return "x" + btoa(unescape(encodeURIComponent("gdtech:" + text)));
}

function begin(id, remember) {
  localStorage.removeItem(SESSION); sessionStorage.removeItem(SESSION);
  (remember ? localStorage : sessionStorage).setItem(SESSION, id);
}

export function currentUser() {
  try {
    const id = localStorage.getItem(SESSION) || sessionStorage.getItem(SESSION);
    return (id && read().find((u) => u.id === id)) || null;
  } catch { return null; }
}

export async function register({ name, email, phone, password }) {
  const list = read();
  const mail = email.trim().toLowerCase();
  if (list.some((u) => u.email === mail)) return { ok: false, error: "An account with this email already exists. Try signing in." };
  if (digits(phone) && list.some((u) => digits(u.phone) === digits(phone))) return { ok: false, error: "An account with this phone number already exists. Try signing in." };
  const user = { id: "u" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), name: name.trim(), email: mail, phone: phone.trim(), pass: await hash(password), created: Date.now() };
  list.push(user);
  write(list);
  begin(user.id, true);
  return { ok: true, user };
}

export async function login(identifier, password, remember = true) {
  const user = read().find((u) => same(u, identifier));
  if (!user) return { ok: false, error: "We could not find an account with that email or phone number." };
  if (user.pass !== (await hash(password))) return { ok: false, error: "That password is not right. Try again." };
  begin(user.id, remember);
  return { ok: true, user };
}

export function signOut() {
  localStorage.removeItem(SESSION);
  sessionStorage.removeItem(SESSION);
}
