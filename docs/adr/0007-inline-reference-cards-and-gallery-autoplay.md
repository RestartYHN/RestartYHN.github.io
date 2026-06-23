# ADR 0007：行内引用卡片、外链新标签页与画廊自动播放（多条目合集）

- 状态：已采纳并验收（2026-06-24）
- 范围：新增 `::blog` / `::appreciation` 行内引用卡片、search-index 数据补全、Markdown 外链新标签页、画廊大图自动播放
- 相关代码：
  - 新建：`src/plugins/rehype-component-blog-card.mjs`、`src/plugins/rehype-component-appreciation-card.mjs`
  - 修改：`src/pages/search-index.json.ts`、`astro.config.mjs`、`src/styles/markdown.css`、`src/content/blog/guide/zh-cn.md`、`src/pages/[...locale]/appreciation/gallery/[author].astro`
  - 依赖：`rehype-external-links@3.0.0`

---

## 0007-1：文章引用卡片 — 复用已有指令模式 + search-index 为数据源

### 背景

博客文章间时常需要互相引用。纯 Markdown 链接只能覆盖当前页面，手动写 `<a target="_blank">` 繁琐；已有的 `::music{}`、`::github{}`、`::album{}` 指令模式已成熟，自然想到加 `::blog{slug="xxx"}` 和 `::appreciation{slug="xxx"}`。

### 决策

- 遵循现有 rehype 组件模式：构建时输出占位 `<a>` + 内联 `<script>`(IIFE)，客户端从 `/search-index.json` 读取目标文章数据并填充标题/日期/描述。
- 两个独立文件（`rehype-component-blog-card.mjs` / `rehype-component-appreciation-card.mjs`），共享同一套数据获取逻辑但 `type` 字段不同（`"post"` vs `"appreciation"`），解决 slugId 同名问题。
- 数据源复用已有 `search-index.json` 端点（被 Fuse.js 搜索和 AstrBot 插件共用），不新增 API。
- `search-index.json` 原先 `description` 和 `body` 混在 `content` 字段里——补上独立的 `description` 字段（取 frontmatter 原文）和 `date` 字段。
- 卡片样式居中（`margin: 1.2rem auto; max-width: 480px`），与前文音乐卡片等视觉一致，显示标题/日期·标签/描述（2 行截断），点击新标签页打开。

### 弯路

最初想做成一个 remark 插件在构建期直接查 `getCollection('blog')` 填入数据——但 `astro:content` API 在 remark/rehype 插件作用域内不可用。退回到客户端填充方案，与 music/github 卡片一致。

### 教训

已有模式是最高效的参照——`::music` 的占位→fetch→填充流水线可以直接套用到任何同类需求。search-index.json 作为内容公共接口承担搜索/卡片/外部集成三重职责，扩展字段时需同时考虑所有消费者。

---

## 0007-2：Markdown 外链新标签页 — 用成熟库，别手写 tree walk

### 背景

博客正文中的外部链接（如 `[链接](https://mp.weixin.qq.com/...)`)默认覆盖当前页，读者离开博客的体验不好。

### 弯路

先写了一个手动 rehype 插件 `rehypeLinkNewTab`，用 `unist-util-visit` 遍历 HAST 给所有 `<a>` 加 `target="_blank"`。构建直接崩（`Cannot use 'in' operator to search for 'children' in undefined`）——`unist-util-visit` v5 内部遍历部分内容文件（spec/memos）的 AST 时踩到 `undefined` 节点。

换成手动递归 `walk` 不崩了，但产物里链接依然不生效——说明插件实际没跑、或者跑了但被后续步骤覆盖。更关键的是：用户只需要外链新标签页，不是全站所有链接都改（内部 `/blog/xxx` 不该改）。方案本身就是过拟合。

### 决策

- 删除手写 rehype 插件，引入成熟库 `rehype-external-links`：
  ```js
  [rehypeExternalLinks, { target: '_blank', rel: ['nofollow', 'noopener', 'noreferrer'] }]
  ```
- 该库只匹配 `http://` / `https://` 开头的外链，内部相对路径和绝对路径不受影响。
- 与 Mizuki 模板同款方案，已在 Astro 5.13 下验证稳定。

### 教训

AST 遍历插件不是你手写的场景——成熟的 `unified` 生态有现成轮子。**先找现成库，不行再手写。** 手写的 tree walk 对边界节点（`undefined`/`null` children）不鲁棒是经典陷阱。另外先跟用户对齐需求范围——"全局新标签页" ≠ "外链新标签页"，后者才是真实意图。

---

## 0007-3：画廊大图自动播放——手动 DOM + requestAnimationFrame 进度环

### 背景

鉴赏画廊 `[author].astro` 的自定义大图预览支持前后翻页，但无自动播放。Mizuki 使用 Fancybox 内置 `Carousel.Autoplay`。

### 决策

- 在现有自定义预览中加播放/暂停按钮：48×48px，底部居中，毛玻璃背景。
- 进度环：SVG `<circle>` + `requestAnimationFrame`，3 秒从空到满，参考 FabMenu 回顶按钮的圆形进度条套路——`stroke-dasharray` 动态驱动。
- 图标：实心音乐播放器风格（▶ / ∥），不用最初的线条图标。
- 用户手动按左右箭头/键盘翻页时自动暂停。
- 切换图片时进度环重置。

### 弯路

最初版图标用了我自创的 SVG 圈线符号，风格与系统中音乐播放器图标不一致——用户反馈"丑"。换成了实心 play/pause 图标后通过。

第一版缺少进度环，用户反馈"进度不明显"，补上 `requestAnimationFrame` 进度环后体验完整。

### 教训

同系统中的图标/进度样式要保持一致性——参考已有组件（FabMenu 进度环、音乐播放器图标）比从头创造省心且视觉统一。

---

## 0007-4：本次改动的综合评估

| 维度 | 决策 |
|---|---|
| 不走"大重构" | 不拆组件、不改目录结构，纯加功能/加样式（与 ADR 0006-5 一致） |
| 新依赖 | `rehype-external-links` — 成熟库，Mizuki 同款 |
| 数据层改动 | search-index.json 扩字段，向下兼容（老消费者忽略新字段无影响） |
| 风险 | gallery autoplay 是纯客户端 JS，不触发构建；卡片数据源复用已有端点 |
