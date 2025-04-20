// State management
const state = {
    isLoggedIn: false,
    password: 'DIABLO',
    wallpaper: 'cyberpunk',
    files: [],
    currentFile: null,
    windows: {
        'file-explorer': false,
        'terminal': false,
        'browser': false,
        'settings': false
    },
    activeWindow: null,
    contextMenu: null
};

// DOM Elements
const loginScreen = document.getElementById('login-screen');
const desktop = document.getElementById('desktop');
const usernameInput = document.getElementById('username-input');
const passwordInput = document.getElementById('password-input');
const loginButton = document.getElementById('login-button');
const logoutButton = document.getElementById('logout-btn');
const terminalButton = document.getElementById('terminal-btn');
const browserButton = document.getElementById('browser-btn');
const settingsButton = document.getElementById('settings-btn');
const clock = document.getElementById('clock');
const terminalWindow = document.getElementById('terminal-window');
const browserWindow = document.getElementById('browser-window');
const settingsWindow = document.getElementById('settings-window');
const fileManagerWindow = document.getElementById('file-manager-window');
const terminalOutput = document.getElementById('terminal-output');
const terminalCommand = document.getElementById('terminal-command');
const urlBar = document.querySelector('.url-bar');
const browserFrame = document.querySelector('.browser-frame');
const passwordChangeInput = document.getElementById('password-change-input');
const saveUsernameButton = document.getElementById('save-username');
const savePasswordButton = document.getElementById('save-password');
const wallpaperSelect = document.getElementById('wallpaper-select');
const newFolderButton = document.getElementById('new-folder');
const newFileButton = document.getElementById('new-file');
const fileList = document.querySelector('.file-list');
const fileContent = document.getElementById('file-content');

// Wallpaper images
const wallpapers = {
    cyberpunk: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80',
    matrix: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80',
    neon: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80',
    space: 'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80'
};

// Initialize
function init() {
    // Get DOM elements
    const loginScreen = document.getElementById('login-screen');
    const desktop = document.getElementById('desktop');
    const passwordInput = document.getElementById('password-input');
    const loginButton = document.getElementById('login-button');
    const clock = document.getElementById('clock');

    // Set initial wallpaper for login screen and desktop
    loginScreen.style.backgroundImage = `url(${wallpapers[state.wallpaper]})`;
    desktop.style.backgroundImage = `url(${wallpapers[state.wallpaper]})`;

    // Setup login handlers
    loginButton.addEventListener('click', handleLogin);
    passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleLogin();
    });

    // Setup window management
    setupWindowManagement();

    // Start clock
    updateClock();
    setInterval(updateClock, 1000);
}

// Login handling
function handleLogin() {
    const loginScreen = document.getElementById('login-screen');
    const desktop = document.getElementById('desktop');
    const passwordInput = document.getElementById('password-input');

    if (passwordInput.value === state.password) {
        state.isLoggedIn = true;
        loginScreen.style.display = 'none';
        desktop.style.display = 'block';
        passwordInput.value = '';
    } else {
        alert('Incorrect password!');
    }
}

// Window management
function setupWindowManagement() {
    // Setup taskbar buttons
    document.querySelectorAll('.taskbar-button').forEach(button => {
        const windowId = button.getAttribute('data-window');
        button.addEventListener('click', () => toggleWindow(windowId));
    });

    // Setup desktop icons
    document.querySelectorAll('.desktop-icon').forEach(icon => {
        const windowId = icon.getAttribute('data-window');
        icon.addEventListener('dblclick', () => toggleWindow(windowId));
    });

    // Setup window controls
    document.querySelectorAll('.window').forEach(window => {
        setupWindowControls(window);
        makeWindowDraggable(window);
    });
}

function toggleWindow(windowId) {
    const window = document.getElementById(windowId);
    if (!window) return;

    const isVisible = window.style.display === 'block';
    
    if (!isVisible) {
        showWindow(windowId);
    } else {
        hideWindow(windowId);
    }
}

function showWindow(windowId) {
    const window = document.getElementById(windowId);
    if (!window) return;

    // Hide all other windows
    document.querySelectorAll('.window').forEach(w => {
        w.style.zIndex = '1';
    });

    // Show and position the window
    window.style.display = 'block';
    window.style.zIndex = '10';
    
    if (!window.hasAttribute('data-positioned')) {
        centerWindow(window);
        window.setAttribute('data-positioned', 'true');
    }

    // Update state
    state.windows[windowId] = true;
    state.activeWindow = windowId;

    // Update taskbar button
    const taskbarButton = document.querySelector(`.taskbar-button[data-window="${windowId}"]`);
    if (taskbarButton) {
        taskbarButton.classList.add('active');
    }
}

