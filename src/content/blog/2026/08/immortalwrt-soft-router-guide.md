---
title: "ImmortalWrt 软路由安装配置指南"
description: "从安装、磁盘扩容到 AdGuard Home、UPnP 与常见网络问题排查的完整记录"
pubDate: "2026-08-08"
updatedDate: "2026-11-07"
tags: ["ImmortalWrt", "Network"]
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
mount --bind / /tmp/introot
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
3. 勾选 **eth1、eth2**（eth0 默认已在网桥内，eth3 留给 WAN），点击**保存并应用**

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

```text
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

### 8. 安装 AdGuard Home

#### 8.1 安装与初始化

在 LuCI 的**系统 → 软件包**中搜索 `adguardhome` 并安装，也可以直接 SSH 执行：

```bash
opkg update
opkg install adguardhome
uci set adguardhome.config.enabled='1'
uci commit adguardhome
/etc/init.d/adguardhome start
```

首次启动后访问 `http://192.168.10.1:3000` 完成初始化向导，然后在**设置 → 常规设置**中把网页管理端口改为 `13000`。

> 配置文件为 `/etc/adguardhome.yaml`；数据目录为 `/var/lib/adguardhome`，而 `/var` 指向 `/tmp`，所以查询日志和统计在路由器重启后会清空。

#### 8.2 选择 DNS 工作模式

| 方案 | 链路 | 优点 | 缺点 |
| --- | --- | --- | --- |
| A（推荐） | 客户端 → AdGuard Home `53` → 上游 DoH | 能看到真实客户端 IP，可按设备统计和拦截 | 需要调整 dnsmasq 端口 |
| B（简单） | 客户端 → dnsmasq `53` → AdGuard Home `127.0.0.1:5335` | 改动少 | AdGuard Home 看到的来源全是 `127.0.0.1` |

如果只需要全局去广告、不关心分设备统计，方案 B 就够用；本文采用方案 A。

#### 8.3 修改 AdGuard Home 配置

编辑 `/etc/adguardhome.yaml`，让 DNS 监听 `53` 端口并同时监听 IPv4 和 IPv6：

```yml
dns:
  bind_hosts:
    - 0.0.0.0
    - "::"
  port: 53
  upstream_dns:
    - "[/lan/]127.0.0.1:5353"
    - https://dns.alidns.com/dns-query
    - https://doh.pub/dns-query
    - https://doh.360.cn/dns-query
  bootstrap_dns:
    - 223.5.5.5
    - 119.29.29.29
    - 101.226.4.6
  local_ptr_upstreams:
    - 127.0.0.1:5353
```

各项说明：

- `[/lan/]127.0.0.1:5353`：`.lan` 结尾的本地域名交给 dnsmasq 解析，保证 `主机名.lan` 仍可用；
- `local_ptr_upstreams`：内网 IP 的反向解析同样交给 dnsmasq；
- 其余域名走 DoH 上游。

修改后重启服务：

```bash
/etc/init.d/adguardhome restart
```

#### 8.4 调整 dnsmasq

让 dnsmasq 只负责 DHCP 和本地域名，不再占用 `53`：

```bash
uci set dhcp.@dnsmasq[0].port='5353'
uci -q delete dhcp.@dnsmasq[0].server
uci set dhcp.@dnsmasq[0].noresolv='1'
uci set dhcp.@dnsmasq[0].min_cache_ttl='60'
uci set dhcp.@dnsmasq[0].dns_redirect='0'
uci -q delete dhcp.lan.dhcp_option
uci add_list dhcp.lan.dhcp_option='6,192.168.10.1'
uci commit dhcp
/etc/init.d/dnsmasq restart
```

- `min_cache_ttl` 如果被设成 `3600`，会强制所有 DNS 记录至少缓存 1 小时，容易拿到已经下线的 CDN 或 DDNS 地址，建议改成 `60` 或直接删除；
- `dhcp_option` 中的 `6` 是 DNS 服务器选项，确保 DHCP 下发的 DNS 就是路由器自己（此时由 AdGuard Home 应答）。

#### 8.5 修正 DNS 劫持规则

OpenWrt 的 `dns_redirect` 会按 dnsmasq 的端口生成重定向规则。dnsmasq 改到 `5353` 后，它会把客户端 DNS 重定向到 `5353`，反而绕过 AdGuard Home。因此需要关闭自动劫持，改为显式 DNAT 到 AdGuard Home：

```bash
uci add firewall redirect
uci set firewall.@redirect[-1].name='DNS-Hijack-AGH-v4'
uci set firewall.@redirect[-1].src='lan'
uci set firewall.@redirect[-1].proto='tcp udp'
uci set firewall.@redirect[-1].src_dport='53'
uci set firewall.@redirect[-1].dest_ip='192.168.10.1'
uci set firewall.@redirect[-1].dest_port='53'
uci set firewall.@redirect[-1].target='DNAT'
uci set firewall.@redirect[-1].family='ipv4'

uci add firewall redirect
uci set firewall.@redirect[-1].name='DNS-Hijack-AGH-v6'
uci set firewall.@redirect[-1].src='lan'
uci set firewall.@redirect[-1].proto='tcp udp'
uci set firewall.@redirect[-1].src_dport='53'
uci set firewall.@redirect[-1].dest_ip='fde7:e21c:174f::1'
uci set firewall.@redirect[-1].dest_port='53'
uci set firewall.@redirect[-1].target='DNAT'
uci set firewall.@redirect[-1].family='ipv6'

uci commit firewall
fw4 restart
```

