/**
 * EOF student-portal EMAIL notifications (Google Apps Script on englishonlineforum@gmail.com).
 *
 * Every 10 minutes this script reads the portal's Firestore database (as the project owner) and emails:
 *   • a STUDENT when her teacher or the school sent her something she hasn't read yet
 *     (chat message, badge, stamp, result, comment, answer to her reply);
 *   • a TEACHER when one of her students wrote to her (chat) or replied to a badge/comment/result
 *     (Mr. Mashel's students → mashelauma@gmail.com);
 *   • the SCHOOL (admin) when a student wrote to "The school".
 * Only things that are still UNREAD 5 minutes after they were sent are emailed, so people who are
 * on the website at that moment don't get an email as well. One email per person per run (a short digest).
 * Students whose record has emailNotify == false (admin: student form) get no emails.
 *
 * LESSON REMINDERS (added 27 Nov 2026) — every 5 minutes `sendReminders` emails:
 *   • each STUDENT with a login email: on the morning of a lesson day (from 09:00 in her city) and about
 *     10 minutes before the lesson starts (time in her city);
 *   • each TEACHER (email on her teacher profile; Mr. Mashel's go to mashelauma@gmail.com): one morning list of the
 *     day's lessons (from 07:00 in her city) and about 10 minutes before each lesson;
 *   • the student and the teacher when a lesson is RESCHEDULED (a make-up lesson is created in the portal).
 * Cancelled and rescheduled lessons get no reminders; make-up lessons do. Students whose record has
 * remindEmail == false get no reminders (admin: student form → “Lesson reminders”).
 *
 * SETUP (once): script.google.com → New project “EOF portal notifications” → paste this file as Code.gs and
 * appsscript.json from the same folder (Project Settings → “Show appsscript.json manifest file”) →
 * choose the function “setup” → Run → allow access. It creates the timers (digests every 10 minutes,
 * reminders every 5 minutes) and emails a test message to the school. To stop: run “stop”.
 * After pasting a NEW version of this file, run “setup” once more so the reminder timer is created.
 * Gmail limit on a free account: 100 emails a day.
 */
const PROJECT = 'eof-student-portal';
const SCHOOL_EMAIL = 'englishonlineforum@gmail.com';   // school matters: messages to "The school", setup and summary emails
const MASHEL_EMAIL = 'mashelauma@gmail.com';           // Mr. Mashel's own lessons and students (reminders, his students' chats and replies)
const isMashel_ = function (name) { return norm_(name) === 'mashel auma'; };
const SITE = 'https://www.englishonlineforum.com';
const DELAY_MIN = 5;           // wait this long before emailing (the person may read it on the website)
const MAX_PER_RUN = 40;        // safety limit on emails per run
const BASE = 'https://firestore.googleapis.com/v1/projects/' + PROJECT + '/databases/(default)/documents';

function setup() {
  stop();
  ScriptApp.newTrigger('sendDigests').timeBased().everyMinutes(10).create();
  ScriptApp.newTrigger('sendReminders').timeBased().everyMinutes(5).create();
  const props = PropertiesService.getScriptProperties();
  props.setProperty('cutoff', new Date(Date.now() - DELAY_MIN * 60000).toISOString());
  if (!props.getProperty('mkSince')) props.setProperty('mkSince', new Date().toISOString());
  CacheService.getScriptCache().remove('students');
  const n = listStudents_().length;   // checks that the database can be read
  MailApp.sendEmail(SCHOOL_EMAIL, 'EOF portal notifications are on',
    'Email notifications for the student portal are now running every 10 minutes, and lesson reminders every 5 minutes ' +
    '(morning of the lesson day and about 10 minutes before each lesson, to students and teachers). ' + n + ' student records found.',
    { name: 'English Online Forum' });
}
function stop() { ScriptApp.getProjectTriggers().forEach(function (t) { ScriptApp.deleteTrigger(t); }); }

// ---------- Main job (every 10 minutes) ----------
function sendDigests() {
  const lock = LockService.getScriptLock(); if (!lock.tryLock(5000)) return;
  try {
    const props = PropertiesService.getScriptProperties();
    const until = new Date(Date.now() - DELAY_MIN * 60000);
    const since = new Date(props.getProperty('cutoff') || (until.getTime() - 15 * 60000));
    if (until <= since) return;
    const out = collect_(since, until);
    let sent = 0;
    Object.keys(out).forEach(function (to) {
      if (sent >= MAX_PER_RUN) return;
      const m = out[to];
      try { send_(to, m.subject, m.text, m.html); sent++; }
      catch (e) { console.warn('mail to ' + to + ' failed: ' + e); }
    });
    props.setProperty('cutoff', until.toISOString());
    if (sent) console.log('Sent ' + sent + ' notification email(s).');
  } finally { lock.releaseLock(); }
}

