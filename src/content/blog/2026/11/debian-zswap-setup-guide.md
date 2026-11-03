---
title: "Debian 设置 zswap 教程"
description: "在 Debian 13 上把 swap 从 2 GiB 扩容到约 4 GiB，并启用内建 zswap 做压缩缓存，附 lzo 与 zstd 的取舍"
pubDate: "2026-11-03"
tags: ["Linux"]
---

本文记录在 Debian 13 上把 swap 从 1.86 GiB 扩容到约 3.9 GiB，并启用 zswap 作为 swap 前置压缩缓存的过程。

> **适用环境**：Debian 13 (trixie)，内核 `6.12.94+deb13-amd64`，内存 3.8 GiB，磁盘 20 GiB，`zswap` 为内核内建（`CONFIG_ZSWAP=y`）。

## 1. 扩容 swap

### 1.1 创建 swapfile

```bash
# 确认空间足够
df -h /

# 创建 2 GiB 文件（ext4 支持 fallocate）
sudo fallocate -l 2G /swapfile

# 权限必须是 600，否则 swapon 会拒绝
sudo chmod 600 /swapfile

# 格式化为 swap
sudo mkswap /swapfile

# 启用
sudo swapon /swapfile
```

如果 `swapon` 报 `Invalid argument`，说明文件是稀疏文件，改用 `dd` 重建：

