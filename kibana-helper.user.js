// ==UserScript==
// @name         Kibana Helper
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  Enhance Kibana page with auto-expand logs, clickable IDs, and highlight features
// @author       You
// @match        *://*/app/kibana/*
// @match        *://*kibana*/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        GM_addStyle
// @grant        GM_addElement
// ==/UserScript==

(function() {
    'use strict';

    // 添加CSS样式
    GM_addStyle(`
        /* 日志级别高亮样式 */
        .log-level-error {
            background-color: rgba(255, 0, 0, 0.15) !important;
            border-left: 4px solid #ff0000 !important;
        }
        
        .log-level-warn {
            background-color: rgba(255, 255, 0, 0.15) !important;
            border-left: 4px solid #ffff00 !important;
        }
        
        /* 错误内容高亮样式 */
        .error-highlight {
            background-color: #ffff00 !important;
            font-weight: bold !important;
            padding: 2px 4px !important;
            border-radius: 3px !important;
        }
        
        /* 可点击ID链接样式 */
        .clickable-id {
            color: #0066cc !important;
            text-decoration: underline !important;
            cursor: pointer !important;
        }
        
        /* Karmada 命令按钮样式 */
        .karmada-cmd-btn {
            margin-left: 8px !important;
            padding: 2px 8px !important;
            background-color: #0066cc !important;
            color: white !important;
            border: none !important;
            border-radius: 3px !important;
            cursor: pointer !important;
            font-size: 12px !important;
            transition: background-color 0.2s !important;
        }
        
        .karmada-cmd-btn:hover {
            background-color: #0052a3 !important;
        }
        
        .karmada-cmd-btn:active {
            background-color: #004080 !important;
        }
        
        .karmada-cmd-btn.copied {
            background-color: #28a745 !important;
        }
    `);

    // 获取列索引映射
    function getColumnIndexMap() {
        // 尝试多种可能的表头选择器
        let headers = document.querySelectorAll('[data-test-subj="docTableHeaderCell"]');
        if (headers.length === 0) {
            headers = document.querySelectorAll('[data-test-subj="docTableHeaderField"]');
        }
        if (headers.length === 0) {
            headers = document.querySelectorAll('[data-test-subj="header-cell"]');
        }
        
        const indexMap = {};
        
        headers.forEach((header, index) => {
            const text = header.textContent || header.innerText;
            if (text) {
                // 提取列名，处理不同格式
                let columnName = text.trim().toLowerCase();
                
                // 处理常见的列名格式
                indexMap[columnName] = index;
                
                // 特殊处理trace.id和request_id
                if (columnName.includes('trace') && columnName.includes('id')) {
                    indexMap['trace.id'] = index;
                }
                if (columnName.includes('request') && columnName.includes('id')) {
                    indexMap['request_id'] = index;
                    indexMap['request.id'] = index; // 支持点号格式
                }
                
                // 处理@timestamp
                if (columnName.includes('@timestamp') || columnName.includes('timestamp')) {
                    indexMap['@timestamp'] = index;
                }
                
                // 处理message
                if (columnName.includes('message')) {
                    indexMap['message'] = index;
                }
                
                // 处理log.level
                if (columnName.includes('log') && columnName.includes('level')) {
                    indexMap['log.level'] = index;
                }
            }
        });
        
        return indexMap;
    }

    // 获取日志行的辅助函数
    function getLogRows() {
        let rows = document.querySelectorAll('[data-test-subj="docTableRow"]');
        if (rows.length === 0) {
            rows = document.querySelectorAll('[data-test-subj="doc-table-row"]');
        }
        if (rows.length === 0) {
            rows = document.querySelectorAll('[data-test-subj="table-row"]');
        }
        return rows;
    }
    
    // 获取日志字段的辅助函数
    function getLogFields(row) {
        let fields = row.querySelectorAll('[data-test-subj="docTableField"]');
        if (fields.length === 0) {
            fields = row.querySelectorAll('[data-test-subj="doc-table-cell"]');
        }
        if (fields.length === 0) {
            fields = row.querySelectorAll('[data-test-subj="table-cell"]');
        }
        return fields;
    }

    // 1. 自动展开日志功能
    function autoExpandLogs() {
        const logs = document.querySelectorAll('.dscTruncateByHeight');
        if (logs && logs.length > 0) {
            logs.forEach(item => {
                item.style.setProperty('max-height', 'none', 'important');
            });
        }
    }

    // 2. 日志级别高亮功能
    function highlightLogLevels() {
        const indexMap = getColumnIndexMap();
        const logLevelIndex = indexMap['log.level'];
        
        if (logLevelIndex === undefined) return;
        
        const logRows = getLogRows();
        logRows.forEach(row => {
            const cells = getLogFields(row);
            if (cells[logLevelIndex]) {
                const logLevel = cells[logLevelIndex].textContent || cells[logLevelIndex].innerText;
                
                // 移除之前的高亮类
                row.classList.remove('log-level-error', 'log-level-warn');
                
                // 添加新的高亮类
                if (logLevel.includes('ERROR')) {
                    row.classList.add('log-level-error');
                } else if (logLevel.includes('WARN')) {
                    row.classList.add('log-level-warn');
                }
            }
        });
    }

    // 3. 错误内容高亮功能
    function highlightErrorContent() {
        const indexMap = getColumnIndexMap();
        const messageIndex = indexMap['message'] || indexMap['log'];
        
        if (messageIndex === undefined) return;
        
        const logRows = getLogRows();
        logRows.forEach(row => {
            const cells = getLogFields(row);
            const messageCell = cells[messageIndex];
            
            if (messageCell) {
                // 检查是否已经包含高亮标记,避免重复处理
                if (messageCell.querySelector('.error-highlight')) {
                    return; // 已经处理过,跳过
                }

                // 检查dataset标记,双重保险
                if (messageCell.dataset.errorHighlighted === 'true') {
                    return; // 已经处理过,跳过
                }

                const text = messageCell.textContent || messageCell.innerText;
                const html = messageCell.innerHTML;
                
                // 匹配error和exception关键字(不区分大小写)
                const regex = /(error|exception)/gi;
                if (regex.test(text)) {
                    // 替换匹配的内容,添加高亮样式
                    messageCell.innerHTML = html.replace(regex, '<span class="error-highlight">$1</span>');
                    // 标记为已处理
                    messageCell.dataset.errorHighlighted = 'true';
                }
            }
        });
    }

    // 解析Kibana时间格式：Dec 8, 2025 @ 23:43:21.008
    function parseKibanaTimestamp(timestampStr) {
        try {
            // 移除"@"符号，将格式转换为可解析的格式
            const formattedStr = timestampStr.replace(' @ ', ' ');
            return new Date(formattedStr);
        } catch (e) {
            console.error('Failed to parse timestamp:', timestampStr, e);
            return null;
        }
    }

    // 4. 可点击ID链接功能
    function makeIdsClickable() {
        const indexMap = getColumnIndexMap();
        const traceIdIndex = indexMap['trace.id'];
        const requestIdIndex = indexMap['request_id'];
        const timestampIndex = indexMap['@timestamp'];
        
        if ((traceIdIndex === undefined && requestIdIndex === undefined) || timestampIndex === undefined) {
            return;
        }
        
        const logRows = getLogRows();
        logRows.forEach(row => {
            const cells = getLogFields(row);
            
            // 获取时间戳
            const timestampCell = cells[timestampIndex];
            const timestampStr = timestampCell ? (timestampCell.textContent || timestampCell.innerText) : null;
            const timestamp = timestampStr ? parseKibanaTimestamp(timestampStr) : null;
            
            // 处理trace.id列
            if (traceIdIndex !== undefined) {
                const traceIdCell = cells[traceIdIndex];
                if (traceIdCell && !traceIdCell.dataset.idProcessed) {
                    const traceId = traceIdCell.textContent || traceIdCell.innerText;
                    if (traceId) {
                        makeIdLink(traceIdCell, traceId, timestamp, 'trace.id');
                    }
                }
            }
            
            // 处理request_id列
            if (requestIdIndex !== undefined) {
                const requestIdCell = cells[requestIdIndex];
                if (requestIdCell && !requestIdCell.dataset.idProcessed) {
                    const requestId = requestIdCell.textContent || requestIdCell.innerText;
                    if (requestId) {
                        makeIdLink(requestIdCell, requestId, timestamp, 'request_id');
                    }
                }
            }
        });
    }
    
    // 提取完整的 Rison 参数值（处理嵌套括号和数组）
    function extractRisonValue(str, startPos) {
        let depth = 0;
        let inString = false;
        let escapeNext = false;
        let i = startPos;

        // 检查是否是数组格式 !()
        if (str[i] === '!') {
            i++; // 跳过 !
            if (i >= str.length || str[i] !== '(') {
                return '!()'; // 空数组
            }
        }

        // 现在应该是在 ( 的位置
        if (str[i] !== '(') {
            // 如果不是括号开始，可能是简单值
            let endPos = i;
            while (endPos < str.length && str[endPos] !== ',' && str[endPos] !== ')' && str[endPos] !== '&') {
                endPos++;
            }
            return str.substring(startPos, endPos);
        }

        // 处理括号嵌套
        for (; i < str.length; i++) {
            const char = str[i];

            if (escapeNext) {
                escapeNext = false;
                continue;
            }

            if (char === '\\') {
                escapeNext = true;
                continue;
            }

            if (char === '\'' && !escapeNext) {
                inString = !inString;
                continue;
            }

            if (!inString) {
                if (char === '(' || char === '!') {
                    // ! 后面通常跟着 (，作为数组标记
                    if (char === '(') {
                        depth++;
                    }
                } else if (char === ')') {
                    depth--;
                    if (depth === 0) {
                        return str.substring(startPos, i + 1);
                    }
                }
            }
        }

        // 如果没有找到匹配的结束括号，返回到字符串末尾
        return str.substring(startPos);
    }

    // 在 Rison 对象中更新特定键的值
    function updateRisonKey(risonStr, key, newValue) {
        // 移除最外层括号
        let content = risonStr;
        if (content.startsWith('(') && content.endsWith(')')) {
            content = content.slice(1, -1);
        }

        // 查找键的位置
        const keyPattern = new RegExp(`(^|,)${key}:`, 'g');
        let match;

        while ((match = keyPattern.exec(content)) !== null) {
            const keyStart = match.index + match[1].length;
            const valueStart = keyStart + key.length + 1;

            // 提取旧值
            let oldValue;
            if (content[valueStart] === '(') {
                oldValue = extractRisonValue(content, valueStart);
            } else if (content[valueStart] === '!') {
                // 处理数组 !() - 直接使用 extractRisonValue，它会处理 !
                oldValue = extractRisonValue(content, valueStart);
            } else if (content[valueStart] === '\'') {
                // 字符串值
                let endQuote = valueStart + 1;
                while (endQuote < content.length) {
                    if (content[endQuote] === '\'' && content[endQuote - 1] !== '\\') {
                        break;
                    }
                    endQuote++;
                }
                oldValue = content.substring(valueStart, endQuote + 1);
            } else {
                // 简单值（直到逗号或结束）
                const nextComma = content.indexOf(',', valueStart);
                oldValue = nextComma === -1 ? content.substring(valueStart) : content.substring(valueStart, nextComma);
            }

            // 替换值
            const before = content.substring(0, valueStart);
            const after = content.substring(valueStart + oldValue.length);
            content = before + newValue + after;

            // 重置正则的 lastIndex，因为字符串已改变
            keyPattern.lastIndex = 0;
            break; // 只替换第一个匹配
        }

        // 如果没找到键，添加它
        if (!new RegExp(`(^|,)${key}:`).test(content)) {
            content = content ? `${content},${key}:${newValue}` : `${key}:${newValue}`;
        }

        return `(${content})`;
    }

    // 创建可点击链接
    function makeIdLink(cell, idValue, timestamp, fieldName) {
        // 构建查询URL
        const currentUrl = window.location.href;
        
        // 计算时间范围
        let timeFrom = '';
        let timeTo = '';

        if (timestamp) {
            const fromDate = new Date(timestamp.getTime() - 35000); // -35秒
            const toDate = new Date(timestamp.getTime() + 35000); // +35秒
            timeFrom = fromDate.toISOString();
            timeTo = toDate.toISOString();
        }

        // 构建查询条件，使用Kibana Kuery语法
        const query = `${fieldName} : ${idValue}`;
        
        // 解析当前URL
        const urlParts = currentUrl.split('#');
        const baseUrl = urlParts[0];
        let hash = urlParts[1] || '';

        // 提取路径部分和参数部分
        let pathPart = '';
        let paramsPart = hash;

        if (hash.includes('?')) {
            const questionMarkIndex = hash.indexOf('?');
            pathPart = hash.substring(0, questionMarkIndex + 1);
            paramsPart = hash.substring(questionMarkIndex + 1);
        }

        // 提取 index 参数 (从 _a 参数的外层提取,不是从 filters 的 meta 中提取)
        let indexValue = '';
        const aIndex = paramsPart.indexOf('_a=');
        if (aIndex !== -1) {
            const aValueStart = aIndex + 3;
            if (paramsPart[aValueStart] === '(') {
                const aParamFull = extractRisonValue(paramsPart, aValueStart);

                // 使用更精确的方式:找到顶层的 index 字段
                // 1. 先尝试匹配带单引号的 index
                let indexMatch = aParamFull.match(/,index:'([^']+)'/);
                if (indexMatch) {
                    indexValue = indexMatch[1];
                } else {
                    // 2. 尝试匹配不带引号的 index (紧跟在逗号后面,不在嵌套括号内)
                    // 排除在 filters:!(...) 或 meta:(...) 内的 index
                    const parts = aParamFull.split(',');
                    for (let i = 0; i < parts.length; i++) {
                        const part = parts[i];
                        // 检查是否是顶层的 index 字段 (不在括号嵌套中,或者在 _a 的直接子级)
                        if (part.includes('index:') && !part.includes('meta:') && !part.includes('filters:')) {
                            const match = part.match(/index:([^,)]+)/);
                            if (match) {
                                indexValue = match[1].replace(/'/g, '');
                                break;
                            }
                        }
                    }
                }
            }
        }

        // 构建简化的 _g 参数(只包含时间范围,清空filters)
        const gParam = `(filters:!(),refreshInterval:(pause:!t,value:0),time:(from:'${timeFrom}',to:'${timeTo}'))`;

        // 构建简化的 _a 参数(包含查询条件,清空filters)
        let aParam = `(columns:!(message),filters:!(),interval:auto,query:(language:kuery,query:'${encodeURIComponent(query)}'),sort:!(!('@timestamp',desc)))`;

        // 如果有 index 值,添加到 _a 参数中
        if (indexValue) {
            aParam = `(columns:!(message),filters:!(),index:'${indexValue}',interval:auto,query:(language:kuery,query:'${encodeURIComponent(query)}'),sort:!(!('@timestamp',desc)))`;
        }

        // 重新构建完整的 URL
        const newHash = `${pathPart}_g=${gParam}&_a=${aParam}`;
        const newUrl = `${baseUrl}#${newHash}`;
        
        // 创建链接元素
        const link = document.createElement('a');
        link.href = newUrl;
        link.target = '_blank';
        link.className = 'clickable-id';
        link.textContent = idValue;
        
        // 替换单元格内容
        cell.innerHTML = '';
        cell.appendChild(link);
        
        // 标记为已处理
        cell.dataset.idProcessed = 'true';
    }

    // 5. Karmada 命令生成功能
    function addKarmadaCommandButtons() {
        // 查找文档详情面板中的 service.node.name 字段
        const docDetails = document.querySelectorAll('[data-test-subj="docTableDetailsRow"]');

        docDetails.forEach(row => {
            // 查找 orchestrator.cluster.name 字段
            const clusterNameCell = row.querySelector('[data-test-subj="tableDocViewRow-orchestrator.cluster.name-value"]');
            const serviceNodeNameCell = row.querySelector('[data-test-subj="tableDocViewRow-service.node.name-value"]');

            // 如果没有找到相关字段，跳过
            if (!clusterNameCell || !serviceNodeNameCell) return;

            const clusterName = clusterNameCell.textContent.trim();
            const serviceNodeName = serviceNodeNameCell.textContent.trim();
            if (!clusterName || !serviceNodeName) return;

            // 检查是否已经添加过按钮
            if (serviceNodeNameCell.querySelector('.karmada-cmd-btn')) return;

            // 解析 service.node.name
            // 格式: namespace.pod-name.container-name
            const parts = serviceNodeName.split('.');
            if (parts.length < 3) return; // 格式不正确

            const namespace = parts[0];
            const podName = parts[1];
            const containerName = parts[2];

            // 构建 karmadactl 命令
            const command = `karmadactl exec -it ${podName} -c ${containerName} --operation-scope=members -n ${namespace} --cluster=${clusterName} -- bash`;

            // 创建按钮
            const button = document.createElement('button');
            button.className = 'karmada-cmd-btn';
            button.textContent = '复制 Karmada 命令';
            button.title = command;

            // 点击按钮时复制命令到剪贴板
            button.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();

                try {
                    await navigator.clipboard.writeText(command);

                    // 显示复制成功的反馈
                    button.textContent = '已复制!';
                    button.classList.add('copied');

                    setTimeout(() => {
                        button.textContent = '复制 Karmada 命令';
                        button.classList.remove('copied');
                    }, 2000);
                } catch (err) {
                    console.error('复制失败:', err);
                    button.textContent = '复制失败';
                    setTimeout(() => {
                        button.textContent = '复制 Karmada 命令';
                    }, 2000);
                }
            });

            // 将按钮添加到字段值后面
            serviceNodeNameCell.appendChild(button);
        });
    }

    // 扫描页面，执行所有功能
    function scanPage() {
        autoExpandLogs();
        highlightLogLevels();
        highlightErrorContent();
        makeIdsClickable();
        addKarmadaCommandButtons();
    }

    // 初始化所有功能
    function init() {
        // 立即执行一次
        scanPage();
        
        // 监听DOM变化
        const observer = new MutationObserver((mutations) => {
            let shouldRescan = false;
            
            // 检查是否有表头变化（列调整）
            mutations.forEach(mutation => {
                if (mutation.type === 'childList') {
                    // 检查是否有表头相关元素变化
                    const hasHeaderChanges = Array.from(mutation.addedNodes).some(node => {
                        return node.matches && (node.matches('[data-test-subj*="header"]') || node.matches('[data-test-subj*="field"]'));
                    }) || Array.from(mutation.removedNodes).some(node => {
                        return node.matches && (node.matches('[data-test-subj*="header"]') || node.matches('[data-test-subj*="field"]'));
                    });
                    
                    if (hasHeaderChanges) {
                        shouldRescan = true;
                    }
                }
            });
            
            if (shouldRescan) {
                // 重置处理标记，重新处理所有元素
                document.querySelectorAll('[data-error-highlighted], [data-id-processed]').forEach(el => {
                    delete el.dataset.errorHighlighted;
                    delete el.dataset.idProcessed;
                });
            }
            
            scanPage();
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        // 监听URL变化，当调整显示的列时重新初始化
        let currentUrl = window.location.href;
        window.addEventListener('popstate', () => {
            if (window.location.href !== currentUrl) {
                currentUrl = window.location.href;
                handleColumnChange();
            }
        });
        
        // 监听hash变化
        window.addEventListener('hashchange', () => {
            if (window.location.href !== currentUrl) {
                currentUrl = window.location.href;
                handleColumnChange();
            }
        });
        
        // 监听可能的列调整事件
        const refreshBtn = document.querySelector('[data-test-subj="refresh-button"]');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                // 延迟执行，确保DOM已更新
                setTimeout(handleColumnChange, 1000);
            });
        }
        
        // 监听列选择器按钮点击
        document.addEventListener('click', (e) => {
            // 检查是否点击了列选择器相关按钮
            const columnSelector = e.target.closest('[data-test-subj*="column"]') || 
                                  e.target.closest('[data-test-subj*="field"]') || 
                                  e.target.closest('[aria-label*="column"]') ||
                                  e.target.closest('[aria-label*="field"]');
            
            if (columnSelector) {
                // 延迟执行，确保DOM已更新
                setTimeout(handleColumnChange, 500);
            }
        });
    }
    
    // 处理列变化的通用函数
    function handleColumnChange() {
        // 延迟执行，确保DOM已更新
        setTimeout(() => {
            // 重置处理标记，重新处理所有元素
            document.querySelectorAll('[data-error-highlighted], [data-id-processed]').forEach(el => {
                delete el.dataset.errorHighlighted;
                delete el.dataset.idProcessed;
            });
            scanPage();
        }, 500);
    }

    // 页面加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();