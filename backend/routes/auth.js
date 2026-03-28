const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { users } = require('../data/db');

// POST /api/auth/register
router.post('/register', async (req, res) => {
    const { name, email, password, role } = req.body;

    // ── Validate required fields ────────────────────
    const errors = [];
    if (!name || typeof name !== 'string' || !name.trim()) {
        errors.push({ field: 'name', message: 'Name is required' });
    } else if (name.trim().length < 2 || name.trim().length > 100) {
        errors.push({ field: 'name', message: 'Name must be between 2 and 100 characters' });
    }

    if (!email || typeof email !== 'string' || !email.trim()) {
        errors.push({ field: 'email', message: 'Email is required' });
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.push({ field: 'email', message: 'Enter a valid email address' });
    }

    if (!password || typeof password !== 'string') {
        errors.push({ field: 'password', message: 'Password is required' });
    } else if (password.length < 6) {
        errors.push({ field: 'password', message: 'Password must be at least 6 characters' });
    } else if (password.length > 128) {
        errors.push({ field: 'password', message: 'Password cannot exceed 128 characters' });
    }

    if (!role || typeof role !== 'string') {
        errors.push({ field: 'role', message: 'Role is required' });
    } else if (!['student', 'admin'].includes(role)) {
        errors.push({ field: 'role', message: 'Role must be student or admin' });
    }

    if (errors.length > 0) {
        return res.status(400).json({ message: 'Validation failed', errors });
    }

    // ── Check duplicate ─────────────────────────────
    const exists = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (exists) {
        return res.status(400).json({ message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
        id: `u${Date.now()}`,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: hashedPassword,
        role,
        createdAt: new Date().toISOString().split('T')[0],
    };
    users.push(newUser);

    // Return without password
    const { password: _, ...safeUser } = newUser;
    res.status(201).json({ message: 'User registered', user: safeUser });
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    // ── Validate ────────────────────────────────────
    const errors = [];
    if (!email || typeof email !== 'string' || !email.trim()) {
        errors.push({ field: 'email', message: 'Email is required' });
    }
    if (!password || typeof password !== 'string') {
        errors.push({ field: 'password', message: 'Password is required' });
    }
    if (errors.length > 0) {
        return res.status(400).json({ message: 'Validation failed', errors });
    }

    // ── Find user by email, then compare hashed password ──
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
        return res.status(401).json({ message: 'Invalid email or password' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
        return res.status(401).json({ message: 'Invalid email or password' });
    }

    const { password: _, ...safeUser } = user;
    res.json({ message: 'Login successful', user: safeUser });
});

module.exports = router;