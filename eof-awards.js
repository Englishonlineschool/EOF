// Freedom Points, Passport/Unit stamps, teacher badges, feed (notifications) and the bell.
// Shared by eof-admin.html (staff), eof-account.html (student) and eof-bell.js (website header).
// Everything runs in the browser against Firestore (Spark plan — no server code).
import { db, doc, getDoc, getDocs, setDoc, updateDoc, collection, query, where, serverTimestamp, esc, prettyDate, isoDate, DAYS, DAY_NAMES } from "./eof-portal.js?v=6";
import { PASSPORT_LEVELS, PASSPORT_LEVEL_LABELS, SCHOOL_UNITS, unitTestBand } from "./eof-curriculum.js?v=1";

// ---------- Programmes ----------
export const PROGRAMMES = {
  speaking: { label: "Speaking (1:1)", desc: "Badges, feedback and results. No Stop or Unit grid." },
  school: { label: "School — English Ahead (Units)", desc: "Unit grid with stamps, Vocabulary Pack, Progress Check /30 and Unit Test /50." },
  full: { label: "Full course — design pending", desc: "Badges, feedback and results for now. The course design will be added later." },
  passport: { label: "Passport to English", desc: "12 Stops + Speaking Studio with Passport Stamps, Freedom Phrases, Mid-Course Test and Final Exam." }
};
const fold = v => String(v || "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ı/g, "i").toLowerCase().replace(/\s+/g, " ").trim();
// Owner's list (24 Oct 2026): Azra Boz and Nazife Yurtseven → School; Zeynep Esra → Full course; everyone else → Speaking.
export function suggestedProgramme(s) {
  const n = fold(s?.name);
  if (/\bazra\b.*\bboz\b/.test(n) || /\bnazife\b.*\byurtseven\b/.test(n)) return "school";
  if (/\bzeynep\b.*\besra\b/.test(n)) return "full";
  return "speaking";
}
export const programmeOf = (s, progress) => (progress && PROGRAMMES[progress.programme] ? progress.programme : suggestedProgramme(s));
export const unitsOf = progress => (progress?.units && progress.units.length ? progress.units : SCHOOL_UNITS);
export const passportLevelOf = (s, progress) => {
  if (progress?.passportLevel && PASSPORT_LEVELS[progress.passportLevel]) return progress.passportLevel;
  const biz = /business/i.test(s?.course || ""), lv = String(s?.level || "").toUpperCase();
  const key = (biz ? "BIZ-" : "GE-") + (["A1", "A2", "B1", "B2", "C1", "C2"].includes(lv) ? lv : biz ? "B1" : "A1");
  return PASSPORT_LEVELS[key] ? key : biz ? "BIZ-B1" : "GE-A1";
};
export { PASSPORT_LEVELS, PASSPORT_LEVEL_LABELS };

// ---------- Badges, stamps, ranks ----------
export const BADGES = [
  { id: "brave", name: "Brave Speaker", icon: "🎤" },
  { id: "fluent", name: "Fluent Flow", icon: "🌊" },
  { id: "question", name: "Great Question", icon: "💡" },
  { id: "homework", name: "Homework Hero", icon: "📚" },
  { id: "improved", name: "Most Improved", icon: "🚀" },
  { id: "writer", name: "Clear Writer", icon: "✍️" },
  { id: "words", name: "Word Collector", icon: "🧩" },
  { id: "exam", name: "Exam Ready", icon: "🎯" },
  { id: "helping", name: "Helping Hand", icon: "🤝", groups: true }
];
export const BADGE = Object.fromEntries(BADGES.map(b => [b.id, b]));
export const STAMPS = {
  yes: { label: "Yes", pts: 10, cls: "yes", note: "I can do this" },
  almost: { label: "Almost", pts: 5, cls: "almost", note: "Nearly there" },
  notyet: { label: "Not Yet", pts: 0, cls: "notyet", note: "Keep going" }
};
export const POINTS = { award: 5, phrase: 2, vocab: 2, checkpoint: 10, studio: 10, progressCheck: 10, cleanMonth: 10, complete: 50, exitMax: 3 };
export const RANKS = [
  { name: "Explorer", min: 0, icon: "🧭" }, { name: "Navigator", min: 100, icon: "🗺️" }, { name: "Voyager", min: 250, icon: "⛵" },
  { name: "Globetrotter", min: 500, icon: "✈️" }, { name: "Ambassador", min: 1000, icon: "🌍" }
];
export function rankOf(total) {
  let i = 0; RANKS.forEach((r, j) => { if (total >= r.min) i = j; });
  const next = RANKS[i + 1] || null;
  return { ...RANKS[i], index: i, next, toNext: next ? next.min - total : 0, pct: next ? Math.round((total - RANKS[i].min) / (next.min - RANKS[i].min) * 100) : 100 };
}

// ---------- Result presets ----------
export const PRESETS = {
  pc: { label: "Progress Check /30", type: "Progress Check", max: 30, programme: "school", formative: true },
  ut: { label: "Unit Test /50", type: "Unit Test", max: 50, programme: "school" },
  mid: { label: "Mid-Course Test /54", type: "Mid-Course Test", max: 54, programme: "passport" },
  final: { label: "Final Exam", type: "Final exam", max: null, programme: "passport" }
};
// Points for a saved result (Progress Check 10 for completing; Unit Test 1 per mark; Mid ÷54×50; Final ÷total×100)
export function resultPoints(r) {
  const v = Number(r?.overall); if (!r?.preset || !(v >= 0)) return 0;
  if (r.preset === "pc") return POINTS.progressCheck;
  if (r.preset === "ut") return Math.round(Math.min(v, r.max || 50) / (r.max || 50) * 50);
  if (r.preset === "mid") return Math.round(Math.min(v, r.max || 54) / (r.max || 54) * 50);
  if (r.preset === "final") return Math.round(Math.min(v, r.max || 85) / (r.max || 85) * 100);
  return 0;
}
export { unitTestBand };

const tsDate = x => x && x.toDate ? isoDate(x.toDate()) : (typeof x === "string" ? x.slice(0, 10) : "");
export const itemDate = it => it?.date || tsDate(it?.at) || "";
const lastDay = ym => { const [y, m] = ym.split("-").map(Number); return isoDate(new Date(y, m, 0)); };

// All Freedom Points events for one student, newest first.
// progress = students/{sid}/progress/main, feed = feed items, results = results docs, attendance = {date: {status}}
export function pointsEvents({ s, progress, feed = [], results = [], attendance = {}, today = isoDate() }) {
  const ev = [], add = (date, pts, label, kind) => { if (pts > 0) ev.push({ date: date || "", pts, label, kind }); };
  const p = progress || {}, st = p.stamps || {};
  const level = passportLevelOf(s, p), stops = PASSPORT_LEVELS[level]?.stops || [];
  const units = unitsOf(p);
  const nameOfKey = k => units.find(u => u.id === k)?.name || (stops.find(x => x.n === k) ? (k === "SS" ? "Speaking Studio" : `Stop ${k} · ${stops.find(x => x.n === k).name}`) : k);
  Object.entries(st).forEach(([k, e]) => {
    if (!e) return;
    if (k === "SS") { if (e.stamp) add(e.date, POINTS.studio, "Speaking Studio completed", "studio"); }
    else if (e.stamp && STAMPS[e.stamp]) add(e.date, STAMPS[e.stamp].pts, `${STAMPS[e.stamp].label} stamp · ${nameOfKey(k)}`, "stamp");
    if (e.phrase) add(e.phraseDate || e.date, POINTS.phrase, `Freedom Phrase · ${nameOfKey(k)}`, "phrase");
    if (e.vocab) add(e.vocabDate || e.date, POINTS.vocab, `Vocabulary Pack · ${nameOfKey(k)}`, "vocab");
  });
  if (p.checkpoint?.done) add(p.checkpoint.date, POINTS.checkpoint, "Progress Checkpoint 1", "checkpoint");
  Object.values(p.exits || {}).forEach(x => add(x.date, Math.min(POINTS.exitMax, Math.max(0, +x.correct || 0)), "Exit Ticket", "exit"));
  results.forEach(r => { const pts = resultPoints(r); add(r.date, pts, `${r.type}${r.title ? " · " + r.title : ""}`, "result"); });
  feed.filter(f => f.type === "award").forEach(f => add(itemDate(f), POINTS.award, `${BADGE[f.badge]?.name || "Badge"} badge`, "award"));
  // Full month with no absences (finished months only)
  const months = {};
  Object.entries(attendance || {}).forEach(([d, x]) => { const m = d.slice(0, 7), o = months[m] || (months[m] = { p: 0, a: 0 }); x?.status === "present" ? o.p++ : x?.status === "absent" ? o.a++ : 0; });
  Object.entries(months).forEach(([m, o]) => { if (m < today.slice(0, 7) && o.p && !o.a) add(lastDay(m), POINTS.cleanMonth, `Full month, no absences (${new Date(m + "-01T00:00:00").toLocaleDateString("en-GB", { month: "long", year: "numeric" })})`, "month"); });
  // Set complete
  const c = completion({ s, progress: p, results });
  if (c.school.done) add(c.school.date, POINTS.complete, "All units complete", "complete");
  if (c.passport.done) add(c.passport.date, POINTS.complete, "Passport complete — certificate unlocked", "complete");
  return ev.sort((a, b) => String(b.date).localeCompare(String(a.date)));
}
export function pointsTotal(args) { return pointsEvents(args).reduce((t, e) => t + e.pts, 0); }

// School: every unit stamped Yes/Almost with Vocabulary Pack, Progress Check and Unit Test.
// Passport: all 12 Stops stamped Yes/Almost + Speaking Studio + Final Exam → certificate.
export function completion({ s, progress, results = [] }) {
  const p = progress || {}, st = p.stamps || {}, okStamp = k => st[k] && (st[k].stamp === "yes" || st[k].stamp === "almost");
  const units = unitsOf(p);
  const unitDone = u => okStamp(u.id) && st[u.id].vocab && results.some(r => r.preset === "pc" && r.unit === u.id) && results.some(r => r.preset === "ut" && r.unit === u.id);
  const schoolDone = units.length >= 5 && units.every(unitDone);
  const dates = [...Object.values(st).map(e => e?.date || ""), ...results.map(r => r.date || "")].sort();
  const level = passportLevelOf(s, p), stops = (PASSPORT_LEVELS[level]?.stops || []).filter(x => x.n !== "SS");
  const fin = results.find(r => r.preset === "final");
  const passDone = stops.length === 12 && stops.every(x => okStamp(x.n)) && !!st.SS?.stamp && !!fin;
  return { school: { done: schoolDone, date: dates[dates.length - 1] || "", unitDone }, passport: { done: passDone, date: fin?.date || "", stampsOk: stops.filter(x => okStamp(x.n)).length } };
}

// ---------- Feed (notifications) ----------
export const feedCol = sid => collection(db, "students", sid, "feed");
export const isDenied = e => /permission|insufficient/i.test(String(e?.code || "") + " " + String(e?.message || ""));
export async function loadFeed(sid) {
  const snap = await getDocs(feedCol(sid));
  return snap.docs.map(d => ({ id: d.id, ...d.data() })).sort(byNewest);
}
export const atMs = it => it?.at?.toMillis ? it.at.toMillis() : it?.at?.seconds ? it.at.seconds * 1000 : (itemDate(it) ? Date.parse(itemDate(it) + "T12:00:00") : Date.now());
export const byNewest = (a, b) => atMs(b) - atMs(a);
// Staff → student item (type stamp | award | result | comment | milestone)
export async function postFeed(s, item, author) {
  const ref = doc(feedCol(s.uid));
  const data = {
    type: item.type, title: item.title || "", body: item.body || "", points: item.points || 0,
    badge: item.badge || null, unit: item.unit || null, stop: item.stop || null, ref: item.ref || null, replyTo: item.replyTo || null,
    date: item.date || isoDate(), teacher: s.teacher || "", sid: s.uid, studentName: s.name || "",
    by: author.email || "", byName: author.name || "", byRole: author.role || "teacher",
    at: serverTimestamp(), readByStudent: false, readByTeacher: true
  };
  await setDoc(ref, data);
  return { id: ref.id, ...data, at: { toMillis: () => Date.now() } };
}
// Student → teacher reply (≤500 characters)
export async function postReply(s, parent, body, user) {
  const ref = doc(feedCol(s.uid));
  const data = {
    type: "reply", title: parent ? `Re: ${parent.title || typeLabel(parent)}` : "Message", body: String(body).slice(0, 500), points: 0,
    replyTo: parent?.id || null, date: isoDate(), teacher: s.teacher || "", sid: s.uid, studentName: s.name || "",
    by: user?.email || "", byName: s.name || "", byRole: "student",
    at: serverTimestamp(), readByStudent: true, readByTeacher: false
  };
  await setDoc(ref, data);
  return { id: ref.id, ...data, at: { toMillis: () => Date.now() } };
}
export async function markRead(sid, items, field) {
  await Promise.all(items.filter(x => x[field] === false).map(x => updateDoc(doc(db, "students", sid, "feed", x.id), { [field]: true }).then(() => { x[field] = true; })));
}

export const typeLabel = it => ({ stamp: "Stamp", award: "Badge", result: "Result", comment: "Feedback", reply: "Reply", milestone: "Milestone" }[it.type] || "Update");
const typeIcon = it => it.type === "award" ? (BADGE[it.badge]?.icon || "🏅") : ({ stamp: "🛂", result: "📝", comment: "💬", reply: "↩️", milestone: "🏆" }[it.type] || "🔔");
export function when(it) {
  const ms = atMs(it), d = Date.now() - ms;
  if (d < 60e3) return "just now";
  if (d < 3600e3) return Math.round(d / 60e3) + " min ago";
  if (d < 86400e3) return Math.round(d / 3600e3) + " h ago";
  return new Date(ms).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: new Date(ms).getFullYear() === new Date().getFullYear() ? undefined : "numeric" });
}
// One feed item as HTML. opts.canReply (student), opts.replies (array of reply items), opts.staff (shows unread markers for replies)
export function feedItemHtml(it, opts = {}) {
  const pts = it.points > 0 ? `<span class="fd-pts">+${it.points}</span>` : "";
  const who = it.byRole === "student" ? (opts.staff ? esc(it.studentName || it.byName || "Student") : "You") : esc(it.byName || "Your teacher");
  const replies = (opts.replies || []).map(r => `<div class="fd-reply${opts.staff && r.readByTeacher === false ? " unread" : ""}"><b>${r.byRole === "student" ? (opts.staff ? esc(r.studentName || "Student") : "You") : esc(r.byName || "Teacher")}</b> <span class="fd-when">${esc(when(r))}</span><p>${esc(r.body)}</p></div>`).join("");
  const unread = opts.staff ? it.type === "reply" && it.readByTeacher === false : it.readByStudent === false;
  return `<div class="fd-item fd-${esc(it.type)}${unread ? " unread" : ""}" data-fid="${esc(it.id)}">
    <div class="fd-icon" aria-hidden="true">${typeIcon(it)}</div>
    <div class="fd-main">
      <div class="fd-top"><b>${esc(it.title || typeLabel(it))}</b>${pts}</div>
      ${it.body ? `<p class="fd-body">${esc(it.body)}</p>` : ""}
      <div class="fd-meta">${esc(typeLabel(it))} · ${who} · ${esc(when(it))}${opts.staff && opts.showStudent && it.studentName ? ` · <b>${esc(it.studentName)}</b>` : ""}</div>
      ${replies ? `<div class="fd-replies">${replies}</div>` : ""}
      ${opts.canReply && it.type !== "reply" ? `<button type="button" class="linkbtn fd-reply-btn" data-reply="${esc(it.id)}">Reply</button>` : ""}
      ${opts.staffReply && it.type === "reply" ? `<button type="button" class="linkbtn fd-reply-btn" data-answer="${esc(it.id)}">Answer</button>` : ""}
      ${opts.actions || ""}
    </div></div>`;
}
// Thread items: top-level items with their replies underneath
export function threads(items) {
  const byParent = {};
  items.filter(x => x.replyTo).forEach(x => (byParent[x.replyTo] = byParent[x.replyTo] || []).push(x));
  Object.values(byParent).forEach(a => a.sort((x, y) => atMs(x) - atMs(y)));
  const ids = new Set(items.map(x => x.id));
  return items.filter(x => !x.replyTo || !ids.has(x.replyTo)).map(x => ({ item: x, replies: byParent[x.id] || [] }));
}

