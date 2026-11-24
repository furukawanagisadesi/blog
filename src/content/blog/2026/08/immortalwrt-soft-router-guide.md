---
title: 'ImmortalWrt 软路由安装配置指南'
description: '从安装、磁盘扩容到 AdGuard Home、UPnP、跨版本升级与常见网络问题排查的完整记录'
pubDate: '2026-08-08'
updatedDate: '2026-11-22'
tags: ['ImmortalWrt', 'Network']
---

> 本教程以 4 网口迷你主机为示例，使用镜像：
> `immortalwrt-25.12.2-x86-64-generic-ext4-combined.img`
>
> 25.12 起包管理器从 opkg 换成了 apk，命令与源文件都不同。仍在 24.10 及更早版本的话，把文中的 `apk add` 换成 `opkg install`、`apk update` 换成 `opkg update` 即可，其余配置思路相同。

## 1. 安装教程

### 1.1 准备工具

| 工具 | 说明 |
| ---------------- | ---------------------------------------------------- |
| PE U 盘 | 装有 PE 系统的启动盘 |
| ImmortalWrt 镜像 | immortalwrt-25.12.2-x86-64-generic-ext4-combined.img |
| physdiskwrite | 镜像写入工具 |

### 1.2 安装步骤

> 虚拟机：直接用 `qemu-img` 将 img 文件转换成 vmdk 文件即可

1. 迷你主机插上 U 盘，开机进入 PE 系统
2. 使用 PE 中的 `DiskGenius`，删除迷你主机硬盘的所有分区
3. 在命令行中执行以下命令将镜像写入硬盘：

   ```bash
   physdiskwrite.exe -u immortalwrt-25.12.2-x86-64-generic-ext4-combined.img
   ```

   > ⚠️ 注意：exe 路径和镜像路径需填写完整，示例中未写明路径

4. 写入完成后关闭 PE 系统，拔掉 U 盘，重新开机

## 2. 配置教程

### 2.1 进入控制台

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

### 2.2 将 U 盘内的系统写入硬盘（可选）

> ⚠️ 未使用 PE 写入硬盘镜像时，需手动将 U 盘镜像写入硬盘（U 盘需提前用 Rufus 写入过镜像文件）。完成后执行 `poweroff` 关机，拔掉 U 盘后重新开机。

查看磁盘空间：

```bash
fdisk -l
```

执行 dd 写入硬盘：

```bash
dd if=/dev/sda of=/dev/sdb bs=4M
```

### 2.3 扩容分区

#### 2.3.1 创建新分区

```bash
fdisk /dev/sda
```

依次输入：

- `n` 创建新分区
- `p` 创建主分区
- `3` 创建第三块分区
- 回车 2 次（使用全部剩余空间）或回车 1 次后输入分区大小（如 `+4G`）
- `w` 写入硬盘

#### 2.3.2 格式化分区

```bash
mkfs.ext4 /dev/sda3
```

### 2.4 挂载 /dev/sda3 作为根文件系统

#### 2.4.1 配置挂载点

在 LuCI 网页端依次操作：

1. 进入 **系统 → 挂载点**，点击**添加**
2. 勾选**启用**，UUID 选择 `/dev/sda3`，挂载点选择 `/`
3. 点击**保存并应用**

#### 2.4.2 复制系统文件

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
>
> ⚠️ 用了 extroot 之后，系统升级会变得麻烦：`fstab` 里的挂载规则会被升级还原，导致新内核配旧用户空间。升级前务必先看第 3.1.2 节。

### 2.5 调试网络（多网口）

> 默认网桥端口为 `eth0`，本节设置 `eth3` 为 WAN 口并使用 PPPoE 拨号上网。

#### 2.5.1 配置 LAN 桥接

在 LuCI 网页端依次操作：

1. 进入**网络 → 接口 → 设备**
2. 找到 `br-lan`，点击**配置 → 网桥端口**
3. 勾选 `eth1`、`eth2`（`eth0` 默认已在网桥内，`eth3` 留给 WAN），点击**保存并应用**

#### 2.5.2 配置 WAN 拨号

在 LuCI 网页端依次操作：

1. 进入**网络 → 接口**，点击**添加新接口**
2. 名称填写 `wan`，协议选择 **PPPoE**，设备选择 `eth3`
3. 填写宽带账号和密码，点击**保存并应用**

### 2.6 换源（中科大镜像）

