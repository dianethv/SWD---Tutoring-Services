const express = require('express');
const router = express.Router();
const { queueEntries, services, users, history, notifications } = require('../data/db');

// ── Helper: add a notification to the store ─────────
function addNotification(userId, type, title, message) {
    const notif = {
        id: `n${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        userId,
        type,
        title,
        message,
        timestamp: new Date().toISOString(),
        read: false,
    };
    notifications.unshift(notif);
    console.log(`NOTIFICATION [${userId}]: ${title} — ${message}`);
    return notif;
}

// ── Helper: recalculate positions for a service queue ──
function recalcPositions(serviceId) {
    const waiting = queueEntries
        .filter(q => q.serviceId === serviceId && q.status === 'waiting')
        .sort((a, b) => {
            // High priority first, then by joinedAt
            if (a.priority === 'high' && b.priority !== 'high') return -1;
            if (a.priority !== 'high' && b.priority === 'high') return 1;
            return new Date(a.joinedAt) - new Date(b.joinedAt);
        });
    waiting.forEach((entry, i) => {
        entry.position = i + 1;
    });
}

// GET /api/queue — get all waiting queue entries (optionally filter by serviceId)
router.get('/', (req, res) => {
    const { serviceId } = req.query;
    let entries = queueEntries.filter(q => q.status === 'waiting');
    if (serviceId) {
        entries = entries.filter(q => q.serviceId === serviceId);
    }
    entries.sort((a, b) => a.position - b.position);
    res.json(entries);
});

// GET /api/queue/wait-time/:serviceId/:position — estimate wait time
router.get('/wait-time/:serviceId/:position', (req, res) => {
    const { serviceId, position } = req.params;
    const service = services.find(s => s.id === serviceId);
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
router.post('/join', (req, res) => {
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
    const user = users.find(u => u.id === userId);
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    // ── Check service exists & open ─────────────────
    const service = services.find(s => s.id === serviceId);
    if (!service) {
        return res.status(404).json({ message: 'Service not found' });
    }
    if (!service.isOpen) {
        return res.status(400).json({ message: 'Service is currently closed' });
    }

    // ── Check if already in this queue ──────────────
    const alreadyIn = queueEntries.find(
        q => q.userId === userId && q.serviceId === serviceId && q.status === 'waiting'
    );
    if (alreadyIn) {
        return res.status(400).json({ message: 'Already in this queue' });
    }

    // ── Calculate position ──────────────────────────
    const serviceQueue = queueEntries.filter(
        q => q.serviceId === serviceId && q.status === 'waiting'
    );

    const newEntry = {
        id: `q${Date.now()}`,
        userId,
        serviceId,
        joinedAt: new Date().toISOString(),
        status: 'waiting',
        priority: priority || 'normal',
        position: serviceQueue.length + 1,
        notes: notes || '',
    };
    queueEntries.push(newEntry);

    // Recalculate positions (handles priority ordering)
    recalcPositions(serviceId);

    // Re-read the position after recalculation
    const updatedEntry = queueEntries.find(q => q.id === newEntry.id);

    // ── Notification: user joined queue ─────────────
    addNotification(
        userId,
        'queue_update',
        'Joined Queue',
        `You joined the queue for ${service.name}. Position: #${updatedEntry.position}`
    );

    // ── Compute estimated wait ──────────────────────
    const estimatedWait = (updatedEntry.position - 1) * service.expectedDuration;

    res.status(201).json({ ...updatedEntry, estimatedWait });
});

