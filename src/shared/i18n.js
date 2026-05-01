// 跨矩阵共享的语言偏好 + 通用文案。
// 每个游戏在自己的 main.js 里调 registerStrings(gameDict) 注入专属文案。
const LOCALE_KEY = 'tinypaws_locale_v1';
const SUPPORTED = ['en', 'zh'];

// 矩阵通用文案（结果弹窗、Follow CTA 等）。游戏自己的字典会覆盖同名 key。
const SHARED_DICT = {
  zh: {
    won_title: '通关！',
    lost_title: '失败了',
    btn_next: '下一关',
    btn_retry: '重试',
    btn_play_again: '再玩一次',
    btn_follow: '🐾 关注 TinyPaws',
    btn_home: '关卡选择',
  },
  en: {
    won_title: 'You Won!',
    lost_title: 'Game Over',
    btn_next: 'Next Level',
    btn_retry: 'Retry',
    btn_play_again: 'Play Again',
    btn_follow: '🐾 Follow TinyPaws',
    btn_home: 'Levels',
  },
};

const dict = {
  en: { ...SHARED_DICT.en },
  zh: { ...SHARED_DICT.zh },
};

function loadLocale() {
  try {
    const saved = localStorage.getItem(LOCALE_KEY);
    if (saved && SUPPORTED.includes(saved)) return saved;
  } catch {
    // ignore
  }
  return 'en';
}

let currentLocale = loadLocale();
try { document.documentElement.lang = currentLocale; } catch {}

export function getLocale() {
  return currentLocale;
}

export function setLocale(loc) {
  if (!SUPPORTED.includes(loc)) return;
  currentLocale = loc;
  try { localStorage.setItem(LOCALE_KEY, loc); } catch {}
  try { document.documentElement.lang = loc; } catch {}
}

export function nextLocale() {
  return currentLocale === 'en' ? 'zh' : 'en';
}

// 注入游戏自己的字典。可调用多次，后调的覆盖先调的。
export function registerStrings(gameStrings) {
  for (const lang of SUPPORTED) {
    if (gameStrings[lang]) {
      Object.assign(dict[lang], gameStrings[lang]);
    }
  }
}

export function t(key, ...args) {
  const tbl = dict[currentLocale] || dict.en;
  let v = tbl[key];
  if (v === undefined) v = dict.en[key];
  if (typeof v === 'string') {
    args.forEach((a, i) => {
      v = v.replace(`{${i}}`, String(a));
    });
  }
  return v;
}
