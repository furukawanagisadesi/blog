# 博客文章「修改日期」设计

日期：2026-10-27
状态：已确认

## 意图

已发布文章修改后，读者只能看到发布日期，无法判断内容是否更新过。为文章页和列表页增加「修改日期」展示，让回访读者知道内容有维护。

## 目标

- 文章详情页显示「最后更新于 <日期>」。
- 首页/标签列表在发布日期旁弱化显示「更新于 <日期>」。
- 修改日期来自文章 frontmatter 的 `updatedDate`（手动维护）。
- 写错日期（`updatedDate` 早于 `pubDate`）在构建时直接报错。

## 非目标

- 不做基于文件 mtime 或 git 提交时间的自动推导。
- 不改变列表排序（仍按 `pubDate` 降序）。
- 不批量回填所有历史文章的修改日期。

## 约束

- Astro 7 + Markdown content collections，schema 已含可选 `updatedDate`。
- 日期格式化统一走 `src/components/FormattedDate.astro`（`zh-CN`）。
- 中文文案与现有站点一致。

## 方案

采用「手动 frontmatter + 详情页/列表页双处展示」。放弃 mtime（同步与 checkout 会污染）和 git 提交时间（浅克隆不可靠、需插件）。

## 具体决策

| 位置 | 行为 |
|---|---|
| `src/layouts/BlogPost.astro` | 仅当 `updatedDate` 的日期部分晚于 `pubDate` 时显示「最后更新于 …」 |
| `src/components/PostList.astro` | 同上条件，在发布日期后追加「· 更新于 …」，字号与颜色沿用 `.date` |
| `src/content.config.ts` | refine 校验 `updatedDate >= pubDate`，违规信息指向具体文章 |
| 内容 | 3 篇已修改的 Docker 文章补 `updatedDate: "2026-10-27"` |
| 文档 | `HANDOVER.md` 增加「改完文章补 updatedDate」检查项，修正过时路径 |

## 验证

- `npm run build` 通过。
- `dist/` 中对应文章 HTML 出现「最后更新于」。
- 首页与标签页 HTML 出现「更新于」。
- 未填写 `updatedDate` 的文章不出现更新日期。

## 实施顺序

1. 先单独提交 3 篇 Docker 文章的既有改动。
2. 再实施本功能。
