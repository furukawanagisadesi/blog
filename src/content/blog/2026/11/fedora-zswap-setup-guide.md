---
title: 'Fedora 设置 zswap 教程'
description: '在 Fedora 44 上将默认的 zram 修改为 zswap 的过程'
pubDate: '2026-11-03'
updatedDate: '2026-11-05'
tags: ['Linux']
---

本文记录在 Fedora 44 上将默认的 zram 修改为 zswap 的过程。

## 1. 修改 zram 为 zswap + swap

### 1.1 先记录状态

```bash
sudo cp /etc/fstab /etc/fstab.bak.$(date +%F)
sudo cp /etc/kernel/cmdline /etc/kernel/cmdline.bak.$(date +%F)
cp /proc/cmdline ~/cmdline.$(date +%F).txt

swapon --show; zramctl; free -h
```

### 1.2 停用 zram

官方文档写明的禁用方式就是建一个空配置文件，它会覆盖 `/usr/lib/systemd/zram-generator.conf`：

```bash
sudo touch /etc/systemd/zram-generator.conf

# 立即释放当前 zram
sudo swapoff /dev/zram0
echo 1 | sudo tee /sys/block/zram0/reset
echo 0 | sudo tee /sys/class/zram-control/hot_remove
```

验证：

```bash
swapon --show      # 应无输出
zramctl            # 应无输出
```

### 1.3 创建 swapfile（btrfs 必须用专用命令）

不要用 `fallocate` 或 `dd`——btrfs 上会失败或产生 COW 问题。

```bash
sudo btrfs filesystem mkswapfile --size 2G /swapfile # swapfile 大小自行修改
sudo chmod 600 /swapfile
```

验证并启用：

```bash
ls -lZ /swapfile          # 权限应为 -rw-------，看下 SELinux 类型
sudo swapon /swapfile # 启用 swapfile
cat /proc/swaps           # 应出现 /swapfile
```

### 1.4 写入 fstab

```bash
echo '/swapfile none swap defaults 0 0' | sudo tee -a /etc/fstab
sudo systemctl daemon-reload
tail -2 /etc/fstab
```

### 1.5 运行时启用 zswap

```bash
echo lzo | sudo tee /sys/module/zswap/parameters/compressor
echo 25  | sudo tee /sys/module/zswap/parameters/max_pool_percent
echo 1   | sudo tee /sys/module/zswap/parameters/enabled
```

验证：

```bash
for f in /sys/module/zswap/parameters/*; do echo "$(basename $f)=$(cat $f)"; done
grep -E 'Zswap|Zswapped' /proc/meminfo
```

### 1.6 持久化

```bash
# 持久化：grubby 会同时写入现有内核的 BLS 条目和 /etc/kernel/cmdline（新内核模板）
sudo grubby --update-kernel=ALL \
  --args="zswap.enabled=1 zswap.compressor=lzo zswap.max_pool_percent=25"

# 验证
sudo grubby --info=ALL | grep -i args
cat /etc/kernel/cmdline
```

### 1.7 重启并检查

```bash
sudo reboot
```

重启后逐条检查：

```bash
zramctl                                   # 应空，说明 zram 已被禁用
cat /proc/swaps                           # 应只有 /swapfile，2G
free -h                                   # Swap 约 2.0Gi
cat /proc/cmdline                         # 应含三个 zswap.* 参数
for f in /sys/module/zswap/parameters/*; do echo "$(basename $f)=$(cat $f)"; done
systemctl list-units --type=swap --no-pager   # swapfile.swap 应为 active
```
