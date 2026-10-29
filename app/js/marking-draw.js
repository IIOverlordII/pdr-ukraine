/* Схематичні зображення дорожньої розмітки (SVG), ДСТУ 4100 спрощено. */
(function () {
  'use strict';
  const Wd = 240, Ht = 120, M = Ht / 2;
  const WH = '#f7f7f7', YE = '#f6c400', RE = '#d32f2f', BL = '#1e63d6', AS = '#55595f';
  const ln = (y, c = WH, w = 3, dash = '') => `<line x1="0" y1="${y}" x2="${Wd}" y2="${y}" stroke="${c}" stroke-width="${w}"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`;
  const vln = (x, c = WH, w = 3, dash = '', y1 = 0, y2 = Ht) => `<line x1="${x}" y1="${y1}" x2="${x}" y2="${y2}" stroke="${c}" stroke-width="${w}"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`;
  const txt = (x, y, t, size = 30, c = WH, extra = '') => `<text x="${x}" y="${y}" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-weight="800" font-size="${size}" fill="${c}" ${extra}>${t}</text>`;
  const curb = `<rect x="0" y="${Ht - 14}" width="${Wd}" height="14" fill="#b9bdc2"/>`;
  const zebra = (c1, c2) => { let s = ''; for (let i = 0; i < 9; i++) s += `<rect x="${12 + i * 25}" y="14" width="14" height="${Ht - 28}" fill="${i % 2 && c2 ? c2 : c1}"/>`; return s; };
  const hatch = (pts, c = WH) => {
    const id = 'h' + Math.random().toString(36).slice(2, 8);
    return `<defs><clipPath id="${id}"><polygon points="${pts}"/></clipPath></defs><polygon points="${pts}" fill="none" stroke="${c}" stroke-width="3"/>` +
      `<g clip-path="url(#${id})">${Array.from({ length: 30 }, (_, i) => `<line x1="${i * 14 - 80}" y1="${Ht}" x2="${i * 14 + 20}" y2="0" stroke="${c}" stroke-width="4"/>`).join('')}</g>`;
  };
  const arrow = (x, y, kind, c = WH, s = 1) => {
    const st = `M${x} ${y + 34 * s} V${y - 6 * s}`;
    const head = (hx, hy, ang) => `<polygon points="0,-10 7,4 -7,4" fill="${c}" transform="translate(${hx} ${hy}) rotate(${ang}) scale(${s})"/>`;
    let p = `<path d="${st}" stroke="${c}" stroke-width="${5 * s}" fill="none"/>`;
    if (kind.includes('s')) p += head(x, y - 10 * s, 0);
    if (kind.includes('r')) p += `<path d="M${x} ${y + 8 * s} q0 -10 14 -10 h4" stroke="${c}" stroke-width="${5 * s}" fill="none"/>` + head(x + 22 * s, y - 2 * s, 90);
    if (kind.includes('l')) p += `<path d="M${x} ${y + 8 * s} q0 -10 -14 -10 h-4" stroke="${c}" stroke-width="${5 * s}" fill="none"/>` + head(x - 22 * s, y - 2 * s, -90);
    return p;
  };
  const bike = (x, y, c = WH, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})" stroke="${c}" stroke-width="3" fill="none"><circle cx="-14" cy="6" r="9"/><circle cx="14" cy="6" r="9"/><path d="M-14 6 L-4 -8 H10 L14 6 M-4 -8 L2 6 H-14 M10 -8 L8 -14 H2"/></g>`;
  const signOnRoad = code => `<image href="${window.signSrc ? signSrc(code) : ''}" x="${Wd / 2 - 60}" y="6" width="120" height="${Ht - 12}" preserveAspectRatio="xMidYMid meet"/>`;
  const stripes = (x, y, w, h, c1, c2, ang) => {
    const id = 's' + Math.random().toString(36).slice(2, 8);
    let s = `<defs><clipPath id="${id}"><rect x="${x}" y="${y}" width="${w}" height="${h}"/></clipPath></defs><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c2}"/><g clip-path="url(#${id})">`;
    if (ang === 90) for (let i = 0; i * 24 < h; i++) s += `<rect x="${x}" y="${y + 6 + i * 24}" width="${w}" height="12" fill="${c1}"/>`;
    else for (let i = -20; i < 40; i++) s += `<rect x="${x + i * 24}" y="${y - 200}" width="12" height="600" fill="${c1}" transform="rotate(${ang} ${x + i * 24} ${y + h / 2})"/>`;
    return s + `</g><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="#333" stroke-width="1"/>`;
  };

  const D = {
    '1.1': () => ln(M),
    '1.2': () => ln(Ht - 22, WH, 7) + curb,
    '1.3': () => ln(M - 5) + ln(M + 5),
    '1.4': () => ln(Ht - 20, YE, 5) + curb,
    '1.5': () => ln(M, WH, 3, '18 42'),
    '1.6': () => ln(M, WH, 3, '45 15'),
    '1.7': () => ln(M, WH, 3, '10 10'),
    '1.8': () => ln(M, WH, 8, '20 10'),
    '1.9': () => ln(M - 5, WH, 3, '30 20') + ln(M + 5, WH, 3, '30 20'),
    '1.10.1': () => ln(Ht - 20, YE, 5, '24 14') + curb,
    '1.10.2': () => `<rect x="50" y="18" width="140" height="84" fill="none" stroke="${YE}" stroke-width="4"/><line x1="50" y1="18" x2="190" y2="102" stroke="${YE}" stroke-width="4"/><line x1="190" y1="18" x2="50" y2="102" stroke="${YE}" stroke-width="4"/>`,
    '1.10.3': () => { let s = `<rect x="40" y="10" width="160" height="100" fill="none" stroke="${YE}" stroke-width="4"/>`; for (let i = -6; i < 14; i++) s += `<line x1="${40 + i * 18}" y1="10" x2="${40 + i * 18 + 100}" y2="110" stroke="${YE}" stroke-width="3"/><line x1="${40 + i * 18 + 100}" y1="10" x2="${40 + i * 18}" y2="110" stroke="${YE}" stroke-width="3"/>`; return `<defs><clipPath id="bx"><rect x="40" y="10" width="160" height="100"/></clipPath></defs><g clip-path="url(#bx)">${s}</g>`; },
    '1.11': () => ln(M - 5) + ln(M + 5, WH, 3, '24 16'),
    '1.12': () => ln(M, WH, 3) + vln(Wd / 2, WH, 12, '', M + 3, Ht - 4),
    '1.13': () => { let s = ''; for (let i = 0; i < 6; i++) s += `<polygon points="${Wd / 2 - 8},${8 + i * 18} ${Wd / 2 - 8},${22 + i * 18} ${Wd / 2 + 12},${15 + i * 18}" fill="${WH}"/>`; return s; },
    '1.14.1': () => zebra(WH),
    '1.14.2': () => zebra(WH, RE),
    '1.14.3': () => zebra(WH, RE) + `<rect x="100" y="14" width="40" height="${Ht - 28}" fill="none" stroke="${YE}" stroke-width="4" stroke-dasharray="6 5"/>`,
    '1.15': () => { let s = ''; for (let i = 0; i < 7; i++) s += `<rect x="70" y="${8 + i * 15}" width="9" height="9" fill="${i % 2 ? RE : WH}"/><rect x="160" y="${8 + i * 15}" width="9" height="9" fill="${i % 2 ? RE : WH}"/>`; return s + bike(120, 60, WH, .9); },
    '1.16.1': () => hatch('20,60 120,25 220,60 120,95'),
    '1.16.2': () => hatch('20,60 220,22 220,98'),
    '1.16.3': () => hatch('20,22 20,98 220,60'),
    '1.16.4': () => hatch('40,30 200,30 200,90 40,90'),
    '1.17.1': () => `<polyline points="10,100 30,72 50,100 70,72 90,100 110,72 130,100 150,72 170,100 190,72 210,100 230,72" fill="none" stroke="${YE}" stroke-width="4"/>` + ln(Ht - 22, YE, 3) + txt(120, 50, 'BUS', 26, YE),
    '1.17.2': () => hatch('20,25 220,25 220,95 20,95', YE),
    '1.17.3': () => `<rect x="30" y="20" width="180" height="80" fill="none" stroke="${YE}" stroke-width="3" stroke-dasharray="14 8"/>` + txt(120, 72, 'TAXI', 34, YE),
    '1.18': () => arrow(50, 50, 's') + arrow(120, 50, 'sr') + arrow(190, 50, 'l'),
    '1.19': () => `<path d="M40 85 H140 Q180 85 196 52" stroke="${WH}" stroke-width="7" fill="none"/><polygon points="205,35 206,60 186,52" fill="${WH}"/>`,
    '1.20': () => `<polygon points="70,20 170,20 120,104" fill="none" stroke="${WH}" stroke-width="8"/>`,
    '1.21': () => txt(120, 78, 'STOP', 52),
    '1.22': () => { let s = ''; for (let i = 0; i < 6; i++) s += `<polygon points="${20 + i * 38},30 ${46 + i * 38},30 ${33 + i * 38},90" fill="${WH}"/>`; return s; },
    '1.23': () => { let s = `<rect x="20" y="10" width="200" height="100" fill="#6b6f75"/>`; for (let i = 0; i < 5; i++) s += `<polygon points="${30 + i * 40},100 ${50 + i * 40},20 ${70 + i * 40},100" fill="${i % 2 ? YE : WH}"/>`; return s; },
    '1.24': () => `<polyline points="0,90 20,90 30,76 50,104 70,76 90,104 110,76 130,104 150,76 170,104 190,76 210,104 220,90 240,90" fill="none" stroke="${WH}" stroke-width="4"/>` +
      `<polyline points="0,40 20,40 30,26 50,54 70,26 90,54 110,26 130,54 150,26 170,54 190,26 210,54 220,40 240,40" fill="none" stroke="${WH}" stroke-width="4"/>`,
    '1.25': () => { let s = ''; for (let i = 0; i < 5; i++) s += `<rect x="${30 + i * 40}" y="10" width="18" height="100" fill="${YE}"/>`; return s; },
    '1.26': () => `<rect x="60" y="28" width="120" height="64" fill="none" stroke="${WH}" stroke-width="4"/>` + txt(120, 72, 'M-05', 30),
    '1.27': () => txt(120, 88, 'A', 72),
    '1.28.1': () => txt(80, 88, 'A', 64) + bike(165, 64, WH, 1.3),
    '1.28.2': () => `<g fill="${WH}"><circle cx="80" cy="34" r="8"/><rect x="74" y="44" width="12" height="34" rx="5"/><rect x="74" y="72" width="5" height="26"/><rect x="81" y="72" width="5" height="26"/></g>` + vln(120, WH, 3, '', 15, 105) + bike(170, 64, WH, 1.2),
    '1.28.3': () => bike(120, 74, WH, 1.4) + `<polyline points="95,36 120,18 145,36" fill="none" stroke="${WH}" stroke-width="6"/><polyline points="95,50 120,32 145,50" fill="none" stroke="${WH}" stroke-width="6"/>`,
    '1.29': () => signOnRoad('1.32'),
    '1.30': () => signOnRoad('1.39'),
    '1.31': () => signOnRoad('3.29'),
    '1.32': () => txt(120, 92, 'P', 84),
    '1.33': () => ln(Ht - 30, BL, 4) + vln(40, BL, 4, '', Ht - 75, Ht - 30) + vln(120, BL, 4, '', Ht - 75, Ht - 30) + vln(200, BL, 4, '', Ht - 75, Ht - 30) + curb,
    '1.34': () => ln(Ht - 30, WH, 4) + vln(40, WH, 4, '', 20, Ht - 30) + vln(120, WH, 4, '', 20, Ht - 30) + vln(200, WH, 4, '', 20, Ht - 30) + curb,
    '1.35': () => `<rect x="70" y="10" width="100" height="100" fill="${BL}"/><g fill="${WH}" stroke="${WH}"><circle cx="112" cy="28" r="7"/><path d="M110 38 v26 h20 l8 22" fill="none" stroke-width="7"/><path d="M98 58 a22 22 0 1 0 30 26" fill="none" stroke-width="6"/></g>`,
    '1.36': () => bike(120, 62, WH, 2),
    '1.37': () => arrow(80, 50, 's') + arrow(160, 50, 'sl') + bike(205, 92, WH, .6),
    '1.38': () => `<rect x="80" y="14" width="80" height="92" rx="10" fill="none" stroke="${WH}" stroke-width="4"/><polygon points="126,22 98,66 118,66 108,100 144,52 124,52 134,22" fill="${WH}"/>`,
    '1.39.1': () => txt(120, 76, 'ШКОЛА', 40),
    '1.39.2': () => `<polygon points="120,10 214,106 26,106" fill="none" stroke="${WH}" stroke-width="5"/><g fill="${WH}"><circle cx="104" cy="52" r="7"/><path d="M98 62 h12 l-2 30 h-8z"/><circle cx="136" cy="56" r="6"/><path d="M131 65 h10 l-2 26 h-6z"/></g>`,
    '2.1.1': () => stripes(60, 10, 120, 100, '#111', WH, 45),
    '2.1.2': () => stripes(60, 10, 120, 100, '#111', WH, -45),
    '2.1.3': () => stripes(60, 10, 120, 100, '#111', WH, 90),
    '2.1.4': () => stripes(60, 10, 120, 100, RE, YE, 45),
    '2.1.5': () => stripes(60, 10, 120, 100, RE, YE, -45),
    '2.1.6': () => stripes(60, 10, 120, 100, RE, YE, 90),
    '2.2.1': () => `<rect x="0" y="0" width="${Wd}" height="40" fill="#9ea3a8"/>` + stripes(0, 40, Wd, 22, '#111', WH, 0),
    '2.2.2': () => `<rect x="0" y="0" width="${Wd}" height="40" fill="#9ea3a8"/>` + stripes(0, 40, Wd, 22, RE, YE, 0),
    '2.3.1': () => stripes(70, 20, 100, 80, RE, WH, -40),
    '2.3.2': () => stripes(70, 20, 100, 80, RE, WH, 40),
    '2.3.3': () => stripes(70, 20, 50, 80, RE, WH, 40) + stripes(120, 20, 50, 80, RE, WH, -40),
    '2.4': () => `<rect x="95" y="8" width="50" height="104" rx="6" fill="${WH}" stroke="#333"/>` + [0, 1, 2].map(i => `<rect x="95" y="${22 + i * 30}" width="50" height="14" fill="#111"/>`).join(''),
    '2.5': () => `<rect x="105" y="6" width="30" height="108" fill="${WH}" stroke="#333"/><rect x="105" y="20" width="30" height="16" fill="#111"/><rect x="112" y="22" width="16" height="12" fill="${YE}"/>`,
    '2.6': () => `<rect x="0" y="55" width="${Wd}" height="30" fill="${WH}"/>` + [0, 1, 2, 3, 4, 5].map(i => `<rect x="${i * 40}" y="55" width="20" height="30" fill="#111"/>`).join('') + `<rect x="0" y="85" width="${Wd}" height="35" fill="${AS}"/>`
  };
  D['2.5.1'] = D['2.5']; D['2.5.2'] = D['2.5'];

  window.MarkingDraw = {
    has: code => !!D[code],
    svg(code) {
      const f = D[code];
      const vertical = code.startsWith('2.');
      const bg = vertical ? '#dfe6ee' : AS;
      return `<svg viewBox="0 0 ${Wd} ${Ht}" xmlns="http://www.w3.org/2000/svg" role="img"><rect width="${Wd}" height="${Ht}" rx="8" fill="${bg}"/>${f ? f() : txt(120, 70, code, 30)}</svg>`;
    }
  };
})();
