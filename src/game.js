// Hop 物理 + 关卡状态机。
// 视口逻辑坐标 360 × 540（与 Suika 一致），相机沿 x 平移，y 固定。

export const WORLD_W = 360;
export const WORLD_H = 540;
export const GROUND_Y = 460;          // 平台顶面 y
export const PLAYER_R = 14;            // 玩家半径
export const GRAVITY = 1400;           // px / s^2
export const MAX_CHARGE_MS = 1100;     // 蓄力封顶
export const MIN_JUMP_VX = 120;
export const MAX_JUMP_VX = 520;
export const JUMP_VY = -560;           // 起跳竖直初速（蓄力满时）
export const MIN_JUMP_VY = -340;       // 蓄力为 0 时的最低跳

// D2 占位：导出空函数，D2 实施时填充。
export function createWorld() {
  return {
    player: { x: 80, y: GROUND_Y - PLAYER_R, vx: 0, vy: 0, onGround: true },
    platforms: [
      { x: 40, y: GROUND_Y, w: 100, h: 16 },
      { x: 200, y: GROUND_Y, w: 100, h: 16 },
    ],
    camera: { x: 0 },
    state: 'idle', // idle | charging | jumping | landed | dead
    chargeMs: 0,
    score: 0,
    combo: 0,
  };
}
