# 博客个性化 + 文章管理与发布 — 交接文档

> 生成时间: 2026-08-09
> 最近更新: 2026-10-15
> 前序文档: `F:\Applications\GenericAgent-main\temp\blog_deploy_handover.md`（部署 + 修复阶段）
> 本文档: 会话总结（文章发布、格式化、主页重构、敏感信息清理、VMware 系列、IE 慢加载排查、站点样式调整、Twikoo 评论系统集成、中文一致化与公共布局重构、中文字体栈、Twikoo 延迟加载、标签功能），供后续 Agent 接力

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
   - 文章放新增 `SQL/` 子目录；代码块语言标记规范新增 `sql`（见第五节）

### 12. 新增 VMware Debian 文章（2026-08-25）
- `vmware-debian-setup-guide.md`（《VMware Debian 安装后设置教程》）：Debian 换源（USTC/官方）、安装 vmtools + openssh、terminal 代理配置、uv 安装，提交 `92ca238`
  - sources.list 内容代码块语言标记 `bash` → `text`；段落补句号
  - 后续集成 `debian设置.md` 内容（2026-08-31）：新增「为 root 用户增加补全功能」「将用户添加至 sudo」「将用户从 sudo 删除」三节（apt 全局代理原已有，合并去重），并删除源文件 `debian设置.md`

### 13. 新增 VMware 双虚拟机隔离上网教程（2026-08-26）
- `vmware-dual-vm-isolation-guide.md`（《VMware 双虚拟机隔离上网教程》）：双虚拟机通过 HOST-ONLY 网络 + Clash Verge 代理实现隔离上网，中文文件名 → 英文 slug，提交 `f72ad69`
  - 7 张截图从 `src/content/blog/2026/08/` 移至 `src/assets/` 并重命名（如 `vm-a-network-config.png`、`clash-verge-settings.png`）
  - 修正 typo（"上午"→"上网"、"B虚拟"→"B 虚拟机"）；中英文加空格；图片引用改相对路径
  - 补充「修改 DNS 覆写配置」小节（Google DOH `https://dns.google/dns-query` 防 DNS 泄露）；新增截图重命名 `dns覆写-域名服务器.png` → `vm-b-dns-overwrite.png`；`clash-verge-settings.png` 更新过

### 14. 集成 Twikoo 评论系统（2026-08-27）
- **方案**：采用 Twikoo 官方推荐的云函数部署（Vercel + MongoDB Atlas 免费库），免服务器、免证书。私有 Docker 部署（★）需自申请证书，未采用
- **云端**：
  - MongoDB Atlas 免费 M0 集群 + `mongodb+srv://` 连接串 + Network Access 放行 `0.0.0.0/0`
  - Vercel 部署 Twikoo 云函数（模板 `src/server/vercel-min`），环境变量 `MONGODB_URI`，envId = `https://vercel-69q075mt0-furukawanagisadesi.vercel.app`
  - ⚠️ **必须**在 Vercel Settings → Deployment Protection 把 Vercel Authentication 设为 Disabled，否则 preflight/cors 请求被重定向到 `vercel.com/login` 导致"评论失败：0"
- **博客端**：`src/layouts/BlogPost.astro` 集成，提交 `8d27a54`（首次）、`9d3bdcb`（修复初始化逻辑）、`41f98be`（About 页隐藏评论）
  - 用 `window.addEventListener('load')` 初始化（`astro:page-load` 首次加载不触发）
  - 引入 `twikoo.css`；脚本主用 unpkg，失败回退 jsdelivr
  - `showComments` prop 控制是否显示评论（默认 true），About 页传 `false`
- **踩坑**：
  - `评论失败：0` = HTTP 状态 0，原因就是 Vercel Deployment Protection 未关闭导致 preflight 重定向被 CORS 拦截
  - 未绑定自定义域名，目前直接用 Vercel 的 `.vercel.app`（CORS 已放行 `*`，可正常跨域）
- 验证：文章页评论区正常，无需登录即可留言

