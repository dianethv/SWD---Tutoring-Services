const express = require('express');
const router = express.Router();
const store = require('../data/store');

// GET /api/queue — get all waiting queue entries (optionally filter by serviceId)
router.get('/', async (req, res) => {
    const { serviceId } = req.query;
    const entries = await store.listWaitingEntries(serviceId || null);
    res.json(entries);
});

// GET /api/queue/wait-time/:serviceId/:position — estimate wait time
router.get('/wait-time/:serviceId/:position', async (req, res) => {
    const { serviceId, position } = req.params;
    const service = await store.findServiceById(serviceId);
    if (!service) {
        return res.status(404).json({ message: 'Service not found' });
    }
    const pos = parseInt(position, 10);
    if (isNaN(pos) || pos < 1) {
        return res.status(400).json({ message: 'Position must be a positive integer' });
    }
    const estimatedWaitTime = (pos - 1) * service.expectedDuration;
    res.json({ serviceId, position: pos, estimatedWaitTime, unit: 'minutes' });
});

// POST /api/queue/join — user joins a queue
router.post('/join', async (req, res) => {
    const { userId, serviceId, notes, priority } = req.body;

    // ── Validate ────────────────────────────────────
    const errors = [];
    if (!userId || typeof userId !== 'string') {
        errors.push({ field: 'userId', message: 'userId is required' });
    }
    if (!serviceId || typeof serviceId !== 'string') {
        errors.push({ field: 'serviceId', message: 'serviceId is required' });
    }
    if (notes !== undefined && typeof notes !== 'string') {
        errors.push({ field: 'notes', message: 'Notes must be a string' });
    }
    if (notes && notes.length > 500) {
        errors.push({ field: 'notes', message: 'Notes cannot exceed 500 characters' });
    }
    if (priority !== undefined && !['normal', 'high'].includes(priority)) {
        errors.push({ field: 'priority', message: 'Priority must be normal or high' });
    }
    if (errors.length > 0) {
        return res.status(400).json({ message: 'Validation failed', errors });
    }

    // ── Check user exists ───────────────────────────
    const user = await store.findUserById(userId);
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    // ── Check service exists & open ─────────────────
    const service = await store.findServiceById(serviceId);
    if (!service) {
        return res.status(404).json({ message: 'Service not found' });
    }
    if (!service.isOpen) {
        return res.status(400).json({ message: 'Service is currently closed' });
    }

    // ── Check if already in this queue ──────────────
    const alreadyIn = await store.findDuplicateEntry(userId, serviceId);
    if (alreadyIn) {
        return res.status(400).json({ message: 'Already in this queue' });
    }

    // ── Create entry ────────────────────────────────
    const newEntry = await store.createEntry({
        userId,
        serviceId,
        priority: priority || 'normal',
        notes: notes || '',
    });

    // Recalculate positions (handles priority ordering)
    await store.recalcPositions(serviceId);

    // Re-read the position after recalculation
    const updatedEntry = await store.findEntryById(newEntry.id);

    // ── Notification: user joined queue ─────────────
    await store.createNotification({
        userId,
        type: 'queue_update',
        title: 'Joined Queue',
        message: `You joined the queue for ${service.name}. Position: #${updatedEntry.position}`,
    });

    // ── Compute estimated wait ──────────────────────
    const estimatedWait = (updatedEntry.position - 1) * service.expectedDuration;

    res.status(201).json({ ...updatedEntry, estimatedWait });
});

