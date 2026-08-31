---
title: "VMware Debian 安装后设置教程"
description: "VMware 17 下给 Debian 换源以及其它设置"
pubDate: "2026-08-25"
---

本文记录 VMware 17 下给 Debian 13 换源以及其它设置的流程。

## 1. 换源

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

## 2. 安装 vmtools、openssh

```bash
sudo apt install open-vm-tools open-vm-tools-desktop
sudo apt install openssh-server
sudo systemctl enable --now ssh
```

## 3. apt 全局代理

```bash
nano /etc/apt/apt.conf.d/proxy.conf
# 文件底部添加
Acquire::http::Proxy "http://IP地址:端口号";
Acquire::https::Proxy "http://IP地址:端口号";
```

## 4. 安装 uv 并配置 path

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh

source $HOME/.local/bin/env (sh, bash, zsh)
source $HOME/.local/bin/env.fish (fish)
```

## 5. 为 root 用户增加补全功能

```bash
su -
nano ~/.bashrc
# 文件底部添加
if [ -f /etc/bash_completion ]; then
    . /etc/bash_completion
fi
```

## 6. 将用户添加至 sudo

```bash
su -
adduser 用户名 sudo
```

## 7. 将用户从 sudo 删除

```bash
su -
gpasswd -d 用户名 sudo
```
