# e1 · an emotional reel on the user's voice-over (voice/t1.mp3, 19.06 s, music already under it) plus a 2.6 s tail.
# A trader keeps backtesting on the platform and keeps losing: real analytics/replay screens of a test account whose
# 31 sessions were traded on real gold prices (capture/mkdata.py). Scene times come from the voice's word timings.
#   python3 ../transcribe.py voice/t1.mp3 voice/t1.words.json && python3 build.py
import json
r = lambda x: round(x, 2)
w = json.load(open('voice/t1.words.json'))
s, e = (lambda i: w[i][0]), (lambda i: w[i][1])

# Subtitles: display words with the time each one starts and ends (the first take word holds «هیچ‌وقت به»).
def words(text, idx):
    out = []
    for k, (word, i) in enumerate(zip(text.split(' '), idx)):
        if isinstance(i, tuple): i, part = i; a = s(i) + part * (e(i) - s(i)); b = a + 0.5 * (e(i) - s(i))
        else: a, b = s(i), e(i)
        out.append([word, r(a), r(b)])
    return out
SUBS = [
    words('هیچ‌وقت به کسی اجازه نده بهت بگه که نمی‌تونی کاری را انجام بدی.', [(0, 0.0), (0, 0.5)] + list(range(1, 12))),
    words('اگه آرزویی داری، باید سعی کنی بهش برسی.', range(12, 20)),
    words('اشخاصی که نمی‌تونن خودشون کاری انجام بدن، بهت میگن تو هم نمی‌تونی.', range(20, 32)),
    words('اگه چیزی را می‌خوای، براش تلاش کن تا بهش برسی.', range(32, 42)),
]
VOICE_END = 19.06
T = {
    'note': s(12) + 0.42,        # «اگه…» is drawn out: cut to the note on it, in focus by «آرزویی»
    'focus': s(13),
    'decide': e(14) + 0.55,      # back to the room on «باید»
    'lift': s(15),
    'click': s(18),               # «بهش»: the trader clicks, the replay starts
    'replay': e(19) + 0.05,
    'stop': s(20) - 0.32,         # the stop is hit in the pause before «اشخاصی»
    'phone': s(20) - 0.06,
    'n1': s(20) + 0.08, 'n2': s(23) - 0.05, 'n3': s(26) - 0.1,
    'grab': s(28) - 0.15, 'flip': s(29), 'down': s(31) + 0.05,
    'persist': s(32) - 0.05,
    'dawn': s(36) - 0.1,
    'reach': s(39),
    'end': e(41) + 0.25,
}
DUR = 21.7
sessions = [[23, -2029.31, -20.29], [24, -1522.85, -15.23], [25, -1201.86, -12.02], [26, -1033.02, -10.33], [27, -1196.91, -11.97],
            [28, -398.76, -3.99], [29, -393.16, -3.93], [30, -256.28, -2.56], [31, -144.45, -1.44]]
json.dump({'t': {k: r(v) for k, v in T.items()}, 'dur': DUR, 'voice_end': VOICE_END, 'subs': SUBS, 'sessions': sessions,
           'place': [], 'lens': [], 'lines': []}, open('data.json', 'w'), ensure_ascii=False)
print('dur', DUR); print({k: r(v) for k, v in T.items()})
