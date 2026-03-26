const express = require('express');
const router = express.Router();
const { notifications } = require('../data/db');

// GET /api/notifications — get notifications (optionally filter by userId)
router.get('/', (req, res) => {
    const { userId } = req.query;
    if (userId) {
        return res.json(notifications.filter(n => n.userId === userId));
    }
    res.json(notifications);
});

// PUT /api/notifications/:id/read — mark a notification as read
router.put('/:id/read', (req, res) => {
    const notif = notifications.find(n => n.id === req.params.id);
    if (!notif) {
        return res.status(404).json({ message: 'Notification not found' });
    }
    notif.read = true;
    res.json(notif);
});

// PUT /api/notifications/read-all — mark all notifications as read for a user
router.put('/read-all/:userId', (req, res) => {
    const { userId } = req.params;
    let count = 0;
    notifications.forEach(n => {
        if (n.userId === userId && !n.read) {
            n.read = true;
            count++;
        }
    });
    res.json({ message: `Marked ${count} notifications as read` });
});

module.exports = router;
