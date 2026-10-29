"""Розбір сторінок розділів ПДР (HTML) у структурований JSON.

Використання:
    python parse_pdr.py <тека_з_html> <content_dir>

На виході:
    content/pdr_uk.json      — розділи, пункти, блоки тексту з id
    content/sign_names_uk.json — назви знаків і розмітки з підписів зображень

Зберігається лише офіційний текст пунктів Правил. Коментарі, приклади та
зображення сайту-джерела відкидаються.
"""
import sys, re, json, pathlib
from bs4 import BeautifulSoup, NavigableString, Tag

raw = pathlib.Path(sys.argv[1]); content = pathlib.Path(sys.argv[2])
EDIT_NOTE = re.compile(r'\s*\((?:[^()]*?(?:змінено|доповнено|виключено|внесено|введено)[^()]*?)\)', re.I)
names = {'sign': {}, 'marking': {}}


def ref_token(tag):
    """{s:X} / {m:X} для посилань і зображень знаків та розмітки, '' для інших зображень."""
    if tag.name == 'a':
        m = re.match(r'(sign|marking)_([\d.]+)', tag.get('title', '') or '')
        if m:
            return ('{s:%s}' if m.group(1) == 'sign' else '{m:%s}') % m.group(2)
        return None
    if tag.name == 'img':
        m = re.search(r'/uploads/(signs|marking)/([\d.]+)\.png', tag.get('src', ''))
        if not m:
            return ''
        kind = 'sign' if m.group(1) == 'signs' else 'marking'
        alt = (tag.get('alt') or '').strip()
        n = re.match(r'^(?:Розмітка\s+)?[\d.]+\s*[«"](.+)[»"]\s*$', alt)
        if n:
            names[kind].setdefault(m.group(2), n.group(1))
        return ('{s:%s}' if kind == 'sign' else '{m:%s}') % m.group(2)
    return None


def inline(node):
    parts = []
    for c in node.children:
        if isinstance(c, NavigableString):
            parts.append(str(c))
        elif isinstance(c, Tag):
            cls = c.get('class') or []
            if c.name in ('a', 'img'):
                tok = ref_token(c)
                if tok is None:
                    parts.append(inline(c))
                elif tok:
                    parts.append(tok)
            elif c.name == 'br':
                parts.append('\n')
            elif c.name in ('strong', 'b'):
                inner = inline(c)
                parts.append(f'**{inner.strip()}**' if inner.strip() else inner)
            elif c.name == 'button' or 'collapse' in cls:
                continue
            else:
                parts.append(inline(c))
    return ''.join(parts)


TOKEN = r'\{[sm]:[\d.]+\}'


def clean(s):
    s = s.replace('\xa0', ' ')
    s = re.sub(r'[ \t\r\f\v]+', ' ', s)
    # посилання + зображення одного знака дають два однакові токени поспіль
    for _ in range(3):
        s = re.sub(rf'({TOKEN})(\*\*)?\s*\1', r'\1\2', s)
    s = EDIT_NOTE.sub('', s)
    s = re.sub(r'\*\*\s*\*\*', '', s)
    s = re.sub(rf'({TOKEN}),\*\*(?=\{{)', r'\1, ', s)
    s = re.sub(r' *\n *', '\n', s)
    s = re.sub(r'\s+([,.;:])', r'\1', s)
    s = re.sub(r'\n{2,}', '\n', s)
    s = s.strip()
    if s.count('**') % 2:
        s = s.replace('**', '')
    return s


def norm_label(t):
    t = t.replace(' ', '').replace('a)', 'а)').replace('e)', 'е)')
    return t


def direct_rows(table):
    body = table.find('tbody', recursive=False) or table
    return body.find_all('tr', recursive=False)


