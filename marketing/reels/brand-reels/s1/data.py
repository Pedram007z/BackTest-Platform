# s1's timeline (an Instagram story with no voice): the shots' start times (T), the words' times (w, as a voice
# reel's word timing would give them, so z-kit's captions rise word by word) and the length.   python3 data.py
# 120 BPM with the bars on odd seconds: the drop on «اندیکاتور سشن‌ها» lands on a bar (3.0 s).
import json

T = {'intro': 0.0, 'news': 3.0, 'add': 7.0, 'boxes': 10.0, 'set': 12.5, 'live': 15.5, 'end': 19.5}
DUR = 22.5
words = [
    # intro: «طبق درخواست کاربران عزیز بک‌تست‌لب»
    ('طبق', 0.10), ('درخواست', 0.40), ('کاربران', 0.90), ('عزیز', 1.20), ('بک‌تست‌لب', 1.70),
    # news: «اندیکاتور سشن‌ها به لیست اندیکاتورها افزوده شد»
    ('اندیکاتور', 3.05), ('سشن‌ها', 3.45), ('به', 4.35), ('لیست', 4.55), ('اندیکاتورها', 4.80), ('افزوده', 5.35), ('شد', 5.65),
    # add
    ('از', 7.05), ('لیست', 7.25), ('اندیکاتورها', 7.45), ('Sessions', 7.95), ('رو', 8.35), ('اضافه', 8.55), ('کن', 8.80),
    # boxes
    ('سقف', 10.05), ('و', 10.30), ('کف', 10.45), ('هر', 10.70), ('سشن،', 10.90), ('خودکار', 11.35), ('روی', 11.60), ('چارت', 11.80),
    # settings
    ('ساعت،', 12.55), ('منطقه‌ی', 12.80), ('زمانی', 13.00), ('و', 13.20), ('رنگ', 13.35), ('هر', 13.60), ('۴', 13.75), ('سشن', 13.90), ('دست', 14.10), ('خودته', 14.30),
    # live
    ('با', 15.55), ('هر', 15.75), ('کندل', 15.95), ('جدید،', 16.15), ('سقف', 16.70), ('و', 16.90), ('کف', 17.05), ('به‌روز', 17.25), ('می‌شه', 17.50),
]
w = [[round(t, 3), round(t + 0.3, 3), s] for s, t in words]
marks = json.load(open('marks.json'))   # where the buttons sat in the captures (capture/cap.mjs)
json.dump({'T': T, 'w': w, 'dur': DUR, 'marks': marks}, open('data.json', 'w'), ensure_ascii=False)
print(len(w), 'words,', DUR, 's')
