# ADR 0003：依赖选择与优化策略（多条目合集）

- 状态：已采纳并验收（2026-06-22）
- 范围：头像服务选型、死代码清理、个人博客场景下的硬编码策略、i18n 优先级、内容管理脚本、评论区 UI 重构
- 相关代码：
  - Worker `src/utils/getAvatar.ts`、`src/api/public/serveImage.ts`（已删除）、`src/index.ts`、`src/api/public/postComment.ts`（邮箱黑名单）、`src/utils/settings.ts`
  - Go `internal/pkg/utils/avatar.go`
  - Dashboard `src/views/SiteSettings.vue`
  - 前端 `src/components/comment/Comments.svelte`、`CommentItem.svelte`、`EmojiPicker.svelte`、`src/utils/markdown.ts`（新增）、`memos/MemoCard.svelte`
  - 脚本 `script/newgallery.js`、`newauthor.js`、`newsignature.js`（新增）
  - 配置 `src/config.ts`、`src/i18n/key.ts`、`src/i18n/language/{zh-cn,en}.ts`

---

## 0003-1：头像服务选型——源站优先，少用镜像

### 背景

`open.motues.top/avatar` 是一个几何随机头像生成器（类似 boringavatars），不代理 Gravatar。所有邮箱（包括已注册 Gravatar 的真实头像）均返回随机几何图案。

### 弯路

先换到国内镜像 `cravatar.cn`（`d=404` 返回 404），以为问题在墙。实际上该邮箱的 Gravatar 数据未在镜像同步。最后直连 `www.gravatar.com` 原站，`d=404` 返回正常头像。

### 决策

- **非 QQ 邮箱走 `www.gravatar.com` 原站**（`d=identicon` 兜底未注册的邮箱）
- QQ 邮箱走 `q1.qlogo.cn`（QQ 官方头像接口，不经过 Gravatar）
- 后续发现原站被墙，切换为 `gravatar.loli.net`（Loli 项目老牌镜像，已验证有该邮箱数据）
- `getCravatar()` 包裹 try-catch，头像服务挂了不阻塞评论加载
- 前端 `<img>` 添加 `on:error` 兜底至默认 favicon

**教训：源站是最好验证的。每一步都应该用 `?d=404` 在浏览器直接验证目标邮箱是否真实存在头像。**

---

## 0003-2：死代码清理——serveImage 端点

### 背景

`GET /api/img/:id` 端点注册在 Worker 路由中，但始终重定向至固定地址（忽略 `:id` 参数）。图片上传返回 R2 直链，前端直接用直链嵌入 Markdown，该端点从未被调用。

### 决策

- 删除 `worker/src/api/public/serveImage.ts`
- 删除 `index.ts` 中对应的 import 和路由
- 删除 CORS 中间件中特判 `/api/img/` 的逻辑

**教训：开发留下的未完成端点容易被遗忘。上传链路走通后应立即核实所有中间路径是否仍有引用。**

---

## 0003-3：个人博客场景下的"硬编码"重新评估

### 背景

代码审查标注了多处"应改为可配置"的硬编码：`MemoCard` API 地址、QQ Bot 通知 URL、图片 R2 域名。但这些值在当前场景下全指向同一个 Worker 域名，且用户已确认这是纯个人博客，无"让别人部署"的需求。

### 决策

- **MemoCard API 地址**：改为读 `siteConfig.comments.backendUrl`，与其他评论组件统一（未来换域名只改一处）
- **QQ Bot 通知 URL / user_id**：保留硬编码。属个人 NapCat 部署，抽象成配置项对个人无收益
- **图片 R2 域名**：保留硬编码。R2 自定义域名几乎不会变

**教训：不是所有硬编码都需要改。先问"这个值在用户场景下会变吗"，再决定是否抽象。通用项目视角下的"问题"在个人项目可能是"最简实现"。**

---

## 0003-4：i18n 优先级——交互控件 > 静态文案

### 背景

前端存在两类未翻译内容：(1) 评论区按钮、placeholder、tooltip（交互控件）；(2) 页面标题、描述、导航文字（静态文案）。

### 决策

- **交互控件全部走 i18n**（`t()` 函数）：回复/点赞/表情/预览/图片/排序按钮、展开/收起、表情 Tab、Q&A 加载文字。浏览器翻译无法识别按钮文字、tooltip。
- **静态页面文案保留三元表达式**（`isEn ? 'EN' : '中文'`）：浏览器右键翻译覆盖效果足够，逐个迁移到 i18n 性价比低。

新增 i18n key：`comments.{sortByTime,sortByLikes,showMoreReplies,collapseReplies,image,uploadingImage,emoji}`、`emoji.{close,default,bilibili,kaomoji,emoji}`、`qa.{loading,total}`。

**教训：i18n 的成本要和收益匹配。交互控件（用户要点的）必须做，静态大段文案交给浏览器。**

---

## 0003-5：内容管理辅助脚本

### 背景

画廊图片、画师注册、首页旋转签名三个内容模块，每次添加都需要手动编辑 JSON 或 TypeScript 文件，复制粘贴样板代码，中英文双写容易索引错位。

### 决策

三个纯位置参数脚本，只输核心内容：

```bash
pnpm newauthor  slug  "中文名"  "English"  "头像URL"  "中文简介"  "English desc"
pnpm newgallery "图片URL" 画师slug  "中文标题"  "Title"  年份  "IP:xxx"
pnpm newsignature "中文句" "——出处" "English" "-- Credit"
```

- 脚本自动补全 `id`、`order`、`enabled`、`thumb`(=image)、画师标签等样板字段
- `newgallery` 自动根据 `author` slug 查找画师名称并追加 `画师:xxx` 标签
- `newsignature` 同时追加中英文文件，保证 `rotatingSubTitle` 和 `rotatingPair` 数组索引对齐
- 支持 `&&` 串联批量运行

**教训：面向自己的工具也应该投入——少写重复代码，少犯对齐错误。**

---

## 0003-6：评论区操作按钮两行布局

### 背景

原有评论操作栏一行塞入"回复"、"点赞"、"😊"表情触发器 + 10 种已有反应按钮。当一条评论有 5-6 种反应时，操作栏溢出换行混乱。

### 决策

拆为两行：
- **第一行**：`[回复] [♡ N] [😊]` — 主操作
- **第二行**：`[❤️ N] [😂 N] ...` — 反应计数徽章（仅当有反应时显示）

不做两行之外的独立"反应面板"——反应徽章就是原有点击按钮，只是位置挪到第二行。

**教训：UI 改动时区分"新增元素"和"重排已有元素"。用户抵触的是前者，后者是纯优化。**

---

## 0003-7：Markdown 实时预览

### 背景

评论区和回复表单只有纯文本 textarea，用户看不到渲染效果。原上游项目已有预览切换，fork 在此功能上落后。

### 决策

- 引入 `marked`（GFM + breaks）做客户端 Markdown 解析（`src/utils/markdown.ts`）
- 主评论表单和回复表单各加 `[撰写|预览]` 切换按钮
- 预览区复用评论区 Markdown 样式（链接色、代码块、引用线）
- 放弃复杂 Markdown 工具栏（粗体/斜体按钮），仅保留写/预览切换

**教训：二八原则——20% 的代码实现 80% 的体验提升（切换按钮 vs 完整富文本工具栏）。**
