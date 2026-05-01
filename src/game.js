// Hop 物理 + 关卡状态机。
// 视口逻辑坐标 360 × 540。相机沿 x 平移，y 固定。
// 物理手写抛物线（重力 + 初速），不用 matter-js。

export const WORLD_W = 360;
export const WORLD_H = 540;
export const GROUND_Y = 460;            // 平台顶面 y
export const PLAYER_R = 14;             // 玩家半径
export const GRAVITY = 1400;            // px/s²
export const MAX_CHARGE_MS = 1100;      // 蓄力封顶
export const MIN_JUMP_VX = 120;
export const MAX_JUMP_VX = 520;
export const MIN_JUMP_VY = -340;        // 蓄力 0 时的最小竖直初速（仍能跳一点）
export const MAX_JUMP_VY = -640;        // 蓄力满时的竖直初速
export const FALL_KILL_Y = WORLD_H + 80; // 玩家 y 超过此值视为坠亡
export const PRECISION_R = 8;           // 落点距平台中心 < 此值 = 精准

// 状态机：
//  idle      - 站在平台上，等指头按下
//  charging  - 蓄力中（pointerdown）
//  jumping   - 起跳后空中飞行
//  dead      - 坠亡（落空 / 平台外）
export function createWorld() {
  const platforms = [
    { x: 30, y: GROUND_Y, w: 100, h: 16 },
    { x: 200, y: GROUND_Y, w: 100, h: 16 },
  ];
  const start = platforms[0];
  return {
    player: {
      x: start.x + start.w / 2,
      y: start.y - PLAYER_R,
      vx: 0,
      vy: 0,
    },
    platforms,
    standingOn: 0,                      // 玩家当前所站平台 index
    camera: { x: 0 },
    state: 'idle',
    chargeMs: 0,
    chargeStart: 0,
    score: 0,
    combo: 0,
    lastEvent: null,                    // 'jump' | 'land' | 'precision' | 'miss' | null
  };
}

// 蓄力比例 0..1
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
  // 线性插值：vx vy 都随蓄力线性增长
  world.player.vx = MIN_JUMP_VX + (MAX_JUMP_VX - MIN_JUMP_VX) * ratio;
  world.player.vy = MIN_JUMP_VY + (MAX_JUMP_VY - MIN_JUMP_VY) * ratio;
  world.state = 'jumping';
  world.lastEvent = 'jump';
}

// 每帧推进物理（dt 单位：秒）
export function step(world, dt) {
  if (world.state !== 'jumping') return;
  const p = world.player;
  p.vy += GRAVITY * dt;
  p.x += p.vx * dt;
  p.y += p.vy * dt;

  // 坠亡兜底
  if (p.y > FALL_KILL_Y) {
    world.state = 'dead';
    world.lastEvent = 'miss';
    return;
  }

  // 着陆判定：玩家底部触及任意平台顶面 + 玩家在向下运动
  if (p.vy <= 0) return;                          // 上升期不判定
  const playerBottom = p.y + PLAYER_R;
  for (let i = 0; i < world.platforms.length; i++) {
    if (i === world.standingOn) continue;          // 不和起跳平台再次着陆
    const plat = world.platforms[i];
    if (playerBottom < plat.y) continue;
    // 上一帧底部应高于平台顶面，本帧穿入；放宽允许 PLAYER_R 内的"刚好接触"
    if (playerBottom > plat.y + plat.h) continue;  // 已穿过整个平台厚度，无效
    if (p.x < plat.x || p.x > plat.x + plat.w) continue;

    // 落地：贴到平台顶
    p.y = plat.y - PLAYER_R;
    p.vx = 0;
    p.vy = 0;
    world.standingOn = i;
    world.state = 'idle';

    // 精准判定
    const center = plat.x + plat.w / 2;
    const dist = Math.abs(p.x - center);
    if (dist < PRECISION_R) {
      world.combo += 1;
      world.score += 1 + 2 * world.combo;          // 基础 1 + 精准奖励 2*combo
      world.lastEvent = 'precision';
    } else {
      world.combo = 0;
      world.score += 1;
      world.lastEvent = 'land';
    }
    return;
  }

  // 玩家完全越过最后一块平台 + 已经下落 → 坠亡（兜底，避免一直 jumping）
  const last = world.platforms[world.platforms.length - 1];
  if (p.x > last.x + last.w + PLAYER_R && p.y > GROUND_Y) {
    world.state = 'dead';
    world.lastEvent = 'miss';
  }
}
