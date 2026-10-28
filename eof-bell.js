// Notification bell for the main website header. index.html loads this only when someone
// has logged in to the portal on this device (localStorage "eofPortal"), after the page has
// finished loading, so the homepage stays fast for everyone else.
import { auth, db, currentUser, isAdmin, getDoc, getDocs, doc, collection, query, where, limit } from "./eof-portal.js?v=7";
import { mountBell, loadFeed, markRead, feedCol } from "./eof-awards.js?v=2";
import { staffInbox, studentInbox, inboxBellItems } from "./eof-chat.js?v=1";

const el = document.getElementById("siteBell");
const forget = () => { try { localStorage.removeItem("eofPortal"); } catch (e) { } };
(async () => {
  if (!el) return;
  const user = await currentUser();
  if (!user) { forget(); el.remove(); return; }
  const css = document.createElement("style");
  css.textContent = "#siteBell{flex-shrink:0}@media (max-width:768px){#siteBell{margin-left:auto}}@media (min-width:769px) and (max-width:1440px){.header-contacts .top-social{display:none}}";
  document.head.appendChild(css);
  // Desktop: sit next to the "Log in" button; phone (contacts row hidden): right side of the header
  const home = el.parentNode, login = document.getElementById("loginMenu"), mq = matchMedia("(max-width:768px)");
  const place = () => { if (!mq.matches && login) login.parentNode.insertBefore(el, login); else if (el.parentNode !== home) home.appendChild(el); };
  place(); mq.addEventListener ? mq.addEventListener("change", place) : mq.addListener(place);
  const admin = await isAdmin(user);
  const teacher = admin ? null : await getDoc(doc(db, "teachers", user.uid)).then(t => t.exists() && t.data().active !== false ? t.data() : null).catch(() => null);
  if (admin || teacher) {
    // Staff: unread replies from their students
    const snap = await getDocs(admin ? collection(db, "students") : query(collection(db, "students"), where("teacher", "==", teacher.name))).catch(() => null);
    if (!snap) { el.remove(); return; }
    const list = snap.docs.map(d => ({ uid: d.id, ...d.data() })).filter(s => (s.status || "active") !== "left");
    el.hidden = false;
    mountBell(el, {
      light: true, staff: true, title: "Messages & replies", empty: "No new messages or replies from students.",
      footer: `<a href="eof-admin.html">Open the staff area</a>`,
      unread: x => (x.type === "reply" || x.type === "chat") && x.readByTeacher === false,
      load: async () => {
        const chats = await staffInbox({ admin, teacherName: teacher?.name }).then(r => inboxBellItems(r, "staff")).catch(() => []);
        const replies = (await Promise.all(list.map(s => getDocs(query(feedCol(s.uid), where("readByTeacher", "==", false)))
          .then(q => q.docs.map(d => ({ id: d.id, ...d.data(), sid: s.uid })))))).flat().filter(x => x.type === "reply");
        return [...chats, ...replies];
      },
      onItemClick: () => { location.href = "eof-admin.html"; }
    });
    return;
  }
  const found = await getDocs(query(collection(db, "students"), where("authUid", "==", user.uid), where("portalBlocked", "==", false), limit(1))).catch(() => null);
  if (!found || found.empty) { el.remove(); return; }
  const sid = found.docs[0].id;
  el.hidden = false;
  mountBell(el, {
    light: true, title: "Notifications", empty: "Nothing new yet.",
    footer: `<a href="eof-account.html">Open my account</a>`,
    unread: x => x.byRole !== "student" && x.readByStudent === false,
    load: async () => {
      const chats = await studentInbox(sid).then(r => inboxBellItems(r, "student")).catch(() => []);
      return [...chats, ...(await loadFeed(sid)).filter(x => x.byRole !== "student")];
    },
    onOpen: unread => markRead(sid, unread.filter(x => !x.chat), "readByStudent"),
    onItemClick: it => { location.href = it && it.chat ? "eof-account.html#chatCard" : "eof-account.html#messages"; }
  });
})().catch(() => { if (el) el.remove(); });
