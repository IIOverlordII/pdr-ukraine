/* Схеми дорожних ситуацій для питань (SVG).
 *
 * Перехрестя:  {road:'cross'|'T', arms:['N','E','S','W'], cars:[...], signs:[...], lights:[...], peds:[...], tram:true}
 *   car:   {arm:'S', move:'straight'|'left'|'right'|'uturn'|'stop', label:'1', color:'red', type:'car'|'truck'|'bus'|'tram'|'police'|'ambulance'|'moto'|'bike', me:true, pos:0}
 *   sign:  {arm:'S', code:'2.1'}            — знак праворуч перед перехрестям для того, хто під'їжджає з цього боку
 *   light: {arm:'S', state:'red'|'yellow'|'green'|'redyellow'|'off'|'flash', arrow:'right'|'left'}
 *   ped:   {arm:'N'}                         — пішохід на переході через цей бік
 * Пряма дорога: {road:'straight', lanes:1|2, center:'dashed'|'solid'|'double'|'none', cars:[{x, dir:'E'|'W', lane:0, move, label, color, type}],
 *                signs:[{x, side:'top'|'bottom', code}], zebra:x, rail:x}
 */
(function () {
  'use strict';
  const C = 160, W = 44, D = 104, SIZE = 320;
  const COLORS = { red: '#e53935', blue: '#1e88e5', green: '#43a047', yellow: '#fdd835', white: '#f5f5f5', black: '#263238', orange: '#fb8c00', purple: '#8e24aa', gray: '#90a4ae' };
  const ANG = { S: 0, W: 90, N: 180, E: 270 };
  const ROT = { straight: 0, left: -1, right: 1 };
  let uid = 0;

  function rot(x, y, a) {
    const r = a * Math.PI / 180, dx = x - C, dy = y - C;
    return [C + dx * Math.cos(r) - dy * Math.sin(r), C + dx * Math.sin(r) + dy * Math.cos(r)];
  }
  const col = c => COLORS[c] || c || COLORS.red;
  let SRC = null;
  // шлях до зображення знака з каталогу (png або svg)
  window.signSrc = code => {
    if (!SRC) { SRC = {}; ((window.SIGNS && SIGNS.list) || []).forEach(s => { if (s.img) SRC[s.c] = s.img; }); }
    return SRC[code] || '';
  };

  function defs(id) {
    let s = '<defs>';
    for (const [k, v] of Object.entries(COLORS)) {
      s += `<marker id="ah-${id}-${k}" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="4.2" markerHeight="4.2" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="${v}" stroke="#111" stroke-width=".8"/></marker>`;
    }
    return s + '</defs>';
  }

  function vehicle(type, color, label, me) {
    const c = col(color);
    let body = '', len = 36, wid = 20;
    if (type === 'truck') { len = 48; wid = 22; }
    if (type === 'bus') { len = 54; wid = 22; }
    if (type === 'tram') { len = 64; wid = 22; }
    if (type === 'moto') { len = 24; wid = 10; }
    if (type === 'bike') { len = 22; wid = 7; }
    const x = -wid / 2, y = -len / 2;
    if (type === 'tram') {
      body = `<rect x="${x}" y="${y}" width="${wid}" height="${len}" rx="5" fill="${color ? c : '#fbc02d'}" stroke="#222" stroke-width="1.4"/>` +
        `<rect x="${x + 3}" y="${y + 4}" width="${wid - 6}" height="8" rx="2" fill="#bfe3ff"/><line x1="${x}" y1="0" x2="${x + wid}" y2="0" stroke="#222" stroke-width="1"/>`;
    } else if (type === 'moto' || type === 'bike') {
      body = `<rect x="${x}" y="${y}" width="${wid}" height="${len}" rx="4" fill="${c}" stroke="#222" stroke-width="1.3"/>` +
        `<circle cx="0" cy="2" r="${type === 'bike' ? 3.5 : 4.5}" fill="#ffe0b2" stroke="#222" stroke-width="1"/>`;
    } else {
      const fill = type === 'police' ? '#f5f5f5' : type === 'ambulance' ? '#fafafa' : c;
      body = `<rect x="${x}" y="${y}" width="${wid}" height="${len}" rx="5" fill="${fill}" stroke="#222" stroke-width="1.4"/>` +
        `<rect x="${x + 2.5}" y="${y + 5}" width="${wid - 5}" height="${type === 'truck' ? 9 : 8}" rx="2" fill="#bfe3ff" stroke="#222" stroke-width=".7"/>` +
        (type === 'truck' ? `<rect x="${x + 1}" y="${y + 17}" width="${wid - 2}" height="${len - 19}" rx="2" fill="${c}" stroke="#222" stroke-width="1"/>` : '') +
        (type === 'bus' ? `<rect x="${x + 2.5}" y="${y + 17}" width="${wid - 5}" height="${len - 22}" rx="2" fill="none" stroke="#222" stroke-width=".6" stroke-dasharray="5 3"/>` : '');
      if (type === 'police') body += `<rect x="${x + 1}" y="${y + 18}" width="${wid - 2}" height="6" fill="#1565c0"/><rect x="-6" y="${y + 13}" width="5" height="4" fill="#e53935"/><rect x="1" y="${y + 13}" width="5" height="4" fill="#1e88e5"/>`;
      if (type === 'ambulance') body += `<rect x="${x + 1}" y="${y + 18}" width="${wid - 2}" height="5" fill="#e53935"/><rect x="-5" y="${y + 13}" width="10" height="4" fill="#1e88e5"/>`;
    }
    const ring = me ? `<rect x="${x - 4}" y="${y - 4}" width="${wid + 8}" height="${len + 8}" rx="8" fill="none" stroke="#ffeb3b" stroke-width="3"/>` : '';
    return { svg: ring + body, len, label };
  }

  function labelSvg(x, y, text, me) {
    if (!text) return '';
    return `<g><circle cx="${x}" cy="${y}" r="10" fill="${me ? '#ffeb3b' : '#fff'}" stroke="#111" stroke-width="1.6"/>` +
      `<text x="${x}" y="${y + 4.5}" text-anchor="middle" font-size="13" font-weight="800" font-family="system-ui,Segoe UI,Arial" fill="#111">${text}</text></g>`;
  }

  function signImg(code, x, y, size) {
    size = size || 28;
    return `<rect x="${x - size / 2 - 2}" y="${y - size / 2 - 2}" width="${size + 4}" height="${size + 4}" rx="5" fill="#fff" opacity=".85"/>` +
      `<image href="${signSrc(code)}" x="${x - size / 2}" y="${y - size / 2}" width="${size}" height="${size}" preserveAspectRatio="xMidYMid meet"/>`;
  }

  function light(state, x, y, arrow) {
    const on = { red: state === 'red' || state === 'redyellow', yellow: state === 'yellow' || state === 'redyellow' || state === 'flash', green: state === 'green' };
    let s = `<rect x="${x - 7}" y="${y - 19}" width="14" height="38" rx="4" fill="#212121" stroke="#000"/>`;
    s += `<circle cx="${x}" cy="${y - 11}" r="4.5" fill="${on.red ? '#ff1744' : '#4e342e'}"/>`;
    s += `<circle cx="${x}" cy="${y}" r="4.5" fill="${on.yellow ? '#ffd600' : '#4e4a2e'}"/>`;
    s += `<circle cx="${x}" cy="${y + 11}" r="4.5" fill="${on.green ? '#00e676' : '#1b3d2a'}"/>`;
    if (state === 'flash') s += `<circle cx="${x}" cy="${y}" r="7" fill="none" stroke="#ffd600" stroke-width="1.4" stroke-dasharray="2 2"/>`;
    if (arrow) {
      const dir = arrow === 'left' ? -1 : 1;
      s += `<rect x="${x + 7 * dir - (dir < 0 ? 12 : 0)}" y="${y + 5}" width="12" height="12" rx="3" fill="#212121"/>` +
        `<path d="M${x + 7 * dir + 2 * dir} ${y + 11} h${7 * dir}" stroke="#00e676" stroke-width="2.2" marker-end="none"/>` +
        `<path d="M${x + 7 * dir + 9 * dir} ${y + 11} l${-3.5 * dir} -3.2 v6.4z" fill="#00e676"/>`;
    }
    return s;
  }

  function pedestrian(x, y) {
    return `<g><circle cx="${x}" cy="${y - 7}" r="4" fill="#ffccbc" stroke="#222"/>` +
      `<path d="M${x} ${y - 3} v9 M${x} ${y + 6} l-4 7 M${x} ${y + 6} l4 7 M${x - 5} ${y + 1} h10" stroke="#222" stroke-width="2.4" stroke-linecap="round"/></g>`;
  }

  function movePath(move) {
    const sx = C + W / 2, sy = C + W + 10;
    switch (move) {
      case 'straight': return `M${sx} ${sy} L${sx} ${C - D + 8}`;
      case 'right': return `M${sx} ${sy} L${sx} ${C + W + 2} Q${sx} ${C + W / 2} ${C + W} ${C + W / 2} L${C + D - 8} ${C + W / 2}`;
      case 'left': return `M${sx} ${sy} L${sx} ${C + W / 2} Q${sx} ${C - W / 2} ${C} ${C - W / 2} L${C - D + 8} ${C - W / 2}`;
      case 'uturn': return `M${sx} ${sy} L${sx} ${C} C${sx} ${C - W * 0.9} ${C - W / 2} ${C - W * 0.9} ${C - W / 2} ${C} L${C - W / 2} ${C + D - 10}`;
      default: return '';
    }
  }

  function cross(sc, id) {
    const arms = sc.arms || (sc.road === 'T' ? ['W', 'E', 'S'] : ['N', 'E', 'S', 'W']);
    let s = `<rect width="${SIZE}" height="${SIZE}" fill="#86b46e"/>`;
    // тротуари (світла смуга навколо доріг)
    const road = (fill, pad) => {
      let r = `<rect x="${C - W - pad}" y="${C - W - pad}" width="${2 * (W + pad)}" height="${2 * (W + pad)}" fill="${fill}"/>`;
      for (const a of arms) {
        const [x1, y1] = rot(C - W - pad, C, ANG[a]);
        const [x2, y2] = rot(C + W + pad, SIZE, ANG[a]);
        r += `<rect x="${Math.min(x1, x2)}" y="${Math.min(y1, y2)}" width="${Math.abs(x2 - x1)}" height="${Math.abs(y2 - y1)}" fill="${fill}"/>`;
      }
      return r;
    };
    s += road('#cfd2d6', 8) + road('#55595f', 0);
    if (sc.tram) {
      for (const dx of [-7, 7]) s += `<line x1="${C + dx}" y1="0" x2="${C + dx}" y2="${SIZE}" stroke="#b0b5bb" stroke-width="2.2"/>`;
    }
    // розмітка на підходах
    for (const a of arms) {
      const g = [];
      const center = sc.center || 'dashed';
      if (!sc.tram) {
        if (center === 'solid') g.push(`<line x1="${C}" y1="${C + W + 4}" x2="${C}" y2="${SIZE}" stroke="#fff" stroke-width="2.4"/>`);
        else g.push(`<line x1="${C}" y1="${C + W + 4}" x2="${C}" y2="${SIZE}" stroke="#fff" stroke-width="2.4" stroke-dasharray="12 10"/>`);
      }
      if (sc.stopline) g.push(`<line x1="${C + 2}" y1="${C + W + 6}" x2="${C + W}" y2="${C + W + 6}" stroke="#fff" stroke-width="4"/>`);
      s += `<g transform="rotate(${ANG[a]} ${C} ${C})">${g.join('')}</g>`;
    }
    // пішохідні переходи
    for (const p of (sc.peds || [])) {
      let z = '';
      for (let i = 0; i < 8; i++) z += `<rect x="${C - W + 3 + i * 11}" y="${C + W + 14}" width="6" height="18" fill="#fff"/>`;
      s += `<g transform="rotate(${ANG[p.arm]} ${C} ${C})">${z}</g>`;
      const [px, py] = rot(C - W / 2 + (p.side === 'right' ? W : 0), C + W + 23, ANG[p.arm]);
      s += pedestrian(px, py);
    }
    // траєкторії
    for (const car of (sc.cars || [])) {
      const mp = movePath(car.move);
      if (!mp) continue;
      const c = car.color || 'red';
      const shift = car.type === 'tram' ? ` translate(${-W / 2} 0)` : '';
      s += `<g transform="rotate(${ANG[car.arm]} ${C} ${C})${shift}"><path d="${mp}" fill="none" stroke="#111" stroke-width="6" stroke-linecap="round" opacity=".35"/>` +
        `<path d="${mp}" fill="none" stroke="${col(c)}" stroke-width="3.4" stroke-linecap="round" marker-end="url(#ah-${id}-${COLORS[c] ? c : 'red'})"/></g>`;
    }
    // транспортні засоби
    for (const car of (sc.cars || [])) {
      const v = vehicle(car.type, car.color, car.label, car.me);
      const dist = C + W + 14 + v.len / 2 + (car.pos || 0) * 52;
      const lx = car.type === 'tram' ? C + 0 : C + W / 2;
      const [x, y] = rot(lx, dist, ANG[car.arm]);
      s += `<g transform="translate(${x} ${y}) rotate(${ANG[car.arm]})">${v.svg}</g>`;
      const [lxx, lyy] = rot(lx + (car.type === 'tram' ? 20 : 18), dist + v.len / 2 - 4, ANG[car.arm]);
      s += labelSvg(lxx, lyy, car.label, car.me);
    }
    // світлофори та знаки
    for (const l of (sc.lights || [])) {
      const [x, y] = rot(C + W + 22, C + W + 30, ANG[l.arm]);
      s += light(l.state, x, y, l.arrow);
    }
    for (const sg of (sc.signs || [])) {
      const hasLight = (sc.lights || []).some(l => l.arm === sg.arm);
      const [x, y] = rot(C + W + 24, C + W + (hasLight ? 72 : 28) + (sg.offset || 0) * 34, ANG[sg.arm]);
      s += signImg(sg.code, x, y, sg.size);
    }
    return s;
  }

  function straight(sc, id) {
    const n = sc.lanes || 1, LH = 34, H = n * LH, top = C - H, bot = C + H;
    let s = `<rect width="${SIZE}" height="${SIZE}" fill="#86b46e"/>`;
    s += `<rect x="0" y="${top - 10}" width="${SIZE}" height="${2 * H + 20}" fill="#cfd2d6"/>`;
    s += `<rect x="0" y="${top}" width="${SIZE}" height="${2 * H}" fill="#55595f"/>`;
    s += `<line x1="0" y1="${top + 2}" x2="${SIZE}" y2="${top + 2}" stroke="#fff" stroke-width="2"/><line x1="0" y1="${bot - 2}" x2="${SIZE}" y2="${bot - 2}" stroke="#fff" stroke-width="2"/>`;
    const center = sc.center || 'dashed';
    if (center === 'solid') s += `<line x1="0" y1="${C}" x2="${SIZE}" y2="${C}" stroke="#fff" stroke-width="2.6"/>`;
    else if (center === 'double') s += `<line x1="0" y1="${C - 3}" x2="${SIZE}" y2="${C - 3}" stroke="#fff" stroke-width="2.2"/><line x1="0" y1="${C + 3}" x2="${SIZE}" y2="${C + 3}" stroke="#fff" stroke-width="2.2"/>`;
    else if (center === '1.11') s += `<line x1="0" y1="${C - 3}" x2="${SIZE}" y2="${C - 3}" stroke="#fff" stroke-width="2.2"/><line x1="0" y1="${C + 3}" x2="${SIZE}" y2="${C + 3}" stroke="#fff" stroke-width="2.2" stroke-dasharray="12 10"/>`;
    else if (center === '1.11r') s += `<line x1="0" y1="${C - 3}" x2="${SIZE}" y2="${C - 3}" stroke="#fff" stroke-width="2.2" stroke-dasharray="12 10"/><line x1="0" y1="${C + 3}" x2="${SIZE}" y2="${C + 3}" stroke="#fff" stroke-width="2.2"/>`;
    else if (center === 'dashed') s += `<line x1="0" y1="${C}" x2="${SIZE}" y2="${C}" stroke="#fff" stroke-width="2.6" stroke-dasharray="14 10"/>`;
    for (let i = 1; i < n; i++) {
      s += `<line x1="0" y1="${C - i * LH}" x2="${SIZE}" y2="${C - i * LH}" stroke="#fff" stroke-width="2" stroke-dasharray="12 12"/>`;
      s += `<line x1="0" y1="${C + i * LH}" x2="${SIZE}" y2="${C + i * LH}" stroke="#fff" stroke-width="2" stroke-dasharray="12 12"/>`;
    }
    if (sc.zebra != null) for (let i = 0; i < n * 6; i++) s += `<rect x="${sc.zebra - 12}" y="${top + 3 + i * (2 * H / (n * 6))}" width="24" height="${2 * H / (n * 6) - 5}" fill="#fff"/>`;
    if (sc.rail != null) s += `<rect x="${sc.rail - 16}" y="${top - 10}" width="32" height="${2 * H + 20}" fill="#6d5d4b"/>` +
      `<line x1="${sc.rail - 6}" y1="${top - 10}" x2="${sc.rail - 6}" y2="${bot + 10}" stroke="#ccc" stroke-width="3"/><line x1="${sc.rail + 6}" y1="${top - 10}" x2="${sc.rail + 6}" y2="${bot + 10}" stroke="#ccc" stroke-width="3"/>`;
    const laneY = (dir, lane) => dir === 'W' ? top + LH / 2 + (lane || 0) * LH : bot - LH / 2 - (lane || 0) * LH;
    for (const car of (sc.cars || [])) {
      const y = laneY(car.dir || 'E', car.lane), x = car.x, sgn = (car.dir || 'E') === 'W' ? -1 : 1;
      const c = car.color || 'red';
      let p = '';
      if (car.move === 'overtake') p = `M${x + 22 * sgn} ${y} C${x + 50 * sgn} ${y} ${x + 50 * sgn} ${C - sgn * 0 - (sgn > 0 ? LH / 2 : -LH / 2)} ${x + 80 * sgn} ${C - (sgn > 0 ? LH / 2 : -LH / 2)} L${x + 150 * sgn} ${C - (sgn > 0 ? LH / 2 : -LH / 2)}`;
      else if (car.move === 'left') p = `M${x + 22 * sgn} ${y} C${x + 50 * sgn} ${y} ${x + 50 * sgn} ${y - LH * sgn} ${x + 90 * sgn} ${y - LH * sgn}`;
      else if (car.move === 'right') p = `M${x + 22 * sgn} ${y} C${x + 50 * sgn} ${y} ${x + 50 * sgn} ${y + LH * sgn} ${x + 90 * sgn} ${y + LH * sgn}`;
      else if (car.move === 'straight') p = `M${x + 22 * sgn} ${y} L${x + 90 * sgn} ${y}`;
      else if (car.move === 'uturn') p = `M${x + 22 * sgn} ${y} C${x + 70 * sgn} ${y} ${x + 70 * sgn} ${y - 2 * LH * sgn} ${x + 10 * sgn} ${y - 2 * LH * sgn}`;
      else if (car.move === 'park') p = `M${x + 22 * sgn} ${y} C${x + 45 * sgn} ${y} ${x + 45 * sgn} ${y + (LH / 2 + 8) * sgn} ${x + 70 * sgn} ${y + (LH / 2 + 8) * sgn}`;
      if (p) s += `<path d="${p}" fill="none" stroke="#111" stroke-width="6" opacity=".35" stroke-linecap="round"/><path d="${p}" fill="none" stroke="${col(c)}" stroke-width="3.4" stroke-linecap="round" marker-end="url(#ah-${id}-${COLORS[c] ? c : 'red'})"/>`;
      const v = vehicle(car.type, car.color, car.label, car.me);
      s += `<g transform="translate(${x} ${y}) rotate(${sgn > 0 ? 90 : -90})">${v.svg}</g>`;
      s += labelSvg(x - 10 * sgn, y - 17, car.label, car.me);
    }
    for (const sg of (sc.signs || [])) s += signImg(sg.code, sg.x, sg.side === 'top' ? top - 26 : bot + 26, sg.size);
    for (const p of (sc.peds || [])) s += pedestrian(p.x, p.y != null ? p.y : bot + 22);
    return s;
  }

  window.Scene = {
    render(sc) {
      const id = 'sc' + (++uid);
      const inner = sc.road === 'straight' ? straight(sc, id) : cross(sc, id);
      return `<svg viewBox="0 0 ${SIZE} ${SIZE}" xmlns="http://www.w3.org/2000/svg" role="img">${defs(id)}${inner}</svg>`;
    }
  };
})();
