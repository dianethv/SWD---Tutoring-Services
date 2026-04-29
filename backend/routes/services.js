const express = require('express');
const router = express.Router();
const store = require('../data/store');

// GET /api/services — list all services
router.get('/', async (req, res) => {
    const services = await store.listServices();
    res.json(services);
});

// GET /api/services/:id — get a single service
router.get('/:id', async (req, res) => {
    const service = await store.findServiceById(req.params.id);
    if (!service) {
        return res.status(404).json({ message: 'Service not found' });
    }
    res.json(service);
});

// POST /api/services — create a new service
router.post('/', async (req, res) => {
    const { name, description, expectedDuration, priorityLevel, icon, category } = req.body;

    // ── Validate ────────────────────────────────────
    const errors = [];
    if (!name || typeof name !== 'string' || !name.trim()) {
        errors.push({ field: 'name', message: 'Service name is required' });
    } else if (name.trim().length > 100) {
        errors.push({ field: 'name', message: 'Name cannot exceed 100 characters' });
    }

    if (!description || typeof description !== 'string' || !description.trim()) {
        errors.push({ field: 'description', message: 'Description is required' });
    } else if (description.trim().length > 500) {
        errors.push({ field: 'description', message: 'Description cannot exceed 500 characters' });
    }

    if (expectedDuration === undefined || expectedDuration === null || expectedDuration === '') {
        errors.push({ field: 'expectedDuration', message: 'Expected duration is required' });
    } else if (typeof expectedDuration !== 'number' || !Number.isFinite(expectedDuration) || expectedDuration < 1) {
        errors.push({ field: 'expectedDuration', message: 'Duration must be a positive number (minutes)' });
    } else if (expectedDuration > 120) {
        errors.push({ field: 'expectedDuration', message: 'Duration cannot exceed 120 minutes' });
    }

    if (!priorityLevel || typeof priorityLevel !== 'string') {
        errors.push({ field: 'priorityLevel', message: 'Priority level is required' });
    } else if (!['low', 'medium', 'high'].includes(priorityLevel)) {
        errors.push({ field: 'priorityLevel', message: 'Priority must be low, medium, or high' });
    }

    if (errors.length > 0) {
        return res.status(400).json({ message: 'Validation failed', errors });
    }

    const newService = await store.createService({
        name: name.trim(),
        description: description.trim(),
        expectedDuration: Number(expectedDuration),
        priorityLevel,
        icon: icon || '📚',
        category: (category && typeof category === 'string') ? category.trim() : 'General',
    });

    res.status(201).json(newService);
});

// PUT /api/services/:id — update a service
router.put('/:id', async (req, res) => {
    const service = await store.findServiceById(req.params.id);
    if (!service) {
        return res.status(404).json({ message: 'Service not found' });
    }

    const { name, description, expectedDuration, priorityLevel, icon, category, isOpen } = req.body;
    const errors = [];

    if (name !== undefined) {
        if (typeof name !== 'string' || !name.trim()) {
            errors.push({ field: 'name', message: 'Name cannot be empty' });
        } else if (name.trim().length > 100) {
            errors.push({ field: 'name', message: 'Name cannot exceed 100 characters' });
        }
    }

    if (description !== undefined) {
        if (typeof description !== 'string' || !description.trim()) {
            errors.push({ field: 'description', message: 'Description cannot be empty' });
        } else if (description.trim().length > 500) {
            errors.push({ field: 'description', message: 'Description cannot exceed 500 characters' });
        }
    }

    if (expectedDuration !== undefined) {
        if (typeof expectedDuration !== 'number' || !Number.isFinite(expectedDuration) || expectedDuration < 1) {
            errors.push({ field: 'expectedDuration', message: 'Duration must be a positive number' });
        } else if (expectedDuration > 120) {
            errors.push({ field: 'expectedDuration', message: 'Duration cannot exceed 120 minutes' });
        }
    }

    if (priorityLevel !== undefined) {
        if (!['low', 'medium', 'high'].includes(priorityLevel)) {
            errors.push({ field: 'priorityLevel', message: 'Priority must be low, medium, or high' });
        }
    }

    if (errors.length > 0) {
        return res.status(400).json({ message: 'Validation failed', errors });
    }

    // Build updates object
    const updates = {};
    if (name !== undefined) updates.name = name.trim();
    if (description !== undefined) updates.description = description.trim();
    if (expectedDuration !== undefined) updates.expectedDuration = Number(expectedDuration);
    if (priorityLevel !== undefined) updates.priorityLevel = priorityLevel;
    if (icon !== undefined) updates.icon = icon;
    if (category !== undefined) updates.category = category;
    if (isOpen !== undefined) updates.isOpen = Boolean(isOpen);

    const updated = await store.updateService(req.params.id, updates);
    res.json(updated);
});

module.exports = router;
