// ── MySQL Store ─────────────────────────────────────
// Production data access layer — all queries go through mysql2 pool.
// Returns camelCase objects matching the API format the frontend expects.

const { getPool } = require('./database');

// ── ID Generator ────────────────────────────────────
function generateId(prefix) {
    return `${prefix}${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// ── Status Mappers (MySQL enum uses underscore, API uses hyphen) ──
function toDbStatus(status) {
    return status === 'no-show' ? 'no_show' : status;
}
function fromDbStatus(status) {
    return status === 'no_show' ? 'no-show' : status;
}

// ── Row Mappers ─────────────────────────────────────
function mapUser(row) {
    return {
        id: row.public_id,
        name: row.name,
        email: row.email,
        password: row.password_hash,
        role: row.role,
        createdAt: row.created_at instanceof Date
            ? row.created_at.toISOString().split('T')[0]
            : String(row.created_at || '').split('T')[0],
    };
}

function mapUserSafe(row) {
    const u = mapUser(row);
    delete u.password;
    return u;
}

function mapService(row) {
    return {
        id: row.public_id,
        name: row.name,
        description: row.description,
        expectedDuration: row.expected_duration,
        priorityLevel: row.priority_level,
        isOpen: Boolean(row.is_open),
        icon: row.icon,
        category: row.category,
    };
}

function mapQueueEntry(row) {
    return {
        id: row.public_id || row.entry_public_id,
        userId: row.user_public_id || row.userId,
        serviceId: row.service_public_id || row.serviceId,
        queueId: row.queue_public_id || null,
        joinedAt: row.joined_at instanceof Date
            ? row.joined_at.toISOString()
            : row.joined_at,
        status: fromDbStatus(row.status),
        priority: row.priority,
        position: row.position,
        notes: row.notes || '',
    };
}

function formatTime(val) {
    if (!val) return null;
    // If already a formatted string like '10:30 AM', return as-is
    if (typeof val === 'string' && val.includes('AM') || typeof val === 'string' && val.includes('PM')) return val;
    // MySQL TIME string like '14:30:00'
    if (typeof val === 'string') {
        const parts = val.split(':');
        let h = parseInt(parts[0], 10);
        const m = parts[1];
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12 || 12;
        return `${h}:${m} ${ampm}`;
    }
    return String(val);
}

function parseTimeToMysql(timeStr) {
    if (!timeStr) return null;
    // Already HH:MM:SS
    if (/^\d{2}:\d{2}:\d{2}$/.test(timeStr)) return timeStr;
    // '10:30 AM' or '2:30 PM' format
    const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
    if (!match) return timeStr;
    let hours = parseInt(match[1], 10);
    const minutes = match[2];
    const ampm = match[3];
    if (ampm) {
        if (ampm.toUpperCase() === 'PM' && hours !== 12) hours += 12;
        if (ampm.toUpperCase() === 'AM' && hours === 12) hours = 0;
    }
    return `${hours.toString().padStart(2, '0')}:${minutes}:00`;
}

function mapHistory(row) {
    return {
        id: row.public_id || row.hist_public_id,
        userId: row.user_public_id || row.userId,
        serviceId: row.service_public_id || row.serviceId,
        serviceName: row.service_name,
        date: row.session_date instanceof Date
            ? row.session_date.toISOString().split('T')[0]
            : String(row.session_date || '').split('T')[0],
        joinedAt: formatTime(row.joined_time),
        servedAt: formatTime(row.served_time),
        waitTime: row.wait_time != null ? row.wait_time : null,
        outcome: fromDbStatus(row.outcome),
    };
}

function mapNotification(row) {
    return {
        id: row.public_id || row.notif_public_id,
        userId: row.user_public_id || row.userId,
        type: row.type,
        title: row.title,
        message: row.message,
        timestamp: row.created_at instanceof Date
            ? row.created_at.toISOString()
            : row.created_at,
        read: Boolean(row.is_read),
    };
}

// ── Store Implementation ────────────────────────────

module.exports = {

    // ── Users ────────────────────────────────────────

    async findUserByEmail(email) {
        const pool = getPool();
        const [rows] = await pool.execute(
            'SELECT id, public_id, name, email, password_hash, role, created_at FROM users WHERE email = ?',
            [email.toLowerCase()]
        );
        if (rows.length === 0) return null;
        return mapUser(rows[0]);
    },

    async findUserById(publicId) {
        const pool = getPool();
        const [rows] = await pool.execute(
            'SELECT id, public_id, name, email, password_hash, role, created_at FROM users WHERE public_id = ?',
            [publicId]
        );
        if (rows.length === 0) return null;
        return mapUser(rows[0]);
    },

    async createUser({ name, email, password, role }) {
        const pool = getPool();
        const publicId = generateId('u');
        await pool.execute(
            'INSERT INTO users (public_id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)',
            [publicId, name, email, password, role]
        );
        return { id: publicId, name, email, role, createdAt: new Date().toISOString().split('T')[0] };
    },

    async listUsers() {
        const pool = getPool();
        const [rows] = await pool.execute(
            'SELECT public_id, name, email, role, created_at FROM users'
        );
        return rows.map(mapUserSafe);
    },

    // ── Services ─────────────────────────────────────

    async listServices() {
        const pool = getPool();
        const [rows] = await pool.execute(
            `SELECT s.public_id, s.name, s.description, s.expected_duration, s.priority_level,
                    s.is_open, s.icon, s.category
             FROM services s`
        );
        return rows.map(mapService);
    },

    async findServiceById(publicId) {
        const pool = getPool();
        const [rows] = await pool.execute(
            `SELECT s.id, s.public_id, s.name, s.description, s.expected_duration, s.priority_level,
                    s.is_open, s.icon, s.category
             FROM services s WHERE s.public_id = ?`,
            [publicId]
        );
        if (rows.length === 0) return null;
        return mapService(rows[0]);
    },

    async createService({ name, description, expectedDuration, priorityLevel, icon, category }) {
        const pool = getPool();
        const publicId = generateId('s');
        const [result] = await pool.execute(
            `INSERT INTO services (public_id, name, description, expected_duration, priority_level, is_open, icon, category)
             VALUES (?, ?, ?, ?, ?, 1, ?, ?)`,
            [publicId, name, description, expectedDuration, priorityLevel, icon || '📚', category || 'General']
        );

        // Auto-create queue for new service
        const queuePublicId = generateId('queue');
        await pool.execute(
            'INSERT INTO queues (public_id, service_id, status) VALUES (?, ?, ?)',
            [queuePublicId, result.insertId, 'open']
        );

        return {
            id: publicId,
            name,
            description,
            expectedDuration: Number(expectedDuration),
            priorityLevel,
            isOpen: true,
            icon: icon || '📚',
            category: category || 'General',
        };
    },

    async updateService(publicId, updates) {
        const pool = getPool();

        const setClauses = [];
        const values = [];

        if (updates.name !== undefined) { setClauses.push('name = ?'); values.push(updates.name); }
        if (updates.description !== undefined) { setClauses.push('description = ?'); values.push(updates.description); }
        if (updates.expectedDuration !== undefined) { setClauses.push('expected_duration = ?'); values.push(Number(updates.expectedDuration)); }
        if (updates.priorityLevel !== undefined) { setClauses.push('priority_level = ?'); values.push(updates.priorityLevel); }
        if (updates.icon !== undefined) { setClauses.push('icon = ?'); values.push(updates.icon); }
        if (updates.category !== undefined) { setClauses.push('category = ?'); values.push(updates.category); }
        if (updates.isOpen !== undefined) { setClauses.push('is_open = ?'); values.push(updates.isOpen ? 1 : 0); }

        if (setClauses.length > 0) {
            values.push(publicId);
            await pool.execute(
                `UPDATE services SET ${setClauses.join(', ')} WHERE public_id = ?`,
                values
            );

            // Sync queue status when isOpen changes
            if (updates.isOpen !== undefined) {
                await pool.execute(
                    `UPDATE queues SET status = ? WHERE service_id = (SELECT id FROM services WHERE public_id = ?)`,
                    [updates.isOpen ? 'open' : 'closed', publicId]
                );
            }
        }

        return this.findServiceById(publicId);
    },

    // ── Queues ───────────────────────────────────────

    async findQueueByServiceId(servicePublicId) {
        const pool = getPool();
        const [rows] = await pool.execute(
            `SELECT q.public_id, q.status, q.created_at, s.public_id as service_public_id
             FROM queues q
             JOIN services s ON s.id = q.service_id
             WHERE s.public_id = ?`,
            [servicePublicId]
        );
        if (rows.length === 0) return null;
        return {
            id: rows[0].public_id,
            serviceId: rows[0].service_public_id,
            status: rows[0].status,
            createdAt: rows[0].created_at,
        };
    },

    async createQueue(servicePublicId) {
        const pool = getPool();
        const [serviceRows] = await pool.execute('SELECT id FROM services WHERE public_id = ?', [servicePublicId]);
        if (serviceRows.length === 0) return null;

        const publicId = generateId('queue');
        await pool.execute(
            'INSERT INTO queues (public_id, service_id, status) VALUES (?, ?, ?)',
            [publicId, serviceRows[0].id, 'open']
        );
        return { id: publicId, serviceId: servicePublicId, status: 'open', createdAt: new Date().toISOString() };
    },

    async updateQueueStatus(servicePublicId, status) {
        const pool = getPool();
        await pool.execute(
            `UPDATE queues SET status = ? WHERE service_id = (SELECT id FROM services WHERE public_id = ?)`,
            [status, servicePublicId]
        );
    },

    // ── Queue Entries ────────────────────────────────

    async listWaitingEntries(servicePublicId) {
        const pool = getPool();
        let sql = `SELECT qe.public_id, qe.joined_at, qe.status, qe.priority, qe.position, qe.notes,
                          u.public_id as user_public_id, s.public_id as service_public_id
                   FROM queue_entries qe
                   JOIN users u ON u.id = qe.user_id
                   JOIN services s ON s.id = qe.service_id
                   WHERE qe.status = 'waiting'`;
        const params = [];

        if (servicePublicId) {
            sql += ' AND s.public_id = ?';
            params.push(servicePublicId);
        }
        sql += ' ORDER BY qe.position ASC';

        const [rows] = await pool.execute(sql, params);
        return rows.map(mapQueueEntry);
    },

    async findEntryById(publicId) {
        const pool = getPool();
        const [rows] = await pool.execute(
            `SELECT qe.public_id, qe.joined_at, qe.status, qe.priority, qe.position, qe.notes,
                    u.public_id as user_public_id, s.public_id as service_public_id
             FROM queue_entries qe
             JOIN users u ON u.id = qe.user_id
             JOIN services s ON s.id = qe.service_id
             WHERE qe.public_id = ?`,
            [publicId]
        );
        if (rows.length === 0) return null;
        return mapQueueEntry(rows[0]);
    },

    async findDuplicateEntry(userPublicId, servicePublicId) {
        const pool = getPool();
        const [rows] = await pool.execute(
            `SELECT qe.public_id
             FROM queue_entries qe
             JOIN users u ON u.id = qe.user_id
             JOIN services s ON s.id = qe.service_id
             WHERE u.public_id = ? AND s.public_id = ? AND qe.status = 'waiting'`,
            [userPublicId, servicePublicId]
        );
        return rows.length > 0 ? { id: rows[0].public_id } : null;
    },

    async createEntry({ userId, serviceId, priority, notes }) {
        const pool = getPool();

        // Resolve internal IDs
        const [userRows] = await pool.execute('SELECT id FROM users WHERE public_id = ?', [userId]);
        const [serviceRows] = await pool.execute('SELECT id FROM services WHERE public_id = ?', [serviceId]);
        if (userRows.length === 0 || serviceRows.length === 0) return null;

        const userInternalId = userRows[0].id;
        const serviceInternalId = serviceRows[0].id;

        // Get queue for this service
        const [queueRows] = await pool.execute('SELECT id FROM queues WHERE service_id = ?', [serviceInternalId]);
        const queueInternalId = queueRows.length > 0 ? queueRows[0].id : null;

        // Count current waiting entries for position
        const [countRows] = await pool.execute(
            `SELECT COUNT(*) as cnt FROM queue_entries WHERE service_id = ? AND status = 'waiting'`,
            [serviceInternalId]
        );
        const position = countRows[0].cnt + 1;

        const publicId = generateId('q');
        await pool.execute(
            `INSERT INTO queue_entries (public_id, user_id, service_id, queue_id, status, priority, position, notes)
             VALUES (?, ?, ?, ?, 'waiting', ?, ?, ?)`,
            [publicId, userInternalId, serviceInternalId, queueInternalId, priority || 'normal', position, notes || '']
        );

        return {
            id: publicId,
            userId,
            serviceId,
            queueId: null,
            joinedAt: new Date().toISOString(),
            status: 'waiting',
            priority: priority || 'normal',
            position,
            notes: notes || '',
        };
    },

    async updateEntryStatus(publicId, status) {
        const pool = getPool();
        const dbStatus = toDbStatus(status);
        await pool.execute(
            'UPDATE queue_entries SET status = ? WHERE public_id = ?',
            [dbStatus, publicId]
        );
        return this.findEntryById(publicId);
    },

    async updateEntryPosition(publicId, position) {
        const pool = getPool();
        await pool.execute(
            'UPDATE queue_entries SET position = ? WHERE public_id = ?',
            [position, publicId]
        );
    },

    async recalcPositions(servicePublicId) {
        const pool = getPool();

        // Get service internal ID
        const [serviceRows] = await pool.execute(
            'SELECT id FROM services WHERE public_id = ?',
            [servicePublicId]
        );
        if (serviceRows.length === 0) return;
        const serviceInternalId = serviceRows[0].id;

        // Get ordered waiting entries
        const [entries] = await pool.execute(
            `SELECT id FROM queue_entries
             WHERE service_id = ? AND status = 'waiting'
             ORDER BY FIELD(priority, 'high', 'normal'), joined_at ASC, id ASC`,
            [serviceInternalId]
        );

        // Update each position
        for (let i = 0; i < entries.length; i++) {
            await pool.execute(
                'UPDATE queue_entries SET position = ? WHERE id = ?',
                [i + 1, entries[i].id]
            );
        }
    },

    // ── History ──────────────────────────────────────

    async listHistory(userPublicId) {
        const pool = getPool();
        let sql = `SELECT h.public_id, h.service_name, h.session_date, h.joined_time, h.served_time,
                          h.wait_time, h.outcome,
                          u.public_id as user_public_id, s.public_id as service_public_id
                   FROM history h
                   JOIN users u ON u.id = h.user_id
                   JOIN services s ON s.id = h.service_id`;
        const params = [];

        if (userPublicId) {
            sql += ' WHERE u.public_id = ?';
            params.push(userPublicId);
        }
        sql += ' ORDER BY h.session_date DESC, h.created_at DESC';

        const [rows] = await pool.execute(sql, params);
        return rows.map(mapHistory);
    },

    async findHistoryById(publicId) {
        const pool = getPool();
        const [rows] = await pool.execute(
            `SELECT h.public_id, h.service_name, h.session_date, h.joined_time, h.served_time,
                    h.wait_time, h.outcome,
                    u.public_id as user_public_id, s.public_id as service_public_id
             FROM history h
             JOIN users u ON u.id = h.user_id
             JOIN services s ON s.id = h.service_id
             WHERE h.public_id = ?`,
            [publicId]
        );
        if (rows.length === 0) return null;
        return mapHistory(rows[0]);
    },

    async createHistory({ userId, serviceId, serviceName, date, joinedAt, servedAt, waitTime, outcome }) {
        const pool = getPool();

        // Resolve internal IDs
        const [userRows] = await pool.execute('SELECT id FROM users WHERE public_id = ?', [userId]);
        const [serviceRows] = await pool.execute('SELECT id FROM services WHERE public_id = ?', [serviceId]);

        const userInternalId = userRows[0]?.id;
        const serviceInternalId = serviceRows[0]?.id;

        if (!userInternalId || !serviceInternalId) return null;

        const publicId = generateId('h');
        const dbOutcome = toDbStatus(outcome);
        const dbJoinedTime = parseTimeToMysql(joinedAt);
        const dbServedTime = parseTimeToMysql(servedAt);

        await pool.execute(
            `INSERT INTO history (public_id, user_id, service_id, service_name, session_date, joined_time, served_time, wait_time, outcome)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [publicId, userInternalId, serviceInternalId, serviceName, date, dbJoinedTime, dbServedTime, waitTime, dbOutcome]
        );

        return {
            id: publicId,
            userId,
            serviceId,
            serviceName,
            date,
            joinedAt,
            servedAt: servedAt || null,
            waitTime: waitTime != null ? waitTime : null,
            outcome,
        };
    },

    // ── Notifications ────────────────────────────────

    async listNotifications(userPublicId) {
        const pool = getPool();
        let sql = `SELECT n.public_id, n.type, n.title, n.message, n.is_read, n.created_at,
                          u.public_id as user_public_id
                   FROM notifications n
                   JOIN users u ON u.id = n.user_id`;
        const params = [];

        if (userPublicId) {
            sql += ' WHERE u.public_id = ?';
            params.push(userPublicId);
        }
        sql += ' ORDER BY n.created_at DESC';

        const [rows] = await pool.execute(sql, params);
        return rows.map(mapNotification);
    },

    async findNotificationById(publicId) {
        const pool = getPool();
        const [rows] = await pool.execute(
            `SELECT n.public_id, n.type, n.title, n.message, n.is_read, n.created_at,
                    u.public_id as user_public_id
             FROM notifications n
             JOIN users u ON u.id = n.user_id
             WHERE n.public_id = ?`,
            [publicId]
        );
        if (rows.length === 0) return null;
        return mapNotification(rows[0]);
    },

    async createNotification({ userId, type, title, message }) {
        const pool = getPool();

        const [userRows] = await pool.execute('SELECT id FROM users WHERE public_id = ?', [userId]);
        const userInternalId = userRows[0]?.id;
        if (!userInternalId) return null;

        const publicId = generateId('n');
        await pool.execute(
            'INSERT INTO notifications (public_id, user_id, type, title, message) VALUES (?, ?, ?, ?, ?)',
            [publicId, userInternalId, type || 'info', title, message]
        );

        return {
            id: publicId,
            userId,
            type: type || 'info',
            title,
            message,
            timestamp: new Date().toISOString(),
            read: false,
        };
    },

    async markNotificationRead(publicId) {
        const pool = getPool();
        const [result] = await pool.execute(
            'UPDATE notifications SET is_read = 1, read_at = NOW() WHERE public_id = ?',
            [publicId]
        );
        if (result.affectedRows === 0) return null;
        return this.findNotificationById(publicId);
    },

    async markAllNotificationsRead(userPublicId) {
        const pool = getPool();
        const [result] = await pool.execute(
            `UPDATE notifications SET is_read = 1, read_at = NOW()
             WHERE user_id = (SELECT id FROM users WHERE public_id = ?) AND is_read = 0`,
            [userPublicId]
        );
        return result.affectedRows;
    },

    // ── Reset ────────────────────────────────────────

    resetData() {
        // No-op in production MySQL store
    },
};
