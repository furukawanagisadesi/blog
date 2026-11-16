---
title: 'Fedora 设置 zswap 教程'
description: '在 Fedora 44 上将默认的 zram 修改为 zswap 的过程'
pubDate: '2026-11-03'
updatedDate: '2026-11-16'
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

## 2. 回滚（恢复 Fedora 默认状态）

Fedora 的默认状态是：**zram（`/dev/zram0`）启用、zswap 关闭、没有 `/swapfile`**。回滚就是把这三样改回去，顺序是「先停 swapfile 与 zswap → 再撤内核参数持久化 → 最后恢复 zram」，全部做完再重启检查。

### 2.1 关闭 zswap 并确认池里没有数据

```bash
echo 0 | sudo tee /sys/module/zswap/parameters/enabled
grep -E 'Zswap|Zswapped' /proc/meminfo   # 两个值应都是 0；不为 0 说明池里还有页面，先 sudo swapoff -a 再继续
```

### 2.2 停用并删除 swapfile

```bash
# 已换出的页会被搬回内存，内存不足时 swapoff 会失败，先腾出空间再试
sudo swapoff /swapfile

# 先确认 fstab 里只多了这一行，再删除
diff /etc/fstab.bak.2026-11-03 /etc/fstab      # 换成实际备份日期
sudo sed -i '\|^/swapfile[[:space:]]|d' /etc/fstab
sudo systemctl daemon-reload
grep -n swapfile /etc/fstab                    # 应无输出
tail -3 /etc/fstab

sudo rm -f /swapfile
swapon --show                                  # 此时应为空：swapfile 已删，zram 还没恢复
```

### 2.3 撤销 `zswap.*` 内核参数

```bash
sudo grubby --update-kernel=ALL \
  --remove-args="zswap.enabled zswap.compressor zswap.max_pool_percent"

# 验证：BLS 条目与 /etc/kernel/cmdline 里都不应再有 zswap.*
sudo grubby --info=ALL | grep -i args
cat /etc/kernel/cmdline
```

### 2.4 恢复 zram

```bash
# 删掉用来禁用 zram-generator 的空配置文件，出厂默认配置随即生效
sudo rm -f /etc/systemd/zram-generator.conf
sudo systemctl daemon-reload

# 重新创建 /dev/zram0（unit 由 zram-generator 提供）
sudo systemctl start systemd-zram-setup@zram0.service
zramctl
swapon --show                       # 应重新出现 /dev/zram0
```

### 2.5 重启后确认已回到默认

```bash
cat /proc/cmdline        # 应无 zswap.* 参数
for f in /sys/module/zswap/parameters/*; do echo "$(basename $f)=$(cat $f)"; done   # enabled=N
zramctl                  # 应有 /dev/zram0
swapon --show            # 应只有 /dev/zram0
free -h
ls -l /swapfile          # 应不存在
```

### 2.6 分项回滚对照表

| 目标 | 操作 |
|---|---|
| 临时关闭 zswap | `echo 0 \| sudo tee /sys/module/zswap/parameters/enabled`（重启后按内核参数恢复） |
| 永久关闭 zswap | 按 2.3 撤销 `zswap.*` → 重启 |
| 只撤 swapfile、保留 zswap | 按 2.2 全部步骤；此时 zswap 没有真实 swap 可写，压缩池作用基本消失，建议一并关闭 |
| 只恢复 zram、保留 zswap | 不推荐：zram 与 zswap 叠加会重复压缩，二者选一 |
| 全部回滚 | 按 2.1 → 2.5 顺序执行 |

> **注意**：`/etc/fstab.bak.*`、`/etc/kernel/cmdline.bak.*`、`~/cmdline.*.txt` 是第 1.1 步留下的备份，确认回滚无误后可以删除。若这期间还改过 fstab 或内核参数，请先 `diff` 再决定，不要直接用备份整份覆盖，否则会丢掉后来的改动。
