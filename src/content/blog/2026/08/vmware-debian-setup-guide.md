---
title: 'VMware Debian 安装后设置教程'
description: 'VMware 17 下 Debian 13 的换源与常用设置'
pubDate: '2026-08-25'
updatedDate: '2026-11-23'
tags: ['Linux', 'VMware']
---

本文记录 VMware 17 下给 Debian 13 换源以及其它设置的流程。

## 1. 将用户添加至 sudo

```bash
su -
adduser 用户名 sudo
```

添加后需要重启虚拟机或者注销重新登录。

## 2. 换源

换源前建议先备份源文件。

```bash
sudo cp /etc/apt/sources.list /etc/apt/sources.list.bak
```

修改源：

```bash
sudo nano /etc/apt/sources.list
```

USTC 中科大：

```text
deb https://mirrors.ustc.edu.cn/debian/ trixie main contrib non-free non-free-firmware
# deb-src https://mirrors.ustc.edu.cn/debian/ trixie main contrib non-free non-free-firmware

deb https://mirrors.ustc.edu.cn/debian/ trixie-updates main contrib non-free non-free-firmware
# deb-src https://mirrors.ustc.edu.cn/debian/ trixie-updates main contrib non-free non-free-firmware

deb https://mirrors.ustc.edu.cn/debian/ trixie-backports main contrib non-free non-free-firmware
# deb-src https://mirrors.ustc.edu.cn/debian/ trixie-backports main contrib non-free non-free-firmware

deb https://mirrors.ustc.edu.cn/debian-security/ trixie-security main contrib non-free non-free-firmware
# deb-src https://mirrors.ustc.edu.cn/debian-security/ trixie-security main contrib non-free non-free-firmware
```

官方：

```text
deb http://deb.debian.org/debian trixie main contrib non-free non-free-firmware
deb http://deb.debian.org/debian trixie-updates main contrib non-free non-free-firmware
deb http://security.debian.org/debian-security trixie-security main contrib non-free non-free-firmware
```

> trixie 为 Debian 13 的代号

## 3. 安装 vmtools、openssh

```bash
sudo apt update
sudo apt install open-vm-tools open-vm-tools-desktop
sudo apt install openssh-server
sudo systemctl enable --now ssh
```

## 4. 安装 git

```bash
sudo apt install git
nano ~/.gitconfig
```

在文件中填写代理地址：

```text
[http]
proxy = http://your_ip:port
```

## 5. 安装 Rime 输入法

1. 安装 `ibus-rime`：

   ```bash
   sudo apt install ibus-rime
   ```

2. 重启 IBus：

   ```bash
   ibus restart
   ```

3. 添加 RIME 为输入源：

   - 打开系统 **“设置”** → **“键盘”**（或“区域与语言”）。
   - 在“输入源”部分点击 **“+”** 号。
   - 选择 **“汉语 (中国)”**，然后找到并添加 **“中文 (Rime)”**。

4. 安装雾凇拼音（Rime 的配置目录 `~/.config/ibus/rime/`）：

   ```bash
   # 雾凇拼音
   git clone --depth 1 https://github.com/iDvel/rime-ice.git ~/下载/rime-ice
   cp -r ~/下载/rime-ice/* ~/.config/ibus/rime/
   ```

5. 自定义拼音方案：

   ```bash
   nano ~/.config/ibus/rime/default.custom.yaml
   ```

   在文件内填写：

   ```yml
   patch:
     schema_list:
       - schema: rime_ice # 雾凇拼音
     menu/page_size: 9 # 候选词数量
   ```

## 6. 安装插件

1. 安装扩展管理器：

   ```bash
   sudo apt install gnome-shell-extension-manager
   ```

2. 安装 Dash to Dock：

   ```text
   在 ExtensionManager 的「浏览」中搜索 Dash to Dock
   ```
