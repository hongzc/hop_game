import { tgReady, tgUser, tgPlatformInfo, haptic, openTelegramLink } from './shared/telegram.js';
import { registerStrings, t, getLocale, setLocale } from './shared/i18n.js';
import { isMuted, toggleMute, unlockAudio, sfxPick, sfxMatch, sfxLose, sfxWin } from './shared/audio.js';
import { fireConfettiAt, fireWinConfetti } from './shared/confetti.js';
import { identify, track } from './shared/analytics.js';
import { load, save as saveStore } from './shared/storage.js';
import { showResultModal } from './shared/result-modal.js';
import { gameStrings } from './strings.js';
import { createWorld, startCharge, releaseCharge, step, resetWorld } from './game.js';
import { startRender } from './render.js';

const SAVE_KEY = 'hop_save_v1';
const FOLLOW_URL = 'https://t.me/tinypaws_games';

function loadSave() {
  try {
    const raw = load(SAVE_KEY);
    if (!raw) return { highScore: 0 };
    const obj = JSON.parse(raw);
    return { highScore: obj.highScore || 0 };
  } catch {
    return { highScore: 0 };
  }
}

function persistSave(s) {
  saveStore(SAVE_KEY, JSON.stringify(s));
}

let saveData = loadSave();
let firstJumpTracked = false;

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
  bestEl = el('div', 'best', `${t('hop.best')} ${saveData.highScore}`);
  scoreEl = el('div', 'score', String(world.score));
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
    if (world.state === 'dead') return;            // dead 由 modal 的 retry 按钮接管
    startCharge(world, performance.now());
  });
  canvas.addEventListener('pointerup', () => {
    if (world.state !== 'charging') return;
    const charge = (performance.now() - world.chargeStart) / 1100;  // 同 MAX_CHARGE_MS
    releaseCharge(world, performance.now());
    sfxPick();
    haptic('pick');
    if (!firstJumpTracked) {
      firstJumpTracked = true;
      track('first_jump', { charge: Math.min(1, charge).toFixed(2) });
    }
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
    if (world.combo >= 3 && world.combo % 3 === 0) {
      fireConfettiAt(document.querySelector('#game'));
      track('combo_milestone', { combo: world.combo });
    }
  } else if (ev === 'land') {
    sfxPick();
    haptic('pick');
  } else if (ev === 'miss') {
    onGameOver();
  }
  // 同步 HUD
  if (scoreEl) scoreEl.textContent = String(world.score);
}

function onGameOver() {
  const previousBest = saveData.highScore;
  const isNewBest = world.score > previousBest;
  if (isNewBest) {
    saveData.highScore = world.score;
    persistSave(saveData);
    if (bestEl) bestEl.textContent = `${t('hop.best')} ${saveData.highScore}`;
  }
  track('game_over', { score: world.score, high_score: saveData.highScore, new_best: isNewBest });

  if (isNewBest) {
    sfxWin();
    haptic('win');
    fireWinConfetti();
  } else {
    sfxLose();
    haptic('lose');
  }

  showResultModal(
    {
      won: isNewBest,
      primaryStat: `${t('hop.score')} ${world.score} · ${t('hop.best')} ${saveData.highScore}`,
      loseSub: `${t('hop.score')} ${world.score} · ${t('hop.best')} ${saveData.highScore}`,
      winEmoji: '🦘',
      loseEmoji: '😿',
      followUrl: FOLLOW_URL,
    },
    {
      onRetry: () => {
        document.querySelector('.modal-overlay')?.remove();
        resetWorld(world);
        if (scoreEl) scoreEl.textContent = '0';
      },
      onFollow: isNewBest ? () => {
        track('follow_clicked', { source: 'hop_win_modal' });
        openTelegramLink(FOLLOW_URL);
      } : undefined,
    },
  );
}

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}
