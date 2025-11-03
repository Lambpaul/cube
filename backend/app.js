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
    color: {
        type: String,
        default: '#000000'
    },
    unlocked: {
        type: [String],
        default: ['name']
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

// Feature milestones
const FEATURES = {
    100: 'name',
    200: 'color',
    500: 'fill',
    1000: '3d'
};

// Check and unlock features based on clicks
function checkUnlocks(cube) {
    let hasNewUnlock = false;

    Object.keys(FEATURES).forEach(milestone => {
        const featureId = FEATURES[milestone];
        if (cube.clicks >= parseInt(milestone) && !cube.unlocked.includes(featureId)) {
            cube.unlocked.push(featureId);
            hasNewUnlock = true;
        }
    });

    return hasNewUnlock;
}

// REST API Routes

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
            color: '#000000',
            unlocked: ['name']
        });

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

// Get all cubes (for leaderboard, future feature)
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
                color: '#000000',
                unlocked: ['name']
            });

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

    // Update cube color
    socket.on('updateCubeColor', async ({ cubeName, color }) => {
        try {
            const cube = await Cube.findById(cubeName);

            if (!cube) {
                socket.emit('error', { message: 'Cube not found' });
                return;
            }

            // Check if color feature is unlocked
            if (!cube.unlocked.includes('color')) {
                socket.emit('error', { message: 'Color feature not unlocked yet' });
                return;
            }

            cube.color = color;
            cube.lastInteraction = new Date();
            await cube.save();

            // Broadcast updated state to all users in the room
            io.to(cubeName).emit('cubeState', cube);

            console.log(`Cube ${cubeName} color changed to: ${color}`);
        } catch (error) {
            console.error('Error updating cube color:', error);
            socket.emit('error', { message: 'Failed to update color' });
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
