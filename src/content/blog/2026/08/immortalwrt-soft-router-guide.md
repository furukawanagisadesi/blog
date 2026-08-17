---
title: "ImmortalWrt 软路由安装配置指南"
description: "记录一下安装 ImmortalWrt 的过程"
pubDate: "2026-08-08"
---

> 本教程以 4 网口迷你主机为示例，使用镜像：
> `immortalwrt-24.10.5-x86-64-generic-ext4-combined.img`

## 一、安装教程

### 准备工具

| 工具             | 说明                                                 |
| ---------------- | ---------------------------------------------------- |
| PE U 盘          | 装有 PE 系统的启动盘                                 |
| ImmortalWrt 镜像 | immortalwrt-24.10.5-x86-64-generic-ext4-combined.img |
| physdiskwrite    | 镜像写入工具                                         |

### 安装步骤

> 虚拟机：直接用 **qemu-img** 将 img 文件转换成 vmdk 文件即可

1. 迷你主机插上 U 盘，开机进入 PE 系统
2. 使用 PE 中的 **DiskGenius**，删除迷你主机硬盘的所有分区
3. 在命令行中执行以下命令将镜像写入硬盘：

   ```bash
   physdiskwrite.exe -u immortalwrt-24.10.5-x86-64-generic-ext4-combined.img
   ```

   > ⚠️ 注意：exe 路径和镜像路径需填写完整，示例中未写明路径

4. 写入完成后关闭 PE 系统，拔掉 U 盘，重新开机

## 二、配置教程

### 1. 进入控制台

查看系统识别的网卡：

```bash
cat /proc/net/dev
```

查看接口：

```bash
cat /etc/config/network
```

修改 LAN IP（可选）：

```bash
uci set network.lan.ipaddr='192.168.10.1'
uci commit network
service network restart
```

### 2. 将 U 盘内的系统写入硬盘（可选）

> ⚠️ 未使用 PE 写入硬盘镜像时，需手动将 U 盘镜像写入硬盘（U 盘需提前用 Rufus 写入过镜像文件）。完成后执行 `poweroff` 关机，拔掉 U 盘后重新开机。

查看磁盘空间：

```bash
fdisk -l
```

执行 dd 写入硬盘：

```bash
dd if=/dev/sda of=/dev/sdb bs=4M
```

### 3. 扩容分区

#### 创建新分区

```bash
fdisk /dev/sda
```

依次输入：

- `n` 创建新分区
- `p` 创建主分区
- `3` 创建第三块分区
- 回车 2 次（使用全部剩余空间）或回车 1 次后输入分区大小（如 `+4G`）
- `w` 写入硬盘

#### 格式化分区

```bash
mkfs.ext4 /dev/sda3
```

### 4. 挂载 /dev/sda3 作为根文件系统

#### 4.1 配置挂载点

在 LuCI 网页端依次操作：

1. 进入 **系统 → 挂载点**，点击**添加**
2. 勾选**启用**，UUID 选择 `/dev/sda3`，挂载点选择 `/`
3. 点击**保存并应用**

#### 4.2 复制系统文件

逐条执行以下命令：

```bash
mkdir -p /tmp/introot
mkdir -p /tmp/extroot
mount --bind //tmp/introot
mount /dev/sda3 /tmp/extroot
tar -C /tmp/introot -cvf - . | tar -C /tmp/extroot -xf -
umount /tmp/introot
umount /tmp/extroot
```

> ⚠️ 完成后执行 `reboot` 重启系统

### 5. 调试网络（多网口）

> 默认网桥端口为 **eth0**，本节设置 **eth3** 为 WAN 口并使用 PPPoE 拨号上网。

#### 配置 LAN 桥接

在 LuCI 网页端依次操作：

1. 进入**网络 → 接口 → 设备**
2. 找到 **br-lan**，点击**配置 → 网桥端口**
3. 勾选 **eth1、eth2、eth3**，点击**保存并应用**

#### 配置 WAN 拨号

在 LuCI 网页端依次操作：

1. 进入**网络 → 接口**，点击**添加新接口**
2. 名称填写 `wan`，协议选择 **PPPoE**，设备选择 **eth3**
3. 填写宽带账号和密码，点击**保存并应用**

### 6. 换源（中科大镜像）

编辑源配置文件：

```bash
vi /etc/opkg/distfeeds.conf
```

vi 基本操作：

- `i` 进入编辑模式
- `Esc` 退出编辑模式
- `:wq` 保存并退出
- `:q!` 不保存强制退出

> 也可以直接在网页端配置 opkg 源。

替换为以下内容：

```
src/gz immortalwrt_core https://mirrors.ustc.edu.cn/immortalwrt/releases/24.10.5/targets/x86/64/packages
src/gz immortalwrt_base https://mirrors.ustc.edu.cn/immortalwrt/releases/24.10.5/packages/x86_64/base
src/gz immortalwrt_kmods https://mirrors.ustc.edu.cn/immortalwrt/releases/24.10.5/targets/x86/64/kmods/6.6.122-1-e7e50fbc0aafa7443418a79928da2602
src/gz immortalwrt_luci https://mirrors.ustc.edu.cn/immortalwrt/releases/24.10.5/packages/x86_64/luci
src/gz immortalwrt_packages https://mirrors.ustc.edu.cn/immortalwrt/releases/24.10.5/packages/x86_64/packages
src/gz immortalwrt_routing https://mirrors.ustc.edu.cn/immortalwrt/releases/24.10.5/packages/x86_64/routing
src/gz immortalwrt_telephony https://mirrors.ustc.edu.cn/immortalwrt/releases/24.10.5/packages/x86_64/telephony
```

### 7. 安装 Argon 主题

在 LuCI 网页端依次操作：

1. 进入**系统 → 软件包**，点击**更新列表**等待完成
2. 在过滤器中搜索 `luci-i18n-argon-config-zh-cn`
3. 找到后点击**安装**

> 该包会自动安装 Argon 主题及中文语言包。

### 8. 安装 AdGuardHome

在 LuCI 网页端依次操作：

1. 进入**系统 → 软件包**，点击**更新列表**等待完成
2. 在过滤器中搜索 `adguardhome`
3. 找到后点击**安装**
4. **SSH** 连接 `ImmortalWrt`
5. 输入下方命令启动 `AdGuardHome`
6. 输入下方命令设置 `AdGuardHome`

初始化：

```bash
uci set adguardhome.config.enabled='1'
```

```bash
uci commit adguardhome
```

启动：

```bash
/etc/init.d/adguardhome start
```

7. 设置网页监听端口 `192.168.10.1:13000`
8. 设置 DNS 监听端口 `192.168.10.1:5335`
9. 进入`设置 - DNS 设置`

修改上游服务器：

```
https://dns.alidns.com/dns-query
https://doh.pub/dns-query
https://doh.360.cn/dns-query
```

修改 Bootstrap DNS 服务器：

```
223.5.5.5
119.29.29.29
101.226.4.6
```

10. `过滤器 - DNS 黑名单`点击**检查更新**按钮更新规则
11. 在`ImmortalWrt - 网络 - DHCP/DNS`中点击**转发**，设置**DNS 转发**为 `AdGuardHome` 的 DNS 转发地址 `127.0.0.1#5335`

> 备注：修改配置 vi /etc/adguardhome/adguardhome.yaml
