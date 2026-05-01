# shared/ — TinyPaws 矩阵公共模块

新游戏接入清单（开 Game #2 时直接照抄）：

## 1. 拷贝 `src/shared/` 整个目录到新游戏 repo

不依赖任何外部包，纯 ESM。

## 2. `index.html` 必带的三个 `<script>`（页面级、不进 shared）

```html
<script src="https://telegram.org/js/telegram-web-app.js"></script>
<script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.min.js"></script>
<!-- PostHog snippet：从 sheep_game/index.html 复制；POSTHOG_KEY 用同一个 -->
<script>
  /* ...posthog 初始化... */
  window.POSTHOG_KEY = 'phc_v7PhGTzf2JABFvox9P9gSCcngWZWknR8UG2pFkAPMDvV';
  posthog.init(window.POSTHOG_KEY, { api_host: 'https://us.i.posthog.com', ... });
</script>
```

## 3. CSS：在 `style.css` 顶部 `@import`

```css
@import "src/shared/base.css";
@import "src/shared/hud.css";
@import "src/shared/modal.css";
@import "src/shared/theme.css";
```

游戏自己的 board/玩法相关样式写在 `style.css` 剩余部分。

## 4. `main.js` 的标准开头

```js
import { tgReady, tgUser, tgPlatformInfo, haptic, openTelegramLink } from './shared/telegram.js';
import { registerStrings, t, getLocale, setLocale, nextLocale } from './shared/i18n.js';
import {
  isMuted, toggleMute, unlockAudio,
  sfxPick, sfxMatch, sfxWin, sfxLose, sfxItem,
} from './shared/audio.js';
import { identify, track } from './shared/analytics.js';
import { load, save } from './shared/storage.js';
import { fireWinConfetti, fireConfettiAt } from './shared/confetti.js';
import { showResultModal } from './shared/result-modal.js';
import { gameStrings } from './strings.js';

registerStrings(gameStrings);
tgReady();
const u = tgUser();
if (u) identify(u);
track('app_loaded', { has_telegram_user: !!u, ...tgPlatformInfo() });
window.addEventListener('pointerdown', unlockAudio, { once: true });
window.addEventListener('touchstart', unlockAudio, { once: true });
```

## 5. 契约 / 注意事项

- **必须先 `registerStrings()` 再 `t()`**——i18n 只内置矩阵通用文案（won_title/btn_next 等），游戏自己的字符串要先注入。
- **`tgReady()` 应在入口最早调一次**——展开 viewport，否则 TG 内显示会塞在小窗里。
- **storage key 必须自己起 game-specific 前缀**（如 `watermelon_save_v1`），不要复用 sheep 的。
  例外：`tinypaws_mute_v1` / `tinypaws_locale_v1` 是矩阵共享的，不要改。
- **`showResultModal({ followUrl: 'https://t.me/tinypaws_games', ... })`** —— 传 followUrl + onFollow handler 才会显示 Follow CTA。

## 6. 不在 shared 的东西

- 游戏循环（state 机/render/玩法逻辑）—— 写在游戏自己的 `src/`
- 游戏专属字典（关卡名、道具名、特定文案）—— 写在游戏自己的 `strings.js`
- 游戏专属 CSS（board / piece / 物理容器等）—— 写在游戏自己的 `style.css` 剩余部分
