"""Завантажує зображення дорожніх знаків України з Wikimedia Commons і копіює їх у app/img/signs/<номер>.png.

    python tools/fetch_signs.py <тека_кешу>                 — завантажити й імпортувати
    python tools/fetch_signs.py <тека_кешу> --import-only   — лише імпортувати вже завантажене

Wikimedia обмежує завантаження оригіналів, тому беремо мініатюри стандартного розміру 330 px
через API imageinfo (https://www.mediawiki.org/wiki/Common_thumbnail_sizes).
Зображення знаків на Commons — суспільне надбання (офіційні символи).
"""
import json, re, shutil, sys, time, pathlib, urllib.error, urllib.parse, urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
DST = ROOT / 'app' / 'img' / 'signs'
UA = {'User-Agent': 'PravaStudyApp/0.3 (offline traffic-rules study app; python-urllib)'}
API = 'https://commons.wikimedia.org/w/api.php?'
CATS = ['warning', 'priority', 'prohibitory', 'mandatory', 'information', 'service', 'additional']


def api(q):
    url = API + urllib.parse.urlencode({**q, 'format': 'json'})
    return json.load(urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60))


def download(cache):
    titles = []
    for c in CATS:
        cont = {}
        while True:
            r = api({'action': 'query', 'list': 'categorymembers', 'cmtitle': f'Category:SVG {c} road signs of Ukraine',
                     'cmtype': 'file', 'cmlimit': '500', **cont})
            titles += [m['title'] for m in r['query']['categorymembers']]
            if 'continue' not in r:
                break
            cont = r['continue']
    thumbs = {}
    for i in range(0, len(titles), 50):
        r = api({'action': 'query', 'titles': '|'.join(titles[i:i + 50]), 'prop': 'imageinfo', 'iiprop': 'url', 'iiurlwidth': '330'})
        for p in r['query']['pages'].values():
            thumbs[p['title']] = p['imageinfo'][0]['thumburl']
        time.sleep(1)
    for title, url in thumbs.items():
        dst = cache / (title.split(':', 1)[1].rsplit('.', 1)[0] + '.png')
        if dst.exists():
            continue
        while True:
            try:
                dst.write_bytes(urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60).read())
                break
            except urllib.error.HTTPError as e:
                if e.code != 429:
                    print('fail', title, e)
                    break
                time.sleep(int(e.headers.get('Retry-After') or 60) + 5)
        time.sleep(0.5)


def import_images(cache):
    """Обирає для кожного номера знака найактуальніший варіант файлу."""
    best = {}
    for f in cache.glob('*.png'):
        m = re.match(r'^(?:UA road sign|Ua)\s+([\d.]+(?:-\d+)?)\.?(?:\s+(.*))?$', f.stem, re.I)
        if not m:
            continue
        code, extra = m.group(1).rstrip('.'), (m.group(2) or '').strip()
        # без уточнення > (2021) > інші; застарілі (2002–2021) — найнижчий пріоритет
        rank = 3 if not extra else 2 if '2021)' in extra and '–' not in extra and '-' not in extra else 0 if re.search(r'20\d\d\s*[–-]\s*20\d\d', extra) else 1
        if code not in best or rank > best[code][0]:
            best[code] = (rank, f)
    # знаки без власного файлу: беремо варіант із числом (3.29-050) або підваріант (4.18.1)
    names = json.loads((ROOT / 'content' / 'sign_names_uk.json').read_text(encoding='utf-8'))['sign']
    for code in names:
        if code in best:
            continue
        variants = sorted(c for c in best if c.startswith(code + '.') or c.startswith(code + '-'))
        if variants:
            pick = next((c for c in variants if c.endswith('50')), variants[0])
            best[code] = best[pick]
    DST.mkdir(parents=True, exist_ok=True)
    for code, (_, f) in best.items():
        shutil.copyfile(f, DST / f'{code}.png')
    print('imported', len(best), 'signs into', DST)


if __name__ == '__main__':
    cache = pathlib.Path(sys.argv[1])
    cache.mkdir(parents=True, exist_ok=True)
    if '--import-only' not in sys.argv:
        download(cache)
    import_images(cache)
