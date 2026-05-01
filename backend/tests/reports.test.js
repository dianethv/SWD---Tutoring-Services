process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../server');
const store = require('../data/store');
const { history } = require('../data/db');
const assert = require('assert');

describe('Reports Module', () => {
    beforeEach(() => {
        store.resetData();
    });

    // ── GET /api/reports/users ──────────────────────────
    describe('GET /api/reports/users', () => {
        it('should return all users with empty history when no activity', async () => {
            const res = await request(app).get('/api/reports/users');
            assert.strictEqual(res.status, 200);
            assert.ok(Array.isArray(res.body));
            assert.strictEqual(res.body.length, 4); // 3 students + 1 admin from seed
            const user = res.body.find(u => u.email === 'jordan@university.edu');
            assert.ok(user);
            assert.strictEqual(user.totalVisits, 0);
            assert.strictEqual(user.timesServed, 0);
            assert.strictEqual(user.timesCancelled, 0);
            assert.strictEqual(user.timesNoShow, 0);
            assert.strictEqual(user.avgWaitTime, 0);
            assert.ok(Array.isArray(user.history));
            assert.strictEqual(user.history.length, 0);
        });

        it('should include user fields: id, name, email, role, createdAt', async () => {
            const res = await request(app).get('/api/reports/users');
            const user = res.body[0];
            assert.ok(user.id);
            assert.ok(user.name);
            assert.ok(user.email);
            assert.ok(user.role);
            assert.ok(user.createdAt !== undefined);
        });

        it('should reflect served history in user stats', async () => {
            // Create some queue activity
            await request(app).post('/api/queue/join').send({ userId: 'u1', serviceId: 's1' });
            await request(app).post('/api/queue/serve/s1');

            const res = await request(app).get('/api/reports/users');
            const user = res.body.find(u => u.id === 'u1');
            assert.strictEqual(user.totalVisits, 1);
            assert.strictEqual(user.timesServed, 1);
            assert.strictEqual(user.timesCancelled, 0);
        });

        it('should reflect cancelled history in user stats', async () => {
            const joinRes = await request(app).post('/api/queue/join').send({ userId: 'u1', serviceId: 's1' });
            await request(app).post(`/api/queue/leave/${joinRes.body.id}`);

            const res = await request(app).get('/api/reports/users');
            const user = res.body.find(u => u.id === 'u1');
            assert.strictEqual(user.totalVisits, 1);
            assert.strictEqual(user.timesCancelled, 1);
            assert.strictEqual(user.timesServed, 0);
        });

        it('should reflect no-show history in user stats', async () => {
            const joinRes = await request(app).post('/api/queue/join').send({ userId: 'u1', serviceId: 's1' });
            await request(app).post(`/api/queue/no-show/${joinRes.body.id}`);

            const res = await request(app).get('/api/reports/users');
            const user = res.body.find(u => u.id === 'u1');
            assert.strictEqual(user.timesNoShow, 1);
        });

        it('should calculate average wait time from served entries', async () => {
            // Manually push history with known wait times
            history.push(
                { id: 'h_t1', userId: 'u1', serviceId: 's1', serviceName: 'Calculus Help', date: '2024-01-01', joinedAt: '10:00 AM', servedAt: '10:10 AM', waitTime: 10, outcome: 'served' },
                { id: 'h_t2', userId: 'u1', serviceId: 's1', serviceName: 'Calculus Help', date: '2024-01-02', joinedAt: '11:00 AM', servedAt: '11:20 AM', waitTime: 20, outcome: 'served' }
            );

            const res = await request(app).get('/api/reports/users');
            const user = res.body.find(u => u.id === 'u1');
            assert.strictEqual(user.avgWaitTime, 15); // (10+20)/2 = 15
            assert.strictEqual(user.timesServed, 2);
        });

        it('should round average wait time to a whole-minute integer', async () => {
            history.push(
                { id: 'h_t3', userId: 'u1', serviceId: 's1', serviceName: 'Calculus Help', date: '2024-01-03', joinedAt: '09:00 AM', servedAt: '09:12 AM', waitTime: 12.2, outcome: 'served' },
                { id: 'h_t4', userId: 'u1', serviceId: 's1', serviceName: 'Calculus Help', date: '2024-01-04', joinedAt: '10:00 AM', servedAt: '10:17 AM', waitTime: '16.6', outcome: 'served' }
            );

            const res = await request(app).get('/api/reports/users');
            const user = res.body.find(u => u.id === 'u1');
            assert.strictEqual(user.avgWaitTime, 14);
            assert.strictEqual(Number.isInteger(user.avgWaitTime), true);
        });

        it('should handle multiple users with different activity levels', async () => {
            await request(app).post('/api/queue/join').send({ userId: 'u1', serviceId: 's1' });
            await request(app).post('/api/queue/join').send({ userId: 'u2', serviceId: 's2' });
            await request(app).post('/api/queue/serve/s1');
            await request(app).post('/api/queue/serve/s2');

            const res = await request(app).get('/api/reports/users');
            const u1 = res.body.find(u => u.id === 'u1');
            const u2 = res.body.find(u => u.id === 'u2');
            assert.strictEqual(u1.timesServed, 1);
            assert.strictEqual(u2.timesServed, 1);
        });
    });

    // ── GET /api/reports/services ───────────────────────
    describe('GET /api/reports/services', () => {
        it('should return all services with zero activity when clean', async () => {
            const res = await request(app).get('/api/reports/services');
            assert.strictEqual(res.status, 200);
            assert.ok(Array.isArray(res.body));
            assert.strictEqual(res.body.length, 3); // 3 seeded services

            const s1 = res.body.find(s => s.id === 's1');
            assert.ok(s1);
            assert.strictEqual(s1.totalServed, 0);
            assert.strictEqual(s1.totalCancelled, 0);
            assert.strictEqual(s1.totalNoShows, 0);
            assert.strictEqual(s1.totalActivity, 0);
            assert.strictEqual(s1.avgWaitTime, 0);
            assert.strictEqual(s1.currentInQueue, 0);
        });

        it('should include service metadata fields', async () => {
            const res = await request(app).get('/api/reports/services');
            const s = res.body[0];
            assert.ok(s.id);
            assert.ok(s.name);
            assert.ok(s.description);
            assert.ok(s.category);
            assert.ok(s.icon);
            assert.ok(s.expectedDuration !== undefined);
            assert.ok(s.isOpen !== undefined);
        });

        it('should count served entries per service', async () => {
            await request(app).post('/api/queue/join').send({ userId: 'u1', serviceId: 's1' });
            await request(app).post('/api/queue/join').send({ userId: 'u2', serviceId: 's1' });
            await request(app).post('/api/queue/serve/s1');

            const res = await request(app).get('/api/reports/services');
            const s1 = res.body.find(s => s.id === 's1');
            assert.strictEqual(s1.totalServed, 1);
            assert.strictEqual(s1.currentInQueue, 1); // u2 still waiting
        });

        it('should count no-shows and cancellations per service', async () => {
            const j1 = await request(app).post('/api/queue/join').send({ userId: 'u1', serviceId: 's1' });
            const j2 = await request(app).post('/api/queue/join').send({ userId: 'u2', serviceId: 's1' });
            await request(app).post(`/api/queue/no-show/${j1.body.id}`);
            await request(app).post(`/api/queue/leave/${j2.body.id}`);

            const res = await request(app).get('/api/reports/services');
            const s1 = res.body.find(s => s.id === 's1');
            assert.strictEqual(s1.totalNoShows, 1);
            assert.strictEqual(s1.totalCancelled, 1);
            assert.strictEqual(s1.totalActivity, 2);
        });

        it('should calculate average wait time per service', async () => {
            history.push(
                { id: 'h_s1', userId: 'u1', serviceId: 's1', serviceName: 'Calculus Help', date: '2024-01-01', joinedAt: '10:00 AM', servedAt: '10:30 AM', waitTime: 30, outcome: 'served' },
                { id: 'h_s2', userId: 'u2', serviceId: 's1', serviceName: 'Calculus Help', date: '2024-01-01', joinedAt: '11:00 AM', servedAt: '11:10 AM', waitTime: 10, outcome: 'served' }
            );

            const res = await request(app).get('/api/reports/services');
            const s1 = res.body.find(s => s.id === 's1');
            assert.strictEqual(s1.avgWaitTime, 20); // (30+10)/2 = 20
        });
    });

    // ── GET /api/reports/queue-stats ─────────────────────
    describe('GET /api/reports/queue-stats', () => {
        it('should return aggregate stats with zero activity', async () => {
            const res = await request(app).get('/api/reports/queue-stats');
            assert.strictEqual(res.status, 200);
            assert.strictEqual(res.body.totalUsersServed, 0);
            assert.strictEqual(res.body.totalNoShows, 0);
            assert.strictEqual(res.body.totalCancelled, 0);
            assert.strictEqual(res.body.totalActivity, 0);
            assert.strictEqual(res.body.avgWaitTime, 0);
            assert.strictEqual(res.body.currentlyInQueue, 0);
            assert.strictEqual(res.body.totalUsers, 4);
            assert.strictEqual(res.body.totalServices, 3);
        });

        it('should include serviceBreakdown array', async () => {
            const res = await request(app).get('/api/reports/queue-stats');
            assert.ok(Array.isArray(res.body.serviceBreakdown));
            assert.strictEqual(res.body.serviceBreakdown.length, 3);
            const s1 = res.body.serviceBreakdown.find(sb => sb.serviceId === 's1');
            assert.ok(s1);
            assert.strictEqual(s1.serviceName, 'Calculus Help');
            assert.ok(s1.icon);
            assert.strictEqual(typeof s1.totalServed, 'number');
            assert.strictEqual(typeof s1.totalNoShows, 'number');
            assert.strictEqual(typeof s1.avgWaitTime, 'number');
            assert.strictEqual(typeof s1.currentInQueue, 'number');
        });

        it('should include dailyVolume array', async () => {
            const res = await request(app).get('/api/reports/queue-stats');
            assert.ok(Array.isArray(res.body.dailyVolume));
        });

        it('should reflect served users in stats', async () => {
            await request(app).post('/api/queue/join').send({ userId: 'u1', serviceId: 's1' });
            await request(app).post('/api/queue/serve/s1');

            const res = await request(app).get('/api/reports/queue-stats');
            assert.strictEqual(res.body.totalUsersServed, 1);
            assert.strictEqual(res.body.totalActivity, 1);
        });

        it('should count currently in queue across all services', async () => {
            await request(app).post('/api/queue/join').send({ userId: 'u1', serviceId: 's1' });
            await request(app).post('/api/queue/join').send({ userId: 'u2', serviceId: 's2' });

            const res = await request(app).get('/api/reports/queue-stats');
            assert.strictEqual(res.body.currentlyInQueue, 2);
        });

        it('should calculate aggregate average wait time', async () => {
            history.push(
                { id: 'h_q1', userId: 'u1', serviceId: 's1', serviceName: 'Calculus Help', date: '2024-01-01', joinedAt: '10:00 AM', servedAt: '10:30 AM', waitTime: 30, outcome: 'served' },
                { id: 'h_q2', userId: 'u2', serviceId: 's2', serviceName: 'CS Tutoring', date: '2024-01-01', joinedAt: '11:00 AM', servedAt: '11:50 AM', waitTime: 50, outcome: 'served' }
            );

            const res = await request(app).get('/api/reports/queue-stats');
            assert.strictEqual(res.body.avgWaitTime, 40); // (30+50)/2 = 40
            assert.strictEqual(res.body.totalUsersServed, 2);
        });

        it('should group daily volume by date', async () => {
            history.push(
                { id: 'h_d1', userId: 'u1', serviceId: 's1', serviceName: 'Calc', date: '2024-01-01', joinedAt: '10:00 AM', servedAt: '10:10 AM', waitTime: 10, outcome: 'served' },
                { id: 'h_d2', userId: 'u2', serviceId: 's1', serviceName: 'Calc', date: '2024-01-01', joinedAt: '11:00 AM', servedAt: '11:10 AM', waitTime: 10, outcome: 'served' },
                { id: 'h_d3', userId: 'u3', serviceId: 's1', serviceName: 'Calc', date: '2024-01-02', joinedAt: '10:00 AM', servedAt: '10:10 AM', waitTime: 10, outcome: 'served' }
            );

            const res = await request(app).get('/api/reports/queue-stats');
            assert.strictEqual(res.body.dailyVolume.length, 2);
            const day1 = res.body.dailyVolume.find(d => d.date === '2024-01-01');
            assert.strictEqual(day1.count, 2);
            const day2 = res.body.dailyVolume.find(d => d.date === '2024-01-02');
            assert.strictEqual(day2.count, 1);
        });

        it('should compute per-service breakdown with activity', async () => {
            history.push(
                { id: 'h_b1', userId: 'u1', serviceId: 's1', serviceName: 'Calc', date: '2024-01-01', joinedAt: '10:00 AM', servedAt: '10:20 AM', waitTime: 20, outcome: 'served' },
                { id: 'h_b2', userId: 'u2', serviceId: 's1', serviceName: 'Calc', date: '2024-01-01', joinedAt: '11:00 AM', servedAt: null, waitTime: null, outcome: 'no-show' }
            );

            const res = await request(app).get('/api/reports/queue-stats');
            const s1 = res.body.serviceBreakdown.find(sb => sb.serviceId === 's1');
            assert.strictEqual(s1.totalServed, 1);
            assert.strictEqual(s1.totalNoShows, 1);
            assert.strictEqual(s1.totalActivity, 2);
            assert.strictEqual(s1.avgWaitTime, 20);
        });
    });
});

