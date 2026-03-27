const express = require('express');
const router = express.Router();
const { users } = require('../data/db');

// GET /api/users — list all users (without passwords)
router.get('/', (req, res) => {
    const safeUsers = users.map(({ password, ...u }) => u);
    res.json(safeUsers);
});

// GET /api/users/:id — get a single user (without password)
router.get('/:id', (req, res) => {
    const user = users.find(u => u.id === req.params.id);
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }
    const { password, ...safeUser } = user;
    res.json(safeUser);
});

module.exports = router;
