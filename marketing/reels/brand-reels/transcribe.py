# Word timings for a voice take: python3 transcribe.py <take.mp3> <out.words.json> [model]
# Writes [[start, end, word], …] (faster-whisper, Persian), the input cut.py aligns the script to.
import json, sys
from faster_whisper import WhisperModel
src, out = sys.argv[1], sys.argv[2]
model = WhisperModel(sys.argv[3] if len(sys.argv) > 3 else 'large-v3', device='cpu', compute_type='int8', cpu_threads=4)
segs, info = model.transcribe(src, language='fa', word_timestamps=True, vad_filter=False, beam_size=5)
words = [[round(w.start, 2), round(w.end, 2), w.word.strip()] for s in segs for w in s.words]
json.dump(words, open(out, 'w'), ensure_ascii=False)
print(out, len(words), 'words:', ' '.join(w[2] for w in words))
