# ADR 0008：音乐页彻底重做（薄代理 + 单一真源播放器）

- 状态：已采纳，实施中（2026-09-10）
- 范围：音乐播放器的前端重写与音乐后端收敛。**不改变音频 CDN 直连的既有决策**（见 ADR 0001）。
- 相关代码：
  - 前端 `src/pages/[...locale]/music.astro`、`src/components/misc/GlobalMusicPlayer.astro`、`src/components/misc/MusicStatsCard.astro`、`src/plugins/rehype-component-music-card.mjs`、`src/data/music.ts`
  - 后端 `Momo-Backend/nodejs/src/api/music/*`、`middleware/routes.ts`
  - 部署：`/home/ubuntu/momo/backend`（pm2 `momo-backend`，17171）、`/home/ubuntu/momo/ncm-api`（pm2 `ncm-api` = NeteaseCloudMusicAPI Enhanced v4.31.0，3200）、nginx 站点 `momo-api`

## 背景

ADR 0001 解决了“音频不能过服务器”的核心问题（3Mbps 公网带宽），但落地方式留下了两类债务：

1. **前端两套播放引擎**：`music.astro`（3105 行）与 `GlobalMusicPlayer.astro`（1246 行）各存一份 `loadTrack/hydrate/getNextIndex/自愈/看门狗/播放键状态`，靠 `syncToGlobalPlayer/bootstrap` 手工同步。ADR 0001 已承认这是技术债（P4 未做）。
2. **后端冗余与死代码**：`qr-check.ts`（776 行）实现了一套“返回 id 数组再由前端逐首 `/track`”的 N+1 取歌方式；`qr-generate.ts` 与 `checkQrStatus` 的 QR 登录**从未挂路由、前端也无 UI**；`sessionStore` 的 QR/token 会话只服务这条死路径。

### 部署拓扑（2026-09-10 实测）

```
博客 https://restartyhn.top  (GitHub Pages 静态站, CNAME)
   │ HTTPS / CORS ALLOW_ORIGIN=restartyhn.top
   ▼
https://api.restartyhn.top   (nginx + certbot)
   location /  → proxy_pass http://127.0.0.1:17171   # momo-backend
   │
   ├── momo-backend  NETEASE_API_BASE=http://127.0.0.1:3200
   ├── ncm-api (Enhanced)  127.0.0.1:3200
   └── 音频：浏览器 ← NetEase CDN https 直链（不过服务器）
```

服务器规格：腾讯云轻量 2 vCPU / 1.9G 内存 / 2G swap / 40G 盘 / 公网 3Mbps（与 napcat/astrbot 共享）。

### 已发现的漂移

线上 `momo-backend` 运行的是**旧构建**（仍带 `favoriteSongs`、`limit=100000`、未过滤 `specialType=5`），而两个仓库已于 2026-08-19 提交了对应简化，**但未部署到服务器**：

- 前端 `a747692 drop unused favoriteSongs field` / `19aaf56 hide liked songs playlist` / `7783a66 cap playlistSongLimit to 200`
- 后端 `81e700a drop /likelist + favoriteSongs` / `653d34f filter specialType=5` / `2bf4fb9 fetch at most 200 songs`

→ 结论：**仓库领先于服务器**，“同步”方向是**重新部署**，而非把旧服务器代码覆盖回仓库。线上旧版已归档至 `_prod-baseline/2026-09-10/` 作回滚点。

## 约束

1. 音频**绝不**经服务器（3Mbps，ADR 0001）。服务器只回小 JSON、现取 https 直链。
2. **零腾讯云/nginx 改动**：继续走 `https://api.restartyhn.top` → `17171` 的现有 `location /`，接口路径保持 `/api/music/*`。
3. Enhanced API 只监听 `127.0.0.1:3200`，**不向公网暴露**（避免被刷成免费代理）。
4. 机器内存吃紧（available ≈800M，swap 已用 ≈850M），优先删代码而非加服务。

## 决策

### D1｜保留薄后端，不浏览器直连 Enhanced

复用现有 nginx `location /`，`momo-backend` 收敛为**薄代理**（透传 + 短缓存），前端 `PUBLIC_MUSIC_API` 不变。这样零路由改动；若改为浏览器直连（加 `location /ncm/ → 127.0.0.1:3200`）虽只需改 5 行 nginx，但会把 Enhanced API 公开，否决。

### D2｜消灭 N+1：一次拉全歌单元数据

`playlist` 改为**一次** `/playlist/track/all` 返回完整元数据（`title/artist/cover`，上限 500），音频直链在**播放时**按需现取。删除“返回 id 数组 + 前端逐首 `/track`”的旧路径。

### D3｜前端单一真源（Svelte）

