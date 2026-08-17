---
title: "Easytier Docker 设置教程"
description: "在 Linux 服务器上用 Docker 部署 Easytier 组网服务"
pubDate: "2026-08-08"
---

## 1. 创建文件夹

先在 Linux 服务器中创建一个文件夹，用于存储 Easytier 数据，比如 `/home/admin/easytier`：

```bash
mkdir -p /home/admin/easytier
```

## 2. 开放服务器端口

```
UDP 22020
TCP 11211
UDP 11010
TCP 11010
UDP 11011 (WireGuard)
```

## 3. 创建 docker-compose.yml 文件

创建文件夹后在目录下新建 `docker-compose.yml` 文件，并写入：

```yml
services:
  easytier:
    image: easytier/easytier:latest
    hostname: easytier
    container_name: easytier
    restart: unless-stopped
    network_mode: host
    cap_add:
      - NET_ADMIN
      - NET_RAW
    environment:
      - TZ=Asia/Shanghai
    devices:
      - /dev/net/tun:/dev/net/tun
    volumes:
      - ./easytier:/root
      - ./machine-id:/etc/machine-id:ro
    entrypoint: /bin/sh
    command:
      - -c
      - |
        easytier-web-embed \
          --api-server-port 11211 \
          --api-host http://127.0.0.1:11211 \
          --config-server-port 22020 \
          --config-server-protocol udp & \
        sleep 2 && \
        easytier-core --config-server udp://127.0.0.1:22020/admin
```

## 4. 启动服务

```bash
cd /home/admin/easytier
docker compose up -d
```
