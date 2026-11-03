---
title: 'VMware Debian 安装后设置教程'
description: 'VMware 17 下 Debian 13 的换源与常用设置'
pubDate: '2026-08-25'
updatedDate: '2026-11-03'
tags: ['VMware', 'Linux']
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

## 3. 代理设置（可选）

```bash
sudo nano /etc/environment
# 文件内填写
http_proxy="http://IP地址:端口号"
https_proxy="http://IP地址:端口号"
all_proxy="socks5://IP地址:端口号"
HTTP_PROXY="http://IP地址:端口号"
HTTPS_PROXY="http://IP地址:端口号"
ALL_PROXY="socks5://IP地址:端口号"
no_proxy="localhost,127.0.0.1,::1,网关地址前3段.0/24,.local"
NO_PROXY="localhost,127.0.0.1,::1,网关地址前3段.0/24,.local"

sudo nano /etc/sudoers.d/proxy
# 文件内填写
Defaults env_keep += "http_proxy https_proxy all_proxy no_proxy HTTP_PROXY HTTPS_PROXY ALL_PROXY NO_PROXY"
# 设置文件为只读
sudo chmod 440 /etc/sudoers.d/proxy
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
sudo apt install fcitx5-module-cloudpinyin
sudo apt install gnome-shell-extensions # 可选，用于 gnome 桌面
```

安装完成后：

1. 打开 `https://extensions.gnome.org/`，搜索并安装 input method panel（可选）
2. 打开 gnome-shell-extensions，启用 input method panel（可选）
3. 在**优化 → 开机启动程序**里添加 fcitx5，然后重启虚拟机（可选）
4. 重启后在 fcitx5 配置中添加`中州韵`，切换并等待它部署完成
5. 控制台输入命令：

```bash
cd ~/.local/share/fcitx5/rime/
nano default.custom.yaml
```

在文件内填写：

```yml
patch:
  schema_list:
    - schema: luna_pinyin_simp # 朙月拼音·简化字（简体）
  menu/page_size: 9 # 候选词数量
```

6. 最后点击 Rime 托盘图标，然后点「重新部署」。

## 6. 安装雾凇拼音（可选）

```bash
# 备份现有配置（如果有自造词之类）
mkdir -p ~/.local/share/fcitx5/rime.bak && cp -r ~/.local/share/fcitx5/rime/* ~/.local/share/fcitx5/rime.bak/ 2>/dev/null

# 拉取方案（仓库较大，建议浅克隆；用户词库在单独仓库不要 clone）
git clone --depth 1 https://github.com/iDvel/rime-ice.git /home/debian/下载/rime-ice

# 把方案文件复制进 rime 配置目录
cp -r /home/debian/下载/rime-ice/* ~/.local/share/fcitx5/rime/
```

然后修改自定义配置：

```bash
nano ~/.local/share/fcitx5/rime/default.custom.yaml
```

在文件内填写：

```yml
patch:
  schema_list:
    - schema: rime_ice # 雾凇拼音
  menu/page_size: 9 # 候选词数量
```

之后点击 Rime 托盘图标，然后点击其中的「重新部署」。
