process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../server');
const store = require('../data/store');

// Chai is ESM-only in v6. We'll use Node assert for simplicity.
const assert = require('assert');

describe('Auth Module', () => {
    beforeEach(() => {
        store.resetData();
    });

    // ── Registration ────────────────────────────────
    describe('POST /api/auth/register', () => {
        it('should register a new student successfully', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({ name: 'Test User', email: 'test@uni.edu', password: 'test1234', role: 'student' });
            assert.strictEqual(res.status, 201);
            assert.strictEqual(res.body.user.email, 'test@uni.edu');
            assert.strictEqual(res.body.user.role, 'student');
            assert.strictEqual(res.body.user.password, undefined); // password should not be returned
        });

        it('should reject registration with missing name', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({ email: 'test@uni.edu', password: 'test1234', role: 'student' });
            assert.strictEqual(res.status, 400);
            assert.ok(res.body.errors.some(e => e.field === 'name'));
        });

        it('should reject registration with missing email', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({ name: 'Test', password: 'test1234', role: 'student' });
            assert.strictEqual(res.status, 400);
            assert.ok(res.body.errors.some(e => e.field === 'email'));
        });

        it('should reject registration with invalid email format', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({ name: 'Test', email: 'notanemail', password: 'test1234', role: 'student' });
            assert.strictEqual(res.status, 400);
            assert.ok(res.body.errors.some(e => e.field === 'email'));
        });

        it('should reject registration with short password', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({ name: 'Test', email: 'test@uni.edu', password: '123', role: 'student' });
            assert.strictEqual(res.status, 400);
            assert.ok(res.body.errors.some(e => e.field === 'password'));
        });

        it('should reject registration with missing password', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({ name: 'Test', email: 'test@uni.edu', role: 'student' });
            assert.strictEqual(res.status, 400);
            assert.ok(res.body.errors.some(e => e.field === 'password'));
        });

        it('should reject registration with invalid role', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({ name: 'Test', email: 'test@uni.edu', password: 'test1234', role: 'superadmin' });
            assert.strictEqual(res.status, 400);
            assert.ok(res.body.errors.some(e => e.field === 'role'));
        });

        it('should reject registration with missing role', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({ name: 'Test', email: 'test@uni.edu', password: 'test1234' });
            assert.strictEqual(res.status, 400);
            assert.ok(res.body.errors.some(e => e.field === 'role'));
        });

        it('should reject duplicate email registration', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({ name: 'Dup', email: 'jordan@university.edu', password: 'test1234', role: 'student' });
            assert.strictEqual(res.status, 400);
            assert.ok(res.body.message.includes('already'));
        });

        it('should reject name that exceeds 100 characters', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({ name: 'A'.repeat(101), email: 'long@uni.edu', password: 'test1234', role: 'student' });
            assert.strictEqual(res.status, 400);
            assert.ok(res.body.errors.some(e => e.field === 'name'));
        });
    });

    // ── Login ──────────────────────────────────────
    describe('POST /api/auth/login', () => {
        it('should login with valid credentials', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: 'jordan@university.edu', password: 'password123' });
            assert.strictEqual(res.status, 200);
            assert.strictEqual(res.body.user.email, 'jordan@university.edu');
            assert.strictEqual(res.body.user.role, 'student');
            assert.strictEqual(res.body.user.password, undefined);
        });

        it('should login as admin', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: 'admin@university.edu', password: 'admin123' });
            assert.strictEqual(res.status, 200);
            assert.strictEqual(res.body.user.role, 'admin');
        });

        it('should reject invalid password', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: 'jordan@university.edu', password: 'wrongpassword' });
            assert.strictEqual(res.status, 401);
        });

        it('should reject non-existent email', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: 'nobody@university.edu', password: 'test1234' });
            assert.strictEqual(res.status, 401);
        });

        it('should reject login with missing email', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({ password: 'test1234' });
            assert.strictEqual(res.status, 400);
        });

        it('should reject login with missing password', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: 'jordan@university.edu' });
            assert.strictEqual(res.status, 400);
        });
    });
});
