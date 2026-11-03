---
title: "Debian 安装 VS Code 教程"
description: "在 Debian 13 上安装 VS Code"
pubDate: "2026-11-03"
tags: ["Linux"]
---

本文记录在 Debian 13 上安装 VS Code 的过程。

> 按 Debian Wiki 推荐方法安装

```bash
# 1. 装依赖
sudo apt install wget gpg

# 2. 添加微软签名 key
wget -qO- https://packages.microsoft.com/keys/microsoft.asc | sudo gpg --dearmor -o /etc/apt/keyrings/microsoft.gpg

# 3. 添加仓库源
echo "deb [arch=amd64,arm64,armhf signed-by=/etc/apt/keyrings/microsoft.gpg] https://packages.microsoft.com/repos/code stable main" | sudo tee /etc/apt/sources.list.d/vscode.list

# 4. 安装
sudo apt update
sudo apt install code
```