// POST /api/queue/leave/:id — user leaves queue
router.post('/leave/:id', (req, res) => {
    const entry = queueEntries.find(q => q.id === req.params.id);
    if (!entry) {
        return res.status(404).json({ message: 'Queue entry not found' });
    }
    if (entry.status !== 'waiting') {
        return res.status(400).json({ message: 'Entry is not in waiting status' });
    }

    entry.status = 'left';

    // Add to history as cancelled
    const service = services.find(s => s.id === entry.serviceId);
    history.unshift({
        id: `h${Date.now()}`,
        userId: entry.userId,
        serviceId: entry.serviceId,
        serviceName: service?.name || 'Unknown',
        date: new Date().toISOString().split('T')[0],
        joinedAt: new Date(entry.joinedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        servedAt: null,
        waitTime: null,
        outcome: 'cancelled',
    });

    recalcPositions(entry.serviceId);
    res.json({ message: 'Left queue' });
});

// POST /api/queue/serve/:serviceId — admin serves next user
router.post('/serve/:serviceId', (req, res) => {
    const { serviceId } = req.params;
    const service = services.find(s => s.id === serviceId);
    if (!service) {
        return res.status(404).json({ message: 'Service not found' });
    }

    const serviceQueue = queueEntries
        .filter(q => q.serviceId === serviceId && q.status === 'waiting')
        .sort((a, b) => a.position - b.position);

    if (serviceQueue.length === 0) {
        return res.status(400).json({ message: 'Queue is empty' });
    }

    const served = serviceQueue[0];
    served.status = 'served';

    // Add to history
    history.unshift({
        id: `h${Date.now()}`,
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
    recalcPositions(serviceId);

    // ── Notification: notify users close to being served ──
    const remaining = queueEntries
        .filter(q => q.serviceId === serviceId && q.status === 'waiting')
        .sort((a, b) => a.position - b.position);

    remaining.forEach(entry => {
        if (entry.position <= 2) {
            addNotification(
                entry.userId,
                'queue_update',
                entry.position === 1 ? "You're Next!" : 'Almost Your Turn!',
                `You are #${entry.position} in line for ${service.name}. Please be ready.`
            );
        }
    });

    res.json({ message: `Served ${served.userId}`, served });
});

// POST /api/queue/no-show/:id — admin marks no-show
router.post('/no-show/:id', (req, res) => {
    const entry = queueEntries.find(q => q.id === req.params.id);
    if (!entry) {
        return res.status(404).json({ message: 'Queue entry not found' });
    }
    if (entry.status !== 'waiting') {
        return res.status(400).json({ message: 'Entry is not in waiting status' });
    }

    entry.status = 'no-show';
    const service = services.find(s => s.id === entry.serviceId);

    history.unshift({
        id: `h${Date.now()}`,
        userId: entry.userId,
        serviceId: entry.serviceId,
        serviceName: service?.name || 'Unknown',
        date: new Date().toISOString().split('T')[0],
        joinedAt: new Date(entry.joinedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        servedAt: null,
        waitTime: null,
        outcome: 'no-show',
    });

    recalcPositions(entry.serviceId);
    res.json({ message: 'Marked as no-show' });
});

// PUT /api/queue/reorder/:id — admin reorders queue entry
router.put('/reorder/:id', (req, res) => {
    const { direction } = req.body;
    if (!direction || !['up', 'down'].includes(direction)) {
        return res.status(400).json({ message: 'Direction must be up or down' });
    }

    const entry = queueEntries.find(q => q.id === req.params.id && q.status === 'waiting');
    if (!entry) {
        return res.status(404).json({ message: 'Queue entry not found' });
    }

    const serviceQueue = queueEntries
        .filter(q => q.serviceId === entry.serviceId && q.status === 'waiting')
        .sort((a, b) => a.position - b.position);

    const idx = serviceQueue.findIndex(q => q.id === entry.id);
    if (direction === 'up' && idx === 0) {
        return res.status(400).json({ message: 'Already at the top of the queue' });
    }
    if (direction === 'down' && idx === serviceQueue.length - 1) {
        return res.status(400).json({ message: 'Already at the bottom of the queue' });
    }

    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    const tempPos = serviceQueue[idx].position;
    serviceQueue[idx].position = serviceQueue[swapIdx].position;
    serviceQueue[swapIdx].position = tempPos;

    const updatedQueue = queueEntries
        .filter(q => q.serviceId === entry.serviceId && q.status === 'waiting')
        .sort((a, b) => a.position - b.position);

    res.json(updatedQueue);
});

module.exports = router;