// ── In-Memory Store ─────────────────────────────────
// Wraps the existing db.js arrays for test compatibility.
// All methods are async to match the MySQL store interface.

const db = require('./db');

// ── Queues array (not in db.js, managed here) ───────
let queues = [];

function initQueues() {
    queues.length = 0;
    db.services.forEach(s => {
        queues.push({
            id: `queue_${s.id}`,
            serviceId: s.id,
            status: s.isOpen ? 'open' : 'closed',
            createdAt: new Date().toISOString(),
        });
    });
}
initQueues();

module.exports = {
    // ── Users ────────────────────────────────────────

    async findUserByEmail(email) {
        return db.users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
    },

    async findUserById(id) {
        return db.users.find(u => u.id === id) || null;
    },

    async createUser({ name, email, password, role }) {
        const newUser = {
            id: `u${Date.now()}`,
            name,
            email,
            password,
            role,
            createdAt: new Date().toISOString().split('T')[0],
        };
        db.users.push(newUser);
        const { password: _, ...safeUser } = newUser;
        return safeUser;
    },

    async listUsers() {
        return db.users.map(({ password, ...u }) => u);
    },

    // ── Services ─────────────────────────────────────

    async listServices() {
        return db.services;
    },

    async findServiceById(id) {
        return db.services.find(s => s.id === id) || null;
    },

    async createService({ name, description, expectedDuration, priorityLevel, icon, category }) {
        const newService = {
            id: `s${Date.now()}`,
            name,
            description,
            expectedDuration: Number(expectedDuration),
            priorityLevel,
            isOpen: true,
            icon: icon || '📚',
            category: category || 'General',
        };
        db.services.push(newService);

        // Auto-create queue for this service
        queues.push({
            id: `queue_${newService.id}`,
            serviceId: newService.id,
            status: 'open',
            createdAt: new Date().toISOString(),
        });

        return newService;
    },

    async updateService(id, updates) {
        const service = db.services.find(s => s.id === id);
        if (!service) return null;

        if (updates.name !== undefined) service.name = updates.name;
        if (updates.description !== undefined) service.description = updates.description;
        if (updates.expectedDuration !== undefined) service.expectedDuration = Number(updates.expectedDuration);
        if (updates.priorityLevel !== undefined) service.priorityLevel = updates.priorityLevel;
        if (updates.icon !== undefined) service.icon = updates.icon;
        if (updates.category !== undefined) service.category = updates.category;
        if (updates.isOpen !== undefined) {
            service.isOpen = Boolean(updates.isOpen);
            const queue = queues.find(q => q.serviceId === id);
            if (queue) queue.status = service.isOpen ? 'open' : 'closed';
        }

        return service;
    },

    // ── Queues ───────────────────────────────────────

    async findQueueByServiceId(serviceId) {
        return queues.find(q => q.serviceId === serviceId) || null;
    },

    async createQueue(serviceId) {
        const queue = {
            id: `queue_${serviceId}_${Date.now()}`,
            serviceId,
            status: 'open',
            createdAt: new Date().toISOString(),
        };
        queues.push(queue);
        return queue;
    },

    async updateQueueStatus(serviceId, status) {
        const queue = queues.find(q => q.serviceId === serviceId);
        if (queue) queue.status = status;
    },

    // ── Queue Entries ────────────────────────────────

    async listWaitingEntries(serviceId) {
        let entries = db.queueEntries.filter(q => q.status === 'waiting');
        if (serviceId) {
            entries = entries.filter(q => q.serviceId === serviceId);
        }
        return entries.sort((a, b) => a.position - b.position);
    },

    async findEntryById(id) {
        return db.queueEntries.find(q => q.id === id) || null;
    },

    async findDuplicateEntry(userId, serviceId) {
        return db.queueEntries.find(
            q => q.userId === userId && q.serviceId === serviceId && q.status === 'waiting'
        ) || null;
    },

    async createEntry({ userId, serviceId, priority, notes }) {
        const count = db.queueEntries.filter(
            q => q.serviceId === serviceId && q.status === 'waiting'
        ).length;

        const queue = queues.find(q => q.serviceId === serviceId);

        const entry = {
            id: `q${Date.now()}`,
            userId,
            serviceId,
            queueId: queue ? queue.id : null,
            joinedAt: new Date().toISOString(),
            status: 'waiting',
            priority: priority || 'normal',
            position: count + 1,
            notes: notes || '',
        };
        db.queueEntries.push(entry);
        return entry;
    },

    async updateEntryStatus(id, status) {
        const entry = db.queueEntries.find(q => q.id === id);
        if (!entry) return null;
        entry.status = status;
        return entry;
    },

    async updateEntryPosition(id, position) {
        const entry = db.queueEntries.find(q => q.id === id);
        if (!entry) return null;
        entry.position = position;
        return entry;
    },

    async recalcPositions(serviceId) {
        const waiting = db.queueEntries
            .filter(q => q.serviceId === serviceId && q.status === 'waiting')
            .sort((a, b) => {
                if (a.priority === 'high' && b.priority !== 'high') return -1;
                if (a.priority !== 'high' && b.priority === 'high') return 1;
                const timeDiff = new Date(a.joinedAt) - new Date(b.joinedAt);
                if (timeDiff !== 0) return timeDiff;
                return db.queueEntries.indexOf(a) - db.queueEntries.indexOf(b);
            });
        waiting.forEach((entry, i) => {
            entry.position = i + 1;
        });
    },

    // ── History ──────────────────────────────────────

    async listHistory(userId) {
        if (userId) {
            return db.history.filter(h => h.userId === userId);
        }
        return db.history;
    },

    async findHistoryById(id) {
        return db.history.find(h => h.id === id) || null;
    },

    async createHistory({ userId, serviceId, serviceName, date, joinedAt, servedAt, waitTime, outcome }) {
        const entry = {
            id: `h${Date.now()}`,
            userId,
            serviceId,
            serviceName,
            date,
            joinedAt,
            servedAt: servedAt || null,
            waitTime: waitTime != null ? waitTime : null,
            outcome,
        };
        db.history.unshift(entry);
        return entry;
    },

    // ── Notifications ────────────────────────────────

    async listNotifications(userId) {
        if (userId) {
            return db.notifications.filter(n => n.userId === userId);
        }
        return db.notifications;
    },

    async findNotificationById(id) {
        return db.notifications.find(n => n.id === id) || null;
    },

    async createNotification({ userId, type, title, message }) {
        const notif = {
            id: `n${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            userId,
            type: type || 'info',
            title,
            message,
            timestamp: new Date().toISOString(),
            read: false,
        };
        db.notifications.unshift(notif);
        return notif;
    },

    async markNotificationRead(id) {
        const notif = db.notifications.find(n => n.id === id);
        if (!notif) return null;
        notif.read = true;
        return notif;
    },

    async markAllNotificationsRead(userId) {
        let count = 0;
        db.notifications.forEach(n => {
            if (n.userId === userId && !n.read) {
                n.read = true;
                count++;
            }
        });
        return count;
    },

    // ── Reset (for tests) ────────────────────────────

    resetData() {
        db.resetData();
        initQueues();
    },
};
