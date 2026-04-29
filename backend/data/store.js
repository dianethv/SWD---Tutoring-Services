// ── Store Factory ───────────────────────────────────
// Returns memoryStore for tests, mysqlStore for production.
// Tests set process.env.NODE_ENV = 'test' before requiring this module.

if (process.env.NODE_ENV === 'test') {
    module.exports = require('./memoryStore');
} else {
    module.exports = require('./mysqlStore');
}
