# Builds EOF_Lesson_Agreement.pdf (fillable). Run: python3 build.py  (from this folder)
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor, white, Color
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer, Table,
    TableStyle, KeepTogether, Flowable, NextPageTemplate, CondPageBreak)
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_JUSTIFY
from reportlab.pdfgen import canvas as rlcanvas

OUT='../EOF_Lesson_Agreement.pdf'
W,H=A4; GF='/usr/share/fonts/truetype/google-fonts/'
for n,f in [('Lora','Lora-Regular.ttf'),('Lora-Bold','Lora-Bold.ttf'),('Lora-SemiBold','Lora-SemiBold.ttf'),('Lora-Italic','Lora-RegularItalic.ttf'),('Lora-BoldItalic','Lora-BoldItalic.ttf')]:
    pdfmetrics.registerFont(TTFont(n,f))
pdfmetrics.registerFontFamily('Lora',normal='Lora',bold='Lora-Bold',italic='Lora-Italic',boldItalic='Lora-BoldItalic')
for n in ['Regular','Light','Medium','Bold']: pdfmetrics.registerFont(TTFont('Poppins-'+n,GF+'Poppins-%s.ttf'%n))

NAVY=HexColor('#16264D'); NAVY3=HexColor('#2A4472'); RED=HexColor('#E0392C'); RED2=HexColor('#B92C21'); GOLD=HexColor('#C9A24B')
INK=HexColor('#1F2533'); GREY=HexColor('#6B7385'); LINE=HexColor('#D9DEE8'); TINT=HexColor('#F3F5FA'); TINT2=HexColor('#EEF1F8')
LM,RM=25*mm,20*mm; CW=W-LM-RM   # DIN 5008 margins

body=ParagraphStyle('body',fontName='Lora',fontSize=10,leading=14.6,textColor=INK,alignment=TA_JUSTIFY,spaceAfter=5)
lead=ParagraphStyle('lead',parent=body,fontName='Lora-SemiBold',textColor=NAVY,fontSize=10.3,spaceAfter=4,alignment=TA_LEFT)
bul=ParagraphStyle('bul',parent=body,leftIndent=12,bulletIndent=1,spaceAfter=2.6,alignment=TA_LEFT,bulletFontName='Poppins-Bold',bulletColor=RED,bulletFontSize=9)
small=ParagraphStyle('small',fontName='Poppins-Regular',fontSize=6.8,leading=9,textColor=GREY)
lab=ParagraphStyle('lab',fontName='Poppins-Medium',fontSize=8.2,leading=10.5,textColor=NAVY)
title=ParagraphStyle('title',fontName='Poppins-Bold',fontSize=22,leading=25,textColor=NAVY)
subt=ParagraphStyle('subt',fontName='Lora-Italic',fontSize=13,leading=17,textColor=RED2,spaceAfter=7)

class Field(Flowable):
    def __init__(s,name,width,height=15,tooltip=None): super().__init__(); s.name=name; s.width=width; s.height=height; s.tooltip=tooltip or name
    def wrap(s,aw,ah): return s.width,s.height
    def draw(s):
        c=s.canv; c.setStrokeColor(LINE); c.setLineWidth(0.6); c.line(0,0,s.width,0)
        c.acroForm.textfield(name=s.name,tooltip=s.tooltip,x=0,y=0.6,width=s.width,height=s.height-1,borderWidth=0,borderColor=None,
            fillColor=Color(1,1,1,0),textColor=NAVY,fontName='Helvetica',fontSize=9.5,value='',relative=True,forceBorder=False)
class Rule(Flowable):
    def __init__(s,w,c,t,sa): super().__init__(); s.w=w; s.c=c; s.t=t; s.sa=sa
    def wrap(s,aw,ah): return s.w,s.sa+s.t
    def draw(s): s.canv.setStrokeColor(s.c); s.canv.setLineWidth(s.t); s.canv.line(0,s.sa,s.w,s.sa)