```bash
sudo swapoff /swapfile 2>/dev/null
sudo rm -f /swapfile
sudo dd if=/dev/zero of=/swapfile bs=1M count=2048 status=progress
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

### 1.2 验证

```bash
free -h
cat /proc/swaps
sudo swapon --show
```

应能看到两块 swap，总量约 3.9 GiB。

### 1.3 写入 fstab

先备份，再编辑：

```bash
sudo cp /etc/fstab /etc/fstab.bak.$(date +%F)
sudo nano /etc/fstab
```

在文件末尾加入这一行：

```text
/swapfile none swap sw 0 0
```

确认写入成功：

```bash
tail -3 /etc/fstab
```

> **注意**：漏写这一行的话，`/swapfile` 只在本次开机有效，重启后 swap 会退回 1.86 GiB。

### 1.4 验证 fstab 条目

```bash
sudo systemctl daemon-reload
sudo swapon -a      # 无输出即正常
systemctl list-units --type=swap --no-pager
```

`swapfile.swap` 与 `dev-...-sda2.swap` 都应为 `active`。

> `findmnt --verify` 会对 `none` 重复、光驱无介质、`/swapfile` 是普通文件报 3 个 warning，均属预期，只要 `0 errors` 即可。

## 2. 启用 zswap

### 2.1 原理

```text
进程内存 → (回收) → zswap 压缩池（内存中） → 池满/不可压缩 → 磁盘 swap（分区 + swapfile）
```

zswap 是 swap 的**前置压缩缓存**：换出的页先压缩进内存池，只有池满或压缩不了时才真正写盘。所以它必须有真实 swap 才有意义，也不要和 zram 叠加使用。

### 2.2 参数说明

3.8 GiB 内存下的推荐值：

| 参数 | 建议值 | 说明 |
|---|---|---|
| `compressor` | `lzo` | 内建，开机即用；`zstd` 压缩比更高但会回退（见第 4 节） |
| `zpool` | `zsmalloc` | 默认，压缩密度最高 |
| `max_pool_percent` | `25` | 压缩池上限约为内存的 25%，只是上限、按需占用 |
| `accept_threshold_percent` | `90` | 保持默认，配合 shrinker 使用 |
| `shrinker_enabled` | `Y` | 内存紧张时回收压缩池 |
| `vm.swappiness` | `60` | 先用默认值，观察后再决定是否调高 |

### 2.3 运行时启用

顺序不能反：**先关闭 → 改参数 → 再开启**，运行中直接改 `compressor` 会返回 `EBUSY`。

```bash
echo 0        | sudo tee /sys/module/zswap/parameters/enabled
echo lzo      | sudo tee /sys/module/zswap/parameters/compressor
echo zsmalloc | sudo tee /sys/module/zswap/parameters/zpool
echo 25       | sudo tee /sys/module/zswap/parameters/max_pool_percent
echo 90       | sudo tee /sys/module/zswap/parameters/accept_threshold_percent
echo Y        | sudo tee /sys/module/zswap/parameters/shrinker_enabled
echo 1        | sudo tee /sys/module/zswap/parameters/enabled
```

### 2.4 验证

```bash
for f in /sys/module/zswap/parameters/*; do echo "$(basename $f)=$(cat $f)"; done
grep -E "Zswap|Zswapped" /proc/meminfo
```

`enabled` 应为 `Y`。`Zswap` 和 `Zswapped` 刚开启时是 `0` 属正常：它们是压缩池占用与被压缩的原始字节数，要等有内存页被换出才会增长。

## 3. 持久化

zswap 是内建（`CONFIG_ZSWAP=y`），`/etc/modprobe.d/` 里的 `options` 对它无效，持久化要写内核命令行。

### 3.1 修改 GRUB

```bash
sudo cp /etc/default/grub /etc/default/grub.bak.$(date +%F)

sudo sed -i 's|^GRUB_CMDLINE_LINUX_DEFAULT=.*|GRUB_CMDLINE_LINUX_DEFAULT="quiet zswap.enabled=1 zswap.compressor=lzo zswap.zpool=zsmalloc zswap.max_pool_percent=25 zswap.accept_threshold_percent=90 zswap.shrinker_enabled=1"|' /etc/default/grub

# 必须确认这一行改对了
grep GRUB_CMDLINE_LINUX_DEFAULT /etc/default/grub

sudo update-grub
sudo reboot
```

### 3.2 重启后验证

```bash
cat /proc/cmdline
for f in /sys/module/zswap/parameters/*; do echo "$(basename $f)=$(cat $f)"; done
free -h
cat /proc/swaps
```

内核命令行里应带全部 `zswap.*` 参数，`enabled=Y`，两块 swap 都在。

## 4. 为什么最终用 lzo 而不是 zstd

一开始是想用 `zstd`（压缩比更好），但在内核命令行里写 `zswap.compressor=zstd` 后，开机检查发现 `compressor` 仍然是 `lzo`，而且**没有任何报错**。

原因是启动顺序：

1. `zswap` 是内建（`CONFIG_ZSWAP=y`），初始化发生在内核 `subsys_initcall` 阶段；
2. 这个阶段**早于**根文件系统挂载和用户态 `modprobe`，`/lib/modules` 此时不可用；
3. `zstd` 是模块（`crypto/zstd.ko.xz`），加载不了，内核就**静默回退到内建的默认算法 `lzo`**。

把 `zstd` 放进 initramfs 也没用，因为模块加载仍然晚于 zswap 初始化。要让 zstd 生效，只能在开机后、swap 启用前用 systemd 单元做一次切换，或者在编译内核时把 zstd 设为默认算法，对个人机器都不划算。

`lzo` 是内建的，开机即用不会回退，压缩比（约 2~3:1）对 3.8 GiB 内存的虚拟机已经够用，CPU 开销也更低，所以最终保持 `lzo`。

## 5. 注意事项

1. 改 `compressor` 前必须先 `enabled=0`；如果池里已有数据，还需 `swapoff -a` 清空，否则报 `EBUSY`。
2. zswap **不支持休眠**（hibernate）。若以后要配休眠，需先关闭 zswap。
3. `max_pool_percent` 是按**内存**计算的上限，不是按 swap，也不是预分配。
4. 两块 swap 的优先级由内核自动分配（先启用为 `-2`，后启用为 `-3`），只影响使用顺序，不影响性能。
5. swapfile 必须 `chmod 600`，并且先 `mkswap` 再 `swapon`。

## 6. 回滚

| 目标 | 操作 |
|---|---|
| 关闭 zswap（临时） | `echo 0 \| sudo tee /sys/module/zswap/parameters/enabled` |
| 撤销 zswap 持久化 | 恢复 `/etc/default/grub.bak.*` → `sudo update-grub` → 重启 |
| 撤销 swapfile | `sudo swapoff /swapfile` → 删除 fstab 中的 `/swapfile` 行 → `sudo rm /swapfile` |
