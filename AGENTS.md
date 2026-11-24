# 博客项目

Astro 博客，文章是 `src/content/blog/YYYY/MM/` 下的 Markdown，构建后部署到 GitHub Pages。

## 写作入口

- 格式规范：`docs/WRITING.md`，**唯一来源**，已由 `.opencode/opencode.json` 的 `instructions` 自动加载。落笔前以它为准，不要凭记忆或套模板。
- 操作流程：`docs/PUBLISH.md`（新建 → 预览 → 验证 → 提交 → 推送）。
- 新文章一律用 `npm run new -- <slug> "<标题>"` 生成骨架；改已发布文章时补 `updatedDate`。
- 会话内可直接用 `/new-post`（见 `.opencode/commands/new-post.md`）。

## 本地开发

启动 dev server 用后台模式：

```bash
astro dev --background
```

用 `astro dev stop`、`astro dev status`、`astro dev logs` 管理。

预览地址：`http://localhost:4321/blog/`。

## 验证与边界

- 交付前必须跑 `npm run verify`（`astro check` + `markdownlint` + `astro build`），全过才算完成。
- 图片、字体、排版这类只能肉眼判断的效果，交给用户确认；不要用截图或模拟键鼠代替。
- 到此为止：**不要自动 `git commit`，不要 `git push`**。`git push` 已在 `.opencode/opencode.json` 里设为需要确认，push 即触发上线。
- 缺截图时在正文对应位置留 `<!-- TODO 截图：<建议文件名>.png -->`，不要猜图片路径（路径写错 `build` 不报错，只会出破图）。
- 敏感信息一律占位符：`your_ip` / `your_username` / `your_password`。
- 不新增 front matter 键（`draft` / `slug` / `categories` / `heroImage` 等），不用中文文件名，不新增未登记的标签。

## Astro 文档

- [路由](https://docs.astro.build/en/guides/routing/)
- [内容集合](https://docs.astro.build/en/guides/content-collections/)
- [组件](https://docs.astro.build/en/basics/astro-components/)
- [样式](https://docs.astro.build/en/guides/styling/)
