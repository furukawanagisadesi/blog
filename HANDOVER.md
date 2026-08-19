# 博客个性化 + 文章管理与发布 — 交接文档

> 生成时间: 2026-08-09
> 最近更新: 2026-08-18
> 前序文档: `F:\Applications\GenericAgent-main\temp\blog_deploy_handover.md`（部署 + 修复阶段）
> 本文档: 会话总结（文章发布、格式化、主页重构、敏感信息清理、VMware 系列、IE 慢加载排查、站点样式调整），供后续 Agent 接力

---

## 一、本次会话完成的工作

### 1. 发布第一篇博客文章
- `src/content/blog/template.md`（用户已填内容）→ 重命名为 `blog-launch.md`（《博客建立》）
- 提交 `9d13e3f`，线上验证 https://furukawanagisadesi.github.io/blog/blog-launch/ 正常
- 顺带提交了工作区中已删除的 `CLAUDE.md` 符号链接

### 2. 文章封面图
- 第一篇博客封面：`src/assets/blog-post-ai-setup.jpg`（Pexels 免费图，写代码工作台主题）
- ImmortalWrt 文章封面：`src/assets/blog-router-network.jpg`（Pexels 免费图，网络/路由主题）
- 提交 `a1425c5`、`be06484`

### 3. 主页改为纯文字文章列表
- **问题**：新增文章后主页错位。原因：`index.astro` 原布局把第一篇设为通栏 featured 卡片（需 hero 图），无图则错位
- **方案**：`src/pages/index.astro` 重写为纯文字列表（标题 + 描述 + 日期 + 分隔线），彻底移除首页图片，提交 `c70f961`
- 排序逻辑：`index.astro` 按 `pubDate` 降序；同一天的文章按 `getCollection()` 原始顺序（文件名字典序），如需精确控制可在 pubDate 加时间

### 4. 新增 8 篇文章并整理目录结构
- 用户将文章按日期归档：`src/content/blog/2026/08/`
- 新增文章（Docker 自部署系列 + RouterOS）：
  | 文件 | 标题 |
  |------|------|
  | `routeros-setup-guide.md` | RouterOS 配置流程 |
  | `Docker/easytier-docker-guide.md` | Easytier Docker 设置教程 |
  | `Docker/nginx-srs-live-streaming-guide.md` | Nginx-SRS 直播推流设置教程 |
  | `Docker/rustdesk-docker-guide.md` | RustDesk Docker 设置教程 |
  | `Docker/srs-docker-guide.md` | SRS Docker 设置教程 |
  | `Docker/syncclipboard-docker-guide.md` | SyncClipboard Docker 设置教程 |
  | `Docker/syncthing-docker-guide.md` | Syncthing Docker 设置教程 |
  | `Docker/webdav-docker-guide.md` | WebDAV Docker 设置教程 |
- 中文文件名 → 英文 slug（避免 URL 乱码），提交 `cd5d61c`
- **为 8 篇新文章补 frontmatter**（title/description/pubDate）——schema 强制要求，缺失会构建失败
- 文章 URL 现带日期路径，如 `/blog/2026/08/docker/easytier-docker-guide/`

### 5. 统一 markdown 格式（10 篇）
提交 `4f56d7f`，统一规范：
- 代码块带语言标记（`bash`/`yml`/`nginx`/`json`/`javascript`/`dockerfile`/`text`）
- 路径/命令/端口/IP 用反引号行内代码
- 中英文之间加空格；加粗内不留多余空格（`**xxx**`）
- Docker 系列统一结构：1 创建文件夹 → 2 开放端口 → 3 创建文件 → 4 启动服务 → 5+ 后续配置
- 清理模板注释、多余空行
- 修正 bug：rustdesk 文章启动命令 `cd /home/admin/webdav` → `/home/admin/rustdesk`

