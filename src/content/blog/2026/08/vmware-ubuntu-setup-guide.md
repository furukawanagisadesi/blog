---
title: 'VMware Ubuntu 安装流程'
description: 'VMware 17 下载 以及 Ubuntu 26.04 安装'
pubDate: '2026-08-08'
---

本文记录 VMware 17 下载以及 Ubuntu 26.04 安装的完整流程

## 1. VMware 17 下载

VMware 原公司现已被博通收购，博通公司未提供公开的直链用于下载 VMware，需要去博通官网注册并登录账号才能下载，步骤繁琐。

还好 GitHub 上有好心人上传了 VMware 的安装包并提供了链接，感谢好心人的上传。
[VMwareWorkstation GitHub 链接](https://github.com/201853910/VMwareWorkstation)

这里也提供一下官方的安装包获取方法：
1. 打开[博通官网](https://support.broadcom.com/group/ecx/productdownloads?subfamily=VMware%20Workstation%20Pro&freeDownloads=true)
2. 注册或登录账号，下载 VMware。

## 2. Ubuntu 镜像下载

下载 Ubuntu 镜像可以直接去 Ubuntu 官网，或者各个大学的开源镜像站。

这里提供官方镜像下载地址，一个是非中文官网，一个是中文官网，镜像无差别：

[Ubuntu desktop 下载地址](https://ubuntu.com/download/desktop)

[CN Ubuntu desktop 下载地址](https://cn.ubuntu.com/download)

## 3. 安装 Ubuntu 镜像

1. 打开 VMware
2. 点击 **创建新的虚拟机**
3. 选择 **典型**
4. 浏览并选择下载好的 Ubuntu 镜像文件
5. 填写简易安装信息
6. 填写虚拟机名称以及虚拟机文件位置
7. 填写磁盘容量大小并选择存储为单文件或者多文件。注：这里推荐选择多文件
8. 开启虚拟机
9. 按 Ubuntu 安装引导进行系统安装

## 4. VMware Tools 安装

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
