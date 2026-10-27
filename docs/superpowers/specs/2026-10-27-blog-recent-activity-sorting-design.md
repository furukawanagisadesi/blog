# 列表按「最近更新」排序设计

日期：2026-10-27
状态：已确认

## 意图

已修改的文章应重新出现在列表靠前位置，让回访读者看到内容仍在维护。

## 决策

- 排序键：`updatedDate` 晚于 `pubDate`（按日期部分）时用 `updatedDate`，否则用 `pubDate`。
- 同一天：按 `pubDate` 降序，再按文章 `id` 升序，保证顺序稳定。
- 作用范围：首页、标签页、RSS 统一使用同一排序函数。
- 新增 `src/lib/posts.ts` 的 `sortByRecentActivity()`，复用 `src/lib/dates.ts` 的日期键逻辑。

## 非目标

- 不改文章详情页的日期展示逻辑。
- 不引入置顶、权重等人工排序字段。

## 验证

- `npm run build` 通过。
- `dist/index.html` 中 3 篇 `updatedDate: 2026-10-27` 的 Docker 文章排在未修改文章之前。
- 同一天更新的文章顺序在两次构建间保持一致。
- `/tags/docker/` 与 RSS 顺序与首页一致。

## 已知后果

批量修订会让多篇旧文同时上浮，直到有更新的文章或修改。这是手动维护 `updatedDate` 的预期代价。
