const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const users = require('../data/users');  // Ensure the correct path for users.js

router.post('/register', async (req, res) => {
    const { username, email, password, role } = req.body;
    if (!username || !email || !password || !role) {
        return res.status(400).json({ message: 'All fields required' });
    }
    const userExists = users.find(u => u.email === email);
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = { id: users.length + 1, username, email, password: hashedPassword, role };
    users.push(newUser);

    res.status(201).json({ message: 'User registered', user: { id: newUser.id, username, email, role } });
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email);
    if (!user) return res.status(400).json({ message: 'Invalid email or password' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ message: 'Invalid email or password' });

    res.status(200).json({ message: 'Login successful', user: { id: user.id, username: user.username, email, role: user.role } });
});

module.exports = router;