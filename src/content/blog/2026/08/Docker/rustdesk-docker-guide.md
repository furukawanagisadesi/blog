---
title: "RustDesk Docker 设置教程"
description: "在 Linux 服务器上用 Docker 部署 RustDesk 远程桌面服务"
pubDate: "2026-08-08"
---

## 1. 创建文件夹

先在 Linux 服务器中创建一个文件夹，用于存储 RustDesk 数据，比如 `/home/admin/rustdesk`：

```bash
mkdir -p /home/admin/rustdesk
```

## 2. 开放服务器端口

```
TCP 21114
TCP 21115
TCP 21116
UDP 21116
TCP 21117
TCP 21118
TCP 21119
```

## 3. 创建 docker-compose.yml 文件

创建文件夹后在目录下新建 `docker-compose.yml` 文件，并写入：

```yml
version: "3"

services:
  rustdesk-server:
    container_name: rustdesk-server
    ports:
      - 21114:21114
      - 21115:21115
      - 21116:21116
      - 21116:21116/udp
      - 21117:21117
      - 21118:21118
      - 21119:21119
    image: swr.cn-north-4.myhuaweicloud.com/ddn-k8s/docker.io/lejianwen/rustdesk-server-s6:latest
    environment:
      - "RELAY=your_ip:21117"
      - "ENCRYPTED_ONLY=1"
    volumes:
      - ./data:/data
    restart: unless-stopped
```

## 4. 启动服务

```bash
cd /home/admin/rustdesk
docker compose up -d
```

## 5. 客户端设置

启动后会在 `/home/admin/rustdesk/data` 生成 `id_ed25519.pub` 文件，此为 RustDesk 公钥：

```bash
cat /home/admin/rustdesk/data/id_ed25519.pub
```

查看并复制公钥，进入客户端操作：

1. 设置 → 网络 → 解锁网络设置
2. ID / 中继服务器 → 填入 ID 服务器 & 中继服务器
3. 填入 Key
4. 点击确认

到此，客户端配置完成。