class Heading(Flowable):
    def __init__(s,num,text): super().__init__(); s.num=num; s.text=text
    def wrap(s,aw,ah): s.aw=aw; return aw,24
    def draw(s):
        c=s.canv; c.setFillColor(NAVY); c.roundRect(0,5,17,17,3,stroke=0,fill=1)
        c.setFillColor(white); c.setFont('Poppins-Bold',9.5); c.drawCentredString(8.5,10.2,str(s.num))
        c.setFillColor(NAVY); c.setFont('Poppins-Medium',12.5); c.drawString(25,9.4,s.text)
        c.setStrokeColor(GOLD); c.setLineWidth(0.6); c.line(25,3.2,s.aw,3.2)
        c.setStrokeColor(RED); c.setLineWidth(1.6); c.line(25,3.2,52,3.2)
class SigStamp(Flowable):
    def __init__(s,w,h): super().__init__(); s.w=w; s.h=h
    def wrap(s,aw,ah): return s.w,s.h
    def draw(s):
        # European / UK convention: signature on its line, stamp beside it, overlapping only its end
        c=s.canv; iw,ih=SIG_SIZE; sw=30*mm; sh=sw*ih/iw; sx=1.5*mm; ly=6*mm
        c.setStrokeColor(NAVY3); c.setLineWidth(0.6); c.line(0,ly,sx+sw+2*mm,ly)
        c.drawImage('signature.png',sx,ly-2*mm,sw,sh,mask='auto')
        d=40*mm; c.drawImage('stamp_rot.png',s.w-d-3*mm,(s.h-d)/2-1*mm,d,d,mask='auto')   # 40 mm standard round stamp
SIG_SIZE=(2087,1110)

def section(n,t,ld,bs): return [KeepTogether([Heading(n,t),Spacer(1,3),Paragraph(ld,lead)]+[Paragraph(b,bul,bulletText='▪') for b in bs])]

def icon_web(c,x,y,r,col):
    c.saveState(); c.setStrokeColor(col); c.setLineWidth(0.55)
    c.circle(x,y,r,stroke=1,fill=0); c.ellipse(x-r*0.45,y-r,x+r*0.45,y+r,stroke=1,fill=0)
    c.line(x-r,y,x+r,y); c.line(x-r*0.87,y+r*0.5,x+r*0.87,y+r*0.5); c.line(x-r*0.87,y-r*0.5,x+r*0.87,y-r*0.5); c.restoreState()
def icon_mail(c,x,y,r,col):
    c.saveState(); c.setStrokeColor(col); c.setLineWidth(0.55); w=r*2.3; h=r*1.6
    c.rect(x-w/2,y-h/2,w,h,stroke=1,fill=0); p=c.beginPath(); p.moveTo(x-w/2,y+h/2); p.lineTo(x,y-h*0.08); p.lineTo(x+w/2,y+h/2); c.drawPath(p,stroke=1,fill=0); c.restoreState()
def watermark(c): s=118*mm; c.drawImage('logo_wm.png',(W-s)/2+2.5*mm,(H-s)/2-4*mm,s,s,mask='auto')
def topstrip(c):
    c.setFillColor(NAVY); c.rect(0,H-4.5*mm,W,4.5*mm,stroke=0,fill=1)
    c.setFillColor(RED); c.rect(LM,H-4.5*mm,26*mm,4.5*mm,stroke=0,fill=1)
