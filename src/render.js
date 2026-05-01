import { WORLD_W, WORLD_H, GROUND_Y, PLAYER_R, chargeRatio } from './game.js';

// rAF 渲染 + 物理推进。
// 主循环把 dt 传给 step()，渲染只负责画。
export function startRender(canvas, world, stepWorld) {
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

  let lastTs = 0;
  function loop(ts) {
    if (!lastTs) lastTs = ts;
    const dt = Math.min(0.05, (ts - lastTs) / 1000);  // 限 50ms（防长帧穿透）
    lastTs = ts;
    stepWorld(dt);
    draw(ts);
    requestAnimationFrame(loop);
  }

  function draw(now) {
    const w = canvas.width;
    const h = canvas.height;
    const sx = w / WORLD_W;
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
      // 中心标记（精准目标提示）
      const cx = x + (p.w * sx) / 2;
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fillRect(cx - 1, y, 2, 4);
    }

    // 玩家
    const px = (world.player.x - world.camera.x) * sx;
    const py = world.player.y * sx;
    const r = PLAYER_R * sx;
    // 精准着陆闪光（外发光）
    if (world.flashMs > 0) {
      const a = world.flashMs / 220;
      ctx.beginPath();
      ctx.fillStyle = `rgba(245, 158, 11, ${0.5 * a})`;
      ctx.arc(px, py, r * (1 + 0.6 * a), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.beginPath();
    ctx.fillStyle = '#fb923c';
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#9a3412';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 蓄力时玩家被压扁的视觉
    const charge = chargeRatio(world, now);
    if (charge > 0) {
      ctx.beginPath();
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.ellipse(px, py + r * 0.6, r * (1 + charge * 0.3), r * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // 蓄力进度条（玩家头顶）
    if (charge > 0) {
      const barW = 36 * sx;
      const barH = 6 * sx;
      const bx = px - barW / 2;
      const by = py - r - 14 * sx;
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.fillRect(bx, by, barW, barH);
      const grad = ctx.createLinearGradient(bx, 0, bx + barW, 0);
      grad.addColorStop(0, '#38bdf8');
      grad.addColorStop(1, '#f59e0b');
      ctx.fillStyle = grad;
      ctx.fillRect(bx, by, barW * Math.min(1, charge), barH);
    }

    // 浮动得分提示
    for (const pop of world.popups) {
      const t = pop.ageMs / pop.lifeMs;        // 0..1
      const alpha = 1 - t;
      const drift = -28 * t;                   // 向上漂
      const popX = (pop.x - world.camera.x) * sx;
      const popY = (pop.y + drift) * sx;
      ctx.font = `bold ${15 * sx}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillStyle = pop.color;
      ctx.globalAlpha = alpha;
      ctx.fillText(pop.text, popX, popY);
      ctx.globalAlpha = 1;
    }

    // dead 时画面轻微暗化（result-modal 是 DOM overlay，叠在 canvas 之上）
    if (world.state === 'dead') {
      ctx.fillStyle = 'rgba(0, 30, 60, 0.25)';
      ctx.fillRect(0, 0, w, h);
    }
  }

  requestAnimationFrame(loop);
}
