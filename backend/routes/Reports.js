const express = require('express');
const router = express.Router();
const store = require('../data/store');

function normalizeWaitMinutes(waitTime) {
    const minutes = Number(waitTime);
    if (!Number.isFinite(minutes) || minutes < 0) {
        return null;
    }
    return minutes;
}

function getAverageWaitMinutes(historyItems) {
    const waitTimes = historyItems
        .map(item => normalizeWaitMinutes(item.waitTime))
        .filter(minutes => minutes != null);

    if (waitTimes.length === 0) {
        return 0;
    }

    const total = waitTimes.reduce((sum, minutes) => sum + minutes, 0);
    return Math.round(total / waitTimes.length);
}

// ── GET /api/reports/users ──────────────────────────
// Returns all users with their full queue participation history.
router.get('/users', async (req, res) => {
    try {
        const users = await store.listUsers();
        const allHistory = await store.listHistory(null);

        const usersWithHistory = users.map(user => {
            const userHistory = allHistory.filter(h => h.userId === user.id);
            const served = userHistory.filter(h => h.outcome === 'served');
            const cancelled = userHistory.filter(h => h.outcome === 'cancelled');
            const noShows = userHistory.filter(h => h.outcome === 'no-show');
            return {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                createdAt: user.createdAt,
                totalVisits: userHistory.length,
                timesServed: served.length,
                timesCancelled: cancelled.length,
                timesNoShow: noShows.length,
                avgWaitTime: getAverageWaitMinutes(served),
                history: userHistory,
            };
        });

        res.json(usersWithHistory);
    } catch (err) {
        console.error('Reports /users error:', err);
        res.status(500).json({ message: 'Failed to generate users report' });
    }
});

// ── GET /api/reports/services ───────────────────────
// Returns all services with queue activity summary.
router.get('/services', async (req, res) => {
    try {
        const services = await store.listServices();
        const allHistory = await store.listHistory(null);
        const allEntries = await store.listWaitingEntries(null);

        const servicesReport = services.map(service => {
            const serviceHistory = allHistory.filter(h => h.serviceId === service.id);
            const served = serviceHistory.filter(h => h.outcome === 'served');
            const cancelled = serviceHistory.filter(h => h.outcome === 'cancelled');
            const noShows = serviceHistory.filter(h => h.outcome === 'no-show');
            const currentInQueue = allEntries.filter(e => e.serviceId === service.id).length;

            return {
                id: service.id,
                name: service.name,
                description: service.description,
                category: service.category,
                icon: service.icon,
                isOpen: service.isOpen,
                expectedDuration: service.expectedDuration,
                totalServed: served.length,
                totalCancelled: cancelled.length,
                totalNoShows: noShows.length,
                totalActivity: serviceHistory.length,
                avgWaitTime: getAverageWaitMinutes(served),
                currentInQueue,
            };
        });

        res.json(servicesReport);
    } catch (err) {
        console.error('Reports /services error:', err);
        res.status(500).json({ message: 'Failed to generate services report' });
    }
});

// ── GET /api/reports/queue-stats ─────────────────────
// Returns aggregate queue usage statistics.
router.get('/queue-stats', async (req, res) => {
    try {
        const allHistory = await store.listHistory(null);
        const allEntries = await store.listWaitingEntries(null);
        const services = await store.listServices();
        const users = await store.listUsers();

        const served = allHistory.filter(h => h.outcome === 'served');
        const noShows = allHistory.filter(h => h.outcome === 'no-show');
        const cancelled = allHistory.filter(h => h.outcome === 'cancelled');

        // Per-service breakdown
        const serviceBreakdown = services.map(service => {
            const sHistory = allHistory.filter(h => h.serviceId === service.id);
            const sServed = sHistory.filter(h => h.outcome === 'served');
            const sNoShows = sHistory.filter(h => h.outcome === 'no-show');
            const currentInQueue = allEntries.filter(e => e.serviceId === service.id).length;

            return {
                serviceId: service.id,
                serviceName: service.name,
                icon: service.icon,
                totalServed: sServed.length,
                totalNoShows: sNoShows.length,
                totalActivity: sHistory.length,
                avgWaitTime: getAverageWaitMinutes(sServed),
                currentInQueue,
            };
        });

        // Daily volume (group history by date)
        const dailyMap = {};
        allHistory.forEach(h => {
            const date = h.date || 'unknown';
            dailyMap[date] = (dailyMap[date] || 0) + 1;
        });
        const dailyVolume = Object.entries(dailyMap)
            .map(([date, count]) => ({ date, count }))
            .sort((a, b) => a.date.localeCompare(b.date));

        res.json({
            totalUsersServed: served.length,
            totalNoShows: noShows.length,
            totalCancelled: cancelled.length,
            totalActivity: allHistory.length,
            avgWaitTime: getAverageWaitMinutes(served),
            currentlyInQueue: allEntries.length,
            totalUsers: users.length,
            totalServices: services.length,
            serviceBreakdown,
            dailyVolume,
        });
    } catch (err) {
        console.error('Reports /queue-stats error:', err);
        res.status(500).json({ message: 'Failed to generate queue stats report' });
    }
});

module.exports = router;
