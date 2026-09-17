---
title: "VMware Debian 安装后设置教程"
description: "VMware 17 下 Debian 13 的换源与常用设置"
pubDate: "2026-08-25"
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

```bash
deb https://mirrors.ustc.edu.cn/debian/ trixie main contrib non-free non-free-firmware
deb-src https://mirrors.ustc.edu.cn/debian/ trixie main contrib non-free non-free-firmware

deb https://mirrors.ustc.edu.cn/debian/ trixie-updates main contrib non-free non-free-firmware
deb-src https://mirrors.ustc.edu.cn/debian/ trixie-updates main contrib non-free non-free-firmware

deb https://mirrors.ustc.edu.cn/debian/ trixie-backports main contrib non-free non-free-firmware
deb-src https://mirrors.ustc.edu.cn/debian/ trixie-backports main contrib non-free non-free-firmware

deb https://mirrors.ustc.edu.cn/debian-security/ trixie-security main contrib non-free non-free-firmware
deb-src https://mirrors.ustc.edu.cn/debian-security/ trixie-security main contrib non-free non-free-firmware
```

官方：

```bash
deb http://deb.debian.org/debian trixie main contrib non-free non-free-firmware
deb http://deb.debian.org/debian trixie-updates main contrib non-free non-free-firmware
deb http://security.debian.org/debian-security trixie-security main contrib non-free non-free-firmware
```

> trixie 为 Debian 13 的代号

## 3. 代理设置

```bash
sudo nano /etc/environment
# 文件内填写
http_proxy="http://IP地址:端口号"
https_proxy="http://IP地址:端口号"
all_proxy="socks5://IP地址:端口号"
no_proxy="localhost,127.0.0.1,::1"
```

## 4. 安装 vmtools、openssh

```bash
sudo apt update
sudo apt install open-vm-tools open-vm-tools-desktop
sudo apt install openssh-server
sudo systemctl enable --now ssh
```

## 5. 安装 fcitx5-rime 输入法

```bash
sudo apt install fcitx5 fcitx5-rime fcitx5-chinese-addons fcitx5-config-qt
sudo apt install gnome-shell-extensions
```

安装完成后：

1. 打开 `https://extensions.gnome.org/`，搜索并安装 input method panel
2. 打开 gnome-shell-extensions，启用 input method panel
3. 在**优化 → 开机启动程序**里添加 fcitx5，然后重启虚拟机
4. 重启后在托盘图标里切换到「朙月拼音·简化字」，重新部署即可输入简体中文
