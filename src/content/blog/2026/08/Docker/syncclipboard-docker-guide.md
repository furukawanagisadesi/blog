---
title: 'SyncClipboard Docker 设置教程'
description: '在 Linux 服务器上用 Docker 部署 SyncClipboard 剪贴板同步服务'
pubDate: '2026-08-08'
---

## 创建文件夹

先在 Linux 服务器中创建一个文件夹，用于存储 SyncClipboard 数据，比如：
```bash
mkdir -p /home/admin/syncclipboard
```

## 服务器开放端口

```
TCP 5033
```

## 创建docker-compose.yml文件

创建文件夹后在目录下新建docker-compose.yml文件，并写入，记得修改账号密码
```yml
services:
  syncclipboard:
    container_name: syncclipboard-server
    image: jericx/syncclipboard-server:latest
    restart: unless-stopped
    ports:
      - "5033:5033"
    environment:
      - SYNCCLIPBOARD_USERNAME=your_username
      - SYNCCLIPBOARD_PASSWORD=your_password
    volumes:
      - ./data:/app/data
```

## 执行终端命令

```bash
cd /home/admin/syncclipboard
docker compose up -d
```