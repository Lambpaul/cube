// Global variables
let socket = null;
let cubeRenderer = null;
let currentCubeName = null;
let localClicks = 0;
let isInDatabase = false;
let currentCubeData = null;
let paintModeEnabled = false;
let currentPaintColor = '#FF0000';
let selectedFace = 'top';

// UI Elements
const welcomeText = document.getElementById('welcome-text');
const topLeftPanel = document.getElementById('top-left-panel');
const cubeNameDisplay = document.getElementById('cube-name-display');
const uiToggleBtn = document.getElementById('ui-toggle-btn');
const settingsBtn = document.getElementById('settings-btn');
const cubeContainer = document.getElementById('cube-container');
const uiPanel = document.getElementById('ui-panel');

// UI Sections
const primaryColorsPanel = document.getElementById('primary-colors-panel');
const fullColorPickerPanel = document.getElementById('full-color-picker-panel');
const paintModePanel = document.getElementById('paint-mode-panel');
const mode3DPanel = document.getElementById('3d-mode-panel');

// Primary Colors Elements
const colorButtons = document.querySelectorAll('.color-btn');

// Full Color Picker Elements
const fullColorPicker = document.getElementById('full-color-picker');
const colorHexInput = document.getElementById('color-hex-input');
const applyColorBtn = document.getElementById('apply-color-btn');

// Paint Mode Elements
const paintModeToggle = document.getElementById('paint-mode-toggle');
const paintColorSwatch = document.getElementById('paint-color-swatch');
const paintGridCanvas = document.getElementById('paint-grid-canvas');

// 3D Mode Elements
const faceSelect = document.getElementById('face-select');

// Modals
const settingsModal = document.getElementById('settings-modal');
const nameModal = document.getElementById('name-modal');
const closeSettings = document.getElementById('close-settings');

// Buttons and inputs
const createCubeBtn = document.getElementById('create-cube-btn');
const joinCubeBtn = document.getElementById('join-cube-btn');
const cubeIdInput = document.getElementById('cube-id-input');
const currentCubeIdSpan = document.getElementById('current-cube-id');
const copyIdBtn = document.getElementById('copy-id-btn');
const cubeNameInput = document.getElementById('cube-name-input');
const confirmNameBtn = document.getElementById('confirm-name-btn');
const currentCubeSection = document.getElementById('current-cube-section');

// Constants
const PRIMARY_COLORS = {
    red: '#FF0000',
    blue: '#0000FF',
    yellow: '#FFFF00'
};

const MILESTONES = {
    NAME: 100,
    PRIMARY_COLORS: 200,
    PRIMARY_COLOR_MASTERY: 100,
    PAINT_MODE: 500,
    HIGH_RES: 2000,
    MODE_3D: 10000
};

// Initialize
function init() {
    initSocket();
    cubeRenderer = new CubeRenderer('cube-container');

    // Fade out welcome text after 10 seconds
    setTimeout(() => {
        welcomeText.classList.add('fade-out');
    }, 10000);

    // Start with a local cube
    startLocalCube();

    setupEventListeners();
}

// Initialize Socket.io connection
function initSocket() {
    socket = io();

    socket.on('connect', () => {
        console.log('Connected to server');
    });

    socket.on('cubeState', (cube) => {
        updateCubeState(cube);
    });

    socket.on('cubeCreated', (cube) => {
        console.log('Cube created in database:', cube._id);
        isInDatabase = true;
        currentCubeName = cube._id;
        updateUIWithCubeName(cube._id);
    });

    socket.on('error', (error) => {
        console.error('Socket error:', error);
        // Don't show cube not found as alert, just log it
        if (error.message !== 'Cube not found') {
            alert(error.message || 'An error occurred');
        }
    });

    socket.on('disconnect', () => {
        console.log('Disconnected from server');
    });

    socket.on('unlockMessage', ({ message }) => {
        showUnlockMessage(message);
    });

    socket.on('sparkling', ({ clicks }) => {
        showSparklingEffect();
    });
}