用项目已有的 Svelte 建立**单一状态源**（持有唯一 `<audio>`），`MiniPlayer.svelte` 常驻布局、`MusicPage.svelte` 仅作视图。删除 window 全局 `__globalMusicBootstrapV1` 与 `astro:page-load/after-swap` 重初始化补丁，删除两份重复引擎。

### D4｜防过期机制收敛为一种

只保留 `onError` 自愈（现取新链 + 复位进度 + 续播）。删除 localStorage `music-track-cache-v3` 与 8s stalled 看门狗——三套机制解决同一个问题属过度设计。

### D5｜功能面板：全保留，歌单精简

保留 歌单 / 搜索 / 歌词 / 播客 / 收藏专辑 / 最近播放 / 听歌统计（UI 观感后续再调）。**歌单精简：不再显示“我喜欢的音乐”**（后端已按 `specialType=5` 过滤；前端不再消费 `favoriteSongs`）。

### D6｜删除死代码

删除 `qr-generate.ts`、`qr-check.ts#checkQrStatus`、`sessionStore` 的 QR 会话、前端 `worker/music-proxy.js`（P2 随 direct 模式一并移除）。私有歌单/我喜欢改用服务器 `.env` 的 `NETEASE_MUSIC_COOKIE`，**不做 QR 登录、不做前端登录 UI**。

## 分批实施

| 阶段 | 内容 | 风险 | 腾讯云改动 |
|---|---|---|---|
| P0 | ADR + 归档线上基线 + 删死代码（QR/session/worker） | 极低 | 无 |
| P1 | 后端薄代理：`playlist` 一次拉全、`track` 元数据缓存 + 现取直链、删 N+1 | 低 | 无 |
| P2 | 前端 Svelte 单一真源，替换两套引擎，自愈收敛 | 中 | 无 |
| P3 | UI 观感调整（面板布局） | 低 | 无 |

验收：前端 `pnpm build` + `pnpm lint`（biome）；后端 `tsc` build + `pm2 restart momo-backend`；前端音质/直连逻辑不变。

回滚：前端 `git revert` 后重跑 GitHub Action；后端 `git revert` + `pm2 restart momo-backend`；线上旧版源码见 `_prod-baseline/2026-09-10/`。

## 后果

- 优点：双通道双引擎收敛为单路单源，N+1 消失，死代码清除；完全契合 3Mbps/小内存与个人博客成本约束。
- 取舍：放弃 QR 登录与地区解锁鲁棒性（本场景不需要）；`onError` 自愈保留（链接约 20 分钟过期）。
- 待办：P0 完成后，仓库 2026-08-19 的前后端简化提交仍需**重新部署**到服务器才生效。

## 运维事故与部署注意（2026-09-10）

### 1. 后端构建必须先 `prisma generate` 再 `tsc`

服务器 `/home/ubuntu/momo/backend` 原本只有 `dist/`（无 `src/`），`dist` 是在别处构建后上传的。本次改为**服务器现场构建**，`dist/`、`src/generated/prisma` 均被 `.gitignore` 忽略。正确顺序：

```bash
npx prisma generate && npx tsc -p tsconfig.json && pm2 restart momo-backend
```

先 `tsc` 会因缺 Prisma Client 报 13 个 `TS7006/TS2307`（连锁误报）。已记入 `Momo-Backend/doc/update.md`。

### 2. `api.restartyhn.top` 证书过期 → 改用 Cloudflare DNS-01

- 现象：音乐页全部接口 `ERR_CONNECTION_CLOSED` / `ERR_CERT_DATE_INVALID`。
- 根因一：Let's Encrypt 证书 2026-09-08 过期；`certbot.timer` 虽 active 但 `Trigger: n/a`，约 3 个月未真正触发续签。
- 根因二：`certbot renew` 的 HTTP-01 校验被腾讯“未备案拦截”页挡下（`https://dnspod.qcloud.com/static/webblock.html`，anycast IP `43.174.224.202` / `43.174.225.201`），**该域名的 80 端口在本机外不可用**；443 正常。
- 决策：NS 在 Cloudflare，改用 **DNS-01**：

```bash
sudo apt-get install -y python3-certbot-dns-cloudflare
# /etc/letsencrypt/cloudflare.ini: dns_cloudflare_api_token = <Edit zone DNS token>
sudo certbot certonly --dns-cloudflare \
  --dns-cloudflare-credentials /etc/letsencrypt/cloudflare.ini \
  -d api.restartyhn.top --cert-name api.restartyhn.top --preferred-challenges dns
sudo systemctl reload nginx
```

- 教训：`certbot.timer` “active” 不等于会触发；应定期 `certbot renew --dry-run` 验证。国内机器 80 被拦截时优先 DNS-01。
