// 通用结果弹窗。文案 key 从 shared/i18n.js 拿（won_title/lost_title/btn_*）。
// 游戏可传 primaryStat（如 "用时 12.3s"、"得分 1200"）和 loseSub（失败副标题）覆盖默认。
import { t } from './i18n.js';

export function showResultModal(opts, handlers = {}) {
  const {
    won,
    hasNext = false,
    primaryStat = null,
    loseSub = null,
    winEmoji = '🎉',
    loseEmoji = '😿',
    followUrl = null,
  } = opts;

  const root = document.getElementById('app');
  if (!root) return;

  const overlay = el('div', 'modal-overlay');
  const modal = el('div', 'modal');
  modal.append(el('div', 'modal-emoji', won ? winEmoji : loseEmoji));
  modal.append(el('div', 'modal-title', won ? t('won_title') : t('lost_title')));

  if (won && primaryStat) {
    modal.append(el('div', 'modal-sub', primaryStat));
  } else if (!won && loseSub) {
    modal.append(el('div', 'modal-sub', loseSub));
  }

  const actions = el('div', 'modal-actions');
  if (won && hasNext && handlers.onNext) {
    const next = el('button', 'btn primary', t('btn_next'));
    next.addEventListener('click', handlers.onNext);
    actions.append(next);
  }
  if (handlers.onRetry) {
    const retry = el(
      'button',
      'btn' + (won ? '' : ' primary'),
      won ? t('btn_play_again') : t('btn_retry'),
    );
    retry.addEventListener('click', handlers.onRetry);
    actions.append(retry);
  }
  if (won && followUrl && handlers.onFollow) {
    const follow = el('button', 'btn follow', t('btn_follow'));
    follow.addEventListener('click', handlers.onFollow);
    actions.append(follow);
  }
  if (!won && handlers.onHome) {
    const home = el('button', 'btn', t('btn_home'));
    home.addEventListener('click', handlers.onHome);
    actions.append(home);
  }
  modal.append(actions);
  overlay.append(modal);
  root.append(overlay);
}

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}
