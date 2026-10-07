// English Online Forum — downloadable student record card (A4 PDF, built in the browser with jsPDF).
// Used by the student account page and the admin page.
import { prettyDate, schedule, fmtScore, pctOf, resultTitle, levelHistory, monthYear, SKILLS, SKILL_LABEL } from "./eof-portal.js";

const BRAND = {
  navy: [22, 38, 77], blue: [58, 87, 171], red: [224, 57, 44], gold: [227, 169, 76], green: [31, 157, 91],
  text: [35, 43, 61], grey: [120, 127, 145], line: [226, 230, 239], soft: [244, 246, 250],
  site: "www.englishonlineforum.com", url: "https://www.englishonlineforum.com",
  email: "englishonlineforum@gmail.com", phone: "+996 995-648-111"
};
const LEVEL_FULL = { A1: "Beginner", A2: "Elementary", B1: "Intermediate", B2: "Upper-Intermediate", C1: "Advanced", C2: "Proficient" };

function loadScript(src) {
  return new Promise((res, rej) => {
    const s = document.createElement("script"); s.src = src; s.async = true;
    s.onload = () => window.jspdf ? res() : rej(new Error("jsPDF missing"));
    s.onerror = () => rej(new Error("load failed: " + src));
    document.head.appendChild(s);
  });
}
let libPromise = null;
function lib() {
  if (window.jspdf) return Promise.resolve();
  return libPromise ||= loadScript("https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js")
    .catch(() => loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"));
}

// Full Poppins (with Turkish letters ğ ş ı İ). Falls back to built-in fonts if it can't load.
const FONT_URL = "https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/poppins/";
let fontPromise = null;
function toB64(buf) { const b = new Uint8Array(buf); let s = ""; for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000)); return btoa(s); }
function fonts() {
  return fontPromise ||= Promise.all(["Regular", "Medium", "Bold"].map(w =>
    fetch(FONT_URL + "Poppins-" + w + ".ttf").then(r => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); }).then(toB64)))
    .then(([r, m, b]) => ({ r, m, b })).catch(() => null);
}

function logo() {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => { try { const c = document.createElement("canvas"); c.width = c.height = 300; c.getContext("2d").drawImage(img, 0, 0, 300, 300); resolve(c.toDataURL("image/png")); } catch { resolve(null); } };
    img.onerror = () => resolve(null);
    img.src = "/favicon-192.png";
  });
}

// The student's name in the brand serif, drawn by the browser so every alphabet works.
async function nameImage(name) {
  try { await document.fonts.load("600 160px Fraunces"); } catch { }
  const c = document.createElement("canvas"), ctx = c.getContext("2d");
  const font = "600 150px Fraunces, Georgia, 'Times New Roman', serif";
  ctx.font = font;
  const w = Math.ceil(ctx.measureText(name).width) + 30;
  c.width = w; c.height = 210;
  ctx.font = font; ctx.fillStyle = "rgb(22,38,77)"; ctx.fillText(name, 15, 160);
  return { data: c.toDataURL("image/png"), ratio: w / 210 };
}