function hideWindow(windowId) {
    const window = document.getElementById(windowId);
    if (!window) return;

    window.style.display = 'none';
    state.windows[windowId] = false;

    // Update taskbar button
    const taskbarButton = document.querySelector(`.taskbar-button[data-window="${windowId}"]`);
    if (taskbarButton) {
        taskbarButton.classList.remove('active');
    }
}

function setupWindowControls(window) {
    const controls = window.querySelector('.window-controls');
    if (!controls) return;

    const closeBtn = controls.querySelector('.close');
    const minBtn = controls.querySelector('.minimize');
    const maxBtn = controls.querySelector('.maximize');

    if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            hideWindow(window.id);
        });
    }

    if (minBtn) {
        minBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            hideWindow(window.id);
        });
    }

    if (maxBtn) {
        maxBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleMaximize(window);
        });
    }

    // Window focus
    window.addEventListener('mousedown', () => bringToFront(window));
}

function toggleMaximize(window) {
    window.classList.toggle('maximized');
    if (window.classList.contains('maximized')) {
        window.style.top = '40px';
        window.style.left = '0';
        window.style.width = '100%';
        window.style.height = 'calc(100% - 40px)';
    } else {
        centerWindow(window);
    }
}

function centerWindow(window) {
    const width = 600;
    const height = 400;
    
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    
    const left = Math.max(0, (viewportWidth - width) / 2);
    const top = Math.max(40, (viewportHeight - height) / 2);
    
    window.style.width = width + 'px';
    window.style.height = height + 'px';
    window.style.left = left + 'px';
    window.style.top = top + 'px';
}

function makeWindowDraggable(window) {
    const header = window.querySelector('.window-header');
    if (!header) return;

    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;

    header.addEventListener('mousedown', startDragging);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', stopDragging);

    function startDragging(e) {
        if (e.target.closest('.window-controls')) return;
        if (window.classList.contains('maximized')) return;

        isDragging = true;
        window.style.transition = 'none';

        const rect = window.getBoundingClientRect();
        initialX = e.clientX - rect.left;
        initialY = e.clientY - rect.top;
    }

    function drag(e) {
        if (!isDragging) return;

        e.preventDefault();
        
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;

        // Ensure window stays within viewport
        currentX = Math.max(0, Math.min(currentX, window.innerWidth - window.offsetWidth));
        currentY = Math.max(40, Math.min(currentY, window.innerHeight - window.offsetHeight));

        window.style.left = currentX + 'px';
        window.style.top = currentY + 'px';
    }

    function stopDragging() {
        isDragging = false;
        window.style.transition = 'all 0.3s ease';
    }
}

function bringToFront(window) {
    document.querySelectorAll('.window').forEach(w => {
        w.style.zIndex = '1';
    });
    window.style.zIndex = '10';
    state.activeWindow = window.id;
}

// Clock update
function updateClock() {
    const clock = document.getElementById('clock');
    if (clock) {
        const now = new Date();
        clock.textContent = now.toLocaleTimeString();
    }
}

// Wallpaper management
function changeWallpaper() {
    const select = document.getElementById('wallpaper');
    if (select) {
        state.wallpaper = select.value;
        const wallpaper = wallpapers[state.wallpaper];
        document.getElementById('desktop').style.backgroundImage = `url(${wallpaper})`;
    }
}

