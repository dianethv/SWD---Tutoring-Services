const express = require("express");
const cors = require("cors");

const app = express();

app.use(express.json());  // Parse JSON request bodies
app.use(cors());  // Enable CORS for cross-origin requests

// Import queue routes from queue.js
const queueRouter = require('./routes/queue');

// Use queue routes for '/queue' path
app.use('/queue', queueRouter);

// Add the /wait-time/:userId route
app.get('/wait-time/:userId', (req, res) => {
    const { userId } = req.params;

    // In-memory queue data (for consistency with your other routes)
    const queue = [
        { id: 1, userId: 1, serviceId: 101, joinedAt: new Date() },
        { id: 2, userId: 2, serviceId: 102, joinedAt: new Date() },
        { id: 3, userId: 3, serviceId: 101, joinedAt: new Date() },
        { id: 4, userId: 4, serviceId: 103, joinedAt: new Date() }
    ];

    // Find the position of the user in the queue
    const position = queue.findIndex(q => q.userId == userId);

    if (position === -1) {
        return res.status(404).json({ message: 'User not found in queue' });
    }

    const avgTimePerUser = 5;  // Let's assume it takes 5 minutes for each user to be served
    const waitTime = position * avgTimePerUser;  // Simple wait-time estimation

    // Return the position and estimated wait time
    res.json({ position, estimatedWaitTime: waitTime });
});

// Root endpoint
app.get("/", (req, res) => {
    res.send("Backend is running");
});

// Start the server
app.listen(5000, () => {
    console.log("Server running on http://localhost:5000");
});