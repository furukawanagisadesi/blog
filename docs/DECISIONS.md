# 设计记录

> 只记**现在仍生效**的设计结论，以及当时为什么没走另一条路。变更过程查 `git log`。
> 操作手册见 [`PUBLISH.md`](PUBLISH.md)，格式规范见 [`WRITING.md`](WRITING.md)。

## 1. 标签（2026-10-15）

- 平铺多标签，不是分类：一篇可挂多个标签，URL 为 `/blog/tags/` 与 `/blog/tags/<slug>/`。
- 标签用英文、直接作 slug（`RouterOS` → `routeros`）；词表在 `WRITING.md` 第 7 节，新标签必须先登记再使用。
- `tags` 在 schema 里是可选字符串数组（默认空），缺标签不影响构建。
- 列表复用 `PostList.astro`，首页与标签页同一套渲染。
- 没做：首页分页、单一分类、标签的中文显示名、RSS 输出标签。

## 2. 修改日期（2026-10-27）

- `updatedDate` **手填**，不用文件 mtime，也不用 git 提交时间：Syncthing 同步、checkout、浅克隆都会让时间失真。
- schema 校验 `updatedDate` 不早于 `pubDate`，写反直接构建失败。
- 未填则整篇不显示更新日期，详情页与列表页都不渲染。

## 3. 列表排序（2026-10-27）

- 排序键是「最近活动日」：`updatedDate` 晚于 `pubDate` 时取 `updatedDate`，否则取 `pubDate`，降序。
- 同一天按 `pubDate` 降序，再按文章 `id` 升序，保证多次构建顺序一致。
- 首页、标签页、RSS 共用 `src/lib/posts.ts` 的 `sortByRecentActivity()`，不各写一套。
- 代价：批量修订旧文会让它们同时上浮到首页最前，这是预期行为。

## 4. 正文排版（2026-10-28）

依据：中文正文 14–18px、行高 1.5–1.8（CJK 取 1.7）、每行 30–45 字（W3C 横排 ≤48 字）。

| 元素 | 值 |
| --- | --- |
| `body` | 18px / 1.7 |
| `h1` / `h2` / `h3` / `h4` / `h5` | 2em / 1.5em / 1.25em / 1.1em / 1em |
| `.prose p` 下边距 | 1.3em |
| `blockquote` | 1.1em |
| `≤720px` 的 `body` | 17px |

- 列宽保持 820px：18px 下约 45 字/行，仍在 ≤48 字内，所以没跟着缩。
- 当时的取舍是「以通行建议为准」，不是「更紧凑」（17px / 1.7）。
- 若仍嫌大，把 `body` 降到 17px 即可，布局不受影响。

## 5. 内容列宽（2026-10-28）

- `--content-width: 820px`（正文与封面图）、`--list-width: 1000px`（首页与列表）。
- 封面图与正文同宽并居中，避免「图宽字窄」。
- `≤720px` 断点与 `max-width: calc(100% - 2em)` 保持不变。
- 没做：铺满宽屏、目录栏、侧栏。

## 6. 评论区（2026-10-28 设计，当天起关闭）

- 后端是 Twikoo 云函数（Vercel）+ MongoDB Atlas。**大陆直连 Vercel 约 16–27 秒超时**，没有域名时无法稳定提供 HTTPS 后端，所以先关掉。
- 前端：1.7.20 的 JS/CSS **同源自托管**在 `public/vendor/twikoo/1.7.20/`，不再引用 unpkg / jsdelivr。
- 兜底：15 秒未收到 `onCommentLoaded` 显示「加载较慢」；识别 Twikoo 的假空态（「没有评论」+「查看更多」同时出现）显示失败提示并可重试；重试用递增 `attempt` 忽略旧实例的迟到回调。
- 当前 `src/consts.ts` 的 `COMMENTS_ENABLED = false`，评论 DOM 与脚本都不渲染；资源与兜底逻辑保留，改回 `true` 即恢复。
- 恢复前提：后端可达（绑域名或迁后端）；Vercel 的 Deployment Protection 必须设为 **Disabled**，否则预检请求被重定向，提交报「评论失败：0」。
