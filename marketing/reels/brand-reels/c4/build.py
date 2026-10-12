import json, datetime as dt
b = json.load(open('../data/btc_daily.json'))
D = [str(dt.datetime.fromtimestamp(x[0] / 1000, dt.UTC).date()) for x in b]; idx = {d: i for i, d in enumerate(D)}
rounds = []
for day in ['2019-10-25', '2019-06-27', '2020-03-12']:
    i = idx[day]; w = [[round(v, 2) for v in x[1:5]] for x in b[i - 45:i + 1]]
    chg = b[i][4] / b[i - 1][4] - 1; pre30 = b[i - 1][4] / b[i - 31][4] - 1
    rounds.append({'day': day, 'ohlc': w, 'chg': round(chg * 100, 1), 'pre30': round(pre30 * 100, 1)})
    print(day, round(chg * 100, 1), round(pre30 * 100, 1))
T = {'r1': [1.2, 4.2, 6.9], 'r2': [7.1, 9.3, 12.3, 15.0], 'r3': [15.2, 17.6, 20.6, 24.4], 'score': [24.6, 27.8], 'l1': [28.0, 31.0], 'l2': [31.0, 34.8], 'app': [35.0, 41.4], 'cta': [41.6, 46.5]}
json.dump({'place': [0], 'lens': [0], 'dur': 46.5, 'lines': [], 'rounds': rounds, 'T': T}, open('data.json', 'w'), ensure_ascii=False)
