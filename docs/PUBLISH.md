# 发布流程：从新建文章到线上可见

> 本文是操作手册（怎么做）。**格式规范**见 [`WRITING.md`](WRITING.md)。
> 所有命令都在仓库根目录 `D:\Syncthing\blog` 下执行。

## 1. 首次环境（只做一次）

```bash
npm install
```

Node 版本需 `>= 22.12`。`npm install` 会通过 `prepare` 自动装好 `simple-git-hooks` 的 pre-commit 钩子。

远程仓库是 `ssh://git@ssh.github.com:443`，push 前需要 SSH key 已解锁、代理在线。

## 2. 新建文章

```bash
npm run new -- vmware-nested-vm-guide "VMware 嵌套虚拟化教程"
```

- 生成 `src/content/blog/YYYY/MM/<slug>.md`，日期取当天，目录不存在会自动创建。
- slug 必须小写 kebab-case；同系列保持统一后缀：教程 `*-guide.md`、排障 `*-fix.md`。
- **Docker / SQL 等专题**：生成后把文件移到对应子目录（如 `2026/08/Docker/`），文件名不变。

## 3. 填 front matter

5 个键、固定顺序、单引号：

```yaml
---
title: 'VMware 嵌套虚拟化教程'
description: '一句话说清这篇解决什么问题，不得照抄 title'
pubDate: '2026-11-18'
tags: ['Linux', 'VMware']
---
```

- `updatedDate`：新文章**不写**。只有改动已发布文章时才补，且必须晚于 `pubDate`（schema 会校验）。
- `tags`：至少 1 个，只能取 [`WRITING.md` 第 7 节](WRITING.md)词表里的值，字母序。要新标签先登记词表。

## 4. 写正文

1. **标题**：从 `## 1.` 起（正文不写 H1），编号阿拉伯、层级不跳、末尾不加标点。
2. **代码块**：必带语言，白名单 `bash` / `text` / `yml` / `nginx` / `json` / `javascript` / `dockerfile` / `sql` / `lua`；没有合适语言就写 `text`，不留空围栏。
3. **加粗只给两类**：界面元素与按钮（`**保存并应用**`）、警示词（`**注意**`）。路径、命令、端口、IP、软件名一律用反引号。
4. **图片**：截图放 `src/assets/`，命名有意义，正文相对路径按所在层级：
   - 在 `blog/YYYY/MM/` 下：`![描述](../../../../assets/xxx.png)`，4 层 `../`
   - 在 `blog/YYYY/MM/Docker/` 下：`![描述](../../../../../assets/xxx.png)`，5 层 `../`

其它：

- 菜单路径用引用块：`> **菜单路径**：网络 → DHCP/DNS → 添加`
- 敏感信息用占位符：`your_ip` / `your_username` / `your_password`
- Docker 系列固定五步结构，见 [`WRITING.md` 第 8 节](WRITING.md)

## 5. 本地预览

```bash
npm run dev
```

访问 `http://localhost:4321/blog/`。

- 页面没更新：浏览器 `Ctrl+Shift+R` 强刷，或重启 dev server。
- **markdown 图片路径不会让 build 报错**，只会渲染成破图，所以图片必须在这里肉眼确认。

## 6. 提交前自检

```bash
npm run verify
```

等于 `astro check` + `markdownlint-cli2` + `astro build`，三步全过才继续。

可自动修的：

```bash
npm run fix:md            # markdown 规范：表格、空行、列表、围栏
npm run fmt:frontmatter   # 引号、键顺序、tags 排序
```

## 7. 提交

```bash
git add -A
git commit -m "docs(vmware): 新增嵌套虚拟化教程"
```

- pre-commit 钩子会对**改动的 md** 自动跑 `markdownlint-cli2 --fix`；被拦下按报错行号改完再提交。
- 跳过钩子（不推荐）：`$env:SKIP_SIMPLE_GIT_HOOKS=1` 后再 commit。
- 提交信息用 Conventional Commits：`docs(范围): 说明`。

## 8. 推送上线

```bash
git push
```

GitHub Actions 依次执行 **check（`astro check` + 全量 markdownlint）→ build → deploy（GitHub Pages）**，任意一步失败都不会部署。

约 1–2 分钟后访问 `https://furukawanagisadesi.github.io/blog/` 核对新文章、图片、目录。

## 9. 修改与删除已发布文章

- **修改**：补 `updatedDate: 'YYYY-MM-DD'`（晚于 `pubDate`）。首页列表按「最近更新」排序，会自动靠前；同日小改可省略。
- **删除**：删 md 与对应图片后，若 build 报 `UnknownContentCollectionError`，先 `Remove-Item -Recurse node_modules/.astro` 再 build（内容层缓存，见 `HANDOVER.md` 坑 1）。

## 10. 常见报错对照

| 现象 | 原因与处理 |
| --- | --- |
| build 报「`updatedDate` 必须晚于 `pubDate`」 | 日期填错，改 `pubDate` 或 `updatedDate` |
| build 报 schema 缺字段 | front matter 少了 `title` / `description` / `pubDate` / `tags` |
| commit 被钩子拦下并报 `MD0xx 文件:行号` | 按行号改；`MD040` 是代码块缺语言，`MD060` 是表格管道两侧空格 |
| CI 红叉、线上没更新 | 看 Actions 的 **Markdown lint** 步骤；本地 `npm run verify` 可提前复现 |
| 线上 URL 乱码 | 用了中文文件名（禁止） |

## 11. 速记

```text
npm run new  →  填 5 个 front matter 键  →  从 ## 1. 写、代码块带语言
→  npm run dev 看效果  →  npm run verify  →  git commit  →  git push
```
