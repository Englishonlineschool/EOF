"""Build the four EOF Placement Test for Schools pages from the live Full Placement Test page.

Run from the repo root:  python3 _tools/school-placement/build_school_tests.py
Output: eof-exam-junior.html, eof-exam-junior-demo.html, eof-exam-teens.html, eof-exam-teens-demo.html

The pages reuse the Full test's design, header, scoring engine, branded result PDF
(eof-result-pdf.js), WhatsApp sending and student-portal saving. Questions come from
bank_school.py. Re-run this script after editing any question.
"""
import json, os, random, re, html, importlib.util

ROOT = os.getcwd()
here = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location('bank', os.path.join(here, 'bank_school.py'))
B = importlib.util.module_from_spec(spec); spec.loader.exec_module(B)
TEMPLATE = open(os.path.join(ROOT, 'eof-exam-full.html'), encoding='utf-8').read()

# ------------------------------------------------------------------ profiles
TIPS = {
 'uoe': 'Grammar & vocabulary: a short daily word game or flashcard routine (10 minutes) works better than one long session a week.',
 'reading': 'Reading: 15 minutes of reading in English every day – graded readers, comics or articles about favourite hobbies.',
 'listening': 'Listening: cartoons, songs, videos or podcasts in English at the right level, first without subtitles and then with them.',
}
JUNIOR = dict(
 band='Junior', grades='5–7', gradeList=[5, 6, 7],
 levels=['Pre-A1', 'A1', 'A2', 'B1'],
 names={'Pre-A1': 'Starter', 'A1': 'Beginner', 'A2': 'Elementary', 'B1': 'Intermediate'},
 b={'Pre-A1': -3, 'A1': -2, 'A2': -1, 'B1': 0}, cuts=[-2.5, -1.5, -0.5], prior=-1.5,
 bands=[['Pre-A1', '0–24'], ['A1', '25–49'], ['A2', '50–74'], ['B1', '75–100']],
 desc={
  'Pre-A1': "{n} is starting to understand familiar English words and very simple sentences, especially with pictures. Our Junior Starter group builds a strong, playful foundation.",
  'A1': "{n} can understand and use simple everyday words and phrases about school, family and free time. Our Junior Beginner (A1) group will build vocabulary and confidence.",
  'A2': "{n} can understand short texts and clear conversations on familiar topics and take part in simple exchanges. Our Junior Elementary (A2) group will grow fluency and accuracy.",
  'B1': "{n} can follow the main points of clear texts and conversations and talk about experiences and plans. Our Junior Intermediate (B1) group will stretch {n} with richer reading, listening and speaking.",
 },
 group={'Pre-A1': 'Junior Starter group', 'A1': 'Junior A1 group', 'A2': 'Junior A2 group', 'B1': 'Junior B1 group'},
 cambridge={'Pre-A1': 'ready to prepare for Pre A1 Starters', 'A1': 'ready to prepare for A1 Movers',
            'A2': 'ready to prepare for A2 Flyers or A2 Key for Schools', 'B1': 'ready to prepare for B1 Preliminary for Schools'},
 cando={
  'Pre-A1': ["Can recognise familiar words, such as colours, numbers, animals and classroom objects.",
             "Can understand very simple sentences, especially with pictures.",
             "Can follow short, slow instructions in class.",
             "Can say simple things about themselves, such as their name, age and favourite things."],
  'A1': ["Can read short, simple messages, notes and emails about everyday life.",
         "Can understand slow, clear speech about family, school and free time.",
         "Can ask and answer simple questions about themselves and others.",
         "Can write a few simple sentences about themselves and their day."],
  'A2': ["Can understand short stories, notices and articles on familiar topics.",
         "Can catch the main point of clear announcements and conversations.",
         "Can talk about past events, plans and daily routines in simple language.",
         "Can write a short message or a simple description of a person or place."],
  'B1': ["Can understand the main points of longer stories and articles written for young readers.",
         "Can follow clear conversations and short talks on school and everyday topics.",
         "Can describe experiences and plans and give simple reasons for an opinion.",
         "Can write a short story or a connected paragraph about a familiar topic."],
 },
 intro={'en': "For students in Grades 5–7. The test has three parts: grammar &amp; vocabulary, reading and listening. Work on your own, without a dictionary or translator. A parent can help fill in this page, but please don’t help with the answers! You will need sound for the listening part.",
        'ru': "Для учеников 5–7 классов. Тест состоит из трёх частей: грамматика и лексика, чтение и аудирование. Выполняй задания самостоятельно, без словаря и переводчика. Родители могут помочь заполнить эту страницу, но, пожалуйста, не подсказывайте ответы! Для аудирования нужен звук.",
        'tr': "5–7. sınıf öğrencileri için. Test üç bölümden oluşur: dil bilgisi ve kelime, okuma ve dinleme. Soruları sözlük veya çeviri aracı kullanmadan, kendi başına cevapla. Veliler bu sayfayı doldurmaya yardım edebilir, ancak lütfen cevaplara yardım etmeyin! Dinleme bölümü için ses gereklidir."},
)
TEENS = dict(
 band='Teens', grades='8–11', gradeList=[8, 9, 10, 11],
 levels=['A1', 'A2', 'B1', 'B2', 'C1'],
 names={'A1': 'Beginner', 'A2': 'Elementary', 'B1': 'Intermediate', 'B2': 'Upper-Intermediate', 'C1': 'Advanced'},
 b={'A1': -2, 'A2': -1, 'B1': 0, 'B2': 1, 'C1': 2}, cuts=[-1.5, -0.5, 0.5, 1.5], prior=-0.25,
 bands=[['A1', '0–19'], ['A2', '20–39'], ['B1', '40–59'], ['B2', '60–79'], ['C1', '80–100']],
 desc={
  'A1': "{n} can understand and use familiar everyday expressions and very basic phrases. Our Teens Beginner (A1) group will build a strong foundation.",
  'A2': "{n} can understand short texts and clear speech on familiar topics and handle simple, routine exchanges. Our Teens Elementary (A2) group will build confidence and vocabulary.",
  'B1': "{n} can understand the main points of clear texts and speech about school, hobbies and current topics. Our Teens Intermediate (B1) group will sharpen fluency and accuracy.",
  'B2': "{n} can follow longer articles, talks and discussions and give and explain an opinion. Our Teens Upper-Intermediate (B2) group will refine precision and range, with exam preparation.",
  'C1': "{n} can understand demanding texts, recognise implicit meaning and express ideas fluently. Our Teens Advanced (C1) group will polish nuance, style and academic English.",
 },
 group={L: 'Teens ' + L + ' group' for L in ['A1', 'A2', 'B1', 'B2', 'C1']},
 cambridge={'A1': 'working towards A2 Key for Schools', 'A2': 'ready to prepare for A2 Key for Schools',
            'B1': 'ready to prepare for B1 Preliminary for Schools', 'B2': 'ready to prepare for B2 First for Schools',
            'C1': 'ready to prepare for C1 Advanced'},
 cando={
  'A1': ["Can understand familiar words and very simple sentences in messages and notices.",
         "Can follow very slow, clear speech with pauses.",
         "Can introduce themselves and answer simple personal questions.",
         "Can write simple sentences about themselves, their family and school."],
  'A2': ["Can understand short texts on familiar topics, such as emails, notices and timetables.",
         "Can catch the main point of short, clear messages and conversations.",
         "Can describe school, hobbies, past events and plans in simple terms.",
         "Can handle simple, routine exchanges with classmates and teachers."],
  'B1': ["Can understand the main points of clear articles about school, interests and current topics.",
         "Can follow announcements, talks and conversations in clear, standard English.",
         "Can describe experiences and events and give reasons for opinions.",
         "Can write a connected text, such as a short essay, email or story."],
  'B2': ["Can understand articles and reports in which writers argue for a point of view.",
         "Can follow longer talks, interviews and discussions on a range of topics.",
         "Can discuss topics fluently and explain the pros and cons of different options.",
         "Can write clear, detailed essays and reports with a logical structure."],
  'C1': ["Can understand long, demanding texts and recognise implicit meaning and attitude.",
         "Can follow extended talks and lectures, even when ideas are only implied.",
         "Can express ideas fluently and precisely in discussions and presentations.",
         "Can write well-structured academic texts that develop complex arguments."],
 },
 intro={'en': "For students in Grades 8–11. The test has three parts: grammar &amp; vocabulary, reading and listening. Work on your own, without a dictionary or translator, so we can place you in the group that is truly right for you. You will need sound for the listening part.",
        'ru': "Для учеников 8–11 классов. Тест состоит из трёх частей: грамматика и лексика, чтение и аудирование. Выполняй задания самостоятельно, без словаря и переводчика, чтобы мы могли подобрать тебе подходящую группу. Для аудирования нужен звук.",
        'tr': "8–11. sınıf öğrencileri için. Test üç bölümden oluşur: dil bilgisi ve kelime, okuma ve dinleme. Sana en uygun grubu bulabilmemiz için soruları sözlük veya çeviri aracı kullanmadan, kendi başına cevapla. Dinleme bölümü için ses gereklidir."},
)
for P in (JUNIOR, TEENS): P['tips'] = TIPS

