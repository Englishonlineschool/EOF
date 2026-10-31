// Chat between a student and her teacher, or a student and the school (admin).
// Messages: students/{sid}/threads/{teacher|school}/messages/{id}
// Files (photos, documents): students/{sid}/files/{id} + /chunks/{n} — stored inside Firestore in pieces,
//   because Firebase Storage needs the paid plan.
// Inbox (one small doc per conversation, so the staff bell needs a single query): inbox/{sid}_{tid}
import { db, doc, getDoc, getDocs, setDoc, updateDoc, collection, query, where, onSnapshot, serverTimestamp, esc } from "./eof-portal.js?v=7";

export const THREAD_IDS = ["teacher", "school"];
export const MAX_FILE = 5 * 1024 * 1024;          // 5 MB per file (photos are made smaller first)
const CHUNK = 700000;                               // characters of base64 per Firestore document (< 1 MB limit)
const ACCEPT = "image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.rtf,.odt,.mp3,.m4a,.wav,.ogg,.webm,.zip";
export const isDenied = e => /permission|insufficient/i.test(String(e?.code || "") + " " + String(e?.message || ""));
export const msgCol = (sid, tid) => collection(db, "students", sid, "threads", tid, "messages");
export const inboxRef = (sid, tid) => doc(db, "inbox", `${sid}_${tid}`);
const ms = x => x?.toMillis ? x.toMillis() : x?.seconds ? x.seconds * 1000 : (x ? Date.parse(x) : Date.now());
const sizeTxt = n => n >= 1048576 ? (n / 1048576).toFixed(1) + " MB" : Math.max(1, Math.round(n / 1024)) + " KB";
// Only these open inside the browser / show as photos. Everything else (SVG, HTML, HEIC…) is downloaded,
// so a file can never run script in the reader's portal session.
const SAFE_IMG = /^image\/(jpeg|png|gif|webp)$/i, SAFE_OPEN = /^(image\/(jpeg|png|gif|webp)|application\/pdf)$/i;
export const isPhoto = f => !!f && SAFE_IMG.test(String(f.type || ""));
const fileIcon = t => /^image\//.test(t) ? "🖼️" : /pdf/.test(t) ? "📕" : /audio\//.test(t) ? "🎧" : /sheet|excel|csv/.test(t) ? "📊" : /presentation|powerpoint/.test(t) ? "📽️" : /zip/.test(t) ? "🗜️" : "📄";

// ---------- Inbox (conversation list + unread flags) ----------
// side: "student" → updates by the student (unreadStaff = true); "staff" → by teacher/admin (unreadStudent = true)
async function touchInbox(s, tid, side, text) {
  await setDoc(inboxRef(s.uid, tid), {
    sid: s.uid, tid, teacher: s.teacher || "", studentName: s.name || "",
    lastAt: serverTimestamp(), lastText: String(text || "").slice(0, 140), lastByRole: side,
    ...(side === "student" ? { unreadStaff: true } : { unreadStudent: true })
  }, { merge: true });
}
export async function markInboxRead(s, tid, side) {
  // sid/tid/teacher are re-sent so the update still passes the rules after the student's teacher changed
  const base = { sid: s.uid, tid, teacher: s.teacher || "" };
  try { await setDoc(inboxRef(s.uid, tid), side === "student" ? { ...base, unreadStudent: false } : { ...base, unreadStaff: false }, { merge: true }); } catch (e) { }
}
// Staff inbox: admin → every "school" conversation (or every teacher conversation); teacher → her own students' teacher conversations
export async function staffInbox({ admin, teacherName, tid = admin ? "school" : "teacher" }) {
  const q = admin ? query(collection(db, "inbox"), where("tid", "==", tid)) : query(collection(db, "inbox"), where("tid", "==", "teacher"), where("teacher", "==", teacherName));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => ms(b.lastAt) - ms(a.lastAt));
}
export async function studentInbox(sid) {
  const out = [];
  for (const tid of THREAD_IDS) { const d = await getDoc(inboxRef(sid, tid)); if (d.exists()) out.push({ id: d.id, ...d.data() }); }
  return out;
}
// Bell items (same shape as feed items)
export function inboxBellItems(rows, side, teacherLabel) {
  return rows.filter(r => side === "staff" ? r.unreadStaff : r.unreadStudent).map(r => ({
    id: "chat-" + r.id, type: "chat", sid: r.sid, tid: r.tid, at: r.lastAt, body: r.lastText || "",
    title: side === "staff" ? `Message from ${r.studentName || "a student"}${r.tid === "school" ? " (to the school)" : ""}` : `Message from ${r.tid === "school" ? "the school" : (teacherLabel || "your teacher")}`,
    studentName: r.studentName, byRole: side === "staff" ? "student" : "teacher", byName: r.tid === "school" ? "English Online Forum" : (teacherLabel || ""),
    readByStudent: side === "staff" ? true : false, readByTeacher: side === "staff" ? false : true, chat: true
  }));
}

