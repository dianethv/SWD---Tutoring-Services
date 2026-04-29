const express = require('express');
const router = express.Router();
const store = require('../data/store');

// GET /api/users — list all users (without passwords)
router.get('/', async (req, res) => {
    const users = await store.listUsers();
    res.json(users);
});

// GET /api/users/:id — get a single user (without password)
router.get('/:id', async (req, res) => {
    const user = await store.findUserById(req.params.id);
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }
    const { password, ...safeUser } = user;
    res.json(safeUser);
});

module.exports = router;