PAGES = [
 dict(file='eof-exam-junior.html', key='junior-full', P=JUNIOR, demo=False, minutes=40, idPrefix='JUN'),
 dict(file='eof-exam-junior-demo.html', key='junior-demo', P=JUNIOR, demo=True, minutes=20, idPrefix='DJU', fullMinutes=40, fullFile='eof-exam-junior.html'),
 dict(file='eof-exam-teens.html', key='teens-full', P=TEENS, demo=False, minutes=50, idPrefix='TEE'),
 dict(file='eof-exam-teens-demo.html', key='teens-demo', P=TEENS, demo=True, minutes=25, idPrefix='DTE', fullMinutes=50, fullFile='eof-exam-teens.html'),
]

UI = {
 'grammar': {'en': 'Choose the word or phrase that best completes each sentence.',
             'ru': 'Выбери слово или фразу, которые лучше всего подходят к предложению.',
             'tr': 'Cümleyi en iyi tamamlayan kelimeyi veya ifadeyi seç.'},
 'reading': {'en': 'Read the text and answer the questions.',
             'ru': 'Прочитай текст и ответь на вопросы.',
             'tr': 'Metni oku ve soruları cevapla.'},
 'listening': {'en': 'Read the questions first. Then play the recording. <b>You can play it twice.</b>',
               'ru': 'Сначала прочитай вопросы. Затем включи запись. Запись можно прослушать два раза.',
               'tr': 'Önce soruları oku. Sonra kaydı başlat. Kaydı iki kez dinleyebilirsin.'},
 'name': {'en': "Student’s name", 'ru': 'Имя ученика', 'tr': 'Öğrencinin adı'},
 'grade': {'en': 'Grade', 'ru': 'Класс', 'tr': 'Sınıf'},
 'parent': {'en': "Parent’s name (optional)", 'ru': 'Имя родителя (необязательно)', 'tr': 'Velinin adı (isteğe bağlı)'},
 'contact': {'en': "Parent’s WhatsApp number or email (optional)", 'ru': 'WhatsApp или e-mail родителя (необязательно)', 'tr': 'Velinin WhatsApp numarası veya e-postası (isteğe bağlı)'},
}


