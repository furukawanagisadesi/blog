# 博客标签功能 — 设计文档

> 日期: 2026-10-15
> 状态: 设计已确认，待写实现计划
> 关联: `HANDOVER.md`

## 1. 背景与目标

博客现有 19 篇文章，只能通过首页时间倒序列表浏览，缺少按主题检索的入口。

目标：为文章增加**平铺多标签**，提供 `/tags/` 索引页与 `/tags/<slug>/` 列表页，并在文章页展示标签，让读者能按主题浏览。

## 2. 需求（已确认）

| 项 | 决定 |
|----|------|
| 范围 | 只做标签；首页分页不在本轮 |
| 标签体系 | 平铺多标签（每篇可挂多个） |
| 命名 | 英文标签，直接作 URL slug（`RouterOS` → `routeros`） |
| 标签归属 | 由实现方提议一套，用户审阅 |
| 不改动 | RSS 输出、首页列表结构、文章正文 |

## 3. 设计

### 3.1 Schema

`src/content.config.ts` 增加字段：

```ts
tags: z.array(z.string()).default([]),
```

可选（默认空数组），保证缺 tags 的文章仍能构建；实现时把 19 篇全部补齐。

### 3.2 新增文件

| 文件 | 作用 |
|------|------|
| `src/lib/tags.ts` | `getAllTags()`（标签 + 篇数，按篇数降序）、`getPostsByTag(tag)`、`slugifyTag(tag)` |
| `src/components/PostList.astro` | 文章列表（标题 + 描述 + 日期），抽自 `index.astro`，供首页与标签页复用 |
| `src/pages/tags/index.astro` | `/tags/` 标签索引页（列出全部标签及篇数） |
| `src/pages/tags/[tag].astro` | `/tags/<slug>/` 该标签下的文章列表 |

### 3.3 改动文件

| 文件 | 改动 |
|------|------|
| `src/content.config.ts` | 加 `tags` 字段 |
| `src/pages/index.astro` | 改用 `PostList`，行为不变 |
| `src/layouts/BlogPost.astro` | 标题下方展示标签（链接到 `/tags/<slug>/`） |
| `src/components/Header.astro` | 导航加「标签」→ `/tags/` |
| 19 篇文章 frontmatter | 补 `tags` |

### 3.4 URL

- 标签索引：`/blog/tags/`
- 单个标签：`/blog/tags/<slug>/`

### 3.5 标签表（9 个）

| 标签 | 篇数 | 文章（文件名） |
|------|------|----------------|
| Docker | 7 | easytier / nginx-srs-live-streaming / rustdesk / srs / syncclipboard / syncthing / webdav |
| VMware | 7 | vmware-debian / vmware-dual-vm / vmware-fedora / vmware-ubuntu / vmware-ubuntu-virtual-audio / vmware-download / vmware-pipewire |
| Linux | 5 | vmware-debian / vmware-fedora / vmware-ubuntu / vmware-ubuntu-virtual-audio / vmware-pipewire |
| Network | 5 | ie-slow-loading / immortalwrt-soft-router / routeros-setup / vmware-dual-vm / easytier-docker |
| RouterOS | 1 | routeros-setup |
| ImmortalWrt | 1 | immortalwrt-soft-router |
| SQL | 1 | sql-in-vs-exists |
| Browser | 1 | ie-slow-loading-troubleshoot |
| Meta | 1 | blog-launch |

> 备选：若嫌 1 篇的标签太碎，可砍为 6 个（去掉 RouterOS / ImmortalWrt / Browser）。本设计默认采用 9 个。

## 4. 非目标（本轮不做）

- 首页分页
- 单一分类（category）
- 标签的中文显示名（仅英文标签）
- RSS 中输出标签

## 5. 验证

- `npm run build` 通过（预期 21 + 1 + 9 = 31 页）
- 断言：
  - `/tags/index.html` 存在，且列出全部 9 个标签
  - 每个标签都有 `/tags/<slug>/index.html`
  - 文章页含指向 `/tags/<slug>/` 的链接
  - 既有断言（`lang="zh-CN"` / 中文日期 / `og:type` / 字体栈 / Twikoo 懒加载）不回归
- 本地验证即可，不核对线上

## 6. 已决

- 标签表采用 9 个（用户已确认整体设计）
