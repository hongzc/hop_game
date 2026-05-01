// 全矩阵共享静音状态：用户在任一款里静音，所有 TinyPaws 游戏都静音
const MUTE_KEY = 'tinypaws_mute_v1';

let ctx = null;
let muted = loadMuted();

function loadMuted() {
  try { return localStorage.getItem(MUTE_KEY) === '1'; } catch { return false; }
}

function saveMuted(v) {
  try { localStorage.setItem(MUTE_KEY, v ? '1' : '0'); } catch {}
}

function ensureCtx() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  return ctx;
}

export function isMuted() { return muted; }

export function toggleMute() {
  muted = !muted;
  saveMuted(muted);
  return muted;
}

// 单个音符：频率 freq，时长 dur 秒，波形 type，起始延迟 t0
function tone(freq, dur, type = 'sine', t0 = 0, peak = 0.18) {
  const c = ensureCtx();
  if (!c || muted) return;
  const start = c.currentTime + t0;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  // ADSR 简化：快起，指数衰减
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(peak, start + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.connect(gain).connect(c.destination);
  osc.start(start);
  osc.stop(start + dur + 0.02);
}

// 取牌/落子：短促上扬 tap
export function sfxPick() {
  tone(660, 0.08, 'triangle', 0, 0.12);
}

// 消除/合成：三音上行琶音
export function sfxMatch() {
  tone(523.25, 0.12, 'triangle', 0.00, 0.16);
  tone(659.25, 0.12, 'triangle', 0.06, 0.16);
  tone(783.99, 0.18, 'triangle', 0.12, 0.18);
}

// 胜利：四音琶音 + 高音点缀
export function sfxWin() {
  tone(523.25, 0.14, 'triangle', 0.00, 0.18);
  tone(659.25, 0.14, 'triangle', 0.10, 0.18);
  tone(783.99, 0.14, 'triangle', 0.20, 0.18);
  tone(1046.5, 0.30, 'triangle', 0.30, 0.20);
}

// 失败：下行
export function sfxLose() {
  tone(440, 0.16, 'sawtooth', 0.00, 0.12);
  tone(330, 0.20, 'sawtooth', 0.12, 0.12);
  tone(220, 0.30, 'sawtooth', 0.28, 0.12);
}

// 道具按钮：轻微"叮"
export function sfxItem() {
  tone(880, 0.10, 'sine', 0, 0.14);
}

// 浏览器策略：AudioContext 必须用户手势后才能启动
export function unlockAudio() {
  const c = ensureCtx();
  if (c && c.state === 'suspended') c.resume();
}