25.12 起用 apk，源文件是 `/etc/apk/repositories.d/distfeeds.list`：

```bash
vi /etc/apk/repositories.d/distfeeds.list
```

vi 基本操作：

- `i` 进入编辑模式
- `Esc` 退出编辑模式
- `:wq` 保存并退出
- `:q!` 不保存强制退出

替换为以下内容：

```text
https://mirrors.ustc.edu.cn/immortalwrt/releases/25.12.2/targets/x86/64/packages/packages.adb
https://mirrors.ustc.edu.cn/immortalwrt/releases/25.12.2/packages/x86_64/base/packages.adb
https://mirrors.ustc.edu.cn/immortalwrt/releases/25.12.2/targets/x86/64/kmods/6.12.103-1-0413601b1c3f0490e17f340fe09229ea/packages.adb
https://mirrors.ustc.edu.cn/immortalwrt/releases/25.12.2/packages/x86_64/luci/packages.adb
https://mirrors.ustc.edu.cn/immortalwrt/releases/25.12.2/packages/x86_64/packages/packages.adb
https://mirrors.ustc.edu.cn/immortalwrt/releases/25.12.2/packages/x86_64/routing/packages.adb
https://mirrors.ustc.edu.cn/immortalwrt/releases/25.12.2/packages/x86_64/telephony/packages.adb
```

说明：

- apk 的源文件**每行就是一个索引 URL**，不再有 `src/gz 名称 URL` 这种写法；
- `kmods` 那一行的内核串（`6.12.103-1-0413601b…`）随内核版本变化，升级后必须重新确认；
- 改完执行 `apk update`，正常会输出 `OK: 1xxxx distinct packages available`。

还有一个容易漏的地方：LuCI 的初始化脚本会读 `system.@imm_init[0].apk_mirror` 并据此重置源，只改文件的话下次初始化可能被改回去。建议一并设置：

```bash
uci set system.@imm_init[0].apk_mirror='https://mirrors.ustc.edu.cn/immortalwrt'
uci commit system
```

> 仍在 24.10 及更早版本的话，源文件是 `/etc/opkg/distfeeds.conf`，格式为 `src/gz 名称 URL`，索引文件名是 `Packages.gz`，把域名换成 `mirrors.ustc.edu.cn/immortalwrt` 即可。

### 2.7 安装 Argon 主题

在 LuCI 网页端依次操作：

1. 进入**系统 → 软件包**，点击**更新列表**等待完成
2. 在过滤器中搜索 `luci-i18n-argon-config-zh-cn`
3. 找到后点击**安装**

> 该包会自动安装 Argon 主题及中文语言包。

也可以直接用 SSH 安装三件套：

```bash
apk update
apk add luci-theme-argon luci-app-argon-config luci-i18n-argon-config-zh-cn
```

### 2.8 安装 AdGuard Home

#### 2.8.1 安装与初始化

在 LuCI 的**系统 → 软件包**中搜索 `adguardhome` 并安装，也可以直接 SSH 执行：

```bash
apk update
apk add adguardhome
uci set adguardhome.config.enabled='1'
uci commit adguardhome
/etc/init.d/adguardhome start
```

首次启动后访问 `http://192.168.10.1:3000` 完成初始化向导，然后在**设置 → 常规设置**中把网页管理端口改为 `13000`。

> 25.12 的包把配置文件放在 `/etc/adguardhome/adguardhome.yaml`（24.10 及更早是 `/etc/adguardhome.yaml`）。从旧版本升级时会自动迁移，并在 `/lib/upgrade/keep.d/adguardhome` 里登记新路径，后续升级不会丢。
>
> 数据目录为 `/var/lib/adguardhome`，而 `/var` 指向 `/tmp`，所以查询日志、统计和过滤规则在路由器重启后会重新下载。

#### 2.8.2 选择 DNS 工作模式

| 方案 | 链路 | 优点 | 缺点 |
| --------- | ------------------------------------------------------------------------------------ | -------------------------------------------------- | -------------------------------------------------------------------- |
| A（推荐） | 客户端 → dnsmasq `53` → AdGuard Home `127.0.0.1:5335` → 上游 DoH，失败则回落公共 DNS | 系统升级或 AGH 未就绪时，53 仍有人应答，全屋不断网 | AdGuard Home 看到的来源全是 `127.0.0.1` |
| B | 客户端 → AdGuard Home `53` → 上游 DoH | 能看到真实客户端 IP，可按设备统计和拦截 | AGH 一缺失（升级后未装、启动失败），`53` 无人监听，全屋 DNS 直接失效 |