// Start a local cube
function startLocalCube() {
    localClicks = 0;
    isInDatabase = false;
    currentCubeName = null;
    currentCubeData = null;
    topLeftPanel.classList.add('hidden');
    currentCubeSection.classList.add('hidden');

    // Reset renderer
    if (cubeRenderer) {
        cubeRenderer.reset();
    }
}

// Setup event listeners
function setupEventListeners() {
    // Settings button
    settingsBtn.addEventListener('click', () => {
        settingsModal.classList.remove('hidden');
    });

    // UI Toggle button
    uiToggleBtn.addEventListener('click', () => {
        uiPanel.classList.toggle('collapsed');
        uiToggleBtn.classList.toggle('collapsed');
    });

    // Close settings
    closeSettings.addEventListener('click', () => {
        settingsModal.classList.add('hidden');
    });

    // Close modal when clicking outside
    settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) {
            settingsModal.classList.add('hidden');
        }
    });

    // Create new cube button
    createCubeBtn.addEventListener('click', () => {
        startLocalCube();
        settingsModal.classList.add('hidden');
    });

    // Join cube button
    joinCubeBtn.addEventListener('click', () => {
        const cubeName = cubeIdInput.value.trim();
        if (cubeName) {
            joinCubeByName(cubeName);
        }
    });

    // Join on Enter key
    cubeIdInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            joinCubeBtn.click();
        }
    });

    // Copy cube name
    copyIdBtn.addEventListener('click', () => {
        if (currentCubeName) {
            navigator.clipboard.writeText(currentCubeName)
                .then(() => {
                    copyIdBtn.textContent = 'Copied!';
                    setTimeout(() => {
                        copyIdBtn.textContent = 'Copy Name';
                    }, 2000);
                })
                .catch(err => console.error('Failed to copy:', err));
        }
    });

    // Confirm name button
    confirmNameBtn.addEventListener('click', () => {
        const name = cubeNameInput.value.trim();
        if (name) {
            createNamedCube(name);
            cubeNameInput.value = '';
        }
    });

    // Confirm name on Enter
    cubeNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            confirmNameBtn.click();
        }
    });

    // Click on cube to worship
    cubeContainer.addEventListener('click', () => {
        if (!paintModeEnabled) {
            clickCube();
        }
    });

    // Primary color buttons
    colorButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const color = btn.dataset.color;
            changeCubeColor(color);

            // Update active state
            colorButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    // Full color picker
    fullColorPicker.addEventListener('input', (e) => {
        colorHexInput.value = e.target.value;
    });

    colorHexInput.addEventListener('input', (e) => {
        if (e.target.value.match(/^#[0-9A-Fa-f]{6}$/)) {
            fullColorPicker.value = e.target.value;
        }
    });

    applyColorBtn.addEventListener('click', () => {
        const color = fullColorPicker.value;
        changeCubeColor(color);
    });

    // Paint mode toggle
    paintModeToggle.addEventListener('change', (e) => {
        paintModeEnabled = e.target.checked;
        if (paintModeEnabled) {
            enablePaintMode();
        } else {
            disablePaintMode();
        }
    });

    // Face selector
    faceSelect.addEventListener('change', (e) => {
        selectedFace = e.target.value;
        if (cubeRenderer && cubeRenderer.is3D) {
            cubeRenderer.setActiveFace(selectedFace);
        }
    });

    // Paint grid canvas click
    paintGridCanvas.addEventListener('click', (e) => {
        if (paintModeEnabled && currentCubeData) {
            handlePaintClick(e);
        }
    });
}

