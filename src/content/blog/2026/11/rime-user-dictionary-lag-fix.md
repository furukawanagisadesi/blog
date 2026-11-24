---
title: 'Rime 输入法词汇不跟手解决方案'
description: 'Rime 选词后用户词不立即生效、需按 Esc 才出现的原因与 lua 补丁解决方案。'
pubDate: '2026-11-06'
updatedDate: '2026-11-24'
tags: ['Rime']
---

> 本文记录 Rime 输入法（雾凇拼音 / 白霜拼音）词汇不跟手的解决流程。

## 1. 问题现象

在 Rime 中选定一个词（例如「你好」）后，**立刻**再次输入同样的编码：

- 候选项没有立即带上 `*`（用户词标记）；
- 也没有立即靠前，感觉「没有记忆」；
- 但按一下 **Esc**（或切换窗口）之后，`*` 就出现了，调频也生效了。

> `*` 是「用户词标记」、`∞` 是「整句联想标记」，由 `lua_filter@*user_dict_mark` 提供
> （移植自白霜的 `lua/is_in_user_dict.lua`）。白霜默认挂载该过滤器，雾凇默认不挂载；
> 另外两份同名 `is_in_user_dict.lua` 实现并不同（雾凇版靠开关、且没有 `∞`），
> 所以本配置包改用单独命名的 `user_dict_mark.lua`。本文的配置包已包含该过滤器。

## 2. 根因

并非输入法没有记忆，而是**用户词典的 LevelDB 事务提交延迟**。

Rime 把用户词写进一个事务里，默认要等到：

- 下一次事务切换；
- 会话结束；
- 按下未被处理的按键（例如 Esc）。

才真正提交。提交之前，下一次查词看不到刚写入的词条，所以表现为「不跟手」。

## 3. 解决方案

做法是**每次上屏后，立即提交用户词典事务**。

关键点：

1. `Memory` 在构造时会注册 `commit_notifier`；
2. `Memory::OnCommit` 会先调用 `StartSession()`；
3. `StartSession()` 内部是 `UserDictionary::NewTransaction()`：
   - 如果当前有事务，先 `CommitTransaction()`（提交上一个事务）；
   - 再 `BeginTransaction()` 开新事务；
4. 我们额外创建一个 `Memory` 实例：
   - 它和主方案共享同一个 `UserDictionary` 与底层 LevelDB（`UserDictionaryComponent::db_pool_` 按词典名共享 `Db`）；
   - 它**没有设置 `memorize` 回调**，所以 `LuaMemory::Memorize()` 直接返回 `false`，**不会重复写用户词**；
   - 但它的 `OnCommit` 同样会触发事务切换，从而把主方案刚写入的词条提交掉；
5. 再在 `commit_notifier` 的 **group 1** 回调里调用 `finish_session()`：
   - group 0 是默认组，主方案 `Memory::OnCommit` 在其中；
   - group 1 在 group 0 之后执行，确保主方案已经写完本次词条，再执行提交。

最终效果：选完词后，下一次输入无需按 Esc 就能看到 `*`。至于是否**排到前面**，取决于排序策略——本配置包用 `user_phrase_order` 按累计次数排序（默认 `min_count: 2`，选满 2 次才置顶）。

## 4. 改动清单

共两处：新增一个 lua 翻译器，再挂到方案里。合起来就是上文说的「配置包」。

### 4.1 新增 `lua/commit_userdb.lua`

路径：

- Windows：`%appdata%\Rime\lua\commit_userdb.lua`
- Linux（iBus）：`~/.config/ibus/rime/lua/commit_userdb.lua`
- Linux（Fcitx5）：`~/.local/share/fcitx5/rime/lua/commit_userdb.lua`

```lua
-- 路线一：上屏后立即提交用户词典事务
--
-- 原理：
--   Rime 的用户词写在 LevelDB 事务里，默认要等到下一次事务切换
--   或会话结束才提交，所以刚选完的词下一次输入还看不到。
--   Memory 构造时会注册 commit_notifier，它的 OnCommit 会先
--   StartSession()（提交上一个事务、开新事务），再写入本次词条。
--   这里额外建一个 Memory（与主方案共享同一个 UserDictionary/DB），
--   并在 commit_notifier 的最后一个 group 里调用 finish_session()，
--   把主方案刚写入的词条立即提交。
--
--   这个 Memory 没有设置 memorize 回调，因此不会重复写用户词。

local M = {}

function M.init(env)
    -- 第三个参数 "translator" 对应方案里的 translator/user_dict 配置。
    -- 包 pcall：引擎版本差异导致 Memory 构造失败时，只让本插件失效，
    -- 不要拖垮整个 translator 的初始化。
    local ok, memory = pcall(function()
        return Memory(env.engine, env.engine.schema, "translator")
    end)
    if not ok or not memory then
        return
    end
    env.commit_memory = memory

    -- group 1：在所有默认 group 0 的 commit 回调之后执行，
    -- 保证主方案 Memory::OnCommit 已经写完本次词条。
    pcall(function()
        env.engine.context.commit_notifier:connect(function(ctx)
            if env.commit_memory then
                pcall(function()
                    env.commit_memory:finish_session()
                end)
            end
        end, 1)
    end)
end

function M.func(input, seg, env)
    -- 本翻译器不产出候选，只借用 init 里的 Memory 提交事务
end

return M
```

### 4.2 修改方案补丁 `rime_ice.custom.yaml`

> 白霜拼音对应 `rime_frost.custom.yaml`，雾凇拼音对应 `rime_ice.custom.yaml`，两者写法完全相同。

在 `patch:` 下追加（放在文件末尾即可）：

```yml
# 上屏后立即提交用户词典事务
'engine/translators/@after last': lua_translator@*commit_userdb
```

完整文件示例：

```yml
patch:
  # 上屏后立即提交用户词典事务
  'engine/translators/@after last': lua_translator@*commit_userdb
```

## 5. 部署

在输入法状态栏或托盘中点击「重新部署」即可；Windows Weasel 也可直接运行：

```powershell
& "C:\Program Files\Rime\weasel-0.17.4\WeaselDeployer.exe" /deploy
```

## 6. 验收

1. 选一个**用户词典里没有的新词**并上屏；
2. **不要按 Esc**；
3. 立刻再输入同一个编码；
4. 预期：候选项**立即出现**并带 `*`（说明事务已提交，不用等 Esc）；
5. 若配置了 `user_phrase_order/min_count: 2`（本包默认），置顶要选第 2 次才生效——只选 1 次时「立即出现」即算通过，「没靠前」不算失败。

## 7. 延伸：用户词的简拼输入

上面的补丁只解决「上屏后立即可见」，不解决「简拼能不能查到用户词」。

`wmgs` 敲不出刚上屏过的「我们公司」，跟事务提交无关：`script_translator` 是先用词库的 prism 切分音节，再拿切分结果去查用户词典；用户词典里的编码（`wo men gong si`）不在 prism 里，所以简拼根本走不到查用户词那一步。这是 librime 的原生限制，改 `algebra` 也绕不过去。

本配置包用单独的 `user_shortcut.lua` 插件补上这块：直接遍历用户词典、读上屏时记下的 `custom_code`，在 Lua 层做首字母匹配。它和本文的 `commit_userdb.lua` 互不依赖，可以同时启用。

实现原理、部署与验收见：[Rime 用户词简拼输入教程](https://furukawanagisadesi.github.io/blog/2026/11/rime-user-shortcut-guide/)。
