// ── In-memory test database ─────────────────────────
// Used exclusively by memoryStore.js when NODE_ENV === 'test'. Production
// traffic goes through mysqlStore.js + the real MySQL pool in database.js;
// this file is never required by the live server.
//
// The exported arrays are mutable references — memoryStore, the test files,
// and resetData() all manipulate the same arrays in place. resetData()
// truncates each array (preserving the reference) and re-seeds with the
// fixtures below, so every `beforeEach` test gets a clean baseline without
// breaking imports that have already cached the array.

const bcrypt = require('bcryptjs');

// Pre-hash the seed passwords once at module load. We use bcryptjs so the
// hashes match what auth.js produces in production via bcrypt.compare.
const SALT_ROUNDS = 10;
const STUDENT_PASSWORD_HASH = bcrypt.hashSync('password123', SALT_ROUNDS);
const ADMIN_PASSWORD_HASH = bcrypt.hashSync('admin123', SALT_ROUNDS);
const TUTOR_PASSWORD_HASH = bcrypt.hashSync('tutor123', SALT_ROUNDS);

const SEED_DATE = '2024-01-01';

function seedUsers() {
    return [
        { id: 'u1', name: 'Jordan Rivera', email: 'jordan@university.edu', password: STUDENT_PASSWORD_HASH, role: 'student', createdAt: SEED_DATE },
        { id: 'u2', name: 'Alex Chen',     email: 'alex@university.edu',   password: STUDENT_PASSWORD_HASH, role: 'student', createdAt: SEED_DATE },
        { id: 'u3', name: 'Sam Patel',     email: 'sam@university.edu',    password: STUDENT_PASSWORD_HASH, role: 'student', createdAt: SEED_DATE },
        { id: 't1', name: 'Taylor Brooks', email: 'tutor@university.edu',  password: TUTOR_PASSWORD_HASH, role: 'tutor',   createdAt: SEED_DATE },
        { id: 'a1', name: 'Dr. Emily Watson', email: 'admin@university.edu', password: ADMIN_PASSWORD_HASH, role: 'admin',   createdAt: SEED_DATE },
    ];
}

function seedServices() {
    return [
        {
            id: 's1',
            name: 'Calculus Help',
            description: 'Calculus I, II, III — limits, derivatives, integrals, series.',
            expectedDuration: 25,
            priorityLevel: 'high',
            isOpen: true,
            icon: '📐',
            category: 'Mathematics',
        },
        {
            id: 's2',
            name: 'CS Tutoring',
            description: 'Intro CS courses: Python, Java, data structures, algorithms.',
            expectedDuration: 30,
            priorityLevel: 'high',
            isOpen: true,
            icon: '💻',
            category: 'Computer Science',
        },
        {
            id: 's3',
            name: 'Writing Center',
            description: 'Essay review, thesis development, grammar & citation help.',
            expectedDuration: 20,
            priorityLevel: 'medium',
            isOpen: true,
            icon: '✍️',
            category: 'Writing',
        },
    ];
}

const users = [];
const services = [];
const queueEntries = [];
const history = [];
const notifications = [];

function resetData() {
    users.length = 0;
    services.length = 0;
    queueEntries.length = 0;
    history.length = 0;
    notifications.length = 0;
    seedUsers().forEach(u => users.push(u));
    seedServices().forEach(s => services.push(s));
}

resetData();

module.exports = {
    users,
    services,
    queueEntries,
    history,
    notifications,
    resetData,
};
