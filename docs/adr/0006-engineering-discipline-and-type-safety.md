# ADR 0006：工程纪律基线与类型债清零（多条目合集）

- 状态：已采纳并验收（2026-06-23）
- 范围：引入 biome（仅 lint）+ astro check + tsconfig 收严；清零全部 astro check 类型错误；画廊折叠静默失效修复；残留文件清理；对照模板 Mizuki 的借鉴边界
- 相关代码：
  - 工具/配置：`biome.json`（新增）、`tsconfig.json`、`package.json`
  - 类型修复：`src/utils/{url-utils,content-utils}.ts`、`src/components/CursorTrail.astro`、`src/components/comment/{Comments,CommentItem,QAList}.svelte`、`src/components/misc/{Markdown,ImageModule,Search,HomePostCards}.astro`、`src/components/{Header,PostCard}.astro`、`src/components/control/Navi.astro`、`src/components/memos/MemoTimeline.astro`、`src/pages/**`（多页）、`src/plugins/{remark-directive-rehype,rehype-component-admonition,remark-lqip}.*`
  - 画廊修复：`src/pages/[...locale]/appreciation/gallery/{tags,[author]}.astro`
  - 删除：`memos_*`（7 个根目录散件）、`temp_fix.cjs`、`temp_script.js`、`patch-comments.js`、`out.txt`

---

## 0006-1：引入 biome，但只做 lint、关闭 formatter

### 背景

项目此前零 lint/format 工具，且根目录堆了一批临时文件（`temp_*`、`patch-comments.js`、`out.txt`、与 `src/components/memos/` 重复的 `memos_*`）。决定补上工程纪律基线。

### 弯路

按计划跑 `biome check --write ./src` 想做"安全自动修"，结果 **`check` 包含 formatter**，一次性把 81 个文件、约 3700 行按 biome 风格重排（引号/空格/换行），真正有意义的改动被埋没、完全没法 review。`git checkout -- src` 整体回滚 src（保留 config 与已删残留），再用 `biome lint --write`（只 lint）重做。

### 决策

- biome **只做 lint**：`formatter.enabled = false`。既有代码风格已成形，对个人博客一次性全量重排是负优化、且会污染 diff。
- 用 `biome lint --write`（不是 `biome check --write`）应用安全修复；任何格式化都不做。
- `assist.organizeImports = off`：import 重排会动到顺序敏感的 **CSS/副作用导入**（`global.css`、Tailwind 层），是"布局突然塌"的经典诱因——直接关掉杜绝风险。

**教训：`biome check` = 格式化 + lint + assist；只想 lint 就用 `biome lint`。对已成形的代码库，formatter 全量 --write 等于制造一场无意义的巨型 diff。出事别犹豫，`git checkout` 回滚重来比在脏 diff 里抢救便宜。**

---

## 0006-2：astro check + tsconfig 收严，类型债清零（纯类型修复）

### 背景

`astro build` 默认不做类型检查，导致 ~120 个类型错误长期隐形。引入 `astro check` 后一次暴露。用户担心"修类型会把页面架构改崩"（过去试过）。

### 决策

- 接入 `pnpm check`（`astro check`）+ tsconfig 收严（`noUnusedLocals/Parameters`、`noImplicitReturns`、`noFallthroughCasesInSwitch`、`noImplicitOverride`、`allowUnreachableCode:false`）。
- **全部 120 个错误用"纯类型"手段修**：类型标注、`as` 断言、`!` 非空、联合收窄、删无副作用死代码。这些在编译时被擦除，**生成的 JS 逐字节不变**，物理上动不了运行时/布局。
- 根因定位发现 **60%（74 个）错误集中在两个画廊文件**——它们各有一段**逐字节复制**的灯箱 `<script>`（`openGalleryPreview` 等）；同一处毛病（`querySelector().dataset`、`let overlayEl=null` 后直用、回调参数隐式 any）被复制两份。本轮对两份施加相同类型修复（重复本身不大，未抽公共模块，见 ADR 0005-3 的"别整套搬"取舍同理：不为去重而引入新结构）。
- 验收：`astro check` 0 errors（8 个内联脚本 hint 保留）、`astro build` 仍 45 页、diff 仅 ~33 文件小改。

**教训：构建能过 ≠ 类型干净——`astro build` 不 typecheck，债会隐形堆积。类型修复（标注/断言/cast）编译时擦除，不可能改渲染结果；会改坏布局的是格式化/import 重排，不是类型。先归类（按错误码+文件）定位根因，常能发现"一根藤上 N 个瓜"。**

