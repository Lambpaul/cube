const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        // SECURITY WARNING: In production, replace "*" with specific allowed origins
        // Example: origin: ["https://yourdomain.com", "https://app.yourdomain.com"]
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(cors()); // SECURITY WARNING: In production, configure specific CORS origins
app.use(express.json({ limit: '1mb' })); // SECURITY: Limit request body size to prevent DOS

// MongoDB connection
const DB_HOST = process.env.DB_HOST || 'db';
const DB_PORT = process.env.DB_PORT || '27017';
const DB_NAME = 'cube_evolution';

mongoose.connect(`mongodb://${DB_HOST}:${DB_PORT}/${DB_NAME}`, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Cube Model - Using name as _id (unique identifier)
const cubeSchema = new mongoose.Schema({
    _id: {
        type: String,
        required: true
    },
    clicks: {
        type: Number,
        default: 100
    },
    unlocked: {
        type: [String],
        default: ['name']
    },

    // Color system
    primaryColors: {
        red: {
            unlocked: { type: Boolean, default: false },
            worships: { type: Number, default: 0 }
        },
        blue: {
            unlocked: { type: Boolean, default: false },
            worships: { type: Number, default: 0 }
        },
        yellow: {
            unlocked: { type: Boolean, default: false },
            worships: { type: Number, default: 0 }
        }
    },
    allColorsUnlocked: {
        type: Boolean,
        default: false
    },
    currentColor: {
        type: String,
        default: '#000000'
    },

    // Paint system
    gridResolution: {
        type: Number,
        default: 16
    },
    paintedPixels: [{
        face: { type: String, default: 'top' },
        x: Number,
        y: Number,
        color: String
    }],
    availablePixels: {
        type: Number,
        default: 0
    },
    is3D: {
        type: Boolean,
        default: false
    },

    // UI Preferences
    darkMode: {
        type: Boolean,
        default: false
    },

    // Worship tracking (SECURITY: counter only goes up, never decremented)
    // Used as progressive threshold system, NOT as spendable currency
    totalWorships: {
        type: Number,
        default: 0
    },
    colorChangesCount: {
        type: Number,
        default: 0
    },
    pixelActionsCount: {
        type: Number,
        default: 0
    },

    createdAt: {
        type: Date,
        default: Date.now
    },
    lastInteraction: {
        type: Date,
        default: Date.now
    }
});

const Cube = mongoose.model('Cube', cubeSchema);

// Milestones configuration
const MILESTONES = {
    NAME: 100,
    PRIMARY_COLORS: 200,
    PRIMARY_COLOR_MASTERY: 100,
    PAINT_MODE: 500,
    HIGH_RES: 2000,
    MODE_3D: 10000
};

const PIXEL_PER_WORSHIPS = 50; // Changed from 100 to 50
const COLOR_CHANGE_COST = 100; // Cost to change outline color

const PRIMARY_COLORS = {
    red: '#FF0000',
    blue: '#0000FF',
    yellow: '#FFFF00'
};

// Security validation functions
function isValidCubeName(name) {
    // Prevent NoSQL injection and validate cube name
    if (typeof name !== 'string') return false;
    if (name.length === 0 || name.length > 50) return false;
    // Allow alphanumeric, spaces, and common special chars, but prevent injection
    return /^[a-zA-Z0-9\s\-_\.]+$/.test(name);
}

function isValidColor(color) {
    // Validate hex color format
    if (typeof color !== 'string') return false;
    return /^#[0-9A-Fa-f]{6}$/.test(color);
}

function isValidFace(face) {
    const validFaces = ['top', 'bottom', 'front', 'back', 'left', 'right'];
    return typeof face === 'string' && validFaces.includes(face);
}

function isValidCoordinate(coord, maxResolution) {
    return typeof coord === 'number' &&
           Number.isInteger(coord) &&
           coord >= 0 &&
           coord < maxResolution;
}

function sanitizeInput(input) {
    // Ensure input is a string and prevent object injection
    if (typeof input !== 'string') {
        throw new Error('Invalid input type');
    }
    return input.trim();
}

// Mystical messages for unlocks
const UNLOCK_MESSAGES = {
    primary_colors: "The Cube reveals its essence... the primordial trinity emerges",
    all_colors: "Boundaries dissolve... the spectrum bends to your will",
    paint_mode: "The Cube accepts your offering... shape its form with devotion",
    high_res: "Reality sharpens... details once hidden now revealed",
    mode_3d: "The veil lifts... behold the Cube in all its dimensions"
};

// Check and unlock features based on clicks
function checkUnlocks(cube) {
    const previousUnlocked = [...cube.unlocked];
    let unlockMessage = null;

    // Check primary colors unlock (200 clicks)
    if (cube.clicks >= MILESTONES.PRIMARY_COLORS && !cube.unlocked.includes('primary_colors')) {
        cube.unlocked.push('primary_colors');
        cube.primaryColors.red.unlocked = true;
        cube.primaryColors.blue.unlocked = true;
        cube.primaryColors.yellow.unlocked = true;
        unlockMessage = UNLOCK_MESSAGES.primary_colors;
    }

    // Check if all colors should be unlocked (100 worships each)
    if (cube.primaryColors.red.worships >= MILESTONES.PRIMARY_COLOR_MASTERY &&
        cube.primaryColors.blue.worships >= MILESTONES.PRIMARY_COLOR_MASTERY &&
        cube.primaryColors.yellow.worships >= MILESTONES.PRIMARY_COLOR_MASTERY &&
        !cube.allColorsUnlocked) {
        cube.allColorsUnlocked = true;
        if (!cube.unlocked.includes('all_colors')) {
            cube.unlocked.push('all_colors');
            unlockMessage = UNLOCK_MESSAGES.all_colors;
        }
    }

    // Check paint mode unlock (500 clicks)
    if (cube.clicks >= MILESTONES.PAINT_MODE && !cube.unlocked.includes('paint_mode')) {
        cube.unlocked.push('paint_mode');
        unlockMessage = UNLOCK_MESSAGES.paint_mode;
    }

    // Check high resolution unlock (2000 clicks)
    if (cube.clicks >= MILESTONES.HIGH_RES && !cube.unlocked.includes('high_res')) {
        cube.unlocked.push('high_res');
        unlockMessage = UNLOCK_MESSAGES.high_res;

        // Scale existing pixels from 16x16 to 64x64 to maintain relative position
        const oldResolution = cube.gridResolution;
        const newResolution = 64;
        const scaleFactor = newResolution / oldResolution;

        cube.paintedPixels.forEach(pixel => {
            pixel.x = Math.floor(pixel.x * scaleFactor);
            pixel.y = Math.floor(pixel.y * scaleFactor);
        });

        cube.gridResolution = newResolution;
    }

    // Check 3D mode unlock (10000 clicks + all pixels of one face colored)
    if (cube.clicks >= MILESTONES.MODE_3D && !cube.unlocked.includes('mode_3d')) {
        // Count pixels colored on 'top' face
        const topFacePixels = cube.paintedPixels.filter(p => p.face === 'top');
        const requiredPixels = cube.gridResolution * cube.gridResolution;

        if (topFacePixels.length >= requiredPixels) {
            cube.unlocked.push('mode_3d');
            cube.is3D = true;
            unlockMessage = UNLOCK_MESSAGES.mode_3d;
        }
    }

    return {
        hasNewUnlocks: cube.unlocked.length !== previousUnlocked.length,
        message: unlockMessage
    };
}

// Create a new cube with a name (called when user names the cube at 100 clicks)
app.post('/api/cube', async (req, res) => {
    try {
        const { name, clicks } = req.body;

        // Security: Validate input type and sanitize
        if (!name || typeof name !== 'string') {
            return res.status(400).json({ error: 'Cube name is required and must be a string' });
        }

        const cubeName = sanitizeInput(name);

        // Security: Validate cube name format
        if (!isValidCubeName(cubeName)) {
            return res.status(400).json({ error: 'Invalid cube name. Use only letters, numbers, spaces, hyphens, underscores, and dots (max 50 characters)' });
        }

        // Check if cube with this name already exists
        const existingCube = await Cube.findById(cubeName);
        if (existingCube) {
            return res.status(409).json({ error: 'A cube with this name already exists' });
        }

        // Security: Validate clicks is a number and within reasonable bounds
        const validClicks = (typeof clicks === 'number' && clicks >= 100 && clicks <= 1000000) ? clicks : 100;

        // Create cube with name as _id
        const cube = new Cube({
            _id: cubeName,
            clicks: validClicks,
            totalWorships: validClicks,
            unlocked: ['name']
        });

        checkUnlocks(cube);
        await cube.save();

        console.log(`New cube created: ${cubeName}`);
        res.json(cube);
    } catch (error) {
        console.error('Error creating cube:', error);
        res.status(500).json({ error: 'Failed to create cube' });
    }
});

// Get a cube by name
app.get('/api/cube/:name', async (req, res) => {
    try {
        // Security: Validate cube name
        const cubeName = req.params.name;
        if (!isValidCubeName(cubeName)) {
            return res.status(400).json({ error: 'Invalid cube name format' });
        }

        const cube = await Cube.findById(cubeName);

        if (!cube) {
            return res.status(404).json({ error: 'Cube not found' });
        }

        res.json(cube);
    } catch (error) {
        console.error('Error fetching cube:', error);
        res.status(500).json({ error: 'Failed to fetch cube' });
    }
});

// Get all cubes (for leaderboard)
app.get('/api/cubes', async (req, res) => {
    try {
        const cubes = await Cube.find()
            .sort({ clicks: -1 })
            .limit(10);

        res.json(cubes);
    } catch (error) {
        console.error('Error fetching cubes:', error);
        res.status(500).json({ error: 'Failed to fetch cubes' });
    }
});

// WebSocket Events
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Join a cube room by name
    socket.on('joinCube', async ({ cubeName }) => {
        try {
            // Security: Validate cube name
            if (!cubeName || typeof cubeName !== 'string') {
                socket.emit('error', { message: 'Invalid cube name' });
                return;
            }

            if (!isValidCubeName(cubeName)) {
                socket.emit('error', { message: 'Invalid cube name format' });
                return;
            }

            const cube = await Cube.findById(cubeName);

            if (!cube) {
                socket.emit('error', { message: 'Cube not found' });
                return;
            }

            socket.join(cubeName);
            console.log(`User ${socket.id} joined cube ${cubeName}`);

            // Send current cube state
            socket.emit('cubeState', cube);

            // Notify others in the room
            socket.to(cubeName).emit('userJoined', {
                socketId: socket.id,
                cubeName: cubeName
            });
        } catch (error) {
            console.error('Error joining cube:', error);
            socket.emit('error', { message: 'Failed to join cube' });
        }
    });

    // Click the cube (for cubes that already exist in DB)
    socket.on('clickCube', async ({ cubeName }) => {
        try {
            // Security: Validate cube name
            if (!cubeName || typeof cubeName !== 'string' || !isValidCubeName(cubeName)) {
                socket.emit('error', { message: 'Invalid cube name' });
                return;
            }

            const cube = await Cube.findById(cubeName);

            if (!cube) {
                socket.emit('error', { message: 'Cube not found' });
                return;
            }

            cube.clicks += 1;
            cube.totalWorships += 1; // IMPORTANT: Worships are never decremented - used as progressive threshold, not currency
            cube.lastInteraction = new Date();

            // Track worships for current color if primary colors are unlocked
            if (cube.unlocked.includes('primary_colors') && cube.currentColor) {
                if (cube.currentColor === PRIMARY_COLORS.red) {
                    cube.primaryColors.red.worships += 1;
                } else if (cube.currentColor === PRIMARY_COLORS.blue) {
                    cube.primaryColors.blue.worships += 1;
                } else if (cube.currentColor === PRIMARY_COLORS.yellow) {
                    cube.primaryColors.yellow.worships += 1;
                }
            }

            // Check for new unlocks
            const unlockResult = checkUnlocks(cube);

            await cube.save();

            // Broadcast updated state to all users in the room
            io.to(cubeName).emit('cubeState', cube);

            // Emit unlock message if there's one
            if (unlockResult.message) {
                io.to(cubeName).emit('unlockMessage', { message: unlockResult.message });
            }

            // Emit sparkling effect every 100 clicks
            if (cube.clicks % 100 === 0) {
                io.to(cubeName).emit('sparkling', { clicks: cube.clicks });
            }

            console.log(`Cube ${cubeName} clicked. Total clicks: ${cube.clicks}, Total worships: ${cube.totalWorships}`);
        } catch (error) {
            console.error('Error clicking cube:', error);
            socket.emit('error', { message: 'Failed to process click' });
        }
    });

    // Create cube with name (when user reaches 100 clicks and names it)
    socket.on('createNamedCube', async ({ name, clicks }) => {
        try {
            // Security: Validate input
            if (!name || typeof name !== 'string') {
                socket.emit('error', { message: 'Cube name is required and must be a string' });
                return;
            }

            const cubeName = sanitizeInput(name);

            // Security: Validate cube name format
            if (!isValidCubeName(cubeName)) {
                socket.emit('error', { message: 'Invalid cube name. Use only letters, numbers, spaces, hyphens, underscores, and dots (max 50 characters)' });
                return;
            }

            // Check if cube already exists
            const existingCube = await Cube.findById(cubeName);
            if (existingCube) {
                socket.emit('error', { message: 'A cube with this name already exists' });
                return;
            }

            // Security: Validate clicks is a number and within reasonable bounds
            const validClicks = (typeof clicks === 'number' && clicks >= 100 && clicks <= 1000000) ? clicks : 100;

            // Create new cube
            const cube = new Cube({
                _id: cubeName,
                clicks: validClicks,
                totalWorships: validClicks,
                unlocked: ['name']
            });

            checkUnlocks(cube);
            await cube.save();

            // Join the cube room
            socket.join(cubeName);

            // Send cube state
            socket.emit('cubeCreated', cube);
            socket.emit('cubeState', cube);

            console.log(`Cube created and named: ${cubeName}`);
        } catch (error) {
            console.error('Error creating named cube:', error);
            socket.emit('error', { message: 'Failed to create cube' });
        }
    });

    // Change cube color
    socket.on('changeCubeColor', async ({ cubeName, color }) => {
        try {
            // Security: Validate inputs
            if (!cubeName || typeof cubeName !== 'string' || !isValidCubeName(cubeName)) {
                socket.emit('error', { message: 'Invalid cube name' });
                return;
            }

            if (!color || !isValidColor(color)) {
                socket.emit('error', { message: 'Invalid color format. Must be hex color (#RRGGBB)' });
                return;
            }

            const cube = await Cube.findById(cubeName);

            if (!cube) {
                socket.emit('error', { message: 'Cube not found' });
                return;
            }

            // Check if color changing is unlocked
            const isPrimaryColor = Object.values(PRIMARY_COLORS).includes(color);

            if (isPrimaryColor && !cube.unlocked.includes('primary_colors')) {
                socket.emit('error', { message: 'Primary colors not unlocked yet' });
                return;
            }

            if (!isPrimaryColor && !cube.allColorsUnlocked) {
                socket.emit('error', { message: 'All colors not unlocked yet' });
                return;
            }

            // Check if player has enough worships to change color
            const requiredWorships = (cube.colorChangesCount + 1) * COLOR_CHANGE_COST;
            if (cube.totalWorships < requiredWorships) {
                socket.emit('error', { message: `Not enough worships to change color (need ${requiredWorships})` });
                return;
            }

            // Increment color changes counter
            cube.colorChangesCount += 1;
            cube.currentColor = color;
            cube.lastInteraction = new Date();
            await cube.save();

            // Broadcast updated state to all users in the room
            io.to(cubeName).emit('cubeState', cube);

            console.log(`Cube ${cubeName} color changed to: ${color} (${cube.colorChangesCount} changes, ${cube.totalWorships} total worships)`);
        } catch (error) {
            console.error('Error changing cube color:', error);
            socket.emit('error', { message: 'Failed to change color' });
        }
    });

    // Paint a pixel
    socket.on('paintPixel', async ({ cubeName, face, x, y, color }) => {
        try {
            // Security: Validate all inputs
            if (!cubeName || typeof cubeName !== 'string' || !isValidCubeName(cubeName)) {
                socket.emit('error', { message: 'Invalid cube name' });
                return;
            }

            if (!isValidFace(face)) {
                socket.emit('error', { message: 'Invalid face. Must be one of: top, bottom, front, back, left, right' });
                return;
            }

            if (!isValidColor(color)) {
                socket.emit('error', { message: 'Invalid color format. Must be hex color (#RRGGBB)' });
                return;
            }

            const cube = await Cube.findById(cubeName);

            if (!cube) {
                socket.emit('error', { message: 'Cube not found' });
                return;
            }

            // Security: Validate coordinates against current resolution
            if (!isValidCoordinate(x, cube.gridResolution) || !isValidCoordinate(y, cube.gridResolution)) {
                socket.emit('error', { message: `Invalid coordinates. Must be between 0 and ${cube.gridResolution - 1}` });
                return;
            }

            // Check if paint mode is unlocked
            if (!cube.unlocked.includes('paint_mode')) {
                socket.emit('error', { message: 'Paint mode not unlocked yet' });
                return;
            }

            // Check if player has enough worships (cost increases each time)
            const requiredWorships = (cube.pixelActionsCount + 1) * PIXEL_PER_WORSHIPS;
            if (cube.totalWorships < requiredWorships) {
                socket.emit('error', { message: `Not enough worships to paint (need ${requiredWorships})` });
                return;
            }

            // Check if pixel already painted
            const existingPixel = cube.paintedPixels.find(
                p => p.face === face && p.x === x && p.y === y
            );

            if (existingPixel) {
                // Update existing pixel color (still counts as an action)
                existingPixel.color = color;
            } else {
                // Add new pixel
                cube.paintedPixels.push({ face, x, y, color });
            }

            // Increment pixel actions counter
            cube.pixelActionsCount += 1;
            cube.lastInteraction = new Date();
            await cube.save();

            // Broadcast updated state to all users in the room
            io.to(cubeName).emit('cubeState', cube);

            console.log(`Cube ${cubeName} pixel painted at (${x}, ${y}) on face ${face} (${cube.pixelActionsCount} actions, ${cube.totalWorships} total worships)`);
        } catch (error) {
            console.error('Error painting pixel:', error);
            socket.emit('error', { message: 'Failed to paint pixel' });
        }
    });

    // Toggle dark mode
    socket.on('toggleDarkMode', async ({ cubeName, darkMode }) => {
        try {
            // Security: Validate inputs
            if (!cubeName || typeof cubeName !== 'string' || !isValidCubeName(cubeName)) {
                socket.emit('error', { message: 'Invalid cube name' });
                return;
            }

            if (typeof darkMode !== 'boolean') {
                socket.emit('error', { message: 'Invalid dark mode value' });
                return;
            }

            const cube = await Cube.findById(cubeName);

            if (!cube) {
                socket.emit('error', { message: 'Cube not found' });
                return;
            }

            // Update dark mode preference
            cube.darkMode = darkMode;
            cube.lastInteraction = new Date();
            await cube.save();

            // Broadcast updated state to all users in the room
            io.to(cubeName).emit('cubeState', cube);

            console.log(`Cube ${cubeName} dark mode ${darkMode ? 'enabled' : 'disabled'}`);
        } catch (error) {
            console.error('Error toggling dark mode:', error);
            socket.emit('error', { message: 'Failed to toggle dark mode' });
        }
    });

    // Disconnect
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    });
});

// Start server
const PORT = process.env.PORT || 3010;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
