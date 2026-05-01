import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { API_BASE_URL } from '../config/api';

const AppContext = createContext(null);

export function AppProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(() => {
        try {
            const saved = localStorage.getItem('tutorcoogs_user');
            return saved ? JSON.parse(saved) : null;
        } catch { return null; }
    });
    const [services, setServices] = useState([]);
    const [queueEntries, setQueueEntries] = useState([]);
    const [history, setHistory] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [serviceInsights, setServiceInsights] = useState([]);
    const [stats, setStats] = useState({
        dailyVolume: [
            { day: 'Mon', count: 34 },
            { day: 'Tue', count: 42 },
            { day: 'Wed', count: 28 },
            { day: 'Thu', count: 51 },
            { day: 'Fri', count: 39 },
            { day: 'Sat', count: 15 },
            { day: 'Sun', count: 8 },
        ],
        avgWaitTime: 22,
        totalServedToday: 47,
        totalInQueue: 8,
        peakHour: '2:00 PM - 3:00 PM',
        serviceBreakdown: [
            { name: 'Calculus Help', count: 18, avgWait: 20 },
            { name: 'CS Tutoring', count: 14, avgWait: 28 },
            { name: 'Writing Center', count: 9, avgWait: 15 },
            { name: 'Physics Lab Prep', count: 4, avgWait: 30 },
            { name: 'Chemistry Review', count: 2, avgWait: 18 },
        ],
    });

    // ── Fetch helpers ───────────────────────────────
    const fetchServices = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/services`);
            if (res.ok) setServices(await res.json());
        } catch (e) {
            console.error('Failed to fetch services:', e);
        }
    }, []);

    const fetchQueue = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/queue`);
            if (res.ok) setQueueEntries(await res.json());
        } catch (e) {
            console.error('Failed to fetch queue:', e);
        }
    }, []);

    const fetchHistory = useCallback(async (userId) => {
        try {
            const url = userId ? `${API_BASE_URL}/history?userId=${userId}` : `${API_BASE_URL}/history`;
            const res = await fetch(url);
            if (res.ok) setHistory(await res.json());
        } catch (e) {
            console.error('Failed to fetch history:', e);
        }
    }, []);

    const fetchNotifications = useCallback(async (userId) => {
        try {
            if (!userId) return;
            const res = await fetch(`${API_BASE_URL}/notifications?userId=${userId}`);
            if (res.ok) setNotifications(await res.json());
        } catch (e) {
            console.error('Failed to fetch notifications:', e);
        }
    }, []);

    // Smart-feature insights: per-service historical wait sampling + drift.
    // Pulled alongside services so render-time wait calcs can stay synchronous.
    const fetchInsights = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/queue/insights`);
            if (res.ok) setServiceInsights(await res.json());
        } catch (e) {
            console.error('Failed to fetch service insights:', e);
        }
    }, []);

    // ── Refresh all data when user logs in ──────────
    const refreshAll = useCallback(async (user) => {
        await fetchServices();
        await fetchQueue();
        await fetchInsights();
        if (user) {
            await fetchHistory(user.id);
            await fetchNotifications(user.id);
        } else {
            await fetchHistory();
        }
    }, [fetchServices, fetchQueue, fetchInsights, fetchHistory, fetchNotifications]);

    // Load data on mount — if user was saved in localStorage, refresh everything
    useEffect(() => {
        fetchServices();
        fetchInsights();
        if (currentUser) {
            refreshAll(currentUser);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Auth ────────────────────────────────────────
    const login = useCallback(async (email, password) => {
        try {
            const res = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();
            if (!res.ok) {
                return { success: false, error: data.message || 'Login failed' };
            }
            setCurrentUser(data.user);
            localStorage.setItem('tutorcoogs_user', JSON.stringify(data.user));
            await refreshAll(data.user);
            return { success: true, user: data.user };
        } catch (e) {
            return { success: false, error: 'Cannot connect to server' };
        }
    }, [refreshAll]);

    const register = useCallback(async (name, email, password, role) => {
        try {
            const res = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password, role }),
            });
            const data = await res.json();
            if (!res.ok) {
                return { success: false, error: data.message || 'Registration failed' };
            }
            setCurrentUser(data.user);
            localStorage.setItem('tutorcoogs_user', JSON.stringify(data.user));
            await refreshAll(data.user);
            return { success: true, user: data.user };
        } catch (e) {
            return { success: false, error: 'Cannot connect to server' };
        }
    }, [refreshAll]);

    // Clears every user-derived cache so the next user can never see the
    // previous user's notifications / queue entries / history. We deliberately
    // wipe BOTH React state and any persisted localStorage keys here.
    const logout = useCallback(() => {
        setCurrentUser(null);
        setQueueEntries([]);
        setHistory([]);
        setNotifications([]);
        setServiceInsights([]);
        try {
            localStorage.removeItem('tutorcoogs_user');
            // Future-proof: clear anything else under our namespace.
            Object.keys(localStorage)
                .filter((k) => k.startsWith('tutorcoogs_'))
                .forEach((k) => localStorage.removeItem(k));
        } catch {
            // localStorage can throw in private/quota-exceeded contexts —
            // logging out should still succeed even if the cleanup fails.
        }
    }, []);

    // ── Queue Operations ────────────────────────────
    const joinQueue = useCallback(async (serviceId, notes = '', priority = 'normal') => {
        if (!currentUser) return { success: false, error: 'Not logged in' };
        try {
            const res = await fetch(`${API_BASE_URL}/queue/join`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: currentUser.id, serviceId, notes, priority }),
            });
            const data = await res.json();
            if (!res.ok) {
                return { success: false, error: data.message || 'Failed to join queue' };
            }
            await Promise.all([fetchQueue(), fetchInsights(), fetchNotifications(currentUser.id)]);
            return { success: true, entry: data };
        } catch (e) {
            return { success: false, error: 'Cannot connect to server' };
        }
    }, [currentUser, fetchQueue, fetchInsights, fetchNotifications]);

    const leaveQueue = useCallback(async (entryId) => {
        try {
            const res = await fetch(`${API_BASE_URL}/queue/leave/${entryId}`, { method: 'POST' });
            if (!res.ok) return;
            await Promise.all([
                fetchQueue(),
                fetchInsights(),
                currentUser ? fetchHistory(currentUser.id) : Promise.resolve(),
            ]);
        } catch (e) {
            console.error('Failed to leave queue:', e);
        }
    }, [currentUser, fetchQueue, fetchInsights, fetchHistory]);

    const serveNext = useCallback(async (serviceId) => {
        try {
            const res = await fetch(`${API_BASE_URL}/queue/serve/${serviceId}`, { method: 'POST' });
            if (!res.ok) return;
            await Promise.all([
                fetchQueue(),
                fetchInsights(),
                fetchHistory(),
                fetchNotifications(currentUser?.id),
            ]);
        } catch (e) {
            console.error('Failed to serve next:', e);
        }
    }, [currentUser, fetchQueue, fetchInsights, fetchHistory, fetchNotifications]);

    const markNoShow = useCallback(async (entryId) => {
        try {
            const res = await fetch(`${API_BASE_URL}/queue/no-show/${entryId}`, { method: 'POST' });
            if (!res.ok) return;
            await Promise.all([fetchQueue(), fetchInsights(), fetchHistory()]);
        } catch (e) {
            console.error('Failed to mark no-show:', e);
        }
    }, [fetchQueue, fetchInsights, fetchHistory]);

    const reorderQueue = useCallback(async (serviceId, entryId, direction) => {
        try {
            const res = await fetch(`${API_BASE_URL}/queue/reorder/${entryId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ direction }),
            });
            if (!res.ok) return;
            await Promise.all([fetchQueue(), fetchInsights()]);
        } catch (e) {
            console.error('Failed to reorder queue:', e);
        }
    }, [fetchQueue, fetchInsights]);

    // ── Service Management ──────────────────────────
    const createService = useCallback(async (serviceData) => {
        try {
            const res = await fetch(`${API_BASE_URL}/services`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(serviceData),
            });
            if (!res.ok) return null;
            const newService = await res.json();
            await fetchServices();
            return newService;
        } catch (e) {
            console.error('Failed to create service:', e);
            return null;
        }
    }, [fetchServices]);

    const updateService = useCallback(async (serviceId, updates) => {
        try {
            const res = await fetch(`${API_BASE_URL}/services/${serviceId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates),
            });
            if (!res.ok) return;
            await fetchServices();
        } catch (e) {
            console.error('Failed to update service:', e);
        }
    }, [fetchServices]);

    const toggleService = useCallback(async (serviceId) => {
        const service = services.find(s => s.id === serviceId);
        if (!service) return;
        await updateService(serviceId, { isOpen: !service.isOpen });
    }, [services, updateService]);

    // ── Notifications ───────────────────────────────
    const addNotification = useCallback((notif) => {
        // This is kept for local usage; backend generates notifications automatically
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

    const markNotificationRead = useCallback(async (notifId) => {
        try {
            await fetch(`${API_BASE_URL}/notifications/${notifId}/read`, { method: 'PUT' });
            setNotifications((prev) =>
                prev.map((n) => (n.id === notifId ? { ...n, read: true } : n))
            );
        } catch (e) {
            console.error('Failed to mark notification read:', e);
        }
    }, []);

    const markAllNotificationsRead = useCallback(async () => {
        if (!currentUser) return;
        try {
            await fetch(`${API_BASE_URL}/notifications/read-all/${currentUser.id}`, { method: 'PUT' });
            setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        } catch (e) {
            console.error('Failed to mark all notifications read:', e);
        }
    }, [currentUser]);

    const clearNotification = useCallback(async (notifId) => {
        try {
            const res = await fetch(`${API_BASE_URL}/notifications/${notifId}`, { method: 'DELETE' });
            if (!res.ok) return;
            setNotifications((prev) => prev.filter((n) => n.id !== notifId));
        } catch (e) {
            console.error('Failed to clear notification:', e);
        }
    }, []);

    const clearAllNotifications = useCallback(async () => {
        if (!currentUser) return;
        try {
            const res = await fetch(`${API_BASE_URL}/notifications/clear-all/${currentUser.id}`, {
                method: 'DELETE',
            });
            if (!res.ok) return;
            setNotifications((prev) => prev.filter((n) => n.userId !== currentUser.id));
        } catch (e) {
            console.error('Failed to clear all notifications:', e);
        }
    }, [currentUser]);

    // ── Computed Values ─────────────────────────────
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

    // ── Smart Wait-Time Estimator (client mirror) ───
    // Mirrors backend/routes/queue.js so render-time calls stay synchronous.
    //
    // Trade-off: we want the demo to *feel* responsive (estimates shift as
    // serves happen) but not so jumpy that a single fast/slow sample produces
    // a nonsensical estimate. So we require a small minimum sample size
    // before blending, and clamp drift between 0.5× and 2× of static.
    const SMART_MIN_SAMPLE = 3;
    const SMART_ASSUMED_POSITIONS = 2;
    // Floor at 0.5 — even if recent serves were near-instant, a newcomer in
    // line behind real waiting students should never see "~1 min" when the
    // static formula would say ~25 min. Capping the lower bound at half the
    // static estimate keeps things honest.
    const SMART_DRIFT_LOWER = 0.5;
    const SMART_DRIFT_UPPER = 2.0;

    const getEstimatedWait = useCallback(
        (serviceId, position) => {
            const service = services.find((s) => s.id === serviceId);
            if (!service) return 0;
            const insight = serviceInsights.find((i) => i.serviceId === serviceId);
            const staticEstimate = Math.max(0, (position - 1) * service.expectedDuration);
            // historicalAvgWait can legitimately be 0 (every served session was
            // near-instant). Only treat null/undefined as "no data".
            if (
                !insight ||
                insight.sampleSize < SMART_MIN_SAMPLE ||
                insight.historicalAvgWait == null
            ) {
                return staticEstimate;
            }
            const rawDrift =
                insight.historicalAvgWait /
                (SMART_ASSUMED_POSITIONS * service.expectedDuration);
            const drift = Math.max(SMART_DRIFT_LOWER, Math.min(SMART_DRIFT_UPPER, rawDrift));
            return Math.max(0, Math.round((position - 1) * service.expectedDuration * drift));
        },
        [services, serviceInsights]
    );

    // Returns metadata explaining how an estimate was produced.
    // basis: 'static' (no/low history) | 'blended' (using historical sampling)
    const getEstimateMeta = useCallback(
        (serviceId) => {
            const insight = serviceInsights.find((i) => i.serviceId === serviceId);
            if (!insight) {
                return { basis: 'static', sampleSize: 0, historicalAvgWait: null, driftFactor: null };
            }
            const hasUsableSample =
                insight.sampleSize >= SMART_MIN_SAMPLE &&
                insight.historicalAvgWait != null;
            return {
                basis: hasUsableSample ? 'blended' : 'static',
                sampleSize: insight.sampleSize,
                historicalAvgWait: insight.historicalAvgWait,
                driftFactor: insight.driftFactor,
            };
        },
        [serviceInsights]
    );

    // Suggests an open service in the same category whose smart estimate is at
    // most half the target's AND saves ≥ 10 minutes. Returns null otherwise.
    const RECOMMEND_RATIO = 0.5;
    const RECOMMEND_MIN_SAVED = 10;
    const getRecommendedAlternative = useCallback(
        (serviceId) => {
            const target = services.find((s) => s.id === serviceId);
            const targetInsight = serviceInsights.find((i) => i.serviceId === serviceId);
            if (!target || !targetInsight) return null;
            const targetEst = targetInsight.currentSmartEstimate;
            if (targetEst < RECOMMEND_MIN_SAVED * 2) return null;

            const better = serviceInsights
                .filter((i) =>
                    i.serviceId !== serviceId &&
                    i.isOpen &&
                    i.category === target.category &&
                    i.currentSmartEstimate <= targetEst * RECOMMEND_RATIO &&
                    targetEst - i.currentSmartEstimate >= RECOMMEND_MIN_SAVED
                )
                .sort((a, b) => a.currentSmartEstimate - b.currentSmartEstimate)[0];

            if (!better) return null;
            return {
                serviceId: better.serviceId,
                serviceName: better.serviceName,
                category: better.category,
                smartEstimate: better.currentSmartEstimate,
                waitingCount: better.waitingCount,
                minutesSaved: targetEst - better.currentSmartEstimate,
            };
        },
        [services, serviceInsights]
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
        serviceInsights,
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
        clearNotification,
        clearAllNotifications,
        getQueueForService,
        getUserQueueEntry,
        getUserActiveQueues,
        getEstimatedWait,
        getEstimateMeta,
        getRecommendedAlternative,
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
