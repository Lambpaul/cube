const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(cors());
app.use(express.json());

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

const PIXEL_PER_WORSHIPS = 100;

const PRIMARY_COLORS = {
    red: '#FF0000',
    blue: '#0000FF',
    yellow: '#FFFF00'
};

// Check and unlock features based on clicks
function checkUnlocks(cube) {
    const previousUnlocked = [...cube.unlocked];

    // Check primary colors unlock (200 clicks)
    if (cube.clicks >= MILESTONES.PRIMARY_COLORS && !cube.unlocked.includes('primary_colors')) {
        cube.unlocked.push('primary_colors');
        cube.primaryColors.red.unlocked = true;
        cube.primaryColors.blue.unlocked = true;
        cube.primaryColors.yellow.unlocked = true;
    }

    // Check if all colors should be unlocked (100 worships each)
    if (cube.primaryColors.red.worships >= MILESTONES.PRIMARY_COLOR_MASTERY &&
        cube.primaryColors.blue.worships >= MILESTONES.PRIMARY_COLOR_MASTERY &&
        cube.primaryColors.yellow.worships >= MILESTONES.PRIMARY_COLOR_MASTERY &&
        !cube.allColorsUnlocked) {
        cube.allColorsUnlocked = true;
        if (!cube.unlocked.includes('all_colors')) {
            cube.unlocked.push('all_colors');
        }
    }

    // Check paint mode unlock (500 clicks)
    if (cube.clicks >= MILESTONES.PAINT_MODE && !cube.unlocked.includes('paint_mode')) {
        cube.unlocked.push('paint_mode');
    }

    // Check high resolution unlock (2000 clicks)
    if (cube.clicks >= MILESTONES.HIGH_RES && !cube.unlocked.includes('high_res')) {
        cube.unlocked.push('high_res');
        cube.gridResolution = 64;
    }

    // Check 3D mode unlock (10000 clicks)
    if (cube.clicks >= MILESTONES.MODE_3D && !cube.unlocked.includes('mode_3d')) {
        cube.unlocked.push('mode_3d');
        cube.is3D = true;
    }

    // Update available pixels
    cube.availablePixels = Math.floor(cube.clicks / PIXEL_PER_WORSHIPS);

    return cube.unlocked.length !== previousUnlocked.length;
}

// Create a new cube with a name (called when user names the cube at 100 clicks)
app.post('/api/cube', async (req, res) => {
    try {
        const { name, clicks } = req.body;

        if (!name || name.trim().length === 0) {
            return res.status(400).json({ error: 'Cube name is required' });
        }

        const cubeName = name.trim();

        // Check if cube with this name already exists
        const existingCube = await Cube.findById(cubeName);
        if (existingCube) {
            return res.status(409).json({ error: 'A cube with this name already exists' });
        }

        // Create cube with name as _id
        const cube = new Cube({
            _id: cubeName,
            clicks: clicks || 100,
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
        const cube = await Cube.findById(req.params.name);

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
            const cube = await Cube.findById(cubeName);

            if (!cube) {
                socket.emit('error', { message: 'Cube not found' });
                return;
            }

            cube.clicks += 1;
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
            checkUnlocks(cube);

            await cube.save();

            // Broadcast updated state to all users in the room
            io.to(cubeName).emit('cubeState', cube);

            console.log(`Cube ${cubeName} clicked. Total clicks: ${cube.clicks}`);
        } catch (error) {
            console.error('Error clicking cube:', error);
            socket.emit('error', { message: 'Failed to process click' });
        }
    });

    // Create cube with name (when user reaches 100 clicks and names it)
    socket.on('createNamedCube', async ({ name, clicks }) => {
        try {
            if (!name || name.trim().length === 0) {
                socket.emit('error', { message: 'Cube name is required' });
                return;
            }

            const cubeName = name.trim();

            // Check if cube already exists
            const existingCube = await Cube.findById(cubeName);
            if (existingCube) {
                socket.emit('error', { message: 'A cube with this name already exists' });
                return;
            }

            // Create new cube
            const cube = new Cube({
                _id: cubeName,
                clicks: clicks || 100,
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

            cube.currentColor = color;
            cube.lastInteraction = new Date();
            await cube.save();

            // Broadcast updated state to all users in the room
            io.to(cubeName).emit('cubeState', cube);

            console.log(`Cube ${cubeName} color changed to: ${color}`);
        } catch (error) {
            console.error('Error changing cube color:', error);
            socket.emit('error', { message: 'Failed to change color' });
        }
    });

    // Paint a pixel
    socket.on('paintPixel', async ({ cubeName, face, x, y, color }) => {
        try {
            const cube = await Cube.findById(cubeName);

            if (!cube) {
                socket.emit('error', { message: 'Cube not found' });
                return;
            }

            // Check if paint mode is unlocked
            if (!cube.unlocked.includes('paint_mode')) {
                socket.emit('error', { message: 'Paint mode not unlocked yet' });
                return;
            }

            // Count already painted pixels
            const paintedCount = cube.paintedPixels.length;

            if (paintedCount >= cube.availablePixels) {
                socket.emit('error', { message: 'No more pixels available. Worship more!' });
                return;
            }

            // Check if pixel already painted
            const existingPixel = cube.paintedPixels.find(
                p => p.face === face && p.x === x && p.y === y
            );

            if (existingPixel) {
                // Update existing pixel color
                existingPixel.color = color;
            } else {
                // Add new pixel
                cube.paintedPixels.push({ face, x, y, color });
            }

            cube.lastInteraction = new Date();
            await cube.save();

            // Broadcast updated state to all users in the room
            io.to(cubeName).emit('cubeState', cube);

            console.log(`Cube ${cubeName} pixel painted at (${x}, ${y}) on face ${face}`);
        } catch (error) {
            console.error('Error painting pixel:', error);
            socket.emit('error', { message: 'Failed to paint pixel' });
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
