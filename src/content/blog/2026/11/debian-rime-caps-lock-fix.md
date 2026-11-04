---
title: 'Debian 13 GNOME 桌面 Rime 开启 Caps 无法输入大写字母的解决方法'
description: '在 Debian 13 GNOME 下把输入法框架切换为 fcitx5，解决 Rime 开启 Caps Lock 后无法输入大写字母的问题'
pubDate: '2026-11-03'
tags: ['Linux']
---

本文记录在 Debian 13 GNOME 桌面 Rime 开启 Caps 无法输入大写字母的解决过程。

## 操作流程

1. 让 `im-config` 选择 fcitx5

   ```bash
   im-config -n fcitx5
   ```

   生成/更新 `~/.xinputrc`，内容为：

   ```text
   run_im fcitx5
   ```

2. 设置环境变量（持久化）

   创建 `~/.config/environment.d/im-fcitx.conf`：

   ```text
   GTK_IM_MODULE=fcitx
   QT_IM_MODULE=fcitx
   XMODIFIERS=@im=fcitx
   ```

   注意：`environment.d` 只在 `systemd --user` 管理器启动时读取，所以必须重启系统（或确保用户管理器真正退出）才会生效。

3. 完整重启系统

   只注销不够——如果 `systemd` 用户管理器没退出，旧环境（ibus）会继续被复用。
