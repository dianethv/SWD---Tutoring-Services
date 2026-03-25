const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();

// Sample queue data (In-memory)
let queue = [
    { id: 1, userId: 1, serviceId: 101, joinedAt: new Date() },
    { id: 2, userId: 2, serviceId: 102, joinedAt: new Date() },
    { id: 3, userId: 3, serviceId: 101, joinedAt: new Date() }
];

// Function to send notifications
function sendNotification(message) {
    console.log("NOTIFICATION:", message); // In a real system, this would trigger an actual notification
}

// Join queue with validation
router.post('/join', [
    // Validate userId and serviceId
    body('userId').isInt().withMessage('userId must be an integer'),
    body('serviceId').isInt().withMessage('serviceId must be an integer')
], (req, res) => {
    // Check validation result
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });  // Return validation errors
    }

    const { userId, serviceId } = req.body;

    // Check if userId and serviceId are provided
    if (!userId || !serviceId) {
        return res.status(400).json({ message: 'Missing fields' });
    }

    const newEntry = {
        id: queue.length + 1,  // New entry ID
        userId,
        serviceId,
        joinedAt: new Date()  // Timestamp when user joins
    };

    // Log the queue before and after the push
    console.log('Before pushing new entry, queue:', queue);
    queue.push(newEntry);
    console.log('After pushing new entry, queue:', queue);

    // Notify the user that they have joined the queue
    sendNotification(`User ${userId} has joined the queue.`);

    res.status(201).json(newEntry);  // Respond with the newly added entry
});

// Leave queue
router.post('/leave', (req, res) => {
    const { userId } = req.body;

    const index = queue.findIndex(q => q.userId === userId);
    if (index === -1) return res.status(404).json({ message: 'Not in queue' });

    queue.splice(index, 1);  // Remove the user from the queue
    res.json({ message: 'Left queue' });
});

// View queue
router.get('/', (req, res) => {
    res.json(queue);  // Return the queue
});

// Notify when the user is close to being served
router.get('/notify-close/:userId', (req, res) => {
    const { userId } = req.params;

    const position = queue.findIndex(q => q.userId === userId);
    if (position === -1) {
        return res.status(404).json({ message: 'User not in queue' });
    }

    if (position <= 2) {  // Check if the user is in the top 2 of the queue
        sendNotification(`User ${userId} is close to being served!`);
    }

    res.json({ message: 'Check complete. Notifications sent if applicable.' });
});

module.exports = router;  // Export the queue router