// Works out who gets what for everything that happened between `since` and `until`.
function collect_(since, until) {
  const students = listStudents_(), byId = {};
  students.forEach(function (s) { byId[s.id] = s; });
  const teachers = list_('teachers');
  const teacherEmail = function (name) {
    const k = norm_(name), t = teachers.filter(function (x) { return norm_(x.name) === k && x.email && x.active !== false; })[0];
    return t ? t.email : null;
  };
  const teacherTitle = function (name) {
    const k = norm_(name), t = teachers.filter(function (x) { return norm_(x.name) === k; })[0];
    return t && t.title ? String(t.title).replace(/\.?$/, '.') + ' ' + t.name : (name || 'your teacher');
  };
  const inTime = function (ts) { const d = ts ? new Date(ts) : null; return d && d > since && d <= until; };
  const box = {};   // email → {to, role, name, items[]}
  const add = function (email, role, name, item) {
    if (!email) return;
    email = String(email).trim().toLowerCase();
    (box[email] = box[email] || { role: role, name: name, items: [] }).items.push(item);
  };

  // 1) Chat conversations (inbox/{sid}_{teacher|school})
  query_(null, 'inbox', 'lastAt', since).forEach(function (c) {
    if (!inTime(c.lastAt)) return;
    const s = byId[c.sid]; if (!s) return;
    if (c.lastByRole === 'staff' && c.unreadStudent && wantsEmail_(s)) {
      add(s.email, 'student', s.name, { kind: 'chat', who: c.tid === 'school' ? 'English Online Forum (the school)' : teacherTitle(s.teacher), text: c.lastText, link: SITE + '/eof-account.html#chatCard' });
    }
    if (c.lastByRole === 'student' && c.unreadStaff) {
      const item = { kind: 'chat', who: s.name, text: c.lastText, link: SITE + '/eof-admin.html' };
      if (c.tid === 'school') add(SCHOOL_EMAIL, 'school', 'English Online Forum', item);
      else add(isMashel_(s.teacher) ? MASHEL_EMAIL : (teacherEmail(s.teacher) || SCHOOL_EMAIL), 'teacher', s.teacher, item);   // no teacher email → the school
    }
  });

  // 2) Badges, stamps, results, comments (students/{sid}/feed) — only students who can log in
  students.filter(function (s) { return s.authUid && s.portalBlocked !== true && s.status !== 'left'; }).forEach(function (s) {
    query_('students/' + s.id, 'feed', 'at', since).forEach(function (f) {
      if (!inTime(f.at)) return;
      if (f.byRole !== 'student' && f.readByStudent === false && wantsEmail_(s)) {
        add(s.email, 'student', s.name, { kind: f.type, who: f.byName || teacherTitle(s.teacher), title: f.title, text: f.body, points: f.points, link: SITE + '/eof-account.html#messages' });
      }
      if (f.type === 'reply' && f.readByTeacher === false) {
        add(isMashel_(s.teacher) ? MASHEL_EMAIL : (teacherEmail(s.teacher) || SCHOOL_EMAIL), 'teacher', s.teacher, { kind: 'reply', who: s.name, title: f.title, text: f.body, link: SITE + '/eof-admin.html' });
      }
    });
  });

  const out = {};
  Object.keys(box).forEach(function (to) { out[to] = render_(box[to]); });
  return out;
}

const wantsEmail_ = function (s) { return s.email && s.emailNotify !== false && s.portalBlocked !== true && s.status !== 'left'; };
const norm_ = function (n) { return String(n || '').toLowerCase().replace(/^\s*(mr|mrs|ms|miss|dr)\.?\s+/, '').replace(/\s+/g, ' ').trim(); };

// ---------- Email ----------
const LABEL = { chat: 'New message', award: 'New badge', stamp: 'New stamp', result: 'New result', comment: 'Feedback', milestone: 'Well done', reply: 'Reply' };
function render_(b) {
  const n = b.items.length, first = String(b.name || '').split(' ')[0] || 'there';
  const chats = b.items.filter(function (i) { return i.kind === 'chat'; });
  let subject;
  if (b.role === 'student') subject = n === 1 && chats.length ? 'New message from ' + chats[0].who : n === 1 ? (LABEL[b.items[0].kind] || 'Update') + ' from ' + b.items[0].who : 'You have ' + n + ' new updates from English Online Forum';
  else subject = n === 1 ? (chats.length ? 'New message from ' : 'New reply from ') + b.items[0].who : n + ' new messages from your students';
  const link = b.role === 'student' ? SITE + '/eof-account.html' : SITE + '/eof-admin.html';
  const rows = b.items.map(function (i) {
    return '<tr><td style="padding:12px 16px;border-top:1px solid #E6EBF5">' +
      '<div style="font-size:12px;color:#E0392C;font-weight:bold;letter-spacing:.5px;text-transform:uppercase">' + esc_(LABEL[i.kind] || 'Update') + (i.points ? ' &middot; +' + i.points + ' points' : '') + '</div>' +
      '<div style="font-weight:bold;color:#16264D;margin-top:2px">' + esc_(i.title || ('From ' + i.who)) + '</div>' +
      (i.title ? '<div style="font-size:13px;color:#6B7385">From ' + esc_(i.who) + '</div>' : '') +
      (i.text ? '<div style="margin-top:6px;color:#232B3D;white-space:pre-wrap">' + esc_(clip_(i.text, 300)) + '</div>' : '') +
      '</td></tr>';
  }).join('');
  const html = '<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;color:#232B3D">' +
    brandHead_(first) +
    '<table style="width:100%;border-collapse:collapse;background:#fff;border:1px solid #E6EBF5;border-top:0">' + rows + '</table>' +
    '<p style="margin:18px 0"><a href="' + link + '" style="background:#E0392C;color:#fff;text-decoration:none;font-weight:bold;padding:12px 22px;border-radius:999px;display:inline-block">' +
    (b.role === 'student' ? 'Open my student portal' : 'Open the staff area') + '</a></p>' +
    '<p style="font-size:12px;color:#6B7385">Please reply in the portal, not to this email. ' +
    (b.role === 'student' ? 'Don’t want these emails? Tell your teacher or the school and we’ll switch them off.' : '') + '</p>' + brandFoot_() + '</div>';
  const text = 'Hello ' + first + '!\n\n' + b.items.map(function (i) {
    return '• ' + (LABEL[i.kind] || 'Update') + ' — ' + (i.title || 'from ' + i.who) + (i.text ? '\n  ' + clip_(i.text, 300) : '');
  }).join('\n') + '\n\nOpen: ' + link + '\nPlease reply in the portal, not to this email.';
  return { subject: subject, html: html, text: text };
}
function esc_(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function clip_(s, n) { s = String(s || ''); return s.length > n ? s.slice(0, n - 1) + '…' : s; }

// ---------- Firestore REST (runs as the project owner, so the security rules don't apply) ----------
function fetch_(url, payload) {
  const opt = { method: payload ? 'post' : 'get', muteHttpExceptions: true, contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken(), 'x-goog-user-project': PROJECT } };
  if (payload) opt.payload = JSON.stringify(payload);
  const r = UrlFetchApp.fetch(url, opt), code = r.getResponseCode(), body = r.getContentText();
  if (code !== 200) throw new Error('Firestore ' + code + ': ' + body.slice(0, 300));
  return JSON.parse(body || '{}');
}
function list_(collection) {
  let out = [], token = '';
  do {
    const j = fetch_(BASE + '/' + collection + '?pageSize=300' + (token ? '&pageToken=' + encodeURIComponent(token) : ''));
    (j.documents || []).forEach(function (d) { out.push(doc_(d)); });
    token = j.nextPageToken || '';
  } while (token);
  return out;
}
function listStudents_() {
  const c = CacheService.getScriptCache(), hit = c.get('students');
  if (hit) return JSON.parse(hit);
  const s = list_('students').map(function (x) { return { id: x.id, name: x.name, email: x.email, authUid: x.authUid, teacher: x.teacher, status: x.status, portalBlocked: x.portalBlocked, emailNotify: x.emailNotify,
    remindEmail: x.remindEmail, lessonDays: x.lessonDays, lessonSlots: x.lessonSlots, lessonTime: x.lessonTime, tz: x.tz, city: x.city, country: x.country, studentNumber: x.studentNumber }; });
  try { c.put('students', JSON.stringify(s), 900); } catch (e) { }
  return s;
}
// Documents in `parent/collection` whose `field` (a timestamp) is after `since`.
function query_(parent, collection, field, since) {
  const url = BASE + (parent ? '/' + parent : '') + ':runQuery';
  const res = fetch_(url, { structuredQuery: { from: [{ collectionId: collection }],
    where: { fieldFilter: { field: { fieldPath: field }, op: 'GREATER_THAN', value: { timestampValue: since.toISOString() } } } } });
  return (res || []).filter(function (r) { return r.document; }).map(function (r) { return doc_(r.document); });
}
function doc_(d) { const o = val_({ mapValue: { fields: d.fields || {} } }); o.id = String(d.name).split('/').pop(); return o; }
function val_(v) {
  if (!v) return null;
  if ('stringValue' in v) return v.stringValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return v.doubleValue;
  if ('timestampValue' in v) return v.timestampValue;
  if ('nullValue' in v) return null;
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(val_);
  if ('mapValue' in v) { const o = {}, f = v.mapValue.fields || {}; Object.keys(f).forEach(function (k) { o[k] = val_(f[k]); }); return o; }
  return null;
}


