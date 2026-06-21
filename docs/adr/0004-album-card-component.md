# ADR 0004：专辑卡片组件（`::album`）设计与落地

- 状态：已采纳并验收（2026-06-22）
- 范围：新增 Markdown 扩展组件 `::album{id="xxx"}`，展示专辑封面/名称/歌手/发行日期/曲目数，点击加载全专曲目到全局播放器
- 相关代码：
  - 前端 `src/plugins/rehype-component-album-card.mjs`（新建）
  - 前端 `astro.config.mjs`（注册组件）
  - 前端 `src/styles/markdown.css`（`.card-album` 样式）
  - 前端 `CONFIG.md`、`src/content/blog/guide/zh-cn.md`（文档）
  - 后端 `nodejs/src/api/music/qr-check.ts`（补 `artist`/`size`/`publishTime` 字段）

## 背景

已有两类行内卡片——`::music`（单曲，插队到播放队列）和 `::github`（仓库信息）。缺少专辑维度的卡片。用户需要将网易云任意专辑嵌入博客，展示元数据并一键播放整张专辑。

## 决策

### 组件模式：复用 `rehype-components` 插件体系

仿 `rehype-component-music-card.mjs` 的结构：
- `h()` 构建 hast AST 节点
- 内联 `<script>` 处理客户端 API 调用
- `fetch-waiting` / `fetch-error` CSS 类管理加载态
- `Math.random().toString(36).slice(-6)` 生成唯一 ID 防多卡冲突
- `astro:page-load` 事件支持 SPA 导航

### 播放行为：覆盖而非插入

- 单曲卡（`::music`）：`splice` 插入当前曲之后 → "加歌到队列"
- 专辑卡（`::album`）：`syncState({ tracks, currentIndex: 0 })` → "播放整张专辑"

理由：专辑是完整作品，不是播放列表项。与音乐页 `loadAlbums()` 行为一致。

### 不内嵌播放按钮

全局播放器（`GlobalMusicPlayer.astro`）已提供完整的播放/切歌/进度/列表 UI。专辑卡不重复造按钮，点击卡片直接触发加载→覆盖队列→播放。

### 数据源：后端代理，非浏览器直连

**最终方案：** 前端 → `apiBase + '/api/music/album?id=xxx'` → 后端 `getAlbum` → NetEase `/album` API → 返回含完整元数据的 JSON。

后端的 `data` 返回体：
```json
{
  "name": "安泊猜想",
  "artist": "许嵩",
  "cover": "https://...",
  "size": 9,
  "publishTime": 1781539200000,
  "tracks": [{ "id": "...", "title": "...", "artist": "...", "cover": "..." }]
}
```

## 走过的弯路

### 弯路一：尝试浏览器直连 NetEase API

最初用 `fetch('https://music.163.com/api/album/xxx')` 直接拿数据。PowerShell 测试通过，但浏览器部署后**一直卡在 waiting 状态**。

根因：`music.163.com/api/album` **没有 CORS 头**（`Access-Control-Allow-Origin`），浏览器拦截跨域请求。PowerShell/curl 不执行 CORS 策略，所以看起来"能用"。

教训：**本地工具能通的 API ≠ 浏览器能通**。CORS 是浏览器独有的安全机制，测试必须用浏览器实际环境。

### 弯路二：数据源选型错误——代理裁掉了元数据

切回代理 `apiBase + '/api/music/album?id=xxx'` 后，卡片显示"未知艺术家 0首"。

后端旧代码只返回了 `name`、`cover`、`tracks` 三个字段：
```ts
// 旧
data: { name: album.name || "", cover: album.picUrl || "", tracks }
```

NetEase 原始返回里 `album.artist.name`、`album.size`、`album.publishTime` 都有，但后端没映射到响应体里。

教训：**做新组件前先看后端返回了什么、没返回什么**。dump 一次接口原始响应能省掉多轮猜测。

### 弯路三：改了源文件但 pm2 跑的是编译产物

本地改好 `qr-check.ts` → push → 服务器 `git pull` → `pm2 restart` → **还是旧返回**。

最终发现 pm2 的 `script path` 是 `dist/app.js`，`npm run build` 后才把 `.ts` 编译成 `.js`。只改源码不编译，重启一万次也没用。

```bash
# 正确的更新流程
cd /home/ubuntu/momo/backend && npm run build && pm2 restart momo-backend
```

教训：**TypeScript 项目的部署必须包含编译步骤**。`pm2 show <app>` 先看 `script path` 确认跑的是 `.ts` 还是 `.js`。

### 弯路四：视频文件未推送

本地改完代码后运行 `git push` 正常通过，但实际生效的文件只有前端仓库。后端仓库在同一台机器上的不同目录，**改完后忘记提交和推送**。

教训：**多仓库项目改完后逐个 `git status` 确认无遗漏**。

## 后果

- 优点：专辑卡与音乐卡/GitHub 卡共享同一套插件—注册—CSS 体系，新增成本低；语义清晰（覆盖 vs 插入）；数据走代理不受 CORS 限制
- 取舍：后端多了一个接口字段兼容需求（`artist`/`size`/`publishTime`），但不影响现有音乐页功能
- 已知限制：专辑未在用户收藏列表时无影响（走 `/album` 接口而非 `/album/sublist`），但需要 `NETEASE_MUSIC_COOKIE` 已配置
