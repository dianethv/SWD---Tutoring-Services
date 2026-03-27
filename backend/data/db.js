// ── Shared In-Memory Data Store ─────────────────────
// All route modules import from here so state is consistent.

const bcrypt = require('bcrypt');
const SALT_ROUNDS = 10;

const users = [
    {
        id: 'u1',
        name: 'Jordan Rivera',
        email: 'jordan@university.edu',
        password: bcrypt.hashSync('password123', SALT_ROUNDS),
        role: 'student',
        createdAt: '2025-09-01',
    },
    {
        id: 'u2',
        name: 'Alex Chen',
        email: 'alex@university.edu',
        password: bcrypt.hashSync('password123', SALT_ROUNDS),
        role: 'student',
        createdAt: '2025-09-15',
    },
    {
        id: 'u3',
        name: 'Sam Patel',
        email: 'sam@university.edu',
        password: bcrypt.hashSync('password123', SALT_ROUNDS),
        role: 'student',
        createdAt: '2025-10-02',
    },
    {
        id: 'u4',
        name: 'Morgan Lee',
        email: 'morgan@university.edu',
        password: bcrypt.hashSync('password123', SALT_ROUNDS),
        role: 'student',
        createdAt: '2025-10-10',
    },
    {
        id: 'a1',
        name: 'Dr. Emily Watson',
        email: 'admin@university.edu',
        password: bcrypt.hashSync('admin123', SALT_ROUNDS),
        role: 'admin',
        createdAt: '2025-08-01',
    },
    {
        id: 'a2',
        name: 'Prof. Marcus Johnson',
        email: 'marcus@university.edu',
        password: bcrypt.hashSync('admin123', SALT_ROUNDS),
        role: 'admin',
        createdAt: '2025-08-15',
    },
];

const services = [
    {
        id: 's1',
        name: 'Calculus Help',
        description: 'Get assistance with Calculus I, II, and III including limits, derivatives, integrals, and series.',
        expectedDuration: 25,
        priorityLevel: 'high',
        isOpen: true,
        icon: '📐',
        category: 'Mathematics',
    },
    {
        id: 's2',
        name: 'CS Tutoring',
        description: 'Programming help for intro CS courses. Covers Python, Java, data structures, and algorithms.',
        expectedDuration: 30,
        priorityLevel: 'high',
        isOpen: true,
        icon: '💻',
        category: 'Computer Science',
    },
    {
        id: 's3',
        name: 'Writing Center',
        description: 'Essay review, thesis development, grammar & citation help for all subjects.',
        expectedDuration: 20,
        priorityLevel: 'medium',
        isOpen: true,
        icon: '✍️',
        category: 'Writing',
    },
    {
        id: 's4',
        name: 'Physics Lab Prep',
        description: 'Guidance for physics lab reports, experiment setup, and data analysis.',
        expectedDuration: 35,
        priorityLevel: 'medium',
        isOpen: true,
        icon: '⚛️',
        category: 'Sciences',
    },
    {
        id: 's5',
        name: 'Statistics Workshop',
        description: 'Help with probability, hypothesis testing, regression, and statistical software (R, SPSS).',
        expectedDuration: 30,
        priorityLevel: 'low',
        isOpen: false,
        icon: '📊',
        category: 'Mathematics',
    },
    {
        id: 's6',
        name: 'Chemistry Review',
        description: 'General and organic chemistry tutoring, reaction balancing, and exam prep.',
        expectedDuration: 25,
        priorityLevel: 'medium',
        isOpen: true,
        icon: '🧪',
        category: 'Sciences',
    },
];

const queueEntries = [
    {
        id: 'q1',
        userId: 'u1',
        serviceId: 's1',
        joinedAt: new Date(Date.now() - 45 * 60000).toISOString(),
        status: 'waiting',
        priority: 'normal',
        position: 1,
        notes: 'Need help with integration by parts',
    },
    {
        id: 'q2',
        userId: 'u2',
        serviceId: 's1',
        joinedAt: new Date(Date.now() - 30 * 60000).toISOString(),
        status: 'waiting',
        priority: 'normal',
        position: 2,
        notes: 'Series convergence questions',
    },
    {
        id: 'q3',
        userId: 'u3',
        serviceId: 's2',
        joinedAt: new Date(Date.now() - 20 * 60000).toISOString(),
        status: 'waiting',
        priority: 'high',
        position: 1,
        notes: 'Assignment due tonight - linked list help',
    },
    {
        id: 'q4',
        userId: 'u4',
        serviceId: 's3',
        joinedAt: new Date(Date.now() - 15 * 60000).toISOString(),
        status: 'waiting',
        priority: 'normal',
        position: 1,
        notes: 'Research paper draft review',
    },
    {
        id: 'q5',
        userId: 'u2',
        serviceId: 's4',
        joinedAt: new Date(Date.now() - 10 * 60000).toISOString(),
        status: 'waiting',
        priority: 'normal',
        position: 1,
        notes: '',
    },
];

