const express = require('express');
const router = express.Router();
const { history } = require('../data/db');

// GET /api/history — get history (optionally filter by userId)
router.get('/', (req, res) => {
    const { userId } = req.query;
    if (userId) {
        return res.json(history.filter(h => h.userId === userId));
    }
    res.json(history);
});

// GET /api/history/:id — get a single history entry
router.get('/:id', (req, res) => {
    const entry = history.find(h => h.id === req.params.id);
    if (!entry) {
        return res.status(404).json({ message: 'History entry not found' });
    }
    res.json(entry);
});

module.exports = router;
