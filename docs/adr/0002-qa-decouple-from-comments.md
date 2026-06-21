# ADR 0002：Q&A 组件从评论系统解耦，独立为轻量组件

- 状态：已采纳并验收（2026-06-22）
- 范围：关于页 Q&A 的前端组件、后端审核流程、管理后台三项一体化改造
- 相关代码：
  - 前端 `src/components/comment/QAList.svelte`（新增）、`src/pages/[...locale]/about.astro`（替换引用）、`src/i18n/key.ts` + `language/{zh-cn,en}.ts`（新增 qa 翻译）
  - Worker 后端 `src/api/admin/updateComment.ts`（新增编辑端点）、`src/api/admin/listComments.ts`（搜索+动态分页）、`src/api/public/postComment.ts`（Q&A 来源区分 pending/approved）、`src/utils/auth.ts`（导出 verifyToken）、`src/index.ts`（注册新路由）
  - Dashboard `src/views/QAManager.vue`（完全重写）

## 背景与问题

关于页的 Q&A 最初直接用 `<Comments qaMode hideForm>` 实现——组件内部通过 `qaMode` 布尔值切换渲染逻辑，整个 Comments.svelte（597 行）+ CommentItem.svelte（475 行）约 1000 行代码全部打进 bundle。

**三个核心缺陷：**

1. **大量死代码**：Q&A 模式下点赞、表情反应、emoji picker、图片上传、回复嵌套、用户 localStorage 全无意义，但全在运行时加载。
2. **访客无法互动**：因为复用评论表单太臃肿（三栏 + 图片 + emoji），直接 `hideForm={true}` 放弃了提问入口，Q&A 变成只读展示。
3. **后端管理简陋**：QAManager.vue 是扁平表格，问题和回答混在一起，无编辑功能、无审核状态、无搜索。

## 走过的弯路（务必记住）

一开始的直觉是"在 Comments.svelte 里继续加条件分支"——比如给 Q&A 模式单独一个简化表单。但 Comments.svelte 已经承载了博客评论和留言板两种场景，再加第三种会让它彻底失控。

更关键的是：**Q&A 的数据模型（问题-回答的 1:N 树）天然与通用评论（N:N 嵌套回复）不同**。评论里 `CommentItem` 递归渲染任意深度，而 Q&A 只需要 `Q:` 下面跟一个 `A:`，没有二级回复。强行复用同一个递归组件，渲染层有一半逻辑在 Q&A 模式是死路径。

> 教训：共享组件不等于共享所有逻辑。当两个场景的核心交互模型不同（树 vs 列表、只读 vs 可回复、审批 vs 无审批），拆开比硬合并的维护成本更低。

## 决策

**Q&A 从 Comments 组件体系完全解耦，建立独立的 `QAList.svelte` + 专用管理后台。**

具体边界：

| 维度 | 旧实现（复用 Comments） | 新实现（QAList + 独立管理） |
|------|----------------------|--------------------------|
| 前端组件 | Comments.svelte 597 行 + 条件分支 | QAList.svelte 287 行，零分支 |
| Bundle 大小（gzip） | 15.25 kB（Comments.js） | 3.68 kB（QAList.js），减少 76% |
| 访客提问 | 无（hideForm=true） | 简化表单：昵称 + 邮箱 + 内容 |
| 审核流程 | 无（全部 approved） | 管理员提交 → approved；访客提交 → pending |
| 后台展示 | 扁平表格，问题回答混排 | 层级树：问题下嵌套回答 |
| 后台操作 | 置顶 + 删除 | 置顶 + 删除 + 编辑 + 审核通过/拒绝 + 搜索 + 行内回复按钮 |
| API | 复用 GET/POST /api/comments | 新增 PUT /admin/comments/:id 编辑端点 |
| Session | Token 20 分钟 | Token 24 小时（`expirationTtl: 86400`） |

## 随之落地的完整范围（验收清单，全部已上线）

**前端 QAList.svelte**
- 独立数据加载（复用 GET /api/comments?post_slug=about-qa&nested=true）
- Q:A 卡片渲染（与 CommentItem QA 模式视觉一致）
- 简化提问表单：昵称 + 邮箱 + 内容，Enter 提交，localStorage 记住用户信息
- 访客提交后提示"审核通过后显示"，不暴露 pending 细节
- markdown 增强（spoiler/rainbow/underline/ruby）复用
- 分页控制

**后端 Worker**
- `PUT /admin/comments/:id`：支持编辑 content_text（自动重跑 markdown 解析）和 status
- `GET /admin/comments/list`：新增 `?q=` 搜索、`?limit=` 动态分页、返回 totalCount
- `POST /api/comments`：`post_slug === 'about-qa'` 时，有 admin token → `approved`，无 → `pending`
- `verifyToken()` 从 auth.ts 导出，复用 adminAuth 的 KV 验证逻辑

**Dashboard QAManager.vue（完全重写）**
- 三标签页：全部 / 待审核 / 已通过
- 层级视图：`Q:` 问题下缩进显示 `A:` 回答
- 编辑弹窗：修改问题或回答内容
- 审核操作：通过按钮 → `status: approved`
- 行内回复：每条未回答问题旁绿色「回复」按钮，自动切回答模式 + 预选问题 + 滚动到表单
- 搜索：输入框 300ms 防抖搜索 content_text
- 表单分离：问题/回答模式切换，回答模式下显示问题下拉框

**基础设施**
- `adminAuth` 中间件仅覆盖 `/admin/*`，不影响公共 API；`verifyToken` 用于 postComment 内部判断

## 后果

- 优点：Q&A 组件清爽独立，bundle 减少 76%；访客可以提问，有审核兜底；管理后台从"能用"到"好用"。
- 取舍：Q&A 仍共用 Comment 表（`post_slug = 'about-qa'`），没有独立数据模型。当前 Q&A 数据量不大，这个取舍可接受；若将来复杂度上升（如答案也允许回复、多语言分层），可迁移到独立表。
- Comments.svelte 的 `qaMode` / `hideForm` props 保留未删，因为可能有其他页面在用。如果确认只有 about.astro 用过，可以后续清理。

## 已知盲点 / 已接受不做

- **admin 提交的 Q&A 也走公共 POST /api/comments 端点**，受 10 秒频率限制。管理后台批量添加时可能被限，但当前 Q&A 不是高频操作，接受。
- **搜索仅匹配 content_text 原文**，不搜索 content_html（渲染后的 HTML）。如果 markdown 链接等语法导致搜索不到关键词，属于可接受范围。
- **Worker deleteComment 是物理删除**（hard delete），而 Go/Node.js 实现是软删除。三个后端实现不一致，本次未动，视为技术债。
- **Q&A 答案只显示第一条**（`c.replies[0]`），与旧实现一致。如果管理员对一个问了多条回答，前端只展示第一条。
