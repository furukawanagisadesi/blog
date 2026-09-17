---
title: "VMware Linux PipeWire 音频卡顿解决方案"
description: "在 VMware 的 Linux 虚拟机里解决 PipeWire 音频卡顿"
pubDate: "2026-09-17"
---

本文记录 VMware 下 Linux PipeWire 音频卡顿的解决方法。

## 1. 修改 WirePlumber 配置

这个问题通常由驱动抖动引起，在虚拟机里最常见，因为音频设备是模拟出来的，正常情况下不该出现。

一般可以通过给 ALSA 设备的环形缓冲区留更多余量来解决。

需要按下面的方法修改 WirePlumber 配置（WirePlumber 0.5 起用配置文件，更早的 0.4 版本用 Lua 脚本）：

```bash
mkdir -p ~/.config/wireplumber/wireplumber.conf.d/
cd ~/.config/wireplumber/wireplumber.conf.d

nano ~/.config/wireplumber/wireplumber.conf.d/50-alsa-config.conf
```

文件内写入：

```text
monitor.alsa.rules = [
  {
    matches = [
      # This matches the value of the 'node.name' property of the node.
      {
        node.name = "~alsa_output.*"
      }
    ]
    actions = {
      # Apply all the desired node specific settings here.
      update-props = {
        api.alsa.period-size   = 1024
        api.alsa.headroom      = 8192
      }
    }
  }
]
```

重启所有组件：

```bash
systemctl --user restart wireplumber pipewire pipewire-pulse
```

## 2. 修改 Firefox 配置

Firefox 默认开启阅读模式（Reader），网页语音合成（朗读文本）也默认可用。这些功能依赖 `speech-dispatcher`，在虚拟机里会占用大量 CPU。

你可以在 `pw-top` 里看到 `speech-dispatcher-dummy` 和 `speech-dispatcher-espeak-ng` 占用大量 CPU 时间。

要缓解这个问题，在 Firefox 里打开 `about:config`，按下面的设置改好，然后重启 Firefox。

1. 把 `reader.parse-on-load.enabled` 设为 `false`
2. 把 `media.webspeech.synth.enabled` 设为 `false`
