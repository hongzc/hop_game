// 薄封装：所有埋点走这里，posthog 没初始化时静默 no-op
const ph = () => (typeof window !== 'undefined' ? window.posthog : null);

function ready() {
  const p = ph();
  return p && typeof p.capture === 'function' && p.__loaded;
}

export function identify(user) {
  const p = ph();
  if (!p || !user) return;
  p.identify(String(user.id), {
    username: user.username,
    first_name: user.first_name,
    language_code: user.language_code,
    is_premium: user.is_premium,
  });
}

export function track(event, props = {}) {
  const p = ph();
  if (!p) return;
  // posthog snippet 在 _i 队列里 buffer 调用，未 loaded 也能 capture
  try { p.capture(event, props); } catch {}
}

export function isReady() { return ready(); }