def footer(c,page,total):
    c.setFillColor(NAVY); c.rect(0,0,W,13*mm,stroke=0,fill=1)
    c.setFillColor(RED); c.rect(0,13*mm,W,0.9*mm,stroke=0,fill=1)
    c.setFillColor(GOLD); c.rect(LM,13.9*mm,18*mm,0.6*mm,stroke=0,fill=1)
    c.setFillColor(white); c.setFont('Poppins-Medium',7.6); c.drawString(LM,5.4*mm,'English Online Forum')
    c.setFont('Lora-Italic',8.2); c.setFillColor(HexColor('#E9C77A'))
    c.drawString(LM+31*mm,5.4*mm,'Learn English. Anywhere. Anytime.')
    pg='Page %d of %d'%(page,total)
    c.setFillColor(white); c.setFont('Poppins-Regular',7.6); c.drawRightString(W-RM,5.4*mm,pg)
    pw=pdfmetrics.stringWidth(pg,'Poppins-Regular',7.6)
    c.setFillColor(HexColor('#C9D2E6')); c.setFont('Poppins-Light',7.6); c.drawRightString(W-RM-pw-6*mm,5.4*mm,'www.englishonlineforum.com'); ww=pdfmetrics.stringWidth('www.englishonlineforum.com','Poppins-Light',7.6); icon_web(c,W-RM-pw-6*mm-ww-3*mm,5.4*mm+0.95*mm,1.25*mm,HexColor('#C9D2E6'))
    if page<total:
        c.setFillColor(GREY); c.setFont('Poppins-Regular',7); c.drawRightString(W-RM-24*mm,18.4*mm,'Initials (student / parent)')
        c.setStrokeColor(LINE); c.setLineWidth(0.6); c.line(W-RM-22*mm,17.6*mm,W-RM,17.6*mm)
def first_header(c):
    topstrip(c); s=24*mm; c.drawImage('logo.png',LM-1*mm,H-34*mm,s,s,mask='auto'); x=LM+27*mm
    c.setFillColor(NAVY); c.setFont('Poppins-Medium',21); c.drawString(x,H-21.5*mm,'English Online Forum')
    c.setFillColor(RED2); c.setFont('Lora-Italic',10.5); c.drawString(x,H-27*mm,'Language is Freedom.')
    tag='ONLINE ENGLISH SCHOOL  ·  BUSINESS ENGLISH  &  TEACHER PROFESSIONAL DEVELOPMENT'
    maxw=(W-RM)-x; fs=6.6; cs=0.9
    while pdfmetrics.stringWidth(tag,'Poppins-Regular',fs)+cs*(len(tag)-1)>maxw: cs-=0.05
    t=c.beginText(x,H-31.6*mm); t.setFont('Poppins-Regular',fs); t.setCharSpace(cs); t.setFillColor(GREY); t.textLine(tag); c.drawText(t)
    y=H-20*mm; ICB=HexColor('#1E40AF')
    items=[(icon_web,'www.englishonlineforum.com'),(icon_mail,'englishonlineforum@gmail.com')]
    mw=max(pdfmetrics.stringWidth(v,'Poppins-Regular',8.4) for _,v in items); tx=W-RM-mw
    for ic,v in items:
        c.setFillColor(NAVY); c.setFont('Poppins-Regular',8.4); c.drawString(tx,y,v)
        ic(c,tx-3.6*mm,y+1.05*mm,1.45*mm,ICB); y-=6.4*mm
    c.setStrokeColor(NAVY); c.setLineWidth(1.3); c.line(LM,H-40*mm,W-RM,H-40*mm)
    c.setStrokeColor(GOLD); c.setLineWidth(0.5); c.line(LM,H-41.3*mm,W-RM,H-41.3*mm)
def later_header(c):
    topstrip(c); s=11*mm; c.drawImage('logo.png',LM-0.5*mm,H-19*mm,s,s,mask='auto')
    c.setFillColor(NAVY); c.setFont('Poppins-Medium',11); c.drawString(LM+13*mm,H-13.6*mm,'English Online Forum')
    c.setFillColor(GREY); c.setFont('Poppins-Regular',7.6); c.drawString(LM+13*mm,H-17.4*mm,'www.englishonlineforum.com')
    c.setFillColor(NAVY); c.setFont('Poppins-Medium',8.2); c.drawRightString(W-RM,H-13.6*mm,'Lesson Agreement')
    c.setFillColor(RED2); c.setFont('Lora-Italic',8.4); c.drawRightString(W-RM,H-17.4*mm,'& Letter of Acceptance')
    c.setStrokeColor(NAVY); c.setLineWidth(0.9); c.line(LM,H-22*mm,W-RM,H-22*mm)
    c.setStrokeColor(GOLD); c.setLineWidth(0.45); c.line(LM,H-23*mm,W-RM,H-23*mm)
