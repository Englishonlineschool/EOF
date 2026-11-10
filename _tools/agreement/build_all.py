"""Builds the blank, fillable EOF Lesson Agreement in English, Russian and Turkish
and copies them to /agreement/ on the website.

    cd _tools/agreement && python3 build_all.py

Needs: python3 with reportlab, Pillow and fontTools; the Poppins and Lora fonts from
google-fonts (/usr/share/fonts/truetype/google-fonts/) and Lato (Ubuntu package fonts-lato,
which has Cyrillic). Texts: build.py (English), strings_ru.json / strings_tr.json (translations,
keyed by the English text). After changing English text in build.py, run
`python3 i18n.py collect` to list the strings and update both JSON files.
"""
import os, shutil, subprocess, sys
from PIL import Image
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

HERE = os.path.dirname(os.path.abspath(__file__))
os.chdir(HERE)
G = '/usr/share/fonts/truetype/google-fonts/'

# Static Lora weights (reportlab can't use variable fonts)
for src, tag in [('Lora-Variable.ttf', ''), ('Lora-Italic-Variable.ttf', 'Italic')]:
    for w, n in [(400, 'Regular'), (600, 'SemiBold'), (700, 'Bold')]:
        out = f'Lora-{n}{tag}.ttf'
        if not os.path.exists(out):
            instantiateVariableFont(TTFont(G + src), {'wght': w}, updateFontNames=False).save(out)

# Faint logo used as the page watermark
if not os.path.exists('logo_wm.png'):
    r, g, b, a = Image.open('logo.png').convert('RGBA').split()
    Image.merge('RGBA', (r, g, b, a.point(lambda v: int(v * 0.055)))).save('logo_wm.png')

subprocess.run([sys.executable, 'build.py'], check=True)
subprocess.run([sys.executable, 'i18n.py', 'ru'], check=True)
subprocess.run([sys.executable, 'i18n.py', 'tr'], check=True)

dest = os.path.join(HERE, '..', '..', 'agreement')
os.makedirs(dest, exist_ok=True)
for src, name in [('EOF_Lesson_Agreement.pdf', 'EOF_Lesson_Agreement_EN.pdf'),
                  ('EOF_Lesson_Agreement_RU.pdf', 'EOF_Lesson_Agreement_RU.pdf'),
                  ('EOF_Lesson_Agreement_TR.pdf', 'EOF_Lesson_Agreement_TR.pdf')]:
    shutil.move(os.path.join(HERE, '..', src), os.path.join(dest, name))
    print('->', os.path.normpath(os.path.join(dest, name)))