const ASCII = { "ğ": "g", "Ğ": "G", "ş": "s", "Ş": "S", "ı": "i", "İ": "I", "ə": "e", "Ə": "E", "–": "-", "—": "-", "·": "-", "→": "->", "’": "'", "“": '"', "”": '"' };
function safeFile(s) { return String(s || "Student").normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[ğĞşŞıİ]/g, ch => ASCII[ch]).replace(/[^A-Za-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").slice(0, 40) || "Student"; }

function build(s, att, results, F, logoData, nameImg) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
  if (F) {
    doc.addFileToVFS("pr.ttf", F.r); doc.addFont("pr.ttf", "Pop", "normal");
    doc.addFileToVFS("pm.ttf", F.m); doc.addFont("pm.ttf", "PopM", "normal");
    doc.addFileToVFS("pb.ttf", F.b); doc.addFont("pb.ttf", "Pop", "bold");
  }
  const T = str => F ? String(str ?? "") : String(str ?? "").replace(/[ğĞşŞıİəƏ–—·→’“”]/g, ch => ASCII[ch]); // built-in fonts lack some letters
  const font = (w, size) => { if (F) doc.setFont(w === "m" ? "PopM" : "Pop", w === "b" ? "bold" : "normal"); else doc.setFont("helvetica", w === "b" ? "bold" : "normal"); doc.setFontSize(size); };
  const fill = c => doc.setFillColor(...c), ink = c => doc.setTextColor(...c), pen = c => doc.setDrawColor(...c);
  const text = (t, x, y, o) => doc.text(T(t), x, y, o);
  const spaced = (t, x, y, sp) => { doc.setCharSpace(sp); text(t, x, y); doc.setCharSpace(0); };

  const W = 210, X = 16, TW = W - 32, now = new Date();
  const today = now.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  doc.setProperties({ title: `English Online Forum — Student Record — ${s.name}`, author: "English Online Forum", creator: BRAND.site });

  function header(small) {
    const h = small ? 26 : 44;
    fill(BRAND.navy); doc.rect(0, 0, W, h, "F");
    doc.saveGraphicsState(); doc.rect(0, 0, W, h, null); doc.clip(); doc.discardPath();
    doc.setGState(new doc.GState({ opacity: 0.18 })); fill(BRAND.blue); doc.circle(190, 4, small ? 26 : 38, "F");
    doc.setGState(new doc.GState({ opacity: 0.12 })); fill(BRAND.red); doc.circle(214, h, 18, "F");
    doc.setGState(new doc.GState({ opacity: 1 })); doc.restoreGraphicsState();
    fill(BRAND.red); doc.rect(0, h, W, 1.2, "F");
    const r = small ? 8.5 : 13, cx = X + r, cy = h / 2;
    fill([255, 255, 255]); doc.circle(cx, cy, r, "F");
    if (logoData) doc.addImage(logoData, "PNG", cx - r * 0.92, cy - r * 0.92, r * 1.84, r * 1.84);
    ink([255, 255, 255]); font("b", small ? 13 : 18); text("English Online Forum", cx + r + 6, cy - (small ? 0.5 : 2));
    ink([200, 208, 228]); font("r", small ? 8 : 9);
    text(small ? `Student record · ${s.name}` : "Language is Freedom   •   " + BRAND.site, cx + r + 6, cy + (small ? 5 : 5.5));
    if (!small) {
      fill([255, 255, 255]); doc.roundedRect(W - X - 42, cy - 5.5, 42, 11, 2.5, 2.5, "F");
      ink(BRAND.navy); font("b", 8); spaced("STUDENT RECORD", W - X - 37.5, cy + 1.3, 0.6);
    }
    return h;
  }
  function footer() {
    fill(BRAND.navy); doc.rect(0, 280, W, 17, "F");
    ink([255, 255, 255]); font("m", 8.6); text(`${BRAND.site}   •   ${BRAND.email}   •   ${BRAND.phone}`, X, 290);
    doc.link(X, 286.5, doc.getTextWidth(BRAND.site), 4.5, { url: BRAND.url });
    ink([200, 208, 228]); font("r", 7.2); text(`Issued ${today}`, W - X, 287.6, { align: "right" }); text(s.studentNumber || "", W - X, 291.8, { align: "right" });
  }

  let y = header(false) + 14;
  const need = h => { if (y + h > 272) { footer(); doc.addPage(); y = header(true) + 12; } };
  const h2 = t => { need(14); ink(BRAND.red); font("b", 8.4); spaced(t.toUpperCase(), X, y, 0.8); pen(BRAND.line); doc.setLineWidth(0.3); doc.line(X, y + 2.4, X + TW, y + 2.4); y += 8; };

  /* Name block */
  ink(BRAND.grey); font("r", 9.5); text("Student record card for", X, y); y += 3;
  const nh = 11, nw = Math.min(TW - 50, nh * nameImg.ratio);
  doc.addImage(nameImg.data, "PNG", X, y, nw, nw / nameImg.ratio); y += nw / nameImg.ratio + 4;
  // pills: number · level · status
  let px = X;
  const pill = (label, bg, fg, bold = true) => { font(bold ? "b" : "m", 8.6); const w = doc.getTextWidth(T(label)) + 8; fill(bg); doc.roundedRect(px, y - 4.6, w, 6.8, 1.8, 1.8, "F"); ink(fg); text(label, px + 4, y); px += w + 3; };
  pill(s.studentNumber || "No number", BRAND.navy, [255, 255, 255]);
  if (s.level) pill(`${s.level} ${LEVEL_FULL[s.level] || ""}`.trim(), BRAND.gold, [13, 24, 54]);
  const st = { active: ["Active", [227, 245, 236], BRAND.green], paused: ["Paused", [255, 243, 221], [154, 106, 18]], left: ["Former student", BRAND.soft, BRAND.grey] }[s.status || "active"];
  if (st) pill(st[0], st[1], st[2], false);
  y += 12;

  /* Details */
  h2("Student details");
  const loc = [s.city, s.country].filter(Boolean).join(", ");
  const rows = [
    ["Course", s.course], ["Level", s.level ? `${s.level} ${LEVEL_FULL[s.level] || ""}` : ""], ["Teacher", s.teacher],
    ["Lesson days", (s.lessonDays || []).length ? schedule(s) : ""], ["Registered", s.registeredOn ? prettyDate(s.registeredOn) : ""],
    ["Date of birth", s.dob ? prettyDate(s.dob) : ""], ["City / country", loc], ["Occupation", s.occupation], ["School & grade", s.school],
    ["Time zone", s.timeZone], ["Email", s.email], ["Phone", s.phone],
    ["Parent / guardian", [s.parentName, s.parentPhone].filter(Boolean).join(" · ")]
  ].filter(r => r[1]);
  const colW = TW / 2;
  for (let i = 0; i < rows.length; i += 2) {
    need(12);
    [rows[i], rows[i + 1]].forEach((r, k) => {
      if (!r) return;
      const x = X + k * colW;
      ink(BRAND.grey); font("r", 7.6); text(r[0].toUpperCase(), x, y);
      ink(BRAND.navy); font("m", 10);
      const lines = doc.splitTextToSize(T(r[1]), colW - 6).slice(0, 2);
      doc.text(lines, x, y + 5);
    });
    y += 12.5;
  }

  /* Level progress */
  const hist = levelHistory(s);
  if (hist.length) {
    y += 2; h2("Level progress");
    need(16);
    let x = X;
    hist.forEach((h, i) => {
      const last = i === hist.length - 1;
      font("b", 10); const lw = doc.getTextWidth(T(h.level)) + 9;
      if (x + lw + 30 > X + TW) { x = X; y += 15; need(15); }
      fill(last ? BRAND.red : BRAND.navy); doc.roundedRect(x, y - 4.8, lw, 7.4, 1.8, 1.8, "F");
      ink([255, 255, 255]); text(h.level, x + lw / 2, y + 0.3, { align: "center" });
      ink(BRAND.grey); font("r", 7.2); text(h.date ? monthYear(h.date) : "", x + lw / 2, y + 6.5, { align: "center" });
      x += lw;
      if (!last) { ink(BRAND.grey); font("r", 11); text("→", x + 4, y + 0.6); x += 11; }
    });
    y += 14;
  }

  /* Results */
  h2("Test and exam results");
  if (!results.length) {
    ink(BRAND.grey); font("r", 9.5); text("No results recorded yet.", X, y + 1); y += 10;
  } else {
    const cols = [X, X + 26, X + 98, X + 124, X + 148];
    need(16);
    fill(BRAND.soft); doc.roundedRect(X, y - 4.5, TW, 7.5, 1.5, 1.5, "F");
    ink(BRAND.grey); font("b", 7.4);
    ["Date", "Test", "Score", "Level", "Outcome"].forEach((t, i) => text(t, cols[i] + 2, y));
    y += 7;
    results.forEach(r => {
      const sk = SKILLS.filter(([k]) => r.skills && r.skills[k] !== undefined && r.skills[k] !== "" && r.skills[k] !== null)
        .map(([k, l]) => `${l} ${fmtScore(r, r.skills[k])}`);
      Object.keys(r.skills || {}).filter(k => !SKILL_LABEL[k]).forEach(k => sk.push(`${k} ${fmtScore(r, r.skills[k])}`));
      font("r", 7.6);
      const skLines = sk.length ? doc.splitTextToSize(T(sk.join("  ·  ")), TW - 30) : [];
      const cmLines = r.comment ? doc.splitTextToSize(T("“" + r.comment + "”"), TW - 30).slice(0, 3) : [];
      const h = 8 + skLines.length * 3.8 + cmLines.length * 3.8 + 2;
      need(h);
      ink(BRAND.text); font("r", 8.8); text(r.date ? new Date(r.date + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—", cols[0] + 2, y);
      ink(BRAND.navy); font("m", 9.2); text(doc.splitTextToSize(T(resultTitle(r)), 70)[0], cols[1] + 2, y);
      font("b", 9.4); text(fmtScore(r), cols[2] + 2, y);
      if (r.level) { fill(BRAND.navy); doc.roundedRect(cols[3] + 2, y - 3.8, 11, 5.2, 1.2, 1.2, "F"); ink([255, 255, 255]); font("b", 7.8); text(r.level, cols[3] + 7.5, y, { align: "center" }); }
      if (r.outcome) { ink(r.outcome === "Pass" ? BRAND.green : BRAND.red); font("b", 8.8); text(r.outcome, cols[4] + 2, y); }
      let yy = y + 4.6;
      ink(BRAND.grey); font("r", 7.6);
      if (skLines.length) { doc.text(skLines, cols[1] + 2, yy); yy += skLines.length * 3.8; }
      if (cmLines.length) { ink(BRAND.text); doc.text(cmLines, cols[1] + 2, yy); yy += cmLines.length * 3.8; }
      y = yy + 1.5;
      pen(BRAND.line); doc.setLineWidth(0.25); doc.line(X, y - 2.5, X + TW, y - 2.5);
      y += 3;
    });
    y += 2;
  }

  /* Attendance */
  h2("Attendance");
  need(30);
  const p = att.filter(a => a.status === "present").length, ab = att.filter(a => a.status === "absent").length;
  const boxes = [[String(p), "Lessons attended", BRAND.green], [String(ab), "Lessons missed", BRAND.red], [p + ab ? Math.round(p * 100 / (p + ab)) + "%" : "—", "Attendance rate", BRAND.navy]];
  const bw = (TW - 8) / 3;
  boxes.forEach((b, i) => {
    const x = X + i * (bw + 4);
    fill(BRAND.soft); doc.roundedRect(x, y - 4, bw, 17, 2.5, 2.5, "F");
    ink(b[2]); font("b", 16); text(b[0], x + 5, y + 5.4);
    ink(BRAND.grey); font("r", 8); text(b[1], x + 5, y + 10.4);
  });
  y += 19;
  const recent = att.slice(0, 12);
  if (recent.length) {
    need(10);
    ink(BRAND.grey); font("r", 7.6); text("Most recent lessons", X, y); y += 4.5;
    let x = X;
    recent.forEach(a => {
      const d = new Date(a.date + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" });
      font("m", 7.6); const w = doc.getTextWidth(T(d)) + 9;
      if (x + w > X + TW) { x = X; y += 7.5; need(8); }
      const ok = a.status === "present";
      fill(ok ? [227, 245, 236] : [253, 232, 230]); doc.roundedRect(x, y - 3.6, w, 5.6, 1.6, 1.6, "F");
      fill(ok ? BRAND.green : BRAND.red); doc.circle(x + 3, y - 0.8, 1, "F");
      ink(ok ? BRAND.green : [185, 44, 33]); text(d, x + 5.5, y);
      x += w + 2.5;
    });
    y += 8;
  }

  footer();
  return { doc, fileName: `EOF-Student-Card-${safeFile(s.name)}-${s.studentNumber || ""}.pdf`.replace(/-\.pdf$/, ".pdf") };
}

// s: student record. att: [{date, status}] newest first. results: [{...}] newest first.
export async function downloadStudentCard(s, att = [], results = []) {
  const [, F, logoData, nameImg] = await Promise.all([lib(), fonts(), logo(), nameImage(s.name || "Student")]);
  const { doc, fileName } = build(s, att, results, F, logoData, nameImg);
  const blob = doc.output("blob");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = fileName;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  return fileName;
}
// Start loading the PDF library and fonts early so the download is quick.
export function warmUp() { lib().catch(() => { }); fonts(); }
