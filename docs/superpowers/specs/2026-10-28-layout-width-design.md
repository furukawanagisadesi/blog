# 站点布局加宽设计

日期：2026-10-28
状态：已确认

## 意图

宽屏下正文两侧留白过多：文章列固定 720px，1920px 屏幕上每侧空出约 600px，首页列表也挤在同样窄的中间条里；文章封面却是通栏宽，形成「图宽字窄」的割裂感。

## 目标

- 文章正文适度加宽，减少两侧空白，同时保持中文阅读行宽舒适。
- 首页 / 标签索引列表加宽，比正文更宽，充分利用宽屏。
- 文章封面图与正文同宽，视觉对齐。
- 移动端行为保持不变。

## 非目标

- 不改字号、行高、字体栈。
- 不加侧边栏、目录、卡片网格或分页。
- 不改页眉页脚宽度与导航布局。

## 方案

采用「适度加宽」，放弃「正文无上限拉宽」（中文行过长影响阅读）和「加侧栏」（工作量与视觉改动过大）。

## 具体决策

| 位置 | 现状 | 改为 |
|---|---|---|
| `src/styles/global.css` `:root` | 无宽度变量 | 新增 `--content-width: 820px`、`--list-width: 1000px` |
| `src/styles/global.css` `main` | `width: 720px` | `width: var(--list-width)`，`max-width: calc(100% - 2em)` 保留 |
| `src/layouts/BlogPost.astro` `.prose` | `width: 720px` | `width: var(--content-width)`，`max-width` 保留 |
| `src/layouts/BlogPost.astro` `.hero-image` | 通栏 | `max-width: var(--content-width)` + `margin: 0 auto`，与正文同宽 |
| `@media (max-width: 720px)` | 现有规则 | 不变 |

说明：`main` 的 `padding: 3em 1em` 与 `max-width` 逻辑不动；About 页走 `BlogPost` 布局，随正文一起变为 820px；标签索引走 `main`，随列表变为 1000px。

## 验证

- `npm run build` 通过，页面数仍为 29（18 篇文章 + 首页 + 关于 + 标签索引 + 8 个标签页）。
- 构建产物 CSS 中 `--content-width: 820px`、`--list-width: 1000px` 生效。
- 1920px 宽屏下：列表内容宽 1000px、文章正文 820px、封面 820px 且居中；移动端（<720px）无横向溢出。
