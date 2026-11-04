---
title: 'VMware Fedora 安装后设置教程'
description: 'VMware 17 下 Fedora 45 GNOME 的换源与常用设置'
pubDate: '2026-11-04'
tags: ['VMware', 'Linux']
---

VMware 17 下 Fedora 45 GNOME 的换源与常用设置。

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

## 5. 代理设置（可选）

```bash
# 5.1 备份并写入 /etc/environment
sudo cp -a /etc/environment /etc/environment.bak.$(date +%F)

sudo tee /etc/environment >/dev/null <<'EOF'
http_proxy="http://your_ip:port"
https_proxy="http://your_ip:port"
all_proxy="socks5://your_ip:port"
HTTP_PROXY="http://your_ip:port"
HTTPS_PROXY="http://your_ip:port"
ALL_PROXY="socks5://your_ip:port"
no_proxy="localhost,127.0.0.1,::1,网关前 3 段.0/24,.local"
NO_PROXY="localhost,127.0.0.1,::1,网关前 3 段.0/24,.local"
EOF
```

```bash
# 5.2 让 sudo 保留这些变量
sudo tee /etc/sudoers.d/proxy >/dev/null <<'EOF'
Defaults env_keep += "http_proxy https_proxy all_proxy no_proxy"
Defaults env_keep += "HTTP_PROXY HTTPS_PROXY ALL_PROXY NO_PROXY"
EOF

sudo chown root:root /etc/sudoers.d/proxy
sudo chmod 440 /etc/sudoers.d/proxy
sudo visudo -cf /etc/sudoers.d/proxy     # 必须输出 parsed OK
```

```bash
# 5.3 dnf 配置代理
sudo tee -a /etc/dnf/dnf.conf >/dev/null <<'EOF'
proxy=http://your_ip:port
EOF
```
