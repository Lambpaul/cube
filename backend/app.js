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

// Cube Model
const cubeSchema = new mongoose.Schema({
    name: {
        type: String,
        default: '???'
    },
    clicks: {
        type: Number,
        default: 0
    },
    color: {
        type: String,
        default: '#000000'
    },
    unlocked: {
        type: [String],
        default: []
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

// Create a new cube
app.post('/api/cube', async (req, res) => {
    try {
        const cube = new Cube({
            name: '???',
            clicks: 0,
            color: '#000000',
            unlocked: []
        });

        await cube.save();
        console.log(`New cube created: ${cube._id}`);
        res.json(cube);
    } catch (error) {
        console.error('Error creating cube:', error);
        res.status(500).json({ error: 'Failed to create cube' });
    }
});

// Get a cube by ID
app.get('/api/cube/:id', async (req, res) => {
    try {
        const cube = await Cube.findById(req.params.id);

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

    // Join a cube room
    socket.on('joinCube', async ({ cubeId }) => {
        try {
            const cube = await Cube.findById(cubeId);

            if (!cube) {
                socket.emit('error', { message: 'Cube not found' });
                return;
            }

            socket.join(cubeId);
            console.log(`User ${socket.id} joined cube ${cubeId}`);

            // Send current cube state
            socket.emit('cubeState', cube);

            // Notify others in the room
            socket.to(cubeId).emit('userJoined', {
                socketId: socket.id,
                cubeId: cubeId
            });
        } catch (error) {
            console.error('Error joining cube:', error);
            socket.emit('error', { message: 'Failed to join cube' });
        }
    });

    // Click the cube
    socket.on('clickCube', async ({ cubeId }) => {
        try {
            const cube = await Cube.findById(cubeId);

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
            io.to(cubeId).emit('cubeState', cube);

            console.log(`Cube ${cubeId} clicked. Total clicks: ${cube.clicks}`);
        } catch (error) {
            console.error('Error clicking cube:', error);
            socket.emit('error', { message: 'Failed to process click' });
        }
    });

    // Update cube name
    socket.on('updateCubeName', async ({ cubeId, name }) => {
        try {
            const cube = await Cube.findById(cubeId);

            if (!cube) {
                socket.emit('error', { message: 'Cube not found' });
                return;
            }

            // Check if name feature is unlocked
            if (!cube.unlocked.includes('name')) {
                socket.emit('error', { message: 'Name feature not unlocked yet' });
                return;
            }

            cube.name = name;
            cube.lastInteraction = new Date();
            await cube.save();

            // Broadcast updated state to all users in the room
            io.to(cubeId).emit('cubeState', cube);

            console.log(`Cube ${cubeId} renamed to: ${name}`);
        } catch (error) {
            console.error('Error updating cube name:', error);
            socket.emit('error', { message: 'Failed to update name' });
        }
    });

    // Update cube color
    socket.on('updateCubeColor', async ({ cubeId, color }) => {
        try {
            const cube = await Cube.findById(cubeId);

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
            io.to(cubeId).emit('cubeState', cube);

            console.log(`Cube ${cubeId} color changed to: ${color}`);
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
