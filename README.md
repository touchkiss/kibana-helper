# Kibana Helper

<div align="center">

[![Version](https://img.shields.io/badge/version-0.3-blue.svg)](https://github.com/yourusername/kibana-helper)
[![Tampermonkey](https://img.shields.io/badge/Tampermonkey-compatible-brightgreen.svg)](https://www.tampermonkey.net/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

一个强大的 Kibana 用户脚本,用于增强日志查看体验,提供自动展开、智能高亮、快速跳转、Karmada 命令生成等实用功能。

[English](README.md) • [简体中文](README_CN.md)

[功能特性](#-功能特性) • [安装方法](#-安装方法) • [使用指南](#-使用指南) • [配置说明](#️-配置说明) • [常见问题](#-常见问题)

</div>

---

## ✨ 功能特性

### 🔍 自动展开日志
- 自动展开所有日志条目,无需手动点击
- 支持大段日志内容的完整显示
- 提升日志查看效率

### 🎨 智能高亮显示
#### 日志级别高亮
- **ERROR 级别**: 红色背景 + 红色左边框
- **WARN 级别**: 黄色背景 + 黄色左边框
- 快速识别关键日志信息

#### 错误内容高亮
- **可配置关键字**: 默认高亮 `error` 和 `exception`，可通过弹窗自定义
- 黄色背景 + 加粗显示
- 支持大小写不敏感匹配
- **配置入口**:
  - 页面右下角⚙️设置按钮
  - 油猴扩展菜单命令
- **防重复处理机制**:
  - 通过 DOM 查询检查是否已存在高亮标记
  - 通过 `data-error-highlighted` 属性双重校验
  - URL 变化时自动清理标记并重新处理
  - 避免重复高亮导致的显示错误

### 🔗 可点击 ID 快速跳转
- 支持字段:
  - `trace.id` - 链路追踪 ID
  - `request_id` - 请求 ID
- 点击后自动:
  - 生成时间范围查询(当前时间 ±35 秒)
  - 构建 Kuery 查询条件
  - 在新标签页打开,查看完整请求日志链路
  - **自动清空 filters**: 只保留时间和查询条件,查询完整日志
  - **智能提取 index**: 从 `_a` 参数的外层提取正确的 index 配置

### 🚀 Karmada 命令生成 (NEW!)
- 在日志详情面板的 `service.node.name` 字段旁自动添加按钮
- 一键生成 `karmadactl exec` 命令
- 自动解析字段:
  - `orchestrator.cluster.name` → 集群名称
  - `service.node.name` → namespace.pod-name.container-name
- 命令格式示例:
  ```bash
  karmadactl exec -it xxxx-xxxxxx-1 -c streaming --operation-scope=members -n nams --cluster=xxxx-11 -- bash
  ```
- 点击按钮自动复制到剪贴板
- 视觉反馈:复制成功后按钮变绿并显示"已复制!"

### ⚡ 实时响应
- 监听 DOM 变化,自动应用功能
- 支持列调整后自动重新处理
- 监听 URL 变化,智能刷新
- **URL 变化时自动重置处理标记**,防止重复处理

---

## 📦 安装方法

### 前置要求
- 浏览器: Chrome、Firefox、Edge 或其他现代浏览器
- 扩展: [Tampermonkey](https://www.tampermonkey.net/) 或 [Greasemonkey](https://www.greasespot.net/)

### 安装步骤

1. **安装 Tampermonkey 扩展**
   - [Chrome 应用商店](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
   - [Firefox 附加组件](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/)
   - [Edge 扩展商店](https://microsoftedge.microsoft.com/addons/detail/tampermonkey/iikmkjmpaadaobahmlepeloendndfphd)

2. **安装脚本**
   - 方法一: 点击 [这里安装](https://github.com/yourusername/kibana-helper/raw/main/kibana-helper.user.js) (需要替换为实际链接)
   - 方法二: 
     1. 复制 `kibana-helper.user.js` 文件内容
     2. 打开 Tampermonkey 管理面板
     3. 点击 "+" 创建新脚本
     4. 粘贴代码并保存

3. **刷新 Kibana 页面**
   - 脚本会自动生效
   - 支持所有包含 `kibana` 的域名

---

## 📖 使用指南

### 基本使用

脚本安装后会自动工作,无需任何配置。访问 Kibana 日志页面时:

1. **日志自动展开** - 所有日志内容自动完整显示
2. **日志级别高亮** - ERROR 和 WARN 级别的日志会被自动高亮
3. **错误关键字高亮** - 默认高亮 `error` 和 `exception`，可自定义
4. **ID 可点击** - `trace.id` 和 `request_id` 字段变成可点击的蓝色链接
5. **设置按钮** - 页面右下角显示⚙️设置按钮，可配置错误关键字

### 快速跳转功能

点击任意 `trace.id` 或 `request_id`:
- 自动打开新标签页
- 查询时间范围: 当前日志时间 ±35 秒
- 自动构建查询条件
- **清空 filters,只保留时间和查询条件**
- 保留当前 index 设置
- 显示该请求的完整日志链路

**示例场景:**
```
原始日志行:
时间: Dec 9, 2025 @ 08:50:45.000
request_id: 95481e20-1f43-4849-b071-5dad617ff602
日志级别: ERROR

点击 request_id 后 -> 跳转到新页面,显示该请求在 08:50:10 - 08:51:20 之间的所有日志
```

**URL 构建说明:**
- 自动从当前 URL 的 `_a` 参数外层提取正确的 `index` 值
- 清空 `filters:!()`,确保查询完整日志链路
- 示例 URL:
  ```
  https://kibana.example.com/s/space/app/discover#/?
  _g=(filters:!(),refreshInterval:(pause:!t,value:0),time:(from:'2025-12-09T08:50:10.626Z',to:'2025-12-09T08:51:20.626Z'))
  &_a=(columns:!(message),filters:!(),index:'13de14b0-02f1-11ef-938a-d9ba7bd575b0',interval:auto,query:(language:kuery,query:'request_id%20:%2095481e20-1f43-4849-b071-5dad617ff602'),sort:!(!('@timestamp',desc)))
  ```

### Karmada 命令生成功能

在 Kibana 日志详情面板中:

1. 点击任意日志行展开详情
2. 找到 `service.node.name` 字段
3. 该字段后面会自动出现"复制 Karmada 命令"按钮
4. 点击按钮自动复制命令到剪贴板

**字段解析规则:**
- `orchestrator.cluster.name`: xxxx-11 → 集群名
- `service.node.name`: nams.xxxx-xxxxxx-1.streaming → 
  - namespace: `nams`
  - pod: `xxxx-xxxxxx-1`
  - container: `streaming`

**生成的命令:**
```bash
karmadactl exec -it xxxx-xxxxxx-1 -c streaming --operation-scope=members -n nams --cluster=xxxx-11 -- bash
```

---

### 错误关键字配置

你可以自定义要高亮的错误关键字：

1. **方式一**: 点击页面右下角的⚙️设置按钮
2. **方式二**: 点击油猴扩展图标 → 找到“配置错误关键字”菜单项

**配置说明:**
- 每行输入一个关键字
- 匹配不区分大小写
- 保存后立即生效
- 配置会永久保存在浏览器本地

**示例配置:**
```
error
exception
failed
timeout
connection refused
```

## ⚙️ 配置说明

### 支持的 Kibana 字段

脚本自动识别以下字段名称(不区分大小写):

| 功能 | 支持的字段名 |
|------|-------------|
| 时间戳 | `@timestamp`, `timestamp` |
| 日志级别 | `log.level`, `log level` |
| 消息内容 | `message`, `log` |
| 追踪 ID | `trace.id`, `trace id` |
| 请求 ID | `request_id`, `request.id`, `request id` |
| 集群名称 | `orchestrator.cluster.name` |
| 服务节点名 | `service.node.name` |

### 自定义样式

如需修改高亮颜色,可编辑脚本中的 CSS 部分:

```javascript
GM_addStyle(`
    /* 自定义 ERROR 级别颜色 */
    .log-level-error {
        background-color: rgba(255, 0, 0, 0.15) !important;
        border-left: 4px solid #ff0000 !important;
    }
    
    /* 自定义错误内容高亮颜色 */
    .error-highlight {
        background-color: #ffff00 !important;
        font-weight: bold !important;
    }
    
    /* 自定义 Karmada 按钮样式 */
    .karmada-cmd-btn {
        background-color: #0066cc !important;
        color: white !important;
    }
`);
```

### 自定义时间范围

默认查询时间范围为 ±35 秒,可修改 `makeIdLink` 函数:

```javascript
// 修改时间范围 (单位: 毫秒)
const fromDate = new Date(timestamp.getTime() - 35000); // 当前: -35秒
const toDate = new Date(timestamp.getTime() + 35000);   // 当前: +35秒
```

### 自定义 Karmada 命令模板

可修改 `addKarmadaCommandButtons` 函数中的命令生成逻辑:

```javascript
// 自定义命令模板
const command = `karmadactl exec -it ${podName} -c ${containerName} --operation-scope=members -n ${namespace} --cluster=${clusterName} -- bash`;
```

---

## 🔧 技术细节

### 架构设计
- **观察者模式**: 使用 MutationObserver 监听 DOM 变化
- **防重复处理**: 
  - 通过 `data-*` 属性和 DOM 查询双重检查
  - URL 变化时自动清理处理标记
  - 避免重复高亮和重复注册事件
- **URL 监听**: 监听 `popstate` 和 `hashchange` 事件
- **智能重置**: 列调整或 URL 变化时自动清理标记并重新处理

### 核心功能模块
```
├── getColumnIndexMap()           # 列索引映射
├── autoExpandLogs()              # 自动展开日志
├── highlightLogLevels()          # 日志级别高亮
├── highlightErrorContent()       # 错误内容高亮(支持配置)
├── makeIdsClickable()            # ID 可点击(智能提取 index)
├── addKarmadaCommandButtons()    # Karmada 命令生成
├── extractRisonValue()           # Rison 格式解析
├── updateRisonKey()              # Rison 参数更新
├── handleColumnChange()          # URL 变化处理(重置标记)
├── getErrorKeywords()            # 获取配置的错误关键字
├── saveErrorKeywords()           # 保存错误关键字配置
├── showConfigModal()             # 显示配置弹窗
└── addSettingsButton()           # 添加设置按钮
```

### Rison URL 解析
脚本支持解析 Kibana 的 Rison 格式 URL:
- 处理嵌套括号和数组 `!()`
- 正确提取 `_a` 参数中的 `index` 值
- 清空 `filters` 参数,确保查询完整日志

### 浏览器兼容性
- ✅ Chrome 80+
- ✅ Firefox 75+
- ✅ Edge 80+
- ✅ Safari 13+ (需要 Tampermonkey)

---

## 🐛 常见问题

<details>
<summary><b>Q: 脚本不工作怎么办?</b></summary>

**A:** 请检查:
1. Tampermonkey 扩展是否已启用
2. 脚本在 Tampermonkey 中是否已启用
3. 刷新 Kibana 页面
4. 检查浏览器控制台是否有错误信息
</details>

<details>
<summary><b>Q: 高亮功能显示异常或重复高亮?</b></summary>

**A:** 这个问题已经修复:
1. 脚本现在具有防重复处理机制
2. URL 变化时会自动重置处理标记
3. 如仍有问题,刷新页面即可
4. 如持续出现,请提交 Issue 并附上 Kibana 版本信息
</details>

<details>
<summary><b>Q: 点击 ID 跳转后查询不到日志?</b></summary>

**A:** 可能原因:
1. 时间范围太短 (±35秒) - 可以修改脚本中的时间范围
2. ID 字段名称不匹配 - 检查 Kibana 中实际的字段名
3. Index 配置不正确 - 脚本会自动从 `_a` 参数外层提取正确的 index
</details>

<details>
<summary><b>Q: 点击 ID 跳转的 URL 中 index 不对?</b></summary>

**A:** 这个问题已经修复:
- 脚本现在会从 `_a` 参数的外层提取 index
- 不再错误地使用 `filters` 中 `meta` 里的 index
- 跳转链接会自动清空 filters,只保留时间和查询条件
</details>

<details>
<summary><b>Q: Karmada 命令按钮不显示?</b></summary>

**A:** 请确认:
1. 日志中包含 `orchestrator.cluster.name` 和 `service.node.name` 字段
2. `service.node.name` 格式正确: `namespace.pod-name.container-name`
3. 已展开日志详情面板
4. 刷新页面重试
</details>

<details>
<summary><b>Q: 如何禁用某个功能?</b></summary>

**A:** 编辑脚本,在 `scanPage()` 函数中注释掉不需要的功能:
```javascript
function scanPage() {
    autoExpandLogs();
    highlightLogLevels();
    // highlightErrorContent();       // 禁用错误内容高亮
    makeIdsClickable();
    // addKarmadaCommandButtons();    // 禁用 Karmada 命令生成
}
```
</details>

<details>
<summary><b>Q: 支持哪些 Kibana 版本?</b></summary>

**A:** 理论上支持所有现代 Kibana 版本。已测试:
- Kibana 7.x ✅
- Kibana 8.x ✅

如在其他版本遇到问题,欢迎提交 Issue。
</details>

---

## 📝 更新日志

### v0.3 (当前版本)
- ✨ 新增: **错误关键字可配置功能**
  - 页面右下角⚙️设置按钮
  - 油猴扩展菜单命令
  - 配置永久保存
- 🔧 改进: 错误关键字支持正则特殊字符转义

### v0.2
- ✨ 新增: Karmada 命令生成功能
- 🐛 修复: ID 跳转时 index 提取不正确的问题
- 🐛 修复: 跳转链接现在自动清空 filters
- 🐛 修复: 错误内容高亮重复处理导致的显示错误
- 🔧 改进: URL 变化时自动重置处理标记
- 🔧 改进: 更完善的防重复处理机制

### v0.1
- 🎉 初始版本发布
- ✨ 自动展开日志
- ✨ 日志级别高亮
- ✨ 错误内容高亮
- ✨ 可点击 ID 快速跳转

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request!

### 开发指南
1. Fork 本仓库
2. 创建特性分支: `git checkout -b feature/AmazingFeature`
3. 提交更改: `git commit -m 'Add some AmazingFeature'`
4. 推送到分支: `git push origin feature/AmazingFeature`
5. 提交 Pull Request

---

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

---

<div align="center">

**如果这个项目对你有帮助,请给个 ⭐️ Star 支持一下!**

Made with ❤️ by developers, for developers

</div>

