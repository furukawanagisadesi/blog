---
title: 'IE 网页加载缓慢异常查询与解决'
description: '记录一次 IE 浏览器网页加载缓慢异常查询与解决的过程'
pubDate: '2026-08-17'
---

本文记录某次 IE 浏览器网页加载缓慢异常查询与解决的过程

## 1. 现象描述

访问：

```text
https://www.ebaolife.net/login.jsp
```

表现为：

- Chrome：几秒钟加载完毕
- IE：2 分钟加载完毕

## 2. 测试过程

1. 首先尝试禁用 IE 扩展

```bash
iexplore.exe -extoff
```

禁用浏览器扩展后访问网页，依旧加载很慢。
排除 IE 插件问题。

执行：

```bash
nslookup www.ebaolife.net
```

2. 测试 DNS 与网络

结果:

```text
www.ebaolife.net
→ 223.6.248.204
```

执行：

```bash
ping www.ebaolife.net
```

结果：

```text
平均 20ms
丢包 0%
```

结论：

- DNS 解析正常
- 到网站服务器网络正常

3. 使用 curl 对比 IE

执行：

```bash
curl -I -v https://www.ebaolife.net/
```

发现 curl 访问也很慢。

加入时间统计：

```bash
curl -I -v -w "\nDNS: %{time_namelookup}\nTCP: %{time_connect}\nTLS: %{time_appconnect}\nTTFB: %{time_starttransfer}\nTOTAL: %{time_total}\n" https://www.ebaolife.net/
```

结果:

```text
DNS:   0.006s
TCP:   0.029s
TLS:   0
TTFB:  0
TOTAL: 105.268s
```

报错:

```text
schannel: next InitializeSecurityContext failed:
CRYPT_E_REVOCATION_OFFLINE (0x80092013)

由于吊销服务器已脱机，吊销功能无法检查吊销。
```

4. 结论

```text
TCP:   0.029s
TOTAL: 105.268s

卡在：
Schannel → TLS → 证书验证
```

问题不在网站响应，而是：

> Windows 在 TLS 握手期间进行证书吊销状态检查时出现了问题。

## 3. 验证

验证 IE 的证书吊销检查

进入：

> **菜单路径**：Internet 选项 → 高级 → 安全

关闭：

> 检查服务器证书是否已吊销

访问网址

结果：

> IE 访问速度恢复正常

确认:

```text
IE 慢
 ↓
证书吊销检查
 ↓
存在问题
```

检查网站证书

证书为 DigiCert 的：

```text
*.ebaolife.net
```

AIA 中包含：

```text
OCSP:
http://ocsp.digicert.com

CA Issuers:
http://cacerts.digicert.com/EncryptionEverywhereDVTLSCA-G2.crt
```

> 证书没有 CRL Distribution Points。

测试 DigiCert OCSP

执行：

```bash
curl -v --connect-timeout 10 http://ocsp.digicert.com/
```

结果：

```text
ocsp.digicert.com
→ 23.11.38.161

Trying 23.11.38.161:80...
Connection timed out

curl: (28) Connection timed out
```

问题发生流程

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

反向验证：

```bash
curl -I -v --ssl-no-revoke https://www.ebaolife.net/
```

结果：

> 几秒钟加载完成

### 最终结果

> 当前网络无法正常访问 DigiCert 的 OCSP 服务 `ocsp.digicert.com:80`，导致 Windows Schannel 的证书吊销检查超时，从而使 IE 和使用 Schannel 的 curl 在 TLS 阶段长时间等待。

## 4. 分析

### 为什么 Chrome 没有这个问题？

> Chrome 和 IE 并不是完全使用同一套证书验证路径。

### IE

主要依赖 Windows：

```text
IE
 ↓
WinINet
 ↓
Windows Schannel
 ↓
Windows CryptoAPI
 ↓
Windows 证书存储
 ↓
证书链/吊销状态检查
```

### Chrome

主要使用 Chrome 自己的网络与证书验证体系，并有自己的：

- 证书验证逻辑
- 吊销状态处理
- 缓存
- 网络连接机制

Chrome 没有走 Windows Schannel 这条导致 105 秒超时的路径。

## 5. 解决方案

临时方案：

IE：

> **菜单路径**：Internet 选项 → 高级 → 安全 → 取消"检查服务器证书是否已吊销"

最终解决方案：

> 防火墙内放通域名 `ocsp.digicert.com`