// ---------- Teacher card (publicTeachers) ----------
export const publicTeacherData = t => ({ name: t.name || "", title: t.title || "", teaches: t.teaches || "", bio: t.bio || "", photo: t.photo || null });
export async function syncPublicTeacher(uid, t) {
  const data = publicTeacherData(t);
  try {
    const cur = await getDoc(doc(db, "publicTeachers", uid));
    if (cur.exists() && Object.keys(data).every(k => (cur.data()[k] ?? null) === (data[k] ?? null))) return false;
    await setDoc(doc(db, "publicTeachers", uid), { ...data, updatedAt: serverTimestamp() });
    return true;
  } catch (e) { return false; }
}
const normT = n => String(n || "").toLowerCase().replace(/^\s*(mr|mrs|ms|miss|dr)\.?\s+/, "").replace(/\s+/g, " ").trim();
export async function findPublicTeacher(name) {
  const snap = await getDocs(collection(db, "publicTeachers"));
  return snap.docs.map(d => d.data()).find(t => normT(t.name) === normT(name)) || null;
}
export const titled = t => [t.title ? String(t.title).replace(/\.?$/, ".") : "", t.name].filter(Boolean).join(" ");

// ---------- Timetable helpers (student's residence time zone) ----------
export function nowIn(tz) {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-GB", { timeZone: tz || undefined, hourCycle: "h23", weekday: "short", hour: "2-digit", minute: "2-digit", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date()).map(x => [x.type, x.value]));
  return { day: p.weekday.slice(0, 3), min: (+p.hour % 24) * 60 + +p.minute, iso: `${p.year}-${p.month}-${p.day}` };
}
export function weekSlots(s) {
  return DAYS.filter(d => (s.lessonDays || []).includes(d)).map(d => {
    const x = s.lessonSlots?.[d] || {}, m = String(s.lessonTime || "").match(/(\d{1,2})[:.](\d{2})/);
    const t = x.time || (m ? m[1].padStart(2, "0") + ":" + m[2] : "");
    return { day: d, name: DAY_NAMES[d], time: t, lessons: x.lessons || 1 };
  });
}
export function nextLesson(s) {
  const slots = weekSlots(s).filter(x => x.time); if (!slots.length) return null;
  const now = nowIn(s.tz), di = DAYS.indexOf(now.day);
  for (let k = 0; k < 8; k++) {
    const d = DAYS[(di + k) % 7];
    const hit = slots.filter(x => x.day === d).sort((a, b) => a.time.localeCompare(b.time)).find(x => k > 0 || toMin(x.time) > now.min - 30);
    if (hit) return { ...hit, inDays: k, label: k === 0 ? "Today" : k === 1 ? "Tomorrow" : hit.name };
  }
  return null;
}
const toMin = t => { const [h, m] = String(t).split(":").map(Number); return h * 60 + (m || 0); };

