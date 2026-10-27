---
title: "Syncthing Docker 设置教程"
description: "在 Linux 服务器上用 Docker 部署 Syncthing 文件同步服务"
pubDate: "2026-08-08"
updatedDate: "2026-10-27"
tags: ["Docker"]
---

## 1. 创建文件夹

先在 Linux 服务器中创建一个文件夹，用于存储 Syncthing 数据，比如 `/home/admin/syncthing`：

```bash
mkdir -p /home/admin/syncthing/data
```

## 2. 开放服务器端口

```
TCP 22000     # 设备同步（公网）
UDP 22000     # 设备同步（公网）
```

`8384` 不再对公网开放，改为只监听宿主机回环地址，通过 SSH 隧道访问。VPS 上也不需要开放 `21027/udp`，局域网发现只在同一局域网内有用。

## 3. 创建 docker-compose.yml 文件

创建文件夹后在目录下新建 `docker-compose.yml` 文件，并写入：

```yml
services:
  syncthing:
    image: syncthing/syncthing
    container_name: syncthing
    restart: unless-stopped
    ports:
      # GUI 只在宿主机回环地址上发布，公网无法直接访问
      - "127.0.0.1:8384:8384"
      # 同步端口保持公网可达
      - "22000:22000/tcp"
      - "22000:22000/udp"
      # 局域网发现端口 21027/udp 不在公网发布（VPS 上用不到）
    volumes:
      - ./data:/var/syncthing
    environment:
      - PUID=1000
      - PGID=1000
      # 必须是 0.0.0.0，不能写 127.0.0.1：
      # Docker 会把流量转发到容器 eth0，监听 127.0.0.1 会连不上。
      - STGUIADDRESS=0.0.0.0:8384
```

## 4. 启动服务

```bash
cd /home/admin/syncthing
docker compose up -d
```

## 5. 访问管理界面

GUI 只绑定在服务器的 `127.0.0.1:8384`，不能直接通过公网 IP 访问。先在本地建立 SSH 隧道：

```bash
# 本地 8384 未被占用时
ssh -N -L 8384:127.0.0.1:8384 root@your_server_ip

# 如果本地 8384 已被本机的 Syncthing 占用，改用 8385
ssh -N -L 8385:127.0.0.1:8384 root@your_server_ip
```

然后浏览器访问 `http://127.0.0.1:8384`（或 `http://127.0.0.1:8385`）。`-N` 表示只做端口转发、不打开远程 shell，命令执行后没有输出是正常的，终端窗口需要保持打开。

首次打开需要设置用户名和密码，然后在操作-选项中开启 "GUI 身份认证"。

> 注意：容器内的 `STGUIADDRESS` 必须设为 `0.0.0.0:8384`。Docker 端口映射会把流量转发到容器的 eth0 地址（如 `172.x.x.x`），如果容器内只监听 `127.0.0.1`，宿主机的映射端口会连不上。对公网的访问限制由 compose 里的 `127.0.0.1:8384:8384` 完成。

## 6. 添加同步设备

1. 在本地电脑的 Syncthing 中点击"添加远程设备"
2. 填入服务器 Syncthing 的设备 ID（可在服务器管理界面右上角看到）
3. 在服务器管理界面确认添加
4. 两边各自设置要同步的文件夹
