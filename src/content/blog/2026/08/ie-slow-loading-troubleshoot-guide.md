---
title: "IE 网页加载缓慢异常查询与解决"
description: "记录一次 IE 浏览器网页加载缓慢异常查询与解决的过程"
pubDate: "2026-08-17"
---

> 本文记录一次 IE 浏览器网页加载缓慢异常查询与解决的过程。

## 1. 现象描述

访问 `https://www.ebaolife.net/login.jsp` 时：

- Chrome：几秒钟加载完毕
- IE：2 分钟加载完毕

## 2. 测试过程

### 禁用 IE 扩展

用扩展禁用模式启动 IE：

```bash
iexplore.exe -extoff
```

禁用扩展后访问网页依旧很慢，排除插件问题。

### 测试 DNS 与网络

```bash
nslookup www.ebaolife.net
ping www.ebaolife.net
```

结果：

```text
www.ebaolife.net → 223.6.248.204
平均 20ms，丢包 0%
```

结论：DNS 解析与到服务器的网络均正常。

### 使用 curl 对比

```bash
curl -I -v https://www.ebaolife.net/
```

`curl` 访问也很慢，加入时间统计：

```bash
curl -I -v -w "\nDNS: %{time_namelookup}\nTCP: %{time_connect}\nTLS: %{time_appconnect}\nTTFB: %{time_starttransfer}\nTOTAL: %{time_total}\n" https://www.ebaolife.net/
```

结果：

```text
DNS:   0.006s
TCP:   0.029s
TLS:   0
TTFB:  0
TOTAL: 105.268s
```

报错：

```text
schannel: next InitializeSecurityContext failed:
CRYPT_E_REVOCATION_OFFLINE (0x80092013)

由于吊销服务器已脱机，吊销功能无法检查吊销。
```

### 小结

`TCP` 仅 `0.029s`，`TOTAL` 却达 `105.268s`，耗时几乎全部卡在 **TLS 证书验证** 阶段，问题不在网站响应本身：

> **方向**：Windows 在 TLS 握手期间进行证书吊销状态检查时出现了问题。

## 3. 验证

### 关闭证书吊销检查

> **菜单路径**：Internet 选项 → 高级 → 安全

取消勾选 **检查服务器证书是否已吊销**，再次访问网址：

> IE 访问速度恢复正常

### 检查网站证书

证书为 DigiCert 签发，`*.ebaolife.net` 的 AIA 中包含：

```text
OCSP:
http://ocsp.digicert.com

CA Issuers:
http://cacerts.digicert.com/EncryptionEverywhereDVTLSCA-G2.crt
```

> 证书没有 CRL Distribution Points，只能通过 OCSP 做吊销检查。

### 测试 OCSP 连通性

```bash
curl -v --connect-timeout 10 http://ocsp.digicert.com/
```

结果：

```text
ocsp.digicert.com → 23.11.38.161

Trying 23.11.38.161:80...
Connection timed out

curl: (28) Connection timed out
```

### 反向验证

```bash
curl -I -v --ssl-no-revoke https://www.ebaolife.net/
```

结果：

> 几秒钟加载完成

### 问题发生流程

```text
ebaolife.net
↓
DigiCert 证书
↓
Windows Schannel
↓
需要进行 OCSP 吊销检查
↓
访问 ocsp.digicert.com:80
↓
TCP 连接超时
↓
CRYPT_E_REVOCATION_OFFLINE
↓
等待约 105 秒
↓
IE 页面加载非常慢
```

## 4. 结论

> 当前网络无法正常访问 DigiCert 的 OCSP 服务 `ocsp.digicert.com:80`，导致 Windows Schannel 的证书吊销检查超时，从而使 IE 和使用 Schannel 的 `curl` 在 TLS 阶段长时间等待。

## 5. 分析

### 为什么 Chrome 没有这个问题？

> Chrome 和 IE 并不是完全使用同一套证书验证路径。

### IE 的验证路径

IE 主要依赖 Windows 的证书验证体系：

每次建立 HTTPS 连接时，默认会严格尝试进行证书吊销检查：下载证书中指定的 CRL（证书吊销列表），或查询 OCSP（在线证书状态协议）服务器。如果网络不通导致无法获取状态，可能会拖慢加载速度，甚至直接阻断访问。

```text
IE → WinINet → Windows Schannel
→ Windows CryptoAPI → Windows 证书存储
→ 证书链/吊销状态检查
```

### Chrome 的验证路径

Chrome 使用自己的网络与证书验证体系：

为了保证页面加载速度并保护用户隐私，Chrome 尽量避免频繁向第三方 CA 发送实时查询。它主要依赖浏览器自身的更新推送（如 CRLSet）或者采用“软失败（Soft-fail）”策略，即网络异常时默认不拦截。

Chrome 没有走 Windows Schannel 这条导致 105 秒超时的路径。

## 6. 解决方案

### 临时方案

> **菜单路径**：Internet 选项 → 高级 → 安全 → 取消 **检查服务器证书是否已吊销**

### 最终方案

> 防火墙内放通域名 `ocsp.digicert.com`
