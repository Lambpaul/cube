// Global variables
let socket = null;
let cubeRenderer = null;
let currentCubeName = null;
let localClicks = 0;
let isInDatabase = false;

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

    // Start with a local cube (not in database yet)
    startLocalCube();

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

    socket.on('cubeCreated', (cube) => {
        console.log('Cube created in database:', cube._id);
        isInDatabase = true;
        currentCubeName = cube._id;
        updateUIWithCubeName(cube._id);
    });

    socket.on('error', (error) => {
        console.error('Socket error:', error);
        alert(error.message || 'An error occurred');
    });

    socket.on('disconnect', () => {
        console.log('Disconnected from server');
    });
}

// Start a local cube (not in database)
function startLocalCube() {
    localClicks = 0;
    isInDatabase = false;
    currentCubeName = null;
    cubeNameDisplay.classList.add('hidden');
    currentCubeSection.classList.add('hidden');
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

    // Create new cube button (resets to local cube)
    createCubeBtn.addEventListener('click', () => {
        startLocalCube();
        settingsModal.classList.add('hidden');
    });

    // Join cube button
    joinCubeBtn.addEventListener('click', () => {
        const cubeName = cubeIdInput.value.trim();
        if (cubeName) {
            joinCubeByName(cubeName);
            settingsModal.classList.add('hidden');
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
                .catch(err => {
                    console.error('Failed to copy:', err);
                });
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

// Join a cube by name
function joinCubeByName(cubeName) {
    socket.emit('joinCube', { cubeName });
    currentCubeName = cubeName;
    isInDatabase = true;
    localClicks = 0;
    updateUIWithCubeName(cubeName);
}

// Update UI with cube name
function updateUIWithCubeName(name) {
    currentCubeIdSpan.textContent = name;
    currentCubeSection.classList.remove('hidden');
    cubeNameDisplay.textContent = name;
    cubeNameDisplay.classList.remove('hidden');
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
        if (localClicks >= 100) {
            // Show name modal
            nameModal.classList.remove('hidden');
        }
    }
}

// Create a named cube in the database
function createNamedCube(name) {
    if (localClicks >= 100) {
        socket.emit('createNamedCube', { name, clicks: localClicks });
        nameModal.classList.add('hidden');
    }
}

// Update cube state (from server)
function updateCubeState(cube) {
    if (!cube) return;

    console.log('Cube state updated:', cube);

    // Update cube name display
    if (cube._id) {
        cubeNameDisplay.textContent = cube._id;
        cubeNameDisplay.classList.remove('hidden');
        currentCubeName = cube._id;
    }

    // Update cube renderer based on unlocked features
    if (cubeRenderer) {
        // Check if fill should be enabled
        if (cube.unlocked && cube.unlocked.includes('fill')) {
            cubeRenderer.enableFill();
        }

        // Check if 3D should be enabled
        if (cube.unlocked && cube.unlocked.includes('3d') && !cubeRenderer.is3D) {
            cubeRenderer.enable3D();
        }

        // Update color if color feature is unlocked
        if (cube.unlocked && cube.unlocked.includes('color') && cube.color) {
            cubeRenderer.updateColor(cube.color);
        }
    }
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', init);