// ---------- Files ----------
function toB64(buf) { const b = new Uint8Array(buf); let s = ""; for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000)); return btoa(s); }
// Photos are resized (max 1600 px, JPEG) so they upload fast and stay small.
async function shrinkImage(file) {
  const heic = /^image\/(heic|heif)$/i.test(file.type) || /\.(heic|heif)$/i.test(file.name || "");
  // iPhone HEIC photos are turned into JPEG where the browser can read them (Safari); otherwise sent as a file
  if (!heic && (!/^image\/(jpeg|png|webp|bmp)$/i.test(file.type) || file.size < 350000)) return file;
  try {
    const url = URL.createObjectURL(file), img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
    const k = Math.min(1, 1600 / Math.max(img.width, img.height)), c = document.createElement("canvas");
    c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
    const ctx = c.getContext("2d"); ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height); ctx.drawImage(img, 0, 0, c.width, c.height);
    URL.revokeObjectURL(url);
    const blob = await new Promise(r => c.toBlob(r, "image/jpeg", 0.82));
    if (!blob || (!heic && blob.size >= file.size)) return file;
    return new File([blob], file.name.replace(/\.[a-z0-9]+$/i, "") + ".jpg", { type: "image/jpeg" });
  } catch (e) { return file; }
}
async function uploadFile(s, tid, file, me, progress) {
  file = await shrinkImage(file);
  if (file.size > MAX_FILE) throw Object.assign(new Error(`“${file.name}” is ${sizeTxt(file.size)}. The limit is 5 MB — please send a smaller file.`), { code: "too-big" });
  const b64 = toB64(await file.arrayBuffer()), n = Math.max(1, Math.ceil(b64.length / CHUNK));
  const ref = doc(collection(db, "students", s.uid, "files"));
  const meta = { name: String(file.name || "file").slice(0, 120), type: file.type || "application/octet-stream", size: file.size, chunks: n, thread: tid, by: me.uid, byRole: me.role, at: serverTimestamp(), complete: false };
  await setDoc(ref, meta);
  for (let i = 0; i < n; i++) { progress && progress(i, n); await setDoc(doc(db, "students", s.uid, "files", ref.id, "chunks", String(i)), { d: b64.slice(i * CHUNK, (i + 1) * CHUNK) }); }
  await updateDoc(ref, { complete: true });
  return { id: ref.id, name: meta.name, type: meta.type, size: meta.size };
}
const blobCache = {};
export async function fileBlob(sid, f) {
  if (blobCache[f.id]) return blobCache[f.id];
  const snap = await getDocs(collection(db, "students", sid, "files", f.id, "chunks"));
  const b64 = snap.docs.sort((a, b) => +a.id - +b.id).map(d => d.data().d).join("");
  const bin = atob(b64), arr = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return (blobCache[f.id] = URL.createObjectURL(new Blob([arr], { type: SAFE_OPEN.test(String(f.type || "")) ? f.type : "application/octet-stream" })));
}

// ---------- Send ----------
export async function sendMessage(s, tid, me, text, file, progress) {
  let f = null;
  if (file) f = await uploadFile(s, tid, file, me, progress);
  const ref = doc(msgCol(s.uid, tid));
  await setDoc(ref, {
    text: String(text || "").slice(0, 2000), file: f, uid: me.uid, byRole: me.role, byName: me.name || "",
    at: serverTimestamp(), readByStudent: me.role === "student", readByStaff: me.role !== "student"
  });
  await touchInbox(s, tid, me.role === "student" ? "student" : "staff", text || (f ? (fileIcon(f.type) + " " + f.name) : ""));
  return ref.id;
}