// Join a cube by name
function joinCubeByName(cubeName) {
    socket.emit('joinCube', { cubeName });

    // Listen for cube not found error
    socket.once('error', (error) => {
        if (error.message === 'Cube not found') {
            alert(`Cube "${cubeName}" not found`);
            settingsModal.classList.add('hidden');
            // Stay on local cube, don't update UI
        }
    });

    socket.once('cubeState', (cube) => {
        // Cube found successfully
        currentCubeName = cubeName;
        isInDatabase = true;
        localClicks = 0;
        updateUIWithCubeName(cubeName);
        settingsModal.classList.add('hidden');
    });
}

// Update UI with cube name
function updateUIWithCubeName(name) {
    currentCubeIdSpan.textContent = name;
    currentCubeSection.classList.remove('hidden');
    cubeNameDisplay.textContent = name;
    topLeftPanel.classList.remove('hidden');
}

// Click the cube
function clickCube() {
    if (isInDatabase && currentCubeName) {
        // Cube is in database, send click to server
        socket.emit('clickCube', { cubeName: currentCubeName });
    } else {
        // Local cube, increment locally
        localClicks++;
        console.log(`Local clicks: ${localClicks}`);

        // Check if we reached 100 clicks
        if (localClicks >= MILESTONES.NAME) {
            nameModal.classList.remove('hidden');
        }
    }
}

// Create a named cube in database
function createNamedCube(name) {
    if (localClicks >= MILESTONES.NAME) {
        socket.emit('createNamedCube', { name, clicks: localClicks });
        nameModal.classList.add('hidden');
    }
}

// Update cube state from server
function updateCubeState(cube) {
    if (!cube) return;

    console.log('Cube state updated:', cube);
    currentCubeData = cube;

    // Update cube name display
    if (cube._id) {
        cubeNameDisplay.textContent = cube._id;
        topLeftPanel.classList.remove('hidden');
        currentCubeName = cube._id;
    }

    // Update dynamic UI
    updateDynamicUI(cube);

    // Update cube renderer
    updateCubeRenderer(cube);
}

// Update dynamic UI based on cube progress
function updateDynamicUI(cube) {
    const unlocked = cube.unlocked || [];
    let hasAnyUI = false;

    // Primary Colors (200 clicks)
    if (unlocked.includes('primary_colors')) {
        primaryColorsPanel.classList.remove('hidden');
        hasAnyUI = true;
    } else {
        primaryColorsPanel.classList.add('hidden');
    }

    // Full Color Picker (all colors unlocked)
    if (cube.allColorsUnlocked) {
        fullColorPickerPanel.classList.remove('hidden');
        hasAnyUI = true;
    } else {
        fullColorPickerPanel.classList.add('hidden');
    }

    // Paint Mode (500 clicks)
    if (unlocked.includes('paint_mode')) {
        paintModePanel.classList.remove('hidden');
        hasAnyUI = true;
    } else {
        paintModePanel.classList.add('hidden');
    }

    // 3D Mode (10000 clicks)
    if (unlocked.includes('mode_3d')) {
        mode3DPanel.classList.remove('hidden');
        hasAnyUI = true;
    } else {
        mode3DPanel.classList.add('hidden');
    }

    // Show/hide UI panel and toggle button
    if (hasAnyUI) {
        uiPanel.classList.remove('hidden');
        uiToggleBtn.classList.remove('hidden');
    } else {
        uiPanel.classList.add('hidden');
        uiToggleBtn.classList.add('hidden');
    }
}

// Update cube renderer
function updateCubeRenderer(cube) {
    if (!cubeRenderer) return;

    // Update color
    if (cube.currentColor) {
        cubeRenderer.updateColor(cube.currentColor);
    }

    // Update painted pixels
    if (cube.paintedPixels && cube.paintedPixels.length > 0) {
        cubeRenderer.updatePaintedPixels(cube.paintedPixels, cube.gridResolution);
    }

    // Redraw paint grid if paint mode is enabled
    if (paintModeEnabled && !paintGridCanvas.classList.contains('hidden')) {
        drawPaintGrid(cube.gridResolution);
    }

    // Enable 3D mode
    if (cube.is3D && !cubeRenderer.is3D) {
        cubeRenderer.enable3D();
    }
}