def opts_shuffled(item_id, opts):
    """Store options in a fixed shuffled order (correct answer first in the bank)."""
    order = list(range(len(opts))); random.Random('eof-schools-' + item_id).shuffle(order)
    return [opts[i] for i in order], order.index(0)


def exam_json(page):
    T = B.TESTS[page['key']]; P = page['P']
    g_items = []
    for g in T['grammar']:
        o, a = opts_shuffled(g['id'], g['opts'])
        it = dict(id=g['id'], level=g['level'], b=0.0, prompt=g['prompt'], options=o, answer=a)
        if g.get('pic'): it['pic'] = g['pic']
        g_items.append(it)
    def block(items, kind):
        out = []
        for it in items:
            qs = []
            for qi, (q, opts) in enumerate(it['qs']):
                qid = it['id'] + 'q' + str(qi + 1); o, a = opts_shuffled(qid, opts)
                qs.append(dict(id=qid, prompt=q, options=o, answer=a))
            d = dict(id=it['id'], level=it['level'], b=0.0, title=it['title'], questions=qs)
            if kind == 'reading': d['passage'] = it['passage']
            else: d['audio'] = 'eof-audio/' + it['id'] + '.mp3'
            out.append(d)
        return out
    label = 'Placement Test for Schools – ' + P['band'] + (' (Demo)' if page['demo'] else '')
    return dict(testType=page['key'], testTypeLabel=label, isDemo=page['demo'], timeLimitSec=page['minutes'] * 60,
                sections=[dict(key='uoe', label='Grammar & Vocabulary', kind='grammar', items=g_items),
                          dict(key='reading', label='Reading', kind='reading', items=block(T['reading'], 'reading')),
                          dict(key='listening', label='Listening', kind='listening', items=block(T['listening'], 'listening'))])


