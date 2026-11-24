---
description: 新建博客文章（从素材要点生成初稿并跑 verify，不提交）
---

# 新建博客文章

在 `D:\Syncthing\blog` 新建一篇博客文章。

用户输入：

$ARGUMENTS

## 输入处理

- 若输入是 `<slug> "<标题>"` 形式，直接用这两个值。
- 若输入是素材要点（默认情况），从中提炼 slug（小写 kebab-case 英文；教程用 `*-guide`、排障用 `*-fix`，同系列沿用统一前缀）、中文标题、一句话 description、标签。
- 缺关键信息（实测环境、复现步骤、最终结论）时先一次问清，不要编造。

## 步骤

1. 读 `docs/WRITING.md`，按第 1、2、8 节生成骨架：`npm run new -- <slug> "<标题>"`。
2. 填 front matter：五个键、单引号、顺序固定；`description` 不得照抄 title；`tags` 从第 7 节受控词表里选、字母序；新文章不写 `updatedDate`。
3. 写正文：从 `## 1.` 起，正文不出现 H1；编号用阿拉伯数字、层级不跳、标题末尾不加标点；代码块必须带语言标记；路径、命令、端口、IP、软件名用反引号；加粗只给界面元素和警示词；中英文之间加空格。
4. 图片：缺图时在对应位置留 `<!-- TODO 截图：<建议文件名>.png -->`，不要猜路径；项目里已有的截图可复制到 `src/assets/` 并按语义重命名。
5. 敏感信息用 `your_ip` / `your_username` / `your_password` 占位。
6. 跑 `npm run fix:md` 和 `npm run fmt:frontmatter`，再跑 `npm run verify`，全过才算完成。
7. 报告：文件路径、最终标题、tags、剩余 TODO（缺图/待确认信息），并提示在 `http://localhost:4321/blog/` 预览。

## 禁止

- 不要 `git commit`，不要 `git push`。
- 不新增 front matter 键，不用中文文件名，不写“本文将介绍……”这类空话。
