process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../server');
const store = require('../data/store');
// Keep db.js imports for direct array inspection in tests
const { queueEntries, notifications, history } = require('../data/db');
const assert = require('assert');

describe('Queue Module', () => {
    beforeEach(() => {
        store.resetData();
    });

    // ── Join Queue ──────────────────────────────────
    describe('POST /api/queue/join', () => {
        it('should join a queue successfully', async () => {
            const res = await request(app)
                .post('/api/queue/join')
                .send({ userId: 'u1', serviceId: 's1' });
            assert.strictEqual(res.status, 201);
            assert.strictEqual(res.body.userId, 'u1');
            assert.strictEqual(res.body.serviceId, 's1');
            assert.strictEqual(res.body.status, 'waiting');
            assert.strictEqual(res.body.position, 1);
            assert.ok(res.body.estimatedWait !== undefined);
        });

        it('should assign correct positions to multiple users', async () => {
            await request(app).post('/api/queue/join').send({ userId: 'u1', serviceId: 's1' });
            const res = await request(app).post('/api/queue/join').send({ userId: 'u2', serviceId: 's1' });
            assert.strictEqual(res.status, 201);
            assert.strictEqual(res.body.position, 2);
        });

        it('should generate notification when joining', async () => {
            const beforeCount = notifications.length;
            await request(app).post('/api/queue/join').send({ userId: 'u1', serviceId: 's1' });
            assert.ok(notifications.length > beforeCount);
            assert.strictEqual(notifications[0].userId, 'u1');
            assert.ok(notifications[0].title.includes('Joined'));
        });

        it('should reject joining with missing userId', async () => {
            const res = await request(app)
                .post('/api/queue/join')
                .send({ serviceId: 's1' });
            assert.strictEqual(res.status, 400);
        });

        it('should reject joining with missing serviceId', async () => {
            const res = await request(app)
                .post('/api/queue/join')
                .send({ userId: 'u1' });
            assert.strictEqual(res.status, 400);
        });

        it('should reject joining non-existent service', async () => {
            const res = await request(app)
                .post('/api/queue/join')
                .send({ userId: 'u1', serviceId: 's999' });
            assert.strictEqual(res.status, 404);
        });

        it('should reject joining non-existent user', async () => {
            const res = await request(app)
                .post('/api/queue/join')
                .send({ userId: 'u999', serviceId: 's1' });
            assert.strictEqual(res.status, 404);
        });

        it('should reject duplicate queue join for same service', async () => {
            await request(app).post('/api/queue/join').send({ userId: 'u1', serviceId: 's1' });
            const res = await request(app).post('/api/queue/join').send({ userId: 'u1', serviceId: 's1' });
            assert.strictEqual(res.status, 400);
            assert.ok(res.body.message.includes('Already'));
        });

        it('should allow same user to join different services', async () => {
            await request(app).post('/api/queue/join').send({ userId: 'u1', serviceId: 's1' });
            const res = await request(app).post('/api/queue/join').send({ userId: 'u1', serviceId: 's2' });
            assert.strictEqual(res.status, 201);
        });

        it('should reject notes exceeding 500 characters', async () => {
            const res = await request(app)
                .post('/api/queue/join')
                .send({ userId: 'u1', serviceId: 's1', notes: 'A'.repeat(501) });
            assert.strictEqual(res.status, 400);
        });

        it('should reject invalid priority value', async () => {
            const res = await request(app)
                .post('/api/queue/join')
                .send({ userId: 'u1', serviceId: 's1', priority: 'ultra' });
            assert.strictEqual(res.status, 400);
        });
    });

    // ── Get Queue ───────────────────────────────────
    describe('GET /api/queue', () => {
        it('should return empty queue initially', async () => {
            const res = await request(app).get('/api/queue');
            assert.strictEqual(res.status, 200);
            assert.strictEqual(res.body.length, 0);
        });

        it('should return entries after joining', async () => {
            await request(app).post('/api/queue/join').send({ userId: 'u1', serviceId: 's1' });
            const res = await request(app).get('/api/queue');
            assert.strictEqual(res.body.length, 1);
        });

        it('should filter by serviceId', async () => {
            await request(app).post('/api/queue/join').send({ userId: 'u1', serviceId: 's1' });
            await request(app).post('/api/queue/join').send({ userId: 'u2', serviceId: 's2' });
            const res = await request(app).get('/api/queue?serviceId=s1');
            assert.strictEqual(res.body.length, 1);
            assert.strictEqual(res.body[0].serviceId, 's1');
        });
    });

    // ── Wait Time Estimation ────────────────────────
    describe('GET /api/queue/wait-time/:serviceId/:position', () => {
        it('should calculate wait time correctly', async () => {
            const res = await request(app).get('/api/queue/wait-time/s1/3');
            assert.strictEqual(res.status, 200);
            // position 3 → (3-1) * 25 = 50 minutes
            assert.strictEqual(res.body.estimatedWaitTime, 50);
        });

        it('should return 0 wait for position 1', async () => {
            const res = await request(app).get('/api/queue/wait-time/s1/1');
            assert.strictEqual(res.body.estimatedWaitTime, 0);
        });

        it('should return 404 for non-existent service', async () => {
            const res = await request(app).get('/api/queue/wait-time/s999/1');
            assert.strictEqual(res.status, 404);
        });

        it('should return 400 for invalid position', async () => {
            const res = await request(app).get('/api/queue/wait-time/s1/abc');
            assert.strictEqual(res.status, 400);
        });
    });

    // ── Leave Queue ─────────────────────────────────
    describe('POST /api/queue/leave/:id', () => {
        it('should allow user to leave queue', async () => {
            const joinRes = await request(app).post('/api/queue/join').send({ userId: 'u1', serviceId: 's1' });
            const res = await request(app).post(`/api/queue/leave/${joinRes.body.id}`);
            assert.strictEqual(res.status, 200);

            // Verify history entry was created
            assert.ok(history.length > 0);
            assert.strictEqual(history[0].outcome, 'cancelled');
        });

        it('should return 404 for non-existent entry', async () => {
            const res = await request(app).post('/api/queue/leave/q999');
            assert.strictEqual(res.status, 404);
        });

        it('should recalculate positions after leaving', async () => {
            const j1 = await request(app).post('/api/queue/join').send({ userId: 'u1', serviceId: 's1' });
            await request(app).post('/api/queue/join').send({ userId: 'u2', serviceId: 's1' });
            await request(app).post('/api/queue/leave/' + j1.body.id);

            const queueRes = await request(app).get('/api/queue?serviceId=s1');
            assert.strictEqual(queueRes.body[0].position, 1);
            assert.strictEqual(queueRes.body[0].userId, 'u2');
        });
    });

    // ── Serve Next ──────────────────────────────────
    describe('POST /api/queue/serve/:serviceId', () => {
        it('should serve the first user in queue', async () => {
            await request(app).post('/api/queue/join').send({ userId: 'u1', serviceId: 's1' });
            await request(app).post('/api/queue/join').send({ userId: 'u2', serviceId: 's1' });

            const res = await request(app).post('/api/queue/serve/s1');
            assert.strictEqual(res.status, 200);
            assert.strictEqual(res.body.served.userId, 'u1');

            // Check history was created
            assert.ok(history.some(h => h.userId === 'u1' && h.outcome === 'served'));
        });

        it('should notify next users when someone is served', async () => {
            await request(app).post('/api/queue/join').send({ userId: 'u1', serviceId: 's1' });
            await request(app).post('/api/queue/join').send({ userId: 'u2', serviceId: 's1' });
            await request(app).post('/api/queue/join').send({ userId: 'u3', serviceId: 's1' });

            const beforeNotifs = notifications.length;
            await request(app).post('/api/queue/serve/s1');
            assert.ok(notifications.length > beforeNotifs);
        });

        it('should return 400 when queue is empty', async () => {
            const res = await request(app).post('/api/queue/serve/s1');
            assert.strictEqual(res.status, 400);
        });

        it('should return 404 for non-existent service', async () => {
            const res = await request(app).post('/api/queue/serve/s999');
            assert.strictEqual(res.status, 404);
        });
    });

    // ── No-Show ─────────────────────────────────────
    describe('POST /api/queue/no-show/:id', () => {
        it('should mark a user as no-show', async () => {
            const joinRes = await request(app).post('/api/queue/join').send({ userId: 'u1', serviceId: 's1' });
            const res = await request(app).post(`/api/queue/no-show/${joinRes.body.id}`);
            assert.strictEqual(res.status, 200);
            assert.ok(history.some(h => h.userId === 'u1' && h.outcome === 'no-show'));
        });

        it('should return 404 for non-existent entry', async () => {
            const res = await request(app).post('/api/queue/no-show/q999');
            assert.strictEqual(res.status, 404);
        });
    });

    // ── Reorder Queue ───────────────────────────────
    describe('PUT /api/queue/reorder/:id', () => {
        it('should move an entry down', async () => {
            const j1 = await request(app).post('/api/queue/join').send({ userId: 'u1', serviceId: 's1' });
            await request(app).post('/api/queue/join').send({ userId: 'u2', serviceId: 's1' });

            const res = await request(app)
                .put(`/api/queue/reorder/${j1.body.id}`)
                .send({ direction: 'down' });
            assert.strictEqual(res.status, 200);
            // u2 should now be first
            assert.strictEqual(res.body[0].userId, 'u2');
        });

        it('should reject move up when already at top', async () => {
            const j1 = await request(app).post('/api/queue/join').send({ userId: 'u1', serviceId: 's1' });
            const res = await request(app)
                .put(`/api/queue/reorder/${j1.body.id}`)
                .send({ direction: 'up' });
            assert.strictEqual(res.status, 400);
        });

        it('should reject invalid direction', async () => {
            const j1 = await request(app).post('/api/queue/join').send({ userId: 'u1', serviceId: 's1' });
            const res = await request(app)
                .put(`/api/queue/reorder/${j1.body.id}`)
                .send({ direction: 'sideways' });
            assert.strictEqual(res.status, 400);
        });
    });
});

