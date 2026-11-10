// English Online Forum — personalised Lesson Agreement (EN / RU / TR).
// Fills the student's details into the fillable PDF in /agreement/ (built by _tools/agreement/build_all.py)
// and downloads it. Used by the admin page (preview / download) and the student account page.
// Data: students/{sid}.agreement = { issued, langs: ["EN","RU","TR"], ref, date, length, start }.

export const AGREEMENT_LANGS = [
  { code: "EN", label: "English", locale: "en-GB" },
  { code: "RU", label: "Русский", locale: "ru-RU" },
  { code: "TR", label: "Türkçe", locale: "tr-TR" }
];
const PDF_URL = code => `agreement/EOF_Lesson_Agreement_${code}.pdf?v=1`;
const FONT_URL = "agreement/Lato-Regular-subset.ttf?v=1";

const DAY = {
  EN: { Mon: "Mon", Tue: "Tue", Wed: "Wed", Thu: "Thu", Fri: "Fri", Sat: "Sat", Sun: "Sun", double: "double", time: c => `${c} time` },
  RU: { Mon: "Пн", Tue: "Вт", Wed: "Ср", Thu: "Чт", Fri: "Пт", Sat: "Сб", Sun: "Вс", double: "двойное", time: c => `время: ${c}` },
  TR: { Mon: "Pzt", Tue: "Sal", Wed: "Çar", Thu: "Per", Fri: "Cum", Sat: "Cmt", Sun: "Paz", double: "çift ders", time: c => `${c} saati` }
};
const COURSE = {
  RU: { "General English": "Общий английский", "Business English": "Деловой английский", "High School Teens (Grade 9–12)": "Английский для старшеклассников (9–12 классы)",
    "Secondary School (Grade 5–8)": "Английский для школьников (5–8 классы)", "Kids Group": "Детская группа", "IELTS Preparation": "Подготовка к IELTS",
    "Conversational English": "Разговорный английский", "Exam Preparation": "Подготовка к экзаменам", "Olympiad Preparation": "Подготовка к олимпиадам",
    "Professional Development": "Профессиональное развитие учителей" },
  TR: { "General English": "Genel İngilizce", "Business English": "İş İngilizcesi", "High School Teens (Grade 9–12)": "Lise Öğrencileri için İngilizce (9–12. sınıflar)",
    "Secondary School (Grade 5–8)": "Ortaokul Öğrencileri için İngilizce (5–8. sınıflar)", "Kids Group": "Çocuk Grubu", "IELTS Preparation": "IELTS Hazırlık",
    "Conversational English": "Konuşma İngilizcesi", "Exam Preparation": "Sınav Hazırlık", "Olympiad Preparation": "Olimpiyat Hazırlık",
    "Professional Development": "Öğretmenler için Mesleki Gelişim" }
};
const LENGTH = { RU: [/(\d+)\s*min(ute)?s?/i, "$1 минут"], TR: [/(\d+)\s*min(ute)?s?/i, "$1 dakika"] };
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function loadScript(src, ok) {
  return new Promise((res, rej) => {
    const s = document.createElement("script"); s.src = src; s.async = true;
    s.onload = () => ok() ? res() : rej(new Error("missing after load: " + src));
    s.onerror = () => rej(new Error("load failed: " + src));
    document.head.appendChild(s);
  });
}
let libs = null;
function loadLibs() {
  return libs ||= Promise.all([
    window.PDFLib ? 1 : loadScript("https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js", () => window.PDFLib)
      .catch(() => loadScript("https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js", () => window.PDFLib)),
    window.fontkit ? 1 : loadScript("https://cdn.jsdelivr.net/npm/@pdf-lib/fontkit@1.1.1/dist/fontkit.umd.min.js", () => window.fontkit)
      .catch(() => loadScript("https://unpkg.com/@pdf-lib/fontkit@1.1.1/dist/fontkit.umd.min.js", () => window.fontkit))
  ]).catch(e => { libs = null; throw e; });
}
const getBytes = url => fetch(url).then(r => { if (!r.ok) throw new Error(`${url}: ${r.status}`); return r.arrayBuffer(); });

