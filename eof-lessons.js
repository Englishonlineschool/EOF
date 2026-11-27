// Lesson schedule helpers shared by the staff area (eof-admin.html), the student page (eof-account.html)
// and the student card PDF.
//
// Attendance documents: students/{sid}/attendance/{id}
//   • a regular lesson:   id = "2026-11-26" (the date where the student lives)
//       { status: "present" | "absent" | "cancelled" | "rescheduled", lessons: 1|2, markedAt, markedBy,
//         movedTo: "2026-11-28_mk…" (only when rescheduled) }
//   • a make-up lesson:   id = "2026-11-28_mk…"
//       { makeup: true, date: "2026-11-28", time: "10:00", tz, city, lessons, fromDate: "2026-11-26",
//         note, status (null until it is marked), by, byName, at }

export const STATUS = {
  present:     { label: "Present",     cls: "present" },
  absent:      { label: "Absent",      cls: "absent" },
  cancelled:   { label: "Cancelled",   cls: "cancelled" },
  rescheduled: { label: "Rescheduled", cls: "moved" }
};
export const statusLabel = st => STATUS[st]?.label || "Not marked";

export const isMakeupId = id => /_mk/.test(String(id || ""));
export const attDate = (id, x) => (x && x.date) || String(id || "").slice(0, 10);
export const newMakeupId = date => `${date}_mk${Date.now().toString(36).slice(-5)}${Math.random().toString(36).slice(2, 5)}`;

// Attendance docs → rows {id, date, ...data}, newest first
export function attRowsOf(docs) {
  return docs.map(d => { const x = d.data ? d.data() : d; const id = d.id; return { id, ...x, date: attDate(id, x) }; })
    .sort((a, b) => b.date.localeCompare(a.date) || String(b.time || "").localeCompare(String(a.time || "")));
}
// Counts that matter for the attendance rate (cancelled and rescheduled lessons don't count either way)
export function attCounts(rows) {
  const c = { present: 0, absent: 0, cancelled: 0, rescheduled: 0 };
  rows.forEach(r => { if (c[r.status] != null) c[r.status]++; });
  c.rate = c.present + c.absent ? Math.round(c.present * 100 / (c.present + c.absent)) + "%" : "—";
  return c;
}

const shortDay = iso => { const [y, m, d] = iso.split("-").map(Number); return new Date(y, m - 1, d).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }); };
export { shortDay };

// Status badge (+ a short note for make-ups and moved lessons)
export function statusBadge(r, esc) {
  const st = STATUS[r.status];
  const badge = st ? `<span class="badge ${st.cls}">${st.label}</span>` : `<span class="badge none">Not marked yet</span>`;
  let note = "";
  if (r.makeup) note = `Make-up lesson${r.time ? " at " + esc(r.time) : ""}${r.fromDate ? " (for " + esc(shortDay(r.fromDate)) + ")" : ""}`;
  else if (r.status === "rescheduled" && r.movedDate) note = `Moved to ${esc(shortDay(r.movedDate))}${r.movedTime ? ", " + esc(r.movedTime) : ""}`;
  return badge + (note ? `<div class="hint" style="margin:2px 0 0">${note}</div>` : "");
}

// ---------- Time zones ----------
export function tzOffsetMin(tz, ms) {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).formatToParts(new Date(ms)).map(x => [x.type, x.value]));
  return (Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute) - Math.floor(ms / 60000) * 60000) / 60000;
}
// Wall-clock time on `date` in `tz` → epoch ms
export function wallToMs(date, time, tz) {
  const [y, m, d] = date.split("-").map(Number), [h, mi] = String(time).split(":").map(Number);
  const wall = Date.UTC(y, m - 1, d, h, mi || 0);
  if (!tz) return wall;
  let ms = wall - tzOffsetMin(tz, wall) * 60000; ms = wall - tzOffsetMin(tz, ms) * 60000;
  return ms;
}
// The same moment in another time zone: {date, time, shift (days)}
export function toZone(date, time, fromTz, toTz) {
  if (!time) return null;
  if (!fromTz || !toTz || fromTz === toTz) return { date, time, shift: 0 };
  const ms = wallToMs(date, time, fromTz), v = new Date(ms + tzOffsetMin(toTz, ms) * 60000);
  const vd = `${v.getUTCFullYear()}-${String(v.getUTCMonth() + 1).padStart(2, "0")}-${String(v.getUTCDate()).padStart(2, "0")}`;
  const [y, m, d] = date.split("-").map(Number);
  return { date: vd, time: String(v.getUTCHours()).padStart(2, "0") + ":" + String(v.getUTCMinutes()).padStart(2, "0"),
    shift: Math.round((Date.UTC(v.getUTCFullYear(), v.getUTCMonth(), v.getUTCDate()) - Date.UTC(y, m - 1, d)) / 86400000) };
}
export const tzCity = tz => String(tz || "").split("/").pop().replace(/_/g, " ");

// Cities a teacher (or the viewer) can choose for showing lesson times
export const TEACHER_CITIES = [
  ["Bishkek", "Asia/Bishkek", "Kyrgyzstan"], ["İstanbul", "Europe/Istanbul", "Türkiye"], ["Ankara", "Europe/Istanbul", "Türkiye"],
  ["İzmir", "Europe/Istanbul", "Türkiye"], ["Almaty", "Asia/Almaty", "Kazakhstan"], ["Astana", "Asia/Almaty", "Kazakhstan"],
  ["Tashkent", "Asia/Tashkent", "Uzbekistan"], ["Dushanbe", "Asia/Dushanbe", "Tajikistan"], ["Moscow", "Europe/Moscow", "Russia"],
  ["Nairobi", "Africa/Nairobi", "Kenya"], ["Kampala", "Africa/Kampala", "Uganda"], ["Dubai", "Asia/Dubai", "United Arab Emirates"],
  ["London", "Europe/London", "United Kingdom"], ["Berlin", "Europe/Berlin", "Germany"], ["New York", "America/New_York", "United States of America"]
];
// Teacher's time zone: her profile → a guess from her phone code → Bishkek (the school's home time)
export function teacherTz(t) {
  if (t?.tz) return t.tz;
  const p = String(t?.phone || "").replace(/[^\d+]/g, "");
  if (p.startsWith("+90")) return "Europe/Istanbul";
  if (p.startsWith("+996")) return "Asia/Bishkek";
  if (p.startsWith("+254")) return "Africa/Nairobi";
  if (p.startsWith("+998")) return "Asia/Tashkent";
  return "Asia/Bishkek";
}
export function teacherCity(t) {
  if (t?.city) return t.city;
  const tz = teacherTz(t); const hit = TEACHER_CITIES.find(c => c[1] === tz); return hit ? hit[0] : tzCity(tz);
}
