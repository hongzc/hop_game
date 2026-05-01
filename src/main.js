import { tgReady, tgUser, tgPlatformInfo } from './shared/telegram.js';
import { registerStrings, t, getLocale, setLocale } from './shared/i18n.js';
import { isMuted, toggleMute, unlockAudio } from './shared/audio.js';
import { identify, track } from './shared/analytics.js';
import { gameStrings } from './strings.js';
import { createWorld } from './game.js';
import { startRender } from './render.js';

registerStrings(gameStrings);
tgReady();

const u = tgUser();
if (u) identify(u);
track('app_loaded', { has_telegram_user: !!u, ...tgPlatformInfo() });

window.addEventListener('pointerdown', unlockAudio, { once: true });
window.addEventListener('touchstart', unlockAudio, { once: true });

const world = createWorld();
let charge = 0;     // 0..1，D2 接蓄力逻辑

render();

function render() {
  const root = document.getElementById('app');
  root.innerHTML = '';
  const screen = el('div', 'screen game');

  // HUD
  const hud = el('div', 'hud');
  const best = el('div', 'best', `${t('hop.best')} 0`);
  const score = el('div', 'score', '0');
  const muteBtn = el('button', 'icon-btn', isMuted() ? '🔇' : '🔊');
  muteBtn.addEventListener('click', () => {
    toggleMute();
    muteBtn.textContent = isMuted() ? '🔇' : '🔊';
  });
  hud.append(best, score, muteBtn);
  screen.append(hud);

  // canvas
  const wrap = el('div', 'canvas-wrap');
  const canvas = document.createElement('canvas');
  canvas.id = 'game';
  wrap.append(canvas);
  screen.append(wrap);

  // 语言切换
  const langBtn = el('button', 'lang-btn', getLocale() === 'zh' ? 'EN' : '中');
  langBtn.addEventListener('click', () => {
    setLocale(getLocale() === 'zh' ? 'en' : 'zh');
    render();
  });
  screen.append(langBtn);

  root.append(screen);

  startRender(canvas, world, () => charge);
}

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}
