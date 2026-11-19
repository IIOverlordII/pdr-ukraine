"""Розбір офіційних тестових питань ГСЦ МВС (PDF, наказ від 04.09.2025 № 190).

    python tools/parse_hsc.py <questions.pdf> <answers.txt> <content_dir> <app_img_dir>

answers.txt — таблиця правильних відповідей, переписана зі сканів «Відповіді на тести з ПДР.pdf»:
рядки «# <розділ>» і далі «<питання> <відповідь>» (по одному або кілька пар у рядку).

На виході:
    content/hsc_uk.json        — розділи, питання, варіанти, правильні відповіді, зображення
    app/img/hsc/<розділ>-<питання>-<n>.jpg — ілюстрації до питань
"""
import json, re, sys, pathlib
import pymupdf

pdf, answers_txt, content, img_dir = (pathlib.Path(a) for a in sys.argv[1:5])
img_dir.mkdir(parents=True, exist_ok=True)

SECTION = re.compile(r'^(\d{1,2}(?:\.\d)?)\.\s+(\S.{3,})$')
QUESTION = re.compile(r'^(\d{1,3})\.\s*(.*)$')
OPTION = re.compile(r'^(\d)\)\s*(.*)$')


def stream(doc):
    """Текстові рядки й зображення в порядку читання: (сторінка, y, тип, дані)."""
    for pno, page in enumerate(doc):
        items, bullets = [], []
        blocks = page.get_text('dict')['blocks']
        for b in blocks:
            if b['type'] == 1:
                x0, y0, x1, y1 = b['bbox']
                if x1 - x0 < 16 and y1 - y0 < 16:         # значок-маркер перед варіантом відповіді
                    bullets.append(b['bbox'])
        for b in blocks:
            if b['type'] == 0:
                for ln in b['lines']:
                    text = ''.join(s['text'] for s in ln['spans']).strip()
                    if not text:
                        continue
                    x0, y0, x1, y1 = ln['bbox']
                    if any(bx1 <= x0 + 2 and min(y1, by1) - max(y0, by0) > 0.4 * (by1 - by0)
                           for bx0, by0, bx1, by1 in bullets):
                        text = '• ' + text
                    items.append((y0, x0, 'text', text))
            elif b['type'] == 1:
                w, h = b['bbox'][2] - b['bbox'][0], b['bbox'][3] - b['bbox'][1]
                # знаки бувають завбільшки ~30×30 pt, таблички — ~57×18 pt; маркери (<16 pt) і широкі смуги-підкладки
                # під варіантами (~180×16 pt) пропускаємо
                if (w >= 20 and h >= 20) or (h >= 12 and 30 <= w <= 120):
                    items.append((b['bbox'][1], b['bbox'][0], 'img', (pno, b['bbox'], b.get('width') or 0)))
        items.sort(key=lambda t: (round(t[0] / 3), t[1]))
        for y, x, kind, data in items:
            yield pno, kind, data


def join(lines):
    s = ' '.join(lines)
    s = re.sub(r'\s+', ' ', s).strip()
    return s


def is_upper(text):
    letters = re.sub(r'[^А-ЯІЇЄҐа-яіїєґA-Za-z]', '', text)
    return len(letters) >= 2 and letters.upper() == letters


doc = pymupdf.open(pdf)
sections, sec, q, cur = [], None, None, None   # cur: куди дописуємо текст ('q' або індекс варіанта)


def finish():
    global q
    if q is None:
        return
    q['q'] = join(q.pop('_q'))
    q['a'] = [join(o) for o in q.pop('_a')]
    if not q['a']:          # варіанти «1. … 2. …» усередині тексту питання
        m = re.search(r'\s1\.\s+(.*)$', q['q'])
        if m:
            parts = re.split(r'\s+\d\.\s+', ' ' + m.group(1).strip())
            parts = [re.sub(r'[»"]+\.?$', '', p).strip() for p in parts if p.strip()]
            if len(parts) >= 2:
                q['q'] = q['q'][:m.start()].strip()
                q['a'] = parts
    sec['questions'].append(q)
    q = None


