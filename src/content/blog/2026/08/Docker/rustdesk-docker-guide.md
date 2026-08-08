---
title: 'RustDesk Docker 设置教程'
description: '在 Linux 服务器上用 Docker 部署 RustDesk 远程桌面服务'
pubDate: '2026-08-08'
---

## 创建文件夹

先在linux服务器中创建一个文件夹，用于存储rustdesk数据，比如/home/admin/rustdesk

## 服务器开放端口

```
TCP 21114
TCP 21115
TCP 21116
UDP 21116
TCP 21117
TCP 21118
TCP 21119
```
## 创建docker-compose.yml文件

创建文件夹后在目录下新建docker-compose.yml文件，并写入
```yml
version: '3'

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
      - "RELAY=公网服务器ip:21117"
      - "ENCRYPTED_ONLY=1"
    volumes:
      - ./data:/data
    restart: unless-stopped

```

## 执行终端命令

```
cd /home/admin/webdav
docker compose up -d
```

## 客户端设置

执行终端命令后将在/home/admin/rustdesk生成data文件夹，文件夹内会生成id_ed25519.pub文件，此为rustdesk公钥

```
cat /home/admin/rustdesk/data/id_ed25519.pub
```
查看并复制公钥，进入客户端操作，设置-网络-解锁网络设置-ID/中继服务器-填入ID服务器&中继服务器-填入Key-点击确认

到此，客户端配置完成