"""Збирає дані застосунку з content/ у app/data/*.js та формує список файлів для офлайн-кешу.

    python tools/build.py

Джерела (content/):
    pdr_uk.json            — текст Правил (див. parse_pdr.py)
    meta.json              — дата редакції тексту
    sign_names_uk.json     — назви знаків українською
    ru/rules_NN.txt        — переклад розділу NN: рядок "## заголовок", далі "<id блоку> <текст>"
    ru/sign_names.txt      — "<номер> <назва російською>"
    marking.txt            — "<номер> <коротка назва uk> || <ru>"
    explain.txt            — "# <розділ>" і рядки "- <uk> || <ru>"
    questions/*.txt        — питання (формат описано в questions/README.md)
"""
import hashlib, json, pathlib, re, sys, time

ROOT = pathlib.Path(__file__).resolve().parent.parent
CONTENT, APP = ROOT / 'content', ROOT / 'app'
SPLIT = ' || '
errors = []


def read(p):
    return p.read_text(encoding='utf-8') if p.exists() else ''


def pair(s, where):
    if SPLIT not in s:
        errors.append(f'{where}: немає " || " між uk та ru: {s[:60]}')
        return {'uk': s.strip(), 'ru': s.strip()}
    uk, ru = s.split(SPLIT, 1)
    return {'uk': uk.strip(), 'ru': ru.strip()}


def code_key(c):
    return [int(x) for x in c.split('.') if x.isdigit()]


# ───────────── Правила ─────────────
pdr = json.loads(read(CONTENT / 'pdr_uk.json'))
meta = json.loads(read(CONTENT / 'meta.json') or '{}')
ru_done = 0
for sec in pdr['sections']:
    tr = read(CONTENT / 'ru' / f"rules_{sec['n']:02d}.txt")
    blocks = {}
    for line in tr.splitlines():
        if line.startswith('## '):
            sec['title']['ru'] = line[3:].strip()
        elif line.strip() and not line.startswith('#'):
            bid, _, text = line.partition(' ')
            blocks[bid] = text.strip().replace('\\n', '\n')
    ids = {b['id'] for p in sec['points'] for b in p['blocks']}
    for bid in blocks:
        if bid not in ids:
            errors.append(f"ru/rules_{sec['n']:02d}.txt: невідомий блок {bid}")
    for p in sec['points']:
        for b in p['blocks']:
            if b['id'] in blocks:
                b['ru'] = blocks[b['id']]
                ru_done += 1
                tok_uk = sorted(re.findall(r'\{[smp]:[\d.]+\}', b['uk']))
                tok_ru = sorted(re.findall(r'\{[smp]:[\d.]+\}', b['ru']))
                if tok_uk != tok_ru:
                    errors.append(f"{b['id']}: посилання на знаки в перекладі не збігаються {set(tok_uk) ^ set(tok_ru)}")
            b.pop('id', None)
total_blocks = sum(len(p['blocks']) for s in pdr['sections'] for p in s['points'])

all_points = [(s, p) for s in pdr['sections'] for p in s['points']]


def refs_to(token):
    out = []
    for s, p in all_points:
        if s['n'] in (33, 34):
            continue
        if any(token in b['uk'] for b in p['blocks']):
            out.append(p['n'])
    return out


# ───────────── Знаки ─────────────
GROUPS = [
    (1, 'Попереджувальні знаки', 'Предупреждающие знаки', 'Попереджувальні', 'Предупреждающие'),
    (2, 'Знаки пріоритету', 'Знаки приоритета', 'Пріоритету', 'Приоритета'),
    (3, 'Заборонні знаки', 'Запрещающие знаки', 'Заборонні', 'Запрещающие'),
    (4, 'Наказові знаки', 'Предписывающие знаки', 'Наказові', 'Предписывающие'),
    (5, 'Інформаційно-вказівні знаки', 'Информационно-указательные знаки', 'Інформаційні', 'Информационные'),
    (6, 'Знаки сервісу', 'Знаки сервиса', 'Сервісу', 'Сервиса'),
    (7, 'Таблички до дорожніх знаків', 'Таблички к дорожным знакам', 'Таблички', 'Таблички'),
]
names_uk = json.loads(read(CONTENT / 'sign_names_uk.json'))['sign']
names_ru = {}
for line in read(CONTENT / 'ru' / 'sign_names.txt').splitlines():
    if line.strip() and not line.startswith('#'):
        c, _, n = line.strip().partition(' ')
        names_ru[c] = n.strip()
