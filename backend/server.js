require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const express = require("express");
const cors = require("cors");

const app = express();

app.use(express.json());
app.use(cors());

// ── Import Routers ──────────────────────────────────
const authRouter = require('./routes/auth');
const servicesRouter = require('./routes/services');
const queueRouter = require('./routes/queue');
const historyRouter = require('./routes/history');
const notificationsRouter = require('./routes/notifications');
const usersRouter = require('./routes/users');

// ── Mount Routers ───────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api/services', servicesRouter);
app.use('/api/queue', queueRouter);
app.use('/api/history', historyRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/users', usersRouter);

// Root endpoint
app.get("/", (req, res) => {
    res.json({ message: "TutorCoogs Backend is running" });
});

// ── Health check — verify database connectivity ─────
app.get("/api/health", async (req, res) => {
    try {
        const { getPool } = require('./data/database');
        const pool = getPool();
        const [rows] = await pool.execute('SELECT 1 AS ok');
        res.json({
            status: 'ok',
            database: 'connected',
            timestamp: new Date().toISOString(),
        });
    } catch (err) {
        res.status(500).json({
            status: 'error',
            database: 'disconnected',
            error: err.message,
            timestamp: new Date().toISOString(),
        });
    }
});

// Global error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Internal server error' });
});

// Start the server only when run directly (not during tests)
if (require.main === module) {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

module.exports = app;
