const express = require('express');
const router = express.Router();
const store = require('../data/store');

// GET /api/history — get history (optionally filter by userId)
router.get('/', async (req, res) => {
    const { userId } = req.query;
    const items = await store.listHistory(userId || null);
    res.json(items);
});

// GET /api/history/:id — get a single history entry
router.get('/:id', async (req, res) => {
    const entry = await store.findHistoryById(req.params.id);
    if (!entry) {
        return res.status(404).json({ message: 'History entry not found' });
    }
    res.json(entry);
});

module.exports = router;