// =====================================================================================================
// LESSON REMINDERS (every 5 minutes)
// =====================================================================================================
const MORNING_HOUR = 9;          // students: morning reminder from 09:00 in the city where she lives
const TEACHER_MORNING_HOUR = 7;  // teachers: the day's lesson list from 07:00 in her city
const SOON_MIN = 3, SOON_MAX = 14;   // "about 10 minutes before": sent when the lesson starts in 3–14 minutes
const MAX_REMIND_PER_RUN = 30;
const DAY_KEYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_LONG = { Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday' };

function sendReminders() {
  const lock = LockService.getScriptLock(); if (!lock.tryLock(5000)) return;
  try {
    const props = PropertiesService.getScriptProperties();
    const now = new Date();
    const plan = planReminders_(now, props);
    let sent = 0;
    plan.forEach(function (m) {
      if (sent >= MAX_REMIND_PER_RUN) return;
      try { send_(m.to, m.subject, m.text, m.html); props.setProperty(m.key, todayUtc_()); sent++; }
      catch (e) { console.warn('reminder to ' + m.to + ' failed: ' + e); }
    });
    props.setProperty('mkSince', now.toISOString());
    pruneKeys_(props);
    if (sent) console.log('Sent ' + sent + ' reminder email(s).');
  } finally { lock.releaseLock(); }
}

// Works out which reminder emails are due now. Returns [{key, to, subject, text, html}] — keys already sent are skipped.
function planReminders_(now, props, opt) {
  opt = opt || {};
  const students = listStudents_().filter(function (s) { return (s.status || 'active') === 'active' && s.portalBlocked !== true; });
  const teachers = list_('teachers');
  const tOf = function (name) { const k = norm_(name); return teachers.filter(function (x) { return norm_(x.name) === k; })[0] || (k === 'mashel auma' ? { name: 'Mashel Auma', title: 'Mr', tz: 'Asia/Bishkek', city: 'Bishkek', role: 'admin' } : null); };
  const tEmail = function (t) { return t && isMashel_(t.name) ? MASHEL_EMAIL : t && t.email && t.active !== false && t.role !== 'admin' ? t.email : SCHOOL_EMAIL; };
  const tTitle = function (t, name) { return t && t.title ? String(t.title).replace(/\.?$/, '.') + ' ' + t.name : (name || 'your teacher'); };
  const done = function (k) { return !!props.getProperty(k); };
  const out = [], teacherDay = {};
  const sinceMk = new Date(props.getProperty('mkSince') || (now.getTime() - 10 * 60000));

  students.forEach(function (s) {
    const lessons = lessonsAround_(s, now);
    const t = tOf(s.teacher), ttz = teacherTz_(t), tcity = teacherCity_(t);
    lessons.forEach(function (L) {
      if (L.far || L.status === 'cancelled' || L.status === 'rescheduled') return;
      const startMs = L.start.getTime(), mins = (startMs - now.getTime()) / 60000;
      const sLocal = localParts_(now, L.tz), sToday = sLocal.date;
      const info = lessonInfo_(L, s, t, ttz, tcity);
      // Student — morning of the lesson day (her own date), only if the lesson is still at least 30 minutes away
      if (wantsReminders_(s) && L.date === sToday && (opt.force ? mins > 15 : sLocal.hour >= MORNING_HOUR && mins > 30)) {
        const k = 'r:m:' + s.id + ':' + L.id;
        if (!done(k)) out.push(mailStudent_(k, s, info, 'morning', tTitle(t, s.teacher)));
      }
      // Student — about 10 minutes before
      if (!opt.force && wantsReminders_(s) && mins >= SOON_MIN && mins <= SOON_MAX) {
        const k = 'r:s:' + s.id + ':' + L.id;
        if (!done(k)) out.push(mailStudent_(k, s, info, 'soon', tTitle(t, s.teacher)));
      }
      // Teacher — collect today's lessons (teacher's date) for one morning list
      const tLocal = localParts_(now, ttz), lt = localParts_(L.start, ttz);
      if (lt.date === tLocal.date) {
        const to = tEmail(t), d = teacherDay[to] || (teacherDay[to] = { to: to, t: t, name: s.teacher, tz: ttz, city: tcity, hour: tLocal.hour, date: tLocal.date, items: [] });
        d.items.push(info);
      }
      // Teacher — about 10 minutes before
      if (!opt.force && mins >= SOON_MIN && mins <= SOON_MAX) {
        const k = 'r:ts:' + s.id + ':' + L.id;
        if (!done(k)) out.push(mailTeacherSoon_(k, tEmail(t), t, s, info));
      }
    });
    // Rescheduled lessons created since the last run → tell the student and the teacher right away
    if (!opt.force) lessons.filter(function (L) { return L.makeup && L.at && new Date(L.at) > sinceMk && L.start > now; }).forEach(function (L) {
      const info = lessonInfo_(L, s, t, ttz, tcity);
      const k1 = 'r:mv:' + s.id + ':' + L.id;
      if (wantsReminders_(s) && !done(k1)) out.push(mailMoved_(k1, s.email, 'student', s, t, info, tTitle(t, s.teacher)));
      const k2 = 'r:tmv:' + s.id + ':' + L.id;
      const byMe = L.by && (String(L.by).toLowerCase() === String(tEmail(t)).toLowerCase() || (t && isMashel_(t.name) && String(L.by).toLowerCase() === SCHOOL_EMAIL));
      if (!done(k2) && !byMe) out.push(mailMoved_(k2, tEmail(t), 'teacher', s, t, info, tTitle(t, s.teacher)));
    });
  });

  Object.keys(teacherDay).forEach(function (to) {
    const d = teacherDay[to];
    if (!opt.force && d.hour < TEACHER_MORNING_HOUR) return;
    const left = d.items.filter(function (i) { return i.start.getTime() - now.getTime() > (opt.force ? 15 : 30) * 60000; });
    if (!left.length) return;
    const k = 'r:tm:' + to + ':' + d.date;
    if (done(k)) return;
    d.items.sort(function (a, b) { return a.start - b.start; });
    out.push(mailTeacherDay_(k, d));
  });
  return out;
}
// ONE-OFF (run by hand): send today's morning reminders RIGHT NOW to every student and teacher who still has a
// lesson later today (15+ minutes away), whatever the time, and email the school a copy of each one.
// The normal 09:00 / 07:00 run then skips them (no duplicates); the 10-minute reminders still go out as usual.
function sendTodayNow() {
  const lock = LockService.getScriptLock(); if (!lock.tryLock(10000)) return;
  try {
    const props = PropertiesService.getScriptProperties();
    CacheService.getScriptCache().remove('students');
    const plan = planReminders_(new Date(), props, { force: true });
    const done = [];
    plan.forEach(function (m) {
      try {
        send_(m.to, m.subject, m.text, m.html);
        props.setProperty(m.key, todayUtc_()); done.push(m.to + ' — ' + m.subject);
        if (m.to !== SCHOOL_EMAIL) send_(SCHOOL_EMAIL, '[Copy] To ' + m.to + ': ' + m.subject, m.text,
          '<p style="font-family:Arial;color:#6B7385;font-size:13px">Copy of the reminder sent to <b>' + esc_(m.to) + '</b>:</p>' + m.html);
      } catch (e) { console.warn('reminder to ' + m.to + ' failed: ' + e); }
    });
    MailApp.sendEmail(SCHOOL_EMAIL, 'Today\'s lesson reminders: ' + done.length + ' sent', done.length ? 'Sent now:\n' + done.join('\n') : 'No students or teachers have a lesson later today (or they have no email on their record).', { name: 'English Online Forum' });
    console.log('Sent ' + done.length + ' reminder(s) now:\n' + done.join('\n'));
  } finally { lock.releaseLock(); }
}

const wantsReminders_ = function (s) { return s.email && s.remindEmail !== false; };

// A student's lessons from yesterday to tomorrow (her dates): regular lesson days + make-ups, with their marks.
// → [{id, date, time, tz, city, lessons, start (Date), status, makeup, fromDate, note, at, by}]
function lessonsAround_(s, now) {
  const tz0 = s.tz || null, out = [];
  if (!tz0 && !(s.lessonSlots || s.lessonTime)) return out;
  const today = localParts_(now, tz0 || 'Asia/Bishkek').date;
  const dates = [addDays_(today, -1), today, addDays_(today, 1)];
  const regular = [];
  dates.forEach(function (d) {
    const dk = dayKeyOf_(d); if ((s.lessonDays || []).indexOf(dk) < 0) return;
    const x = (s.lessonSlots || {})[dk] || {};
    let time = x.time, tz = x.tz || tz0, city = x.city || s.city || '';
    if (!time && s.lessonTime) { const m = String(s.lessonTime).match(/(\d{1,2})[:.](\d{2})/); if (m) time = ('0' + m[1]).slice(-2) + ':' + m[2]; if (/bishkek/i.test(s.lessonTime)) { tz = 'Asia/Bishkek'; city = 'Bishkek'; } }
    if (!time || !tz) return;
    regular.push({ id: d, date: d, time: time, tz: tz, city: city, lessons: x.lessons || 1 });
  });
  // Marks for those days (one small read each) and make-up lessons (only make-ups have a `date` field)
  const marks = {};
  if (regular.length) batchGet_(regular.map(function (L) { return 'students/' + s.id + '/attendance/' + L.id; })).forEach(function (d) { marks[d.id] = d; });
  regular.forEach(function (L) { const m = marks[L.id]; L.status = m ? m.status : null; if (m && m.lessons) L.lessons = m.lessons; if (m) { L.movedDate = m.movedDate; L.movedTime = m.movedTime; } out.push(L); });
  query2_('students/' + s.id, 'attendance', 'date', 'GREATER_THAN_OR_EQUAL', { stringValue: dates[0] }).forEach(function (m) {
    if (!m.makeup || !m.time) return;   // later make-ups are kept too (far: true), for the "lesson moved" email
    out.push({ id: m.id, date: m.date, time: m.time, tz: m.tz || tz0, city: m.city || s.city || '', lessons: m.lessons || 1, status: m.status || null, makeup: true, fromDate: m.fromDate, note: m.note, at: m.at, by: m.by, far: m.date > dates[2] });
  });
  out.forEach(function (L) { L.start = new Date(wallToMs_(L.date, L.time, L.tz)); });
  return out.filter(function (L) { return L.tz; });
}

function lessonInfo_(L, s, t, ttz, tcity) {
  const sp = localParts_(L.start, L.tz), tp = localParts_(L.start, ttz);
  return { start: L.start, id: L.id, makeup: !!L.makeup, fromDate: L.fromDate, note: L.note, lessons: L.lessons, student: s.name,
    sTime: sp.time, sDate: sp.date, sCity: L.city || cityOf_(L.tz), tTime: tp.time, tDate: tp.date, tCity: tcity, sameZone: L.tz === ttz };
}

// ---------- Reminder emails ----------
function mailStudent_(key, s, i, kind, teacher) {
  const first = String(s.name || '').split(' ')[0] || 'there';
  const when = i.sTime + ' (' + i.sCity + ' time)';
  const what = (i.lessons == 2 ? 'double English lesson' : 'English lesson') + ' with ' + teacher;
  const subject = kind === 'soon' ? 'Your lesson starts in about 10 minutes — ' + i.sTime : 'Reminder: English lesson today at ' + i.sTime;
  const lead = kind === 'soon' ? 'Your ' + what + ' starts in about 10 minutes, at <b>' + esc_(when) + '</b>. Get ready — see you soon!'
    : 'You have an ' + what + ' <b>today at ' + esc_(when) + '</b>.';
  const extra = i.makeup ? 'This is a make-up lesson' + (i.fromDate ? ' for ' + prettyShort_(i.fromDate) : '') + '.' + (i.note ? ' ' + i.note : '') : '';
  return { key: key, to: s.email, subject: subject, html: shell_(first, '<p style="margin:0 0 10px;font-size:15px">' + lead + '</p>' + (extra ? '<p style="margin:0;color:#3A57AB">' + esc_(extra) + '</p>' : ''), SITE + '/eof-account.html', 'Open my student portal',
    'Can’t make it? Tell ' + esc_(teacher) + ' or the school in the portal chat as early as possible.'),
    text: 'Hello ' + first + '!\n\n' + (kind === 'soon' ? 'Your ' + what + ' starts in about 10 minutes, at ' + when + '.' : 'You have an ' + what + ' today at ' + when + '.') + (extra ? '\n' + extra : '') + '\n\nStudent portal: ' + SITE + '/eof-account.html' };
}
function mailTeacherSoon_(key, to, t, s, i) {
  const first = t ? String(t.name || '').split(' ')[0] : 'there';
  const both = i.tTime + ' ' + i.tCity + (i.sameZone ? '' : ' · ' + i.sTime + ' ' + i.sCity);
  return { key: key, to: to, subject: 'Lesson with ' + s.name + ' in about 10 minutes (' + i.tTime + ' ' + i.tCity + ')',
    html: shell_(first, '<p style="margin:0 0 10px;font-size:15px">Your ' + (i.lessons == 2 ? 'double ' : '') + 'lesson with <b>' + esc_(s.name) + '</b> starts in about 10 minutes: <b>' + esc_(both) + '</b>.</p>' +
      (i.makeup ? '<p style="margin:0;color:#3A57AB">Make-up lesson' + (i.fromDate ? ' for ' + esc_(prettyShort_(i.fromDate)) : '') + '.</p>' : ''), SITE + '/eof-admin.html', 'Open attendance', 'Mark attendance in the staff area after the lesson.'),
    text: 'Your lesson with ' + s.name + ' starts in about 10 minutes: ' + both + '.' + (i.makeup ? ' (make-up lesson)' : '') + '\n\nStaff area: ' + SITE + '/eof-admin.html' };
}
function mailTeacherDay_(key, d) {
  const first = d.t ? String(d.t.name || '').split(' ')[0] : 'there';
  const rows = d.items.map(function (i) {
    return '<tr><td style="padding:9px 12px;border-top:1px solid #E6EBF5;font-weight:bold;color:#16264D;white-space:nowrap">' + esc_(i.tTime) + '</td>' +
      '<td style="padding:9px 12px;border-top:1px solid #E6EBF5"><b>' + esc_(i.student) + '</b>' + (i.lessons == 2 ? ' · double' : '') + (i.makeup ? ' · <span style="color:#3A57AB">make-up</span>' : '') +
      (i.sameZone ? '' : '<div style="font-size:12px;color:#6B7385">' + esc_(i.sTime + ' in ' + i.sCity) + (i.sDate !== i.tDate ? ' (' + esc_(prettyShort_(i.sDate)) + ')' : '') + '</div>') + '</td></tr>';
  }).join('');
  const n = d.items.length;
  return { key: key, to: d.to, subject: 'Your lessons today: ' + n + ' lesson' + (n === 1 ? '' : 's') + ' (' + d.items[0].tTime + ' first)',
    html: shell_(first, '<p style="margin:0 0 10px;font-size:15px">Here are your lessons for today (' + esc_(d.city) + ' time):</p><table style="width:100%;border-collapse:collapse;background:#fff;border:1px solid #E6EBF5">' + rows + '</table>',
      SITE + '/eof-admin.html', 'Open attendance', 'You’ll also get an email about 10 minutes before each lesson.'),
    text: 'Your lessons today (' + d.city + ' time):\n' + d.items.map(function (i) { return '• ' + i.tTime + ' ' + i.student + (i.lessons == 2 ? ' (double)' : '') + (i.makeup ? ' (make-up)' : '') + (i.sameZone ? '' : ' — ' + i.sTime + ' in ' + i.sCity); }).join('\n') + '\n\nStaff area: ' + SITE + '/eof-admin.html' };
}
function mailMoved_(key, to, role, s, t, i, teacher) {
  const student = role === 'student';
  const first = student ? String(s.name || '').split(' ')[0] : (t ? String(t.name || '').split(' ')[0] : 'there');
  const when = student ? prettyShort_(i.sDate) + ', ' + i.sTime + ' (' + i.sCity + ' time)' : prettyShort_(i.tDate) + ', ' + i.tTime + ' ' + i.tCity + (i.sameZone ? '' : ' · ' + i.sTime + ' ' + i.sCity);
  const from = i.fromDate ? prettyShort_(i.fromDate) : '';
  const line = student ? 'Your lesson' + (from ? ' on ' + from : '') + ' has been moved to <b>' + esc_(when) + '</b>.'
    : 'The lesson with <b>' + esc_(s.name) + '</b>' + (from ? ' on ' + esc_(from) : '') + ' has been moved to <b>' + esc_(when) + '</b>.';
  return { key: key, to: to, subject: (student ? 'Lesson rescheduled: ' : 'Rescheduled: ' + s.name + ' — ') + prettyShort_(student ? i.sDate : i.tDate) + ' ' + (student ? i.sTime : i.tTime),
    html: shell_(first, '<p style="margin:0 0 10px;font-size:15px">' + line + '</p>' + (i.note ? '<p style="margin:0;color:#3A57AB">' + esc_(i.note) + '</p>' : ''), SITE + (student ? '/eof-account.html' : '/eof-admin.html'), student ? 'Open my student portal' : 'Open the staff area',
      student ? 'We’ll remind you on the morning of the lesson and about 10 minutes before it starts.' : ''),
    text: (student ? 'Your lesson' : 'The lesson with ' + s.name) + (from ? ' on ' + from : '') + ' has been moved to ' + when + '.' + (i.note ? '\n' + i.note : '') + '\n\n' + SITE + (student ? '/eof-account.html' : '/eof-admin.html') };
}
function shell_(first, inner, link, button, foot) {
  return '<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;color:#232B3D">' +
    brandHead_(first) +
    '<div style="background:#fff;border:1px solid #E6EBF5;border-top:0;padding:16px 18px">' + inner + '</div>' +
    '<p style="margin:18px 0"><a href="' + link + '" style="background:#E0392C;color:#fff;text-decoration:none;font-weight:bold;padding:12px 22px;border-radius:999px;display:inline-block">' + button + '</a></p>' +
    (foot ? '<p style="font-size:12px;color:#6B7385">' + foot + '</p>' : '') + brandFoot_() + '</div>';
}

// ---------- Time zones (IANA names, e.g. Asia/Bishkek, Europe/Istanbul) ----------
function offsetMin_(tz, ms) {
  const z = Utilities.formatDate(new Date(ms), tz, 'Z');   // "+0600"
  const sign = z.charAt(0) === '-' ? -1 : 1;
  return sign * (Number(z.substr(1, 2)) * 60 + Number(z.substr(3, 2)));
}
function wallToMs_(date, time, tz) {
  const p = date.split('-').map(Number), q = String(time).split(':').map(Number);
  const wall = Date.UTC(p[0], p[1] - 1, p[2], q[0], q[1] || 0);
  let ms = wall - offsetMin_(tz, wall) * 60000; ms = wall - offsetMin_(tz, ms) * 60000;
  return ms;
}
function localParts_(d, tz) {
  const s = Utilities.formatDate(d, tz, 'yyyy-MM-dd HH:mm');
  return { date: s.slice(0, 10), time: s.slice(11, 16), hour: Number(s.slice(11, 13)) };
}
function addDays_(iso, n) { const p = iso.split('-').map(Number); const d = new Date(Date.UTC(p[0], p[1] - 1, p[2] + n)); return d.toISOString().slice(0, 10); }
function dayKeyOf_(iso) { const p = iso.split('-').map(Number); return DAY_KEYS[(new Date(Date.UTC(p[0], p[1] - 1, p[2])).getUTCDay() + 6) % 7]; }
function prettyShort_(iso) { const p = iso.split('-').map(Number); const d = new Date(Date.UTC(p[0], p[1] - 1, p[2])); return DAY_LONG[DAY_KEYS[(d.getUTCDay() + 6) % 7]] + ' ' + p[2] + ' ' + ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][p[1] - 1]; }
const CITY_OF_TZ = { 'Asia/Bishkek': 'Bishkek', 'Europe/Istanbul': 'İstanbul', 'Africa/Nairobi': 'Nairobi', 'Asia/Almaty': 'Almaty', 'Asia/Tashkent': 'Tashkent', 'Europe/Moscow': 'Moscow', 'Europe/London': 'London' };
function cityOf_(tz) { return CITY_OF_TZ[tz] || String(tz || '').split('/').pop().replace(/_/g, ' '); }
function teacherTz_(t) {
  if (t && t.tz) return t.tz;
  const p = String((t && t.phone) || '').replace(/[^\d+]/g, '');
  if (p.indexOf('+90') === 0) return 'Europe/Istanbul';
  if (p.indexOf('+996') === 0) return 'Asia/Bishkek';
  if (p.indexOf('+254') === 0) return 'Africa/Nairobi';
  if (p.indexOf('+998') === 0) return 'Asia/Tashkent';
  return 'Asia/Bishkek';
}
function teacherCity_(t) { return (t && t.city) || cityOf_(teacherTz_(t)); }
function todayUtc_() { return new Date().toISOString().slice(0, 10); }
// Sent-reminder markers are kept 4 days, then removed
function pruneKeys_(props) {
  const all = props.getProperties(), cut = addDays_(todayUtc_(), -4);
  Object.keys(all).forEach(function (k) { if (k.indexOf('r:') === 0 && all[k] < cut) props.deleteProperty(k); });
}

