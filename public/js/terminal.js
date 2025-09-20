let term;
let fitAddon;

function initializeTerminal() {
    term = new Terminal({
        theme: {
            background: '#ffffff',
            foreground: '#333333',
            cursor: '#333333',
            selection: 'rgba(0, 0, 0, 0.15)',
            black: '#000000',
            red: '#dc2626',
            green: '#16a34a',
            yellow: '#ca8a04',
            blue: '#2563eb',
            magenta: '#9333ea',
            cyan: '#0891b2',
            white: '#f3f4f6',
            brightBlack: '#6b7280',
            brightRed: '#ef4444',
            brightGreen: '#22c55e',
            brightYellow: '#eab308',
            brightBlue: '#3b82f6',
            brightMagenta: '#a855f7',
            brightCyan: '#06b6d4',
            brightWhite: '#f9fafb'
        },
        fontFamily: 'Menlo, Monaco, "Courier New", monospace',
        fontSize: 16,
        lineHeight: 1.4,
        cursorBlink: true,
        convertEol: true
    });
    
    fitAddon = new FitAddon.FitAddon();
    term.loadAddon(fitAddon);
    
    term.open(document.getElementById('terminal'));
    fitAddon.fit();
    
    socket.emit('terminal:create', {
        cols: term.cols,
        rows: term.rows
    });
    
    term.onData((data) => {
        socket.emit('terminal:write', data);
    });
    
    // 点击终端区域时聚焦
    document.getElementById('terminal').addEventListener('click', () => {
        term.focus();
    });
    
    window.addEventListener('resize', () => {
        fitAddon.fit();
        socket.emit('terminal:resize', {
            cols: term.cols,
            rows: term.rows
        });
    });
}

socket.on('terminal:created', (data) => {
    console.log('Terminal created:', data.sessionId);
    // 终端创建后自动启动claude
    setTimeout(() => {
        socket.emit('terminal:write', 'claude\r');
    }, 500);
});

socket.on('terminal:data', (data) => {
    term.write(data);
});

socket.on('terminal:exit', () => {
    term.write('\\r\\n\\r\\n[终端会话已结束]\\r\\n');
});

function executeCommand(command) {
    socket.emit('terminal:execute', command);
    return new Promise((resolve, reject) => {
        const handler = (result) => {
            socket.off('terminal:execute:result', handler);
            if (result.success) {
                resolve(result.output);
            } else {
                reject(new Error(result.error));
            }
        };
        socket.on('terminal:execute:result', handler);
    });
}