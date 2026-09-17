---
title: "VMware Ubuntu 安装流程"
description: "VMware Ubuntu 26.04 安装"
pubDate: "2026-08-08"
---

本文记录 Ubuntu 26.04 安装的完整流程。

## 1. Ubuntu 镜像下载

下载 Ubuntu 镜像可以直接去 Ubuntu 官网，或者各个大学的开源镜像站。

这里提供官方镜像下载地址，一个是非中文官网，一个是中文官网，镜像无差别：

[Ubuntu desktop 下载地址](https://ubuntu.com/download/desktop)

[CN Ubuntu desktop 下载地址](https://cn.ubuntu.com/download)

## 2. 安装 Ubuntu 镜像

1. 打开 VMware
2. 点击 **创建新的虚拟机**
3. 选择 **典型**
4. 浏览并选择下载好的 Ubuntu 镜像文件
5. 填写简易安装信息
6. 填写虚拟机名称以及虚拟机文件位置
7. 填写磁盘容量大小并选择存储为单文件或者多文件。注：这里推荐选择多文件
8. 开启虚拟机
9. 按 Ubuntu 安装引导进行系统安装

## 3. VMware Tools 安装

Ubuntu 安装完成之后，需要安装 **open-vm-tools** 与 **open-vm-tools-desktop**，用于拖拽/剪贴板共享、虚拟机与宿主机时间同步、分辨率调整。

执行以下命令进行安装：

```bash
sudo apt update
sudo apt install open-vm-tools open-vm-tools-desktop
sudo reboot
```

系统重启后可通过此命令确认是否安装成功：

```bash
# 看版本号，能输出就说明已装
vmware-toolbox-cmd --version
```

有 SSH 需求的话还要安装 **openssh-server**。

执行此命令安装：

```bash
# 检查是否已安装
sudo systemctl status ssh

# 没装的话就装
sudo apt install openssh-server
sudo systemctl enable --now ssh
```

确认 IP 地址：

```bash
ip addr show
# 或
hostname -I
```
