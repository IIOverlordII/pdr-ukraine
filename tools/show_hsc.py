"""Показує офіційні питання ГСЦ розділу в зручному для читання вигляді.

    python -X utf8 tools/show_hsc.py <розділ> [<від> <до>]
"""
import json, pathlib, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
sec_n = sys.argv[1]
lo, hi = (int(sys.argv[2]), int(sys.argv[3])) if len(sys.argv) > 3 else (1, 10 ** 6)
src = next(s for s in json.loads((ROOT / 'content' / 'hsc_uk.json').read_text(encoding='utf-8'))['sections'] if s['n'] == sec_n)
print(f"Розділ {src['n']}. {src['title']} — {len(src['questions'])} питань")
for q in src['questions']:
    if not lo <= q['n'] <= hi:
        continue
    imgs = ' '.join(str(ROOT / 'app' / p) for p in q.get('img', []))
    print(f"\n# {q['n']}   [правильна: {q['c'] + 1}]" + (f"   картинка: {imgs}" if imgs else ''))
    print('Q:', q['q'])
    for i, a in enumerate(q['a'], 1):
        print(f"{i}) {a}" + ('   ✔' if i == q['c'] + 1 else ''))