// ---------- Chat panel ----------
// mountChat(el, { s (student, with uid/name/teacher), tid, me: {uid, role: student|teacher|admin, name}, title, subtitle, onRead })
export function mountChat(el, o) {
  const side = o.me.role === "student" ? "student" : "staff";
  el.classList.add("chat");
  el.innerHTML = `
    <div class="chat-head"><div class="chat-ava">${o.avatar || esc(String(o.title || "?").replace(/^(Ms|Mr|Mrs|Dr)\.?\s+/i, "").split(/\s+/).map(w => w[0]).slice(0, 2).join(""))}</div><div class="chat-who"><b>${esc(o.title || "")}</b><small>${esc(o.subtitle || "")}</small></div>${o.headExtra || ""}</div>
    <div class="chat-msgs" role="log" aria-live="polite"><div class="chat-empty">Loading…</div></div>
    <div class="chat-soon hidden">Chat is being switched on — please try again a little later.</div>
    <form class="chat-form" novalidate>
      <label class="chat-attach" title="Send a photo or document" aria-label="Send a photo or document">📎<input type="file" accept="${ACCEPT}" hidden></label>
      <div class="chat-input-wrap"><div class="chat-file hidden"></div><textarea class="chat-input" rows="1" maxlength="2000" placeholder="Write a message…" aria-label="Message"></textarea></div>
      <button class="chat-send" type="submit" aria-label="Send"><svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M3.4 20.4 21 12 3.4 3.6l-.01 6.53L15 12 3.39 13.87z"/></svg></button>
    </form>
    <div class="chat-status" aria-live="polite"></div>`;
  const box = el.querySelector(".chat-msgs"), form = el.querySelector(".chat-form"), input = el.querySelector(".chat-input"), fileIn = el.querySelector("input[type=file]"),
    chip = el.querySelector(".chat-file"), status = el.querySelector(".chat-status"), soon = el.querySelector(".chat-soon");
  let pending = null, msgs = [], stop = null, sending = false;
  const setStatus = (t, bad) => { status.textContent = t || ""; status.classList.toggle("bad", !!bad); };
  const showChip = () => { chip.classList.toggle("hidden", !pending); chip.innerHTML = pending ? `${fileIcon(pending.type)} <b>${esc(pending.name)}</b> <span>${sizeTxt(pending.size)}</span> <button type="button" class="linkbtn" data-unpick>Remove</button>` : ""; };
  const grow = () => { input.style.height = "auto"; input.style.height = Math.min(140, input.scrollHeight) + "px"; };
  input.addEventListener("input", grow);
  input.addEventListener("keydown", e => {
    if (e.key === "Enter" && !e.shiftKey && !e.isComposing && e.keyCode !== 229 && !/Mobi|Android/i.test(navigator.userAgent)) {
      e.preventDefault(); form.requestSubmit ? form.requestSubmit() : form.dispatchEvent(new Event("submit", { cancelable: true }));
    }
  });
  fileIn.addEventListener("change", () => { const f = fileIn.files[0]; fileIn.value = ""; if (!f) return; if (f.size > 25 * 1024 * 1024 || (!/^image\//.test(f.type) && f.size > MAX_FILE)) { setStatus(`“${f.name}” is ${sizeTxt(f.size)}. Files can be up to 5 MB.`, true); return; } pending = f; showChip(); setStatus(""); input.focus(); });
  chip.addEventListener("click", e => { if (e.target.closest("[data-unpick]")) { pending = null; showChip(); } });

  const dayLabel = t => { const d = new Date(t), n = new Date(), y = new Date(Date.now() - 864e5); return d.toDateString() === n.toDateString() ? "Today" : d.toDateString() === y.toDateString() ? "Yesterday" : d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: d.getFullYear() === n.getFullYear() ? undefined : "numeric" }); };
  function render() {
    const atBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 80;
    if (!msgs.length) { box.innerHTML = `<div class="chat-empty">${esc(o.empty || "No messages yet. Say hello!")}</div>`; return; }
    let last = "";
    box.innerHTML = msgs.map(m => {
      const t = ms(m.at), day = dayLabel(t), mine = side === "student" ? m.byRole === "student" : m.byRole !== "student";
      const sep = day !== last ? `<div class="chat-day"><span>${esc(day)}</span></div>` : ""; last = day;
      const f = m.file ? (isPhoto(m.file) ? `<button type="button" class="chat-img" data-file="${esc(m.file.id)}" aria-label="Open ${esc(m.file.name)}"><span>🖼️ Loading photo…</span></button>`
        : `<button type="button" class="chat-doc" data-file="${esc(m.file.id)}"><i>${fileIcon(m.file.type)}</i><span><b>${esc(m.file.name)}</b><small>${sizeTxt(m.file.size)} · Download</small></span></button>`) : "";
      const who = !mine && side === "staff" ? "" : !mine ? `<div class="chat-by">${esc(m.byName || "")}</div>` : (side === "staff" && m.byName && m.byName !== o.me.name ? `<div class="chat-by">${esc(m.byName)}</div>` : "");
      return sep + `<div class="chat-row ${mine ? "me" : "them"}"><div class="chat-bub">${who}${f}${m.text ? `<div class="chat-txt">${esc(m.text)}</div>` : ""}<div class="chat-time">${new Date(t).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}${mine && side === "student" ? (m.readByStaff ? " · Seen" : "") : mine && side === "staff" ? (m.readByStudent ? " · Seen" : "") : ""}</div></div></div>`;
    }).join("");
    box.querySelectorAll(".chat-img").forEach(async b => {
      const f = msgs.find(m => m.file?.id === b.dataset.file)?.file; if (!f) return;
      try { const url = await fileBlob(o.s.uid, f); b.innerHTML = `<img src="${url}" alt="${esc(f.name)}">`; const im = b.querySelector("img"); im.onload = () => { if (atBottom) box.scrollTop = box.scrollHeight; }; }
      catch (e) { b.innerHTML = `<span>🖼️ ${esc(f.name)} — tap to try again</span>`; }
    });
    if (atBottom || !render.done) box.scrollTop = box.scrollHeight;
    render.done = true;
  }
  box.addEventListener("click", async e => {
    const b = e.target.closest("[data-file]"); if (!b) return;
    const f = msgs.find(m => m.file?.id === b.dataset.file)?.file; if (!f) return;
    try {
      const url = await fileBlob(o.s.uid, f);
      const a = document.createElement("a"); a.href = url; a.download = f.name;
      if (SAFE_OPEN.test(String(f.type || ""))) { a.target = "_blank"; a.rel = "noopener"; a.removeAttribute("download"); }
      document.body.appendChild(a); a.click(); a.remove();
    } catch (ex) { setStatus("Couldn't open the file. Please try again.", true); }
  });
  async function markRead(list) {
    const field = side === "student" ? "readByStudent" : "readByStaff";
    const un = list.filter(m => m[field] === false && (side === "student" ? m.byRole !== "student" : m.byRole === "student"));
    if (o.noMarkRead) return;   // the admin only looking at a student↔teacher chat
    if (!un.length && !o.inboxUnread) return;
    await Promise.all(un.map(m => updateDoc(doc(msgCol(o.s.uid, o.tid), m.id), { [field]: true }).catch(() => {})));
    await markInboxRead(o.s, o.tid, side); o.inboxUnread = false;
    o.onRead && o.onRead();
  }
  // Messages count as read only when the chat is actually on screen
  let inView = false;
  const seen = () => !document.hidden && inView && el.isConnected;
  const io = "IntersectionObserver" in window ? new IntersectionObserver(es => { inView = es.some(e => e.isIntersecting); if (seen()) markRead(msgs); }, { threshold: 0.25 }) : null;
  if (io) io.observe(box); else inView = true;
  const onVis = () => { if (seen()) markRead(msgs); };
  document.addEventListener("visibilitychange", onVis);
  stop = onSnapshot(msgCol(o.s.uid, o.tid), snap => {
    msgs = snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => ms(a.at) - ms(b.at));
    soon.classList.add("hidden"); form.classList.remove("hidden");
    render();
    if (seen()) markRead(msgs);
  }, err => {
    if (isDenied(err)) { box.innerHTML = ""; soon.classList.remove("hidden"); form.classList.add("hidden"); }
    else { box.innerHTML = `<div class="chat-empty">Couldn't load the messages. Please check your connection.</div>`; }
  });
  form.addEventListener("submit", async e => {
    e.preventDefault();
    if (sending) return;
    const text = input.value.trim(); if (!text && !pending) { input.focus(); return; }
    sending = true; el.querySelector(".chat-send").disabled = true; setStatus(pending ? "Sending…" : "");
    try {
      await sendMessage(o.s, o.tid, o.me, text, pending, (i, n) => setStatus(n > 1 ? `Uploading ${pending ? pending.name : "file"}… ${Math.round(i / n * 100)}%` : `Uploading ${pending ? pending.name : "file"}…`));
      input.value = ""; grow(); pending = null; showChip(); setStatus("");
      o.onSent && o.onSent();
    } catch (ex) { setStatus(ex.code === "too-big" ? ex.message : isDenied(ex) ? "Chat is being switched on — please try again a little later." : "Couldn't send. Please check your connection and try again.", true); }
    sending = false; el.querySelector(".chat-send").disabled = false;
  });
  return {
    destroy() { stop && stop(); io && io.disconnect(); document.removeEventListener("visibilitychange", onVis); el.innerHTML = ""; },
    markRead: force => { if (force) o.inboxUnread = true; return markRead(msgs); },
    focus: () => input.focus()
  };
}
