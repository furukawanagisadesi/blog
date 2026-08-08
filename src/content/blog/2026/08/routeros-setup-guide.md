---
title: 'RouterOS 配置流程'
description: 'RouterOS 软路由的完整配置流程：接口、IP、DHCP、NAT 与 DNS'
pubDate: '2026-08-08'
---

# ⚙️ RouterOS 完整配置流程

## ① 重命名接口（区分 WAN / LAN）

1. 打开 **WinBox**，登录到 RouterOS
2. 左侧点击 **Interfaces**
3. 找到：
   - 接光猫的接口 → 改名为 `WAN`
   - 接电脑 / 家用路由的接口 → 改名为 `LAN`

📌 提示：
如果不确定哪个是哪个，可以拔插网线，看哪一个 interface 状态变灰/变绿。

## ② 给 LAN 接口设置固定 IP

菜单路径：`IP → Addresses → Add (+)`

填写：

`Address: 192.168.88.1/24 Interface: LAN Comment: LAN网关`

确认在列表中出现：

`192.168.88.1/24  →  LAN`

## ③ 配置 DHCP Server（让 ROS 给电脑分 IP）

菜单路径：`IP → DHCP Server → DHCP Setup`

按提示逐步选择：

| 步骤 | 内容 | 示例 |
| --- | --- | --- |
| Step 1 | Interface | LAN |
| Step 2 | DHCP Address Space | 192.168.88.0/24 |
| Step 3 | Gateway | 192.168.88.1 |
| Step 4 | Addresses to Give Out | 192.168.88.10 - 192.168.88.200 |
| Step 5 | DNS Servers | 192.168.88.1 或 114.114.114.114 |
| Step 6 | Lease Time | 12h |

完成后，你会在：

`IP → DHCP Server → Leases`

看到电脑获取的 IP。

## ④ 设置 WAN 接口自动获取上级光猫 IP

菜单路径：`IP → DHCP Client → Add (+)`

填写：

`Interface: WAN Use Peer DNS: no Use Peer NTP: yes Add Default Route: yes`

确认能自动获取 IP（例如 192.168.1.100），说明 ROS 已与光猫通信正常。

## ⑤ 设置 NAT（让内网设备能上网）

菜单路径：`IP → Firewall → NAT → Add (+)`

填写：

`Chain: srcnat Out. Interface: WAN Action: masquerade Comment: NAT 出口`

这一步是关键，否则电脑虽拿到 IP 但无法上网。

## ⑥ 开启 DNS 转发（让 ROS 做内网 DNS）

菜单路径：`IP → DNS`

设置：

`Servers: 114.114.114.114, 223.5.5.5 Allow Remote Requests: √（打勾）`

这让内网设备以 RouterOS（192.168.88.1）为 DNS，ROS 会帮它转发。

## ⑦ 测试电脑

在电脑上：

- 连接 ROS 的 LAN 口（或通过交换机）
- IP 设置为"自动获取（DHCP）"

检查：

`ipconfig /all`

应看到：

`IP地址: 192.168.88.10 默认网关: 192.168.88.1 DNS服务器: 192.168.88.1`

✅ 打开浏览器访问网页 —— 能上网即成功。