**推荐方案 A。** 关键在于「谁占 53」和「谁能兜底」是同一件事：

- 一个端口只能有一个进程监听，所以「AGH 主 + dnsmasq 副」并不是主备关系——AGH 一死，53 就空了，dnsmasq 躺在别的端口上不会自动接管；
- 反过来把过滤层放在下游（dnsmasq → AGH），过滤失效时只是「不拦广告」，而不是「整体断网」。

本文采用方案 A。

#### 2.8.3 修改 AdGuard Home 配置

先停服务再改配置——AdGuard Home 运行时会回写 `adguardhome.yaml`，运行中修改会被覆盖：

```bash
/etc/init.d/adguardhome stop
```

编辑 `/etc/adguardhome/adguardhome.yaml`（24.10 及更早为 `/etc/adguardhome.yaml`），只监听回环地址的 `5335` 端口：

```yml
dns:
  bind_hosts:
    - 127.0.0.1
    - '::1'
  port: 5335
  ratelimit: 0
  upstream_dns:
    - '[/lan/]127.0.0.1:53'
    - https://dns.alidns.com/dns-query
    - https://doh.pub/dns-query
    - https://doh.360.cn/dns-query
  bootstrap_dns:
    - 223.5.5.5
    - 119.29.29.29
    - 101.226.4.6
  fallback_dns:
    - 223.5.5.5
    - 119.29.29.29
  local_ptr_upstreams:
    - 127.0.0.1:53
```

各项说明：

- `bind_hosts` 只留 `127.0.0.1` 和 `::1`：否则局域网设备可以直接连 `5335`，绕过 dnsmasq 的兜底逻辑；
- `port: 5335`：把 `53` 让给 dnsmasq；
- `ratelimit: 0`：**必须设为 0**。所有请求都来自 `127.0.0.1`，按默认的 20 qps 限流会把整个局域网当成同一个客户端，一忙就丢查询；
- `[/lan/]127.0.0.1:53`：`.lan` 结尾的本地域名交给 dnsmasq 解析；
- `local_ptr_upstreams`：内网 IP 的反向解析同样交给 dnsmasq；
- `fallback_dns`：三个 DoH 上游全挂时，AGH 自己再退一步走明文公共 DNS。

#### 2.8.4 调整 dnsmasq（关键步骤）

让 dnsmasq 拿回 `53`，把 AGH 作为首选上游、公共 DNS 作为兜底：

```bash
uci -q delete dhcp.@dnsmasq[0].port
uci -q delete dhcp.@dnsmasq[0].server
uci add_list dhcp.@dnsmasq[0].server='127.0.0.1#5335'
uci add_list dhcp.@dnsmasq[0].server='223.5.5.5'
uci add_list dhcp.@dnsmasq[0].server='119.29.29.29'
uci set dhcp.@dnsmasq[0].strictorder='1'
uci set dhcp.@dnsmasq[0].noresolv='1'
uci set dhcp.@dnsmasq[0].min_cache_ttl='60'
uci set dhcp.@dnsmasq[0].dns_redirect='0'
uci -q delete dhcp.lan.dhcp_option
uci add_list dhcp.lan.dhcp_option='6,192.168.10.1'
uci commit dhcp
/etc/init.d/dnsmasq restart
```

说明：

- 删除 `port` 让 dnsmasq 回到默认的 `53`；
- `noresolv=1` 防止它去读 `resolv.conf` 造成回环；
- `min_cache_ttl` 不要设成 `3600`，否则会强制所有记录至少缓存 1 小时，容易拿到已下线的 CDN 或 DDNS 地址；
- `dhcp_option` 中的 `6` 是 DNS 服务器选项，让 DHCP 下发的 DNS 就是路由器自己；
- **`strictorder=1` 不能省**，原因见 2.8.5。

#### 2.8.5 为什么必须加 strict-order

dnsmasq 默认会在所有已知上游之间**择优轮询**，而不是「按顺序优先」。当上游同时有 AGH（`127.0.0.1#5335`）和公共 DNS 时，一部分查询会直接走公共 DNS，**静默绕过广告过滤**。

实测连查 5 次 `doubleclick.net`：