// Event Listeners
function setupEventListeners() {
    // Taskbar buttons
    const taskbarButtons = document.querySelectorAll('.taskbar-button');
    taskbarButtons.forEach(button => {
        button.addEventListener('click', () => {
            const windowId = button.getAttribute('data-window');
            toggleWindow(windowId);
        });
    });

    // Window controls
    const windows = document.querySelectorAll('.window');
    windows.forEach(window => {
        // Window focus
        window.addEventListener('mousedown', () => bringToFront(window));

        // Window controls
        const controls = window.querySelector('.window-controls');
        if (controls) {
            const closeBtn = controls.querySelector('.close');
            const minBtn = controls.querySelector('.minimize');
            const maxBtn = controls.querySelector('.maximize');

            if (closeBtn) {
                closeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    hideWindow(window.id);
                });
            }

            if (minBtn) {
                minBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    minimizeWindow(window.id);
                });
            }

            if (maxBtn) {
                maxBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    toggleMaximizeWindow(window.id);
                });
            }
        }

        // Make window draggable
        makeWindowDraggable(window);
    });

    // Desktop icons
    const desktopIcons = document.querySelectorAll('.desktop-icon');
    desktopIcons.forEach(icon => {
        icon.addEventListener('dblclick', () => {
            const windowId = icon.getAttribute('data-window') || 'file-explorer';
            toggleWindow(windowId);
        });
    });

    // Login
    loginButton.addEventListener('click', handleLogin);
    passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleLogin();
    });

    // Logout
    logoutButton.addEventListener('click', handleLogout);

    // Terminal
    terminalCommand.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleTerminalCommand(terminalCommand.value);
            terminalCommand.value = '';
        }
    });

    // Browser
    urlBar.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleBrowserNavigation();
    });
    document.querySelector('.browser-toolbar .toolbar-button').addEventListener('click', handleBrowserNavigation);

    // Settings
    saveUsernameButton.addEventListener('click', saveUsername);
    savePasswordButton.addEventListener('click', savePassword);
    wallpaperSelect.addEventListener('change', changeWallpaper);

    // File Explorer
    document.getElementById('new-file-btn').addEventListener('click', createNewFile);
    document.getElementById('new-folder-btn').addEventListener('click', createNewFolder);
    fileContent.addEventListener('input', saveFileContent);
}

// Login/Logout
function handleLogout() {
    loginScreen.style.display = 'flex';
    desktop.style.display = 'none';
    passwordInput.value = '';
    Object.keys(state.windows).forEach(window => {
        state.windows[window] = false;
        document.getElementById(`${window}-window`).style.display = 'none';
    });
}

// Terminal
function handleTerminalCommand(command) {
    const output = document.createElement('div');
    output.textContent = `$ ${command}`;
    terminalOutput.appendChild(output);
    
    // Simple command handling
    const [cmd, ...args] = command.split(' ');
    switch (cmd) {
        case 'help':
            output.textContent += '\nAvailable commands: help, clear, echo, ls';
            break;
        case 'clear':
            terminalOutput.innerHTML = '';
            break;
        case 'echo':
            output.textContent += '\n' + args.join(' ');
            break;
        case 'ls':
            output.textContent += '\n' + state.files.map(f => f.name).join('\n');
            break;
        default:
            output.textContent += '\nCommand not found';
    }
    
    terminalOutput.scrollTop = terminalOutput.scrollHeight;
}

// Browser
function handleBrowserNavigation() {
    let url = urlBar.value;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
    }
    browserFrame.src = url;
}

// Settings
function saveUsername() {
    state.username = usernameInput.value;
    alert('Username updated!');
}

function savePassword() {
    state.password = passwordChangeInput.value;
    alert('Password updated!');
}

// File Management
function loadFiles() {
    // Load files from localStorage if available
    const savedFiles = localStorage.getItem('berry-files');
    if (savedFiles) {
        state.files = JSON.parse(savedFiles);
        updateFileList();
    }
}

function updateFileList() {
    const fileList = document.querySelector('.file-explorer-main');
    fileList.innerHTML = '';
    
    state.files.forEach(file => {
        const fileElement = document.createElement('div');
        fileElement.className = 'file-item';
        fileElement.innerHTML = `
            <i class="fas fa-${file.type === 'folder' ? 'folder' : 'file-alt'}"></i>
            <span>${file.name}</span>
        `;
        fileElement.addEventListener('dblclick', () => {
            if (file.type === 'folder') {
                openFolder(file.name);
            } else {
                openFile(file.name);
            }
        });
        fileList.appendChild(fileElement);
    });
}

function createNewFile() {
    const name = prompt('Enter file name:');
    if (name) {
        state.files.push({
            name,
            type: 'file',
            content: ''
        });
        saveFiles();
        updateFileList();
    }
}

function createNewFolder() {
    const name = prompt('Enter folder name:');
    if (name) {
        state.files.push({
            name,
            type: 'folder',
            content: []
        });
        saveFiles();
        updateFileList();
    }
}

function openFile(name) {
    const file = state.files.find(f => f.name === name);
    if (file) {
        state.currentFile = file;
        toggleWindow('file-explorer');
        updateFileContent();
    }
}

function openFolder(name) {
    toggleWindow('file-explorer');
    // Update path navigator
    document.querySelector('.path-navigator span').textContent = name;
}

function updateFileContent() {
    if (state.currentFile) {
        fileContent.value = state.currentFile.content;
    }
}

function saveFileContent() {
    if (state.currentFile) {
        state.currentFile.content = fileContent.value;
        saveFiles();
    }
}

function saveFiles() {
    localStorage.setItem('berry-files', JSON.stringify(state.files));
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', init); 