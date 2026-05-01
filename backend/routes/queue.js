const express = require('express');
const router = express.Router();
const store = require('../data/store');

// ── Smart Wait-Time Estimator ───────────────────────
// The static formula (position - 1) × expectedDuration treats every service as
// running exactly on schedule. In reality some services run long, some short.
// We blend the static estimate with a "drift-corrected" slot time pulled from
// the most recent served history rows.
//
// driftFactor = avgHistoricalWait / (assumedAvgPositionsWaited × expectedDuration)
//   - assumedAvgPositionsWaited = 2  (an average past student waited from
//     about the middle of a typical small queue)
//   - clamped to [0.5, 2.0] so a single outlier can't blow up the estimate
//   - requires ≥ MIN_SAMPLE_FOR_BLEND served rows; below that we fall back
//     to the static formula (cold start)
const MIN_SAMPLE_FOR_BLEND = 5;
const ASSUMED_AVG_POSITIONS_WAITED = 2;
const DRIFT_LOWER_BOUND = 0.5;
const DRIFT_UPPER_BOUND = 2.0;
const HISTORY_SAMPLE_LIMIT = 20;
// An alternate service is only suggested when its smart estimate is at most
// this fraction of the target service's smart estimate AND saves the user a
// meaningful amount of time.
const RECOMMEND_RATIO_THRESHOLD = 0.5;
const RECOMMEND_MIN_MINUTES_SAVED = 10;

function calculateSmartEstimate({ position, expectedDuration, avgHistoricalWait, sampleSize }) {
    const staticEstimate = Math.max(0, (position - 1) * expectedDuration);

    // Note: avgHistoricalWait can legitimately be 0 (every served session was
    // near-instant). That's real data and should still flow through the blend
    // — drift will simply clamp to DRIFT_LOWER_BOUND. Only treat null as
    // "no data" for cold-start fallback.
    if (avgHistoricalWait == null || sampleSize < MIN_SAMPLE_FOR_BLEND) {
        return {
            staticEstimate,
            smartEstimate: staticEstimate,
            basis: 'static',
            driftFactor: null,
        };
    }

    const rawDrift = avgHistoricalWait / (ASSUMED_AVG_POSITIONS_WAITED * expectedDuration);
    const drift = Math.max(DRIFT_LOWER_BOUND, Math.min(DRIFT_UPPER_BOUND, rawDrift));
    const smartSlotTime = expectedDuration * drift;

    return {
        staticEstimate,
        smartEstimate: Math.max(0, Math.round((position - 1) * smartSlotTime)),
        basis: 'blended',
        driftFactor: Number(drift.toFixed(2)),
    };
}

async function buildServiceInsight(service) {
    const [{ avg, sampleSize }, waitingEntries] = await Promise.all([
        store.getAverageWaitForService(service.id, HISTORY_SAMPLE_LIMIT),
        store.listWaitingEntries(service.id),
    ]);
    const newcomerPosition = waitingEntries.length + 1;
    const estimate = calculateSmartEstimate({
        position: newcomerPosition,
        expectedDuration: service.expectedDuration,
        avgHistoricalWait: avg,
        sampleSize,
    });
    return {
        serviceId: service.id,
        serviceName: service.name,
        category: service.category,
        isOpen: service.isOpen,
        expectedDuration: service.expectedDuration,
        waitingCount: waitingEntries.length,
        historicalAvgWait: avg,
        sampleSize,
        currentSmartEstimate: estimate.smartEstimate,
        currentStaticEstimate: estimate.staticEstimate,
        basis: estimate.basis,
        driftFactor: estimate.driftFactor,
    };
}

// GET /api/queue — get all waiting queue entries (optionally filter by serviceId)
router.get('/', async (req, res) => {
    const { serviceId } = req.query;
    const entries = await store.listWaitingEntries(serviceId || null);
    res.json(entries);
});

// GET /api/queue/insights — per-service smart-estimate snapshot
// Returns one row per service with the current waiting count, the historical
// average wait, the smart estimate for a brand-new joiner, and the drift
// factor. Cached on the client to keep render-time wait calcs synchronous.
router.get('/insights', async (req, res) => {
    const services = await store.listServices();
    const insights = await Promise.all(services.map(buildServiceInsight));
    res.json(insights);
});

// GET /api/queue/recommend/:serviceId — same-category alternate suggestion
// Suggests a different open service in the same category whose smart estimate
// is at least RECOMMEND_RATIO_THRESHOLD shorter and saves ≥ RECOMMEND_MIN_MINUTES_SAVED.
router.get('/recommend/:serviceId', async (req, res) => {
    const { serviceId } = req.params;
    const targetService = await store.findServiceById(serviceId);
    if (!targetService) {
        return res.status(404).json({ message: 'Service not found' });
    }

    const allServices = await store.listServices();
    const targetInsight = await buildServiceInsight(targetService);
    const targetEst = targetInsight.currentSmartEstimate;

    // Don't bother recommending alternatives for already-quick services.
    if (targetEst < RECOMMEND_MIN_MINUTES_SAVED * 2) {
        return res.json({
            targetServiceId: serviceId,
            targetSmartEstimate: targetEst,
            recommendation: null,
        });
    }

    const candidates = await Promise.all(
        allServices
            .filter(s => s.id !== serviceId && s.isOpen && s.category === targetService.category)
            .map(buildServiceInsight)
    );

    const better = candidates
        .filter(c => c.currentSmartEstimate <= targetEst * RECOMMEND_RATIO_THRESHOLD)
        .filter(c => targetEst - c.currentSmartEstimate >= RECOMMEND_MIN_MINUTES_SAVED)
        .sort((a, b) => a.currentSmartEstimate - b.currentSmartEstimate)[0] || null;

    res.json({
        targetServiceId: serviceId,
        targetSmartEstimate: targetEst,
        recommendation: better
            ? {
                serviceId: better.serviceId,
                serviceName: better.serviceName,
                category: better.category,
                smartEstimate: better.currentSmartEstimate,
                waitingCount: better.waitingCount,
                minutesSaved: targetEst - better.currentSmartEstimate,
            }
            : null,
    });
});

// GET /api/queue/wait-time/:serviceId/:position — estimate wait time
// Returns both the static formula and the smart blended estimate so the
// client can show both numbers when the smart one is active.
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

    const { avg: avgHistoricalWait, sampleSize } = await store.getAverageWaitForService(
        serviceId,
        HISTORY_SAMPLE_LIMIT
    );
    const estimate = calculateSmartEstimate({
        position: pos,
        expectedDuration: service.expectedDuration,
        avgHistoricalWait,
        sampleSize,
    });

    res.json({
        serviceId,
        position: pos,
        unit: 'minutes',
        // back-compat: existing clients expected a single estimatedWaitTime.
        // Keep it pointed at the static formula so old assertions still pass.
        estimatedWaitTime: estimate.staticEstimate,
        staticEstimate: estimate.staticEstimate,
        smartEstimate: estimate.smartEstimate,
        historicalAvgWait: avgHistoricalWait,
        sampleSize,
        basis: estimate.basis,
        driftFactor: estimate.driftFactor,
    });
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