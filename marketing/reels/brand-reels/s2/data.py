# s2's timeline (an Instagram story with no voice): the scene starts (T), the words' times (w, so u-kit's kinetic words
# land one by one as if spoken) and the length. 120 BPM: the «۲۰٪» slams on 0.5 s, every scene starts on a beat.
#   python3 data.py
import json
T = {'intro': 0.0, 'time': 3.0, 'code': 6.0, 'how': 9.5, 'end': 13.0}
DUR = 16.0
words = [('تخفیف', 0.15), ('۲۰', 0.5), ('درصدی', 1.0),                       # 0–2
         ('فقط', 3.05), ('به', 3.35), ('مدت', 3.55), ('۴۸', 4.0), ('ساعت', 4.5),  # 3–7
         ('با', 6.05), ('کد', 6.3), ('تخفیف', 6.55),                          # 8–10
         ('موقع', 9.55), ('خرید', 9.85), ('اشتراک', 10.15), ('وارد', 10.55), ('کن', 10.85)]   # 11–15
w = [[round(t, 3), round(t + 0.3, 3), s] for s, t in words]
json.dump({'T': T, 'w': w, 'dur': DUR}, open('data.json', 'w'), ensure_ascii=False)
print(len(w), 'words,', DUR, 's')