### 6. 单篇深排版：RouterOS 文章（提交 `5c0fbeb`、`2b4efac`）
- 去掉正文重复 H1（页面布局已用 frontmatter title 渲染标题）
- 菜单路径用引用块；配置值用「字段/值」表格；接口改名用表格；`ipconfig` 输出用代码块
- 加目录（TOC 锚点）；标题 `①②③` → `1. 2. 3.` 并同步锚点
- 已验证：H1 仅 1 个、6 个表格、目录锚点可用

### 7. About 页面（提交 `a16a3cb`、`79ec6ad`）
- 重写为个人简介版（定位：个人简介，无社交图标）
- 内容含：你好我是 furukawanagisadesi / 我在写什么 / 为什么写博客
- 加入邮箱链接 `mailto:furukawanagisadesi@protonmail.com`

### 8. 敏感信息清理（提交 `e2ebd2d`）
统一替换为占位符：
| 文件 | 原内容 | 替换为 |
|------|--------|--------|
| webdav-docker-guide.md | `username: admin` / `password: wby999` | `your_username` / `your_password` |
| rustdesk-docker-guide.md | `RELAY=公网服务器ip:21117` | `RELAY=your_ip:21117` |
| srs-docker-guide.md | `你的服务器IP`（4处） | `your_ip` |
| nginx-srs-live-streaming-guide.md | `你的服务器IP`（4处）、htpasswd 用户名 `admin` | `your_ip` / `your_username` |
| syncthing-docker-guide.md | `你的服务器IP:8384` | `your_ip:8384` |

### 9. 新增 VMware 系列文章
- `vmware-ubuntu-setup-guide.md`（《VMware Ubuntu 安装流程》）：VMware 17 下载、Ubuntu 26.04 镜像下载、安装步骤、VMware Tools 安装、SSH 配置
  - 提交 `7dfc657`（新增）、`ffbf716`（新增 VMware Tools 章节）、`46aeb4f`（新增 SSH 章节 + 同步 HANDOVER）
- `vmware-ubuntu-virtual-audio-bug-fix.md`（《VMware Ubuntu 虚拟音频设备离线解决方案》）：Voicemeeter 虚拟音频导致声卡离线的排查与解决（安装 pavucontrol、改配置），提交 `796c1f2`
  - 中文文件名 → 英文 slug；文中两张截图从 `content/blog/2026/08/` 移到 `src/assets/` 并重命名
    - `image.png` → `src/assets/vmware-virtual-audio-offline.png`
    - `image-1.png` → `src/assets/vmware-virtual-audio-config.png`
  - 图片用相对路径 `../../../../assets/...` 引用（从 `2026/08/` 到 `src/assets/` 需 4 层）
- `vmware-fedora-mirror-update-guide.md`（《VMware Fedora 换源并更新教程》）：Fedora 换 USTC 中科大源 + dnf 更新，提交 `0d9b29c`
  - 中文文件名 → 英文 slug

### 10. 新增 IE 慢加载排查文章 + 站点样式调整（2026-08-18 会话）
- `ie-slow-loading-troubleshoot-guide.md`（《IE 网页加载缓慢异常查询与解决》）：记录 `ebaolife.net` 登录页在 IE 下加载约 2 分钟、Chrome 秒开的排查过程，中文文件名 → 英文 slug，提交 `3b2ee23`
  - 根因：网络无法访问 DigiCert 的 OCSP 服务 `ocsp.digicert.com:80`，导致 Windows Schannel 证书吊销检查超时约 105 秒
  - 按博客规范重排（去掉小数子标题 `2.1/3.1`、新增结论章节、引用块加 emoji 标注），提交 `8fce155`
  - 补充 IE/Chrome 证书验证差异分析，并修正 CRL（证书吊销列表）/ OCSP（在线证书状态协议）表述，提交 `7ee9de2`、`eef973f`
- **全量 markdown 统一**：用户自行格式化全部 14 篇文章（含 Docker 系列），提交 `9254390`
- **站点样式调整**：`src/styles/global.css` 给 `.prose` 内 `h2~h6` 增加 `margin-top: 1.5em`，解决 `##` 紧贴 `###` 的问题，提交 `8fce155`

