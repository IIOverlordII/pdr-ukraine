(function () {
  'use strict';

  // ───────────────────────── утиліти ─────────────────────────
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const pick = (a, n) => shuffle(a).slice(0, n);
  const fmtTime = s => `${Math.floor(s / 60)}:${String(Math.max(0, s % 60)).padStart(2, '0')}`;
  const ICON = {
    home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>',
    book: '<path d="M4 4h10a4 4 0 0 1 4 4v12H8a4 4 0 0 1-4-4z"/><path d="M4 16a4 4 0 0 1 4-4h10"/>',
    sign: '<path d="M12 3l9 16H3z"/><path d="M12 10v4M12 17v.5"/>',
    road: '<path d="M8 3L4 21M16 3l4 18M12 4v3M12 11v3M12 18v2"/>',
    test: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>',
    exam: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l3 2M9 2h6"/>',
    bad: '<circle cx="12" cy="12" r="9"/><path d="M9 9l6 6M15 9l-6 6"/>',
    star: '<path d="M12 3l2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    chev: '<path d="M9 6l6 6-6 6"/>',
    shuffle: '<path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>',
    heart: '<path d="M12 21C5 15 3 12 3 8.5A4.5 4.5 0 0 1 12 6a4.5 4.5 0 0 1 9 2.5C21 12 19 15 12 21z"/>',
    aid: '<rect x="3" y="6" width="18" height="14" rx="2"/><path d="M9 6V4h6v2M12 10v6M9 13h6"/>',
    shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>'
  };
  const icon = (n, cls = '') => `<svg class="${cls}" viewBox="0 0 24 24">${ICON[n] || ''}</svg>`;

  // ───────────────────────── сховище ─────────────────────────
  const Store = {
    key: 'pdr-ua-v1',
    d: {},
    load() {
      let saved = {};
      try { saved = JSON.parse(localStorage.getItem(this.key) || '{}') || {}; } catch (e) { saved = {}; }
      this.d = Object.assign({ lang: 'uk', theme: 'auto', fs: 16, answers: {}, read: {}, favQ: {}, favP: {}, exams: [], best: {}, lastSection: 0, strictExam: true }, saved);
    },
    save() { try { localStorage.setItem(this.key, JSON.stringify(this.d)); } catch (e) { /* приватний режим */ } }
  };
  Store.load();

  // ───────────────────────── мова ─────────────────────────
  const T = {
    uk: {
      app: 'ПДР України', home: 'Головна', rules: 'Правила', signs: 'Знаки', marking: 'Розмітка', tests: 'Тести', exam: 'Іспит',
      settings: 'Налаштування', mistakes: 'Помилки', favorites: 'Обране', stats: 'Статистика', section: 'Розділ',
      heroTitle: 'Підготовка до іспиту на посвідчення водія категорії B',
      heroSub: 'Правила дорожнього руху, знаки, розмітка, тести з поясненнями та іспит як у сервісному центрі МВС.',
      readSections: 'розділів прочитано', solved: 'питань вирішено', passedExams: 'іспитів складено',
      startExam: 'Почати іспит', examSub: '20 питань · 20 хвилин · до 2 помилок',
      byTopic: 'Тести за темами', byTopicSub: 'Тренування з поясненнями', mistakesSub: 'Повторити питання з помилками',
      rulesSub: '34 розділи з поясненнями', signsSub: 'Усі групи знаків', markingSub: 'Горизонтальна та вертикальна',
      favSub: 'Збережені пункти та питання', statsSub: 'Прогрес та історія іспитів', continueReading: 'Продовжити читання',
      searchRules: 'Пошук у правилах…', searchSigns: 'Пошук знака: назва або номер…', found: 'Знайдено', nothing: 'Нічого не знайдено',
      explain: 'Пояснення простими словами', markRead: 'Позначити прочитаним', isRead: 'Прочитано ✓', testSection: 'Тест за розділом',
      prev: 'Попередній', next: 'Наступний', all: 'Усі', group: 'Група', mentioned: 'Згадується в пунктах Правил', details: 'Детальніше',
      trainGroup: 'Тренувати цю групу', horizontal: 'Горизонтальна розмітка', vertical: 'Вертикальна розмітка', point: 'Пункт',
      quick: 'Швидкі режими', random20: '20 випадкових питань', random20Sub: 'З усіх тем', topicsRules: 'Розділи Правил',
      topicsSigns: 'Дорожні знаки', topicsOther: 'Розмітка та інше', q: 'питань', best: 'найкраще', start: 'Почати',
      nextQ: 'Далі', finish: 'Завершити', correct: 'Правильно!', wrong: 'Неправильно', correctIs: 'Правильна відповідь',
      explanation: 'Пояснення', seeRule: 'Пункти Правил', result: 'Результат', restart: 'Ще раз', retryWrong: 'Повторити помилки',
      backToTests: 'До тестів', passed: 'Іспит складено', failed: 'Іспит не складено', errorsShort: 'помилок', of: 'з',
      examRules: 'Як у сервісному центрі МВС: 20 питань, 20 хвилин. Іспит складено, якщо допущено не більше 2 помилок.',
      examStrict: 'Завершувати іспит після 3-ї помилки', examHistory: 'Історія іспитів', noExams: 'Ви ще не складали пробний іспит.',
      timeUp: 'Час вичерпано', question: 'Питання', review: 'Розбір відповідей', yourAnswer: 'Ваша відповідь', noAnswer: 'Без відповіді',
      emptyMistakes: 'Помилок немає. Розв’яжіть кілька тестів — питання з помилками з’являться тут.',
      emptyFav: 'Тут з’являться пункти Правил і питання, позначені зірочкою.',
      favPoints: 'Пункти Правил', favQuestions: 'Питання', language: 'Мова', theme: 'Тема', themeAuto: 'Авто', themeLight: 'Світла', themeDark: 'Темна',
      fontSize: 'Розмір тексту', resetProgress: 'Скинути прогрес', resetConfirm: 'Видалити весь прогрес, обране та історію іспитів?',
      install: 'Встановлення', installWin: 'Windows: запустіть «ПДР України.exe» або відкрийте застосунок у Edge/Chrome → меню → «Застосунки» → «Установити цей сайт як застосунок».',
      installIos: 'iPhone/iPad: відкрийте посилання в Safari → кнопка «Поділитися» → «На початковий екран». Застосунок працюватиме без інтернету.',
      installBtn: 'Встановити застосунок', about: 'Про застосунок',
      aboutText: 'Текст Правил дорожнього руху (постанова КМУ № 1306 від 10.10.2001) у редакції, чинній на дату збирання. Зображення знаків — Wikimedia Commons (суспільне надбання). Пояснення та тестові питання підготовлені для навчання і не є офіційними питаннями ГСЦ МВС. Звіряйтеся з офіційним текстом на zakon.rada.gov.ua.',
      edition: 'Редакція тексту', progressTopic: 'Прогрес', signName: 'Що означає цей знак?', signPick: 'Який знак має назву', markQ: 'Що означає ця розмітка?',
      safe: 'Основи безпечного керування', med: 'Домедична допомога', mk: 'Дорожня розмітка', exit: 'Вийти', exitConfirm: 'Перервати іспит? Результат не буде збережено.',
      continueExam: 'Продовжити іспит', keyboardHint: 'Підказка: клавіші 1–5 — вибір відповіді, Enter — далі.',
      translationNote: 'Офіційний текст Правил — українською мовою.', sectionsRead: 'Прочитано', open: 'Відкрити', points: 'пунктів',
      percent: 'правильних', total: 'Усього', wrongCount: 'Помилки', okCount: 'Правильно', unanswered: 'Не відповіли'
    },
    ru: {
      app: 'ПДД Украины', home: 'Главная', rules: 'Правила', signs: 'Знаки', marking: 'Разметка', tests: 'Тесты', exam: 'Экзамен',
      settings: 'Настройки', mistakes: 'Ошибки', favorites: 'Избранное', stats: 'Статистика', section: 'Раздел',
      heroTitle: 'Подготовка к экзамену на водительское удостоверение категории B',
      heroSub: 'Правила дорожного движения, знаки, разметка, тесты с объяснениями и экзамен как в сервисном центре МВД.',
      readSections: 'разделов прочитано', solved: 'вопросов решено', passedExams: 'экзаменов сдано',
      startExam: 'Начать экзамен', examSub: '20 вопросов · 20 минут · до 2 ошибок',
      byTopic: 'Тесты по темам', byTopicSub: 'Тренировка с объяснениями', mistakesSub: 'Повторить вопросы с ошибками',
      rulesSub: '34 раздела с объяснениями', signsSub: 'Все группы знаков', markingSub: 'Горизонтальная и вертикальная',
      favSub: 'Сохранённые пункты и вопросы', statsSub: 'Прогресс и история экзаменов', continueReading: 'Продолжить чтение',
      searchRules: 'Поиск в правилах…', searchSigns: 'Поиск знака: название или номер…', found: 'Найдено', nothing: 'Ничего не найдено',
      explain: 'Объяснение простыми словами', markRead: 'Отметить прочитанным', isRead: 'Прочитано ✓', testSection: 'Тест по разделу',
      prev: 'Предыдущий', next: 'Следующий', all: 'Все', group: 'Группа', mentioned: 'Упоминается в пунктах Правил', details: 'Подробнее',
      trainGroup: 'Тренировать эту группу', horizontal: 'Горизонтальная разметка', vertical: 'Вертикальная разметка', point: 'Пункт',
      quick: 'Быстрые режимы', random20: '20 случайных вопросов', random20Sub: 'Из всех тем', topicsRules: 'Разделы Правил',
      topicsSigns: 'Дорожные знаки', topicsOther: 'Разметка и другое', q: 'вопросов', best: 'лучший', start: 'Начать',
      nextQ: 'Далее', finish: 'Завершить', correct: 'Правильно!', wrong: 'Неправильно', correctIs: 'Правильный ответ',
      explanation: 'Объяснение', seeRule: 'Пункты Правил', result: 'Результат', restart: 'Ещё раз', retryWrong: 'Повторить ошибки',
      backToTests: 'К тестам', passed: 'Экзамен сдан', failed: 'Экзамен не сдан', errorsShort: 'ошибок', of: 'из',
      examRules: 'Как в сервисном центре МВД: 20 вопросов, 20 минут. Экзамен сдан, если допущено не более 2 ошибок.',
      examStrict: 'Завершать экзамен после 3-й ошибки', examHistory: 'История экзаменов', noExams: 'Вы ещё не сдавали пробный экзамен.',
      timeUp: 'Время вышло', question: 'Вопрос', review: 'Разбор ответов', yourAnswer: 'Ваш ответ', noAnswer: 'Без ответа',
      emptyMistakes: 'Ошибок нет. Решите несколько тестов — вопросы с ошибками появятся здесь.',
      emptyFav: 'Здесь появятся пункты Правил и вопросы, отмеченные звёздочкой.',
      favPoints: 'Пункты Правил', favQuestions: 'Вопросы', language: 'Язык', theme: 'Тема', themeAuto: 'Авто', themeLight: 'Светлая', themeDark: 'Тёмная',
      fontSize: 'Размер текста', resetProgress: 'Сбросить прогресс', resetConfirm: 'Удалить весь прогресс, избранное и историю экзаменов?',
      install: 'Установка', installWin: 'Windows: запустите «ПДР України.exe» или откройте приложение в Edge/Chrome → меню → «Приложения» → «Установить этот сайт как приложение».',
      installIos: 'iPhone/iPad: откройте ссылку в Safari → кнопка «Поделиться» → «На экран „Домой“». Приложение будет работать без интернета.',
      installBtn: 'Установить приложение', about: 'О приложении',
      aboutText: 'Текст Правил дорожного движения (постановление КМУ № 1306 от 10.10.2001) в редакции, действующей на дату сборки; русский текст — перевод для удобства. Изображения знаков — Wikimedia Commons (общественное достояние). Объяснения и тестовые вопросы подготовлены для обучения и не являются официальными вопросами ГСЦ МВД. Сверяйтесь с официальным текстом на zakon.rada.gov.ua.',
      edition: 'Редакция текста', progressTopic: 'Прогресс', signName: 'Что означает этот знак?', signPick: 'Какой знак называется', markQ: 'Что означает эта разметка?',
      safe: 'Основы безопасного вождения', med: 'Домедицинская помощь', mk: 'Дорожная разметка', exit: 'Выйти', exitConfirm: 'Прервать экзамен? Результат не сохранится.',
      continueExam: 'Продолжить экзамен', keyboardHint: 'Подсказка: клавиши 1–5 — выбор ответа, Enter — далее.',
      translationNote: 'Официальный текст Правил — на украинском языке; русский текст — перевод.', sectionsRead: 'Прочитано', open: 'Открыть', points: 'пунктов',
      percent: 'правильных', total: 'Всего', wrongCount: 'Ошибки', okCount: 'Правильно', unanswered: 'Без ответа'
    }
  };
  T.uk.errorsForms = 'помилка|помилки|помилок';
  T.ru.errorsForms = 'ошибка|ошибки|ошибок';
  Object.assign(T.uk, { whyWrong: 'Чому ця відповідь неправильна', thatIsSign: 'Це назва знака', pictureShows: 'На малюнку —', youChoseSign: 'Ви обрали знак', thatIsMark: 'Так позначається розмітка' });
  Object.assign(T.ru, { whyWrong: 'Почему этот ответ неправильный', thatIsSign: 'Это название знака', pictureShows: 'На рисунке —', youChoseSign: 'Вы выбрали знак', thatIsMark: 'Так обозначается разметка' });
  // 1 помилка, 2–4 помилки, 5+ помилок (однаково для uk і ru)
  const plural = (n, forms) => {
    const [one, few, many] = forms.split('|'), m10 = n % 10, m100 = n % 100;
    return m10 === 1 && m100 !== 11 ? one : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? few : many;
  };
  const lang = () => Store.d.lang === 'ru' ? 'ru' : 'uk';
  const t = k => (T[lang()][k] != null ? T[lang()][k] : T.uk[k] != null ? T.uk[k] : k);
  const L = o => o == null ? '' : typeof o === 'string' ? o : (o[lang()] || o.uk || '');

  // ───────────────────────── дані ─────────────────────────
  const PDR = window.PDR || { sections: [], meta: {} };
  const SIGNS = window.SIGNS || { groups: [], list: [] };
  const MARKING = window.MARKING || { list: [] };
  const EXPLAIN = window.EXPLAIN || {};
  const QDATA = window.QUESTIONS || { list: [] };

  const SEC = {}, POINT = {}, SIGN = {}, MARK = {}, Q = {};
  PDR.sections.forEach(s => { SEC[s.n] = s; s.points.forEach(p => { POINT[p.n] = { sec: s, p }; }); });
  SIGNS.list.forEach(s => { SIGN[s.c] = s; });
  MARKING.list.forEach(m => { MARK[m.c] = m; });

  // згенеровані питання за знаками та розміткою
  const GEN = [];
  SIGNS.list.forEach(s => {
    if (!s.img || !L(s.name)) return;
    GEN.push({ id: 'sn:' + s.c, t: 'g' + s.g, kind: 'signName', sign: s.c });
    if (s.g <= 5) GEN.push({ id: 'sp:' + s.c, t: 'g' + s.g, kind: 'signPick', sign: s.c });
  });
  MARKING.list.forEach(m => { if (window.MarkingDraw && MarkingDraw.has(m.c)) GEN.push({ id: 'mq:' + m.c, t: 'mk', kind: 'mark', mark: m.c }); });
  const ALLQ = (QDATA.list || []).concat(GEN);
  ALLQ.forEach(q => { Q[q.id] = q; });

  const TOPICS = [];
  PDR.sections.forEach(s => TOPICS.push({ id: 's' + s.n, kind: 'rules', n: s.n, name: s.title }));
  SIGNS.groups.forEach(g => TOPICS.push({ id: 'g' + g.n, kind: 'signs', n: g.n, name: g.name }));
  TOPICS.push({ id: 'mk', kind: 'other', name: { uk: T.uk.mk, ru: T.ru.mk } });
  TOPICS.push({ id: 'safe', kind: 'other', name: { uk: T.uk.safe, ru: T.ru.safe } });
  TOPICS.push({ id: 'med', kind: 'other', name: { uk: T.uk.med, ru: T.ru.med } });
  const TOPIC = {}; TOPICS.forEach(x => { TOPIC[x.id] = x; });
  const qOfTopic = id => ALLQ.filter(q => q.t === id);

  // ───────────────────────── форматування тексту Правил ─────────────────────────
  function signRef(c) {
    const s = SIGN[c];
    if (!s) return `<b>${c}</b>`; // розпізнавальні знаки (розділ 30) не входять до каталогу
    if (s.img) return `<a class="sref" data-sign="${c}" title="${esc(L(s.name))}"><img src="${s.img}" alt="" loading="lazy">${c}</a>`;
    return `<a class="sref" data-sign="${c}">${c}</a>`;
  }
  function rt(s, hl) {
    let h = esc(s);
    h = h.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\*\*/g, '');
    h = h.replace(/\{s:([\d.]+)\}/g, (m, c) => signRef(c));
    h = h.replace(/\{m:([\d.]+)\}/g, (m, c) => `<a class="mref" data-mark="${c}">${c}</a>`);
    h = h.replace(/\{p:([\d.]+)\}/g, (m, c) => `<a class="pref" data-point="${c}">${c}</a>`);
    h = h.replace(/\n/g, '<br>');
    if (hl) {
      const re = new RegExp(hl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      h = h.replace(/(^|>)([^<]+)(?=<|$)/g, (m, a, tx) => a + tx.replace(re, '<mark>$&</mark>'));
    }
    return h;
  }
  const plain = s => String(s || '').replace(/\*\*/g, '').replace(/\{[smp]:([\d.]+)\}/g, '$1');
  function tableHtml(text, hl) {
    const rows = String(text).split('\n').map(r => r.split(' | '));
    return `<div class="tbl"><table>${rows.map((r, i) => `<tr>${r.map(c => i === 0 ? `<th>${rt(c, hl)}</th>` : `<td>${rt(c, hl)}</td>`).join('')}</tr>`).join('')}</table></div>`;
  }
  function blocksHtml(blocks, hl) {
    return blocks.map(b => b.t === 'li'
      ? `<div class="li"><span>${esc(b.label || '•')}</span><span>${rt(L(b), hl)}</span></div>`
      : b.t === 'table' ? tableHtml(L(b), hl) : `<p>${rt(L(b), hl)}</p>`).join('');
  }

  // ───────────────────────── оболонка ─────────────────────────
  const NAV = [
    ['#/', 'home', 'home'], ['#/rules', 'rules', 'book'], ['#/signs', 'signs', 'sign'], ['#/marking', 'marking', 'road'],
    ['#/tests', 'tests', 'test'], ['#/exam', 'exam', 'exam'], ['#/mistakes', 'mistakes', 'bad'], ['#/favorites', 'favorites', 'star'],
    ['#/stats', 'stats', 'chart'], ['#/settings', 'settings', 'gear']
  ];
  const TABS = ['#/', '#/rules', '#/signs', '#/tests', '#/exam'];
  function renderNav(route) {
    const root = route.split('/')[0];
    const isActive = href => {
      const h = href.slice(2);
      if (h === '') return root === '' ? ' active' : '';
      const map = { sign: 'signs', test: 'tests' };
      return (h === root || map[root] === h) ? ' active' : '';
    };
    $('#sidebar').innerHTML = `<div class="side-brand"><img src="icons/icon.svg" alt="">${esc(t('app'))}</div>` +
      NAV.map(([h, k, ic]) => `<a class="side-link${isActive(h)}" href="${h}">${icon(ic)}${esc(t(k))}</a>`).join('') +
      `<div class="side-foot">${esc(t('edition'))}: ${esc(PDR.meta.edition || '—')}</div>`;
    $('#tabbar').innerHTML = NAV.filter(n => TABS.includes(n[0])).map(([h, k, ic]) => `<a class="tab${isActive(h)}" href="${h}">${icon(ic)}<span>${esc(t(k))}</span></a>`).join('');
    $('#langBtn').textContent = lang() === 'ru' ? 'RU' : 'UA';
    document.documentElement.lang = lang();
  }
  function setTitle(s, back) {
    $('#title').textContent = s;
    document.title = s === t('app') ? s : `${s} — ${t('app')}`;
    const b = $('#backBtn');
    b.hidden = !back;
    b.onclick = () => { if (typeof back === 'string') location.hash = back; else history.back(); };
  }
  function setExtra(html) { $('#topExtra').innerHTML = html || ''; }
  function applyPrefs() {
    document.documentElement.dataset.theme = Store.d.theme;
    document.documentElement.style.setProperty('--fs', (Store.d.fs || 16) + 'px');
  }

  // ───────────────────────── модальне вікно ─────────────────────────
  function openModal(html) { $('#modalBody').innerHTML = html; $('#modal').hidden = false; $('#modalBody').scrollTop = 0; }
  function closeModal() { $('#modal').hidden = true; $('#modalBody').innerHTML = ''; }
  function signCard(c, full) {
    const s = SIGN[c];
    if (!s) return `<h2>${esc(c)}</h2>`;
    const g = SIGNS.groups.find(x => x.n === s.g);
    return `<div class="sign-hero">${s.img ? `<img src="${s.img}" alt="">` : ''}<div>
      <div class="muted small">${esc(g ? L(g.name) : '')}</div><h2>${esc(c)} «${esc(L(s.name))}»</h2>
      <div class="rt">${blocksHtml(s.desc || [])}</div>
      ${s.refs && s.refs.length ? `<h3>${esc(t('mentioned'))}</h3><div class="refs">${s.refs.map(r => `<a class="chip" data-point="${r}">${r}</a>`).join('')}</div>` : ''}
      ${full ? '' : `<p style="margin-top:14px"><a class="btn secondary" href="#/sign/${c}" data-close>${esc(t('details'))}</a></p>`}
    </div></div>`;
  }
  function markCard(c) {
    const m = MARK[c];
    return `<div class="sign-hero"><div class="mk-big">${MarkingDraw.svg(c)}</div><div>
      <div class="muted small">${esc(t(c.startsWith('2.') ? 'vertical' : 'horizontal'))}</div><h2>${esc(c)}${m ? ' — ' + esc(L(m.name)) : ''}</h2>
      <div class="rt">${m ? blocksHtml(m.desc || []) : ''}</div>
      ${m && m.refs && m.refs.length ? `<h3>${esc(t('mentioned'))}</h3><div class="refs">${m.refs.map(r => `<a class="chip" data-point="${r}">${r}</a>`).join('')}</div>` : ''}
    </div></div>`;
  }
  function pointCard(n) {
    const x = POINT[n];
    if (!x) return `<p>${esc(n)}</p>`;
    return `<div class="muted small">${esc(t('section'))} ${x.sec.n}. ${esc(L(x.sec.title))}</div><h2>${esc(t('point'))} ${esc(n)}</h2>
      <div class="rt">${blocksHtml(x.p.blocks)}</div>
      <p style="margin-top:14px"><a class="btn secondary" href="#/rules/${x.sec.n}/${n}" data-close>${esc(t('open'))}</a></p>`;
  }

  document.addEventListener('click', e => {
    const el = e.target.closest('[data-sign],[data-mark],[data-point],[data-close]');
    if (!el) return;
    if (el.hasAttribute('data-close') && !el.hasAttribute('href')) { e.preventDefault(); closeModal(); return; }
    if (el.hasAttribute('data-close')) { closeModal(); return; }
    e.preventDefault();
    if (el.dataset.sign) openModal(signCard(el.dataset.sign));
    else if (el.dataset.mark) openModal(markCard(el.dataset.mark));
    else if (el.dataset.point) openModal(pointCard(el.dataset.point));
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !$('#modal').hidden) { closeModal(); return; }
    if (!$('#modal').hidden || /INPUT|TEXTAREA/.test(document.activeElement && document.activeElement.tagName)) return;
    if (quizKey) quizKey(e);
  });

  // ───────────────────────── прогрес ─────────────────────────
  function record(qid, ok) {
    const a = Store.d.answers[qid] || { ok: 0, bad: 0 };
    if (ok) a.ok++; else a.bad++;
    a.last = ok ? 1 : 0; a.ts = Date.now();
    Store.d.answers[qid] = a; Store.save();
  }
  const mistakesList = () => Object.keys(Store.d.answers).filter(id => Store.d.answers[id].last === 0 && Q[id]);
  const favList = () => Object.keys(Store.d.favQ).filter(id => Q[id]);
  const solvedCount = () => Object.keys(Store.d.answers).filter(id => Store.d.answers[id].last === 1 && Q[id]).length;

  // ───────────────────────── екрани ─────────────────────────
  const view = () => $('#view');

  function vHome() {
    setTitle(t('app'));
    const readN = Object.keys(Store.d.read).length;
    const passed = Store.d.exams.filter(x => x.passed).length;
    const last = Store.d.lastSection && SEC[Store.d.lastSection];
    const mis = mistakesList().length;
    const tile = (href, ic, title, sub, extra = '') => `<a class="tile" href="${href}"><div class="tile-ico">${ic}</div><div><div class="tile-title">${esc(title)}${extra}</div><div class="tile-sub">${esc(sub)}</div></div></a>`;
    view().innerHTML = `
      <div class="hero"><h2>${esc(t('heroTitle'))}</h2><p>${esc(t('heroSub'))}</p>
        <div class="stats-row"><div class="stat"><b>${readN}/${PDR.sections.length}</b><span>${esc(t('readSections'))}</span></div>
        <div class="stat"><b>${solvedCount()}/${ALLQ.length}</b><span>${esc(t('solved'))}</span></div>
        <div class="stat"><b>${passed}</b><span>${esc(t('passedExams'))}</span></div></div></div>
      ${last ? `<a class="tile" href="#/rules/${last.n}" style="margin-bottom:12px"><div class="tile-ico">${icon('book')}</div><div><div class="tile-sub">${esc(t('continueReading'))}</div><div class="tile-title">${last.n}. ${esc(L(last.title))}</div></div></a>` : ''}
      <div class="grid">
        ${tile('#/exam', icon('exam'), t('startExam'), t('examSub'))}
        ${tile('#/tests', icon('test'), t('byTopic'), t('byTopicSub'))}
        ${tile('#/mistakes', icon('bad'), t('mistakes'), t('mistakesSub'), mis ? ` (${mis})` : '')}
        ${tile('#/rules', icon('book'), t('rules'), t('rulesSub'))}
        ${tile('#/signs', SIGN['2.1'] && SIGN['2.1'].img ? `<img src="${SIGN['2.1'].img}" alt="">` : icon('sign'), t('signs'), t('signsSub'))}
        ${tile('#/marking', icon('road'), t('marking'), t('markingSub'))}
        ${tile('#/favorites', icon('star'), t('favorites'), t('favSub'))}
        ${tile('#/stats', icon('chart'), t('stats'), t('statsSub'))}
      </div>`;
  }

  function searchRules(qs) {
    const needle = qs.toLowerCase();
    const res = [];
    for (const s of PDR.sections) for (const p of s.points) {
      const hit = p.blocks.find(b => plain(L(b)).toLowerCase().includes(needle) || plain(b.uk).toLowerCase().includes(needle));
      if (hit) res.push({ s, p, b: hit });
      if (res.length >= 80) return res;
    }
    return res;
  }

  function vRules() {
    setTitle(t('rules'));
    const q0 = sessionStorage.getItem('rulesQuery') || '';
    view().innerHTML = `<input class="search" id="rq" type="search" placeholder="${esc(t('searchRules'))}" value="${esc(q0)}"><div id="rlist"></div>`;
    const draw = () => {
      const qs = $('#rq').value.trim();
      try { sessionStorage.setItem('rulesQuery', qs); } catch (e) { /* */ }
      if (qs.length >= 3) {
        const r = searchRules(qs);
        $('#rlist').innerHTML = `<p class="muted small">${esc(t('found'))}: ${r.length}${r.length >= 80 ? '+' : ''}</p>` + (r.length ? r.map(x => `
          <a class="point" style="display:block;text-decoration:none;color:inherit" href="#/rules/${x.s.n}/${x.p.n}">
            <div class="point-head"><span class="point-num">${x.p.n}</span><span class="muted small">${esc(L(x.s.title))}</span></div>
            <div class="rt">${rt(L(x.b), qs)}</div></a>`).join('') : `<div class="empty">${esc(t('nothing'))}</div>`);
        return;
      }
      $('#rlist').innerHTML = `<div class="list">${PDR.sections.map(s => `
        <a class="list-item" href="#/rules/${s.n}"><span class="num-badge${Store.d.read[s.n] ? ' done' : ''}">${s.n}</span>
        <span style="flex:1">${esc(L(s.title))}<br><span class="muted small">${s.points.length} ${esc(t('points'))}${qOfTopic('s' + s.n).length ? ` · ${qOfTopic('s' + s.n).length} ${esc(t('q'))}` : ''}</span></span>${icon('chev', 'chev')}</a>`).join('')}</div>`;
    };
    $('#rq').addEventListener('input', draw);
    draw();
  }

  function vSection(n, pointN) {
    const s = SEC[n];
    if (!s) { location.hash = '#/rules'; return; }
    Store.d.lastSection = s.n; Store.save();
    setTitle(`${t('section')} ${s.n}`, '#/rules');
    const ex = EXPLAIN[s.n];
    const exItems = ex ? (ex[lang()] || ex.uk || []) : [];
    const nq = qOfTopic('s' + s.n).length;
    const prev = SEC[s.n - 1], next = SEC[s.n + 1];
    view().innerHTML = `
      <div class="section-head"><div class="kicker">${esc(t('section'))} ${s.n}</div><h2>${esc(L(s.title))}</h2>
      ${lang() === 'ru' ? `<p class="muted small" style="margin-top:6px">${esc(t('translationNote'))}</p>` : ''}</div>
      ${exItems.length ? `<details class="card explain" open><summary>💡 ${esc(t('explain'))}</summary><ul>${exItems.map(x => `<li>${rt(x)}</li>`).join('')}</ul></details>` : ''}
      ${s.points.map(p => `<div class="point" id="p-${p.n}"><div class="point-head"><span class="point-num">${p.n}</span>
        <button class="icon-btn" data-fav="${p.n}" aria-label="★">${icon('star', 'star' + (Store.d.favP[p.n] ? ' on' : ''))}</button></div>
        <div class="rt">${blocksHtml(p.blocks)}</div></div>`).join('')}
      <div class="row" style="margin-top:14px">
        <button class="btn secondary" id="readBtn">${esc(Store.d.read[s.n] ? t('isRead') : t('markRead'))}</button>
        ${nq ? `<a class="btn" href="#/test/s${s.n}">${esc(t('testSection'))} (${nq})</a>` : ''}
      </div>
      <div class="pager">${prev ? `<a class="btn secondary" href="#/rules/${prev.n}">← ${prev.n}. ${esc(t('prev'))}</a>` : '<span></span>'}
        ${next ? `<a class="btn secondary" href="#/rules/${next.n}">${esc(t('next'))} ${next.n} →</a>` : ''}</div>`;
    $('#readBtn').onclick = () => {
      if (Store.d.read[s.n]) delete Store.d.read[s.n]; else Store.d.read[s.n] = Date.now();
      Store.save(); $('#readBtn').textContent = Store.d.read[s.n] ? t('isRead') : t('markRead');
    };
    $$('[data-fav]').forEach(b => b.onclick = () => {
      const k = b.dataset.fav;
      if (Store.d.favP[k]) delete Store.d.favP[k]; else Store.d.favP[k] = Date.now();
      Store.save(); b.querySelector('svg').classList.toggle('on', !!Store.d.favP[k]);
    });
    if (pointN) {
      const el = document.getElementById('p-' + pointN);
      if (el) setTimeout(() => { el.scrollIntoView({ block: 'start' }); el.classList.add('flash'); }, 30);
    } else window.scrollTo(0, 0);
  }

  function vSigns(g) {
    setTitle(t('signs'));
    const gsel = g ? +g : 0;
    const q0 = sessionStorage.getItem('signsQuery') || '';
    view().innerHTML = `<div class="chips"><a class="chip${gsel ? '' : ' active'}" href="#/signs">${esc(t('all'))}</a>
      ${SIGNS.groups.map(x => `<a class="chip${gsel === x.n ? ' active' : ''}" href="#/signs/${x.n}">${x.n}. ${esc(L(x.short || x.name))}</a>`).join('')}</div>
      <input class="search" id="sq" type="search" placeholder="${esc(t('searchSigns'))}" value="${esc(q0)}"><div id="slist"></div>`;
    const draw = () => {
      const qs = $('#sq').value.trim().toLowerCase();
      try { sessionStorage.setItem('signsQuery', qs); } catch (e) { /* */ }
      const groups = SIGNS.groups.filter(x => !gsel || x.n === gsel);
      let html = '';
      for (const gr of groups) {
        const items = SIGNS.list.filter(s => s.g === gr.n && (!qs || s.c.startsWith(qs) || L(s.name).toLowerCase().includes(qs) || (s.name.uk || '').toLowerCase().includes(qs)));
        if (!items.length) continue;
        html += `<h3>${gr.n}. ${esc(L(gr.name))} <span class="muted small">(${items.length})</span></h3><div class="sign-grid">${items.map(s => `
          <a class="sign-tile" href="#/sign/${s.c}">${s.img ? `<img src="${s.img}" alt="" loading="lazy">` : '<div style="height:74px"></div>'}<span class="code">${s.c}</span><span class="nm">${esc(L(s.name))}</span></a>`).join('')}</div>`;
      }
      if (gsel && !qs && qOfTopic('g' + gsel).length) html += `<p style="margin-top:16px"><a class="btn" href="#/test/g${gsel}">${esc(t('trainGroup'))} (${qOfTopic('g' + gsel).length})</a></p>`;
      $('#slist').innerHTML = html || `<div class="empty">${esc(t('nothing'))}</div>`;
    };
    $('#sq').addEventListener('input', draw);
    draw();
  }

  function vSign(c) {
    const s = SIGN[c];
    if (!s) { location.hash = '#/signs'; return; }
    setTitle(`${t('signs')} ${c}`, '#/signs/' + s.g);
    const same = SIGNS.list.filter(x => x.g === s.g), i = same.indexOf(s);
    const prev = same[i - 1], next = same[i + 1];
    view().innerHTML = `<div class="card">${signCard(c, true)}</div>
      <div class="pager">${prev ? `<a class="btn secondary" href="#/sign/${prev.c}">← ${prev.c}</a>` : '<span></span>'}
      ${next ? `<a class="btn secondary" href="#/sign/${next.c}">${next.c} →</a>` : ''}</div>
      ${qOfTopic('g' + s.g).length ? `<p style="margin-top:14px"><a class="btn block" href="#/test/g${s.g}">${esc(t('trainGroup'))}</a></p>` : ''}`;
    window.scrollTo(0, 0);
  }

  function vMarking() {
    setTitle(t('marking'));
    const part = kind => MARKING.list.filter(m => m.kind === kind).map(m => `
      <a class="sign-tile" data-mark="${m.c}" href="#"><div class="mk">${MarkingDraw.svg(m.c)}</div><span class="code">${m.c}</span><span class="nm">${esc(L(m.name))}</span></a>`).join('');
    view().innerHTML = `<h3>${esc(t('horizontal'))}</h3><div class="sign-grid">${part('h')}</div>
      <h3>${esc(t('vertical'))}</h3><div class="sign-grid">${part('v')}</div>
      ${qOfTopic('mk').length ? `<p style="margin-top:16px"><a class="btn" href="#/test/mk">${esc(t('trainGroup'))} (${qOfTopic('mk').length})</a></p>` : ''}`;
  }

  function vTests() {
    setTitle(t('tests'));
    const best = id => Store.d.best[id] != null ? ` · ${esc(t('best'))} ${Store.d.best[id]}%` : '';
    const doneShare = list => { const ok = list.filter(q => (Store.d.answers[q.id] || {}).last === 1).length; return list.length ? Math.round(ok / list.length * 100) : 0; };
    const topicItem = tp => {
      const list = qOfTopic(tp.id);
      if (!list.length) return '';
      const badge = tp.kind === 'rules' ? tp.n : tp.kind === 'signs' ? (SIGNS.list.find(s => s.g === tp.n && s.img) ? `<img src="${SIGNS.list.find(s => s.g === tp.n && s.img).img}" style="width:28px;height:28px;object-fit:contain" alt="">` : tp.n) : (tp.id === 'med' ? '✚' : tp.id === 'safe' ? '🛡' : '═');
      return `<a class="list-item" href="#/test/${tp.id}"><span class="num-badge">${badge}</span>
        <span style="flex:1">${esc(L(tp.name))}<br><span class="muted small">${list.length} ${esc(t('q'))}${best(tp.id)}</span>
        <div class="progress" style="margin-top:6px"><i style="width:${doneShare(list)}%"></i></div></span>${icon('chev', 'chev')}</a>`;
    };
    const mis = mistakesList().length, fav = favList().length;
    view().innerHTML = `
      <a class="tile" href="#/exam" style="margin-bottom:14px"><div class="tile-ico">${icon('exam')}</div><div><div class="tile-title">${esc(t('startExam'))}</div><div class="tile-sub">${esc(t('examSub'))}</div></div></a>
      <h3>${esc(t('quick'))}</h3>
      <div class="grid">
        <a class="tile" href="#/test/all"><div class="tile-ico">${icon('shuffle')}</div><div><div class="tile-title">${esc(t('random20'))}</div><div class="tile-sub">${esc(t('random20Sub'))} · ${ALLQ.length} ${esc(t('q'))}</div></div></a>
        <a class="tile" href="#/test/mistakes"><div class="tile-ico">${icon('bad')}</div><div><div class="tile-title">${esc(t('mistakes'))} (${mis})</div><div class="tile-sub">${esc(t('mistakesSub'))}</div></div></a>
        <a class="tile" href="#/test/fav"><div class="tile-ico">${icon('star')}</div><div><div class="tile-title">${esc(t('favorites'))} (${fav})</div><div class="tile-sub">${esc(t('favQuestions'))}</div></div></a>
      </div>
      <h3>${esc(t('topicsRules'))}</h3><div class="list">${TOPICS.filter(x => x.kind === 'rules').map(topicItem).join('')}</div>
      <h3>${esc(t('topicsSigns'))}</h3><div class="list">${TOPICS.filter(x => x.kind === 'signs').map(topicItem).join('')}</div>
      <h3>${esc(t('topicsOther'))}</h3><div class="list">${TOPICS.filter(x => x.kind === 'other').map(topicItem).join('')}</div>`;
  }

  // ───────────────────────── рушій питань ─────────────────────────
  let quiz = null, quizKey = null, timerId = null;

  // до 3 знаків з іншими назвами (спершу з тієї ж групи) — для неправильних варіантів
  function otherSigns(s, filter) {
    const out = [], seen = new Set([L(s.name)]);
    for (const x of shuffle(SIGNS.list.filter(x => x.g === s.g)).concat(shuffle(SIGNS.list))) {
      if (out.length === 3) break;
      if (!L(x.name) || seen.has(L(x.name)) || (filter && !filter(x))) continue;
      seen.add(L(x.name)); out.push(x);
    }
    return out;
  }

  function buildOptions(q) {
    if (q.kind === 'signName') {
      const s = SIGN[q.sign];
      const opts = shuffle([{ text: L(s.name), ok: true }].concat(otherSigns(s).map(x => ({ text: L(x.name), src: x.c }))));
      return { opts, correct: opts.findIndex(o => o.ok) };
    }
    if (q.kind === 'signPick') {
      const s = SIGN[q.sign];
      const opts = shuffle([{ sign: s.c, ok: true }].concat(otherSigns(s, x => x.g === s.g && x.img).map(x => ({ sign: x.c }))));
      return { opts, correct: opts.findIndex(o => o.ok) };
    }
    if (q.kind === 'mark') {
      const m = MARK[q.mark];
      const others = shuffle(MARKING.list.filter(x => x.kind === m.kind && L(x.name) !== L(m.name))).slice(0, 3);
      const opts = shuffle([{ text: L(m.name), ok: true }].concat(others.map(x => ({ text: L(x.name), mark: x.c }))));
      return { opts, correct: opts.findIndex(o => o.ok) };
    }
    return { opts: q.a.map(a => ({ text: L(a), w: a.w })), correct: q.c };
  }

  // чому обраний варіант неправильний
  function whyWrong(q, o) {
    if (!o || o.ok) return '';
    if (o.w) return rt(L(o.w));
    if (o.src) return `${esc(t('thatIsSign'))} ${signRef(o.src)}. ${esc(t('pictureShows'))} ${signRef(q.sign)} «${esc(L(SIGN[q.sign].name))}».`;
    if (o.sign) return `${esc(t('youChoseSign'))} ${signRef(o.sign)} «${esc(L(SIGN[o.sign].name))}».`;
    if (o.mark) return `${esc(t('thatIsMark'))} <a class="mref" data-mark="${o.mark}">${o.mark}</a>. ${esc(t('pictureShows'))} <a class="mref" data-mark="${q.mark}">${q.mark}</a>.`;
    return '';
  }

  function qMedia(q) {
    if (q.kind === 'signName') return `<div class="q-media"><img class="sign" src="${SIGN[q.sign].img}" alt=""></div>`;
    if (q.kind === 'mark') return `<div class="q-media"><div class="mk mk-q">${MarkingDraw.svg(q.mark)}</div></div>`;
    if (q.kind === 'signPick') return '';
    const im = q.img;
    if (!im) return '';
    let h = '';
    if (im.scene) h += `<div class="scene">${Scene.render(im.scene)}</div>`;
    (im.signs || (im.sign ? [im.sign] : [])).forEach(c => { if (SIGN[c] && SIGN[c].img) h += `<img class="sign" src="${SIGN[c].img}" alt="${c}">`; });
    if (im.mark) h += `<div class="mk mk-q">${MarkingDraw.svg(im.mark)}</div>`;
    return h ? `<div class="q-media">${h}</div>` : '';
  }
  function qText(q) {
    if (q.kind === 'signName') return t('signName');
    if (q.kind === 'signPick') return `${t('signPick')} «${L(SIGN[q.sign].name)}»?`;
    if (q.kind === 'mark') return t('markQ');
    return L(q.q);
  }
  function qExplain(q) {
    // опис із розділів 33/34 уже починається з номера й назви
    if (q.kind === 'signName' || q.kind === 'signPick') {
      const s = SIGN[q.sign];
      return s.desc && s.desc.length ? rt(L(s.desc[0])) : `<b>${s.c} «${esc(L(s.name))}»</b>`;
    }
    if (q.kind === 'mark') { const m = MARK[q.mark]; return m.desc && m.desc.length ? rt(L(m.desc[0])) : `<b>${m.c}</b> — ${esc(L(m.name))}`; }
    return rt(L(q.e));
  }
  function qRefs(q) {
    if (q.kind === 'signName' || q.kind === 'signPick') return [];
    if (q.kind === 'mark') return [];
    return q.ref || [];
  }
  const optLabel = i => String(i + 1);

  function startQuiz(mode, topic, ids) {
    const list = ids.map(id => Q[id]).filter(Boolean);
    quiz = { mode, topic, list, i: 0, ans: {}, built: {}, start: Date.now(), done: false };
    list.forEach(q => { quiz.built[q.id] = buildOptions(q); });
    if (mode === 'exam') quiz.deadline = Date.now() + 20 * 60 * 1000;
  }

  function quizCounts() {
    let ok = 0, bad = 0;
    for (const q of quiz.list) { const a = quiz.ans[q.id]; if (a == null) continue; if (a === quiz.built[q.id].correct) ok++; else bad++; }
    return { ok, bad, total: quiz.list.length };
  }

  function stopTimer() { if (timerId) { clearInterval(timerId); timerId = null; } }
  function tickTimer() {
    if (!quiz || quiz.mode !== 'exam' || quiz.done) { stopTimer(); return; }
    const left = Math.round((quiz.deadline - Date.now()) / 1000);
    const el = $('#timer');
    if (el) { el.textContent = fmtTime(Math.max(0, left)); el.classList.toggle('low', left < 120); }
    if (left <= 0) { quiz.timeUp = true; finishQuiz(); }
  }

  function renderQuiz() {
    const q = quiz.list[quiz.i];
    const b = quiz.built[q.id];
    const answered = quiz.ans[q.id] != null;
    const exam = quiz.mode === 'exam';
    const c = quizCounts();
    const nav = exam ? `<div class="qnav">${quiz.list.map((x, i) => {
      const a = quiz.ans[x.id]; const st = a == null ? '' : a === quiz.built[x.id].correct ? ' ok' : ' bad';
      return `<button data-go="${i}" class="${i === quiz.i ? 'cur' : ''}${st}">${i + 1}</button>`;
    }).join('')}</div>` : `<div class="quiz-top"><span class="small muted">${quiz.i + 1} / ${quiz.list.length}</span>
      <div class="progress"><i style="width:${(quiz.i + (answered ? 1 : 0)) / quiz.list.length * 100}%"></i></div>
      <span class="small"><b class="pass">${c.ok}</b> · <b class="fail">${c.bad}</b></span></div>`;
    const imgOpts = b.opts.some(o => o.sign);
    const opts = b.opts.map((o, i) => {
      let cls = '';
      if (answered) { if (i === b.correct) cls = ' ok'; else if (i === quiz.ans[q.id]) cls = ' bad'; }
      return `<button class="opt${cls}" data-opt="${i}"${answered ? ' disabled' : ''}><span class="ol">${optLabel(i)}</span>${o.sign ? `<img src="${SIGN[o.sign].img}" alt="">` : `<span>${esc(o.text)}</span>`}</button>`;
    }).join('');
    const isOk = answered && quiz.ans[q.id] === b.correct;
    const why = answered && !isOk ? whyWrong(q, b.opts[quiz.ans[q.id]]) : '';
    const fb = answered && !exam ? `<div class="feedback ${isOk ? 'ok' : 'bad'}"><h4>${esc(isOk ? t('correct') : t('wrong'))}</h4>
      ${why ? `<div class="why"><b>${esc(t('whyWrong'))}</b><div class="rt">${why}</div></div><b>${esc(t('explanation'))}:</b>` : ''}
      <div class="rt">${qExplain(q)}</div>${qRefs(q).length ? `<div class="refs" style="margin-top:8px"><span class="small muted">${esc(t('seeRule'))}:</span>${qRefs(q).map(r => `<a class="chip" data-point="${r}">${r}</a>`).join('')}</div>` : ''}</div>` : '';
    const last = quiz.i === quiz.list.length - 1;
    const favOn = !!Store.d.favQ[q.id];
    view().innerHTML = `${nav}
      <div class="card q-card">${qMedia(q)}<div class="q-body">
        <div class="row"><div class="q-id">${esc(t('question'))} ${quiz.i + 1}${TOPIC[q.t] ? ' · ' + esc(L(TOPIC[q.t].name)) : ''}</div><span class="spacer"></span>
        <button class="icon-btn" id="favQ" style="width:34px;height:34px">${icon('star', 'star' + (favOn ? ' on' : ''))}</button></div>
        <div class="q-text">${esc(qText(q))}</div>
        <div class="opts${imgOpts ? ' imgs' : ''}">${opts}</div>${fb}
        <div class="quiz-actions">
          ${exam ? `<button class="btn secondary" id="qPrev"${quiz.i === 0 ? ' disabled' : ''}>←</button>` : ''}
          ${answered || exam ? `<button class="btn" id="qNext">${esc(last && (!exam || allAnswered()) ? t('finish') : t('nextQ'))}</button>` : ''}
        </div></div></div>
      <p class="small muted center">${esc(t('keyboardHint'))}</p>`;
    $$('[data-opt]').forEach(el => el.onclick = () => answer(+el.dataset.opt));
    $$('[data-go]').forEach(el => el.onclick = () => { quiz.i = +el.dataset.go; renderQuiz(); });
    const nx = $('#qNext'); if (nx) nx.onclick = nextQ;
    const pv = $('#qPrev'); if (pv) pv.onclick = () => { if (quiz.i > 0) { quiz.i--; renderQuiz(); } };
    $('#favQ').onclick = () => { if (Store.d.favQ[q.id]) delete Store.d.favQ[q.id]; else Store.d.favQ[q.id] = Date.now(); Store.save(); $('#favQ svg').classList.toggle('on', !!Store.d.favQ[q.id]); };
    quizKey = e => {
      if (/^[1-9]$/.test(e.key) && !answered && +e.key <= b.opts.length) answer(+e.key - 1);
      else if ((e.key === 'Enter' || e.key === 'ArrowRight') && (answered || exam)) nextQ();
      else if (e.key === 'ArrowLeft' && exam && quiz.i > 0) { quiz.i--; renderQuiz(); }
    };
  }
  const allAnswered = () => quiz.list.every(q => quiz.ans[q.id] != null);

  function answer(i) {
    const q = quiz.list[quiz.i];
    if (quiz.ans[q.id] != null) return;
    quiz.ans[q.id] = i;
    const ok = i === quiz.built[q.id].correct;
    record(q.id, ok);
    if (quiz.mode === 'exam' && Store.d.strictExam && quizCounts().bad >= 3) { renderQuiz(); setTimeout(finishQuiz, 700); return; }
    renderQuiz();
  }
  function nextQ() {
    const exam = quiz.mode === 'exam';
    if (exam) {
      if (allAnswered()) { finishQuiz(); return; }
      // наступне питання без відповіді
      for (let k = 1; k <= quiz.list.length; k++) {
        const j = (quiz.i + k) % quiz.list.length;
        if (quiz.ans[quiz.list[j].id] == null) { quiz.i = j; break; }
      }
      renderQuiz(); window.scrollTo(0, 0); return;
    }
    if (quiz.i < quiz.list.length - 1) { quiz.i++; renderQuiz(); window.scrollTo(0, 0); }
    else finishQuiz();
  }

  function finishQuiz() {
    if (!quiz || quiz.done) return;
    quiz.done = true; stopTimer(); quizKey = null;
    const c = quizCounts();
    const exam = quiz.mode === 'exam';
    const secs = Math.round((Date.now() - quiz.start) / 1000);
    if (exam) {
      quiz.passed = !quiz.timeUp && c.bad <= 2 && allAnswered();
      Store.d.exams.unshift({ ts: Date.now(), ok: c.ok, bad: c.bad, total: c.total, passed: quiz.passed, secs });
      Store.d.exams = Store.d.exams.slice(0, 100);
    } else if (TOPIC[quiz.topic] || quiz.topic === 'all') {
      const pct = Math.round(c.ok / c.total * 100);
      if (Store.d.best[quiz.topic] == null || pct > Store.d.best[quiz.topic]) Store.d.best[quiz.topic] = pct;
    }
    Store.save();
    renderResult();
  }

  function renderResult() {
    const c = quizCounts();
    const exam = quiz.mode === 'exam';
    setExtra('');
    const wrong = quiz.list.filter(q => quiz.ans[q.id] !== quiz.built[q.id].correct);
    const head = exam
      ? `<div class="result-big title ${quiz.passed ? 'pass' : 'fail'}">${esc(quiz.passed ? t('passed') : t('failed'))}</div>
         <p>${c.ok} ${esc(t('of'))} ${c.total} · ${c.bad} ${esc(plural(c.bad, t('errorsForms')))}${quiz.timeUp ? ' · ' + esc(t('timeUp')) : ''}</p>`
      : `<div class="result-big ${c.bad === 0 ? 'pass' : c.ok / c.total >= .9 ? 'pass' : 'fail'}">${Math.round(c.ok / c.total * 100)}%</div>
         <p>${esc(t('okCount'))}: ${c.ok} · ${esc(t('wrongCount'))}: ${c.bad}${c.ok + c.bad < c.total ? ` · ${esc(t('unanswered'))}: ${c.total - c.ok - c.bad}` : ''}</p>`;
    const review = wrong.map(q => {
      const b = quiz.built[q.id], a = quiz.ans[q.id];
      const show = o => o ? (o.sign ? `<img src="${SIGN[o.sign].img}" alt="" style="height:44px;vertical-align:middle"> ${o.sign}` : esc(o.text)) : '—';
      return `<div class="card">${qMedia(q)}<div class="q-text" style="margin-top:10px">${esc(qText(q))}</div>
        <p class="fail small">${esc(t('yourAnswer'))}: ${a == null ? esc(t('noAnswer')) : show(b.opts[a])}</p>
        ${a != null && whyWrong(q, b.opts[a]) ? `<div class="why small"><b>${esc(t('whyWrong'))}</b><div class="rt">${whyWrong(q, b.opts[a])}</div></div>` : ''}
        <p class="pass small"><b>${esc(t('correctIs'))}:</b> ${show(b.opts[b.correct])}</p>
        <div class="rt small">${qExplain(q)}</div>${qRefs(q).length ? `<div class="refs" style="margin-top:8px">${qRefs(q).map(r => `<a class="chip" data-point="${r}">${r}</a>`).join('')}</div>` : ''}</div>`;
    }).join('');
    view().innerHTML = `<div class="card center">${head}
      <div class="row" style="justify-content:center;margin-top:10px">
        <button class="btn" id="again">${esc(t('restart'))}</button>
        ${wrong.length && !exam ? `<button class="btn secondary" id="retryWrong">${esc(t('retryWrong'))} (${wrong.length})</button>` : ''}
        <a class="btn secondary" href="#/tests">${esc(t('backToTests'))}</a></div></div>
      ${wrong.length ? `<h3>${esc(t('review'))}</h3>${review}` : ''}`;
    $('#again').onclick = () => { const tp = quiz.topic; quiz = null; if (exam) { location.hash = '#/exam/run'; route(); } else { location.hash = '#/test/' + tp; route(); } };
    const rw = $('#retryWrong');
    if (rw) rw.onclick = () => { startQuiz('practice', quiz.topic, shuffle(wrong.map(q => q.id))); renderQuiz(); };
    window.scrollTo(0, 0);
  }

  function practiceIds(topic) {
    if (topic === 'all') return pick(ALLQ.map(q => q.id), 20);
    if (topic === 'mistakes') return shuffle(mistakesList());
    if (topic === 'fav') return shuffle(favList());
    return shuffle(qOfTopic(topic).map(q => q.id));
  }

  function vPractice(topic) {
    const tp = TOPIC[topic];
    const title = topic === 'all' ? t('random20') : topic === 'mistakes' ? t('mistakes') : topic === 'fav' ? t('favorites') : tp ? L(tp.name) : t('tests');
    setTitle(title, '#/tests');
    if (!quiz || quiz.mode !== 'practice' || quiz.topic !== topic) {
      const ids = practiceIds(topic);
      if (!ids.length) { view().innerHTML = `<div class="empty">${esc(topic === 'fav' ? t('emptyFav') : t('emptyMistakes'))}</div>`; return; }
      startQuiz('practice', topic, ids);
    }
    if (quiz.done) renderResult(); else renderQuiz();
  }

  function examIds() {
    const used = new Set(), out = [];
    const take = (pool, n) => { for (const q of shuffle(pool)) { if (out.length >= 20 || n <= 0) break; if (!used.has(q.id)) { used.add(q.id); out.push(q.id); n--; } } };
    const hand = (QDATA.list || []);
    take(GEN.filter(q => q.kind === 'signName'), 3);
    take(GEN.filter(q => q.kind === 'signPick'), 1);
    take(GEN.filter(q => q.kind === 'mark'), 1);
    take(hand.filter(q => q.t === 'safe' || q.t === 'med'), 2);
    take(hand.filter(q => TOPIC[q.t] && TOPIC[q.t].kind === 'rules'), 20 - out.length);
    take(ALLQ, 20 - out.length);
    return shuffle(out);
  }

  function vExam(sub) {
    setTitle(t('exam'));
    if (sub === 'run') {
      if (!quiz || quiz.mode !== 'exam' || quiz.done) startQuiz('exam', 'exam', examIds());
      setTitle(t('exam'), null);
      $('#backBtn').hidden = false;
      $('#backBtn').onclick = () => { if (confirm(t('exitConfirm'))) { quiz = null; stopTimer(); setExtra(''); location.hash = '#/exam'; } };
      setExtra(`<span class="timer" id="timer">20:00</span>`);
      stopTimer(); timerId = setInterval(tickTimer, 1000); tickTimer();
      if (!quiz.done) renderQuiz();
      return;
    }
    const active = quiz && quiz.mode === 'exam' && !quiz.done;
    const hist = Store.d.exams.slice(0, 10);
    view().innerHTML = `<div class="card"><h2>${esc(t('exam'))}</h2><p>${esc(t('examRules'))}</p>
      <label class="row small" style="margin:10px 0 14px"><input type="checkbox" id="strict"${Store.d.strictExam ? ' checked' : ''}> ${esc(t('examStrict'))}</label>
      <div class="row"><a class="btn" href="#/exam/run" id="startEx">${esc(active ? t('continueExam') : t('startExam'))}</a></div></div>
      <div class="card"><h3 style="margin-top:0">${esc(t('examHistory'))}</h3>${hist.length ? hist.map(x => `
        <div class="history-row"><span class="dot ${x.passed ? 'ok' : 'bad'}"></span><span style="flex:1">${new Date(x.ts).toLocaleString(lang() === 'ru' ? 'ru-RU' : 'uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
        <b>${x.ok}/${x.total}</b><span class="muted small">${fmtTime(x.secs)}</span></div>`).join('') : `<p class="muted">${esc(t('noExams'))}</p>`}</div>`;
    $('#strict').onchange = e => { Store.d.strictExam = e.target.checked; Store.save(); };
  }

  function vMistakes() {
    setTitle(t('mistakes'));
    const ids = mistakesList();
    if (!ids.length) { view().innerHTML = `<div class="empty">${esc(t('emptyMistakes'))}</div>`; return; }
    view().innerHTML = `<p><a class="btn" href="#/test/mistakes">${esc(t('start'))} (${ids.length})</a></p><div class="list">${ids.map(id => {
      const q = Q[id];
      return `<div class="list-item"><span class="num-badge">${esc(TOPIC[q.t] && TOPIC[q.t].kind === 'rules' ? TOPIC[q.t].n : '•')}</span><span style="flex:1">${esc(qText(q))}${q.kind === 'signName' || q.kind === 'signPick' ? ` (${q.sign})` : q.kind === 'mark' ? ` (${q.mark})` : ''}</span></div>`;
    }).join('')}</div>`;
  }

  function vFavorites() {
    setTitle(t('favorites'));
    const pts = Object.keys(Store.d.favP).filter(n => POINT[n]);
    const qs = favList();
    if (!pts.length && !qs.length) { view().innerHTML = `<div class="empty">${esc(t('emptyFav'))}</div>`; return; }
    view().innerHTML = `${pts.length ? `<h3>${esc(t('favPoints'))}</h3>${pts.map(n => `<div class="point"><div class="point-head"><a class="point-num" href="#/rules/${POINT[n].sec.n}/${n}">${n}</a><span class="muted small">${esc(L(POINT[n].sec.title))}</span></div><div class="rt">${blocksHtml(POINT[n].p.blocks)}</div></div>`).join('')}` : ''}
      ${qs.length ? `<h3>${esc(t('favQuestions'))} (${qs.length})</h3><p><a class="btn" href="#/test/fav">${esc(t('start'))}</a></p>` : ''}`;
  }

  function vStats() {
    setTitle(t('stats'));
    const rows = TOPICS.map(tp => {
      const list = qOfTopic(tp.id);
      if (!list.length) return '';
      const ok = list.filter(q => (Store.d.answers[q.id] || {}).last === 1).length;
      const bad = list.filter(q => (Store.d.answers[q.id] || {}).last === 0).length;
      return `<div class="history-row"><span style="flex:1">${esc(L(tp.name))}<div class="progress" style="margin-top:4px"><i style="width:${ok / list.length * 100}%"></i></div></span>
        <span class="small"><b class="pass">${ok}</b> / <b class="fail">${bad}</b> / ${list.length}</span></div>`;
    }).join('');
    const ex = Store.d.exams, passed = ex.filter(x => x.passed).length;
    view().innerHTML = `<div class="grid" style="margin-bottom:14px">
        <div class="card"><div class="muted small">${esc(t('sectionsRead'))}</div><div class="result-big" style="font-size:2em">${Object.keys(Store.d.read).length}/${PDR.sections.length}</div></div>
        <div class="card"><div class="muted small">${esc(t('solved'))}</div><div class="result-big" style="font-size:2em">${solvedCount()}/${ALLQ.length}</div></div>
        <div class="card"><div class="muted small">${esc(t('passedExams'))}</div><div class="result-big" style="font-size:2em">${passed}/${ex.length}</div></div></div>
      <div class="card"><h3 style="margin-top:0">${esc(t('progressTopic'))}</h3>${rows}</div>`;
  }

  let installEvt = null;
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEvt = e; });

  function vSettings() {
    setTitle(t('settings'));
    const seg = (name, items, cur) => `<div class="seg" data-seg="${name}">${items.map(([v, l]) => `<button data-v="${v}" class="${String(cur) === String(v) ? 'on' : ''}">${esc(l)}</button>`).join('')}</div>`;
    view().innerHTML = `<div class="card">
      <div class="setting"><span class="label">${esc(t('language'))}</span>${seg('lang', [['uk', 'Українська'], ['ru', 'Русский']], lang())}</div>
      <div class="setting"><span class="label">${esc(t('theme'))}</span>${seg('theme', [['auto', t('themeAuto')], ['light', t('themeLight')], ['dark', t('themeDark')]], Store.d.theme)}</div>
      <div class="setting"><span class="label">${esc(t('fontSize'))}</span>${seg('fs', [[15, 'A−'], [16, 'A'], [18, 'A+'], [20, 'A++']], Store.d.fs)}</div>
      </div>
      <div class="card"><h3 style="margin-top:0">${esc(t('install'))}</h3><p>${esc(t('installWin'))}</p><p>${esc(t('installIos'))}</p>
        <button class="btn" id="installBtn"${installEvt ? '' : ' hidden'}>${esc(t('installBtn'))}</button></div>
      <div class="card"><h3 style="margin-top:0">${esc(t('about'))}</h3><p class="small">${esc(t('aboutText'))}</p>
        <p class="small muted">${esc(t('edition'))}: ${esc(PDR.meta.edition || '—')} · ${PDR.sections.length} / ${Object.keys(POINT).length} · ${SIGNS.list.length} ${esc(t('signs').toLowerCase())} · ${ALLQ.length} ${esc(t('q'))}</p>
        <button class="btn secondary" id="resetBtn">${esc(t('resetProgress'))}</button></div>`;
    $$('[data-seg]').forEach(sg => sg.onclick = e => {
      const b = e.target.closest('button'); if (!b) return;
      const k = sg.dataset.seg, v = b.dataset.v;
      Store.d[k] = k === 'fs' ? +v : v; Store.save(); applyPrefs(); route();
    });
    const ib = $('#installBtn');
    if (ib) ib.onclick = async () => { if (!installEvt) return; installEvt.prompt(); installEvt = null; ib.hidden = true; };
    $('#resetBtn').onclick = () => {
      if (!confirm(t('resetConfirm'))) return;
      Object.assign(Store.d, { answers: {}, read: {}, favQ: {}, favP: {}, exams: [], best: {}, lastSection: 0 });
      Store.save(); route();
    };
  }

  // ───────────────────────── маршрутизація ─────────────────────────
  function route() {
    const h = decodeURIComponent(location.hash.replace(/^#\/?/, ''));
    const [a, b, c] = h.split('/');
    closeModal();
    if (a !== 'exam' || b !== 'run') { setExtra(''); if (!(quiz && quiz.mode === 'exam' && !quiz.done)) stopTimer(); }
    if (!(a === 'test' || (a === 'exam' && b === 'run'))) quizKey = null;
    renderNav(h);
    switch (a) {
      case '': case undefined: vHome(); break;
      case 'rules': b ? vSection(+b, c) : vRules(); break;
      case 'signs': vSigns(b); break;
      case 'sign': vSign(b); break;
      case 'marking': vMarking(); break;
      case 'tests': vTests(); break;
      case 'test': vPractice(b); break;
      case 'exam': vExam(b); break;
      case 'mistakes': vMistakes(); break;
      case 'favorites': vFavorites(); break;
      case 'stats': vStats(); break;
      case 'settings': vSettings(); break;
      default: vHome();
    }
    if (!(a === 'rules' && c)) $('#view').focus({ preventScroll: true });
  }

  $('#langBtn').onclick = () => { Store.d.lang = lang() === 'uk' ? 'ru' : 'uk'; Store.save(); route(); };
  window.addEventListener('hashchange', () => { route(); if (!/^#\/rules\/\d+\//.test(location.hash)) window.scrollTo(0, 0); });
  applyPrefs();
  route();

  // офлайн-кеш: на https (GitHub Pages тощо); локально — лише з ?sw=1, щоб не заважав розробці
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.search.includes('sw=1'))) {
    navigator.serviceWorker.register('sw.js').catch(() => { /* офлайн-кеш недоступний */ });
  }
})();