### 15. 拆分下载章节 + 新增音频卡顿文章（2026-09-17）
- 从 `vmware-ubuntu-setup-guide.md` 拆出「VMware 17 下载」章节，新建 `2026/09/vmware-download-guide.md`（《VMware 下载流程》），Ubuntu 文章的章节重新编号 1~3
- 新增 `2026/09/vmware-pipewire-audio-stutter-fix.md`（《VMware Linux PipeWire 音频卡顿解决方案》）：改 WirePlumber 配置扩大 ALSA 缓冲区，再关闭 Firefox 阅读模式与网页语音合成
  - 中文文件名 `vmware pipewire音频卡顿解决方案.md` → 英文 slug
- `vmware-debian-setup-guide.md`：把「将用户添加至 sudo」提前到第 1 节，代理设置改为写 `/etc/environment`（原为 apt 专用代理），新增 fcitx5-rime 输入法章节
- 格式检查：补代码块语言标记（配置与 GUI 步骤用 `text`）、行内代码（`pw-top`、`speech-dispatcher-*`、`about:config`）、缺失句号、末尾换行；修正 `linux`→`Linux`、`pipewire`→`PipeWire`，并改写 Firefox Reader 与语音合成混淆的表述
- `vmware-downloadguide.md` → `vmware-download-guide.md`（文件名统一为 `xxx-guide.md`）
- `vmware-debian-setup-guide.md` 追加 fcitx5 配置：安装 `fcitx5-module-cloudpinyin`，新增 `default.custom.yaml`（默认 `luna_pinyin_simp`、候选词 9 个），步骤 5 的连字符分隔改为完整句子；`sources.list` 两个代码块语言标记 `bash` → `text`
- 构建通过（21 页）；已提交并推送（`9665f11`），工作区另有未跟踪的 `CLAUDE.md`（指向 `AGENTS.md` 的符号链接，未纳入版本控制）

### 16. 站点设计优化：中文一致化 + 抽公共布局（2026-10-13）
- **问题**：文章页/About 页 `lang="en"`（首页却是 `zh-CN`）；日期显示英文 `Sep 17, 2026`；导航 `Home/About`、页脚 `All rights reserved.`、`Last updated on` 均为英文；About 页顶部出现「发布日期」和空封面块；首页文章标题用 `h4`（层级从 `h2` 直接跳 `h4`）；`a:hover` 与 `a` 同色（无 hover 反馈）；`index.astro` 重复声明 `main { width: 720px }`。
- **改动**：
  - 新增 `src/layouts/BaseLayout.astro`（公共外壳：`<html lang="zh-CN">` + `BaseHead` + `Header` + `<slot />` + `Footer`；接收 `title / description / image / ogType`）
  - `index.astro`、`BlogPost.astro` 改走 `BaseLayout`，删除各自重复的 `html/head/body`
  - `BlogPost.astro`：Props 改为显式接口（`pubDate / updatedDate / heroImage` 可选，补 `showComments?: boolean`、`ogType?: 'website' | 'article'`，默认 `article`）；无 `pubDate` 不渲染日期区；无 `heroImage` 不渲染空 `.hero-image`；`Last updated on` → `最后更新于`
  - `about.astro`：去掉 `pubDate`，About 页不再显示日期和空封面
  - `index.astro`：删掉重复的 `main` 宽度；文章标题 `h4` → `h3`
  - `BaseHead.astro`：新增 `ogType` 参数（文章页传 `article`）；补 `twitter:title / description / image`；文章页用 `heroImage` 作 `og:image`（无则回退占位图）
  - `Header.astro`：`Home` → `首页`、`About` → `关于`
  - `Footer.astro`：`All rights reserved.` → `保留所有权利。`
  - `FormattedDate.astro`：`en-us` → `zh-CN`（显示如 `2026年9月17日`）
  - `global.css`：`a:hover` 改用 `--accent-dark`
- **验证**：`npm run build` 通过（21 页）；对 `dist/` 全量断言（`lang` / 中文日期 / 导航页脚文案 / 文章页 `og:type=article` / 无空封面 / 首页无 `h4`）全部通过。
- **未做（后续可排期）**：分类/标签与首页分页、Twikoo 延迟加载。（中文正文字体已在第 17 项处理）