// ── Users & History route coverage ─────────────────────
describe('Users API', () => {
    beforeEach(() => {
        store.resetData();
    });

    describe('GET /api/users', () => {
        it('should return all users without passwords', async () => {
            const res = await request(app).get('/api/users');
            assert.strictEqual(res.status, 200);
            assert.ok(Array.isArray(res.body));
            assert.strictEqual(res.body.length, 4);
            // Password should be stripped
            res.body.forEach(u => {
                assert.strictEqual(u.password, undefined);
            });
        });
    });

    describe('GET /api/users/:id', () => {
        it('should return a single user without password', async () => {
            const res = await request(app).get('/api/users/u1');
            assert.strictEqual(res.status, 200);
            assert.strictEqual(res.body.name, 'Jordan Rivera');
            assert.strictEqual(res.body.password, undefined);
        });

        it('should return 404 for non-existent user', async () => {
            const res = await request(app).get('/api/users/u999');
            assert.strictEqual(res.status, 404);
            assert.ok(res.body.message.includes('not found'));
        });
    });
});

describe('History API (single entry)', () => {
    beforeEach(() => {
        store.resetData();
    });

    describe('GET /api/history/:id', () => {
        it('should return a single history entry by id', async () => {
            // Create activity to generate history
            await request(app).post('/api/queue/join').send({ userId: 'u1', serviceId: 's1' });
            await request(app).post('/api/queue/serve/s1');

            // Fetch all history to get the ID
            const allRes = await request(app).get('/api/history');
            assert.ok(allRes.body.length > 0);
            const histId = allRes.body[0].id;

            const res = await request(app).get(`/api/history/${histId}`);
            assert.strictEqual(res.status, 200);
            assert.strictEqual(res.body.id, histId);
            assert.strictEqual(res.body.outcome, 'served');
        });

        it('should return 404 for non-existent history entry', async () => {
            const res = await request(app).get('/api/history/h_nonexistent');
            assert.strictEqual(res.status, 404);
            assert.ok(res.body.message.includes('not found'));
        });
    });
});
