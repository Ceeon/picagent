const socket = io();

let mcpStatuses = [];

socket.on('connect', () => {
    console.log('Connected to server');
    initializeTerminal();
    checkMCPStatus();
});

socket.on('disconnect', () => {
    console.log('Disconnected from server');
});

function checkMCPStatus() {
    setTimeout(() => {
        socket.emit('mcp:check');
    }, 800);
}

socket.on('mcp:status', (statuses) => {
    mcpStatuses = statuses;
    updateMCPStatusDisplay(statuses);
});

socket.on('mcp:error', (error) => {
    console.error('MCP Error:', error);
    updateMCPStatusDisplay([]);
});

function updateMCPStatusDisplay(statuses) {
    const statusBadge = document.getElementById('mcp-status-badge');
    const generateBtn = document.getElementById('generate-btn');
    
    const apicoreStatus = statuses.find(s => s.name === 'jimeng-apicore');
    const volcengineStatus = statuses.find(s => s.name === 'jimeng-volcengine');
    
    const hasValidMCP = (apicoreStatus?.installed && apicoreStatus?.apiKeyValid) || 
                        (volcengineStatus?.installed && volcengineStatus?.apiKeyValid);
    
    if (hasValidMCP) {
        statusBadge.className = 'px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700';
        statusBadge.textContent = '✅ 已就绪';
        generateBtn.disabled = false;
        generateBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    } else if (apicoreStatus?.installed || volcengineStatus?.installed) {
        statusBadge.className = 'px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700';
        statusBadge.textContent = '⚠️ 需配置';
        generateBtn.disabled = true;
        generateBtn.classList.add('opacity-50', 'cursor-not-allowed');
    } else {
        statusBadge.className = 'px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700';
        statusBadge.textContent = '❌ 未安装';
        generateBtn.disabled = true;
        generateBtn.classList.add('opacity-50', 'cursor-not-allowed');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const imageUpload = document.getElementById('image-upload');
    const imageInput = document.getElementById('image-input');
    
    imageUpload.addEventListener('click', () => {
        imageInput.click();
    });
    
    imageUpload.addEventListener('dragover', (e) => {
        e.preventDefault();
        imageUpload.classList.add('dragover');
    });
    
    imageUpload.addEventListener('dragleave', () => {
        imageUpload.classList.remove('dragover');
    });
    
    imageUpload.addEventListener('drop', (e) => {
        e.preventDefault();
        imageUpload.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0 && files[0].type.startsWith('image/')) {
            handleImageUpload(files[0]);
        }
    });
    
    imageInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleImageUpload(e.target.files[0]);
        }
    });
    
    function handleImageUpload(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            imageUpload.innerHTML = `
                <img src="${e.target.result}" style="max-width: 100%; max-height: 150px;">
                <p style="margin-top: 8px; font-size: 12px;">${file.name}</p>
            `;
            imageUpload.dataset.imagePath = e.target.result;
        };
        reader.readAsDataURL(file);
    }
    
    document.getElementById('reset-btn').addEventListener('click', () => {
        document.getElementById('prompt-input').value = '';
        imageUpload.innerHTML = `
            <svg class="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            <p class="mt-2 text-sm text-gray-500">拖拽或点击上传图片</p>`;
        imageUpload.dataset.imagePath = '';
        // 重置尺寸选择
        document.querySelectorAll('.size-btn').forEach(b => {
            b.classList.remove('bg-gray-900', 'text-white');
            b.classList.add('hover:bg-gray-50');
        });
        document.querySelector('.size-btn[data-size="16:9"]').classList.remove('hover:bg-gray-50');
        document.querySelector('.size-btn[data-size="16:9"]').classList.add('bg-gray-900', 'text-white');
        document.getElementById('custom-size').classList.add('hidden');
        document.getElementById('watermark').checked = true;
    });
    
    setInterval(() => {
        socket.emit('mcp:check');
    }, 30000);
});