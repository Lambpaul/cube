// Global variables
let socket = null;
let cubeRenderer = null;
let currentCubeId = null;
let hasNamed = false;

// UI Elements
const welcomeText = document.getElementById('welcome-text');
const cubeNameDisplay = document.getElementById('cube-name-display');
const settingsBtn = document.getElementById('settings-btn');
const cubeContainer = document.getElementById('cube-container');

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

// Feature milestones
const FEATURES = {
    100: 'name',
    200: 'color',
    500: 'fill',
    1000: '3d'
};

// Initialize
function init() {
    // Initialize Socket.io connection
    initSocket();

    // Initialize cube renderer
    cubeRenderer = new CubeRenderer('cube-container');

    // Fade out welcome text after 10 seconds
    setTimeout(() => {
        welcomeText.classList.add('fade-out');
    }, 10000);

    // Auto-create a cube on page load
    createCube();

    // Event listeners
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

    socket.on('disconnect', () => {
        console.log('Disconnected from server');
    });

    socket.on('error', (error) => {
        console.error('Socket error:', error);
    });
}

// Setup event listeners
function setupEventListeners() {
    // Settings button
    settingsBtn.addEventListener('click', () => {
        settingsModal.classList.remove('hidden');
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

    // Create cube button
    createCubeBtn.addEventListener('click', () => {
        createCube();
        settingsModal.classList.add('hidden');
    });

    // Join cube button
    joinCubeBtn.addEventListener('click', () => {
        const cubeId = cubeIdInput.value.trim();
        if (cubeId) {
            joinCubeById(cubeId);
            settingsModal.classList.add('hidden');
        }
    });

    // Join on Enter key
    cubeIdInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            joinCubeBtn.click();
        }
    });

    // Copy cube ID
    copyIdBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(currentCubeId)
            .then(() => {
                copyIdBtn.textContent = 'Copied!';
                setTimeout(() => {
                    copyIdBtn.textContent = 'Copy ID';
                }, 2000);
            })
            .catch(err => {
                console.error('Failed to copy:', err);
            });
    });

    // Confirm name button
    confirmNameBtn.addEventListener('click', () => {
        const name = cubeNameInput.value.trim();
        if (name) {
            updateCubeName(name);
            nameModal.classList.add('hidden');
            cubeNameInput.value = '';
        }
    });

    // Confirm name on Enter key
    cubeNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            confirmNameBtn.click();
        }
    });

    // Click on cube to worship it
    cubeContainer.addEventListener('click', () => {
        clickCube();
    });
}

// Create a new cube
function createCube() {
    fetch('/api/cube', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        joinCubeById(data._id);
    })
    .catch(error => {
        console.error('Error creating cube:', error);
    });
}

// Join a cube by ID
function joinCubeById(cubeId) {
    currentCubeId = cubeId;
    hasNamed = false;
    socket.emit('joinCube', { cubeId });

    // Update UI
    currentCubeIdSpan.textContent = cubeId;
    currentCubeSection.classList.remove('hidden');
    cubeNameDisplay.classList.add('hidden');
    cubeNameDisplay.textContent = '';
}

// Click the cube
function clickCube() {
    if (currentCubeId) {
        socket.emit('clickCube', { cubeId: currentCubeId });
    }
}

// Update cube state
function updateCubeState(cube) {
    if (!cube) return;

    // Check if name feature is unlocked and user hasn't named it yet
    if (cube.unlocked.includes('name') && !hasNamed && cube.name === '???') {
        // Show name modal
        nameModal.classList.remove('hidden');
        hasNamed = true;
    }

    // Update cube name display
    if (cube.name && cube.name !== '???') {
        cubeNameDisplay.textContent = cube.name;
        cubeNameDisplay.classList.remove('hidden');
    }

    // Update cube renderer based on unlocked features
    if (cubeRenderer) {
        // Check if fill should be enabled
        if (cube.unlocked.includes('fill')) {
            cubeRenderer.enableFill();
        }

        // Check if 3D should be enabled
        if (cube.unlocked.includes('3d') && !cubeRenderer.is3D) {
            cubeRenderer.enable3D();
        }

        // Update color if color feature is unlocked
        if (cube.unlocked.includes('color') && cube.color) {
            cubeRenderer.updateColor(cube.color);
        }
    }
}

// Update cube name
function updateCubeName(name) {
    if (currentCubeId && name) {
        socket.emit('updateCubeName', { cubeId: currentCubeId, name: name });
    }
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', init);
