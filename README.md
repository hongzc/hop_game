# Hop

TinyPaws Games 矩阵第三款。蓄力跳跃，落点精准奖励 + 连击。

## 玩法

- 长按屏幕蓄力（蓄力进度条在玩家头顶）
- 松手起跳，抛物线落到下一个平台
- 落在中心 8px 内 = 精准奖励 +2，连续精准触发连击
- 落空 = game over

## 部署

Vercel 静态托管，连 `main` 自动部署。无 build。

## 本地开发

```bash
cd ~/go/src/private/hop_game
python3 -m http.server 8003
# 浏览器开 localhost:8003
```

## 结构

- `src/shared/` —— 矩阵共享模块（telegram / i18n / audio / analytics / storage / confetti / result-modal），verbatim copy from suika，**禁止外部 import**
- `src/main.js` —— bootstrap + HUD + 游戏循环
- `src/game.js` —— 状态机 + 物理（抛物线 + 落点判定）+ 平台生成
- `src/render.js` —— canvas rAF 循环
- `src/strings.js` —— Hop 专属 i18n