### 11. 新增 SQL 文章（2026-08-18 会话）
- `SQL/sql-in-vs-exists-guide.md`（《SQL IN 与 EXISTS 的理解》）：记录对 SQL `IN` 与 `EXISTS` 子查询执行逻辑与复杂度的理解，中文文件名 → 英文 slug，提交 `f8a7d3d`
  - 修正：`EXISTSS` 拼写错误（4 处）、EXISTS 查询列名不一致（`c.custkey = o.custkey` → `c.c_custkey = o.o_custkey`）、说明性代码块补 `text` 语言标记
  - 文章放新增 `SQL/` 子目录；代码块语言标记规范新增 `sql`（见第四节）

---

## 二、当前状态

| 项 | 值 |
|----|----|
| 本地路径 | `D:\Syncthing\Self\GitHub\blog` |
| 分支 | `main`，工作区干净 |
| 远程 | `https://github.com/furukawanagisadesi/blog.git` |
| 线上地址 | https://furukawanagisadesi.github.io/blog/ |
| 文章数 | 15 篇（`src/content/blog/2026/08/`，Docker 系列在 `Docker/` 子目录，SQL 文章在 `SQL/` 子目录） |
| 主页 | 纯文字文章列表（标题+描述+日期） |
| About 页 | 个人简介 + 邮箱 |
| 最新提交 | `f8a7d3d` |

### 文章目录结构
```
src/content/blog/2026/08/
	├── blog-launch.md                    # 《博客建立》
	├── immortalwrt-soft-router-guide.md  # ImmortalWrt 软路由安装配置指南
	├── routeros-setup-guide.md           # RouterOS 配置流程
	├── ie-slow-loading-troubleshoot-guide.md  # IE 网页加载缓慢异常查询与解决
	├── vmware-ubuntu-setup-guide.md      # VMware Ubuntu 安装流程
	├── vmware-ubuntu-virtual-audio-bug-fix.md   # VMware Ubuntu 虚拟音频设备离线解决方案
	├── vmware-fedora-mirror-update-guide.md     # VMware Fedora 换源并更新教程
	└── Docker/
    ├── easytier-docker-guide.md
    ├── nginx-srs-live-streaming-guide.md
    ├── rustdesk-docker-guide.md
    ├── srs-docker-guide.md
    ├── syncclipboard-docker-guide.md
    ├── syncthing-docker-guide.md
    └── webdav-docker-guide.md
	└── SQL/
    	└── sql-in-vs-exists-guide.md   # SQL IN 与 EXISTS 的理解
```

### 相关代码位置
- 内容 schema：`src/content.config.ts`（强制 title/description/pubDate）
- 文章路由：`src/pages/[...slug].astro`（用 `post.id` 作 slug，含日期/子目录路径）
- 主页列表：`src/pages/index.astro`（按 pubDate 降序）
- 文章布局：`src/layouts/BlogPost.astro`（frontmatter title 渲染为 H1）
- 文章标题间距：`src/styles/global.css`（`.prose h2~h6` 有 `margin-top: 1.5em`，Header 的 `h2` 有独立样式不受影响）
- 站点信息：`src/consts.ts`（SITE_TITLE=我的博客）
- About 页：`src/pages/about.astro`

---

## 三、待办事项（供后续 Agent）

1. **新增文章规范**：
   - 放 `src/content/blog/YYYY/MM/` 对应日期目录（Docker 类放 `Docker/` 子目录）
   - 文件名用英文 slug（如 `xxx-docker-guide.md`）
   - **必须带 frontmatter**：`title` / `description` / `pubDate`
   - 如需同日排序，pubDate 可加时间（`2026-08-08 14:30`）
   - 构建验证 + git 提交推送

2. **markdown 格式规范**（新文章遵循，参见上文第四节）：代码块语言标记、行内代码、中英文空格、结构顺序

3. **可选清理**：`src/assets/` 下 `blog-placeholder-1/2/4/5.jpg` 已无引用，`blog-placeholder-about.jpg` 已无引用（About 页重构后不再用占位图）。**注意 BaseHead 默认 fallback 仍引用 `blog-placeholder-1.jpg`**，删除前需确认

