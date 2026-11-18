/**
 * front matter 机器化统一（docs/WRITING.md 第 2 节）。
 *
 * 做的事，全部是机械变换，不改正文：
 *   1. 去掉注释掉的键行（如 `# updatedDate: '...'`）
 *   2. 键顺序固定为 title → description → pubDate → updatedDate → tags
 *   3. 标量值统一单引号，日期统一 YYYY-MM-DD
 *   4. tags 数组统一行内写法并按字母序排序
 *
 * 用法：npm run fmt:frontmatter          # 改写文件
 *       npm run fmt:frontmatter -- --dry # 只报告不写
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.join('src', 'content', 'blog');
const ORDER = ['title', 'description', 'pubDate', 'updatedDate', 'tags'];
const dry = process.argv.includes('--dry');

function walk(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else if (e.name.endsWith('.md')) out.push(p);
  }
  return out;
}

function unquote(v) {
  const t = v.trim();
  if (t.length >= 2 && ((t.startsWith("'") && t.endsWith("'")) || (t.startsWith('"') && t.endsWith('"')))) {
    return t.slice(1, -1);
  }
  return t;
}

function normalizeDate(v) {
  const t = unquote(v).replace(/\//g, '-');
  const m = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (!m) return null;
  return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
}

function formatFrontMatter(lines, file) {
  const fields = new Map();
  const problems = [];
  const dropped = [];

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) continue;
    if (/^#/.test(line)) {
      dropped.push(line);
      continue;
    }
    const m = line.match(/^([A-Za-z_][\w-]*)\s*:\s*(.*)$/);
    if (!m) {
      problems.push(`无法解析的行：${line}`);
      continue;
    }
    fields.set(m[1], m[2]);
  }

  const out = [];
  for (const key of ORDER) {
    if (!fields.has(key)) continue;
    const value = fields.get(key);

    if (key === 'tags') {
      const inner = value.trim().replace(/^\[/, '').replace(/\]$/, '');
      const tags = inner
        .split(',')
        .map((s) => unquote(s))
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b, 'en'));
      out.push(`tags: [${tags.map((t) => `'${t}'`).join(', ')}]`);
      continue;
    }

    if (key === 'pubDate' || key === 'updatedDate') {
      const d = normalizeDate(value);
      if (!d) {
        problems.push(`${key} 日期格式异常：${value}`);
        out.push(`${key}: ${value}`);
      } else {
        out.push(`${key}: '${d}'`);
      }
      continue;
    }

    out.push(`${key}: '${unquote(value)}'`);
  }

  for (const key of fields.keys()) {
    if (!ORDER.includes(key)) problems.push(`未知键（未处理，原样保留在末尾）：${key}`);
  }
  for (const key of fields.keys()) {
    if (!ORDER.includes(key)) out.push(`${key}: ${fields.get(key)}`);
  }

  return { lines: out, problems, dropped };
}

const files = walk(ROOT);
let changed = 0;

for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (!m) {
    console.log(`✗ 无 front matter：${file}`);
    continue;
  }
  const original = m[1].split(/\r?\n/);
  const { lines, problems, dropped } = formatFrontMatter(original, file);
  const rebuilt = `---\n${lines.join('\n')}\n---\n`;
  const rest = text.slice(m[0].length);
  const next = rebuilt + rest;

  const notes = [];
  if (next !== text.replace(/\r\n/g, '\n')) notes.push('改写');
  if (dropped.length) notes.push(`删除注释行 ${dropped.length} 处`);
  if (problems.length) notes.push(`需人工确认 ${problems.length} 处`);

  if (next !== text.replace(/\r\n/g, '\n')) {
    changed++;
    if (!dry) fs.writeFileSync(file, next, 'utf8');
    console.log(`✓ ${file} — ${notes.join('，')}`);
  }
  for (const p of problems) console.log(`  ! ${file}: ${p}`);
}

console.log(`\n${dry ? '[dry] 将改写' : '已改写'} ${changed} / ${files.length} 篇`);
