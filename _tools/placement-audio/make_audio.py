"""Generate the EOF placement-test listening recordings (run from the repo root).
Needs: pip install kokoro-onnx soundfile ; model files kokoro-v1.0.onnx + voices-v1.0.bin in the working directory."""
import os, importlib.util, numpy as np, soundfile as sf
from kokoro_onnx import Kokoro
here = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location('bank', os.path.join(here, 'bank_listening.py'))
L = importlib.util.module_from_spec(spec); spec.loader.exec_module(L)
k = Kokoro('kokoro-v1.0.onnx', 'voices-v1.0.bin')
os.makedirs('eof-audio', exist_ok=True)
for clip in L.FULL_LISTENING + L.DEMO_LISTENING:
    parts = [np.zeros(int(24000 * 0.6))]
    for voice, text in clip['lines']:
        s, sr = k.create(text, voice=voice, speed=clip['speed'], lang='en-gb' if voice[0] == 'b' else 'en-us')
        parts += [s, np.zeros(int(sr * 0.45))]
    a = np.concatenate(parts); a = a / np.max(np.abs(a)) * 0.9
    wav = f"/tmp/{clip['id']}.wav"; sf.write(wav, a, 24000)
    os.system(f"ffmpeg -v error -y -i {wav} -ac 1 -ar 24000 -b:a 48k eof-audio/{clip['id']}.mp3")
    print(clip['id'], round(len(a) / 24000, 1), 's', os.path.getsize(f"eof-audio/{clip['id']}.mp3") // 1024, 'KB')
