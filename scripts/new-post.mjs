/**
 * 新建文章骨架。
 *
 * 用法：
 *   npm run new -- <slug> "<标题>"
 *   npm run new -- vmware-nested-vm-guide "VMware 嵌套虚拟化教程"
 *
 * 生成 src/content/blog/YYYY/MM/<slug>.md，front matter 符合 docs/WRITING.md 第 2 节。
 */
import fs from 'node:fs';
import path from 'node:path';

const slug = (process.argv[2] || '').trim();
const title = (process.argv[3] || '').trim();

if (!slug || !title) {
  console.error('用法：npm run new -- <slug> "<标题>"');
  console.error('示例：npm run new -- vmware-nested-vm-guide "VMware 嵌套虚拟化教程"');
  process.exit(1);
}

if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
  console.error(`slug 只能是小写字母、数字与连字符（kebab-case）：${slug}`);
  process.exit(1);
}

const now = new Date();
const pad = (n) => String(n).padStart(2, '0');
const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
const dir = path.join('src', 'content', 'blog', String(now.getFullYear()), pad(now.getMonth() + 1));
const file = path.join(dir, `${slug}.md`);

if (fs.existsSync(file)) {
  console.error(`已存在：${file}`);
  process.exit(1);
}

const body = `---
title: '${title.replace(/'/g, "''")}'
description: ''
pubDate: '${date}'
tags: []
---

<!-- description 必须写成一句话摘要，tags 取值见 docs/WRITING.md 第 7 节受控词表 -->

## 1. 前置条件

实测环境：<系统版本、软件版本>

## 2. 操作步骤

## 3. 验证

## 4. 常见问题
`;

fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(file, body, 'utf8');

console.log(`已创建：${file}`);
console.log('提醒：补齐 description 与 tags（字母序）后再提交。');
