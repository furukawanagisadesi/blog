---
title: 'Nginx-SRS 直播推流设置教程'
description: '在 Linux 服务器上用 Docker 部署 Nginx + SRS 直播推流服务'
pubDate: '2026-08-08'
---

## 创建文件夹

先在 Linux 服务器中创建一个文件夹，用于存储直播推流数据，比如 /home/admin/nginx-srs

```bash
mkdir -p /home/admin/nginx-srs/{web,danmu}
```

## 服务器开放端口

```
TCP 80        # 直播播放页（Nginx 反代）
TCP 1935      # RTMP 推流
TCP 1985      # SRS API（建议仅本机访问）
```

## 创建目录结构

```
nginx-srs/
├── docker-compose.yml
├── nginx.conf
├── htpasswd
├── web/
│   ├── index.html
│   └── flv.min.js
└── danmu/
    ├── Dockerfile
    ├── package.json
    └── server.js
```

创建文件夹：

```bash
mkdir -p /home/admin/nginx-srs/{web,danmu}
```

## 创建 srs.conf 文件

在 /home/admin/nginx-srs 下新建 srs.conf 文件，并写入

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

    http_remux {
        enabled         on;
        mount           [vhost]/[app]/[stream].flv;
    }

    hls {
        enabled         on;
        hls_fragment    2;
        hls_window      6;
    }
}
```

## 创建 nginx.conf 文件

在 /home/admin/nginx-srs 下新建 nginx.conf 文件，并写入

```nginx
worker_processes  1;

events {
    worker_connections  1024;
}

http {
    include       mime.types;
    default_type  application/octet-stream;
    sendfile      on;

    server {
        listen       80;
        server_name  _;

        auth_basic           "Stream Login";
        auth_basic_user_file /etc/nginx/.htpasswd;

        # 静态资源不需要认证
        location ~* \.(js|css|ico|png|jpg|svg|woff|woff2)$ {
            auth_basic off;
            root /usr/share/nginx/html;
        }

        location = / {
            root /usr/share/nginx/html;
            try_files /index.html =404;
        }

        location = /index.html {
            root /usr/share/nginx/html;
        }

        location /danmu-ws {
            proxy_pass          http://danmu:8888;
            proxy_http_version  1.1;
            proxy_set_header    Upgrade $http_upgrade;
            proxy_set_header    Connection "upgrade";
            proxy_set_header    Host $host;
            proxy_read_timeout  3600s;
        }

        location /live/ {
            proxy_pass          http://srs:8080/live/;
            proxy_http_version  1.1;
            proxy_set_header    Host $host;
            proxy_buffering     off;
            proxy_cache         off;
        }

        location /hls/ {
            proxy_pass          http://srs:8080/hls/;
            proxy_http_version  1.1;
            proxy_set_header    Host $host;
        }
    }
}
```

## 设置访问密码

```bash
# 安装 apache2-utils（如果未安装）
apt install apache2-utils -y

# 创建用户和密码
htpasswd -c /home/admin/nginx-srs/htpasswd admin
```

按提示输入两次密码，后续访问直播页会要求输入此用户名和密码

## 创建 web 播放页面

在 /home/admin/nginx-srs/web/ 下新建 index.html 文件，使用 flv.js 播放 HTTP-FLV 流，内容略（需配合 danmu WebSocket 使用）

## 创建 danmu 弹幕服务

在 /home/admin/nginx-srs/danmu/ 下创建以下文件：

**package.json**

```json
{
  "name": "danmu-server",
  "version": "1.0.0",
  "dependencies": {
    "ws": "^8.0.0"
  }
}
```

**server.js**

```javascript
const WebSocket = require('ws');

const PORT = 8888;
const wss = new WebSocket.Server({ port: PORT });
const clients = new Set();

wss.on('connection', (ws) => {
  clients.add(ws);
  console.log(`[+] Client connected. Total: ${clients.size}`);

  ws.on('message', (data) => {
    let msg;
    try { msg = JSON.parse(data); } catch { return; }
    if (msg.type !== 'danmu') return;

    const text = (msg.text || '').trim().slice(0, 50);
    if (!text) return;

    const nick = (msg.nick || '').trim().slice(0, 16);
    if (!nick) return;

    const payload = JSON.stringify({
      type: 'danmu',
      text,
      nick,
      color: msg.color || '#ffffff',
      time: Date.now(),
    });

    for (const client of clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    }
  });

  ws.on('close', () => { clients.delete(ws); console.log(`[-] Client disconnected. Total: ${clients.size}`); });
  ws.on('error', () => clients.delete(ws));
});

console.log(`Danmu WebSocket server running on ws://0.0.0.0:${PORT}`);
```

**Dockerfile**

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package.json server.js ./
RUN npm install
EXPOSE 8888
CMD ["node", "server.js"]
```

## 创建 docker-compose.yml 文件

在 /home/admin/nginx-srs 下新建 docker-compose.yml 文件，并写入

```yml
services:
  nginx:
    image: nginx:alpine
    container_name: nginx-srs
    restart: unless-stopped
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./htpasswd:/etc/nginx/.htpasswd:ro
      - ./web:/usr/share/nginx/html:ro
    networks:
      - stream-net

  danmu:
    build: ./danmu
    container_name: danmu
    restart: unless-stopped
    expose:
      - "8888"
    networks:
      - stream-net

networks:
  stream-net:
    external: true
```

## 创建外部网络

SRS 和 Nginx 共享同一个网络，先创建网络

```bash
docker network create stream-net
```

## 执行终端命令

先启动 SRS（单独的 compose 目录），再启动 nginx-srs

```bash
# 启动 SRS（在 srs 目录下）
cd /home/admin/srs
docker compose up -d

# 启动 nginx-srs
cd /home/admin/nginx-srs
docker compose up -d
```

## 推流和观看

1. 使用 OBS 推流到 `rtmp://你的服务器IP:1935/live/流名称`
2. 浏览器访问 `http://你的服务器IP` 观看直播（需要输入之前设置的密码）
3. 直接播放地址（HTTP-FLV）：`http://你的服务器IP/live/流名称.flv`
4. 直接播放地址（HLS）：`http://你的服务器IP/hls/流名称.m3u8`