| 配置 | 结果 |
| ----------------- | ------------------------------------------------------ |
| 无 `strict-order` | `2404:...::66 / ::71 / ::64 / ::65 / ::66` —— 全部漏过 |
| 有 `strict-order` | `:: / :: / :: / :: / ::` —— 5/5 拦截成功 |

这个坑很隐蔽：网络完全正常，只是广告拦不住，不逐条验证根本发现不了。

加上 `strictorder=1` 后，dnsmasq 严格按 `server` 列表顺序尝试，AGH 不通才落到下一个。

#### 2.8.6 DNS 劫持规则

`dns_redirect` 保持关闭（`0`），改用显式 DNAT 把客户端的 `53` 请求拉回路由器。由于 dnsmasq 现在就在 `53`，规则和之前一致：

```bash
uci add firewall redirect
uci set firewall.@redirect[-1].name='DNS-Hijack-v4'
uci set firewall.@redirect[-1].src='lan'
uci set firewall.@redirect[-1].proto='tcp udp'
uci set firewall.@redirect[-1].src_dport='53'
uci set firewall.@redirect[-1].dest_ip='192.168.10.1'
uci set firewall.@redirect[-1].dest_port='53'
uci set firewall.@redirect[-1].target='DNAT'
uci set firewall.@redirect[-1].family='ipv4'

uci add firewall redirect
uci set firewall.@redirect[-1].name='DNS-Hijack-v6'
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

这样即使设备手动把 DNS 设成 `8.8.8.8`，请求也会被拉回路由器。

#### 2.8.7 验证

```bash
netstat -lnp | grep -E ':(53|5335) '
nslookup www.baidu.com 192.168.10.1
nslookup ImmortalWrt.lan 192.168.10.1
nslookup doubleclick.net 192.168.10.1
```

预期：

- `53` 由 dnsmasq 监听；`5335` 只监听 `127.0.0.1` 和 `::1`；
- `doubleclick.net` 返回 `0.0.0.0` 或 `::`；
- 局域网设备直连 `192.168.10.1:5335` 应当**没有响应**。

> ⚠️ 刚装完或刚重启时先别急着下结论。AGH 的过滤规则在 `/var/lib/adguardhome` 里，而这个目录在内存盘上，每次重启都会重新下载，通常要 40 秒左右。规则没到位时查 `doubleclick.net` 会返回真实地址，这**不是配置错误**。
>
> 判断规则是否就绪看日志：出现 `filtering: filter updated ... rules_count=192232` 才算加载完成。规则到位后还要清一次 dnsmasq 缓存，否则会继续命中之前缓存的未过滤结果：
>
> ```bash
> logread | grep "filter updated"
> /etc/init.d/dnsmasq restart
> ```

再验证兜底能力（这一步最能说明问题）：

```bash
/etc/init.d/adguardhome stop
nslookup www.qq.com 192.168.10.1    # 仍应正常返回
/etc/init.d/adguardhome start
```

AGH 停掉后域名照常解析，说明升级期间即使 AGH 不在，也不会断网。

### 2.9 配置 UPnP（可选）

UPnP 可以让下载工具、游戏主机自动向路由器申请端口映射。配置前先确认 WAN 是否有公网 IPv4：

```bash
ip -4 addr show pppoe-3
```

> PPPoE 接口名以实际为准（常见 `pppoe-wan`、`pppoe-3`），用 `ip -4 addr` 查看。

如果地址落在 `100.64.0.0/10`（运营商级 NAT，CGNAT）、`10.0.0.0/8`、`172.16.0.0/12` 或 `192.168.0.0/16`，说明没有公网 IPv4。此时 UPnP 只能完成「内网 → 路由器」这一层映射，外网依然无法主动访问，需要外网访问请使用公网 IPv6 或 frp、Tailscale 之类的方案。

安装（使用 nftables 版本，对应 fw4）：

```bash
apk update
apk add miniupnpd-nftables luci-app-upnp luci-i18n-upnp-zh-cn
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
apk add miniupnpc
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

### 2.10 常见问题

#### 2.10.1 DHCP 租约到期后未把原 IP 分回来的原因

DHCP 租约只是「在到期前这个地址归你用」的临时授权，不是永久绑定。租约到期只代表地址回到池子，服务器没有义务再分给同一台设备。

dnsmasq 默认按客户端 MAC 做哈希散列，再寻找空闲地址。重装系统后，客户端首次联网发送的是 `DHCPDISCOVER`（不会声明「我上次用的是哪个 IP」），如果原地址此时仍被占用，就会顺延到别的地址；之后客户端持续续租，就固定在新地址上。