> IPv6 规则里的 `dest_ip` 需要换成自己 LAN 的 ULA 地址（通常是 `ula_prefix` 的前缀加 `::1`）。

这样即使设备手动把 DNS 设成 `8.8.8.8`，请求也会被拉回 AdGuard Home。

#### 8.6 验证

```bash
netstat -lntup | grep -E ':(53|5353) '
nslookup www.baidu.com 192.168.10.1
nslookup ImmortalWrt.lan 192.168.10.1
```

打开 AdGuard Home 的**查询日志**，来源应该是客户端的真实局域网 IP，而不是 `127.0.0.1`。

### 9. 配置 UPnP（可选）

UPnP 可以让下载工具、游戏主机自动向路由器申请端口映射。配置前先确认 WAN 是否有公网 IPv4：

```bash
ip -4 addr show pppoe-wan
```

如果地址落在 `100.64.0.0/10`（运营商级 NAT，CGNAT）、`10.0.0.0/8`、`172.16.0.0/12` 或 `192.168.0.0/16`，说明没有公网 IPv4。此时 UPnP 只能完成「内网 → 路由器」这一层映射，**外网依然无法主动访问**，需要外网访问请使用公网 IPv6 或 frp、Tailscale 之类的方案。

安装（使用 nftables 版本，对应 fw4）：

```bash
opkg update
opkg install miniupnpd-nftables luci-app-upnp luci-i18n-upnp-zh-cn
```

启用：

```bash
uci set upnpd.config.enabled='1'
uci set upnpd.config.enable_upnp='1'
uci set upnpd.config.enable_natpmp='1'
uci set upnpd.config.secure_mode='1'
uci set upnpd.config.igdv1='1'
uci commit upnpd
/etc/init.d/miniupnpd enable
/etc/init.d/miniupnpd restart
```

说明：

- `external_iface` 留空时，启动脚本会通过 ubus 自动查找默认路由接口，一般不需要手动指定；
- `secure_mode=1` 禁止客户端给路由器自身添加映射；
- 默认只允许外部端口 `1024-65535`。

验证：

```bash
/etc/init.d/miniupnpd status
netstat -lnup | grep 1900
netstat -lntp | grep 5000
wget -qO- http://192.168.10.1:5000/rootDesc.xml | head
```

需要临时测试映射时，可以安装 `miniupnpc`（测完建议卸载）：

```bash
opkg install miniupnpc
upnpc -l
upnpc -a 192.168.10.100 8080 8080 tcp
upnpc -d 8080 tcp
```

不需要时关闭：

```bash
/etc/init.d/miniupnpd disable
uci set upnpd.config.enabled='0'
uci commit upnpd
/etc/init.d/miniupnpd stop
```

### 10. 常见问题

#### 10.1 DHCP 租约到期后，为什么没有把原来的 IP 分回来？

DHCP 租约只是「在到期前这个地址归你用」的临时授权，不是永久绑定。租约到期只代表地址回到池子，服务器没有义务再分给同一台设备。

dnsmasq 默认按客户端 MAC 做哈希散列，再寻找空闲地址。重装系统后，客户端首次联网发送的是 `DHCPDISCOVER`（不会声明「我上次用的是哪个 IP」），如果原地址此时仍被占用，就会顺延到别的地址；之后客户端持续续租，就固定在新地址上。

另外，OpenWrt 默认把租约文件放在 `/tmp/dhcp.leases`，而 `/tmp` 是内存盘，**路由器重启后租约历史会清空**。

如果需要固定 IP，正确做法是配置静态租约：

> **菜单路径**：网络 → DHCP/DNS → 静态地址分配 → 添加

把设备的 MAC 绑定到指定 IP 即可，与重装系统、租约到期都无关。

#### 10.2 AdGuard Home 的客户端为什么全是 `127.0.0.1`？

这是 dnsmasq 转发模式（8.2 的方案 B）造成的：请求从 `127.0.0.1` 转发给 AdGuard Home，真实来源 IP 已经丢失。按方案 A 调整后即可看到真实客户端 IP。

#### 10.3 局域网有公网 IPv6，但部分设备无法访问 IPv6 网站？

先确认路由器本身是否连通：

```bash
ping -6 -c 2 2001:4860:4860::8888
```

路由器能通而客户端不通时，检查客户端是否拿到了公网 IPv6 地址、防火墙是否放行 ICMPv6，以及 RA 是否正常下发。注意部分 IPv6 DNS 地址（例如 `240c::6666`）本身不响应 ping，不能用它判断 IPv6 是否可用。

### 11. 安全建议（可选）

- **关闭 SSH 密码登录**：确认密钥登录可用后，设置 `PasswordAuth='off'` 和 `RootPasswordAuth='off'`，并保持 `Interface='lan'`；
- **谨慎开启 Full-cone NAT**：`fullcone='1'` 会让内网主机向外发过包后，任何外部主机都能主动连回来，通常只有游戏机或 P2P 场景需要；
- **删除不需要的 WAN 放行规则**（例如未使用 IPSec 时的 ESP、ISAKMP 规则），减少暴露面；
- **UPnP 不用时关闭**，它允许内网程序自行开放端口；
- **`min_cache_ttl` 不要设置过大**，否则会掩盖 DNS 记录的更新。