// Change cube color
function changeCubeColor(color) {
    if (currentCubeName && isInDatabase) {
        socket.emit('changeCubeColor', { cubeName: currentCubeName, color });
        currentPaintColor = color;
        paintColorSwatch.style.background = color;
    }
}

// Enable paint mode
function enablePaintMode() {
    if (!currentCubeData || !currentCubeData.unlocked.includes('paint_mode')) {
        paintModeToggle.checked = false;
        alert('Paint mode not unlocked yet!');
        return;
    }

    // Setup paint grid canvas
    const resolution = currentCubeData.gridResolution;
    const size = 400; // Same as cube container

    paintGridCanvas.width = size;
    paintGridCanvas.height = size;
    paintGridCanvas.classList.remove('hidden');

    drawPaintGrid(resolution);
}

// Disable paint mode
function disablePaintMode() {
    paintGridCanvas.classList.add('hidden');
}

// Draw paint grid
function drawPaintGrid(resolution) {
    const ctx = paintGridCanvas.getContext('2d');
    const size = paintGridCanvas.width;
    const cellSize = size / resolution;

    ctx.clearRect(0, 0, size, size);

    // Draw grid lines
    ctx.strokeStyle = '#cccccc';
    ctx.lineWidth = 1;

    for (let i = 0; i <= resolution; i++) {
        // Vertical lines
        ctx.beginPath();
        ctx.moveTo(i * cellSize, 0);
        ctx.lineTo(i * cellSize, size);
        ctx.stroke();

        // Horizontal lines
        ctx.beginPath();
        ctx.moveTo(0, i * cellSize);
        ctx.lineTo(size, i * cellSize);
        ctx.stroke();
    }

    // Draw painted pixels
    if (currentCubeData && currentCubeData.paintedPixels) {
        currentCubeData.paintedPixels.forEach(pixel => {
            if (pixel.face === selectedFace) {
                ctx.fillStyle = pixel.color;
                ctx.fillRect(pixel.x * cellSize, pixel.y * cellSize, cellSize, cellSize);
            }
        });
    }
}

// Handle paint click
function handlePaintClick(e) {
    const rect = paintGridCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const resolution = currentCubeData.gridResolution;
    const cellSize = paintGridCanvas.width / resolution;

    const gridX = Math.floor(x / cellSize);
    const gridY = Math.floor(y / cellSize);

    // Send paint pixel request
    socket.emit('paintPixel', {
        cubeName: currentCubeName,
        face: selectedFace,
        x: gridX,
        y: gridY,
        color: currentPaintColor
    });

    // Don't update optimistically - wait for server response
    // This prevents conflicts in multiplayer mode
}

// Show mystical unlock message
function showUnlockMessage(message) {
    const unlockMessageEl = document.getElementById('unlock-message');
    unlockMessageEl.textContent = message;
    unlockMessageEl.classList.remove('hidden');
    unlockMessageEl.classList.add('show');

    // Fade out after 5 seconds
    setTimeout(() => {
        unlockMessageEl.classList.remove('show');
        setTimeout(() => {
            unlockMessageEl.classList.add('hidden');
        }, 1000);
    }, 5000);
}

// Show sparkling effect
function showSparklingEffect() {
    // Create sparkling element at cursor or center of cube
    const cubeRect = cubeContainer.getBoundingClientRect();
    const centerX = cubeRect.left + cubeRect.width / 2;
    const centerY = cubeRect.top + cubeRect.height / 2;

    const sparkle = document.createElement('div');
    sparkle.className = 'sparkle-effect';
    sparkle.style.left = centerX + 'px';
    sparkle.style.top = centerY + 'px';
    document.body.appendChild(sparkle);

    // Remove after animation
    setTimeout(() => {
        sparkle.remove();
    }, 1000);
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', init);
