/**
 * EOF student-portal EMAIL notifications (Google Apps Script on englishonlineforum@gmail.com).
 *
 * Every 10 minutes this script reads the portal's Firestore database (as the project owner) and emails:
 *   • a STUDENT when her teacher or the school sent her something she hasn't read yet
 *     (chat message, badge, stamp, result, comment, answer to her reply);
 *   • a TEACHER when one of her students wrote to her (chat) or replied to a badge/comment/result;
 *   • the SCHOOL (admin) when a student wrote to "The school".
 * Only things that are still UNREAD 5 minutes after they were sent are emailed, so people who are
 * on the website at that moment don't get an email as well. One email per person per run (a short digest).
 * Students whose record has emailNotify == false (admin: student form) get no emails.
 *
 * SETUP (once): script.google.com → New project “EOF portal notifications” → paste this file as Code.gs and
 * appsscript.json from the same folder (Project Settings → “Show appsscript.json manifest file”) →
 * choose the function “setup” → Run → allow access. It creates the 10-minute timer and emails a test
 * message to the school. To stop: run “stop”. Gmail limit on a free account: 100 emails a day.
 */
const PROJECT = 'eof-student-portal';
const SCHOOL_EMAIL = 'englishonlineforum@gmail.com';
const SITE = 'https://www.englishonlineforum.com';
const DELAY_MIN = 5;           // wait this long before emailing (the person may read it on the website)
const MAX_PER_RUN = 40;        // safety limit on emails per run
const BASE = 'https://firestore.googleapis.com/v1/projects/' + PROJECT + '/databases/(default)/documents';

function setup() {
  stop();
  ScriptApp.newTrigger('sendDigests').timeBased().everyMinutes(10).create();
  PropertiesService.getScriptProperties().setProperty('cutoff', new Date(Date.now() - DELAY_MIN * 60000).toISOString());
  const n = listStudents_().length;   // checks that the database can be read
  MailApp.sendEmail(SCHOOL_EMAIL, 'EOF portal notifications are on',
    'Email notifications for the student portal are now running every 10 minutes. ' + n + ' student records found.',
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
      try { MailApp.sendEmail(to, m.subject, m.text, { name: 'English Online Forum', htmlBody: m.html }); sent++; }
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
      else add(teacherEmail(s.teacher) || SCHOOL_EMAIL, 'teacher', s.teacher, item);   // no teacher email → the school
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
        add(teacherEmail(s.teacher) || SCHOOL_EMAIL, 'teacher', s.teacher, { kind: 'reply', who: s.name, title: f.title, text: f.body, link: SITE + '/eof-admin.html' });
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
    '<div style="background:#16264D;color:#fff;padding:16px 20px;border-radius:12px 12px 0 0;border-bottom:4px solid #E0392C">' +
    '<div style="font-size:12px;letter-spacing:2px;color:#E3A94C;font-weight:bold">ENGLISH ONLINE FORUM</div>' +
    '<div style="font-size:20px;font-weight:bold;margin-top:4px">Hello ' + esc_(first) + '!</div></div>' +
    '<table style="width:100%;border-collapse:collapse;background:#fff;border:1px solid #E6EBF5;border-top:0">' + rows + '</table>' +
    '<p style="margin:18px 0"><a href="' + link + '" style="background:#E0392C;color:#fff;text-decoration:none;font-weight:bold;padding:12px 22px;border-radius:999px;display:inline-block">' +
    (b.role === 'student' ? 'Open my student portal' : 'Open the staff area') + '</a></p>' +
    '<p style="font-size:12px;color:#6B7385">Please reply in the portal, not to this email. ' +
    (b.role === 'student' ? 'Don’t want these emails? Tell your teacher or the school and we’ll switch them off.' : '') + '</p></div>';
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
  const s = list_('students').map(function (x) { return { id: x.id, name: x.name, email: x.email, authUid: x.authUid, teacher: x.teacher, status: x.status, portalBlocked: x.portalBlocked, emailNotify: x.emailNotify }; });
  try { c.put('students', JSON.stringify(s), 1800); } catch (e) { }
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