4. **图片管理**：文章内截图请放到 `src/assets/` 并命名有意义（如 `vmware-virtual-audio-offline.png`），文章中用相对路径 `../../../../assets/图片名` 引用（从 `src/content/blog/2026/08/` 出发是 4 层 `../`）。**不要把图片直接放 `src/content/blog/` 下**，也不要放文件名无意义的 `image.png`/`image-1.png`

5. **未决项**：
   - 首页若文章很多，可考虑分页
   - `immortalwrt-soft-router-guide.md` 与 `blog-launch.md` 的 heroImage 已被注释掉（用户选择不用封面图）
   - Header/Footer 暂无社交链接（用户暂不放）

---

## 四、约定：博客 markdown 统一规范（重要，新文章遵守）

1. 代码块必须带语言标记：`bash` / `yml` / `nginx` / `json` / `javascript` / `dockerfile` / `sql` / `text`
2. 路径、命令、端口、IP、软件名用反引号包裹（行内代码）
3. 中文与英文/数字之间加空格
4. 加粗写法 `**文字**`（内部无空格）
5. Docker 系列结构统一：
   ```
   ## 1. 创建文件夹
   ## 2. 开放服务器端口
   ## 3. 创建 docker-compose.yml 文件
   ## 4. 创建配置文件（如需）
   ## 5. 启动服务
   ## 6+ 后续配置 / 测试 / 客户端设置
   ```
6. 菜单路径用引用块：`> **菜单路径**：IP → Addresses → Add (+)`
7. 配置字段用「字段 / 值」两列表格
8. 长命令输出用代码块（`bash` 或 `text`）
9. 文章正文不要重复 H1（页面自动渲染标题）
10. 敏感信息一律用占位符：服务器地址 `your_ip`、账号 `your_username`、密码 `your_password`
11. 图片放 `src/assets/`（命名有意义），正文用相对路径 `![描述](../../../../assets/图片名)` 引用（从 `src/content/blog/2026/08/` 出发需 4 层 `../`）

---

## 五、踩坑记录

### 坑 1: Astro 内容缓存
- Astro v7 内容层在 `node_modules/.astro/data-store.json` 持久化缓存已删除的文章
- 删除示例文章后直接 build 仍渲染旧路由，引发 `UnknownContentCollectionError`
- **修复**：`Remove-Item -Recurse node_modules/.astro` 后再构建

### 坑 2: dev server 缓存
- `npm run dev` 若显示旧版页面，重启 dev server 或浏览器强刷（Ctrl+Shift+R）即可，代码本身一致

### 坑 3: 中文文件名 → URL 乱码
- 中文文件名生成的 slug 会乱码（如 `immortalwrt-软路由安装配置指�?`）
- **修复**：统一英文 slug 文件名

### 坑 4: 缺 frontmatter 导致构建失败
- content schema 强制 `title`/`description`/`pubDate`，新文章不加会 build 报错

### 坑 5: 主页错位（已解决）
- 原布局第一篇为通栏 featured 卡片需 hero 图；无图则错位
- 已改为纯文字列表，彻底解决

### 坑 6: 网络/代理
- GitHub 推送依赖本地代理 `127.0.0.1:17897`，代理未启动时 push 失败
- 直连也被墙；需先启动代理再 `git push`

---

## 六、日常操作速查

```bash
# 本地开发
cd "D:\Syncthing\Self\GitHub\blog" && npm run dev   # 默认 http://localhost:4321/blog/

# 构建验证
npm run build

# 发布（需代理在线）
git add -A && git commit -m "..." && git push origin main

# 新增文章后必做
# 1. 放对日期目录 + 英文 slug + 完整 frontmatter
# 2. npm run build 验证
# 3. git add -A && git commit && git push
# 4. 等待 1-2 分钟 Actions 部署后访问线上验证
```

---

*本文档由 Agent 生成，供后续 Agent 接力使用。*
