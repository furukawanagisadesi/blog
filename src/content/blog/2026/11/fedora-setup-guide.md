---
title: 'Fedora 安装后设置教程'
description: 'Fedora 45 GNOME 的换源与常用设置'
pubDate: '2026-11-04'
updatedDate: '2026-11-05'
tags: ['VMware', 'Linux']
---

本文记录 VMware 17 下 Fedora 45 GNOME 的换源与常用设置流程。

## 1. 换源

从官方默认源换到 NYIST（南阳理工学院）镜像。

```bash
# 1. 创建覆写文件（目录：/etc/dnf/repos.override.d/）
sudo dnf config-manager setopt \
fedora.baseurl='https://mirrors.nyist.edu.cn/fedora/releases/$releasever/Everything/$basearch/os/' \
fedora.metalink= \
updates.baseurl='https://mirrors.nyist.edu.cn/fedora/updates/$releasever/Everything/$basearch/' \
updates.metalink=

# 2. 清缓存并重建（验证新源是否可用）
sudo dnf clean all
sudo dnf makecache
```

执行更新命令并清理缓存，然后检查是否有需要重启的软件。

```bash
sudo dnf upgrade
sudo dnf autoremove
sudo dnf needs-restarting
```

## 2. 设置 ssh 开机自启

```bash
sudo systemctl enable --now sshd
```

## 3. 安装 git

```bash
sudo dnf install git
nano ~/.gitconfig
```

在文件中填写代理地址：

```text
[http]
proxy = http://your_ip:port
```

## 4. 安装 Rime 输入法

1. 安装 `ibus-rime`：

   ```bash
   sudo dnf install ibus-rime
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
   git clone --depth 1 https://github.com/iDvel/rime-ice.git /home/fedora/下载/rime-ice
   cp -r /home/fedora/下载/rime-ice/* ~/.config/ibus/rime/
   ```

5. 自定义雾凇拼音：

   ```bash
   nano ~/.config/ibus/rime/default.custom.yaml
   ```

   在文件内填写：

   ```yml
   patch:
     schema_list:
       - schema: rime_ice # 雾凇拼音
     menu/page_size: 6 # 候选词数量
   ```

## 5. 更换 flatpak 仓库

1. 检查当前 flatpak 仓库：

   ```bash
   flatpak remotes --show-details
   ```

2. 禁用 Fedora Flatpaks 仓库：

   ```bash
   flatpak remote-modify --no-filter --disable fedora
   ```

   > 很多人打开 gnome-software 一直显示正在加载就是因为访问不到 Fedora Flatpaks 仓库，禁用即可进入。

3. 修改 flathub 仓库：

   ```bash
   # 这里用的 USTC（中科大）源
   sudo flatpak remote-modify flathub --url=https://mirrors.ustc.edu.cn/flathub
   ```

4. 添加用户级 flathub 仓库：

   ```bash
   flatpak remote-add --user --if-not-exists flathub https://dl.flathub.org/repo/flathub.flatpakrepo
   flatpak remote-modify --user flathub --url=https://mirrors.ustc.edu.cn/flathub
   ```

## 6. 安装插件

1. 安装 ExtensionManager：

   ```bash
   # 用户级
   flatpak install --user flathub com.mattjakeman.ExtensionManager
   ```

   或者：

   ```bash
   # 系统级
   flatpak install flathub com.mattjakeman.ExtensionManager
   ```

2. 安装 dash to dock：

   ```text
   ExtensionManager 浏览中搜索 Dash to Dock
   ```

3. 安装 gnome-tweaks：

   ```bash
   # ExtensionManager 中可能搜不到，所以用命令行安装
   sudo dnf install gnome-tweaks
   ```

## 7. 代理设置（可选）

> IP 地址和端口号需自行修改，文章内只做演示
> 可开关式代理和全局代理按需二选一

1. 可开关式代理（环境变量只影响当前 Shell 及其子进程）：

   ```bash
   # ~/.bashrc 末尾（zsh 放 ~/.zshrc）

   _PROXY_HTTP="http://127.0.0.1:17897"
   _PROXY_SOCKS="socks5://127.0.0.1:17897"
   _PROXY_NOPROXY="localhost,127.0.0.1,::1,192.168.1.0/24,.local"

   proxon() {
       export http_proxy="$_PROXY_HTTP"  https_proxy="$_PROXY_HTTP"  all_proxy="$_PROXY_SOCKS"
       export HTTP_PROXY="$http_proxy"   HTTPS_PROXY="$https_proxy"  ALL_PROXY="$all_proxy"
       export no_proxy="$_PROXY_NOPROXY" NO_PROXY="$no_proxy"
       echo "proxy on  → $http_proxy (all: $all_proxy)"
   }

   proxoff() {
       unset http_proxy https_proxy all_proxy no_proxy
       unset HTTP_PROXY HTTPS_PROXY ALL_PROXY NO_PROXY
       echo "proxy off"
   }

   proxstatus() {
       env | grep -iE '^(http|https|all|no)_proxy=' || echo "no proxy set"
   }
   ```

2. dnf 配置代理：

   ```bash
   sudo dnf config-manager setopt proxy=http://127.0.0.1:17897
   ```

   ```bash
   # 验证
   dnf --dump-main-config | grep '^proxy'
   ```

3. 全局默认代理：

   ```bash
   sudo mkdir -p /etc/environment.d
   sudo tee /etc/environment.d/99-proxy.conf >/dev/null <<'EOF'
   http_proxy=http://your_ip:port
   https_proxy=http://your_ip:port
   all_proxy=socks5://your_ip:port
   HTTP_PROXY=${http_proxy}
   HTTPS_PROXY=${https_proxy}
   ALL_PROXY=${all_proxy}
   no_proxy=localhost,127.0.0.1,::1,192.168.1.0/24,.local
   NO_PROXY=${no_proxy}
   EOF
   ```
