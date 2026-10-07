// Shared code for the EOF student portal (login, student account, admin).
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut,
  sendPasswordResetEmail, createUserWithEmailAndPassword, setPersistence,
  browserLocalPersistence, inMemoryPersistence
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore, doc, getDoc, getDocs, setDoc, updateDoc, collection, query,
  orderBy, runTransaction, serverTimestamp, Timestamp, deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig } from "./eof-firebase-config.js";

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
setPersistence(auth, browserLocalPersistence).catch(() => {});

export {
  onAuthStateChanged, signInWithEmailAndPassword, signOut, sendPasswordResetEmail,
  doc, getDoc, getDocs, setDoc, updateDoc, collection, query, orderBy,
  serverTimestamp, Timestamp, deleteDoc
};

export const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const DAY_NAMES = { Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday", Thu: "Thursday", Fri: "Friday", Sat: "Saturday", Sun: "Sunday" };

export const configReady = !String(firebaseConfig.apiKey).startsWith("REPLACE");

export async function isAdmin(user) {
  if (!user) return false;
  try { return (await getDoc(doc(db, "admins", user.uid))).exists(); }
  catch { return false; }
}

// Wait for the first auth state, then resolve with the user (or null).
export function currentUser() {
  return new Promise(resolve => {
    const stop = onAuthStateChanged(auth, u => { stop(); resolve(u); });
  });
}

export function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// "2026-10-07" in the viewer's local time.
export function isoDate(d = new Date()) {
  const p = n => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function prettyDate(iso) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

export function dayKey(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return DAYS[(new Date(y, m - 1, d).getDay() + 6) % 7];
}

export function schedule(s) {
  const days = (s.lessonDays || []).map(d => DAY_NAMES[d] || d).join(", ");
  if (!days) return "Not set yet";
  return s.lessonTime ? `${days} · ${s.lessonTime}` : days;
}

export function friendlyError(e) {
  const code = (e && e.code) || "";
  const map = {
    "auth/invalid-credential": "Email or password is incorrect.",
    "auth/wrong-password": "Email or password is incorrect.",
    "auth/user-not-found": "Email or password is incorrect.",
    "auth/invalid-email": "Please enter a valid email address.",
    "auth/too-many-requests": "Too many attempts. Please wait a few minutes and try again.",
    "auth/email-already-in-use": "A student account with this email already exists.",
    "auth/network-request-failed": "No connection. Please check your internet and try again.",
    "permission-denied": "You don't have permission to do that."
  };
  return map[code] || (e && e.message) || "Something went wrong. Please try again.";
}

// Admin only: create a student login without signing the admin out.
// A temporary random password is set and never shown; the student receives an
// email to choose their own password.
export async function createStudentLogin(email) {
  const helper = initializeApp(firebaseConfig, "student-creator-" + Date.now());
  const helperAuth = getAuth(helper);
  await setPersistence(helperAuth, inMemoryPersistence);
  const tmp = crypto.getRandomValues(new Uint32Array(4)).join("-") + "Aa!";
  const cred = await createUserWithEmailAndPassword(helperAuth, email, tmp);
  const uid = cred.user.uid;
  await signOut(helperAuth);
  await sendPasswordResetEmail(auth, email);
  return uid;
}

// Next student number, e.g. EOF-26-0001 (two-digit registration year + running number).
export async function nextStudentNumber(regIso) {
  const yy = (regIso || isoDate()).slice(2, 4);
  const ref = doc(db, "counters", "students");
  const n = await runTransaction(db, async tx => {
    const snap = await tx.get(ref);
    const next = (snap.exists() ? snap.data().next : 1) || 1;
    tx.set(ref, { next: next + 1 }, { merge: true });
    return next;
  });
  return `EOF-${yy}-${String(n).padStart(4, "0")}`;
}

export function toast(msg, kind = "ok") {
  let t = document.getElementById("portalToast");
  if (!t) { t = document.createElement("div"); t.id = "portalToast"; document.body.appendChild(t); }
  t.className = "portal-toast show " + kind;
  t.textContent = msg;
  clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove("show"), 3200);
}
