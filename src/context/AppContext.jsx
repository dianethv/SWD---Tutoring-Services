import { createContext, useContext, useState, useCallback } from 'react';
import {
    mockUsers,
    mockServices as initialServices,
    mockQueueEntries as initialQueue,
    mockHistory as initialHistory,
    mockNotifications as initialNotifications,
    mockStats,
} from '../data/mockData';

const AppContext = createContext(null);

export function AppProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [services, setServices] = useState(initialServices);
    const [queueEntries, setQueueEntries] = useState(initialQueue);
    const [history, setHistory] = useState(initialHistory);
    const [notifications, setNotifications] = useState(initialNotifications);
    const [stats] = useState(mockStats);

    // ── Auth ────────────────────────────────────────────
    const login = useCallback((email, password) => {
        const user = mockUsers.find(
            (u) => u.email === email && u.password === password
        );
        if (user) {
            setCurrentUser(user);
            return { success: true, user };
        }
        return { success: false, error: 'Invalid email or password' };
    }, []);

    const register = useCallback((name, email, password, role) => {
        const exists = mockUsers.find((u) => u.email === email);
        if (exists) return { success: false, error: 'Email already registered' };

        const newUser = {
            id: `u${Date.now()}`,
            name,
            email,
            password,
            role,
            avatar: null,
            createdAt: new Date().toISOString().split('T')[0],
        };
        mockUsers.push(newUser);
        setCurrentUser(newUser);
        return { success: true, user: newUser };
    }, []);

    const logout = useCallback(() => {
        setCurrentUser(null);
    }, []);

    // ── Queue Operations ────────────────────────────────
    const joinQueue = useCallback(
        (serviceId, notes = '', priority = 'normal') => {
            if (!currentUser) return;
            const alreadyInQueue = queueEntries.find(
                (q) => q.userId === currentUser.id && q.serviceId === serviceId && q.status === 'waiting'
            );
            if (alreadyInQueue) return { success: false, error: 'Already in this queue' };

            const serviceQueue = queueEntries.filter(
                (q) => q.serviceId === serviceId && q.status === 'waiting'
            );
            const newEntry = {
                id: `q${Date.now()}`,
                userId: currentUser.id,
                serviceId,
                joinedAt: new Date().toISOString(),
                status: 'waiting',
                priority,
                position: serviceQueue.length + 1,
                notes,
            };
            setQueueEntries((prev) => [...prev, newEntry]);

            // Add notification
            const service = services.find((s) => s.id === serviceId);
            addNotification({
                type: 'queue_update',
                title: 'Joined Queue',
                message: `You joined the queue for ${service?.name}. Position: #${newEntry.position}`,
            });
            return { success: true, entry: newEntry };
        },
        [currentUser, queueEntries, services]
    );

    const leaveQueue = useCallback(
        (entryId) => {
            setQueueEntries((prev) => {
                const entry = prev.find((q) => q.id === entryId);
                if (!entry) return prev;

                const updated = prev.filter((q) => q.id !== entryId);
                // Recalculate positions for remaining entries in same service
                const serviceEntries = updated
                    .filter((q) => q.serviceId === entry.serviceId && q.status === 'waiting')
                    .sort((a, b) => new Date(a.joinedAt) - new Date(b.joinedAt));
                serviceEntries.forEach((q, i) => {
                    q.position = i + 1;
                });
                return updated;
            });
        },
        []
    );

    const serveNext = useCallback(
        (serviceId) => {
            setQueueEntries((prev) => {
                const serviceQueue = prev
                    .filter((q) => q.serviceId === serviceId && q.status === 'waiting')
                    .sort((a, b) => a.position - b.position);
                if (serviceQueue.length === 0) return prev;

                const served = serviceQueue[0];
                const service = services.find((s) => s.id === serviceId);

                // Add to history
                const historyEntry = {
                    id: `h${Date.now()}`,
                    userId: served.userId,
                    serviceId,
                    serviceName: service?.name || 'Unknown',
                    date: new Date().toISOString().split('T')[0],
                    joinedAt: new Date(served.joinedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    servedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    waitTime: Math.round((Date.now() - new Date(served.joinedAt).getTime()) / 60000),
                    outcome: 'served',
                };
                setHistory((h) => [historyEntry, ...h]);

                // Update queue
                const updated = prev.map((q) => {
                    if (q.id === served.id) return { ...q, status: 'served' };
                    if (q.serviceId === serviceId && q.status === 'waiting') {
                        return { ...q, position: q.position - 1 };
                    }
                    return q;
                });

                // Notify the next person if they exist
                const nextInLine = updated.find(
                    (q) => q.serviceId === serviceId && q.status === 'waiting' && q.position === 1
                );
                if (nextInLine) {
                    const user = mockUsers.find((u) => u.id === nextInLine.userId);
                    addNotification({
                        type: 'queue_update',
                        title: 'Almost Your Turn!',
                        message: `You are next in line for ${service?.name}. Please be ready.`,
                        userId: nextInLine.userId,
                    });
                }

                return updated;
            });
        },
        [services]
    );

    const markNoShow = useCallback(
        (entryId) => {
            setQueueEntries((prev) => {
                const entry = prev.find((q) => q.id === entryId);
                if (!entry) return prev;

                const service = services.find((s) => s.id === entry.serviceId);
                const historyEntry = {
                    id: `h${Date.now()}`,
                    userId: entry.userId,
                    serviceId: entry.serviceId,
                    serviceName: service?.name || 'Unknown',
                    date: new Date().toISOString().split('T')[0],
                    joinedAt: new Date(entry.joinedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    servedAt: null,
                    waitTime: null,
                    outcome: 'no-show',
                };
                setHistory((h) => [historyEntry, ...h]);

                const updated = prev.map((q) => {
                    if (q.id === entryId) return { ...q, status: 'no-show' };
                    if (q.serviceId === entry.serviceId && q.status === 'waiting' && q.position > entry.position) {
                        return { ...q, position: q.position - 1 };
                    }
                    return q;
                });
                return updated;
            });
        },
        [services]
    );

    const reorderQueue = useCallback((serviceId, entryId, direction) => {
        setQueueEntries((prev) => {
            const serviceQueue = prev
                .filter((q) => q.serviceId === serviceId && q.status === 'waiting')
                .sort((a, b) => a.position - b.position);

            const idx = serviceQueue.findIndex((q) => q.id === entryId);
            if (idx === -1) return prev;
            if (direction === 'up' && idx === 0) return prev;
            if (direction === 'down' && idx === serviceQueue.length - 1) return prev;

            const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
            const tempPos = serviceQueue[idx].position;

            return prev.map((q) => {
                if (q.id === serviceQueue[idx].id) return { ...q, position: serviceQueue[swapIdx].position };
                if (q.id === serviceQueue[swapIdx].id) return { ...q, position: tempPos };
                return q;
            });
        });
    }, []);

    // ── Service Management ──────────────────────────────
    const createService = useCallback((serviceData) => {
        const newService = {
            id: `s${Date.now()}`,
            ...serviceData,
            isOpen: true,
        };
        setServices((prev) => [...prev, newService]);
        return newService;
    }, []);

    const updateService = useCallback((serviceId, updates) => {
        setServices((prev) =>
            prev.map((s) => (s.id === serviceId ? { ...s, ...updates } : s))
        );
    }, []);

    const toggleService = useCallback((serviceId) => {
        setServices((prev) =>
            prev.map((s) => (s.id === serviceId ? { ...s, isOpen: !s.isOpen } : s))
        );
    }, []);

    // ── Notifications ───────────────────────────────────
    const addNotification = useCallback((notif) => {
        const newNotif = {
            id: `n${Date.now()}`,
            userId: notif.userId || currentUser?.id,
            type: notif.type || 'info',
            title: notif.title,
            message: notif.message,
            timestamp: new Date().toISOString(),
            read: false,
        };
        setNotifications((prev) => [newNotif, ...prev]);
    }, [currentUser]);

    const markNotificationRead = useCallback((notifId) => {
        setNotifications((prev) =>
            prev.map((n) => (n.id === notifId ? { ...n, read: true } : n))
        );
    }, []);

    const markAllNotificationsRead = useCallback(() => {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }, []);

    // ── Computed Values ─────────────────────────────────
    const getQueueForService = useCallback(
        (serviceId) =>
            queueEntries
                .filter((q) => q.serviceId === serviceId && q.status === 'waiting')
                .sort((a, b) => a.position - b.position),
        [queueEntries]
    );

    const getUserQueueEntry = useCallback(
        (serviceId) => {
            if (!currentUser) return null;
            return queueEntries.find(
                (q) =>
                    q.userId === currentUser.id &&
                    q.serviceId === serviceId &&
                    q.status === 'waiting'
            );
        },
        [currentUser, queueEntries]
    );

    const getUserActiveQueues = useCallback(() => {
        if (!currentUser) return [];
        return queueEntries.filter(
            (q) => q.userId === currentUser.id && q.status === 'waiting'
        );
    }, [currentUser, queueEntries]);

    const getEstimatedWait = useCallback(
        (serviceId, position) => {
            const service = services.find((s) => s.id === serviceId);
            if (!service) return 0;
            return position * service.expectedDuration;
        },
        [services]
    );

    const getUserNotifications = useCallback(() => {
        if (!currentUser) return [];
        return notifications.filter((n) => n.userId === currentUser.id);
    }, [currentUser, notifications]);

    const getUnreadCount = useCallback(() => {
        return getUserNotifications().filter((n) => !n.read).length;
    }, [getUserNotifications]);

    const getUserHistory = useCallback(() => {
        if (!currentUser) return [];
        return history.filter((h) => h.userId === currentUser.id);
    }, [currentUser, history]);

    const value = {
        currentUser,
        services,
        queueEntries,
        history,
        notifications,
        stats,
        login,
        register,
        logout,
        joinQueue,
        leaveQueue,
        serveNext,
        markNoShow,
        reorderQueue,
        createService,
        updateService,
        toggleService,
        addNotification,
        markNotificationRead,
        markAllNotificationsRead,
        getQueueForService,
        getUserQueueEntry,
        getUserActiveQueues,
        getEstimatedWait,
        getUserNotifications,
        getUnreadCount,
        getUserHistory,
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
    const ctx = useContext(AppContext);
    if (!ctx) throw new Error('useApp must be used within AppProvider');
    return ctx;
}