describe('History Module', () => {
    beforeEach(() => {
        store.resetData();
    });

    it('should return empty history initially', async () => {
        const res = await request(app).get('/api/history');
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.body.length, 0);
    });

    it('should return history after a user is served', async () => {
        await request(app).post('/api/queue/join').send({ userId: 'u1', serviceId: 's1' });
        await request(app).post('/api/queue/serve/s1');

        const res = await request(app).get('/api/history');
        assert.strictEqual(res.body.length, 1);
        assert.strictEqual(res.body[0].outcome, 'served');
    });

    it('should filter history by userId', async () => {
        await request(app).post('/api/queue/join').send({ userId: 'u1', serviceId: 's1' });
        await request(app).post('/api/queue/join').send({ userId: 'u2', serviceId: 's2' });
        await request(app).post('/api/queue/serve/s1');
        await request(app).post('/api/queue/serve/s2');

        const res = await request(app).get('/api/history?userId=u1');
        assert.strictEqual(res.body.length, 1);
        assert.strictEqual(res.body[0].userId, 'u1');
    });
});

describe('Notifications Module', () => {
    beforeEach(() => {
        store.resetData();
    });

    it('should return notifications after joining queue', async () => {
        await request(app).post('/api/queue/join').send({ userId: 'u1', serviceId: 's1' });
        const res = await request(app).get('/api/notifications?userId=u1');
        assert.strictEqual(res.status, 200);
        assert.ok(res.body.length > 0);
    });

    it('should mark notification as read', async () => {
        await request(app).post('/api/queue/join').send({ userId: 'u1', serviceId: 's1' });
        const notifs = await request(app).get('/api/notifications?userId=u1');
        const notifId = notifs.body[0].id;

        const res = await request(app).put(`/api/notifications/${notifId}/read`);
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.body.read, true);
    });

    it('should return 404 for non-existent notification', async () => {
        const res = await request(app).put('/api/notifications/n999/read');
        assert.strictEqual(res.status, 404);
    });

    it('should mark all notifications as read for a user', async () => {
        await request(app).post('/api/queue/join').send({ userId: 'u1', serviceId: 's1' });
        await request(app).post('/api/queue/join').send({ userId: 'u1', serviceId: 's2' });

        const res = await request(app).put('/api/notifications/read-all/u1');
        assert.strictEqual(res.status, 200);

        const notifs = await request(app).get('/api/notifications?userId=u1');
        const unread = notifs.body.filter(n => !n.read);
        assert.strictEqual(unread.length, 0);
    });
});