class NumberedCanvas(rlcanvas.Canvas):
    def __init__(s,*a,**k): super().__init__(*a,**k); s._saved=[]
    def showPage(s): s._saved.append(dict(s.__dict__)); s._startPage()
    def save(s):
        n=len(s._saved)
        for st in s._saved: s.__dict__.update(st); footer(s,s._pageNumber,n); super().showPage()
        super().save()
def on_first(c,d): c.saveState(); watermark(c); first_header(c); c.restoreState()
def on_later(c,d): c.saveState(); watermark(c); later_header(c); c.restoreState()

def tbl(data,cw,extra=()): return Table(data,colWidths=cw,style=TableStyle([('LEFTPADDING',(0,0),(-1,-1),0),('RIGHTPADDING',(0,0),(-1,-1),0)]+list(extra)))
story=[Paragraph('English Online Forum  ·  www.englishonlineforum.com',small),Rule(70*mm,LINE,0.5,6)]
fw=70*mm; iw=24*mm; vw=36*mm
addr=tbl([[Paragraph('ADDRESSED TO',lab)],[Field('to_name',fw,tooltip='Student / parent full name')],[Field('to_contact',fw,tooltip='Email or phone')]],[fw],[('TOPPADDING',(0,0),(-1,-1),1),('BOTTOMPADDING',(0,0),(-1,-1),2)])
info=tbl([[Paragraph('Ref. No.',lab),Field('ref_no',vw,tooltip='e.g. EOF-LA-2026-001')],[Paragraph('Date',lab),Field('letter_date',vw,tooltip='e.g. 10 November 2026')],
          [Paragraph('Student No.',lab),Field('student_no_top',vw,tooltip='Issued on registration')]],[iw,vw],[('VALIGN',(0,0),(-1,-1),'BOTTOM'),('TOPPADDING',(0,0),(-1,-1),2),('BOTTOMPADDING',(0,0),(-1,-1),3)])
story+=[tbl([[addr,'',info]],[fw,CW-fw-iw-vw,iw+vw],[('VALIGN',(0,0),(-1,-1),'TOP')]),Spacer(1,5*mm),
        Paragraph('Lesson Agreement',title),Paragraph('&amp; Letter of Acceptance',subt),
        tbl([[Paragraph('Dear',body),Field('salutation',62*mm,tooltip='Student / parent name'),Paragraph(',',body)]],[10*mm,62*mm,CW-72*mm],[('VALIGN',(0,0),(-1,-1),'BOTTOM'),('BOTTOMPADDING',(0,0),(-1,-1),0)]),Spacer(1,4),
        Paragraph('Welcome to <b>English Online Forum</b>. We are pleased to offer you a place on our online English programme. This agreement sets out how lessons, payments, assessments and certificates work, so that everyone starts with the same expectations.',body),
        Paragraph('Please read the terms below, then sign the final page and return a copy to confirm your place.',body),Spacer(1,3)]
rows=[('Student name','d_student'),('Parent / guardian (if under 18)','d_parent'),('Student number','d_student_no'),('Date of registration','d_reg_date'),('Course','d_course'),
      ('Level of entry (from placement test)','d_level'),('Tutor','d_tutor'),('Lesson days and times (student’s local time)','d_days'),('Lesson length','d_length'),('Start date','d_start'),('Contact (phone / email)','d_contact')]