def blocks_of(body, pid):
    blocks = []

    def add(kind, text, label=None):
        text = clean(text)
        if not text or text in ('.', '**'):
            return
        b = {'id': f'{pid}#{len(blocks)}', 't': kind, 'uk': text}
        if label:
            b['label'] = norm_label(label)
        blocks.append(b)

    def add_table(table):
        """Таблиця з даними (габарити, маси) — окремий блок; комірки рядка розділені « | »."""
        rows = []
        for tr in direct_rows(table):
            cells = [clean(inline(td)).replace('\n', ' ') for td in tr.find_all(['td', 'th'], recursive=False)]
            if any(cells):
                rows.append(' | '.join(cells))
        if rows:
            blocks.append({'id': f'{pid}#{len(blocks)}', 't': 'table', 'uk': '\n'.join(rows)})

    def table_rows(table):
        """Таблиця-список «а) текст». Повертає False, якщо це таблиця даних."""
        for tr in direct_rows(table):
            tds = tr.find_all('td', recursive=False)
            if len(tds) >= 2:
                label = tds[0].get_text(' ', strip=True).replace(' ', '')
                if len(label) > 4 or tds[0].find('table'):
                    return False
                nested = [t for td in tds[1:] for t in td.find_all('table', recursive=False)]
                for t in nested:
                    t.extract()
                add('li', ' '.join(inline(td) for td in tds[1:]), label or None)
                for t in nested:
                    add_table(t)
            elif tds:
                add('p', inline(tds[0]))
        return True

    for c in body.children:
        if not isinstance(c, Tag):
            if str(c).strip():
                add('p', str(c))
            continue
        cls = c.get('class') or []
        if 'pdr-rule-point__inline-num' in cls or 'collapse' in cls:
            continue
        if c.name == 'p':
            if c.find('button'):
                continue
            for chunk in re.split(r'\n\s*\n', inline(c)):
                add('p', chunk)
        elif c.name == 'table':
            mark = len(blocks)
            if not table_rows(c):
                del blocks[mark:]
                add_table(c)
        elif c.name in ('ul', 'ol'):
            for li in c.find_all('li', recursive=False):
                add('li', inline(li))
        elif c.name == 'hr':
            continue
        else:
            for chunk in re.split(r'\n\s*\n', inline(c)):
                add('p', chunk)
    return blocks


def bold_definitions(points):
    """У п. 1.10 частина термінів у джерелі не виділена — вирівнюємо."""
    for p in points:
        if p['n'] != '1.10':
            continue
        for b in p['blocks'][1:]:
            if b['t'] == 'p' and not b['uk'].startswith('**'):
                m = re.match(r'^([а-яіїєґ\'’ ()\-]+?) — ', b['uk'])
                if m:
                    b['uk'] = f"**{m.group(1)}**" + b['uk'][len(m.group(1)):]


sections = []
for f in sorted(raw.glob('*.html')):
    soup = BeautifulSoup(f.read_text(encoding='utf-8'), 'html.parser')
    art = soup.select_one('article.pdr-detail-content')
    num, title = art.h1.get_text(strip=True).split('. ', 1)
    pts = []
    for s in art.select('section.pdr-rule-point'):
        body = s.select_one('.pdr-rule-point__body')
        n = body.select_one('.pdr-rule-point__inline-num').get_text(strip=True)
        pts.append({'n': n, 'blocks': blocks_of(body, n)})
    bold_definitions(pts)
    sections.append({'n': int(num), 'title': {'uk': title}, 'points': pts})

(content / 'pdr_uk.json').write_text(json.dumps({'sections': sections}, ensure_ascii=False, indent=1), encoding='utf-8')
(content / 'sign_names_uk.json').write_text(json.dumps(names, ensure_ascii=False, indent=1, sort_keys=True), encoding='utf-8')
total = sum(len(b['uk']) for s in sections for p in s['points'] for b in p['blocks'])
print('sections', len(sections), 'points', sum(len(s['points']) for s in sections), 'chars', total,
      'sign names', len(names['sign']), 'marking names', len(names['marking']))
