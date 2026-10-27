# 博客文章「修改日期」实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让改过的文章在详情页显示「最后更新于 …」，在首页/标签列表显示「· 更新于 …」。

**Architecture:** 复用 schema 已有的可选 `updatedDate`，新增一个纯函数判断「更新日期是否晚于发布日期」，详情页与列表页共用；schema 增加校验防止日期写反。日期来源为手动维护的 frontmatter。

**Tech Stack:** Astro 7 content collections、TypeScript、Markdown frontmatter。

**Spec:** `docs/superpowers/specs/2026-10-27-blog-updated-date-design.md`

## Global Constraints

- 所有日期渲染必须经过 `src/components/FormattedDate.astro`（`zh-CN`）。
- 中文文案固定为「最后更新于 …」（详情页）与「更新于 …」（列表页）。
- 列表排序保持 `pubDate` 降序，不得改为 `updatedDate`。
- 不引入新依赖。
- 仓库根目录：`D:\Syncthing\blog`，分支 `main`。

## Review Focus

- 文章 `updatedDate` 与 `pubDate` 同一天（仅时间不同）：日期区只显示发布日期，不出现第二个日期。
- 文章未填 `updatedDate`：详情页与列表页都不得出现「更新于」。
- `updatedDate` 早于 `pubDate`：构建失败并指出 `updatedDate` 字段，而不是渲染错误日期。
- 带时间偏移的 frontmatter（如 `2026-08-08T23:00:00+08:00`）：按日期部分比较，不出现「更新日期比发布早一天」的误判。
- 首页与标签页共用 `PostList`：改一处，两处都必须生效。

---

### Task 0: 先提交上一轮未提交的 Docker 文章

**Files:**
- Modify: `src/content/blog/2026/08/Docker/nginx-srs-live-streaming-guide.md`
- Modify: `src/content/blog/2026/08/Docker/srs-docker-guide.md`
- Modify: `src/content/blog/2026/08/Docker/syncthing-docker-guide.md`

**Interfaces:**
- Consumes: 无
- Produces: 干净的 commit 历史，本功能改动不与内容修订混在一起

- [ ] **Step 1: 确认 diff 只包含这三篇文章**

Run: `git -C D:\Syncthing\blog diff --stat`
Expected: 仅上述 3 个文件，且不含 `updatedDate` 相关改动。

- [ ] **Step 2: 提交**

```powershell
git -C D:\Syncthing\blog add src/content/blog/2026/08/Docker/nginx-srs-live-streaming-guide.md src/content/blog/2026/08/Docker/srs-docker-guide.md src/content/blog/2026/08/Docker/syncthing-docker-guide.md
git -C D:\Syncthing\blog commit -m "Update Docker guides to match server compose files"
```

- [ ] **Step 3: 确认工作区只剩未跟踪文件**

Run: `git -C D:\Syncthing\blog status --short`
Expected: 仅 `?? .stfolder/` 与 `?? CLAUDE.md`（不要删除、不要提交）。

---

### Task 1: 日期比较函数 + schema 校验

**Files:**
- Create: `src/lib/dates.ts`
- Modify: `src/content.config.ts:9-19`

**Interfaces:**
- Produces: `isUpdatedAfterPublished(pubDate?: Date, updatedDate?: Date): boolean` —— 任一缺失返回 `false`；仅当 `updatedDate` 的 UTC 日期部分严格晚于 `pubDate` 的 UTC 日期部分时返回 `true`。

- [ ] **Step 1: 创建日期比较函数**

```typescript
// src/lib/dates.ts
const toDateKey = (date: Date) => date.toISOString().slice(0, 10);

export function isUpdatedAfterPublished(pubDate?: Date, updatedDate?: Date): boolean {
	if (!pubDate || !updatedDate) return false;
	return toDateKey(updatedDate) > toDateKey(pubDate);
}
```

- [ ] **Step 2: 在 schema 中拒绝「更新日期早于发布日期」**

在 `src/content.config.ts` 顶部加 `import { isUpdatedAfterPublished } from './lib/dates';`，并把 `blog` collection 改为：

```typescript
const blog = defineCollection({
	loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
	schema: ({ image }) =>
		z
			.object({
				title: z.string(),
				description: z.string(),
				pubDate: z.coerce.date(),
				updatedDate: z.coerce.date().optional(),
				heroImage: z.optional(image()),
				tags: z.array(z.string()).default([]),
			})
			.superRefine((data, ctx) => {
				if (
					data.updatedDate &&
					data.updatedDate.getTime() !== data.pubDate.getTime() &&
					!isUpdatedAfterPublished(data.pubDate, data.updatedDate)
				) {
					ctx.addIssue({
						code: 'custom',
						path: ['updatedDate'],
						message: 'updatedDate 不能早于 pubDate',
					});
				}
			}),
});
```

- [ ] **Step 3: 构建验证 schema 未破坏现有文章**

Run: `npm run build`
Expected: 成功，31 个页面构建通过（当前文章均未填 `updatedDate`）。