另外，OpenWrt 默认把租约文件放在 `/tmp/dhcp.leases`，而 `/tmp` 是内存盘，路由器重启后租约历史会清空。

如果需要固定 IP，正确做法是配置静态租约：

> **菜单路径**：网络 → DHCP/DNS → 静态地址分配 → 添加

把设备的 MAC 绑定到指定 IP 即可，与重装系统、租约到期都无关。

#### 2.10.2 AdGuard Home 客户端全为 `127.0.0.1` 的原因

这是 2.8.2 方案 A 的**预期行为**，不是故障：dnsmasq 作为统一入口，把查询从本机回环转发给 AdGuard Home，真实来源 IP 在这一跳丢失。

如果确实需要按设备统计，只能换回方案 B（让 AGH 直接占 `53`），代价是 AGH 缺失时全屋断 DNS。两者不可兼得，按优先级选。

顺带提醒：方案 A 下如果 AGH 面板里出现大量 `rate limited` 日志，检查 `ratelimit` 是否为 `0`（见 2.8.3）。

#### 2.10.3 局域网有公网 IPv6 但部分设备无法访问 IPv6 的排查

先确认路由器本身是否连通：

```bash
ping -6 -c 2 2001:4860:4860::8888
```

路由器能通而客户端不通时，检查客户端是否拿到了公网 IPv6 地址、防火墙是否放行 ICMPv6，以及 RA 是否正常下发。注意部分 IPv6 DNS 地址（例如 `240c::6666`）本身不响应 ping，不能用它判断 IPv6 是否可用。

### 2.11 安全建议（可选）

- 关闭 SSH 密码登录：确认密钥登录可用后，设置 `PasswordAuth='off'` 和 `RootPasswordAuth='off'`，并保持 `Interface='lan'`；
- 谨慎开启 Full-cone NAT：`fullcone='1'` 会让内网主机向外发过包后，任何外部主机都能主动连回来，通常只有游戏机或 P2P 场景需要；
- 删除不需要的 WAN 放行规则（例如未使用 IPSec 时的 ESP、ISAKMP 规则），减少暴露面；
- UPnP 不用时关闭，它允许内网程序自行开放端口；
- `min_cache_ttl` 不要设置过大，否则会掩盖 DNS 记录的更新。

## 3. 系统升级

x86 平台可以直接用 `sysupgrade` 升级并保留配置，但跨大版本、跨包管理器时有不少细节。这一章是两次实测（24.10.5 → 24.10.6、24.10.6 → 25.12.2）的记录。

### 3.1 升级前必须做的三件事

#### 3.1.1 备份

```bash
# 配置备份（sysupgrade 保留清单里的内容）
sysupgrade -b /tmp/bk-$(date +%Y%m%d).tar.gz

# 整份 /etc 和 /root（含自建脚本、旧配置备份）
tar -czf /tmp/etc-full.tar.gz /etc
tar -czf /tmp/root-dir.tar.gz /root

# 已安装包清单：24.10 及更早用第一行，25.12 起用第二行
opkg list-installed > /tmp/pkgs-before.txt
apk info > /tmp/pkgs-before.txt
```

`/tmp` 是内存盘，**重启即失**，务必先 `scp` 到电脑上。

#### 3.1.2 用 extroot 的系统必须先处理 fstab

如果按 2.4 节把 `/` 挂到了 `sda3`（extroot），直接升级会得到**新内核 + 旧用户空间**的错位系统。

原因：extroot 的挂载规则会同时存在于 `/etc/config/fstab` 和 `/rom/etc/config/fstab`（装机时烘焙进镜像），升级后会被还原。

正确做法是**不改动正在运行的系统**，而是准备一份定制配置包，删掉 extroot 那一个块后用它刷机：

```bash
# 解包备份，用 awk 按空行分段精确删除含目标 UUID 的配置块
cd /tmp && rm -rf cfgw && mkdir cfgw
tar -xzf /tmp/bk-*.tar.gz -C /tmp/cfgw
cd /tmp/cfgw/etc/config
cp fstab fstab.orig
awk 'BEGIN{RS="";ORS="\n\n"} $0 !~ /2b8f7905/ {print}' fstab.orig > fstab

# 重新打包（只带 etc 和 www，避免带入临时文件）
cd /tmp/cfgw && tar -czf /tmp/cfg-noextroot.tar.gz etc www
```

