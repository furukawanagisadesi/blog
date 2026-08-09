---
title: 'VMware Fedora 换源并更新教程'
description: 'VMware 17 下给 Fedora 换源以及更新'
pubDate: '2026-08-09'
---

本文记录 VMware 17 下给 Fedora 换源并执行更新的完整流程

## 1. 换源

从官方默认源换 USTC（中科大）

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

## 2. 更新

执行更新命令并清理缓存然后检查是否有需要重启的软件

```bash
sudo dnf upgrade
sudo dnf autoremove
sudo dnf needs-restarting
```

最后推荐重启 Fedora 系统