images = {p.stem: f'img/signs/{p.name}' for ext in ('png', 'svg') for p in (APP / 'img' / 'signs').glob('*.' + ext)}

# описи знаків: блоки розділу 33, що починаються з "**{s:..." або "**1.4.1–1.4.7", і їхнє продовження
sec33 = next(s for s in pdr['sections'] if s['n'] == 33)
desc, head_names = {}, {}
HEAD =re.compile(r'^\*\*((?:\{s:[\d.]+\}[,\s]*(?:і|та)?\s*)+|[\d.]+\s*[–-]\s*[\d.]+)')
for p in sec33['points']:
    cur = []
    for b in p['blocks']:
        m = HEAD.match(b['uk'])
        if m:
            head = m.group(1)
            codes = re.findall(r'\{s:([\d.]+)\}', head)
            if not codes:
                a, z = re.split(r'\s*[–-]\s*', head.strip())
                pre = a.rsplit('.', 1)[0]
                lo, hi = int(a.rsplit('.', 1)[1]), int(z.rsplit('.', 1)[1])
                codes = [f'{pre}.{i}' for i in range(lo, hi + 1)]
            cur = codes
            title = re.search(r'"([^"]+)"', b['uk'].split('**')[1] if b['uk'].count('**') >= 2 else '')
            for c in codes:
                desc.setdefault(c, []).append(b)
                if title:
                    head_names.setdefault(c, title.group(1))
        elif cur and (b['t'] == 'li' or any(f'{{s:{c}}}' in b['uk'] for c in cur)):
            for c in cur:
                if b not in desc.get(c, []):
                    desc.setdefault(c, []).append(b)
        else:
            cur = []

signs = []
for c in sorted(set(names_uk) | set(desc), key=code_key):
    g = int(c.split('.')[0])
    if g < 1 or g > 7:
        continue
    nm = {'uk': names_uk.get(c) or head_names.get(c, '')}
    if c in names_ru:
        nm['ru'] = names_ru[c]
    item = {'c': c, 'g': g, 'name': nm, 'desc': [{k: v for k, v in b.items() if k in ('t', 'label', 'uk', 'ru')} for b in desc.get(c, [])],
            'refs': refs_to('{s:%s}' % c)}
    if c in images:
        item['img'] = images[c]
    signs.append(item)
missing_img = [s['c'] for s in signs if 'img' not in s]
missing_ru = [s['c'] for s in signs if 'ru' not in s['name']]

# ───────────── Розмітка ─────────────
sec34 = next(s for s in pdr['sections'] if s['n'] == 34)
mdesc = {}
for p in sec34['points']:
    for b in p['blocks']:
        m = re.match(r'^(?:\*\*)?((?:\{m:[\d.]+\}[,\s]*(?:\*\*)?[,\s]*)+)', b['uk'])
        if m:
            for c in re.findall(r'\{m:([\d.]+)\}', m.group(1)):
                mdesc.setdefault(c, []).append({k: v for k, v in b.items() if k in ('t', 'label', 'uk', 'ru')})
marking = []
for line in read(CONTENT / 'marking.txt').splitlines():
    if not line.strip() or line.startswith('#'):
        continue
    c, _, rest = line.strip().partition(' ')
    marking.append({'c': c, 'kind': 'v' if c.startswith('2.') else 'h', 'name': pair(rest, f'marking.txt {c}'),
                    'desc': mdesc.get(c, mdesc.get(c.rsplit('.', 1)[0], [])), 'refs': refs_to('{m:%s}' % c)})

# ───────────── Пояснення ─────────────
explain, cur = {}, None
for i, line in enumerate(read(CONTENT / 'explain.txt').splitlines(), 1):
    m = re.match(r'^# (\d+)\s*$', line)
    if m:
        cur = m.group(1)
        explain[cur] = {'uk': [], 'ru': []}
    elif line.startswith('- ') and cur:
        pr = pair(line[2:], f'explain.txt:{i}')
        explain[cur]['uk'].append(pr['uk'])
        explain[cur]['ru'].append(pr['ru'])