刷机时用 `-f` 指定这份配置：

```bash
sysupgrade -v -T -f /tmp/cfg-noextroot.tar.gz /tmp/fw.img.gz   # -T 仅试运行
sysupgrade -v -f /tmp/cfg-noextroot.tar.gz /tmp/fw.img.gz
```

> 没有 extroot（`/` 就是 `sda2`）的机器可以跳过这一节。

#### 3.1.3 核对镜像分区表与磁盘是否一致

x86 的 sysupgrade 会读镜像里的分区表：与磁盘一致就按分区逐个写入；不一致时会提示 `Partition layout has changed. Full image will be written.`，这时整盘写入有覆盖 `sda3` 的风险。

先看磁盘实际的分区起始与大小（单位是 512 字节扇区）：

```bash
for p in sda1 sda2 sda3; do
  echo "$p start=$(cat /sys/block/sda/$p/start) size=$(cat /sys/block/sda/$p/size)"
done
```

```text
sda1 start=512 size=65536          # 32 MB，/boot
sda2 start=66560 size=614400       # 300 MB，/
sda3 start=681984 size=61851312    # 剩余空间，挂 /mnt/sda3
```

再解压镜像用 `fdisk -l 镜像文件` 对照（Windows 上可用 WSL，或在 PE 的 DiskGenius 里打开镜像）。

实测 24.10.6 与 25.12.2 的 x86-64 combined 镜像分区表完全相同（`p1 512/65536`、`p2 66560/614400`），升级只覆盖前两块分区，`sda3` 不受影响。升级后 `sda3` 仍在，会被 `anon_mount` 自动挂到 `/mnt/sda3`。

### 3.2 小版本升级（24.10.5 → 24.10.6）

同一条版本线内升级最简单：

```bash
sysupgrade -v -T /tmp/fw.img.gz   # 只校验，不写入
sysupgrade -v /tmp/fw.img.gz      # 正式升级，重启约 1 分钟
```

保留 `/etc`，但**不保留额外安装的包**，升级后要按 3.4 重装。

### 3.3 跨大版本升级（24.10.6 → 25.12.2）

25.12 最大的变化是包管理器从 opkg 换成了 apk，命令和源文件格式都不一样：

| 项 | 24.10 | 25.12 |
| -------- | -------------------------- | ---------------------------------------- |
| 包管理器 | opkg | apk |
| 源文件 | `/etc/opkg/distfeeds.conf` | `/etc/apk/repositories.d/distfeeds.list` |
| 索引文件 | `Packages.gz` | `packages.adb` |
| 更新索引 | `opkg update` | `apk update` |
| 安装包 | `opkg install` | `apk add` |
| 已装列表 | `opkg list-installed` | `apk info` |
| 搜索 | `opkg list \| grep` | `apk search` |
| 内核 | 6.6.x | 6.12.x |

步骤：

```bash
# 1. 下载并校验镜像（PC 访问 USTC 可能返回 403，用路由器下载更稳）
cd /tmp
wget -O fw.img.gz \
  https://mirrors.ustc.edu.cn/immortalwrt/releases/25.12.2/targets/x86/64/immortalwrt-25.12.2-x86-64-generic-ext4-combined.img.gz
sha256sum fw.img.gz   # 与官方 sha256sums 对照，不一致就停

# 2. 试运行
sysupgrade -v -T /tmp/fw.img.gz

# 3. 正式刷机
sysupgrade -v /tmp/fw.img.gz
```

SSH 会在刷机过程中断开，这是正常的（实测写入加重启约 1 分钟）。担心写入时被挂断信号打断，可以脱离会话执行：

```bash
setsid sh -c "sysupgrade -v /tmp/fw.img.gz >/tmp/upg.log 2>&1" </dev/null >/dev/null 2>&1
```

重启后先确认版本，再换源：

```bash
. /etc/openwrt_release && echo $DISTRIB_DESCRIPTION   # ImmortalWrt 25.12.2
uname -r                                               # 6.12.x
```

新镜像自带的源是 `mirrors.vsean.net`，按 2.6 节改成 USTC 后 `apk update`。

> 跨大版本时**不要**叠加 ImageBuilder 定制镜像。自定义烘包会引入「配置从哪来」的额外变量，先用官方镜像把系统跑通，之后再做定制。

### 3.4 升级后必须重装的包