tips={'d_course':'General English / Business English / English for School Students / Teacher Professional Development','d_length':'e.g. 45 minutes'}
lw=62*mm; vw2=CW-lw-8*mm
data=[[Paragraph('STUDENT DETAILS',ParagraphStyle('th',fontName='Poppins-Medium',fontSize=8.4,textColor=white,leading=10)),'']]+[[Paragraph(l,lab),Field(k,vw2,tooltip=tips.get(k,l))] for l,k in rows]
ts=[('SPAN',(0,0),(-1,0)),('BACKGROUND',(0,0),(-1,0),NAVY),('LINEBELOW',(0,0),(-1,0),1.4,RED),('VALIGN',(0,1),(-1,-1),'MIDDLE'),('LEFTPADDING',(0,0),(-1,-1),7),('RIGHTPADDING',(0,0),(-1,-1),7),
    ('TOPPADDING',(0,0),(-1,0),5),('BOTTOMPADDING',(0,0),(-1,0),5),('TOPPADDING',(0,1),(-1,-1),1.9),('BOTTOMPADDING',(0,1),(-1,-1),1.9),('BOX',(0,0),(-1,-1),0.6,NAVY),('LINEAFTER',(0,1),(0,-1),0.4,LINE)]
ts+=[('BACKGROUND',(0,i),(-1,i),TINT) for i in range(1,len(data),2)]
story+=[Table(data,colWidths=[lw,CW-lw],style=TableStyle(ts)),NextPageTemplate('later')]

