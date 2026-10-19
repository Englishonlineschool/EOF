"""Generate the listening recordings for the EOF Placement Test for Schools (Junior + Teens).

Run from the repo root:
  uv run --no-project --python 3.12 --with kokoro-onnx==0.6.1 --with soundfile \
     python _tools/school-placement/make_school_audio.py [clip_id ...]
Needs kokoro-v1.0.onnx + voices-v1.0.bin (KOKORO_DIR env var or the working directory) and ffmpeg.

Quality pipeline (better than the v2 adult clips):
  * every sentence is synthesised separately, so long turns keep natural, even prosody;
  * silence at the edges of each sentence is trimmed and replaced by controlled pauses
    (longer at lower levels, natural turn-taking gaps between speakers);
  * short fades at every join (no clicks);
  * two-pass EBU R128 loudness normalisation to -16 LUFS / -1.5 dBTP, so every clip plays
    at the same, comfortable volume on phones and laptops;
  * 96 kbps mono MP3 at the model's native 24 kHz (clean, small enough for mobile data).
"""
import os, re, sys, json, subprocess, tempfile, importlib.util
import numpy as np, soundfile as sf
from kokoro_onnx import Kokoro

SR = 24000
here = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location('bank', os.path.join(here, 'bank_school.py'))
B = importlib.util.module_from_spec(spec); spec.loader.exec_module(B)
kdir = os.environ.get('KOKORO_DIR', '.')
k = Kokoro(os.path.join(kdir, 'kokoro-v1.0.onnx'), os.path.join(kdir, 'voices-v1.0.bin'))
os.makedirs('eof-audio', exist_ok=True)

def trim(a, thr=0.012, keep=0.03):
    idx = np.where(np.abs(a) > thr)[0]
    if not len(idx): return a
    s = max(0, idx[0] - int(keep * SR)); e = min(len(a), idx[-1] + int(keep * SR))
    return a[s:e]

def fade(a, ms=8):
    n = min(len(a) // 2, int(SR * ms / 1000))
    if n > 0:
        r = np.linspace(0, 1, n, dtype=np.float32); a = a.copy(); a[:n] *= r; a[-n:] *= r[::-1]
    return a

def sil(sec): return np.zeros(int(SR * sec), dtype=np.float32)

def render(clip):
    pause = clip.get('pause', 0.15)
    turn_gap = 0.55 if clip['level'] in ('Pre-A1', 'A1', 'A2') else 0.42
    parts, words = [sil(0.8)], 0
    for li, (voice, text) in enumerate(clip['lines']):
        sentences = [s for s in re.split(r'(?<=[.?!])\s+', text.strip()) if s]
        for si, s in enumerate(sentences):
            audio, sr = k.create(s, voice=voice, speed=clip['speed'], lang='en-gb' if voice[0] == 'b' else 'en-us')
            assert sr == SR
            parts.append(fade(trim(audio.astype(np.float32))))
            words += len(s.split())
            if si < len(sentences) - 1:
                parts.append(sil(pause + (0.12 if s.endswith('?') else 0)))
        if li < len(clip['lines']) - 1:
            parts.append(sil(turn_gap))
    parts.append(sil(0.9))
    return np.concatenate(parts), words

def loudnorm(src, dst):
    af = 'highpass=f=60,lowpass=f=11000'
    p = subprocess.run(['ffmpeg', '-hide_banner', '-i', src, '-af', af + ',loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'],
                       capture_output=True, text=True)
    m = json.loads(p.stderr[p.stderr.rindex('{'):p.stderr.rindex('}') + 1])
    ln = ('loudnorm=I=-16:TP=-1.5:LRA=11:measured_I={input_i}:measured_TP={input_tp}:measured_LRA={input_lra}:'
          'measured_thresh={input_thresh}:offset={target_offset}:linear=true').format(**m)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-af', af + ',' + ln, '-ar', str(SR), '-ac', '1',
                    '-c:a', 'libmp3lame', '-b:a', '96k', dst], check=True)

want = set(sys.argv[1:])
for clip in B.ALL_LISTENING:
    if want and clip['id'] not in want: continue
    a, words = render(clip)
    a = a / max(1e-6, np.max(np.abs(a))) * 0.95
    with tempfile.TemporaryDirectory() as td:
        wav = os.path.join(td, clip['id'] + '.wav'); sf.write(wav, a, SR, subtype='PCM_16')
        out = f"eof-audio/{clip['id']}.mp3"; loudnorm(wav, out)
    secs = len(a) / SR
    print(f"{clip['id']:6s} {clip['level']:6s} {secs:5.1f} s  ~{round(words / (secs - 1.7) * 60)} wpm  {os.path.getsize(out) // 1024} KB", flush=True)
