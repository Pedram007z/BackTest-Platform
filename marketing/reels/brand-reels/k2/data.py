# k2: data.json = the voice timing (voice/timing.json). The numbers on screen are the platform's own pages (real captures,
# images.json): f1's 10-trade test session for the analytics and costs, s1's gold replay for the replay.   python3 data.py
import json
t = json.load(open('voice/timing.json'))
json.dump({'T': t['T'], 'w': t['w'], 'dur': t['dur']}, open('data.json', 'w'), ensure_ascii=False)
print(len(t['w']), 'words,', t['dur'], 's')