// ---------- Firestore helpers for reminders ----------
function batchGet_(paths) {
  const root = 'projects/' + PROJECT + '/databases/(default)/documents/';
  const res = fetch_(BASE + ':batchGet', { documents: paths.map(function (p) { return root + p; }) });
  return (res || []).filter(function (r) { return r.found; }).map(function (r) { return doc_(r.found); });
}
function query2_(parent, collection, field, op, value) {
  const res = fetch_(BASE + '/' + parent + ':runQuery', { structuredQuery: { from: [{ collectionId: collection }],
    where: { fieldFilter: { field: { fieldPath: field }, op: op, value: value } } } });
  return (res || []).filter(function (r) { return r.document; }).map(function (r) { return doc_(r.document); });
}

// DIAGNOSTIC (run by hand): lists every active student's lessons today and whether a reminder can reach them.
function todayReport() {
  CacheService.getScriptCache().remove('students');
  const now = new Date(), rows = [];
  listStudents_().filter(function (s) { return (s.status || 'active') === 'active'; }).forEach(function (s) {
    const tz = s.tz || 'Asia/Bishkek', today = localParts_(now, tz).date;
    lessonsAround_(s, now).filter(function (L) { return L.date === today && !L.far; }).forEach(function (L) {
      const mins = Math.round((L.start - now) / 60000);
      rows.push([s.name, s.teacher || '-', L.time + ' ' + (L.city || ''), L.status || '', s.email || 'NO EMAIL', s.remindEmail === false ? 'reminders OFF' : '', s.portalBlocked ? 'blocked' : '', mins > 0 ? 'in ' + mins + ' min' : 'already started/past'].join(' | '));
    });
    if (!(s.lessonDays || []).length) rows.push([s.name, s.teacher || '-', 'NO LESSON DAYS', '', s.email || 'NO EMAIL'].join(' | '));
    const slotsTxt = (s.lessonDays || []).map(function (d) { const x = (s.lessonSlots || {})[d] || {}; return d + ' ' + (x.time || '?') + (x.lessons == 2 ? 'x2' : ''); }).join(', ');
    if (/latif/i.test(s.name)) {
      rows.push('   ' + s.name + ' timetable: ' + slotsTxt + ' | tz ' + (s.tz || '?'));
      list_('students/' + s.id + '/attendance').filter(function (a) { return (a.date || a.id.slice(0, 10)) >= addDays_(today, -1); }).forEach(function (a) {
        rows.push('   attendance ' + a.id + ': ' + JSON.stringify({ status: a.status, makeup: a.makeup, date: a.date, time: a.time, lessons: a.lessons, fromDate: a.fromDate, movedDate: a.movedDate, movedTime: a.movedTime, at: a.at, markedAt: a.markedAt }));
      });
    }
  });
  console.log(rows.join('\n'));
}


