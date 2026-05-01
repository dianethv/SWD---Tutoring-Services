const express = require('express');
const router = express.Router();
const store = require('../data/store');

// GET /api/notifications — get notifications (optionally filter by userId)
router.get('/', async (req, res) => {
    const { userId } = req.query;
    const items = await store.listNotifications(userId || null);
    res.json(items);
});

// PUT /api/notifications/:id/read — mark a notification as read
router.put('/:id/read', async (req, res) => {
    const notif = await store.markNotificationRead(req.params.id);
    if (!notif) {
        return res.status(404).json({ message: 'Notification not found' });
    }
    res.json(notif);
});

// PUT /api/notifications/read-all/:userId — mark all notifications as read for a user
router.put('/read-all/:userId', async (req, res) => {
    const { userId } = req.params;
    const count = await store.markAllNotificationsRead(userId);
    res.json({ message: `Marked ${count} notifications as read` });
});

// DELETE /api/notifications/clear-all/:userId — delete all notifications for a user
// Note: defined BEFORE /:id so the literal "clear-all" segment never collides
// with an actual notification public_id.
router.delete('/clear-all/:userId', async (req, res) => {
    const { userId } = req.params;
    const count = await store.deleteAllNotifications(userId);
    res.json({ message: `Cleared ${count} notifications` });
});

// DELETE /api/notifications/:id — dismiss a single notification
router.delete('/:id', async (req, res) => {
    const removed = await store.deleteNotification(req.params.id);
    if (!removed) {
        return res.status(404).json({ message: 'Notification not found' });
    }
    res.json({ message: 'Notification cleared' });
});

module.exports = router;