### 17. 中文字体：系统字体栈（2026-10-15）
- **问题**：`body` 用 `--font-atkinson`，而 Atkinson 无中文字形，中文回退到浏览器默认 `sans-serif`（各系统不一致、不可控）。
- **踩坑**：Astro 的字体 `fallbacks` 会**始终**在 `--font-atkinson` 末尾补 `sans-serif`（即使删掉 `fallbacks` 也一样），因此不能靠在 `global.css` 里写 `var(--font-atkinson), "PingFang SC", ...` 来追加中文栈——会被中间的 `sans-serif` 截断而失效（浏览器遇到 `sans-serif` 就停住，不再往后的字体找）。
- **方案**：把中文栈写进 `astro.config.mjs` 的 `fallbacks`：
  `fallbacks: ['PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Noto Sans CJK SC', 'sans-serif']`
  生成的 `--font-atkinson` 为 `Atkinson-xxx, "…fallback: Arial", "…fallback: Arial Bold", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif`（中文栈在通用兜底之前；`fallback: Arial` 两个面仅用于拉丁字的 CLS，无 CJK 字形，不影响中文）。
- **改动**：`astro.config.mjs`（`fallbacks`）。`src/styles/global.css` 的 `body { font-family: var(--font-atkinson); }` 保持不变。
- **验证**：`npm run build` 通过（21 页）；断言 `--font-atkinson` 含 `"PingFang SC"` 且位于 `sans-serif` 之前。

### 18. Twikoo 评论延迟加载（2026-10-15）
- **问题**：文章页首屏无条件从 unpkg 加载 Twikoo 的 CSS + JS（第三方、境外 CDN），拖慢首屏。
- **方案**：改为滚动到评论区附近再加载。`BlogPost.astro` 用 `IntersectionObserver` 监听 `#twikoo` 容器，提前 200px（`rootMargin: '200px 0px'`）触发；触发时才动态插入 `twikoo.css`（`document.head`）与 `twikoo.min.js`（`document.body`），加载完调用 `window.twikoo.init`。保留 unpkg → jsdelivr 回退、`loaded` 去重、envId、版本号（1.7.20）不变。兜底：不支持 `IntersectionObserver` 或找不到容器时，退回 `load` 后立即加载。
- **改动**：`src/layouts/BlogPost.astro`（去掉常驻 `<link rel="stylesheet" …twikoo.css>`，脚本改为 IIFE + IntersectionObserver）。
- **验证**：`npm run build` 通过（21 页）；断言文章页初始 HTML 无 `twikoo.css` 的 `<link>`、含 `IntersectionObserver`；About 页无任何 Twikoo 内容。
- **注意**：评论能否真正渲染依赖 Vercel 云函数与网络，本地只验证了「延迟加载逻辑与产物」，完整效果需在浏览器滚到评论区确认。

### 19. 标签功能（2026-10-15）
- **范围**：本轮只做标签，首页分页未做。
- **方案**：文章 frontmatter 增加 `tags`（英文标签、可选、默认空数组）；生成 `/blog/tags/` 索引页与 `/blog/tags/<slug>/` 列表页；文章页标题下显示标签；导航加「标签」。
- **改动**：
  - `src/content.config.ts`：schema 加 `tags: z.array(z.string()).default([])`
  - 新增 `src/lib/tags.ts`：`slugifyTag`（去空白、转小写、空格转 `-`）、`getAllTags`（标签 + 篇数，按篇数降序、同篇数按名升序）、`getPostsByTag`
  - 新增 `src/components/PostList.astro`：从 `index.astro` 抽出的文章列表（标题 + 描述 + 日期），首页与标签页共用
  - 新增 `src/pages/tags/index.astro`（`/tags/`）与 `src/pages/tags/[tag].astro`（`/tags/<slug>/`，`getStaticPaths` 由 `getAllTags` 生成）
  - `src/pages/index.astro`：改用 `PostList`（行为不变）
  - `src/layouts/BlogPost.astro`：加 `tags?: string[]` prop，`<h1>` 下渲染标签链接（无标签则不渲染，About 页不受影响）
  - `src/components/Header.astro`：导航改为「首页 / 标签 / 关于」
  - 19 篇文章 frontmatter 各补一行 `tags`
