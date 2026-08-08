---
title: 'SRS Docker 设置教程'
description: '在 Linux 服务器上用 Docker 部署 SRS 流媒体服务器'
pubDate: '2026-08-08'
---

## 创建文件夹

先在 Linux 服务器中创建一个文件夹，用于存储 SRS 数据，比如 /home/admin/srs

```bash
mkdir -p /home/admin/srs
```

## 服务器开放端口

```
TCP 1935   # RTMP 推流
TCP 1985   # HTTP API（建议仅本机访问）
```

## 创建 srs.conf 文件

创建文件夹后在目录下新建 srs.conf 文件，并写入

```
listen              1935;
max_connections     1000;
daemon              off;
srs_log_tank        console;

http_api {
    enabled         on;
    listen          1985;
}

http_server {
    enabled         on;
    listen          8080;
    dir             ./objs/nginx/html;
}

vhost __defaultVhost__ {

    # HTTP-FLV 低延迟播放
    http_remux {
        enabled         on;
        mount           [vhost]/[app]/[stream].flv;
    }

    # HLS 切片
    hls {
        enabled         on;
        hls_fragment    2;
        hls_window      6;
    }
}
```

## 创建docker-compose.yml文件

创建文件夹后在目录下新建 docker-compose.yml 文件，并写入

```yml
services:
  srs:
    image: registry.cn-hangzhou.aliyuncs.com/ossrs/srs:5
    container_name: srs
    restart: unless-stopped
    ports:
      - "1935:1935"   # RTMP 推流（公网）
      - "1985:1985"   # API 管理（建议安全组仅本机访问）
    # 8080 不对外暴露，只在内部网络给 Nginx 访问
    expose:
      - "8080"
    volumes:
      - ./srs.conf:/usr/local/srs/conf/docker.conf:ro
      - ./logs:/usr/local/srs/objs/logs
    environment:
      - TZ=Asia/Shanghai

```

> 如果不需要 Nginx 反代，可以将 8080 也加入 ports 直接对外暴露 HTTP-FLV/HLS 播放地址

## 执行终端命令

```bash
cd /home/admin/srs
docker compose up -d
```

## 测试推流

使用 OBS 或 ffmpeg 推流到 `rtmp://你的服务器IP:1935/live/流名称`

播放地址（HTTP-FLV）：`http://你的服务器IP:8080/live/流名称.flv`

播放地址（HLS）：`http://你的服务器IP:8080/hls/流名称.m3u8`

API 查看：`http://你的服务器IP:1985/api/v1/versions`