---

## 0006-3：biome 规则务实裁剪，行为风险项缓办

### 背景

`recommended` 全开后噪音很大（143 err / 92 warn），其中大量与本项目实际不符或与刚做的类型修复冲突。

### 决策

- **关掉噪音/误报规则**（配置层，零代码）：
  - `noNonNullAssertion`：我们刚为类型安全**主动**加了 `!`，开着它等于自相矛盾。
  - `noExplicitAny`：`any` 多是务实写法。
  - `noAssignInExpressions`：命中的全是 `while ((m = regex.exec(text)) !== null)` 惯用写法，非 bug。
  - `useTemplate`、`useOptionalChain`：纯风格噪音。
- **行为风险项缓办**：`noDoubleEquals`（`==`，10）降为 `warning`、`noGlobalIsNan`（`isNaN`，6）保留 warning。二者 biome 自身标为 **unsafe 修复**（`==→===`、`isNaN→Number.isNaN` 可能真改行为），不批量改，留作可见提醒、逐个人眼判断。
- 顺手修真·安全的琐碎项：`noImplicitAnyLet`（补类型）、`useIterableCallbackReturn`（`forEach` 回调加 `{}`）、`useNodejsImportProtocol`（`path`→`node:path`）、未用参数加 `_`、删失效的 `// biome-ignore` 注释。
- 终态：`biome lint` 0 errors，16 warnings（全是缓办的 `==`/`isNaN`）。

**教训：lint 规则为项目服务，不是反过来。biome 标 "unsafe" 的修复（==、isNaN）真的可能改行为，绝不批量 `--unsafe`，降级为 warning 当待办看板即可。能用配置消除的噪音，别去改代码。**

---

## 0006-4：`class:hidden={}` → `class:list`，修好静默失效的画廊折叠

### 背景

类型检查报 4 个 `ts(2322)`：画廊标签筛选里 `<div class="…" class:hidden={l.values.length > 3}>`。

### 决策

- 实锤：grep 构建产物 `dist/`，`class:hidden` 作为**字面属性**漏出 8 处、`hidden` 类应用 0 处——**Astro 不支持 `class:hidden={}` 指令**（那是 Svelte/Vue 写法，Astro 只认 `class:list`）。即"字母分组超 3 个值默认折叠"功能一直**静默失效**（浏览器忽略未知属性，不报错也看不出，当前数据量小更无人察觉）。
- 改为 `class:list={["…", { hidden: l.values.length > 3 }]}`：清掉 4 个类型错误 + 移除产物垃圾属性 + 让折叠真正生效，且与已有的点击展开 JS（`classList.toggle('hidden')`）对得上。属行为改动，已单独取得确认。

**教训：类型错误有时不是"洁癖"，而是在指出**真**的（潜在）bug。判断一个指令到底有没有生效，去 grep 构建产物（`dist/`）最实锤——别只看源码。fork 自模板的写法尤其要警惕"看着像、其实当前框架不吃"。**

---

## 0006-5：借鉴 Mizuki 的"思想"而非"目录形态"；Astro 升级缓办

### 背景

对照同生态模板 Mizuki（注意：Momo 源自 [Motues/Momo]，与 Mizuki 是**兄弟非父子**），它有更细的原子设计目录、拆分式 config、更激进的构建优化、已在 Astro 7。评估是否对齐。

### 决策

- **不做结构性重构**：不把目录改成 Mizuki 的原子设计、不拆 `config.ts`、不到处加 barrel export。Momo 体量小（~30 组件 / 263 行 config），照搬是用别人审美覆盖自家架构、高风险低收益。先补**工程纪律**（biome/check/tsconfig）这种零架构改动的基线。
- **Astro 5→7 升级缓办**：跨两个大版本，真正门槛在 6→7（Rust 编译器对 HTML 更严、默认 Markdown 引擎换 Sätteri 需手动切回 `unified()`）。当前 Astro 5 未 EOL、无具体新特性刚需，不为"追新"而升；已记录在案，升时开分支单独做。
- 真要学就抽"那一招"用本地现成料实现（同 ADR 0005-3）。

**教训：与其对齐另一个项目的"骨架"，不如吸收它的"思想"。重构的收益要能说清，否则就是把能跑的东西推倒重来。版本升级同理——没刚需就别跨大版本追新。**
