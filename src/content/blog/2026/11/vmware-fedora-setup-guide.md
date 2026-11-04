---
title: 'VMware Fedora 安装后设置教程'
description: 'VMware 17 下 Fedora 44 的换源与常用设置'
pubDate: '2026-11-04'
tags: ['VMware', 'Linux']
---

本文记录 VMware 17 下给 Fedora 换源并执行更新的完整流程。

## 1. 换源

从官方默认源换 USTC（中科大）。

```bash
# 1. 备份原配置（替换前先备份，稳妥）
sudo cp -a /etc/yum.repos.d /etc/yum.repos.d.bak

# 2. 一键替换为 USTC（注释 metalink、启用 USTC baseurl）
sudo sed -e 's|^metalink=|#metalink=|g' \
         -e 's|^#baseurl=http://download.example/pub/fedora/linux|baseurl=https://mirrors.ustc.edu.cn/fedora|g' \
         -i.bak \
         /etc/yum.repos.d/fedora.repo \
         /etc/yum.repos.d/fedora-updates.repo

# 3. 清缓存并重建（验证新源是否可用）
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
# 建立 .gitconfig 添加 proxy 地址
nano ~/.gitconfig
# 输入
[http]
	proxy = http://your_ip:port
```

## 4. 安装 fcitx5-rime 输入法

```bash
# 1. 安装（不要装 fcitx5-autostart，交给 imsettings 启动，避免双启动）
sudo dnf install fcitx5 fcitx5-rime fcitx5-configtool fcitx5-gtk fcitx5-qt

# 2. 切换为默认输入法（fcitx5 包自带 /etc/X11/xinit/xinput.d/fcitx5.conf）
imsettings-switch fcitx5

# 3. 注销重登生效，然后验证
imsettings-info    # 应显示 GTK/Qt immodule = fcitx, XMODIFIERS=@im=fcitx
pgrep -a fcitx5
fcitx5-diagnose

# 4. 安装雾凇拼音
# 拉取方案
git clone --depth 1 https://github.com/iDvel/rime-ice.git /home/fedora/下载/rime-ice

# 把方案文件复制进 rime 配置目录
cp -r /home/fedora/下载/rime-ice/* ~/.local/share/fcitx5/rime/

# 修改自定义配置
nano ~/.local/share/fcitx5/rime/default.custom.yaml

# 文件内填写
patch:
  schema_list:
    - schema: rime_ice # 雾凇拼音
  menu/page_size: 9 # 候选词数量

# 最后需要注销重新登录或重启 fcitx5
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
