import { WORLD_W, WORLD_H, GROUND_Y, PLAYER_R } from './game.js';

// rAF 循环占位。D1 只画静态平台 + 玩家圆 + "ready" 文案，验证画布起作用。
export function startRender(canvas, world, getCharge) {
  const ctx = canvas.getContext('2d');
  let dpr = Math.min(window.devicePixelRatio || 1, 2);

  function resize() {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
  }
  resize();
  window.addEventListener('resize', resize);

  function draw() {
    const w = canvas.width;
    const h = canvas.height;
    const sx = w / WORLD_W;            // 缩放比
    ctx.clearRect(0, 0, w, h);

    // 平台
    for (const p of world.platforms) {
      const x = (p.x - world.camera.x) * sx;
      const y = p.y * sx;
      ctx.fillStyle = '#0c4a6e';
      ctx.fillRect(x, y, p.w * sx, p.h * sx);
      // 顶面高光
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.fillRect(x, y, p.w * sx, 2);
    }

    // 玩家（橙色 paw blob，TinyPaws 品牌色）
    const px = (world.player.x - world.camera.x) * sx;
    const py = world.player.y * sx;
    ctx.beginPath();
    ctx.fillStyle = '#fb923c';
    ctx.arc(px, py, PLAYER_R * sx, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#9a3412';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 蓄力进度条（在玩家头顶）
    const charge = getCharge();
    if (charge > 0) {
      const barW = 36 * sx;
      const barH = 6 * sx;
      const bx = px - barW / 2;
      const by = py - PLAYER_R * sx - 14 * sx;
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.fillRect(bx, by, barW, barH);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(bx, by, barW * Math.min(1, charge), barH);
    }

    requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);
}
