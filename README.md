# Kibana Helper

<div align="center">

[![Version](https://img.shields.io/badge/version-0.2-blue.svg)](https://github.com/yourusername/kibana-helper)
[![Tampermonkey](https://img.shields.io/badge/Tampermonkey-compatible-brightgreen.svg)](https://www.tampermonkey.net/)

一个强大的 Kibana 用户脚本,用于增强日志查看体验,提供自动展开、智能高亮、快速跳转等实用功能。

[功能特性](#功能特性) • [安装方法](#安装方法) • [使用指南](#使用指南) • [配置说明](#配置说明) • [常见问题](#常见问题)

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
- 自动高亮 `error` 和 `exception` 关键字
- 黄色背景 + 加粗显示
- 支持大小写不敏感匹配
- 防重复处理机制,避免显示错误

### 🔗 可点击 ID 快速跳转
- 支持字段:
  - `trace.id` - 链路追踪 ID
  - `request_id` - 请求 ID
- 点击后自动:
  - 生成时间范围查询(当前时间 ±35 秒)
  - 构建 Kuery 查询条件
  - 在新标签页打开,查看完整请求日志链路
- 智能保留当前 index 配置

### ⚡ 实时响应
- 监听 DOM 变化,自动应用功能
- 支持列调整后自动重新处理
- 监听 URL 变化,智能刷新

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
3. **错误关键字高亮** - `error` 和 `exception` 关键字会被黄色高亮
4. **ID 可点击** - `trace.id` 和 `request_id` 字段变成可点击的蓝色链接

### 快速跳转功能

点击任意 `trace.id` 或 `request_id`:
- 自动打开新标签页
- 查询时间范围: 当前日志时间 ±35 秒
- 自动构建查询条件
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

---

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
`);
```

### 自定义时间范围

默认查询时间范围为 ±35 秒,可修改 `makeIdLink` 函数:

```javascript
// 修改时间范围 (单位: 毫秒)
const fromDate = new Date(timestamp.getTime() - 35000); // 当前: -35秒
const toDate = new Date(timestamp.getTime() + 35000);   // 当前: +35秒
```

---

## 🔧 技术细节

### 架构设计
- **观察者模式**: 使用 MutationObserver 监听 DOM 变化
- **防重复处理**: 通过 `data-*` 属性和 DOM 查询双重检查
- **URL 监听**: 监听 `popstate` 和 `hashchange` 事件
- **智能重置**: 列调整时自动清理标记并重新处理

### 核心功能模块
```
├── getColumnIndexMap()      # 列索引映射
├── autoExpandLogs()          # 自动展开日志
├── highlightLogLevels()      # 日志级别高亮
├── highlightErrorContent()   # 错误内容高亮
├── makeIdsClickable()        # ID 可点击
├── extractRisonValue()       # Rison 格式解析
└── updateRisonKey()          # Rison 参数更新
```

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
<summary><b>Q: 高亮功能显示异常?</b></summary>

**A:** 这可能是因为:
1. Kibana 页面结构变化
2. 刷新页面通常可以解决
3. 如持续出现,请提交 Issue 并附上 Kibana 版本信息
</details>

<details>
<summary><b>Q: 点击 ID 跳转后查询不到日志?</b></summary>

**A:** 可能原因:
1. 时间范围太短 (±35秒) - 可以修改脚本中的时间范围
2. ID 字段名称不匹配 - 检查 Kibana 中实际的字段名
3. Index 配置不正确 - 脚本会自动保留当前 index
</details>

<details>
<summary><b>Q: 如何禁用某个功能?</b></summary>

**A:** 编辑脚本,在 `scanPage()` 函数中注释掉不需要的功能:
```javascript
function scanPage() {
    autoExpandLogs();
    highlightLogLevels();
    // highlightErrorContent();  // 禁用错误内容高亮
    makeIdsClickable();
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


<div align="center">

**如果这个项目对你有帮助,请给个 ⭐️ Star 支持一下!**

</div>