// ---------- Brand: logo in the header, the EOF penguin in the footer (inline images, so they show without "load images") ----------
const LOGO_URL = 'https://www.englishonlineforum.com/logo-192.png';
const MASCOT_URL = 'https://raw.githubusercontent.com/Englishonlineschool/eof/723e418dff604f9bc9c5df7caf698a55173a5dea/eof-mascot-email.png';
let IMGS_ = null;
function brandImages_() {
  if (IMGS_) return IMGS_;
  IMGS_ = {};
  [['eoflogo', LOGO_URL], ['eofmascot', MASCOT_URL]].forEach(function (x) {
    try { const r = UrlFetchApp.fetch(x[1], { muteHttpExceptions: true }); if (r.getResponseCode() === 200) IMGS_[x[0]] = r.getBlob().setName(x[0] + '.png'); }
    catch (e) { console.warn('image ' + x[0] + ': ' + e); }
  });
  return IMGS_;
}
function brandHead_(first) {
  const logo = brandImages_().eoflogo;
  return '<table role="presentation" style="width:100%;border-collapse:collapse;background:#16264D;border-radius:12px 12px 0 0;border-bottom:4px solid #E0392C"><tr>' +
    (logo ? '<td style="width:68px;padding:14px 0 14px 18px;vertical-align:middle"><img src="cid:eoflogo" width="56" height="56" alt="English Online Forum" style="display:block;border-radius:50%"></td>' : '') +
    '<td style="padding:14px 20px 14px ' + (logo ? '12px' : '20px') + ';vertical-align:middle;color:#fff">' +
    '<div style="font-size:12px;letter-spacing:2px;color:#E3A94C;font-weight:bold">ENGLISH ONLINE FORUM</div>' +
    '<div style="font-size:20px;font-weight:bold;margin-top:4px;color:#fff">Hello ' + esc_(first) + '!</div></td></tr></table>';
}
function brandFoot_() {
  const pen = brandImages_().eofmascot;
  return '<table role="presentation" style="width:100%;border-collapse:collapse;border-top:1px solid #E6EBF5;margin-top:8px"><tr>' +
    (pen ? '<td style="width:52px;padding:10px 8px 4px 0;vertical-align:bottom"><img src="cid:eofmascot" width="44" height="58" alt="" style="display:block"></td>' : '') +
    '<td style="padding:10px 0 4px;vertical-align:middle;font-family:Arial,Helvetica,sans-serif">' +
    '<div style="font-size:13px;font-weight:bold;color:#16264D">Language is Freedom</div>' +
    '<div style="font-size:11px;color:#9AA0AC">English Online Forum · <a href="https://www.englishonlineforum.com" style="color:#9AA0AC">www.englishonlineforum.com</a></div></td></tr></table>';
}
function send_(to, subject, text, html) {
  const imgs = brandImages_(), used = {};
  Object.keys(imgs).forEach(function (k) { if (html.indexOf('cid:' + k) >= 0) used[k] = imgs[k]; });
  MailApp.sendEmail(to, subject, text, { name: 'English Online Forum', htmlBody: html, inlineImages: used });
}

