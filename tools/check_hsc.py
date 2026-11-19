"""Перевіряє переклад і пояснення до офіційних питань ГСЦ (content/hsc/<розділ>.txt або <розділ>-*.txt).

    python -X utf8 tools/check_hsc.py <розділ> [<від> <до>]

Нічого не записує. Показує помилки формату й питання, яким ще бракує перекладу, пояснення,
пунктів Правил або «~» для неправильних варіантів. Діапазон <від> <до> обмежує перевірку повноти.
"""
import json, pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
CONTENT, APP = ROOT / 'content', ROOT / 'app'
sec_n = sys.argv[1]
lo, hi = (int(sys.argv[2]), int(sys.argv[3])) if len(sys.argv) > 3 else (1, 10 ** 6)


def load(name, var):
    s = (APP / 'data' / name).read_text(encoding='utf-8')
    return json.loads(s[len(f'window.{var}='):].rstrip().rstrip(';'))


points = {p['n'] for s in load('rules.js', 'PDR')['sections'] for p in s['points']}
signs = {x['c'] for x in load('signs.js', 'SIGNS')['list']}
marks = {x['c'] for x in load('marking.js', 'MARKING')['list']}
src = next(s for s in json.loads((CONTENT / 'hsc_uk.json').read_text(encoding='utf-8'))['sections'] if s['n'] == sec_n)
qs = {q['n']: q for q in src['questions']}

errors, entries = [], {}
files = [p for p in [CONTENT / 'hsc' / f'{sec_n}.txt'] if p.exists()] + sorted((CONTENT / 'hsc').glob(f'{sec_n}-*.txt'))


def tokens_ok(text, where):
    for kind, code in re.findall(r'\{([spm]):([^}]*)\}', text):
        ok = {'p': points, 's': signs, 'm': marks}[kind]
        if code not in ok:
            errors.append(f'{where}: невідоме посилання {{{kind}:{code}}}')


for f in files:
    cur = None
    for i, raw in enumerate(f.read_text(encoding='utf-8').splitlines(), 1):
        line = raw.rstrip()
        where = f'{f.name}:{i}'
        if not line.strip() or line.startswith('//'):
            continue
        m = re.match(r'^# (\d+)\s*$', line)
        if m:
            k = int(m.group(1))
            if k in entries:
                errors.append(f'{where}: питання {k} уже було')
            if k not in qs:
                errors.append(f'{where}: у розділі {sec_n} немає питання {k}')
            cur = entries.setdefault(k, {'a': {}, 'w': {}, 'where': where})
            continue
        if cur is None:
            errors.append(f'{where}: рядок до першого «# N»')
            continue
        key, sep, val = line.partition(': ')
        if not sep or not val.strip():
            errors.append(f'{where}: незрозумілий або порожній рядок: {line[:60]}')
            continue
        if key in ('E',) or key.startswith('~'):
            if ' || ' not in val:
                errors.append(f'{where}: потрібно «uk || ru»')
            tokens_ok(val, where)
        if key == 'Q':
            cur['q'] = val
        elif key == 'E':
            cur['e'] = val
        elif key == 'R':
            cur['r'] = [r for r in val.replace(',', ' ').split() if r != '-']
            for r in cur['r']:
                if r not in points:
                    errors.append(f'{where}: немає пункту {r}')
        elif key == 'UQ' or re.fullmatch(r'U\d', key):
            pass
        elif re.fullmatch(r'\d', key):
            cur['a'][int(key)] = val
        elif re.fullmatch(r'~\d', key):
            cur['w'][int(key[1])] = val
        else:
            errors.append(f'{where}: невідоме поле «{key}»')

todo = []
for k, q in sorted(qs.items()):
    if not lo <= k <= hi:
        continue
    e = entries.get(k)
    if not e:
        todo.append(f'{k}: немає запису')
        continue
    na, right = len(q['a']), q['c'] + 1
    miss = []
    if 'q' not in e: miss.append('Q')
    if sorted(e['a']) != list(range(1, na + 1)): miss.append(f'варіанти {sorted(e["a"])} з {na}')
    if 'e' not in e: miss.append('E')
    if 'r' not in e: miss.append('R')
    if right in e['w']: errors.append(f'{e["where"]}: «~{right}» — це правильна відповідь')
    lack = [j for j in range(1, na + 1) if j != right and j not in e['w']]
    if lack: miss.append('~' + ','.join(map(str, lack)))
    if miss:
        todo.append(f'{k}: бракує ' + '; '.join(miss))

print(f'розділ {sec_n}: файлів {len(files)}, записів {len(entries)}, питань у діапазоні {sum(1 for k in qs if lo <= k <= hi)}')
for x in errors:
    print('ПОМИЛКА', x)
for x in todo[:40]:
    print('НЕ ГОТОВО', x)
if len(todo) > 40:
    print(f'… і ще {len(todo) - 40}')
if not errors and not todo:
    print('OK')
sys.exit(1 if errors or todo else 0)
