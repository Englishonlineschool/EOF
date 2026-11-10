# Builds translated copies of the agreement: python3 i18n.py ru|tr|collect
import sys, json, re, os
from reportlab.platypus import Paragraph
from reportlab.pdfgen.canvas import Canvas
from reportlab.pdfgen.textobject import PDFTextObject
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
LANG=sys.argv[1]
T={} if LANG=='collect' else json.load(open(f'strings_{LANG}.json',encoding='utf-8'))
seen=[]; missing=set()
CYR=re.compile('[Ѐ-ӿ]')
LMAP={'Poppins-Regular':'Lato-Regular','Poppins-Light':'Lato-Light','Poppins-Medium':'Lato-Semibold','Poppins-Bold':'Lato-Bold'}
L='/usr/share/fonts/truetype/lato/'
for n,f in [('Lato-Regular','Lato-Regular.ttf'),('Lato-Light','Lato-Light.ttf'),('Lato-Semibold','Lato-Semibold.ttf'),('Lato-Bold','Lato-Bold.ttf')]:
    pdfmetrics.registerFont(TTFont(n,L+f))
def tr(s):
    if not isinstance(s,str) or not s.strip(): return s
    if s not in seen: seen.append(s)
    if LANG=='collect': return s
    if s in T: return T[s]
    missing.add(s); return s
_pi=Paragraph.__init__
def pinit(self,text,style=None,*a,**k):
    text=tr(text)
    if style is not None and CYR.search(text or '') and style.fontName in LMAP:
        style=ParagraphStyle('x'+style.name,parent=style,fontName=LMAP[style.fontName])
    if 'bulletText' in k: pass
    _pi(self,text,style,*a,**k)
Paragraph.__init__=pinit
for meth in ['drawString','drawRightString','drawCentredString']:
    orig=getattr(Canvas,meth)
    def mk(orig):
        def f(self,x,y,text,*a,**k):
            t=tr(text)
            if CYR.search(t) and self._fontname in LMAP:
                fn,fs=self._fontname,self._fontsize; self.setFont(LMAP[fn],fs); orig(self,x,y,t,*a,**k); self.setFont(fn,fs)
            else: orig(self,x,y,t,*a,**k)
        return f
    setattr(Canvas,meth,mk(orig))
_tl=PDFTextObject.textLine
def tl(self,text='',*a,**k):
    t=tr(text)
    if CYR.search(t) and self._fontname in LMAP: self.setFont(LMAP[self._fontname],self._fontsize)
    return _tl(self,t,*a,**k)
PDFTextObject.textLine=tl
_sw=pdfmetrics.stringWidth
src=open('build.py',encoding='utf-8').read()
out='../EOF_Lesson_Agreement_%s.pdf'%LANG.upper() if LANG!='collect' else '/tmp/collect.pdf'
src=src.replace("OUT='../EOF_Lesson_Agreement.pdf'","OUT=%r"%out)
# tooltips and the letterhead tag line are measured/passed outside Paragraph/drawString
src=src.replace("s.tooltip=tooltip or name","s.tooltip=tr(tooltip or name)")
src=src.replace("    tag='ONLINE ENGLISH SCHOOL","    tag=tr('ONLINE ENGLISH SCHOOL").replace("TEACHER PROFESSIONAL DEVELOPMENT'\n","TEACHER PROFESSIONAL DEVELOPMENT')\n")
src=src.replace("c.drawRightString(W-RM,5.4*mm,pg)\n    pw=pdfmetrics.stringWidth(pg,","c.drawRightString(W-RM,5.4*mm,pg)\n    pg=tr(pg); pw=pdfmetrics.stringWidth(pg,")
src=src.replace("pg='Page %d of %d'%(page,total)","pg=tr('Page %d of %d')%(page,total)")
# layout adjustments for translated text
src=src.replace("[10*mm,62*mm,CW-72*mm]","[DW,62*mm,CW-62*mm-DW]")
src=src.replace("story=[Paragraph(","DW=pdfmetrics.stringWidth(tr('Dear'),'Lora',10)+2.5*mm\nstory=[Paragraph(",1)
src=src.replace("while pdfmetrics.stringWidth(tag,'Poppins-Regular',fs)+cs*(len(tag)-1)>maxw: cs-=0.05",
 "FT='Lato-Regular' if CYR.search(tag) else 'Poppins-Regular'\n    while pdfmetrics.stringWidth(tag,FT,fs)+cs*(len(tag)-1)>maxw:\n        if cs>0.2: cs-=0.05\n        else: fs-=0.1")
exec(compile(src,'build.py','exec'),{'__name__':'__main__','tr':tr,'CYR':CYR})
if LANG=='collect': json.dump(seen,open('strings_en.json','w',encoding='utf-8'),ensure_ascii=False,indent=0)
print('missing',len(missing)); [print(' -',m[:90]) for m in sorted(missing)]