- **标签表（9 个）**：`Docker`(7)、`VMware`(7)、`Linux`(5)、`Network`(5)、`RouterOS`(1)、`ImmortalWrt`(1)、`SQL`(1)、`Browser`(1)、`Meta`(1)
- **提交**：`5f4ac33`（schema + 回填）、`4c3b6d2`（抽 PostList）、`50cb206`（标签页）、`ff30500`（文章页 + 导航）
- **验证**：`npm run build` 通过（21 → 31 页）；产物全量断言通过（新增：`/tags/index.html` 存在且含全部 9 个标签名、9 个标签页存在、文章页含 `/blog/tags/<slug>/` 链接、About 页无标签区）
- **注意**：标签用英文（直接作 URL slug），新增/修改文章记得补 `tags`；同一标签请保持大小写一致（`getAllTags` 已按 slug 聚合，`Docker` 与 `docker` 会合并到同一页，但索引显示名取首次出现的写法）；设计与计划文档见 `docs/superpowers/specs/2026-10-15-tags-design.md`、`docs/superpowers/plans/2026-10-15-tags.md`
- **踩坑**：计划的产物断言 `-match '<ul>'` 不成立——Astro 会给作用域样式元素注入 `data-astro-cid-*` 属性，`<ul>` 实际是 `<ul data-astro-cid-xxx>`；断言应匹配前缀 `<ul` / `<li data-astro-cid`（并注意 `<li` 会误匹配 `<link`）

### 20. Docker 文章修订：EasyTier 与 RustDesk（2026-10-20）
- **`easytier-docker-guide.md`**：原来是单个 `easytier` 容器，用 `entrypoint: /bin/sh` 在一个进程里先后起 `easytier-web-embed` 和 `easytier-core`；现在拆成两个服务，都跑在同一份 `./easytier:/root` 挂载上：
  - `easytier-web`：`entrypoint: ["/sbin/tini", "--", "easytier-web-embed"]`，参数 `--api-server-port 11211`、`--api-server-addr 127.0.0.1`、`--config-server-port 22020`、`--config-server-protocol udp`、`--db /root/et.db`（数据库落盘）
  - `easytier-core`：`container_name: easytier` 保持原名（`docker exec` 习惯不变），命令简化为 `--config-server udp://127.0.0.1:22020/admin`
  - 镜像从 `easytier/easytier:latest` 固定到 `easytier/easytier@sha256:91d6732ea5ff71542fdb99333d2ee7b168e973443114db84db061e452427d91e`
  - 端口表：UDP 22020 标注「不用开放，已指向本地」，UDP 11011 标注 WireGuard 可选；代码块语言标记 `text`
  - 两个服务都加 `logging: json-file`（`max-size: 10m`、`max-file: 3`）
- **`rustdesk-docker-guide.md`**：去掉 `version: "3"`；21118/21119 改为可选并注释掉对应端口映射；新增 `TZ=Asia/Shanghai`、`./appdata:/app/data` 挂载和日志轮转；客户端第 2 步文案改为「ID / 中继服务器」
- **提交**：`b54c71c`（2 个文件，+58 / −29）
- **验证**：`npm run build` 通过，31 页
- **注意**：本地仓库路径已从 `D:\Syncthing\Self\GitHub\blog` 迁到 `D:\GitHub\blog`，旧路径不再存在

---

## 二、当前状态

| 项 | 值 |
|----|----|
| 本地路径 | `D:\GitHub\blog` |
| 分支 | `main`，仅有未跟踪的 `CLAUDE.md` |
| 远程 | `https://github.com/furukawanagisadesi/blog.git` |
| 线上地址 | https://furukawanagisadesi.github.io/blog/ |
| 文章数 | 19 篇（2026/08 共 17 篇，Docker 系列在 `Docker/`、SQL 在 `SQL/` 子目录；2026/09 新增 2 篇） |
| 主页 | 纯文字文章列表（标题+描述+日期） |
| 标签页 | `/blog/tags/`（标签索引，9 个标签）+ `/blog/tags/<slug>/`（各标签文章列表）；导航加「标签」 |
| About 页 | 个人简介 + 邮箱 |
| 评论系统 | Twikoo（Vercel 云函数 + MongoDB Atlas），envId=`https://vercel-69q075mt0-furukawanagisadesi.vercel.app`，无登录留言，About 页不显示 |
| 最新提交 | `b54c71c` |

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
	├── vmware-debian-setup-guide.md      # VMware Debian 安装后设置教程
	├── vmware-dual-vm-isolation-guide.md # VMware 双虚拟机隔离上网教程
	├── Docker/
	│   ├── easytier-docker-guide.md
	│   ├── nginx-srs-live-streaming-guide.md
	│   ├── rustdesk-docker-guide.md
	│   ├── srs-docker-guide.md
	│   ├── syncclipboard-docker-guide.md
	│   ├── syncthing-docker-guide.md
	│   └── webdav-docker-guide.md
	└── SQL/
	    └── sql-in-vs-exists-guide.md    # SQL IN 与 EXISTS 的理解

