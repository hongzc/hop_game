// Hop 物理 + 关卡状态机 + 平台程序化生成 + 相机滚动。
// 视口逻辑坐标 360 × 540。物理手写抛物线（重力 + 初速），不用 matter-js。

export const WORLD_W = 360;
export const WORLD_H = 540;
export const GROUND_Y = 460;
export const PLAYER_R = 14;
export const GRAVITY = 1400;
export const MAX_CHARGE_MS = 1100;
export const MIN_JUMP_VX = 120;
export const MAX_JUMP_VX = 520;
export const MIN_JUMP_VY = -340;
export const MAX_JUMP_VY = -640;
export const FALL_KILL_Y = WORLD_H + 80;
export const PRECISION_R = 8;

// 平台生成参数。理论最大射程 = MAX_VX × (-2·MAX_VY / G) ≈ 520 × 0.91 ≈ 473px
// 实际给玩家留余量，用 0.6 作为上限。
const MAX_GAP = 220;
const MIN_GAP = 60;
const MIN_PLAT_W = 56;
const MAX_PLAT_W = 110;
const PLATFORMS_AHEAD = 3;            // 玩家所站之后预生成数量
const CAMERA_PLAYER_X = WORLD_W * 0.35;

export function createWorld() {
  const platforms = [
    { x: 30, y: GROUND_Y, w: 100, h: 16 },
  ];
  const start = platforms[0];
  const world = {
    player: {
      x: start.x + start.w / 2,
      y: start.y - PLAYER_R,
      vx: 0,
      vy: 0,
    },
    platforms,
    standingOn: 0,
    camera: { x: 0 },
    state: 'idle',
    chargeMs: 0,
    chargeStart: 0,
    score: 0,
    combo: 0,
    lastEvent: null,
    popups: [],          // 浮动得分提示 [{x, y, text, color, ageMs, lifeMs}]
    flashMs: 0,           // 玩家精准着陆时的闪光残留
  };
  ensurePlatforms(world);
  return world;
}

export function chargeRatio(world, now) {
  if (world.state !== 'charging') return 0;
  const dt = Math.min(MAX_CHARGE_MS, now - world.chargeStart);
  return dt / MAX_CHARGE_MS;
}

export function startCharge(world, now) {
  if (world.state !== 'idle') return;
  world.state = 'charging';
  world.chargeStart = now;
}

export function releaseCharge(world, now) {
  if (world.state !== 'charging') return;
  const ratio = chargeRatio(world, now);
  world.chargeMs = ratio * MAX_CHARGE_MS;
  world.player.vx = MIN_JUMP_VX + (MAX_JUMP_VX - MIN_JUMP_VX) * ratio;
  world.player.vy = MIN_JUMP_VY + (MAX_JUMP_VY - MIN_JUMP_VY) * ratio;
  world.state = 'jumping';
  world.lastEvent = 'jump';
}

export function step(world, dt) {
  // 相机平滑跟随（不只在 jumping 时）
  const targetCamX = Math.max(0, world.player.x - CAMERA_PLAYER_X);
  world.camera.x += (targetCamX - world.camera.x) * Math.min(1, dt * 8);

  // 推进 popups 时间，淘汰过期
  if (world.popups.length) {
    for (const pop of world.popups) pop.ageMs += dt * 1000;
    world.popups = world.popups.filter(p => p.ageMs < p.lifeMs);
  }
  if (world.flashMs > 0) world.flashMs = Math.max(0, world.flashMs - dt * 1000);

  if (world.state !== 'jumping') return;
  const p = world.player;
  p.vy += GRAVITY * dt;
  p.x += p.vx * dt;
  p.y += p.vy * dt;

  if (p.y > FALL_KILL_Y) {
    world.state = 'dead';
    world.lastEvent = 'miss';
    return;
  }

  if (p.vy <= 0) return;
  const playerBottom = p.y + PLAYER_R;
  for (let i = 0; i < world.platforms.length; i++) {
    if (i === world.standingOn) continue;
    const plat = world.platforms[i];
    if (playerBottom < plat.y) continue;
    if (playerBottom > plat.y + plat.h) continue;
    if (p.x < plat.x || p.x > plat.x + plat.w) continue;

    p.y = plat.y - PLAYER_R;
    p.vx = 0;
    p.vy = 0;
    world.standingOn = i;
    world.state = 'idle';

    const center = plat.x + plat.w / 2;
    const dist = Math.abs(p.x - center);
    if (dist < PRECISION_R) {
      world.combo += 1;
      const gain = 1 + 2 * world.combo;
      world.score += gain;
      world.lastEvent = 'precision';
      world.flashMs = 220;
      pushPopup(world, p.x, plat.y - PLAYER_R - 10,
        world.combo > 1 ? `Combo x${world.combo} +${gain}` : `Precision +${gain}`,
        '#f59e0b');
    } else {
      world.combo = 0;
      world.score += 1;
      world.lastEvent = 'land';
      pushPopup(world, p.x, plat.y - PLAYER_R - 10, '+1', '#0ea5e9');
    }
    ensurePlatforms(world);
    return;
  }
}

function pushPopup(world, x, y, text, color) {
  world.popups.push({ x, y, text, color, ageMs: 0, lifeMs: 900 });
}

// 玩家所站平台之后保持 PLATFORMS_AHEAD 块预生成
function ensurePlatforms(world) {
  while (world.platforms.length - world.standingOn - 1 < PLATFORMS_AHEAD) {
    const last = world.platforms[world.platforms.length - 1];
    const gap = MIN_GAP + Math.random() * (MAX_GAP - MIN_GAP);
    const w = MIN_PLAT_W + Math.random() * (MAX_PLAT_W - MIN_PLAT_W);
    world.platforms.push({
      x: last.x + last.w + gap,
      y: GROUND_Y,
      w,
      h: 16,
    });
  }
}

// 重开局：保留 best-score 之外所有局内状态重置
export function resetWorld(world) {
  const fresh = createWorld();
  Object.assign(world, fresh);
}
