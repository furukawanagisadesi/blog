# 博客交接文档

> 最后更新：2026-11-25
> 本文件只记**现状与运维**，不记历史流水账（变更过程查 `git log`）。
> 格式规范 [`docs/WRITING.md`](docs/WRITING.md)（唯一来源）｜发布流程 [`docs/PUBLISH.md`](docs/PUBLISH.md)｜设计取舍 [`docs/DECISIONS.md`](docs/DECISIONS.md)

## 1. 当前状态

| 项 | 值 |
| --- | --- |
| 仓库 | `D:\Syncthing\blog`（Linux 侧可能挂在 NTFS 上，见坑 4） |
| 分支 / 远程 | `main` / `https://github.com/furukawanagisadesi/blog.git`（Linux 侧为 `ssh://git@ssh.github.com:443/...`） |
| 线上 | https://furukawanagisadesi.github.io/blog/ （GitHub Pages，子路径 `/blog`） |
| 技术栈 | Astro 7 + Markdown content collections，Node `>= 22.12` |
| 评论 | Twikoo（Vercel + MongoDB Atlas），**当前关闭**，开关是 `src/consts.ts` 的 `COMMENTS_ENABLED` |
| 主题 | 跟随系统 / 浅色 / 深色三态，存 `localStorage.theme` |

文章数、标签数、最新提交这类会变的值不在这里手抄，需要时看 `dist/` 或 `git log -1`。

## 2. 目录结构与关键文件

```text
src/content/blog/YYYY/MM/<slug>.md   # 文章，YYYY/MM 取发布日期
src/content/blog/YYYY/MM/Docker/     # 专题子目录，目录名首字母大写
src/content/blog/YYYY/MM/SQL/
docs/WRITING.md                      # 格式规范（唯一来源）
docs/PUBLISH.md                      # 发布流程
docs/DECISIONS.md                    # 设计取舍
```

| 位置 | 作用 |
| --- | --- |
| `src/content.config.ts` | 内容 schema：必填 `title` / `description` / `pubDate`，`tags` 可选，校验 `updatedDate >= pubDate` |
| `src/layouts/BaseLayout.astro` | 公共外壳：`<html lang="zh-CN">` + head + Header + Footer |
| `src/layouts/BlogPost.astro` | 文章布局：标题、日期、标签、正文、代码块复制按钮、评论区 |
| `src/pages/[...slug].astro` | 文章路由，slug 用 `post.id`（含日期与子目录） |
| `src/components/PostList.astro` | 文章列表，首页与标签页共用 |
| `src/lib/dates.ts` | 日期比较与排序键 |
| `src/lib/posts.ts` | `sortByRecentActivity()`，首页 / 标签 / RSS 共用 |
| `src/lib/tags.ts` | `slugifyTag` / `getAllTags` / `getPostsByTag` |
| `src/pages/tags/` | `/tags/` 索引与 `/tags/<slug>/` 列表 |
| `src/styles/global.css` | 设计 token（`light-dark()`）与全站排版 |
| `astro.config.mjs` | 字体（正文 Atkinson + 等宽 Atkinson Mono + 中文回退栈）、Shiki 明暗双主题 |
| `src/assets/fonts/` | 自托管字体与 OFL 许可 |
| `src/consts.ts` | 站点标题、描述、`COMMENTS_ENABLED` |
| `public/vendor/twikoo/1.7.20/` | 自托管 Twikoo 资源（当前未启用） |
| `scripts/` | `new-post.mjs`（新建骨架）、`fmt-frontmatter.mjs` |

### 主题与暗色

颜色 token 全在 `global.css` 的 `:root`，每个都写成 `light-dark(浅色, 深色)`。生效哪组由 `html` 的 `color-scheme` 决定：无 `data-theme` 跟随系统，`html[data-theme='light'/'dark']` 强制覆盖 —— **开关在 `html` 上，写进 `:root` 会失效**。Shiki 深色着色要同时挂在 `html[data-theme='dark']` 和 `@media (prefers-color-scheme: dark) { html:not([data-theme='light']) … }` 两处。组件样式一律用 token，不硬编码颜色。

## 3. 待办

1. 首页分页：文章更多时再考虑。
2. 恢复评论：前提见 `docs/DECISIONS.md` 第 6 节。
3. Header / Footer 社交链接：暂不做。
4. 有新的设计取舍就写进 `docs/DECISIONS.md`。

## 4. 踩坑（会真出事的）

### 坑 1：删文章后构建报 `UnknownContentCollectionError`

Astro 内容层在 `node_modules/.astro/data-store.json` 缓存了已删除的文章。先 `Remove-Item -Recurse node_modules/.astro` 再构建。

### 坑 2：中文文件名导致线上 URL 乱码

文件名一律英文 kebab-case slug。线上 URL 出现乱码就是这个原因。

### 坑 3：缺 frontmatter 构建失败

schema 强制 `title` / `description` / `pubDate`。新文章一律用 `npm run new` 生成骨架，不要手抄旧文。

### 坑 4：NTFS 的 `ads` 挂载让构建和 dev 全挂（仅 Linux 侧）

仓库放在 NTFS 分区（如 `/mnt/软件/Syncthing/blog`）时，ntfs3 的 `ads` 选项把 `astro:content` 这类虚拟模块 id 的冒号当成「文件:数据流」分隔符，报 `MISSING_EXPORT "loadDevToolbarApps"` 或 `createAstroServerApp is not a function`。Windows 侧不受影响。

- 判断：`mount | grep 软件` 看是否含 `ads`；`ls -d node_modules/astro:content` 存在即命中。
- 处理：`sudo mount -o remount,ads=0 /mnt/软件`，再把 `,ads=0` 写进 `/etc/fstab` 对应行并 `systemctl daemon-reload`（`noads` 写法不支持，写了会挂载失败）。

### 坑 5：Twikoo「评论失败：0」

Vercel 的 Deployment Protection 没关时，OPTIONS 预检被重定向到登录页，被 CORS 拦下，HTTP 状态 0。恢复评论前先把它设为 **Disabled** 并 Redeploy。

## 5. 日常速查

```bash
npm run dev                              # http://localhost:4321/blog/
npm run new -- <slug> "<标题>"            # 新建符合规范的骨架
npm run verify                           # astro check + markdownlint + build
git add -A && git commit && git push      # push 即触发部署
```

完整发布流程与常见报错对照见 [`docs/PUBLISH.md`](docs/PUBLISH.md)。
