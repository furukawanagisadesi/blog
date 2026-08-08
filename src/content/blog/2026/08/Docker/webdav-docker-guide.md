---
title: 'WebDAV Docker 设置教程'
description: '在 Linux 服务器上用 Docker 部署 WebDAV 文件服务'
pubDate: '2026-08-08'
---

## 创建文件夹

先在linux服务器中创建一个文件夹，用于存储webdav数据，比如/home/admin/webdav

## 服务器开放端口

```
TCP 6065
```
## 创建docker-compose.yml文件

创建文件夹后在目录下新建docker-compose.yml文件，并写入
```yml
services:
  webdav:
    container_name: webdav-server
    image: ghcr.io/hacdias/webdav
    restart: unless-stopped
    ports:
      - "6065:6065"
    volumes:
      - ./config.yml:/config.yml:ro
      - ./data:/data
    command: -c /config.yml

```

## 创建config.yml文件

```yml
# 服务器地址和端口配置
address: 0.0.0.0
port: 6065

# 基础配置
tls: false
prefix: /
debug: false
noSniff: false
behindProxy: false
directory: /data

# 权限配置（完整读写权限）
permissions: CRUD

# CORS配置（允许网页访问）
cors:
  enabled: true
  credentials: true
  allowed_headers:
    - Depth
    - Authorization
    - Content-Type
    - Content-Length
  allowed_hosts:
    - "*"
  allowed_methods:
    - GET
    - PUT
    - POST
    - DELETE
    - PROPFIND
    - MKCOL
    - COPY
    - MOVE
  exposed_headers:
    - Content-Length
    - Content-Range

# 用户认证配置
users:
  - username: admin
    password: wby999
```

## 执行终端命令

```
cd /home/admin/webdav
docker compose up -d
```