S=[(1,'What English Online Forum Offers','English Online Forum is an independent, fully online English school, founded in 2019, offering professional English learning to students around the world.',
  ['<b>Professional learning:</b> General English (A1–C1), Business English, English for School Students (grades 5–12) and Teacher Professional Development, in one-to-one or small-group lessons.',
   '<b>Qualified teachers:</b> our teachers are qualified and experienced, with recognised teaching certificates (such as TESOL) and university degrees.',
   '<b>Quality lessons and materials:</b> every lesson is planned around clear objectives, with quality learning materials, homework and feedback shared in the class’s private Google Classroom.',
   '<b>Lessons tailored to the student:</b> content, pace and focus are adapted to each student’s level, goals and interests.',
   '<b>High moral values:</b> we teach with integrity, respect and punctuality, and keep every lesson a safe, inclusive and respectful space.',
   '<b>Social-Emotional Learning (SEL):</b> SEL is built into our lessons. It helps students develop self-awareness, confidence, empathy, active listening and positive relationships while they learn English, so they grow as communicators and as people.']),
 (2,'Placement Test','Every new student takes a placement test before the first lesson. The result sets the level of entry and the starting point of the course.',
  ['Adults and university students take the <b>General English</b> placement test.','School students (grades 5–11) take the <b>Placement Test for Schools</b> (Junior or Teens).',
   'The test is taken online at www.englishonlineforum.com. A phone number or email address is required before starting.','On completion, the student sees the result and sends the result PDF to the school on WhatsApp.',
   'The tutor may hold a short speaking check in the first lesson to confirm the level.']),
 (3,'Commitment and Schedule','The student commits to a minimum of three (3) months of study, with at least two (2) lessons per week.',
  ['Lesson days and times are agreed between the tutor and the student (or parent) and suit both sides.','Times are set in the student’s own city of residence.',
   'The agreed timetable stays fixed unless both sides agree to change it.','All lessons are held online. The student needs a stable internet connection, a device with camera and microphone, and a quiet place to study.']),
 (4,'Fees and Payment','Lessons are paid in advance, in blocks of ten (10) lessons.',
  ['The fee is quoted to the student separately and is confirmed in writing before the first lesson.','Payment is accepted in US dollars (USD) or the equivalent in local currency at the current exchange rate.',
   'The mode of payment may vary. Accepted methods include direct bank transfer and money transfer services such as Western Union.',
   'Each 10-lesson block is paid in full before its first lesson. The next block is due before the last lesson of the current one.','Lessons are not scheduled until payment for the block has been received.',
   'Any bank or transfer charges are paid by the sender.','Fees paid for a block are not refundable once that block has started.']),
 (5,'Attendance, Cancellations and Rescheduling','A lesson cancelled with at least 24 hours’ notice is rescheduled. A lesson missed without that notice counts as taken.',
  ['Attendance is recorded for every lesson in the student portal.','If the student joins late, the lesson still ends at the scheduled time.','If the tutor cancels or cannot hold a lesson, it is rescheduled at no cost.',
   'Lessons lost to a technical problem on the school’s side are made up in full.','Unused lessons from a paid block must be taken within the 3-month commitment period.']),
 (6,'Progress and Assessments','Students move to the next level only after passing the assessments set for their current level.',
  ['Assessments cover reading, writing, listening, speaking, grammar and vocabulary.','Homework is set regularly and forms part of the student’s progress record.',
   'A student who does not pass may retake the assessment after further lessons agreed with the tutor.','Progress feedback is shared with the student, and with the parent for students under 18.',
   'Learning outcomes depend largely on the student’s own effort: regular attendance, completed homework and practice between lessons. English Online Forum cannot guarantee a particular level, score or result within a set time.']),
 (7,'Certificates and Recognition','A certificate is issued when a student completes a level and passes its final assessment.',
  ['Certificates are issued as a soft copy (PDF) only.','They are sent by email or made available in the student’s account on www.englishonlineforum.com.','Each certificate shows the student’s name, the level completed and the date of issue.',
   'EOF certificates and assessment results are internal school records. They confirm achievement within our programmes but are not internationally accredited or recognised qualifications.',
   'Students who need an internationally recognised result for study, work or immigration may take external exams such as IELTS, TOEFL, Cambridge English (B2 First, C1 Advanced), PTE Academic or the Duolingo English Test, registering directly with the exam provider. On request, we can help students prepare for these exams.']),
 (8,'Student Account and Conduct','Each student receives a personal login to the student portal on www.englishonlineforum.com.',
  ['The portal holds the student number, registration date, level of entry, lesson days and attendance.','Students keep their login details private and do not share their account.',
   'Students and tutors treat each other with respect, arrive on time and keep cameras on unless agreed otherwise.','Lessons are not recorded or shared without the consent of both the tutor and the student (or parent).',
   'Lesson materials are for the student’s own use and may not be copied or passed on.','Disrespectful, abusive or disruptive behaviour may lead to lessons being suspended.']),
 (9,'Privacy and Data Protection','English Online Forum respects your privacy and handles personal data in line with recognised data-protection principles, such as those of the EU General Data Protection Regulation (GDPR).',
  ['We collect only what we need to run the course: name, contact details, age group or grade, placement and assessment results, lesson schedule, attendance and progress records.',
   'This information is used only to deliver lessons, track progress, communicate with the student or parent, and issue certificates.',
   'Access is limited: each teacher sees only their own students, and contact details are kept by the school administration.',
   'Personal data is never sold. It is shared with third parties only where needed to process payments or where the law requires it.',
   'Lessons and materials use trusted platforms such as Zoom and Google Classroom, which have their own privacy policies.',
   'Data is stored securely and kept only as long as needed for the student’s studies and our records.',
   'Students, or parents of students under 18, may ask to see, correct or delete their personal data at any time by writing to englishonlineforum@gmail.com.',
   'For students under 18, a parent or guardian gives consent on their behalf by signing this agreement.']),
 (10,'General Provisions','This agreement sets the terms for the student’s studies with English Online Forum.',
  ['It starts on the start date above and covers the 3-month commitment period. It then continues block by block for as long as lessons are booked and paid.',
   'Any change to these terms is agreed in writing; email or WhatsApp is acceptable.',
   'This agreement is written in English. Where a translated copy is provided, the English version prevails.',
   'Questions or concerns can be raised at any time with the student’s tutor or at englishonlineforum@gmail.com.'])]
for s in S: story+=section(*s)

