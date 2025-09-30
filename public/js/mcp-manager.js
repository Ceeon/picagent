const mcpModal = document.getElementById('mcp-modal');
const mcpConfigBtn = document.getElementById('mcp-config-btn');
const mcpCloseBtn = document.getElementById('mcp-close-btn');
const mcpRefreshBtn = document.getElementById('mcp-refresh-btn');
const mcpViewConfigBtn = document.getElementById('mcp-view-config');

// Store current MCP configurations
let mcpConfigs = {
    apicore: {
        apiKey: '',
        outputDir: ''
    },
    volcengine: {
        apiKey: '',
        outputDir: ''
    }
};

mcpConfigBtn.addEventListener('click', () => {
    mcpModal.classList.remove('hidden');
    loadMCPConfigs();
    checkMCPStatuses();
});

mcpCloseBtn.addEventListener('click', () => {
    mcpModal.classList.add('hidden');
});

mcpRefreshBtn.addEventListener('click', () => {
    checkMCPStatuses();
});

mcpViewConfigBtn.addEventListener('click', () => {
    socket.emit('mcp:view-config');
});

// Save MCP configuration
async function saveMCPConfig(type) {
    const apiKeyInput = document.getElementById(`${type}-api-key`);
    // 全局输出目录：从后端获取
    let outputDir = '';
    try {
        const r = await fetch('/api/output-dir');
        const j = await r.json();
        outputDir = j && j.outputDir ? j.outputDir : '';
    } catch (e) {
        console.warn('无法获取全局输出目录，将使用默认目录');
    }
    
    const config = {
        type: type === 'apicore' ? 'jimeng-apicore' : 'jimeng-volcengine',
        apiKey: apiKeyInput.value,
        outputDir: outputDir
    };
    
    if (!config.apiKey) {
        alert('请输入API Key');
        return;
    }
    
    // Store locally（仅API Key，本页不再管理目录）
    mcpConfigs[type] = {
        apiKey: config.apiKey,
        outputDir: config.outputDir
    };
    
    // Send to server to save
    socket.emit('mcp:save-config', config);
    
    // Show loading state
    const button = event.target;
    button.disabled = true;
    button.textContent = '保存中...';
}

// Test MCP configuration
function testMCPConfig(type) {
    const mcpName = type === 'apicore' ? 'jimeng-apicore' : 'jimeng-volcengine';
    
    const button = event.target;
    button.disabled = true;
    button.textContent = '测试中...';
    
    socket.emit('mcp:test', mcpName);
}

// Install MCP
function installMCP(mcpName) {
    const button = event.target;
    button.disabled = true;
    button.textContent = '安装中...';
    
    socket.emit('mcp:install', mcpName);
}

// Load saved configurations
function loadMCPConfigs() {
    socket.emit('mcp:get-config');
}

// Check MCP statuses
function checkMCPStatuses() {
    socket.emit('mcp:check');
}

// Update status display
function updateMCPStatus(type, status) {
    const statusElement = document.getElementById(`${type}-status`);
    
    if (status.installed && status.apiKeyValid) {
        statusElement.className = 'px-2 py-1 text-xs rounded-full bg-green-100 text-green-700';
        statusElement.textContent = '✅ 已就绪';
    } else if (status.installed) {
        statusElement.className = 'px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-700';
        statusElement.textContent = '⚠️ 需配置';
    } else {
        statusElement.className = 'px-2 py-1 text-xs rounded-full bg-red-100 text-red-700';
        statusElement.textContent = '❌ 未安装';
    }
}

// Socket event handlers
socket.on('mcp:status', (statuses) => {
    mcpStatuses = statuses;
    
    const apicoreStatus = statuses.find(s => s.name === 'jimeng-apicore');
    const volcengineStatus = statuses.find(s => s.name === 'jimeng-volcengine');
    
    if (apicoreStatus) {
        updateMCPStatus('apicore', apicoreStatus);
    }
    
    if (volcengineStatus) {
        updateMCPStatus('volcengine', volcengineStatus);
    }
    
    // Update main status badge
    const statusBadge = document.getElementById('mcp-status-badge');
    const hasValidMCP = (apicoreStatus?.installed && apicoreStatus?.apiKeyValid) || 
                        (volcengineStatus?.installed && volcengineStatus?.apiKeyValid);
    
    if (hasValidMCP) {
        statusBadge.className = 'px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700';
        statusBadge.textContent = '✅ 已就绪';
    } else {
        statusBadge.className = 'px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600';
        statusBadge.textContent = '未就绪';
    }
});

socket.on('mcp:config-loaded', (configs) => {
    if (configs.apicore) {
        document.getElementById('apicore-api-key').value = configs.apicore.apiKey || '';
        mcpConfigs.apicore = configs.apicore;
    }
    
    if (configs.volcengine) {
        document.getElementById('volcengine-api-key').value = configs.volcengine.apiKey || '';
        mcpConfigs.volcengine = configs.volcengine;
    }
});

socket.on('mcp:save-config:result', (result) => {
    // Reset button state
    const buttons = document.querySelectorAll('button');
    buttons.forEach(btn => {
        if (btn.textContent === '保存中...') {
            btn.disabled = false;
            btn.textContent = '保存配置';
        }
    });
    
    if (result.success) {
        alert('配置保存成功！请重启PicAgent使配置生效。');
        checkMCPStatuses();
    } else {
        alert('保存失败: ' + result.message);
    }
});

socket.on('mcp:install:result', (result) => {
    // Reset button state
    const buttons = document.querySelectorAll('button');
    buttons.forEach(btn => {
        if (btn.textContent === '安装中...') {
            btn.disabled = false;
            btn.textContent = '安装/更新';
        }
    });
    
    if (result.success) {
        alert('安装成功！');
        checkMCPStatuses();
    } else {
        alert('安装失败: ' + result.message);
    }
});

socket.on('mcp:test:result', (result) => {
    // Reset button state
    const buttons = document.querySelectorAll('button');
    buttons.forEach(btn => {
        if (btn.textContent === '测试中...') {
            btn.disabled = false;
            btn.textContent = '测试连接';
        }
    });
    
    if (result.success) {
        alert('连接测试成功！');
    } else {
        alert('连接测试失败: ' + result.message);
    }
});

socket.on('mcp:view-config:result', (result) => {
    if (result.success) {
        term.write('\r\n📄 Claude配置文件内容:\r\n');
        term.write('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\r\n');
        result.content.split('\n').forEach(line => {
            term.write(line + '\r\n');
        });
        term.write('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\r\n');
    } else {
        alert('无法读取配置文件: ' + result.message);
    }
});