`sysupgrade` 只保留配置，**不保留通过 opkg/apk 额外安装的包**。配置文件本身会留下：

- `/etc/adguardhome/adguardhome.yaml`（在 `/lib/upgrade/keep.d/adguardhome` 里；24.10 是 `/etc/adguardhome.yaml`）；
- `/etc/config/argon`（主题配色、壁纸）；
- `/etc/config/upnpd`（UPnP 设置）。

程序则要重装。两次升级实际丢掉的包：

| 包 | 症状 |
| ------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `adguardhome` | `5335` 无人监听，广告不再拦截；`53` 仍有 dnsmasq，网络不断 |
| `luci-theme-argon` | LuCI 样式错乱：`mediaurlbase` 还指向 `/luci-static/argon`，但目录里没有 CSS |
| `luci-app-argon-config`、`luci-i18n-argon-config-zh-cn` | 主题设置菜单消失 |
| `miniupnpd-nftables`、`luci-app-upnp`、`luci-i18n-upnp-zh-cn` | UPnP 页面消失，`/etc/config/upnpd` 仍是 `enabled='1'` 但进程没跑 |

重装（25.12 用 `apk add`）：

```bash
apk update
apk add adguardhome
apk add luci-theme-argon luci-app-argon-config luci-i18n-argon-config-zh-cn
apk add miniupnpd-nftables luci-app-upnp luci-i18n-upnp-zh-cn
```

> 主题相关的 `/etc/config/argon` 会被保留，重装后配色和壁纸设置不用重配。装完记得在浏览器里 `Ctrl+F5` 强制刷新，否则旧 CSS 还在缓存里。

对比升级前后的包清单是找出遗漏最快的方法：

```bash
apk info > /tmp/pkgs-after.txt
# 与升级前备份的 pkgs-before.txt 做 diff
```

差异里出现 `lua`、`luci-compat`、`opkg`、`libubox20240329` 这类名字属于版本线换代（25.12 移除了 Lua 栈、换了 ABI 版本），不是丢包；真正需要补的只会是具体功能包。

这就是 2.8.2 推荐方案 A 的原因：dnsmasq 是基础镜像自带的，升级后一定还在，`53` 立刻有人应答，只有「广告不拦」，不会「全屋断网」。

### 3.5 升级后常见问题

| 现象 | 原因 | 处理 |
| -------------------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `apk update` 报 DNS 解析失败 | 本机 `53` 无人应答，不是网络问题 | 临时 `echo "nameserver 223.5.5.5" > /etc/resolv.conf`，修好 DNS 后恢复 |
| 源指向 `mirrors.vsean.net`，部分源 404 | 新镜像自带的默认源 | 按 2.6 节改成 USTC，并同步 `system.@imm_init[0].apk_mirror` |
| `kmods` 源 404 | 内核版本串变了 | 用镜像 manifest 里的 `kmods/6.12.103-1-…` 路径 |
| 广告突然不拦了 | 规则还在下载，或 dnsmasq 缓存了未过滤的结果 | 等 `filter updated` 日志出现，再 `/etc/init.d/dnsmasq restart`（见 2.8.7） |
| LuCI 样式错乱、只有文字没有排版 | 主题包丢了，但 `luci.main.mediaurlbase` 还指向 `/luci-static/argon` | 重装 `luci-theme-argon`，确认 `/www/luci-static/argon/css/cascade.css` 存在 |
| 访问 LuCI 返回 403 | 25.12 未登录时返回 403 且带 `X-Luci-Login-Required: yes`，属正常行为 | 直接看登录页，正常登录即可 |
| 面板能开但网站打不开 | AGH 装好了但没启动 | `netstat -ln \| grep :5335` 确认谁在监听 |

### 3.6 升级后验收清单

```bash
. /etc/openwrt_release && echo $DISTRIB_DESCRIPTION   # 版本
uname -r                                               # 内核
df -h /                                                # 根分区
apk info | wc -l                                       # 包数量
netstat -ln | grep -E ':(53|5335) '                    # 端口归属
nslookup www.qq.com 192.168.10.1                       # 正常解析
nslookup doubleclick.net 192.168.10.1                  # 广告拦截生效
ping -c 2 223.5.5.5                                    # 外网连通
```

最后重启一次再验一遍，确认所有服务都能开机自启——`/etc/rc.d/` 里应有 `S19dnsmasq`、`S19adguardhome`、`S94miniupnpd`。
