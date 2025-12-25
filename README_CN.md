# Kibana Helper - 中文文档

<div align="center">

[![Version](https://img.shields.io/badge/version-0.2-blue.svg)](https://github.com/yourusername/kibana-helper)
[![Tampermonkey](https://img.shields.io/badge/Tampermonkey-compatible-brightgreen.svg)](https://www.tampermonkey.net/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

一个强大的 Kibana 用户脚本,用于增强日志查看体验

[查看完整文档](README.md)

</div>

---

## 🚀 快速开始

### 安装

1. 安装 [Tampermonkey](https://www.tampermonkey.net/) 浏览器扩展
2. 点击 [安装脚本](kibana-helper.user.js)
3. 刷新 Kibana 页面即可使用

---

## ✨ 核心功能

### 🔍 自动展开日志
自动展开所有日志条目,无需手动点击,提升查看效率

### 🎨 智能高亮显示
- **日志级别高亮**: ERROR(红色) / WARN(黄色)
- **错误内容高亮**: 自动高亮 `error` 和 `exception` 关键字
- **防重复处理**: 避免重复高亮导致的显示错误

### 🔗 可点击 ID 快速跳转
- 支持 `trace.id` 和 `request_id` 字段
- 点击自动生成查询链接(±35秒时间范围)
- **智能提取 index**: 自动从 URL 提取正确的 index 配置
- **清空 filters**: 只保留时间和查询条件,查询完整日志链路

### 🚀 Karmada 命令生成 (NEW!)
- 在日志详情的 `service.node.name` 字段旁显示按钮
- 一键生成 `karmadactl exec` 命令
- 自动解析集群名、namespace、pod 名、容器名
- 点击按钮自动复制到剪贴板

**示例:**
```bash
# 从以下字段:
orchestrator.cluster.name: xxxx-11
service.node.name: nams.xxxx-xxxxxx-1.streaming

# 生成命令:
karmadactl exec -it xxxx-xxxxxx-1 -c streaming --operation-scope=members -n nams --cluster=xxxx-11 -- bash
```

### ⚡ 实时响应
- 监听 DOM 变化,自动应用功能
- URL 变化时自动重置处理标记
- 支持列调整后自动重新处理

---

## 📖 详细文档

完整功能说明、配置方法、常见问题请查看:

👉 **[完整文档 README.md](README.md)**

---

## 🐛 问题反馈

遇到问题? 请查看 [常见问题](README.md#-常见问题) 或提交 Issue

---

## 📝 更新日志

### v0.2 (当前版本)
- ✨ 新增 Karmada 命令生成功能
- 🐛 修复 ID 跳转时 index 提取错误
- 🐛 修复跳转链接自动清空 filters
- 🐛 修复错误内容重复高亮问题
- 🔧 改进 URL 变化时的处理机制

---

<div align="center">

**觉得有用? 给个 ⭐️ Star 吧!**

[完整文档](README.md) • [问题反馈](https://github.com/yourusername/kibana-helper/issues)

</div>