const history = [
    {
        id: 'h1',
        userId: 'u1',
        serviceId: 's2',
        serviceName: 'CS Tutoring',
        date: '2025-12-10',
        joinedAt: '10:30 AM',
        servedAt: '11:05 AM',
        waitTime: 35,
        outcome: 'served',
    },
    {
        id: 'h2',
        userId: 'u1',
        serviceId: 's1',
        serviceName: 'Calculus Help',
        date: '2025-12-08',
        joinedAt: '2:00 PM',
        servedAt: '2:20 PM',
        waitTime: 20,
        outcome: 'served',
    },
    {
        id: 'h3',
        userId: 'u1',
        serviceId: 's3',
        serviceName: 'Writing Center',
        date: '2025-12-05',
        joinedAt: '9:00 AM',
        servedAt: null,
        waitTime: null,
        outcome: 'cancelled',
    },
    {
        id: 'h4',
        userId: 'u1',
        serviceId: 's4',
        serviceName: 'Physics Lab Prep',
        date: '2025-11-28',
        joinedAt: '3:15 PM',
        servedAt: '4:00 PM',
        waitTime: 45,
        outcome: 'served',
    },
    {
        id: 'h5',
        userId: 'u1',
        serviceId: 's1',
        serviceName: 'Calculus Help',
        date: '2025-11-20',
        joinedAt: '11:00 AM',
        servedAt: null,
        waitTime: null,
        outcome: 'no-show',
    },
    {
        id: 'h6',
        userId: 'u2',
        serviceId: 's1',
        serviceName: 'Calculus Help',
        date: '2025-12-09',
        joinedAt: '1:00 PM',
        servedAt: '1:30 PM',
        waitTime: 30,
        outcome: 'served',
    },
];

const notifications = [
    {
        id: 'n1',
        userId: 'u1',
        type: 'queue_update',
        title: 'Almost Your Turn!',
        message: 'You are next in line for Calculus Help. Please be ready.',
        timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
        read: false,
    },
    {
        id: 'n2',
        userId: 'u1',
        type: 'status_change',
        title: 'Queue Position Updated',
        message: 'Your position in Calculus Help has moved from #3 to #1.',
        timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
        read: false,
    },
    {
        id: 'n3',
        userId: 'u1',
        type: 'reminder',
        title: 'Upcoming Session',
        message: 'Your CS Tutoring appointment is in 30 minutes.',
        timestamp: new Date(Date.now() - 60 * 60000).toISOString(),
        read: true,
    },
    {
        id: 'n4',
        userId: 'u1',
        type: 'info',
        title: 'New Service Available',
        message: 'Statistics Workshop is now open for drop-in tutoring.',
        timestamp: new Date(Date.now() - 120 * 60000).toISOString(),
        read: true,
    },
];

// Helper to reset data for tests
function resetData() {
    users.length = 0;
    users.push(
        { id: 'u1', name: 'Jordan Rivera', email: 'jordan@university.edu', password: bcrypt.hashSync('password123', SALT_ROUNDS), role: 'student', createdAt: '2025-09-01' },
        { id: 'u2', name: 'Alex Chen', email: 'alex@university.edu', password: bcrypt.hashSync('password123', SALT_ROUNDS), role: 'student', createdAt: '2025-09-15' },
        { id: 'u3', name: 'Sam Patel', email: 'sam@university.edu', password: bcrypt.hashSync('password123', SALT_ROUNDS), role: 'student', createdAt: '2025-10-02' },
        { id: 'u4', name: 'Morgan Lee', email: 'morgan@university.edu', password: bcrypt.hashSync('password123', SALT_ROUNDS), role: 'student', createdAt: '2025-10-10' },
        { id: 'a1', name: 'Dr. Emily Watson', email: 'admin@university.edu', password: bcrypt.hashSync('admin123', SALT_ROUNDS), role: 'admin', createdAt: '2025-08-01' },
        { id: 'a2', name: 'Prof. Marcus Johnson', email: 'marcus@university.edu', password: bcrypt.hashSync('admin123', SALT_ROUNDS), role: 'admin', createdAt: '2025-08-15' }
    );

    services.length = 0;
    services.push(
        { id: 's1', name: 'Calculus Help', description: 'Get assistance with Calculus I, II, and III.', expectedDuration: 25, priorityLevel: 'high', isOpen: true, icon: '📐', category: 'Mathematics' },
        { id: 's2', name: 'CS Tutoring', description: 'Programming help for intro CS courses.', expectedDuration: 30, priorityLevel: 'high', isOpen: true, icon: '💻', category: 'Computer Science' },
        { id: 's3', name: 'Writing Center', description: 'Essay review, thesis development, grammar & citation help.', expectedDuration: 20, priorityLevel: 'medium', isOpen: true, icon: '✍️', category: 'Writing' }
    );

    queueEntries.length = 0;
    history.length = 0;
    notifications.length = 0;
}

module.exports = { users, services, queueEntries, history, notifications, resetData };