for pno, kind, data in stream(doc):
    if kind == 'img':
        if q is not None:
            q.setdefault('_img', []).append(data)
        continue
    text = data
    if re.fullmatch(r'\d{1,3}', text) and q is None and sec is None:
        continue
    m = SECTION.match(text)
    if m and is_upper(text):
        finish()
        sec = {'n': m.group(1), 'title': join([m.group(2)]), 'questions': []}
        sections.append(sec)
        continue
    if sec is None:
        continue
    if q is None and not sec['questions'] and is_upper(text):   # продовження довгого заголовка
        sec['title'] = join([sec['title'], text])
        continue
    if re.fullmatch(r'\d{1,3}', text):              # номер сторінки
        continue
    if text.startswith('• ') and q is not None:
        q['_a'].append([text[2:]])
        cur = 'a'
        continue
    m = OPTION.match(text)
    if m and q is not None and int(m.group(1)) == len(q['_a']) + 1:
        q['_a'].append([m.group(2)])
        cur = 'a'
        continue
    m = QUESTION.match(text)
    if m and (q is None or q['_a']) and (q is None or int(m.group(1)) == q['n'] + 1 or int(m.group(1)) == 1):
        finish()
        q = {'n': int(m.group(1)), '_q': [m.group(2)], '_a': [], 'page': pno + 1}
        cur = 'q'
        continue
    if q is None:
        continue
    if cur == 'a' and q['_a']:
        q['_a'][-1].append(text)
    else:
        q['_q'].append(text)
finish()

# правильні відповіді
answers, s = {}, None
for line in answers_txt.read_text(encoding='utf-8').splitlines():
    line = line.split('//')[0].strip()
    if not line:
        continue
    if line.startswith('#'):
        s = line[1:].strip()
        continue
    nums = [int(x) for x in line.split()]
    for i in range(0, len(nums) - 1, 2):
        answers[(s, nums[i])] = nums[i + 1]

# залишаємо лише розділи, для яких переписано відповіді (категорія B)
wanted = {s_n for s_n, _ in answers}
sections = [x for x in sections if x['n'] in wanted]

problems = []
for sec in sections:
    for q in sec['questions']:
        c = answers.get((sec['n'], q['n']))
        if c is None:
            problems.append(f"{sec['n']}.{q['n']}: немає відповіді")
        elif not 1 <= c <= len(q['a']):
            problems.append(f"{sec['n']}.{q['n']}: відповідь {c}, а варіантів {len(q['a'])}")
        else:
            q['c'] = c - 1
        imgs = []
        for k, (pno, bbox, src_w) in enumerate(q.pop('_img', []), 1):
            name = f"{sec['n']}-{q['n']}-{k}.jpg"
            bw = bbox[2] - bbox[0]
            # роздільність оригіналу, але не ширше 600 px (застосунок показує до 560) і не вужче 150 px — дрібні знаки збільшуємо
            dpi = round(max(min(72 * src_w / bw if src_w else 110, 600 * 72 / bw, 200), 150 * 72 / bw))
            pix = doc[pno].get_pixmap(clip=pymupdf.Rect(bbox), dpi=dpi)
            pix.save(img_dir / name, jpg_quality=78)
            imgs.append(f'img/hsc/{name}')
        if imgs:
            q['img'] = imgs
for (s_n, q_n) in answers:
    if not any(x['n'] == s_n and any(q['n'] == q_n for q in x['questions']) for x in sections):
        problems.append(f'{s_n}.{q_n}: є відповідь, але питання не знайдено')

(content / 'hsc_uk.json').write_text(json.dumps({'sections': sections}, ensure_ascii=False, indent=1), encoding='utf-8', newline='\n')
total = sum(len(s['questions']) for s in sections)
print('sections', len(sections), 'questions', total, 'with images', sum(1 for s in sections for q in s['questions'] if 'img' in q))
for s in sections:
    print(f"  {s['n']:>2} {s['title'][:50]:<50} {len(s['questions'])}")
if problems:
    print(len(problems), 'problems:'); print('\n'.join(problems[:80]))
