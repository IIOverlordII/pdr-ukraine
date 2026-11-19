"""Шукає в content/hsc/*.txt переклади, що не належать своєму питанню (наприклад, переплутані шматки).

    python -X utf8 tools/crosscheck_hsc.py

Порівнює числа в українському тексті питання/варіантів з числами в російському перекладі
і перевіряє, що однаковий переклад питання не трапляється під різними номерами.
"""
import collections, json, pathlib, re

ROOT = pathlib.Path(__file__).resolve().parent.parent
src = {s['n']: {q['n']: q for q in s['questions']} for s in json.loads((ROOT / 'content' / 'hsc_uk.json').read_text(encoding='utf-8'))['sections']}
nums = lambda s: sorted(re.findall(r'\d+', s or ''))   # «0, 3» і «0,3», «1,2» і «1, 2» вважаємо однаковими
seen, bad = collections.defaultdict(list), []
for f in sorted((ROOT / 'content' / 'hsc').glob('*.txt')):
    if f.name == 'titles.txt':
        continue
    sec = f.stem.split('-')[0]
    cur, entries = None, {}
    for line in f.read_text(encoding='utf-8').splitlines():
        m = re.match(r'^# (\d+)\s*$', line)
        if m:
            cur = entries.setdefault(int(m.group(1)), {'a': {}})
        elif cur is not None and line.startswith('Q: '):
            cur['q'] = line[3:]
        elif cur is not None and line.startswith('UQ: '):
            cur['uq'] = line[4:]
        elif cur is not None and re.match(r'^\d: ', line):
            cur['a'][int(line[0])] = line[3:]
    for k, e in entries.items():
        q = src.get(sec, {}).get(k)
        if not q or 'q' not in e:
            continue
        uk = e.get('uq') or q['q']
        seen[e['q']].append((f'{f.name}#{k}', uk))
        if nums(uk) != nums(e['q']):
            bad.append(f'{f.name} #{k}: числа в питанні {nums(uk)} ≠ {nums(e["q"])}')
        for i, a in enumerate(q['a'], 1):
            if i in e['a'] and nums(a) != nums(e['a'][i]):
                bad.append(f'{f.name} #{k}.{i}: числа у варіанті {nums(a)} ≠ {nums(e["a"][i])}')
for q, where in seen.items():
    if len({uk for _, uk in where}) > 1:       # той самий переклад для різних українських текстів
        bad.append(f'однаковий переклад різних питань: {", ".join(w for w, _ in where)}')
print('\n'.join(bad) if bad else 'OK')
