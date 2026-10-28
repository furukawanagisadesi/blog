# Twikoo 1.7.20（自托管）

- 来源：`https://unpkg.com/twikoo@1.7.20/dist/`（与 `https://cdn.jsdelivr.net/npm/twikoo@1.7.20/dist/` 逐字节一致）
- 许可证：MIT，见同目录 `LICENSE`
- 用途：避免 `unpkg.com` 境外 CDN 依赖；文章页从同源 `/vendor/twikoo/1.7.20/` 加载

## 文件校验（SHA256）

| 文件 | 大小 | SHA256 |
|---|---|---|
| `twikoo.min.js` | 506108 | `3501a530dff3cd4bcabff71dc43313b1a7a01a2eb3eb150576d55358ad03251f` |
| `twikoo.css` | 40272 | `4253073f029ff8d2927f60657ff04cb7ab9dfff64f0e08541b6a2d4982f07be2` |

升级时同步替换两个文件，并更新本表与 `src/layouts/BlogPost.astro` 中的版本目录名。
