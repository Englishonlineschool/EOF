/* ============================================================
   English Online Forum \u2014 Instant branded result PDF
   Builds an A4 result certificate in the browser (jsPDF) and
   lets the student send it to the school on WhatsApp.
   ============================================================ */
(function(){
  'use strict';

  var BRAND = {
    navy:[22,38,77], navyDark:[13,24,54], blue:[58,87,171], red:[224,57,44],
    text:[35,43,61], grey:[138,144,162], line:[226,230,239], soft:[244,246,250],
    whatsapp:'996995648111', phoneDisplay:'+996 995-648-111',
    email:'englishonlineforum@gmail.com', site:'englishonlineforum.com'
  };
  var LEVELS = ['A1','A2','B1','B2','C1'];
  var LEVEL_FULL = { A1:'Beginner', A2:'Elementary', B1:'Intermediate', B2:'Upper-Intermediate', C1:'Advanced' };

  /* ---------- PDF library (loaded while the student takes the test) ---------- */
  function loadScript(src){
    return new Promise(function(res, rej){
      var s = document.createElement('script'); s.src = src; s.async = true;
      s.onload = function(){ window.jspdf ? res() : rej(new Error('jsPDF missing')); };
      s.onerror = function(){ rej(new Error('load failed: ' + src)); };
      document.head.appendChild(s);
    });
  }
  var libReady = window.jspdf ? Promise.resolve() :
    loadScript('https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js')
      .catch(function(){ return loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'); });
  libReady.catch(function(){});

  // Brand fonts (Poppins + Fraunces) as TTF for the PDF. If they can't load, the PDF falls back to built-in fonts.
  var FONT_BASE = 'https://cdn.jsdelivr.net/fontsource/fonts/';
  var FONT_FILES = { popR:'poppins@latest/latin-400-normal.ttf', popM:'poppins@latest/latin-500-normal.ttf', popB:'poppins@latest/latin-700-normal.ttf', fraSB:'fraunces@latest/latin-600-normal.ttf' };
  function toB64(buf){ var b = new Uint8Array(buf), s = '', CH = 0x8000; for(var i=0;i<b.length;i+=CH){ s += String.fromCharCode.apply(null, b.subarray(i, i+CH)); } return btoa(s); }
  var fontsReady = Promise.all(Object.keys(FONT_FILES).map(function(k){
    return fetch(FONT_BASE + FONT_FILES[k]).then(function(r){ if(!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
      .then(function(buf){ return [k, toB64(buf)]; });
  })).then(function(list){ var F = {}; list.forEach(function(e){ F[e[0]] = e[1]; }); return F; })
    .catch(function(){ return null; });

  /* ---------- helpers ---------- */
  function mix(a,b,t){ return [0,1,2].map(function(i){ return Math.round(a[i]+(b[i]-a[i])*t); }); }
  function ringColor(t){ // matches the site badge: blue -> navy (60%) -> red
    return t < 0.6 ? mix(BRAND.blue, BRAND.navy, t/0.6) : mix(BRAND.navy, BRAND.red, (t-0.6)/0.4);
  }
  function fmtDate(d){
    var m = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    return d.getDate() + ' ' + m[d.getMonth()] + ' ' + d.getFullYear();
  }
  function resultId(r, d){
    var p = r.isPractice ? 'PRT' : (r.testType === 'full' ? 'FPT' : 'QPT');
    var ymd = String(d.getFullYear()).slice(2) + ('0'+(d.getMonth()+1)).slice(-2) + ('0'+d.getDate()).slice(-2);
    var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', s = '';
    for(var i=0;i<4;i++){ s += chars[Math.floor(Math.random()*chars.length)]; }
    return 'EOF-' + p + '-' + ymd + '-' + s;
  }
  var TR = {'\u0430':'a','\u0431':'b','\u0432':'v','\u0433':'g','\u0434':'d','\u0435':'e','\u0451':'e','\u0436':'zh','\u0437':'z','\u0438':'i','\u0439':'y','\u043a':'k','\u043b':'l','\u043c':'m','\u043d':'n','\u04a3':'ng','\u043e':'o','\u04e9':'o','\u043f':'p','\u0440':'r','\u0441':'s','\u0442':'t','\u0443':'u','\u04af':'u','\u0444':'f','\u0445':'kh','\u0446':'ts','\u0447':'ch','\u0448':'sh','\u0449':'sch','\u044a':'','\u044b':'y','\u044c':'','\u044d':'e','\u044e':'yu','\u044f':'ya','\u0456':'i','\u0457':'yi','\u0454':'ye','\u049b':'k','\u0493':'g','\u04b1':'u','\u04d9':'a','\u04bb':'h'};
  function translit(s){ return String(s||'').split('').map(function(ch){ var lo = ch.toLowerCase(), t = TR[lo]; if(t === undefined) return ch; return ch === lo ? t : t.charAt(0).toUpperCase() + t.slice(1); }).join(''); }
  function safeFile(s){ s = translit(s); return (s||'Student').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^A-Za-z0-9\s-]/g,'').trim().replace(/\s+/g,'-').slice(0,40) || 'Student'; }
  function fitsFont(s){ return /^[\u0020-\u007E\u00A0-\u00FF\u2018\u2019\u201C\u201D\u2013\u2014]*$/.test(s); }
  function isMobile(){ return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && /Macintosh/.test(navigator.userAgent)); }

  function loadLogo(){
    return new Promise(function(resolve){
      var src = document.querySelector('.result-ticket-brand img, .brand-block img');
      if(!src){ resolve(null); return; }
      var img = new Image();
      img.onload = function(){
        try{
          var c = document.createElement('canvas'); c.width = c.height = 360;
          c.getContext('2d').drawImage(img, 0, 0, 360, 360);
          resolve(c.toDataURL('image/png'));
        }catch(e){ resolve(null); }
      };
      img.onerror = function(){ resolve(null); };
      img.src = src.currentSrc || src.src;
    });
  }

  // Names in scripts the embedded font can't draw (e.g. Cyrillic, Arabic) are rendered by the browser instead.
  function nameAsImage(name){
    var c = document.createElement('canvas'), ctx = c.getContext('2d');
    var font = "600 160px Fraunces, 'Times New Roman', Georgia, serif";
    ctx.font = font;
    var w = Math.ceil(ctx.measureText(name).width) + 40;
    c.width = w; c.height = 220;
    ctx.font = font; ctx.fillStyle = 'rgb(22,38,77)'; ctx.textBaseline = 'alphabetic';
    ctx.fillText(name, 20, 165);
    return { data: c.toDataURL('image/png'), ratio: w / 220 };
  }

  /* ---------- PDF drawing ---------- */
  function build(r, logo, fonts){
    var jsPDF = window.jspdf.jsPDF;
    var doc = new jsPDF({ unit:'mm', format:'a4', compress:true });
    var F = fonts, MAP = null;
    if(F){
      doc.addFileToVFS('pop-r.ttf', F.popR); doc.addFont('pop-r.ttf','Poppins','normal');
      doc.addFileToVFS('pop-m.ttf', F.popM); doc.addFont('pop-m.ttf','PoppinsMed','normal');
      doc.addFileToVFS('pop-b.ttf', F.popB); doc.addFont('pop-b.ttf','Poppins','bold');
      doc.addFileToVFS('fra-sb.ttf', F.fraSB); doc.addFont('fra-sb.ttf','Fraunces','normal');
    } else {
      MAP = { 'Poppins|normal':['helvetica','normal'], 'Poppins|bold':['helvetica','bold'], 'PoppinsMed|normal':['helvetica','normal'], 'Fraunces|normal':['times','bold'] };
    }

    var W = 210, H = 297, CX = W/2, now = new Date(), id = resultId(r, now);
    var fill = function(c){ doc.setFillColor(c[0],c[1],c[2]); };
    var ink = function(c){ doc.setTextColor(c[0],c[1],c[2]); };
    var pen = function(c){ doc.setDrawColor(c[0],c[1],c[2]); };
    var font = function(fam, st, size){ var m = MAP && MAP[fam + '|' + (st||'normal')]; if(m){ fam = m[0]; st = m[1]; } doc.setFont(fam, st||'normal'); doc.setFontSize(size); };
    var alpha = function(a){ doc.setGState(new doc.GState({opacity:a})); };
    var spaced = function(txt, x, y, sp, align){ doc.setCharSpace(sp); doc.text(txt, x, y, {align:align||'left'}); doc.setCharSpace(0); };

    doc.setProperties({ title: 'English Online Forum \u2014 ' + r.testLabel + ' Result \u2014 ' + r.name, author:'English Online Forum', subject:'Placement test result', creator: BRAND.site });

    /* Header band */
    fill(BRAND.navy); doc.rect(0, 0, W, 58, 'F');
    doc.saveGraphicsState(); doc.rect(0, 0, W, 58, null); doc.clip(); doc.discardPath();
    alpha(0.18); fill(BRAND.blue); doc.circle(188, 8, 44, 'F'); doc.circle(146, 66, 24, 'F'); alpha(1);
    alpha(0.12); fill(BRAND.red); doc.circle(212, 56, 20, 'F'); alpha(1);
    doc.restoreGraphicsState();
    fill(BRAND.red); doc.rect(0, 58, W, 1.6, 'F');

    fill([255,255,255]); doc.circle(34, 29, 17, 'F');
    if(logo){ doc.addImage(logo, 'PNG', 18.5, 13.5, 31, 31); }
    ink([255,255,255]); font('Poppins','bold',21); doc.text('English Online Forum', 58, 28);
    ink([245,170,162]); font('Poppins','normal',10.5); doc.text('Language is Freedom', 58, 35.5);
    ink([200,208,228]); font('Poppins','normal',8.2);
    doc.text(BRAND.site + '   \u2022   ' + BRAND.phoneDisplay, 58, 44);

    /* Title block */
    ink(BRAND.red); font('Poppins','bold',8.6);
    var eyebrow = (r.isPractice ? 'PRACTICE TEST \u2022 WARM-UP RESULT' : r.testLabel.toUpperCase() + ' \u2022 RESULT');
    spaced(eyebrow, CX, 74, 0.9, 'center');
    ink(BRAND.grey); font('Poppins','normal',10); doc.text('This result is presented to', CX, 82.5, {align:'center'});

    var name = r.name || 'Student';
    if(fitsFont(name)){
      ink(BRAND.navy); var size = 30; font('Fraunces','normal',size);
      while(doc.getTextWidth(name) > 170 && size > 16){ size -= 1; doc.setFontSize(size); }
      doc.text(name, CX, 97, {align:'center'});
    } else {
      var im = nameAsImage(name), h = 12, w = Math.min(170, h*im.ratio); h = w/im.ratio;
      doc.addImage(im.data, 'PNG', CX - w/2, 99 - h, w, h);
    }
    fill(BRAND.red); doc.roundedRect(CX-12, 102, 24, 1.2, 0.6, 0.6, 'F');

    /* Score ring \u2014 same gradient as the website badge */
    var cy = 132, R = 23, T = 5.2, seg = 180, start = -40*Math.PI/180;
    for(var i=0;i<seg;i++){
      var a0 = start + (i/seg)*2*Math.PI, a1 = start + ((i+1.6)/seg)*2*Math.PI;
      var p = function(a, rad){ return [CX + rad*Math.sin(a), cy - rad*Math.cos(a)]; };
      var o0=p(a0,R), o1=p(a1,R), n1=p(a1,R-T), n0=p(a0,R-T), c = ringColor(i/seg);
      fill(c); pen(c); doc.setLineWidth(0.05);
      doc.lines([[o1[0]-o0[0],o1[1]-o0[1]],[n1[0]-o1[0],n1[1]-o1[1]],[n0[0]-n1[0],n0[1]-n1[1]]], o0[0], o0[1], [1,1], 'FD', true);
    }
    fill([255,255,255]); doc.circle(CX, cy, R-T, 'F');
    ink(BRAND.navy); font('Poppins','bold',19); doc.text(r.pct + '/100', CX, cy+0.5, {align:'center'});
    ink(BRAND.red); font('Poppins','bold',11); doc.text(r.level, CX, cy+6.6, {align:'center'});
    font('PoppinsMed','normal',7.4); doc.text(LEVEL_FULL[r.level] || '', CX, cy+10.6, {align:'center'});

    /* Level description */
    ink(BRAND.text); font('Poppins','normal',10.2);
    var desc = doc.splitTextToSize(r.desc || '', 150);
    doc.text(desc, CX, 164, {align:'center', lineHeightFactor:1.55});
    var yAfter = 164 + desc.length*5.6;

    /* CEFR scale */
    var y0 = Math.max(yAfter + 5, 181), pillW = 30, gap = 2.5, total = pillW*5 + gap*4, x0 = CX - total/2;
    ink(BRAND.navy); font('Poppins','bold',8.2); spaced('CEFR LEVEL', x0, y0, 0.7);
    LEVELS.forEach(function(L, k){
      var x = x0 + k*(pillW+gap), y = y0 + 3.5, on = (L === r.level), past = LEVELS.indexOf(L) < LEVELS.indexOf(r.level);
      fill(on ? BRAND.red : (past ? [214,221,240] : BRAND.soft)); doc.roundedRect(x, y, pillW, 11, 2.2, 2.2, 'F');
      ink(on ? [255,255,255] : (past ? BRAND.navy : BRAND.grey));
      font('Poppins','bold',11); doc.text(L, x+pillW/2, y+5.6, {align:'center'});
      font('Poppins','normal',6.4); doc.text(LEVEL_FULL[L], x+pillW/2, y+9.1, {align:'center'});
    });

    /* Skill breakdown */
    var ys = y0 + 24.5;
    ink(BRAND.navy); font('Poppins','bold',8.2); spaced('SKILL BREAKDOWN', x0, ys, 0.7);
    (r.skills||[]).forEach(function(s, k){
      var y = ys + 6 + k*7.6, bx = x0 + 44, bw = total - 44 - 16;
      ink(BRAND.text); font('PoppinsMed','normal',9.4); doc.text(s.label, x0, y+2.4);
      fill(BRAND.line); doc.roundedRect(bx, y, bw, 3, 1.5, 1.5, 'F');
      var fw = Math.max(3, bw * Math.min(100, s.pct)/100);
      fill(mix(BRAND.blue, BRAND.navy, 0.55*k/Math.max(1, r.skills.length-1))); doc.roundedRect(bx, y, fw, 3, 1.5, 1.5, 'F');
      ink(BRAND.navy); font('Poppins','bold',9.4); doc.text(s.pct + '%', x0 + total, y+2.6, {align:'right'});
    });

    /* Next step box */
    var yb = Math.min(ys + 9 + (r.skills||[]).length*7.6 + 3, 249);
    fill(BRAND.soft); doc.roundedRect(x0, yb, total, 20, 3, 3, 'F');
    fill(BRAND.red); doc.roundedRect(x0, yb, 1.6, 20, 0.8, 0.8, 'F');
    ink(BRAND.navy); font('Poppins','bold',10.5);
    doc.text(r.isPractice ? 'Next step: take the full placement test' : 'Next step: book your ' + r.level + ' class', x0+7, yb+7.4);
    ink(BRAND.text); font('Poppins','normal',8.8);
    doc.text('Send this PDF to us on WhatsApp (' + BRAND.phoneDisplay + ') and our team will', x0+7, yb+12.6);
    doc.text('match you with the right teacher and timetable.', x0+7, yb+16.8);

    /* Footer */
    ink(BRAND.grey); font('Poppins','normal',7.4);
    doc.text('This result is a guide to help us place you in the right class. It is not an official certificate of English proficiency.', CX, 273.8, {align:'center'});
    fill(BRAND.navy); doc.rect(0, 278, W, 19, 'F');
    ink([255,255,255]); font('PoppinsMed','normal',8.2);
    doc.text(BRAND.site + '   \u2022   ' + BRAND.email + '   \u2022   ' + BRAND.phoneDisplay, 16, 288.5);
    ink([200,208,228]); font('Poppins','normal',7.4);
    doc.text(fmtDate(now), W-16, 286, {align:'right'});
    doc.text('ID ' + id, W-16, 290.5, {align:'right'});

    return { doc:doc, id:id, fileName:'EOF-Result-' + safeFile(name) + '-' + r.level + '.pdf' };
  }

  /* ---------- Results page UI ---------- */
  var state = { blob:null, file:null, fileName:'', result:null, ready:null };

  function waText(r, attached){
    var lines = (r.skills||[]).map(function(s){ return s.label + ': ' + s.pct + '%'; }).join('\n');
    var t = 'Hi English Online Forum! I just took the ' + r.testLabel + ' on your website.\n\nName: ' + r.name + '\nResult: ' + r.level + ' ' + (LEVEL_FULL[r.level]||'') + ' (' + r.pct + '%)\n' + lines;
    if(r.contact){ t += '\nContact: ' + r.contact; }
    t += attached ? '\n\nMy result PDF is attached. I would like to book my class.' : '\n\nI would like to book my class.';
    return t;
  }

  function download(){
    if(!state.blob) return;
    var a = document.createElement('a'); a.href = URL.createObjectURL(state.blob); a.download = state.fileName;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function(){ URL.revokeObjectURL(a.href); }, 4000);
  }

  function setHint(html){ var h = document.getElementById('eofPdfHint'); if(h){ h.innerHTML = html; } }

  function send(e){
    if(e){ e.preventDefault(); }
    var r = state.result; if(!r) return;
    if(!state.blob && state.ready){ state.ready.then(function(){ if(state.blob){ send(); } }); return; }
    var waUrl = 'https://wa.me/' + BRAND.whatsapp + '?text=';
    var canShareFile = state.file && navigator.canShare && navigator.canShare({ files:[state.file] });
    if(canShareFile && isMobile()){
      navigator.share({ files:[state.file], title:'My English Online Forum result', text: waText(r, true) })
        .then(function(){ setHint('<i class="fa-solid fa-circle-check"></i> Sent! Our team will reply on WhatsApp to book your class.'); })
        .catch(function(err){ if(err && err.name === 'AbortError') return; download(); window.open(waUrl + encodeURIComponent(waText(r,true)), '_blank'); });
      return;
    }
    // Computers (and phones without file sharing): save the PDF, then open the school's WhatsApp chat.
    download();
    window.open(waUrl + encodeURIComponent(waText(r, true)), '_blank');
    setHint('<i class="fa-solid fa-circle-info"></i> Your PDF has been downloaded. In the WhatsApp chat that just opened, tap the <b>paperclip</b>, choose <b>' + state.fileName + '</b> and press send.');
  }

  function mountUI(r){
    var host = document.getElementById('eofPdfPrompt');
    if(!host) return;
    host.hidden = false;
    document.getElementById('eofPdfName').textContent = 'Preparing your result PDF\u2026';
    document.getElementById('eofPdfMeta').textContent = r.testLabel + ' \u2022 ' + r.level + ' ' + (LEVEL_FULL[r.level]||'');
    setHint(isMobile()
      ? '<i class="fa-brands fa-whatsapp"></i> Tap <b>Send PDF on WhatsApp</b>, choose WhatsApp, then pick <b>English Online Forum</b> (' + BRAND.phoneDisplay + ').'
      : '<i class="fa-solid fa-circle-info"></i> We\u2019ll download your PDF and open our WhatsApp chat so you can attach it.');
    var sendBtn = document.getElementById('eofPdfSend'), dlBtn = document.getElementById('eofPdfDownload');
    sendBtn.onclick = send;
    dlBtn.onclick = function(e){ e.preventDefault(); download(); };
    sendBtn.href = 'https://wa.me/' + BRAND.whatsapp + '?text=' + encodeURIComponent(waText(r, false));
  }

  window.EOFResultPDF = {
    build: build, fontsReady: fontsReady, libReady: libReady,
    // Called by the exam page as soon as results are calculated.
    onResult: function(r){
      state.result = r;
      mountUI(r);
      state.ready = Promise.all([libReady, loadLogo(), fontsReady]).then(function(v){ var logo = v[1];
        var out = build(r, logo, v[2]);
        state.blob = out.doc.output('blob');
        state.fileName = out.fileName;
        try{ state.file = new File([state.blob], out.fileName, { type:'application/pdf' }); }catch(e){ state.file = null; }
        var n = document.getElementById('eofPdfName'); if(n){ n.textContent = out.fileName; }
        var sz = document.getElementById('eofPdfSize'); if(sz){ sz.textContent = Math.max(1, Math.round(state.blob.size/1024)) + ' KB'; }
        var p = document.getElementById('eofPdfPrompt'); if(p){ p.classList.add('ready'); }
        return out;
      }).catch(function(err){
        console.error('EOF PDF', err);
        var n = document.getElementById('eofPdfName'); if(n){ n.textContent = 'PDF unavailable \u2014 send your result as a message instead'; }
        state.blob = null;
        document.getElementById('eofPdfSend').onclick = null; // falls back to the plain wa.me text link
      });
      return state.ready;
    }
  };
})();
