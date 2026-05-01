import { tgReady, tgUser, tgPlatformInfo, haptic } from './shared/telegram.js';
import { registerStrings, t, getLocale, setLocale } from './shared/i18n.js';
import { isMuted, toggleMute, unlockAudio, sfxPick, sfxMatch, sfxLose } from './shared/audio.js';
import { identify, track } from './shared/analytics.js';
import { gameStrings } from './strings.js';
import { createWorld, startCharge, releaseCharge, step, resetWorld } from './game.js';
import { startRender } from './render.js';

registerStrings(gameStrings);
tgReady();

const u = tgUser();
if (u) identify(u);
track('app_loaded', { has_telegram_user: !!u, ...tgPlatformInfo() });

window.addEventListener('pointerdown', unlockAudio, { once: true });
window.addEventListener('touchstart', unlockAudio, { once: true });

let world = createWorld();
let scoreEl, bestEl;

render();

function render() {
  const root = document.getElementById('app');
  root.innerHTML = '';
  const screen = el('div', 'screen game');

  // HUD
  const hud = el('div', 'hud');
  bestEl = el('div', 'best', `${t('hop.best')} 0`);
  scoreEl = el('div', 'score', '0');
  const muteBtn = el('button', 'icon-btn', isMuted() ? '🔇' : '🔊');
  muteBtn.addEventListener('click', () => {
    toggleMute();
    muteBtn.textContent = isMuted() ? '🔇' : '🔊';
  });
  hud.append(bestEl, scoreEl, muteBtn);
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

  // pointer 事件 —— 整个 canvas 接管
  canvas.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    canvas.setPointerCapture(e.pointerId);
    if (world.state === 'dead') {
      resetWorld(world);
      if (scoreEl) scoreEl.textContent = '0';
      return;
    }
    startCharge(world, performance.now());
  });
  canvas.addEventListener('pointerup', () => {
    if (world.state !== 'charging') return;
    releaseCharge(world, performance.now());
    sfxPick();
    haptic('pick');
  });
  canvas.addEventListener('pointercancel', () => {
    // 取消蓄力（不起跳，直接回 idle）
    if (world.state === 'charging') world.state = 'idle';
  });

  // 主循环驱动 step + 处理 lastEvent 的副作用
  startRender(canvas, world, (dt) => {
    step(world, dt);
    drainEvents();
  });
}

function drainEvents() {
  if (!world.lastEvent) return;
  const ev = world.lastEvent;
  world.lastEvent = null;
  if (ev === 'precision') {
    sfxMatch();
    haptic('match');
  } else if (ev === 'land') {
    sfxPick();
    haptic('pick');
  } else if (ev === 'miss') {
    sfxLose();
    haptic('lose');
    track('game_over', { score: world.score });
  }
  // 同步 HUD
  if (scoreEl) scoreEl.textContent = String(world.score);
}

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}
