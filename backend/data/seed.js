// ── Seed Script ─────────────────────────────────────
// Inserts initial data into the MySQL database.
// Run: node data/seed.js
//
// Requires: .env configured with valid DB credentials
//           schema.sql (including queues table) already run

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const bcrypt = require('bcryptjs');
const { getPool } = require('./database');

const SALT_ROUNDS = 10;

async function seed() {
    const pool = getPool();
    console.log('Seeding database...');

    // ── Users ────────────────────────────────────────
    const studentPw = await bcrypt.hash('password123', SALT_ROUNDS);
    const adminPw = await bcrypt.hash('admin123', SALT_ROUNDS);

    const users = [
        ['u1', 'Jordan Rivera', 'jordan@university.edu', studentPw, 'student'],
        ['u2', 'Alex Chen', 'alex@university.edu', studentPw, 'student'],
        ['u3', 'Sam Patel', 'sam@university.edu', studentPw, 'student'],
        ['u4', 'Morgan Lee', 'morgan@university.edu', studentPw, 'student'],
        ['a1', 'Dr. Emily Watson', 'admin@university.edu', adminPw, 'admin'],
        ['a2', 'Prof. Marcus Johnson', 'marcus@university.edu', adminPw, 'admin'],
    ];

    for (const [publicId, name, email, password, role] of users) {
        await pool.execute(
            `INSERT IGNORE INTO users (public_id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)`,
            [publicId, name, email, password, role]
        );
    }
    console.log(`  ✓ ${users.length} users`);

    // ── Services ─────────────────────────────────────
    const services = [
        ['s1', 'Calculus Help', 'Get assistance with Calculus I, II, and III including limits, derivatives, integrals, and series.', 25, 'high', 1, '📐', 'Mathematics'],
        ['s2', 'CS Tutoring', 'Programming help for intro CS courses. Covers Python, Java, data structures, and algorithms.', 30, 'high', 1, '💻', 'Computer Science'],
        ['s3', 'Writing Center', 'Essay review, thesis development, grammar & citation help for all subjects.', 20, 'medium', 1, '✍️', 'Writing'],
        ['s4', 'Physics Lab Prep', 'Guidance for physics lab reports, experiment setup, and data analysis.', 35, 'medium', 1, '⚛️', 'Sciences'],
        ['s5', 'Statistics Workshop', 'Help with probability, hypothesis testing, regression, and statistical software (R, SPSS).', 30, 'low', 0, '📊', 'Mathematics'],
        ['s6', 'Chemistry Review', 'General and organic chemistry tutoring, reaction balancing, and exam prep.', 25, 'medium', 1, '🧪', 'Sciences'],
    ];

    for (const [publicId, name, desc, duration, priority, isOpen, icon, category] of services) {
        await pool.execute(
            `INSERT IGNORE INTO services (public_id, name, description, expected_duration, priority_level, is_open, icon, category)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [publicId, name, desc, duration, priority, isOpen, icon, category]
        );
    }
    console.log(`  ✓ ${services.length} services`);

    // ── Queues (one per service) ─────────────────────
    const [serviceRows] = await pool.execute('SELECT id, public_id, is_open FROM services');
    for (const row of serviceRows) {
        const exists = await pool.execute('SELECT id FROM queues WHERE service_id = ?', [row.id]);
        if (exists[0].length === 0) {
            await pool.execute(
                'INSERT INTO queues (public_id, service_id, status) VALUES (?, ?, ?)',
                [`queue_${row.public_id}`, row.id, row.is_open ? 'open' : 'closed']
            );
        }
    }
    console.log(`  ✓ Queues created for each service`);

    console.log('\nSeed complete!');
    process.exit(0);
}

seed().catch(err => {
    console.error('Seed failed:', err);
    process.exit(1);
});
