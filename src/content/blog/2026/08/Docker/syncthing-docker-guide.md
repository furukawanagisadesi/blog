---
title: 'Syncthing Docker 设置教程'
description: '在 Linux 服务器上用 Docker 部署 Syncthing 文件同步服务'
pubDate: '2026-08-08'
---

## 创建文件夹

先在 Linux 服务器中创建一个文件夹，用于存储 Syncthing 数据，比如 /home/admin/syncthing

```bash
mkdir -p /home/admin/syncthing/data
```

## 服务器开放端口

```
TCP 8384      # 网页管理界面
TCP 22000     # 设备同步
UDP 22000     # 设备同步
UDP 21027     # 局域网发现
```

## 创建docker-compose.yml文件

创建文件夹后在目录下新建 docker-compose.yml 文件，并写入

```yml
services:
  syncthing:
    image: syncthing/syncthing
    container_name: syncthing
    restart: unless-stopped
    ports:
      - "8384:8384"       # 网页管理界面
      - "22000:22000/tcp" # 设备同步
      - "22000:22000/udp"
      - "21027:21027/udp" # 局域网发现
    volumes:
      - ./data:/var/syncthing
    environment:
      - PUID=1000
      - PGID=1000
```

## 执行终端命令

```bash
cd /home/admin/syncthing
docker compose up -d
```

## 访问管理界面

打开浏览器访问 `http://你的服务器IP:8384`

首次打开需要设置用户名和密码，然后在操作-选项中开启 "GUI 身份认证"

## 添加同步设备

1. 在本地电脑的 Syncthing 中点击"添加远程设备"
2. 填入服务器 Syncthing 的设备 ID（可在服务器管理界面右上角看到）
3. 在服务器管理界面确认添加
4. 两边各自设置要同步的文件夹
