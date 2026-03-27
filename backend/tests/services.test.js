const request = require('supertest');
const app = require('../server');
const { resetData } = require('../data/db');
const assert = require('assert');

describe('Services Module', () => {
    beforeEach(() => {
        resetData();
    });

    // ── List services ───────────────────────────────
    describe('GET /api/services', () => {
        it('should return all services', async () => {
            const res = await request(app).get('/api/services');
            assert.strictEqual(res.status, 200);
            assert.ok(Array.isArray(res.body));
            assert.strictEqual(res.body.length, 3); // resetData provides 3
        });
    });

    // ── Get single service ──────────────────────────
    describe('GET /api/services/:id', () => {
        it('should return a single service', async () => {
            const res = await request(app).get('/api/services/s1');
            assert.strictEqual(res.status, 200);
            assert.strictEqual(res.body.name, 'Calculus Help');
        });

        it('should return 404 for non-existent service', async () => {
            const res = await request(app).get('/api/services/s999');
            assert.strictEqual(res.status, 404);
        });
    });

    // ── Create service ──────────────────────────────
    describe('POST /api/services', () => {
        it('should create a new service with valid data', async () => {
            const res = await request(app)
                .post('/api/services')
                .send({
                    name: 'Biology Help',
                    description: 'Help with biology coursework',
                    expectedDuration: 30,
                    priorityLevel: 'medium',
                    icon: '🧬',
                    category: 'Sciences',
                });
            assert.strictEqual(res.status, 201);
            assert.strictEqual(res.body.name, 'Biology Help');
            assert.strictEqual(res.body.isOpen, true);
        });

        it('should reject service with missing name', async () => {
            const res = await request(app)
                .post('/api/services')
                .send({ description: 'Desc', expectedDuration: 30, priorityLevel: 'medium' });
            assert.strictEqual(res.status, 400);
            assert.ok(res.body.errors.some(e => e.field === 'name'));
        });

        it('should reject service with missing description', async () => {
            const res = await request(app)
                .post('/api/services')
                .send({ name: 'Test', expectedDuration: 30, priorityLevel: 'medium' });
            assert.strictEqual(res.status, 400);
            assert.ok(res.body.errors.some(e => e.field === 'description'));
        });

        it('should reject service with missing duration', async () => {
            const res = await request(app)
                .post('/api/services')
                .send({ name: 'Test', description: 'Desc', priorityLevel: 'medium' });
            assert.strictEqual(res.status, 400);
            assert.ok(res.body.errors.some(e => e.field === 'expectedDuration'));
        });

        it('should reject service with duration exceeding 120', async () => {
            const res = await request(app)
                .post('/api/services')
                .send({ name: 'Test', description: 'Desc', expectedDuration: 150, priorityLevel: 'medium' });
            assert.strictEqual(res.status, 400);
            assert.ok(res.body.errors.some(e => e.field === 'expectedDuration'));
        });

        it('should reject service with invalid priority', async () => {
            const res = await request(app)
                .post('/api/services')
                .send({ name: 'Test', description: 'Desc', expectedDuration: 30, priorityLevel: 'urgent' });
            assert.strictEqual(res.status, 400);
            assert.ok(res.body.errors.some(e => e.field === 'priorityLevel'));
        });

        it('should reject service with name exceeding 100 characters', async () => {
            const res = await request(app)
                .post('/api/services')
                .send({ name: 'A'.repeat(101), description: 'Desc', expectedDuration: 30, priorityLevel: 'medium' });
            assert.strictEqual(res.status, 400);
            assert.ok(res.body.errors.some(e => e.field === 'name'));
        });

        it('should reject service with negative duration', async () => {
            const res = await request(app)
                .post('/api/services')
                .send({ name: 'Test', description: 'Desc', expectedDuration: -5, priorityLevel: 'medium' });
            assert.strictEqual(res.status, 400);
        });
    });

    // ── Update service ──────────────────────────────
    describe('PUT /api/services/:id', () => {
        it('should update a service name', async () => {
            const res = await request(app)
                .put('/api/services/s1')
                .send({ name: 'Advanced Calculus' });
            assert.strictEqual(res.status, 200);
            assert.strictEqual(res.body.name, 'Advanced Calculus');
        });

        it('should toggle service open/close', async () => {
            const res = await request(app)
                .put('/api/services/s1')
                .send({ isOpen: false });
            assert.strictEqual(res.status, 200);
            assert.strictEqual(res.body.isOpen, false);
        });

        it('should return 404 for non-existent service', async () => {
            const res = await request(app)
                .put('/api/services/s999')
                .send({ name: 'Nope' });
            assert.strictEqual(res.status, 404);
        });

        it('should reject update with empty name', async () => {
            const res = await request(app)
                .put('/api/services/s1')
                .send({ name: '' });
            assert.strictEqual(res.status, 400);
        });

        it('should reject update with name exceeding 100 chars', async () => {
            const res = await request(app)
                .put('/api/services/s1')
                .send({ name: 'B'.repeat(101) });
            assert.strictEqual(res.status, 400);
        });

        it('should reject update with invalid priority', async () => {
            const res = await request(app)
                .put('/api/services/s1')
                .send({ priorityLevel: 'critical' });
            assert.strictEqual(res.status, 400);
        });
    });
});
