# 评论区加载兜底 + Twikoo 资源自托管设计

日期：2026-10-28
状态：已确认

## 意图

线上实测确认评论区有两个问题：

1. `unpkg.com` + `*.vercel.app` 均为境外依赖，大陆直连时接口约 27 秒才超时，期间一直转圈。
2. Twikoo 1.7.20 请求失败时 `reject(xhr.status)` 抛的是数字 `0`，上层取 `e.message` 得到 `undefined`，错误被吞掉，最终显示「没有评论」；同时 `showExpand` 初始为 `true`，于是「查看更多」也一起出现。

本轮解决「慢得没有反馈」和「假空状态」，不解决 Vercel 域名本身的可达性。

## 目标

- Twikoo 的 JS/CSS 改为同源自托管，去掉 unpkg 依赖。
- 评论请求 15 秒仍未成功时，用明确的提示替换转圈，并提供重试。
- 识别 Twikoo 的失败态（「没有评论」+「查看更多」同时出现），立即显示错误提示，隐藏该假状态。
- 成功后自动恢复评论区，不刷新页面。

## 非目标

- 不迁移 Vercel 后端、不绑域名、不改 MongoDB。
- 不升级 Twikoo 2.x（需同时升级服务端，另立任务）。
- 不在前端强行中止底层 XHR；15 秒只是 UI 提示，旧请求结果会被忽略。
- 不改变评论数据、路径（仍用当前 `location.pathname`）和登录方式。

## 方案

采用「同源自托管 + 容器外状态面板 + 成功回调」：

- 资源固定为 `public/vendor/twikoo/1.7.20/`（`twikoo.min.js`、`twikoo.css`、`LICENSE`、`README.md`），版本与线上一致，SHA256 已和 unpkg / jsdelivr 双侧核对一致。
- 不给 Twikoo 打补丁、不 fork 压缩包；用 Twikoo 自带的 `onCommentLoaded` 选项作为成功信号，用 `MutationObserver` 识别失败态。
- 失败提示放在 `#twikoo` 外部的兄弟节点，避免被 Vue 挂载覆盖。

### 状态机

| 状态 | 触发 | 表现 |
|---|---|---|
| 加载中 | 滚动到评论区附近，资源加载完成并 `init` | Twikoo 自带 spinner |
| 慢 | 15 秒内未收到 `onCommentLoaded` | 隐藏 `#twikoo`，显示「评论加载较慢，请检查网络或代理」+「重试」 |
| 失败 | DOM 出现可见的 `.tk-comments-no` + `.tk-expand`，或可见 `.tk-comments-error` | 立即显示「评论加载失败，请检查网络或代理」+「重试」 |
| 成功 | `onCommentLoaded` 触发 | 隐藏提示，恢复 `#twikoo` |

### 重试

- 清空 `#twikoo`，重新调用 `twikoo.init`，重置计时器。
- 用递增的 `attempt` 代次标记每次初始化；旧实例迟到的 `onCommentLoaded` 不生效，避免把新一次加载误判为成功。

## 具体决策

| 位置 | 行为 |
|---|---|
| `src/layouts/BlogPost.astro` | 资源地址改为 `${base}/vendor/twikoo/1.7.20/...`；删除 unpkg → jsdelivr 回退；`init` 增加 `onCommentLoaded`；新增状态面板与重试逻辑 |
| `public/vendor/twikoo/1.7.20/` | 自托管资源，附版本来源与许可证 |
| 样式 | 状态面板居中、弱化文字、accent 按钮；`#twikoo.is-hidden { display: none }` |
| 移动端 | 不变；面板随正文宽度自适应 |

## 验证结果

- `npm run build` 通过，29 页；产物含 `dist/vendor/twikoo/1.7.20/`，文章页对 unpkg / jsdelivr 的引用为 0。
- 自托管资源加载：本地 dev 下 CSS 8～26ms、JS 21～39ms（此前 unpkg 为 0.7～3.9s）。
- 正常网络（走代理）：约 2.5s 完成 Twikoo 初始化，约 4.6s 显示「没有评论」，状态面板保持隐藏，**没有**「查看更多」。
- 立即失败（Edge CDP 将 Vercel 请求直接 `ConnectionRefused`）：1.84s 显示「评论加载失败」，假「没有评论 + 查看更多」被隐藏；5 秒后点「重试」，面板收起、评论区回到加载态，失败后 0.35s 再次显示失败提示。
- 请求一直挂起（CDP 暂停 Vercel 请求）：16.76s 显示「评论加载较慢」，提示出现后不再显示 Twikoo 的假空状态。
- 无代理真实网络：XHR 约 16s 报错，失败提示随假状态一起出现，不再干转到 27 秒。
- 移动端沿用原有 `max-width`，390px 无横向溢出。

## 实施顺序

1. 落自托管资源并切换引用。
2. 加状态面板、守卫与重试。
3. 构建 + 三种网络场景验证。
4. 更新 `HANDOVER.md` 与设计文档状态。
