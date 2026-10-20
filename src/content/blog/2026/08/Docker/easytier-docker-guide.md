---
title: "Easytier Docker 设置教程"
description: "在 Linux 服务器上用 Docker 部署 Easytier 组网服务"
pubDate: "2026-08-08"
tags: ["Docker", "Network"]
---

## 1. 创建文件夹

先在 Linux 服务器中创建一个文件夹，用于存储 Easytier 数据，比如 `/home/admin/easytier`：

```bash
mkdir -p /home/admin/easytier
```

## 2. 开放服务器端口

```text
UDP 22020 （不用开放，已指向本地）
TCP 11211
UDP 11010
TCP 11010
UDP 11011 (WireGuard 可选)
```

## 3. 创建 docker-compose.yml 文件

创建文件夹后在目录下新建 `docker-compose.yml` 文件，并写入，镜像可选用 easytier/easytier:latest：

```yml
services:
  easytier-web:
    image: easytier/easytier@sha256:91d6732ea5ff71542fdb99333d2ee7b168e973443114db84db061e452427d91e
    container_name: easytier-web
    restart: unless-stopped
    network_mode: host
    environment:
      - TZ=Asia/Shanghai
    entrypoint: ["/sbin/tini", "--", "easytier-web-embed"]
    command:
      - --api-server-port
      - "11211"
      # 远程访问面板通过建立隧道访问 ssh -N -L 11211:127.0.0.1:11211 root@106.14.249.90
      - --api-server-addr
      - 127.0.0.1
      - --config-server-port
      - "22020"
      - --config-server-protocol
      - udp
      # 关键：数据库落到持久化目录
      - --db
      - /root/et.db
    volumes:
      - ./easytier:/root
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"

  easytier-core:
    image: easytier/easytier@sha256:91d6732ea5ff71542fdb99333d2ee7b168e973443114db84db061e452427d91e
    container_name: easytier          # 保持原名，docker exec 习惯不变
    restart: unless-stopped
    network_mode: host
    cap_add:
      - NET_ADMIN
      - NET_RAW
    devices:
      - /dev/net/tun:/dev/net/tun
    environment:
      - TZ=Asia/Shanghai
    volumes:
      - ./easytier:/root             # machine_id 在这里，保持持久化
    command:
      - --config-server
      - udp://127.0.0.1:22020/admin
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"
```

## 4. 启动服务

```bash
cd /home/admin/easytier
docker compose up -d
```