src/content/blog/2026/09/
	├── vmware-download-guide.md              # VMware 下载流程
	└── vmware-pipewire-audio-stutter-fix.md  # VMware Linux PipeWire 音频卡顿解决方案
```

### 相关代码位置
- 内容 schema：`src/content.config.ts`（强制 title/description/pubDate；`tags` 可选、默认空数组）
- 公共外壳：`src/layouts/BaseLayout.astro`（`<html lang="zh-CN">` + BaseHead + Header + slot + Footer；接收 `title / description / image / ogType`）
- 文章路由：`src/pages/[...slug].astro`（用 `post.id` 作 slug，含日期/子目录路径）
- 主页列表：`src/pages/index.astro`（基于 BaseLayout，按 pubDate 降序；文章标题用 `h3`；列表渲染抽到 `PostList`）
- 文章列表组件：`src/components/PostList.astro`（标题 + 描述 + 日期，首页与标签页共用）
- 标签：`src/lib/tags.ts`（`slugifyTag` / `getAllTags` / `getPostsByTag`）；`src/pages/tags/index.astro`（`/tags/`）、`src/pages/tags/[tag].astro`（`/tags/<slug>/`）；schema 的 `tags` 字段在 `src/content.config.ts`
- 文章布局 + Twikoo：`src/layouts/BlogPost.astro`（基于 BaseLayout，`ogType="article"`；渲染 frontmatter title 为 H1；`pubDate`/`heroImage` 可选，缺省不渲染日期区与空封面；`showComments` prop 控制 Twikoo 显示，About 页传 false；Twikoo 容器/脚本用 `IntersectionObserver` 滚动懒加载 + CDN 回退）
- 元信息：`src/components/BaseHead.astro`（`ogType` 控制 og:type；含 twitter:title/description/image；og:image 默认占位图）
- 日期格式：`src/components/FormattedDate.astro`（`zh-CN`，显示如 `2026年9月17日`）
- 字体：`astro.config.mjs`（Atkinson 本地字体 + `fallbacks` 中文栈 `PingFang SC / Hiragino Sans GB / Microsoft YaHei / Noto Sans CJK SC`）；`src/styles/global.css` 的 `body` 用 `var(--font-atkinson)`
- 文章标题间距：`src/styles/global.css`（`.prose h2~h6` 有 `margin-top: 1.5em`，Header 的 `h2` 有独立样式不受影响）
- 站点信息：`src/consts.ts`（SITE_TITLE=furukawanagisadesi 的博客）
- About 页：`src/pages/about.astro`

---

## 三、待办事项（供后续 Agent）

1. **新增文章规范**（完整步骤见第四节「文章检查流程」）：
   - 放 `src/content/blog/YYYY/MM/` 对应日期目录（Docker 类放 `Docker/` 子目录）
   - 文件名用英文 slug（如 `xxx-docker-guide.md`）
   - **必须带 frontmatter**：`title` / `description` / `pubDate`；建议补 `tags`（英文标签，见第 19 项）
   - 如需同日排序，pubDate 可加时间（`2026-08-08 14:30`）
   - 构建验证 + git 提交推送

2. **markdown 格式规范**（新文章遵循，参见第五节）：代码块语言标记、行内代码、中英文空格、结构顺序；完整检查步骤见第四节

3. **可选清理**：`src/assets/` 下 `blog-placeholder-1/2/4/5.jpg` 已无引用，`blog-placeholder-about.jpg` 已无引用（About 页重构后不再用占位图）。**注意 BaseHead 默认 fallback 仍引用 `blog-placeholder-1.jpg`**，删除前需确认

4. **图片管理**：文章内截图请放到 `src/assets/` 并命名有意义（如 `vmware-virtual-audio-offline.png`），文章中用相对路径 `../../../../assets/图片名` 引用（从 `src/content/blog/2026/08/` 出发是 4 层 `../`）。**不要把图片直接放 `src/content/blog/` 下**，也不要放文件名无意义的 `image.png`/`image-1.png`

5. **未决项**：
   - 首页分页：文章多以后可加分页（标签功能已完成，见第 19 项）
   - `immortalwrt-soft-router-guide.md` 与 `blog-launch.md` 的 heroImage 已被注释掉（用户选择不用封面图）
   - Header/Footer 暂无社交链接（用户暂不放）

6. **Twikoo 待办**：
   - 可选：绑定自定义域名（Vercel → Domains 添加 → Cloudflare 加 CNAME 开代理），然后把 `BlogPost.astro` 里的 envId 换成新域名
   - 进入 Twikoo 管理面板（评论框右上角 ⚙️ 齿轮 + 管理密码）可改评论设置（如评论每页条数 `COMMENT_PAGE_SIZE`、开启反垃圾、验证码等）
   - 若改 Vercel 部署配置，务必保持 Vercel Authentication = Disabled

---

## 四、文章检查流程（新增/修改文章照此执行）

> 逐条过一遍；markdown 格式细节见第五节。

1. **文件名**：中文、空格一律改成英文 slug（如 `vmware-pipewire-audio-stutter-fix.md`）；同类文章前缀统一（如 VMware 系列 `vmware-*-guide.md`、`vmware-*-fix.md`）
2. **目录**：放 `src/content/blog/YYYY/MM/` 对应日期目录，Docker 类放 `Docker/` 子目录
3. **frontmatter**：`title` / `description` / `pubDate` 三项齐全；`description` 不要照抄 `title`
4. **正文**：不要重复 H1（页面自动渲染标题）；标题层级连续不错乱
5. **代码块**：全部带语言标记；命令用 `bash`，配置内容与 GUI 步骤用 `text`
6. **行内代码**：路径、命令、端口、IP、软件名、配置项全部加反引号
7. **排版**：中英文之间加空格；`**加粗**` 内部无空格；补全句号；文件末尾留一个换行
8. **图片**：截图放 `src/assets/` 并取有意义的名字，正文用相对路径 `![描述](../../../../assets/图片名)` 引用；不要放 `image.png` 这类无意义名
9. **敏感信息**：服务器地址 `your_ip`、账号 `your_username`、密码 `your_password`
10. **构建验证**：`npm run build` 通过，确认新路由已生成（Astro 缓存问题见第六节坑 1）
11. **提交推送**：`git add -A && git commit && git push origin main`（需代理在线）
12. **线上核对 + 更新本文档**：部署后访问线上页面；回填「当前状态」的文章数、目录结构、最新提交

---

## 五、约定：博客 markdown 统一规范（重要，新文章遵守）

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

## 六、踩坑记录

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
- GitHub 推送依赖代理，地址写在 `~/.gitconfig` 的 `http.proxy` / `https.proxy`（当前为 `http://192.168.211.130:17897`），代理未启动时 push 失败
- 直连也被墙；需先启动代理再 `git push`

### 坑 7: Twikoo「评论失败：0」（CORS preflight 被重定向）
- 现象：提交评论报「评论失败：0」，Console 显示 `Redirect is not allowed for a preflight request`
- 原因：Vercel 的 **Deployment Protection（Vercel Authentication）未关闭**，导致对 OPTIONS 预检请求重定向到 `vercel.com/login`，被浏览器 CORS 拦截；HTTP 状态 0 表示请求根本没到达业务函数
- **修复**：Vercel → 项目 → Settings → Deployment Protection → **Vercel Authentication = Disabled** → Save → Redeploy
- 注意：读取能通但提交失败，就是此原因（读走 GET、提交走 POST+新头触发 preflight）

---

## 七、日常操作速查

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

# Twikoo 管理后台
# 1. 打开任一文章页底部评论区
# 2. 点评论框右上角 ⚙️ 齿轮图标，输入管理密码
# 3. 可改评论每页条数 / 反垃圾 / 验证码等设置
```

---

*本文档由 Agent 生成，供后续 Agent 接力使用。*