// ---------- Bell (works on any page; styles are injected) ----------
const BELL_CSS = `
.eof-bell{position:relative;display:inline-flex;align-self:center;flex-shrink:0}
.eof-bell-btn{position:relative;width:40px;height:40px;border-radius:50%;border:1px solid rgba(255,255,255,.3);background:rgba(255,255,255,.14);color:#fff;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;padding:0}
.eof-bell-btn:hover{background:rgba(255,255,255,.24)}
.eof-bell.on-light .eof-bell-btn{border:1.5px solid #16264D;background:#fff;color:#16264D}
.eof-bell.on-light .eof-bell-btn:hover{background:#F4F6FA}
.eof-bell-n{position:absolute;top:-4px;right:-4px;min-width:19px;height:19px;padding:0 5px;border-radius:999px;background:#E0392C;color:#fff;font:700 11px/19px Poppins,sans-serif;text-align:center;box-shadow:0 0 0 2px #16264D}
.eof-bell.on-light .eof-bell-n{box-shadow:0 0 0 2px #fff}
.eof-bell-panel{position:absolute;right:0;top:calc(100% + 10px);width:min(380px,calc(100vw - 24px));max-height:min(520px,75vh);overflow:auto;background:#fff;color:#232B3D;border-radius:16px;box-shadow:0 18px 50px rgba(13,24,54,.25);z-index:700;font-family:Poppins,sans-serif;text-align:left}
.eof-bell-head{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:14px 16px 10px;border-bottom:1px solid #E2E6EF;position:sticky;top:0;background:#fff;z-index:1}
.eof-bell-head b{font-family:Fraunces,serif;font-size:18px;color:#16264D;font-weight:600}
.eof-bell-head a,.eof-bell-head button{font-size:12.5px;color:#3A57AB;background:none;border:0;cursor:pointer;text-decoration:underline;padding:0;font-family:inherit}
.eof-bell-list{padding:6px 8px 10px}
.eof-bell-empty{padding:22px 14px;text-align:center;color:#6B7385;font-size:14px}
.eof-bell-foot{padding:10px 16px;border-top:1px solid #E2E6EF;text-align:center;font-size:13px}
.eof-bell-foot a{color:#3A57AB}
.eof-bell .fd-item{display:flex;gap:10px;padding:10px 8px;border-radius:12px;font-size:13.5px;line-height:1.45}
.eof-bell .fd-item+.fd-item{margin-top:2px}
.eof-bell .fd-item.unread{background:#FFF7E8}
.eof-bell .fd-icon{width:34px;height:34px;flex:0 0 auto;border-radius:50%;background:#F4F6FA;display:flex;align-items:center;justify-content:center;font-size:17px}
.eof-bell .fd-main{min-width:0;flex:1}
.eof-bell .fd-top{display:flex;justify-content:space-between;gap:8px;align-items:flex-start}
.eof-bell .fd-top b{color:#16264D;font-weight:600}
.eof-bell .fd-pts{flex:0 0 auto;background:#E3A94C;color:#0D1836;font-weight:700;font-size:11.5px;border-radius:999px;padding:1px 8px}
.eof-bell .fd-body{margin:2px 0 0;color:#232B3D;word-wrap:break-word}
.eof-bell .fd-meta{font-size:11.5px;color:#6B7385;margin-top:2px}
.eof-bell .fd-replies,.eof-bell .fd-reply-btn{display:none}
@media (max-width:640px){.eof-bell-panel{position:fixed;left:12px;right:12px;top:64px;width:auto}}
`;
function ensureBellCss() {
  if (document.getElementById("eofBellCss")) return;
  const st = document.createElement("style"); st.id = "eofBellCss"; st.textContent = BELL_CSS; document.head.appendChild(st);
}
const BELL_SVG = `<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="currentColor"><path d="M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22Zm7-6V11a7 7 0 0 0-5.5-6.84V3.5a1.5 1.5 0 0 0-3 0v.66A7 7 0 0 0 5 11v5l-1.7 1.7A1 1 0 0 0 4 19.4h16a1 1 0 0 0 .7-1.7Z"/></svg>`;
// mountBell(el, { title, light, load: async () => items, unread: item => bool, onOpen: async items => {}, staff, footer: html, onItemClick })
export function mountBell(el, cfg) {
  ensureBellCss();
  el.classList.add("eof-bell"); if (cfg.light) el.classList.add("on-light");
  el.innerHTML = `<button type="button" class="eof-bell-btn" aria-haspopup="true" aria-expanded="false" aria-label="Notifications">${BELL_SVG}<span class="eof-bell-n" hidden>0</span></button><div class="eof-bell-panel" hidden role="dialog" aria-label="Notifications"></div>`;
  const btn = el.querySelector(".eof-bell-btn"), n = el.querySelector(".eof-bell-n"), panel = el.querySelector(".eof-bell-panel");
  let items = [], off = false, open = false;
  const count = () => items.filter(cfg.unread).length;
  const paint = () => { const c = count(); n.hidden = !c; n.textContent = c > 9 ? "9+" : c; btn.setAttribute("aria-label", c ? `Notifications: ${c} unread` : "Notifications"); };
  const render = () => {
    const unreadIds = new Set(items.filter(cfg.unread).map(x => x.id));
    panel.innerHTML = `<div class="eof-bell-head"><b>${esc(cfg.title || "Notifications")}</b>${cfg.headLink || ""}</div>` +
      (off ? `<div class="eof-bell-empty">Notifications are being switched on. They'll appear here soon.</div>`
        : items.length ? `<div class="eof-bell-list">${items.slice(0, 30).map(it => feedItemHtml(it, { staff: cfg.staff, showStudent: cfg.staff })).join("")}</div>`
          : `<div class="eof-bell-empty">${esc(cfg.empty || "Nothing new yet.")}</div>`) +
      (cfg.footer ? `<div class="eof-bell-foot">${cfg.footer}</div>` : "");
    // keep the "new" highlight visible while the panel is open
    panel.querySelectorAll(".fd-item").forEach(x => x.classList.toggle("unread", unreadIds.has(x.dataset.fid) || x.classList.contains("unread")));
  };
  async function refresh() {
    try { items = (await cfg.load()) || []; off = false; }
    catch (e) { if (isDenied(e)) { off = true; items = []; } }
    paint(); if (open) render();
    return items;
  }
  async function setOpen(o) {
    open = o; panel.hidden = !o; btn.setAttribute("aria-expanded", o ? "true" : "false");
    if (o) {
      render();
      const unread = items.filter(cfg.unread);
      if (unread.length && cfg.onOpen) { try { await cfg.onOpen(unread); } catch (e) { } paint(); }
    }
  }
  btn.addEventListener("click", e => { e.stopPropagation(); setOpen(!open); });
  document.addEventListener("click", e => { if (open && !el.contains(e.target)) setOpen(false); });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && open) setOpen(false); });
  panel.addEventListener("click", e => { const it = e.target.closest("[data-fid]"); if (it && cfg.onItemClick) { cfg.onItemClick(items.find(x => x.id === it.dataset.fid)); setOpen(false); } });
  refresh();
  const timer = setInterval(() => { if (!document.hidden && !off) refresh(); }, cfg.every || 90000);
  return { refresh, close: () => setOpen(false), stop: () => clearInterval(timer), get items() { return items; }, setItems(x) { items = x; paint(); if (open) render(); } };
}
