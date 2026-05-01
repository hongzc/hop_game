// Telegram WebApp 桥接。在非 TG 环境下所有函数 no-op。
export const tg = window.Telegram?.WebApp || null;

export function tgReady() {
  if (!tg) return;
  tg.ready();
  tg.expand();
}

export function tgUser() {
  return tg?.initDataUnsafe?.user || null;
}

export function tgPlatformInfo() {
  return {
    platform: tg?.platform || 'web',
    color_scheme: tg?.colorScheme || 'unknown',
  };
}

export function haptic(kind) {
  if (!tg?.HapticFeedback) return;
  if (kind === 'pick') tg.HapticFeedback.selectionChanged();
  else if (kind === 'match') tg.HapticFeedback.impactOccurred('medium');
  else if (kind === 'win') tg.HapticFeedback.notificationOccurred('success');
  else if (kind === 'lose') tg.HapticFeedback.notificationOccurred('error');
}

// 在 TG 内调原生分享，否则浏览器新开标签
export function openTelegramLink(url) {
  if (tg?.openTelegramLink) tg.openTelegramLink(url);
  else window.open(url, '_blank');
}