def school_cfg(page):
    P = page['P']
    return dict(band=P['band'], grades=P['grades'], levels=P['levels'], names=P['names'], b=P['b'], cuts=P['cuts'], prior=P['prior'],
                bands=P['bands'], desc=P['desc'], group=P['group'], cambridge=P['cambridge'], cando=P['cando'], tips=P['tips'],
                idPrefix=page['idPrefix'], minutes=page['minutes'], fullMinutes=page.get('fullMinutes', page['minutes']),
                fullFile=page.get('fullFile', ''), ui={k: UI[k] for k in ('grammar', 'reading', 'listening')})


def build(page):
    P = page['P']; t = TEMPLATE; ex = exam_json(page)
    nq = sum(len(s['items']) if s['kind'] == 'grammar' else sum(len(i['questions']) for i in s['items']) for s in ex['sections'])
    title = 'Placement Test for Schools — ' + P['band'] + (' Demo' if page['demo'] else '') + ' | English Online Forum'
    descr = ('Free ' + str(page['minutes']) + '-minute English placement test for school students in Grades ' + P['grades'] +
             ': grammar & vocabulary, reading and listening, with an instant CEFR result PDF for parents.')

    def rep(old, new, count=1):
        nonlocal t
        n = t.count(old); assert n == count, (page['file'], n, old[:80]); t = t.replace(old, new)

    # ---------- head ----------
    rep('<title>General English Placement Test — Live | English Online Forum</title>', '<title>' + html.escape(title) + '</title>')
    t = re.sub(r'<meta name="description" content="[^"]*">', '<meta name="description" content="' + html.escape(descr) + '">', t, count=1)
    t = t.replace('https://englishonlineforum.com/eof-exam-full.html', 'https://englishonlineforum.com/' + page['file'])
    t = re.sub(r'(<meta property="og:title" content=")[^"]*(">)', lambda m: m.group(1) + html.escape(title) + m.group(2), t, count=1)
    t = re.sub(r'(<meta name="twitter:title" content=")[^"]*(">)', lambda m: m.group(1) + html.escape(title) + m.group(2), t, count=1)
    t = re.sub(r'(<meta property="og:description" content=")[^"]*(">)', lambda m: m.group(1) + html.escape(descr) + m.group(2), t, count=1)
    t = re.sub(r'(<meta name="twitter:description" content=")[^"]*(">)', lambda m: m.group(1) + html.escape(descr) + m.group(2), t, count=1)

    # ---------- styles ----------
    rep('  .exam-question{margin-bottom:26px;}\n</style>', '''  .exam-question{margin-bottom:26px;}
  /* ---- Placement Test for Schools ---- */
  .pt-pic{display:inline-flex; align-items:center; justify-content:center; min-width:96px; font-size:52px; line-height:1.15; padding:12px 22px; margin:0 0 14px 34px; background:var(--bg-secondary); border-radius:18px; letter-spacing:4px;}
  .pt-tr{display:block; margin-top:6px; font-size:13px; color:#8A90A2; font-style:italic;}
  .exam-lang{display:flex; align-items:center; flex-wrap:wrap; gap:8px; margin:0 0 18px; font-size:12.5px; color:#8A90A2;}
  .exam-lang button{font-family:'Poppins',sans-serif; font-size:12.5px; font-weight:600; color:var(--accent); background:var(--bg-secondary); border:1.5px solid transparent; border-radius:999px; padding:5px 12px; cursor:pointer;}
  .exam-lang button[aria-pressed="true"]{border-color:var(--accent-light); background:#fff;}
  .exam-form-row{display:grid; grid-template-columns:1fr 150px; gap:14px;}
  .exam-form-field select{width:100%; padding:13px 14px; border:1.5px solid var(--line); border-radius:12px; font-family:'Poppins',sans-serif; font-size:15px; color:var(--accent); background:#fff;}
  .exam-form-field select:focus{outline:none; border-color:var(--accent-light);}
  .exam-intro-tr{font-size:13.5px !important; color:#8A90A2 !important; font-style:italic; margin-top:-6px;}
  @media (max-width:520px){ .exam-form-row{grid-template-columns:1fr; gap:0;} }
</style>''')

    # ---------- start card ----------
    rep('<a href="eof-placement-full-test.html" target="_top" class="exam-back-link"><i class="fa-solid fa-arrow-left"></i> Back to test options</a>',
        '<a href="eof-placement-test.html#schools" target="_top" class="exam-back-link"><i class="fa-solid fa-arrow-left"></i> Back to test options</a>')
    rep('<div class="exam-eyebrow">General English Placement Test</div>',
        '<div class="exam-eyebrow">Placement Test for Schools &middot; ' + P['band'] + (' &middot; Demo' if page['demo'] else '') + '</div>')
    m = re.search(r'<h1>Ready to Begin\?</h1>\s*<p>.*?</p>', t, re.S); assert m
    t = t[:m.start()] + ('<h1>Ready to Begin?</h1>\n'
        '        <div class="exam-lang" role="group" aria-label="Instructions language">Instructions also in:'
        ' <button type="button" data-lang="en" aria-pressed="true">English only</button>'
        ' <button type="button" data-lang="ru" aria-pressed="false">Русский</button>'
        ' <button type="button" data-lang="tr" aria-pressed="false">Türkçe</button></div>\n'
        '        <p>' + P['intro']['en'] + '</p>\n'
        '        <p class="exam-intro-tr" id="examIntroTr" hidden></p>') + t[m.end():]
    m = re.search(r'<div class="exam-form-field">\s*<label for="examName">.*?<button type="button" class="exam-start-btn"', t, re.S); assert m
    grades = ''.join('<option value="%d">Grade %d</option>' % (g, g) for g in P['gradeList'])
    t = t[:m.start()] + ('''<div class="exam-form-row">
          <div class="exam-form-field">
            <label for="examName" data-ui="name">Student&rsquo;s name</label>
            <input type="text" id="examName" placeholder="e.g. Alex Student" autocomplete="off">
          </div>
          <div class="exam-form-field">
            <label for="examGrade" data-ui="grade">Grade</label>
            <select id="examGrade"><option value="">Choose&hellip;</option>''' + grades + '''</select>
          </div>
        </div>
        <div class="exam-form-field">
          <label for="examParent" data-ui="parent">Parent&rsquo;s name (optional)</label>
          <input type="text" id="examParent" placeholder="So we know who to reply to" autocomplete="name">
        </div>
        <div class="exam-form-field">
          <label for="examContact" data-ui="contact">Parent&rsquo;s WhatsApp number or email (optional)</label>
          <input type="text" id="examContact" placeholder="So we can follow up with the result" autocomplete="tel">
        </div>
        <button type="button" class="exam-start-btn"''') + t[m.end():]
    rep('<i class="fa-solid fa-clock"></i> Time limit: 60 minutes &middot; 70 questions &middot; Each recording can be played twice',
        '<i class="fa-solid fa-clock"></i> Time limit: %d minutes &middot; %d questions &middot; Each recording can be played twice' % (page['minutes'], nq))
    rep('Your result is not saved automatically &mdash; send the PDF to us on WhatsApp so our team can book your class.',
        'Your result is not saved automatically &mdash; send the PDF to us on WhatsApp so our team can book the right group.')

    # ---------- engine ----------
    m = re.search(r'  var EXAM = \{.*?\};\n', t); assert m
    t = t[:m.start()] + '  var EXAM = ' + json.dumps(ex, ensure_ascii=False) + ';\n  var SCHOOL = ' + json.dumps(school_cfg(page), ensure_ascii=False) + ';\n' + t[m.end():]
    m = re.search(r"  var LEVELS = \['A1'.*?\n  \};\n", t, re.S); assert m
    t = t[:m.start()] + ('''  var LEVELS = SCHOOL.levels;
  var LEVEL_NAME = SCHOOL.names;
  var LEVEL_B = SCHOOL.b;
  var CUTS = SCHOOL.cuts;                           // level boundaries on the ability scale
  var IRT_A = 1.3, IRT_C = 0.25, IRT_D = 1.7;
  var LO = CUTS[0] - 1, HI = CUTS[CUTS.length-1] + 1;
''') + t[m.end():]
    rep("""    html += '<li><i class="fa-solid fa-circle-check"></i> '+(EXAM.isDemo ? 'Indicative CEFR level (demo result)' : 'Official CEFR result (A1&ndash;C1) with a full skills report')+'</li>';""",
        """    html += '<li><i class="fa-solid fa-circle-check"></i> '+(EXAM.isDemo ? 'Indicative CEFR level (demo result)' : 'Official CEFR result ('+LEVELS[0]+'&ndash;'+LEVELS[LEVELS.length-1]+') with a report for parents')+'</li>';""")
    rep("""  nameInput.addEventListener('input', function(){ startBtn.disabled = nameInput.value.trim().length===0; });
  startBtn.addEventListener('click', function(){
    if(!nameInput.value.trim()) return;""",
        """  var gradeInput=$('examGrade'), parentInput=$('examParent'), LANG='en';
  function canStart(){ startBtn.disabled = !(nameInput.value.trim() && gradeInput.value); }
  nameInput.addEventListener('input', canStart); gradeInput.addEventListener('change', canStart);
  var UI_LABELS = """ + json.dumps({k: UI[k] for k in ('name', 'grade', 'parent', 'contact')}, ensure_ascii=False) + """;
  var INTRO = """ + json.dumps(P['intro'], ensure_ascii=False) + """;
  function setLang(l){
    LANG = l;
    document.querySelectorAll('.exam-lang button').forEach(function(b){ b.setAttribute('aria-pressed', b.getAttribute('data-lang')===l ? 'true' : 'false'); });
    var tr=$('examIntroTr'); if(l==='en'){ tr.hidden=true; } else { tr.hidden=false; tr.textContent=INTRO[l]; }
    document.querySelectorAll('[data-ui]').forEach(function(el){ var k=el.getAttribute('data-ui'); el.innerHTML = esc(UI_LABELS[k].en) + (l!=='en' ? '<span class="pt-tr">'+esc(UI_LABELS[k][l])+'</span>' : ''); });
  }
  document.querySelectorAll('.exam-lang button').forEach(function(b){ b.addEventListener('click', function(){ setLang(b.getAttribute('data-lang')); }); });
  (function(){ var l=null; try{ l=localStorage.getItem('eof_lang'); }catch(e){} if(l==='ru'||l==='tr') setLang(l); })();
  function instr(key){ var s = SCHOOL.ui[key]; return s.en + (LANG!=='en' ? '<span class="pt-tr">'+esc(s[LANG])+'</span>' : ''); }
  startBtn.addEventListener('click', function(){
    if(!nameInput.value.trim() || !gradeInput.value) return;""")
    rep("""      html += '<p class="pt-instructions">Choose the word or phrase that best completes each sentence.</p>';""",
        """      html += '<p class="pt-instructions">'+instr('grammar')+'</p>';""")
    rep("""      html += '<p class="pt-instructions">Read the text and answer the questions.</p>';""",
        """      html += '<p class="pt-instructions">'+instr('reading')+'</p>';""")
    rep("""      html += '<p class="pt-instructions">Read the questions first. Then play the recording. <b>You can play it twice.</b></p>';""",
        """      html += '<p class="pt-instructions">'+instr('listening')+'</p>';""")
    rep("""      html += '<div class="exam-question" data-qid="'+q.id+'"><div class="exam-question-prompt">""",
        """      html += '<div class="exam-question" data-qid="'+q.id+'">'+(q.pic ? '<div class="pt-pic" aria-hidden="true">'+esc(q.pic)+'</div>' : '')+'<div class="exam-question-prompt">""")
    rep("""    for(var t=-4; t<=4.0001; t+=0.05){
      var lp = -0.5*Math.pow((t+0.25)/2,2);           // weak prior N(-0.25, 2^2)""",
        """    for(var t=LO-1.5; t<=HI+1.5001; t+=0.05){
      var lp = -0.5*Math.pow((t-SCHOOL.prior)/2,2);   // weak prior N(centre of the test's range, 2^2)""")
    rep("""  function scoreOf(theta){ return Math.max(0, Math.min(100, Math.round(50 + 20*theta))); }""",
        """  function scoreOf(theta){ return Math.max(0, Math.min(100, Math.round((theta - LO) / LEVELS.length * 100))); }""")
    rep("""    var desc = LEVEL_DESC[level] + (EXAM.isDemo ? ' This is a demo result: take the 60-minute General English Placement Test for your official level.' : '');""",
        """    var first = name.split(/\\s+/)[0];
    var desc = SCHOOL.desc[level].split('{n}').join(first) + (EXAM.isDemo ? ' This is a demo result: take the full ' + SCHOOL.band + ' test (' + SCHOOL.fullMinutes + ' minutes) for an official level.' : '');""")
    rep("""    var waText = 'Hi English Online Forum! I just took the ' + EXAM.testTypeLabel + ' on your website.\\n\\nName: ' + name + '\\nResult: ' + level + ' ' + LEVEL_NAME[level] + ' (' + score + '/100)' + (EXAM.isDemo ? ' — demo result' : '') + '\\n'
               + skills.map(function(s){ return s.label + ': ' + s.level + ' (' + s.pct + ')'; }).join('\\n') + '\\n\\nI would like to book my class.';""",
        """    var grade = gradeInput.value, parent = parentInput.value.trim();
    var waText = 'Hi English Online Forum! ' + name + ' has just taken the ' + EXAM.testTypeLabel + ' on your website.\\n\\nStudent: ' + name + ' (Grade ' + grade + ')' + (parent ? '\\nParent: ' + parent : '') + '\\nResult: ' + level + ' ' + LEVEL_NAME[level] + ' (' + score + '/100)' + (EXAM.isDemo ? ' — demo result' : '') + '\\n'
               + skills.map(function(s){ return s.label + ': ' + s.level + ' (' + s.pct + ')'; }).join('\\n') + '\\n\\nWe would like to book a class.';""")
    rep("""        level:level, pct:score, theta:overall.theta, desc:desc, skills:skills,""",
        """        level:level, pct:score, theta:overall.theta, desc:desc, skills:skills,
        levels:LEVELS, levelNames:LEVEL_NAME, idPrefix:SCHOOL.idPrefix,
        pdfDesc:SCHOOL.desc[level].split('{n}').join(first),
        school:{ band:SCHOOL.band, grades:SCHOOL.grades, grade:grade, parent:parent, group:SCHOOL.group[level], cambridge:SCHOOL.cambridge[level],
                 canDo:SCHOOL.cando[level], tips:SCHOOL.tips, bands:SCHOOL.bands, fullMinutes:SCHOOL.fullMinutes,
                 testDesc:'Placement Test for Schools \\u2013 ' + SCHOOL.band + ' (' + SCHOOL.minutes + ' minutes)' },""")
    rep("""    $('examResultsName').textContent = (EXAM.isDemo ? 'Demo complete, ' : 'Well done, ') + name + '!';""",
        """    $('examResultsName').textContent = (EXAM.isDemo ? 'Demo complete, ' : 'Well done, ') + first + '!';""")
    rep("""    $('examResultLevelLine').innerHTML = level + '<br>' + LEVEL_NAME[level];""",
        """    $('examResultLevelLine').innerHTML = esc(level) + '<br>' + esc(LEVEL_NAME[level]);""")
    rep("""    $('examTicketSubtitle').textContent = EXAM.testTypeLabel + (EXAM.isDemo ? ' — indicative only' : ' Result');""",
        """    $('examTicketSubtitle').textContent = EXAM.testTypeLabel + ' \\u00b7 Grade ' + grade + (EXAM.isDemo ? ' — indicative only' : '');""")
    if page['demo']:
        rep("""<a href="eof-placement-test.html" target="_top" class="exam-btn-secondary">Back to Placement Test</a>""",
            """<a href=\"""" + page['fullFile'] + """\" target="_top" class="exam-btn-secondary">Take the full """ + P['band'] + """ test</a>""")
    else:
        rep("""<a href="eof-placement-test.html" target="_top" class="exam-btn-secondary">Back to Placement Test</a>""",
            """<a href="eof-placement-test.html#schools" target="_top" class="exam-btn-secondary">Back to Placement Test</a>""")
    open(os.path.join(ROOT, page['file']), 'w', encoding='utf-8').write(t)
    print(page['file'], nq, 'questions', len(t) // 1024, 'KB')


if __name__ == '__main__':
    for pg in PAGES: build(pg)