# ───────────── Питання ─────────────
questions, seen = [], set()
for f in sorted((CONTENT / 'questions').glob('*.txt')):
    topic, q = None, None

    def flush():
        global q
        if not q:
            return
        where = f"{f.name}: {q['q']['uk'][:50]}"
        if q.get('c') is None or len(q['a']) < 2:
            errors.append(f'{where}: потрібно ≥2 відповіді і одна правильна (+)')
        h = hashlib.sha1((q['t'] + q['q']['uk'] + '|'.join(a['uk'] for a in q['a'])).encode('utf-8')).hexdigest()[:9]
        q['id'] = 'q' + h
        if q['id'] in seen:
            errors.append(f'{where}: дубль питання')
        seen.add(q['id'])
        for r in q.get('ref', []):
            if not any(p['n'] == r for _, p in all_points):
                errors.append(f'{where}: немає пункту {r}')
        questions.append(q)
        q = None

    for i, raw in enumerate(read(f).splitlines(), 1):
        line = raw.rstrip()
        where = f'{f.name}:{i}'
        if not line.strip() or line.startswith('//'):
            continue
        if line.startswith('@ '):
            flush(); topic = line[2:].strip()
        elif line.startswith('Q: '):
            flush(); q = {'t': topic, 'q': pair(line[3:], where), 'a': []}
        elif q is None:
            errors.append(f'{where}: рядок поза питанням')
        elif line.startswith('I: '):
            try:
                q['img'] = json.loads(line[3:])
            except json.JSONDecodeError as e:
                errors.append(f'{where}: зображення — некоректний JSON: {e}')
        elif line[:2] in ('+ ', '- '):
            if line[0] == '+':
                if q.get('c') is not None:
                    errors.append(f'{where}: дві правильні відповіді')
                q['c'] = len(q['a'])
            q['a'].append(pair(line[2:], where))
        elif line.startswith('E: '):
            q['e'] = pair(line[3:], where)
        elif line.startswith('R: '):
            q['ref'] = line[3:].replace(',', ' ').split()
        else:
            errors.append(f'{where}: незрозумілий рядок: {line[:50]}')
    flush()

# ───────────── запис ─────────────
data = APP / 'data'
data.mkdir(exist_ok=True)


def js(name, var, obj):
    (data / name).write_text(f'window.{var}=' + json.dumps(obj, ensure_ascii=False, separators=(',', ':')) + ';\n', encoding='utf-8')


pdr['meta'] = {'edition': meta.get('edition', ''), 'built': time.strftime('%Y-%m-%d')}
js('rules.js', 'PDR', pdr)
js('signs.js', 'SIGNS', {'groups': [{'n': n, 'name': {'uk': a, 'ru': b}, 'short': {'uk': c, 'ru': d}} for n, a, b, c, d in GROUPS], 'list': signs})
js('marking.js', 'MARKING', {'list': marking})
js('explain.js', 'EXPLAIN', explain)
js('questions.js', 'QUESTIONS', {'list': questions})

# список файлів для service worker; версія — хеш вмісту (без index.html, куди її вписуємо)
files = sorted(str(p.relative_to(APP)).replace('\\', '/') for p in APP.rglob('*') if p.is_file() and p.name != 'sw.js')
h = hashlib.sha1()
for f in files:
    if f != 'index.html':
        h.update(f.encode() + (APP / f).read_bytes())
digest = h.hexdigest()[:10]
# ?v=<версія> у посиланнях на css/js/data, щоб браузер і WebView2 не брали старі файли з кешу
index = APP / 'index.html'
index.write_text(re.sub(r'((?:src|href)="(?:css|js|data)/[^"?]+)(?:\?v=[^"]*)?"', rf'\1?v={digest}"', read(index)), encoding='utf-8')
sw = read(ROOT / 'tools' / 'sw.template.js').replace('__VERSION__', digest).replace('__FILES__', json.dumps(['./'] + files, ensure_ascii=False))
(APP / 'sw.js').write_text(sw, encoding='utf-8')

by_topic = {}
for q in questions:
    by_topic[q['t']] = by_topic.get(q['t'], 0) + 1
print(f"rules: {len(pdr['sections'])} sections, ru {ru_done}/{total_blocks} blocks")
print(f"signs: {len(signs)}, without image: {len(missing_img)} {missing_img[:12]}, without ru name: {len(missing_ru)}")
print(f"marking: {len(marking)}, explain: {len(explain)} sections, questions: {len(questions)} {by_topic}")
print(f"sw: {len(files)} files, version {digest}")
if errors:
    print(f'\n{len(errors)} problem(s):')
    for e in errors[:60]:
        print('  -', e)
    sys.exit(1)
