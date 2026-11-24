---
title: 'Rime 用户词简拼输入教程'
description: '上屏过的用户词打简拼出不来，用 librime-lua 读取用户词典真实编码补上首字母匹配。'
pubDate: '2026-11-24'
tags: ['Rime']
---

雾凇拼音用久了会遇到一个别扭的地方：词库自带的词可以打简拼，自己上屏过的词却不行。比如「我们公司」上屏过一次，全拼 `womengongsi` 能出，简拼 `wmgs` 死活不出。

这篇写问题原因和解决过程。实测环境为 Windows + Weasel 0.17.4（librime 1.13.1），雾凇拼音 `rime_ice`。

## 1. 问题现象

以下操作都在同一份用户词典上：

- 全拼 `womengongsi` → 能出「我们公司」，带 `*`（用户词标记）；
- 简拼 `wmgs` → 没有候选；
- 混输 `womengs` → 也没有；
- 换成词库里的词，例如「文件」：`wj` 能出。

区别只在「这个词是谁的」：词库词支持简拼，用户词不支持。

这和「选词后不立即生效」是两回事。后者的原因是用户词典事务提交延迟，补丁叫 `commit_userdb`；本文的问题在词条已经落盘、全拼可见的前提下依然存在。

## 2. 根因

`script_translator` 不是拿输入串直接去用户词典里模糊匹配的。它的顺序是：

1. 用词库的 prism（`rime_ice.prism.bin`）把输入切成音节图；
2. 按切分结果分别查词库和用户词典。

用户词确实写进了 `UserDictionary`，key 形如 `"wo men gong si \t我们公司"`。但这条编码只存在于用户词典，不在词库 prism 里：

- 全拼 `womengongsi` 能切成 `wo/men/gong/si`，再按完整编码查得到；
- 简拼 `wmgs` 切不出合法音节，用户词典压根不会被查询。