// SAMPLE (run by hand): emails Mr. Mashel (mashelauma@gmail.com) one example of each lesson email, made from
// his next real lesson today (or a made-up one if there is none). Nothing is sent to students or teachers.
function sendSamplesToMe() {
  CacheService.getScriptCache().remove('students');
  const now = new Date(), students = listStudents_().filter(function (s) { return (s.status || 'active') === 'active'; });
  let pick = null;
  students.forEach(function (s) { if (pick) return; lessonsAround_(s, now).filter(function (L) { return !L.far && L.start > now && !L.status; }).forEach(function (L) { if (!pick) pick = { s: s, L: L }; }); });
  if (!pick) pick = { s: { name: 'Sample Student', teacher: 'Mashel Auma', email: MASHEL_EMAIL }, L: { id: 'x', date: localParts_(now, 'Asia/Bishkek').date, time: '18:00', tz: 'Asia/Bishkek', city: 'Bishkek', lessons: 1, start: new Date(now.getTime() + 6 * 3600000) } };
  const teachers = list_('teachers'), k = norm_(pick.s.teacher);
  const t = teachers.filter(function (x) { return norm_(x.name) === k; })[0] || { name: 'Mashel Auma', title: 'Mr', tz: 'Asia/Bishkek', city: 'Bishkek' };
  const title = t.title ? String(t.title).replace(/\.?$/, '.') + ' ' + t.name : t.name;
  const info = lessonInfo_(pick.L, pick.s, t, teacherTz_(t), teacherCity_(t));
  const mk = Object.assign({}, info, { makeup: true, fromDate: addDays_(info.sDate, -1), note: 'Make-up for the lesson we missed yesterday.' });
  const mails = [
    mailStudent_('x', pick.s, info, 'morning', title),
    mailStudent_('x', pick.s, info, 'soon', title),
    mailTeacherDay_('x', { to: MASHEL_EMAIL, t: t, city: teacherCity_(t), items: [info] }),
    mailTeacherSoon_('x', MASHEL_EMAIL, t, pick.s, info),
    mailMoved_('x', MASHEL_EMAIL, 'student', pick.s, t, mk, title)
  ];
  const labels = ['Student — morning reminder', 'Student — 10 minutes before', 'Teacher — morning list', 'Teacher — 10 minutes before', 'Student — lesson rescheduled'];
  mails.forEach(function (m, i) { send_(MASHEL_EMAIL, '[Sample ' + (i + 1) + '/5: ' + labels[i] + '] ' + m.subject, m.text, m.html); });
  console.log('Sent 5 samples to ' + MASHEL_EMAIL + ' (based on ' + pick.s.name + ', ' + info.sTime + ' ' + info.sCity + ')');
}