cw3=[CW*0.3,CW*0.3,CW*0.4]; fw3=CW*0.3-10; fwe=CW*0.4-10
hdr=ParagraphStyle('h3',fontName='Poppins-Medium',fontSize=8.2,textColor=white,leading=10)
L=lambda t: Paragraph(t,ParagraphStyle('sl',fontName='Poppins-Regular',fontSize=7,textColor=GREY,leading=9))
fixed=ParagraphStyle('fx',fontName='Lora-SemiBold',fontSize=10,textColor=NAVY,leading=12)
sig=[[Paragraph('STUDENT',hdr),Paragraph('PARENT / GUARDIAN <font size=6.5>(IF UNDER 18)</font>',hdr),Paragraph('FOR ENGLISH ONLINE FORUM',hdr)],
     [L('Full name'),L('Full name'),L('Name and position')],
     [Field('s_name',fw3),Field('p_name',fw3),Paragraph('Mashel Auma<br/><font name="Lora-Italic" size="9" color="#B92C21">Director, English Online Forum</font>',fixed)],
     [L('Signature'),L('Signature'),L('Signature and stamp')],
     [Spacer(1,38*mm),Spacer(1,38*mm),SigStamp(fwe,38*mm)],
     [L('Place and date'),L('Place and date'),L('Date')],
     [Field('s_place_date',fw3),Field('p_place_date',fw3),Field('eof_date',fwe,tooltip='Date of issue')]]
st=Table(sig,colWidths=cw3,style=TableStyle([('BACKGROUND',(0,0),(-1,0),NAVY),('LINEBELOW',(0,0),(-1,0),1.4,RED),('BACKGROUND',(2,1),(2,-1),TINT2),('BOX',(0,0),(-1,-1),0.6,NAVY),
    ('LINEAFTER',(0,0),(1,-1),0.4,LINE),('LINEBELOW',(0,4),(1,4),0.6,NAVY3),('LEFTPADDING',(0,0),(-1,-1),5),('RIGHTPADDING',(0,0),(-1,-1),5),
    ('TOPPADDING',(0,0),(-1,0),5),('BOTTOMPADDING',(0,0),(-1,0),5),('TOPPADDING',(0,1),(-1,-1),2),('BOTTOMPADDING',(0,1),(-1,-1),2),
    ('TOPPADDING',(0,1),(-1,1),5),('TOPPADDING',(0,3),(-1,3),6),('TOPPADDING',(0,5),(-1,5),8),('BOTTOMPADDING',(0,-1),(-1,-1),6),('VALIGN',(0,0),(-1,-1),'BOTTOM')]))
acc=[Heading(11,'Acceptance'),Spacer(1,3),
     Paragraph('By signing below, I confirm that I have read and accept the terms of this agreement, including the 3-month commitment, a minimum of 2 lessons per week, and advance payment in blocks of 10 lessons.',body),
     Spacer(1,5),st,Spacer(1,7),Paragraph('Please return a signed copy by email or WhatsApp. We look forward to working with you.',body),Spacer(1,2),
     Paragraph('<font name="Lora-Italic" color="#B92C21">With warm regards,</font><br/><font name="Poppins-Medium" color="#16264D">The English Online Forum Team</font>',ParagraphStyle('cl',parent=body,alignment=TA_LEFT))]
story+=[CondPageBreak(120*mm),KeepTogether(acc)]

doc=BaseDocTemplate(OUT,pagesize=A4,leftMargin=LM,rightMargin=RM,title='Lesson Agreement & Letter of Acceptance',author='English Online Forum',subject='Student lesson agreement',creator='English Online Forum')
doc.addPageTemplates([PageTemplate('first',[Frame(LM,22*mm,CW,H-69*mm,id='f1',leftPadding=0,rightPadding=0,topPadding=0,bottomPadding=0)],onPage=on_first),
                      PageTemplate('later',[Frame(LM,22*mm,CW,H-52*mm,id='f2',leftPadding=0,rightPadding=0,topPadding=0,bottomPadding=0)],onPage=on_later)])
doc.build(story,canvasmaker=NumberedCanvas); print('built',OUT)
