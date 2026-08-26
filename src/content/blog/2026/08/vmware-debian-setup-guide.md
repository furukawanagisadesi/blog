---
title: "VMware Debian 安装后设置教程"
description: "VMware 17 下给 Debian 换源以及其它设置"
pubDate: "2026-08-25"
---

本文记录 VMware 17 下给 Debian 换源以及其它设置的流程。

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

```text
deb https://mirrors.ustc.edu.cn/debian trixie main contrib non-free non-free-firmware
deb https://mirrors.ustc.edu.cn/debian trixie-updates main contrib non-free non-free-firmware
deb https://mirrors.ustc.edu.cn/debian-security trixie-security main contrib non-free non-free-firmware
```

官方：

```text
deb http://deb.debian.org/debian trixie main contrib non-free non-free-firmware
deb http://deb.debian.org/debian trixie-updates main contrib non-free non-free-firmware
deb http://security.debian.org/debian-security trixie-security main contrib non-free non-free-firmware
```

## 2. 安装 vmtools、openssh

```bash
sudo apt install open-vm-tools open-vm-tools-desktop
sudo apt install openssh-server
sudo systemctl enable --now ssh
```

## 3. terminal 使用代理

```bash
nano ~/.bashrc

export http_proxy="http://192.168.211.130:17897"
export https_proxy="http://192.168.211.130:17897"
```

## 4. 安装 uv 并配置 path

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh

source $HOME/.local/bin/env (sh, bash, zsh)
source $HOME/.local/bin/env.fish (fish)
```