// CORRECTION (run by hand): emails a student today's lessons AS THEY ARE NOW in the portal, saying it replaces
// the earlier reminder; copies the teacher. resendLatifaToday() is the one-click version for Latifa (27 Nov 2026).
function resendLatifaToday() { resendToday_(/latif/i); }
function resendToday_(re) {
  CacheService.getScriptCache().remove('students');
  const now = new Date(), s = listStudents_().filter(function (x) { return re.test(x.name) && (x.status || 'active') === 'active'; })[0];
  if (!s || !s.email) { console.log('No active student with an email matches ' + re); return; }
  const teachers = list_('teachers'), k = norm_(s.teacher);
  const t = teachers.filter(function (x) { return norm_(x.name) === k; })[0] || (k === 'mashel auma' ? { name: 'Mashel Auma', title: 'Mr', tz: 'Asia/Bishkek', city: 'Bishkek' } : null);
  const title = t && t.title ? String(t.title).replace(/\.?$/, '.') + ' ' + t.name : (s.teacher || 'your teacher');
  const tz = s.tz || 'Asia/Bishkek', today = localParts_(now, tz).date;
  const all = lessonsAround_(s, now).filter(function (L) { return !L.far && L.date === today; }).sort(function (a, b) { return a.start - b.start; });
  const live = all.filter(function (L) { return L.status !== 'cancelled' && L.status !== 'rescheduled'; });
  const city = (all[0] && all[0].city) || s.city || cityOf_(tz), first = String(s.name).split(' ')[0];
  const line = function (L) { return '<li style="margin:4px 0"><b>' + esc_(L.time) + '</b> (' + esc_(L.city || city) + ' time)' + (L.lessons == 2 ? ' · double lesson' : '') + (L.makeup ? ' · make-up lesson' : '') + '</li>'; };
  const changed = all.filter(function (L) { return L.status === 'cancelled' || L.status === 'rescheduled'; }).map(function (L) {
    return '<li style="margin:4px 0;color:#6B7385"><s>' + esc_(L.time) + '</s> — ' + (L.status === 'cancelled' ? 'cancelled' : 'moved to ' + esc_(L.movedDate ? prettyShort_(L.movedDate) : 'another day') + (L.movedTime ? ', ' + esc_(L.movedTime) : '')) + '</li>'; }).join('');
  const inner = '<p style="margin:0 0 10px;font-size:15px"><b>Please ignore our earlier reminder</b> — your lesson plan for today has changed.</p>' +
    (live.length ? '<p style="margin:0 0 6px">Your English ' + (live.length > 1 ? 'lessons' : 'lesson') + ' with ' + esc_(title) + ' today:</p><ul style="margin:0 0 10px;padding-left:20px">' + live.map(line).join('') + '</ul>'
      : '<p style="margin:0 0 10px">You have <b>no lesson today</b>.</p>') +
    (changed ? '<p style="margin:8px 0 4px;color:#6B7385">Changed:</p><ul style="margin:0;padding-left:20px">' + changed + '</ul>' : '');
  const subject = live.length ? 'Updated: your English lesson today at ' + live.map(function (L) { return L.time; }).join(' & ') : 'Update: no English lesson today';
  const text = 'Hello ' + first + '!\n\nPlease ignore our earlier reminder — your lesson plan for today has changed.\n' +
    (live.length ? live.map(function (L) { return '• ' + L.time + ' (' + (L.city || city) + ' time)' + (L.lessons == 2 ? ', double' : ''); }).join('\n') : 'You have no lesson today.') + '\n\n' + SITE + '/eof-account.html';
  const html = '<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;color:#232B3D">' + brandHead_(first) +
    '<div style="background:#fff;border:1px solid #E6EBF5;border-top:0;padding:16px 18px">' + inner + '</div>' +
    '<p style="margin:18px 0"><a href="' + SITE + '/eof-account.html" style="background:#E0392C;color:#fff;text-decoration:none;font-weight:bold;padding:12px 22px;border-radius:999px;display:inline-block">Open my student portal</a></p>' +
    brandFoot_() + '</div>';
  send_(s.email, subject, text, html);
  const to = t && isMashel_(t.name) ? MASHEL_EMAIL : (t && t.email) || SCHOOL_EMAIL;
  send_(to, '[Copy] To ' + s.email + ': ' + subject, text, '<p style="font-family:Arial;color:#6B7385;font-size:13px">Copy of the correction sent to <b>' + esc_(s.email) + '</b>:</p>' + html);
  console.log('Correction sent to ' + s.name + ' <' + s.email + '>: ' + subject + '\nNow: ' + all.map(function (L) { return L.id + ' ' + L.time + ' ' + (L.status || 'scheduled'); }).join('; '));
}