方案里的 `algebra`（`abbrev/^([a-z]).+$/$1/`）只作用于词库编译，不会给用户词典补首字母索引。librime 也没有为简拼维护反向索引，官方 issue [rime/librime#72](https://github.com/rime/librime/issues/72) 里说明过这一点。

## 3. 方案思路

用户词典里已经存了上屏时的真实编码，没必要再从汉字反推首字母。思路是：

1. 用 `Memory` 遍历用户词典，读每条词条的 `custom_code`；
2. 把编码按空格切成音节，在 Lua 层做「每个音节取前缀」的匹配；
3. 只有至少一个音节是缩写时才产出候选，全拼交给原生 `script_translator`；
4. 候选类型仍然标成 `user_phrase`，这样 `*` 标记、选词次数、置顶逻辑全部照旧。

## 4. 实现要点

### 4.1 读取用户词典

```lua
env.mem = Memory(env.engine, env.engine.schema, "translator")
env.mem:user_lookup("", true)   -- 空串前缀 = 取全量
for entry in env.mem:iter_user() do
    local text = entry.text
    local code = entry.custom_code   -- 例如 "wo men gong si "
end
```

两个细节：

- `iter_user()` 遍历的是上一次 `user_lookup` 的结果，裸调用拿不到东西；
- 用户词典 key 带尾随空格，`custom_code` 也可能带，必须 trim。

### 4.2 建索引

建索引时做几项过滤，避免脏数据参与匹配：

- 编码只接受 `^[a-z ]+$`，英文等其他语种跳过；
- 音节数必须等于字数（`utf8.len(text)`），对不齐的跳过；
- 同一个词可能有多条编码（不同读音），按 `commit_count` 留次数高的；
- 最终按 `commit_count` 降序排序，次数相同按文本排序，保证输出稳定。

条目里预存音节表、首字母串和总长度，匹配时先用长度和首字母快速过滤。

### 4.3 前缀匹配

对每个输入，尝试拆成「每个音节的前缀」：

```text
编码  wo men gong si
全拼  wo men gong si   → 全部完整，本插件不产出
简拼  w  m   g    s    → 有缩写，产出
混输  wo m   g    s    → 有缩写，产出
```

实现用 DFS：从第一个音节开始，依次尝试 1 到该音节全长的前缀，递归到下一个音节；能恰好用完整个输入就算命中，同时记录每个音节消耗了几个字符。

命中后再检查一遍：如果所有音节的消耗长度都等于原音节长度，说明这是全拼，直接放弃，交给原生翻译器。

### 4.4 产出候选

```lua
local cand = Phrase(env.mem, "user_phrase", seg.start, seg._end, entry):toCandidate()
cand.quality = env.quality
yield(cand)
```

`Phrase` 的 `quality` 初值来自 `entry.weight`（大约 `-14`），不覆盖的话候选会沉到词库词后面。`user_phrase` 这个类型则保证：

- `user_dict_mark` 过滤器给它标 `*`；
- 上屏后 `commit_count` 正常累加；
- 按次数置顶的 `user_phrase_order` 也认它。

### 4.5 索引何时重建

首次输入时构建索引。之后监听 `commit_notifier` 和 `delete_notifier`（group 1），上屏或删词后标脏，下一次按键重建。

这样新词上屏一次就能立刻用简拼，不需要重新部署。用 group 1 是为了排在主方案 `Memory::OnCommit` 之后，避免在事务提交途中重建。

## 5. 配置与部署

### 5.1 放好 lua 文件

把 `user_shortcut.lua` 放进用户目录的 `lua/` 下：

```text
Windows  %APPDATA%\Rime\lua\user_shortcut.lua
Linux    ~/.config/ibus/rime/lua/user_shortcut.lua
```

### 5.2 挂载到方案

在 `rime_ice.custom.yaml` 的 `patch:` 下追加：

```yml
  "engine/translators/+":
    - lua_translator@*user_shortcut
  user_shortcut:
    quality: 1
    max_candidates: 10
```

这里用 `engine/translators/+`（列表追加），不用 `@before` / `@after` 下标。`@before last` 这类键一个文件里只能出现一次，已经被人占了再写就会覆盖；下标在升级方案后也容易错位。

### 5.3 部署

只改 YAML 时，重新部署即可：

```bash
& "C:\Program Files\Rime\weasel-0.17.4\WeaselDeployer.exe" /deploy
```

Linux 用输入法状态栏菜单里的 `Deploy`。

**注意**：改过 Lua 文件后，只部署不重启是没用的。librime-lua 在服务进程启动时 `require` 一次并缓存模块，必须重启输入法服务：

```bash
Stop-Process -Name WeaselServer -Force
Start-Process "C:\Program Files\Rime\weasel-0.17.4\WeaselServer.exe"
```

Linux 对应 `pkill -x ibus-engine-rime` 再 `ibus engine rime`。

## 6. 验证

部署并重启后，依次检查：

1. `wmgs` → 出现「我们公司」，注释带 `*`；
2. `womengongsi` 全拼 → 只出现原来那一条，没有重复候选；
3. `womengs` 混输 → 出现「我们公司」；
4. `wj` → 文件，`wjj` → 文件夹（词库词的回归检查）；
5. 常用全拼 `ni`、`wo`、`hao` 下没有莫名冒出的简拼候选；
6. 用全拼选一个新词上屏一次，紧接着打它的首字母，应当立刻能出。

如果简拼完全没反应，先确认 Lua 链路是否正常：

```bash
ls -l /usr/lib64/rime-plugins/librime-lua.so
grep -c "error creating" "$(readlink -f /tmp/rime.ibus.INFO)"
```

Windows 看 `%TEMP%\rime.weasel` 下最新的日志，搜索 `LuaTranslation::Next error`、`user_shortcut`。

## 7. 可调参数

| 参数 | 默认 | 说明 |
| --- | --- | --- |
| `quality` | 1 | 简拼候选权重；词库候选通常低于 1，固定短语在 90 以上 |
| `max_candidates` | 10 | 单次最多产出几个简拼候选 |

嫌简拼候选太多、抢了词库词的位置时，把 `max_candidates` 调小，或把 `quality` 调成负数让它们排在后面。代码里还有单个词最多 16 个音节的固定上限。

## 8. 已知限制

- 只覆盖你自己上屏过的词，词库里没有、你也没打过的词仍然只能打全拼；
- 编码必须与字数对齐，对不齐的条目不参与简拼；
- 多音字只认用户词典里存下的那条编码，不读其他读音；
- 简拼与全拼分别记次数，不合并统计；
- 用户词特别多（上万条）时，首次输入建索引可能有一次可感知的延迟。

## 9. 常见问题

### 9.1 配置好了但一点变化都没有

先查两件事：`librime-lua` 是否安装并加载，以及改完 Lua 后有没有重启输入法服务。两者任一不满足，插件都会被静默跳过，界面上完全看不出异常。

### 9.2 全拼出现重复候选

正常情况下不会。插件在命中后会检查是否所有音节都是完整拼写，是则直接放弃。如果仍然重复，检查匹配函数是否把「全拼」误判成了「有缩写」，或同一条用户词被建了两次索引（按文本去重）。

### 9.3 新词不能立刻简拼

索引在 `commit_notifier` 触发后标脏、下一次按键重建。如果新词迟迟不出现，先确认脚本真的挂上了（看部署后 `build/rime_ice.schema.yaml` 的 `translators` 列表），再确认没有别的翻译器先报错导致 Lua 翻译器没被创建。

### 9.4 简拼候选排在很后面

`Phrase` 的默认权重很低，必须在产出后覆盖 `cand.quality`。如果改了参数仍无变化，多半是改了 Lua 没有重启服务，跑的还是旧模块。