// POST /api/queue/leave/:id — user leaves queue
router.post('/leave/:id', async (req, res) => {
    const entry = await store.findEntryById(req.params.id);
    if (!entry) {
        return res.status(404).json({ message: 'Queue entry not found' });
    }
    if (entry.status !== 'waiting') {
        return res.status(400).json({ message: 'Entry is not in waiting status' });
    }

    await store.updateEntryStatus(entry.id, 'left');

    // Add to history as cancelled
    const service = await store.findServiceById(entry.serviceId);
    await store.createHistory({
        userId: entry.userId,
        serviceId: entry.serviceId,
        serviceName: service?.name || 'Unknown',
        date: new Date().toISOString().split('T')[0],
        joinedAt: new Date(entry.joinedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        servedAt: null,
        waitTime: null,
        outcome: 'cancelled',
    });

    await store.recalcPositions(entry.serviceId);
    res.json({ message: 'Left queue' });
});

// POST /api/queue/serve/:serviceId — admin serves next user
router.post('/serve/:serviceId', async (req, res) => {
    const { serviceId } = req.params;
    const service = await store.findServiceById(serviceId);
    if (!service) {
        return res.status(404).json({ message: 'Service not found' });
    }

    const serviceQueue = await store.listWaitingEntries(serviceId);
    if (serviceQueue.length === 0) {
        return res.status(400).json({ message: 'Queue is empty' });
    }

    const served = serviceQueue[0];
    await store.updateEntryStatus(served.id, 'served');

    // Add to history
    await store.createHistory({
        userId: served.userId,
        serviceId,
        serviceName: service.name,
        date: new Date().toISOString().split('T')[0],
        joinedAt: new Date(served.joinedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        servedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        waitTime: Math.round((Date.now() - new Date(served.joinedAt).getTime()) / 60000),
        outcome: 'served',
    });

    // Recalculate positions
    await store.recalcPositions(serviceId);

    // ── Notification: notify users close to being served ──
    const remaining = await store.listWaitingEntries(serviceId);
    for (const entry of remaining) {
        if (entry.position <= 2) {
            await store.createNotification({
                userId: entry.userId,
                type: 'queue_update',
                title: entry.position === 1 ? "You're Next!" : 'Almost Your Turn!',
                message: `You are #${entry.position} in line for ${service.name}. Please be ready.`,
            });
        }
    }

    res.json({ message: `Served ${served.userId}`, served });
});

// POST /api/queue/no-show/:id — admin marks no-show
router.post('/no-show/:id', async (req, res) => {
    const entry = await store.findEntryById(req.params.id);
    if (!entry) {
        return res.status(404).json({ message: 'Queue entry not found' });
    }
    if (entry.status !== 'waiting') {
        return res.status(400).json({ message: 'Entry is not in waiting status' });
    }

    await store.updateEntryStatus(entry.id, 'no-show');
    const service = await store.findServiceById(entry.serviceId);

    await store.createHistory({
        userId: entry.userId,
        serviceId: entry.serviceId,
        serviceName: service?.name || 'Unknown',
        date: new Date().toISOString().split('T')[0],
        joinedAt: new Date(entry.joinedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        servedAt: null,
        waitTime: null,
        outcome: 'no-show',
    });

    await store.recalcPositions(entry.serviceId);
    res.json({ message: 'Marked as no-show' });
});

// PUT /api/queue/reorder/:id — admin reorders queue entry
router.put('/reorder/:id', async (req, res) => {
    const { direction } = req.body;
    if (!direction || !['up', 'down'].includes(direction)) {
        return res.status(400).json({ message: 'Direction must be up or down' });
    }

    const entry = await store.findEntryById(req.params.id);
    if (!entry || entry.status !== 'waiting') {
        return res.status(404).json({ message: 'Queue entry not found' });
    }

    const serviceQueue = await store.listWaitingEntries(entry.serviceId);
    const idx = serviceQueue.findIndex(q => q.id === entry.id);

    if (direction === 'up' && idx === 0) {
        return res.status(400).json({ message: 'Already at the top of the queue' });
    }
    if (direction === 'down' && idx === serviceQueue.length - 1) {
        return res.status(400).json({ message: 'Already at the bottom of the queue' });
    }

    // Swap positions
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    const ourPos = serviceQueue[idx].position;
    const theirPos = serviceQueue[swapIdx].position;

    await store.updateEntryPosition(serviceQueue[idx].id, theirPos);
    await store.updateEntryPosition(serviceQueue[swapIdx].id, ourPos);

    const updatedQueue = await store.listWaitingEntries(entry.serviceId);
    res.json(updatedQueue);
});

module.exports = router;