- [ ] **Step 4: 提交**

```powershell
git -C D:\Syncthing\blog add src/lib/dates.ts src/content.config.ts
git -C D:\Syncthing\blog commit -m "Add updatedDate validation helper"
```

---

### Task 2: 详情页与列表页显示「更新于」

**Files:**
- Modify: `src/layouts/BlogPost.astro:4-28, 111-115`
- Modify: `src/components/PostList.astro:1-9, 55-57`

**Interfaces:**
- Consumes: `isUpdatedAfterPublished`（Task 1 的签名）
- Produces: 无

- [ ] **Step 1: 详情页按日期比较决定是否显示**

在 `BlogPost.astro` 的 frontmatter import 区加入：

```astro
import { isUpdatedAfterPublished } from '../lib/dates';
```

把日期区块替换为：

```astro
{pubDate && (
	<div class="date">
		<FormattedDate date={pubDate} />
		{updatedDate && isUpdatedAfterPublished(pubDate, updatedDate) && (
			<div class="last-updated-on">
				最后更新于 <FormattedDate date={updatedDate} />
			</div>
		)}
	</div>
)}
```

- [ ] **Step 2: 列表页在发布日期后追加更新日期**

`PostList.astro` frontmatter 加入同一 import，并把 `.date` 段落替换为：

```astro
<p class="date">
	<FormattedDate date={post.data.pubDate} />
	{post.data.updatedDate && isUpdatedAfterPublished(post.data.pubDate, post.data.updatedDate) && (
		<> · 更新于 <FormattedDate date={post.data.updatedDate} /></>
	)}
</p>
```

- [ ] **Step 3: 构建验证**

Run: `npm run build`
Expected: 构建成功。此时还没有文章填写 `updatedDate`，所以输出中不应出现「最后更新于」或「更新于」。

- [ ] **Step 4: 提交**

```powershell
git -C D:\Syncthing\blog add src/layouts/BlogPost.astro src/components/PostList.astro
git -C D:\Syncthing\blog commit -m "Show updated date on post pages and lists"
```

---

### Task 3: 为已修改文章补日期并更新交接文档

**Files:**
- Modify: `src/content/blog/2026/08/Docker/nginx-srs-live-streaming-guide.md`（frontmatter）
- Modify: `src/content/blog/2026/08/Docker/srs-docker-guide.md`（frontmatter）
- Modify: `src/content/blog/2026/08/Docker/syncthing-docker-guide.md`（frontmatter）
- Modify: `HANDOVER.md:194, 202, 291`

**Interfaces:**
- Consumes: `updatedDate` schema 字段（Task 1）
- Produces: 无

- [ ] **Step 1: 每篇文章在 `pubDate` 下一行加 `updatedDate`**

```yaml
updatedDate: "2026-10-27"
```

- [ ] **Step 2: 修正 HANDOVER.md 的过时路径**

把 `D:\GitHub\blog` 全部替换为 `D:\Syncthing\blog`（第 194、202 行及同段描述）。

- [ ] **Step 3: 在「文章检查流程」的 frontmatter 项补规则**

把第 291 行改为：`title` / `description` / `pubDate` 三项齐全；修改已发布文章时补 `updatedDate`（填实际修改日期，同日小改可省略）；`description` 不要照抄 `title`。

- [ ] **Step 4: 构建并检查产物**

Run: `npm run build`

然后：

```powershell
Select-String -Path (Get-ChildItem dist -Recurse -Filter *.html | Where-Object FullName -Match 'srs-docker-guide') -Pattern '最后更新于'
```

Expected: 命中 1 次，日期为 `2026年10月27日`。

```powershell
Select-String -Path (Get-ChildItem dist -Recurse -Filter *.html | Where-Object FullName -Match 'easytier-docker-guide') -Pattern '最后更新于'
```

Expected: 无命中（未填 `updatedDate` 的文章不显示）。

```powershell
Select-String -Path dist\index.html -Pattern '更新于'
```

Expected: 有命中（首页列表出现更新日期）。

- [ ] **Step 5: 提交**

```powershell
git -C D:\Syncthing\blog add src/content/blog/2026/08/Docker/nginx-srs-live-streaming-guide.md src/content/blog/2026/08/Docker/srs-docker-guide.md src/content/blog/2026/08/Docker/syncthing-docker-guide.md HANDOVER.md docs/superpowers
git -C D:\Syncthing\blog commit -m "Add updatedDate to revised Docker guides and document workflow"
```

---

## 最终验证

- [ ] `npm run build` 无错误。
- [ ] `dist/` 中改过的文章含「最后更新于」且日期为 2026年10月27日。
- [ ] 未改过的文章不含「最后更新于」。
- [ ] `dist/index.html` 与 `dist/tags/*/index.html` 含「更新于」。
- [ ] 人为把某篇文章的 `updatedDate` 改成早于 `pubDate`，`npm run build` 必须失败并提示 `updatedDate 不能早于 pubDate`；验证后改回。
