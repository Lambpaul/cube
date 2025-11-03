// Global variables
let socket = null;
let cubeRenderer = null;
let currentCubeId = null;

// UI Elements
const startScreen = document.getElementById('start-screen');
const gameScreen = document.getElementById('game-screen');
const createCubeBtn = document.getElementById('create-cube-btn');
const joinCubeBtn = document.getElementById('join-cube-btn');
const cubeIdInput = document.getElementById('cube-id-input');
const clickCubeBtn = document.getElementById('click-cube-btn');
const currentCubeIdSpan = document.getElementById('current-cube-id');
const cubeNameSpan = document.getElementById('cube-name');
const cubeClicksSpan = document.getElementById('cube-clicks');
const editNameBtn = document.getElementById('edit-name-btn');
const colorPicker = document.getElementById('color-picker');
const copyIdBtn = document.getElementById('copy-id-btn');
const featuresList = document.getElementById('features-list');
const notificationsDiv = document.getElementById('notifications');

// Feature milestones
const FEATURES = {
    100: { id: 'name', label: 'Name your cube', description: 'You can now give your cube a name!' },
    200: { id: 'color', label: 'Change cube color', description: 'You can now change the cube\'s color!' },
    500: { id: 'fill', label: 'Fill the cube', description: 'The cube is now fully opaque!' },
    1000: { id: '3d', label: '3D Mode', description: 'The cube is now in full 3D!' }
};

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
        showNotification('Connection error. Please refresh the page.', 'error');
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
        showNotification('Failed to create cube. Please try again.', 'error');
    });
}

// Join a cube by ID
function joinCubeById(cubeId) {
    currentCubeId = cubeId;
    socket.emit('joinCube', { cubeId });

    // Switch to game screen
    startScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');

    // Initialize cube renderer
    if (!cubeRenderer) {
        cubeRenderer = new CubeRenderer('cube-container');
    }

    // Display cube ID
    currentCubeIdSpan.textContent = cubeId;
}

// Update cube state
function updateCubeState(cube) {
    if (!cube) return;

    // Update UI
    cubeNameSpan.textContent = cube.name;
    cubeClicksSpan.textContent = cube.clicks;

    // Update cube renderer
    if (cubeRenderer) {
        cubeRenderer.updateColor(cube.color);

        // Check if 3D should be enabled
        if (cube.unlocked.includes('3d') && !cubeRenderer.is3D) {
            cubeRenderer.enable3D();
        }

        // Check if fill should be enabled
        if (cube.unlocked.includes('fill')) {
            cubeRenderer.enableFill();
        }
    }

    // Update unlocked features
    updateUnlockedFeatures(cube.unlocked);

    // Check for new unlocks
    checkNewUnlocks(cube.clicks, cube.unlocked);
}

// Click the cube
function clickCube() {
    if (currentCubeId) {
        socket.emit('clickCube', { cubeId: currentCubeId });
    }
}

// Update unlocked features list
function updateUnlockedFeatures(unlocked) {
    featuresList.innerHTML = '';

    unlocked.forEach(featureId => {
        const feature = Object.values(FEATURES).find(f => f.id === featureId);
        if (feature) {
            const li = document.createElement('li');
            li.textContent = feature.label;
            featuresList.appendChild(li);
        }
    });

    // Show/hide controls based on unlocked features
    if (unlocked.includes('name')) {
        editNameBtn.classList.remove('hidden');
    }

    if (unlocked.includes('color')) {
        colorPicker.classList.remove('hidden');
    }
}

// Check for new unlocks
function checkNewUnlocks(clicks, unlocked) {
    Object.keys(FEATURES).forEach(milestone => {
        const feature = FEATURES[milestone];
        if (clicks >= milestone && !unlocked.includes(feature.id)) {
            showNotification(feature.description, 'success');
        }
    });
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;

    notificationsDiv.appendChild(notification);

    // Remove notification after animation
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Edit cube name
function editCubeName() {
    const newName = prompt('Enter a new name for your cube:', cubeNameSpan.textContent);
    if (newName && newName.trim()) {
        socket.emit('updateCubeName', { cubeId: currentCubeId, name: newName.trim() });
    }
}

// Change cube color
function changeCubeColor(color) {
    socket.emit('updateCubeColor', { cubeId: currentCubeId, color });
}

// Copy cube ID to clipboard
function copyCubeId() {
    navigator.clipboard.writeText(currentCubeId)
        .then(() => {
            showNotification('Cube ID copied to clipboard!', 'success');
        })
        .catch(err => {
            console.error('Failed to copy:', err);
        });
}

// Event listeners
createCubeBtn.addEventListener('click', createCube);

joinCubeBtn.addEventListener('click', () => {
    const cubeId = cubeIdInput.value.trim();
    if (cubeId) {
        joinCubeById(cubeId);
    } else {
        showNotification('Please enter a valid Cube ID', 'error');
    }
});

cubeIdInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        joinCubeBtn.click();
    }
});

clickCubeBtn.addEventListener('click', clickCube);

editNameBtn.addEventListener('click', editCubeName);

colorPicker.addEventListener('change', (e) => {
    changeCubeColor(e.target.value);
});

copyIdBtn.addEventListener('click', copyCubeId);

// Initialize
initSocket();
