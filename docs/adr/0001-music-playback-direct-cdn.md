# ADR 0001：音乐播放采用 CDN 直连而非服务器代理

- 状态：已采纳并验收（2026-06-21）
- 范围：本 ADR 是整条「音乐播放器修复与优化」的单一记录——既含核心架构决策，也含随之落地的全部修复/功能与基础设施改动。
- 相关代码：
  - 后端 `Momo-Backend/nodejs/src/api/music/qr-check.ts`（元数据缓存 + 每次现取 https 直链）、`middleware/routes.ts`（已删除 `stream.ts` 及 `/api/music/stream` 路由）
  - 前端 `src/pages/[...locale]/music.astro`、`src/components/misc/GlobalMusicPlayer.astro`、`src/components/misc/MusicStatsCard.astro`、`src/plugins/rehype-component-music-card.mjs`、`src/data/music.ts`
  - 配置：nginx 站点 `momo-api`、服务器 `.env`（`NETEASE_REAL_IP`）

## 背景与问题

音乐播放器报 `Audio error: 4 / no supported source`，控制台大量 `403`。
根因是**网易云的 mp3 是带时效签名的链接**（URL 路径里含过期时间戳，约 20 分钟失效），而旧实现：

1. 把解析出的 URL 缓存了 10 分钟，`<audio>` 一直拿着过期链接；
2. `onError` 只打日志、不恢复 → **过期即永久卡死**。

> 关键事实：网易云这个 mp3 链接**不绑请求 IP**。实测从服务器用另一个 IP 也能 93MB/s 拉到，说明只受"时间"限制，不受"谁来取"限制。

## 走过的弯路（务必记住）

一开始基于"链接绑 IP、浏览器直连会 403"的**错误假设**，做了一套**后端流式代理**（浏览器 → 后端 → 网易云 CDN）。结果：

- 本机服务器是**腾讯云轻量、公网带宽 3Mbps**（还和 napcat/astrbot 共享）。
- 代理把所有音频流塞进这条 3Mbps 小管子 → 实测被压到 **~360KB/s（≈2.88Mbps）**，起播慢、并发即卡。内网直连后端却有 18MB/s，CDN 直连 93MB/s —— **瓶颈就是这条 3Mbps 公网带宽，软件改不动**。
- 代理还自带坑：未捕获的流错误（客户端中断、缺失 `public/index.html` 的兜底路由）让进程反复崩溃。

教训：

1. **先用最小改动验证假设**（前端自愈），别先动架构。
2. **平台配额（带宽上限）要早查**——它不报错，只会默默限速，最容易被忽略。
3. **诊断靠数据**：内网 vs 公网 vs 直连 CDN 三段测速、`pm2 ↺`、`getState()` 这些把猜测一一证伪，才逼出真因。

## 决策

**音频走 CDN 直连，不经过本服务器。**

- 浏览器直接播放网易云 CDN 的 **https** 链接（93MB/s，**不消耗服务器带宽、无流量费**，听众再多也不压本机）。
- 后端只负责**小 JSON**：返回元数据 + **每次现取**一条 https 直链（**不缓存 URL**，只缓存稳定的元数据/歌词）。
- 前端用 `onError` **自愈**：链接过期报错时，清缓存 → 重新取一条新链 → 从当前进度续播；每次错误最多重试 3 次，成功续播（`playing` 事件）后重置预算。
- 前端缓存键升到 `music-track-cache-v3`、TTL 缩到 3 分钟，避免命中旧死链。

## 随之落地的完整范围（验收清单，全部已上线并实测）

**播放稳定性**
- 过期自愈（`onError` 重取新链、复位进度、续播 + 重试预算）—— 音乐页 + 底部条两个播放器
- 进程崩溃修复：删除未兜底流（代理 / 缺失 `index.html`），不再崩溃重启
- init 请求一次性自动重试（瞬时 `ERR_CONNECTION_CLOSED` 自恢复）
- GlobalPlayer `playCurrent` token 守卫：修快速连点 `play() interrupted by load`
- 修复 `musicBind` 早退 bug（`btnPrev/btnNext` 从未赋值）→ 恢复音乐页 上下一首/进度/图标同步/自愈/歌词

**播放体验 / 功能**
- 单曲循环：手动切歌前进、自然播完重复本首（两播放器）
- 随机模式：**前后游走的历史窗口**（back/forward 游标，窗口 4 = 当前+3；退到底停住；切模式/换曲集/越界跳转自动重置）—— 两播放器对齐
- 加歌：**插当前曲之后 + 跳过去并立即播放该曲**（已存在则直接跳到它）、去重，覆盖**三个入口**（音乐页搜索、首页 `MusicStatsCard` 卡片、`::music` 博客卡片）；专辑卡片保持"播放整张"语义。随机模式下随之以该曲为新起点重置历史窗口（即"加完即播"，符合主流）
- 播客：懒加载（修间歇加载失败 + 提速）+ 描述恢复显示
- 删除冗余的封面卡片播放键，统一由底部条控制

**基础设施**
- nginx：还原代理时代残留指令（`proxy_buffering off` / `proxy_http_version 1.1` / `Connection ""`），去掉到 node 的 keep-alive 竞态隐患
- 服务器加 2G swap（1.9G 内存 + 0 swap → 防 OOM 秒杀 momo-backend/ncm-api）

> 架构提醒：本项目有**两个独立播放器**——音乐页（`music.astro`，仅 `/music`）与全局底部条（`GlobalMusicPlayer.astro`，跨页常驻），各自有 `<audio>` 和状态，靠 `syncToGlobalPlayer/bootstrap` 同步 `tracks`。任何播放相关改动都要**两边对齐**，这是本次大量 bug 的来源。

## 后果

- 优点：起播秒开、切歌跟手；服务器零音频带宽开销，**契合个人博客低成本约束**；过期由自愈无感兜住。
- 取舍：CDN 直链会暴露给浏览器（已强制 https）；放弃了代理才有的"地区解锁"鲁棒性（本场景不需要）。
- 流式代理（`stream.ts` + `/api/music/stream` 路由）已删除。若将来升级带宽或改流量计费，可从 git 历史复活。

## 已知盲点 / 已接受不做

- **stalled 而非 error**：真实过期若表现为卡住而非 `error` 事件，`onError` 不触发、自愈不启动。当前实测会报 error；若日后遇到纯 stalled 卡死，需补"卡顿看门狗"（播放中无进度超过数秒则重取续播）。
- **music 页极限快速连点**：底部条已有 `playToken` 守卫；音乐页未补同款。实测一次切 4-5 首无碍，极限连点视为可接受边角，**不做**。
