# ADR 0007：行内引用卡片、外链新标签页与画廊自动播放（多条目合集）

- 状态：已采纳并验收（2026-06-24）
- 范围：新增 `::blog` / `::appreciation` 行内引用卡片、search-index 数据补全、Markdown 外链新标签页、画廊大图自动播放、首页随机鉴赏卡片、`^text{color}^` 颜色高亮语法、评论预览扩展语法、音乐/专辑卡片半透明、播放器 insertNext UI 刷新
- 相关代码：
  - 新建：`src/plugins/rehype-component-blog-card.mjs`、`src/plugins/rehype-component-appreciation-card.mjs`
  - 修改：`src/pages/search-index.json.ts`、`astro.config.mjs`、`src/styles/markdown.css`、`src/content/blog/guide/zh-cn.md`、`src/pages/[...locale]/appreciation/gallery/[author].astro`、`src/pages/[...locale]/[...page].astro`、`src/plugins/remark-combined.mjs`、`src/utils/markdown.ts`、`src/components/comment/CommentItem.svelte`、`src/components/comment/QAList.svelte`、`src/components/misc/GlobalMusicPlayer.astro`、`src/layouts/Layout.astro`
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

---

## 0007-5：首页随机鉴赏卡片 — 客户端随机 + 换一篇按钮

### 背景

首页「最新博客」下方加一张随机鉴赏文章卡片，引导读者进入鉴赏内容。最初用服务端 `Math.random()` 在构建时取一篇——每次构建固定为同一篇，且不同访客看到的都一样。

### 弯路

尝试通过 `<script>` 注入 JSON 数据时连续踩坑：
- 非 `is:inline` 的 `<script>` 中 `{JSON.stringify(appData)}` 被 Vite 当作 ESM 打包，编译不过
- `<script type="application/json">` 标签中 `{...}` Astro 表达式在特定上下文不生效
- 数据写进 `data-*` 属性后用 `JSON.parse` 才稳定——HTML 属性中的 Astro 表达式是铁定的

### 决策

- 数据通过 `data-appreciation={JSON.stringify(appData)}` 挂在 section 元素上
- 客户端 `DOMContentLoaded` 时随机取一篇，点击「换一篇」重新随机（防止连续两次同一篇）
- 与 `astro:page-load` 事件绑定，SPA 导航后也重新随机

### 教训

给客户端传服务端数据时，`data-*` 属性比 `<script>` 标签更可靠——前者是 Astro 对 HTML 属性的原生支持，后者在 Vite/ESM 和 `is:inline` 之间容易踩坑。

---

## 0007-6：`^text{color}^` 行内颜色高亮语法

### 背景

Markdown 不支持特定颜色字体。已有的 `==彩虹渐变==` 是炫彩渐变，不是固定色号。用户需要"任意自定义颜色"的内联高亮语法。

### 决策

- 语法：`^文字{色号}^` 渲染为 `<span style="color:色号">文字</span>`，`^文字^` 不加色号则走默认 CSS 变量 `--highlight-color`
- 色号支持所有 CSS 颜色值（`#hex`、`rgb()`、颜色名等）
- 同已有的 `!!剧透!!` / `==彩虹==` / `++下划线++` 一样，实现跨文章正文、评论区展示、评论区预览、Q&A 四层渲染：

| 渲染路径 | 文件 | 处理方式 |
|---|---|---|
| 文章正文（构建期） | `remark-combined.mjs` | remark 插件，正则 AST 转换 |
| 评论区展示（客户端） | `CommentItem.svelte` `processEnhancements` | 正则 HTML 后处理 |
| Q&A 展示（客户端） | `QAList.svelte` `processEnhancements` | 同上 |
| 评论预览（客户端） | `markdown.ts` `preprocess` | 正则预处理后交 `marked.parse` |

### 教训

一套自定义语法需要在四条渲染路径上各补一遍——remark 插件（构建期）、`processEnhancements`（展示期）、`parseMarkdown`（预览期）。漏掉任何一处都会出现"文章里能用、评论里不行"的碎片化体验。

---

## 0007-7：评论预览 markdown 扩展语法支持 + 全局 CSS 修复

### 背景

评论预览（写评论时的「预览」切换）只能渲染标准 Markdown，自定义语法（`!!剧透!!`、`==彩虹==` 等）在预览中不生效。之前 `markdown.ts` 中 `parseMarkdown` 未做任何预处理。

### 弯路

补全 `preprocess` 函数时，`EXT_REGEX` 设为模块级常量带 `g` 标志。递归调用 `processExt` 时内层 regex.exec 覆盖外层 lastIndex，导致无限循环 → 网页卡死。

### 决策

- `markdown.ts` 的 `processExt` 内改为 `new RegExp(EXT_REGEX.source, 'g')`，每次调用独立实例
- 同时排查了 `remark-combined.mjs`、`CommentItem.svelte`、`QAList.svelte` 三处——均为函数内局部变量，安全
- `markdown.css` 从仅 `Markdown.astro` 导入改为从 `Layout.astro`（全局基座）导入，确保所有页面的评论预览区 CSS 可用
- 之前仅 rainbow/spoiler "失效"的根因：两者的视觉效果（渐变/blur）严格依赖 CSS，丢失后看不出;underline/highlight 缺 CSS 只是无装饰但不影响识别

### 教训

全局正则 + 递归 = 死循环。正则实例有状态（lastIndex），跨递归层级共享就是定时炸弹。原则：**每层调用创建自己的 regex 实例，或用 `String.replace` 回调替代 `exec` 循环。** 排查范围不能只看当前文件——所有使用相同模式的函数都要过一遍。

---

## 0007-8：音乐/专辑卡片半透明背景

### 背景

`::music{}` 和 `::album{}` 卡片没有显式背景色，继承父容器，视觉上缺乏层次。

### 决策

- 加 `background: color-mix(in oklab, var(--bg-color) 45%, transparent)`，45% 透明度跟随主题色
- 亮暗模式自动跟随，无需分别写规则

---

## 0007-9：全局播放器 insertNext UI 刷新延迟

### 背景

通过 `::music{}` 卡片或音乐统计卡片将歌曲加入队列时，全局播放器的歌单列表和播放栏状态不更新——需要手动按播放才刷新 UI。实际歌曲已添加成功（数据层正常），仅 UI 层滞后。

### 决策

- `insertNext` 函数末尾补充 `renderPlaylistModal()`（刷新歌单列表）和 `refreshBoundUI()`（刷新播放栏按钮/曲目信息）
- 两个函数均有内置 DOM 判空保护，在播放器未绑定的页面上调用不会报错

### 教训

数据层操作后必须同步刷新 UI 层——仅发 `CustomEvent` 不足以保证视图一致，调用具体的渲染函数是最低成本的保底。

---

## 0007-10：本次改动的综合评估（更新）

| 维度 | 决策 |
|---|---|
| 不走"大重构" | 不拆组件、不改目录结构，纯加功能/加样式/修 bug |
| 新依赖 | `rehype-external-links` — 成熟库 |
| 数据层改动 | search-index.json 扩字段，向下兼容 |
| 风险 | 各改动均为独立模块：卡片复用已有端点、语法处理有 4 层覆盖验证、播放器 UI 修复有判空保护 |
