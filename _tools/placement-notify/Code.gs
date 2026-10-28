/**
 * EOF placement-test notifications (Google Apps Script web app on englishonlineforum@gmail.com).
 * Every finished test on englishonlineforum.com posts its result here (eof-result-pdf.js → notifyAdmin);
 * this script emails the admin with the student's details and the result PDF attached.
 * Deploy: Deploy → New deployment → Web app · Execute as: Me · Who has access: Anyone.
 * Gmail sending limit on a free account: 100 emails a day.
 */
const ADMIN = 'englishonlineforum@gmail.com';
const SITE = 'https://www.englishonlineforum.com';

function doGet() { return out('EOF placement-test notifications are running.'); }

function doPost(e) {
  try {
    const d = JSON.parse(e.postData.contents || '{}');
    if (!d.resultId || !/^EOF-[A-Z]{2,5}-\d{6}-[A-Z0-9]{4}$/.test(d.resultId) || !d.pdf) return out('bad request');
    const cache = CacheService.getScriptCache();
    if (cache.get('id:' + d.resultId)) return out('duplicate');
    const hour = Number(cache.get('hour') || 0);
    if (hour >= 40) return out('busy');                     // simple guard against abuse
    cache.put('hour', String(hour + 1), 3600);

    const bytes = Utilities.base64Decode(d.pdf);
    if (bytes.length > 3 * 1024 * 1024) return out('too large');
    if (String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]) !== '%PDF') return out('not a pdf');
    const fileName = String(d.fileName || d.resultId + '.pdf').replace(/[^\w.\- ()]/g, '_').slice(0, 120);
    const pdf = Utilities.newBlob(bytes, 'application/pdf', fileName);

    const name = clip(d.name, 120) || 'Student', contact = clip(d.contact, 200), test = clip(d.testLabel, 120) || 'Placement test';
    const level = clip(d.level, 10), pct = Number(d.pct), demo = !!d.isDemo;
    const isEmail = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(contact), digits = contact.replace(/\D/g, '');
    const contactHtml = !contact ? '—'
      : isEmail ? '<a href="mailto:' + esc(contact) + '">' + esc(contact) + '</a>'
      : esc(contact) + (digits.length >= 7 ? ' &nbsp;<a href="https://wa.me/' + digits + '" style="color:#E0392C;font-weight:600">WhatsApp</a>' : '');
    const skills = (d.skills || []).slice(0, 6).map(function (s) {
      return row(esc(clip(s.label, 40)), '<b>' + esc(clip(s.level, 10)) + '</b> &middot; ' + esc(String(s.pct)) + '/100' + (s.total ? ' (' + esc(String(s.correct)) + ' of ' + esc(String(s.total)) + ')' : ''));
    }).join('');
    const sc = d.school || null;
    const schoolRows = sc ? row('Grade', esc(clip(sc.grade, 20))) + (sc.parent ? row('Parent', esc(clip(sc.parent, 120))) : '') : '';
    const html =
      '<div style="font-family:Arial,Helvetica,sans-serif;color:#16264D;max-width:560px">' +
      '<div style="background:#16264D;color:#fff;padding:16px 20px;border-radius:10px 10px 0 0;border-bottom:4px solid #E0392C">' +
      '<div style="font-size:12px;letter-spacing:2px;color:#F5A9A2;font-weight:bold">NEW PLACEMENT TEST' + (demo ? ' &middot; DEMO' : '') + '</div>' +
      '<div style="font-size:22px;font-weight:bold;margin-top:4px">' + esc(name) + ' &mdash; ' + esc(level) + ' (' + pct + '/100)</div></div>' +
      '<table style="width:100%;border-collapse:collapse;font-size:14px;background:#fff;border:1px solid #E6EBF5;border-top:0">' +
      row('Test', esc(test) + (demo ? ' <span style="color:#E0392C">(demo, indicative only)</span>' : '')) +
      row('Contact', contactHtml) + schoolRows +
      row('Overall', '<b>' + esc(level) + '</b> &middot; ' + pct + '/100') + skills +
      row('Questions', esc(String(d.answered)) + ' of ' + esc(String(d.total)) + ' answered, ' + esc(String(d.correct)) + ' correct') +
      row('Time', esc(String(d.minutes)) + ' min' + (d.timedOut ? ' (time ran out)' : '')) +
      row('Account', d.loggedIn ? 'Logged in as ' + esc(clip(d.loggedIn, 120)) : 'Not logged in') +
      row('Result ID', esc(d.resultId)) +
      '</table><p style="font-size:13px;color:#3E4E72">The result PDF is attached. All tests are also in the admin portal: ' +
      '<a href="' + SITE + '/eof-admin.html">Admin &rarr; Placement tests</a>.</p></div>';
    const opts = { name: 'EOF Placement Test', htmlBody: html, attachments: [pdf] };
    if (isEmail) opts.replyTo = contact;
    MailApp.sendEmail(ADMIN, 'New placement test: ' + name + ' — ' + level + ' ' + pct + '/100' + (demo ? ' (demo)' : '') + ' · ' + test,
      'New placement test: ' + name + ', ' + level + ' ' + pct + '/100, contact: ' + (contact || '—') + '. The result PDF is attached.', opts);
    cache.put('id:' + d.resultId, '1', 21600);
    return out('ok');
  } catch (err) {
    return out('error: ' + err);
  }
}

function row(k, v) { return '<tr><td style="padding:8px 14px;color:#3E4E72;border-top:1px solid #E6EBF5;width:120px">' + k + '</td><td style="padding:8px 14px;border-top:1px solid #E6EBF5">' + v + '</td></tr>'; }
function clip(v, n) { return String(v == null ? '' : v).slice(0, n); }
function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function out(s) { return ContentService.createTextOutput(s); }
