document.getElementById('generate-btn').addEventListener('click', () => {
    const params = collectParameters();
    
    if (!params.prompt) {
        alert('请输入提示词');
        return;
    }
    
    const hasValidMCP = mcpStatuses.some(s => 
        s.installed && s.apiKeyValid && 
        (s.name === 'jimeng-apicore' || s.name === 'jimeng-volcengine')
    );
    
    if (!hasValidMCP) {
        alert('请先配置 MCP');
        return;
    }
    
    const mcp = mcpStatuses.find(s => 
        s.installed && s.apiKeyValid && 
        (s.name === 'jimeng-apicore' || s.name === 'jimeng-volcengine')
    ).name;
    
    params.mcp = mcp;
    
    const generateBtn = document.getElementById('generate-btn');
    generateBtn.disabled = true;
    generateBtn.innerHTML = '<span class="loading-spinner"></span> 生成中...';
    
    socket.emit('jimeng:generate', params);
});

function collectParameters() {
    let size = '16:9';
    const activeBtn = document.querySelector('.size-btn.bg-gray-900');
    if (activeBtn) {
        size = activeBtn.dataset.size;
        if (size === 'custom') {
            const width = document.getElementById('custom-width').value;
            const height = document.getElementById('custom-height').value;
            size = width && height ? `${width}x${height}` : '16:9';
        }
    }
    
    const params = {
        prompt: document.getElementById('prompt-input').value,
        size: size,
        watermark: false  // 默认不添加水印
    };
    
    const imageUpload = document.getElementById('image-upload');
    if (imageUpload.dataset.imagePath) {
        params.image = imageUpload.dataset.imagePath;
    }
    
    return params;
}

socket.on('jimeng:command', (command) => {
    console.log('执行命令:', command);
    term.write('\\r\\n🎨 正在生成图片...\\r\\n');
    term.write(`> ${command}\\r\\n`);
});

socket.on('jimeng:result', (result) => {
    const generateBtn = document.getElementById('generate-btn');
    generateBtn.disabled = false;
    generateBtn.innerHTML = '生成图片';
    
    if (result.success) {
        term.write('\\r\\n✅ 图片生成成功！\\r\\n');
        
        const imagePathMatch = result.output.match(/(?:saved to|保存到)[\\s:]*([^\\s]+\\.(?:png|jpg|jpeg))/i);
        if (imagePathMatch) {
            term.write(`📁 文件位置: ${imagePathMatch[1]}\\r\\n`);
        }
    } else {
        term.write('\\r\\n❌ 生成失败\\r\\n');
    }
});

socket.on('jimeng:error', (error) => {
    const generateBtn = document.getElementById('generate-btn');
    generateBtn.disabled = false;
    generateBtn.innerHTML = '生成图片';
    
    term.write(`\\r\\n❌ 错误: ${error.message}\\r\\n`);
    alert('生成失败: ' + error.message);
});