export function defaultRef(s, dateIso) {
  const y = (dateIso || new Date().toISOString()).slice(0, 4);
  const n = String(s?.studentNumber || "").replace(/^EOF-?/i, "");
  return n ? `EOF-LA-${n}` : `EOF-LA-${y}`;   // student numbers already carry the year, e.g. EOF-26-0051 → EOF-LA-26-0051
}
function fmtDate(iso, locale) {
  if (!iso) return "";
  const d = new Date(iso + "T12:00:00");
  return isNaN(d) ? iso : new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric" }).format(d);
}
function lessonDays(s, code) {
  const D = DAY[code], slots = s.lessonSlots || {};
  const days = DAYS.filter(d => slots[d] || (s.lessonDays || []).includes(d));
  if (!days.length) return "";
  const txt = days.map(d => {
    const v = slots[d] || {};
    return [D[d], v.time, v.lessons == 2 ? `(${D.double})` : ""].filter(Boolean).join(" ");
  }).join(", ");
  const place = s.city || s.country;
  return place && days.some(d => slots[d]?.time) ? `${txt} · ${D.time(place)}` : txt;
}

// All values that go into the PDF, for one language.
export function agreementValues(s, code) {
  const lang = AGREEMENT_LANGS.find(l => l.code === code) || AGREEMENT_LANGS[0];
  const a = s.agreement || {};
  const date = a.date || new Date().toISOString().slice(0, 10);
  const addressee = s.parentName || s.name || "";
  const course = (COURSE[code] && COURSE[code][s.course]) || s.course || "";
  const len = a.length && LENGTH[code] ? String(a.length).replace(...LENGTH[code]) : (a.length || "");
  const phone = s.phone || s.parentPhone || "";
  return {
    to_name: addressee,
    to_contact: [s.email, phone].filter(Boolean).join(" · "),
    ref_no: a.ref || defaultRef(s, date),
    letter_date: fmtDate(date, lang.locale),
    student_no_top: s.studentNumber || "",
    salutation: addressee,
    d_student: s.name || "",
    d_parent: s.parentName || "—",
    d_student_no: s.studentNumber || "",
    d_reg_date: fmtDate(s.registeredOn, lang.locale),
    d_course: course,
    d_level: s.level || "",
    d_tutor: s.teacher || "",
    d_days: lessonDays(s, code),
    d_length: len,
    d_start: fmtDate(a.start, lang.locale),
    d_contact: [phone, s.email].filter(Boolean).join(" · "),
    s_name: s.name || "",
    p_name: s.parentName || "",
    eof_date: fmtDate(date, lang.locale)
  };
}

// Builds the filled PDF (bytes). Filled fields become read-only; empty ones
// (place and date next to the signatures) stay fillable.
export async function buildAgreement(s, code = "EN") {
  await loadLibs();
  const { PDFDocument } = window.PDFLib;
  const [pdfBytes, fontBytes] = await Promise.all([getBytes(PDF_URL(code)), getBytes(FONT_URL)]);
  const pdf = await PDFDocument.load(pdfBytes);
  pdf.registerFontkit(window.fontkit);
  const font = await pdf.embedFont(fontBytes, { subset: true });
  const form = pdf.getForm();
  const vals = agreementValues(s, code);
  for (const [name, v] of Object.entries(vals)) {
    if (!v) continue;
    let f; try { f = form.getTextField(name); } catch (e) { continue; }
    const w = f.acroField.getWidgets()[0]?.getRectangle()?.width || 200;
    let size = 9.5;
    while (size > 6 && font.widthOfTextAtSize(v, size) > w - 4) size -= 0.25;
    f.setFontSize(size);
    f.setText(v);
    f.enableReadOnly();
  }
  form.updateFieldAppearances(font);
  pdf.setTitle(code === "RU" ? "Соглашение об обучении — English Online Forum" : code === "TR" ? "Ders Sözleşmesi — English Online Forum" : "Lesson Agreement — English Online Forum");
  pdf.setAuthor("English Online Forum");
  return pdf.save();
}

export async function downloadAgreement(s, code = "EN") {
  const bytes = await buildAgreement(s, code);
  const who = String(s.studentNumber || s.name || "student").replace(/[^\p{L}\p{N}-]+/gu, "_");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
  a.download = `EOF_Lesson_Agreement_${who}_${code}.pdf`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 30000);
}
