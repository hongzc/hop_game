// canvas-confetti 包装。需要 index.html 里加载 cdn.jsdelivr.net/npm/canvas-confetti。
// 没加载则全部 no-op。
export function fireConfettiAt(el) {
  if (!window.confetti || !el) return;
  const r = el.getBoundingClientRect();
  const x = (r.left + r.width / 2) / window.innerWidth;
  const y = (r.top + r.height / 2) / window.innerHeight;
  window.confetti({
    particleCount: 60,
    spread: 70,
    startVelocity: 35,
    origin: { x, y },
    scalar: 0.8,
    ticks: 120,
  });
}

export function fireWinConfetti() {
  if (!window.confetti) return;
  window.confetti({ particleCount: 160, spread: 100, origin: { y: 0.6 } });
}
