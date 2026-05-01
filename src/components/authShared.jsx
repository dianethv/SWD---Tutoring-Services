import { useEffect, useMemo, useState } from 'react';
import { API_BASE_URL } from '../config/api';

// ── Custom paw mark (white SVG on UH-red square) ──────────────────────
// Replaces the multi-color emoji that clashed with the brand strip.
export function PawMark({ size = 32 }) {
    const inner = Math.round(size * 0.6);
    return (
        <span className="tc-mark" style={{ width: size, height: size }} aria-hidden="true">
            <svg width={inner} height={inner} viewBox="0 0 24 24" fill="currentColor">
                <ellipse cx="12" cy="16.5" rx="5.6" ry="4.4" />
                <ellipse cx="5.4" cy="10" rx="2" ry="2.8" />
                <ellipse cx="9.6" cy="6" rx="2" ry="2.9" />
                <ellipse cx="14.4" cy="6" rx="2" ry="2.9" />
                <ellipse cx="18.6" cy="10" rx="2" ry="2.8" />
            </svg>
        </span>
    );
}

// ── Wordmark (paw + name) ─────────────────────────────────────────────
export function Wordmark({ size = 32 }) {
    return (
        <div className="flex items-center gap-2.5">
            <PawMark size={size} />
            <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: 16, fontWeight: 700, color: '#1c1917', letterSpacing: '-0.01em' }}>
                Tutor<span style={{ color: '#C8102E' }}>Coogs</span>
            </span>
        </div>
    );
}

// ── Live insights hook — real service data from the backend ───────────
// Hits the same public /api/queue/insights endpoint the rest of the app
// uses. Returns one row per service with real waiting counts and smart
// wait-time estimates. Status mirrors the fetch lifecycle.
export function useLiveInsights() {
    const [insights, setInsights] = useState([]);
    const [status, setStatus] = useState('loading');

    useEffect(() => {
        let cancelled = false;
        fetch(`${API_BASE_URL}/queue/insights`)
            .then((r) => (r.ok ? r.json() : Promise.reject(r)))
            .then((data) => {
                if (cancelled) return;
                if (Array.isArray(data) && data.length > 0) {
                    setInsights(data);
                    setStatus('ready');
                } else {
                    setStatus('empty');
                }
            })
            .catch(() => {
                if (!cancelled) setStatus('error');
            });
        return () => {
            cancelled = true;
        };
    }, []);

    return { insights, status };
}

// ── Derived aggregate stats from insights ─────────────────────────────
export function useDerivedStats(insights) {
    return useMemo(() => {
        const open = insights.filter((s) => s.isOpen);
        const totalWaiting = insights.reduce((sum, s) => sum + (s.waitingCount || 0), 0);
        const avgWait =
            open.length > 0
                ? Math.round(open.reduce((sum, s) => sum + (s.currentSmartEstimate || 0), 0) / open.length)
                : 0;
        const busiest = open.slice().sort((a, b) => b.waitingCount - a.waitingCount)[0] || null;
        return {
            openCount: open.length,
            totalCount: insights.length,
            totalWaiting,
            avgWait,
            busiest,
        };
    }, [insights]);
}

// ── Per-service rotating ticket (for student / login views) ───────────
export function ServiceTicket({ insights, status }) {
    const open = insights.filter((s) => s.isOpen);
    const list = open.length > 0 ? open : insights;
    const [idx, setIdx] = useState(0);

    useEffect(() => {
        if (list.length <= 1) return undefined;
        const id = setInterval(() => setIdx((i) => (i + 1) % list.length), 4500);
        return () => clearInterval(id);
    }, [list.length]);

    if (list.length === 0) {
        return <TicketSkeleton message={status === 'error' ? 'Live data unavailable.' : 'No services live right now.'} />;
    }

    const safeIdx = Math.min(idx, list.length - 1);
    const s = list[safeIdx];
    const wait = Math.max(0, Math.round(s.currentSmartEstimate || 0));
    const inQueue = s.waitingCount || 0;

    return (
        <div className="tc-ticket tc-ticket-stripe" key={`${s.serviceId}-${safeIdx}`}>
            <div className="tc-ticket-cut-l" />
            <div className="tc-ticket-cut-r" />

            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span
                    className="tc-mono"
                    style={{ fontSize: 56, fontWeight: 700, color: '#1c1917', letterSpacing: '-0.04em', lineHeight: 1 }}
                >
                    {wait > 0 ? `~${wait}` : '0'}
                </span>
                <span
                    className="tc-mono"
                    style={{ fontSize: 12, color: '#a8a29e', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600 }}
                >
                    min wait
                </span>
            </div>

            <p style={{ fontSize: 14, fontWeight: 600, color: '#1c1917', marginTop: 14 }}>{s.serviceName}</p>
            <p style={{ fontSize: 12, color: '#78716c', marginTop: 2 }}>
                {s.category} · {s.expectedDuration} min sessions
            </p>

            <div className="tc-ticket-divider" />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11 }}>
                <span
                    className="tc-mono"
                    style={{ color: s.isOpen ? '#16a34a' : '#a8a29e', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 8, letterSpacing: '0.1em' }}
                >
                    {s.isOpen ? (
                        <>
                            <span className="tc-pulse-dot" /> LIVE
                        </>
                    ) : (
                        <>
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#a8a29e', display: 'inline-block' }} />
                            CLOSED
                        </>
                    )}
                </span>
                <span className="tc-mono" style={{ color: '#a8a29e', letterSpacing: '0.12em', fontWeight: 600 }}>
                    {inQueue} IN QUEUE
                </span>
            </div>
        </div>
    );
}

// ── Ops aggregate ticket (for admin / register-as-tutor view) ─────────
export function OpsTicket({ insights, status }) {
    const stats = useDerivedStats(insights);

    if (insights.length === 0) {
        return <TicketSkeleton message={status === 'error' ? 'Live data unavailable.' : 'No services configured.'} />;
    }

    return (
        <div className="tc-ticket tc-ticket-stripe">
            <div className="tc-ticket-cut-l" />
            <div className="tc-ticket-cut-r" />

            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                <span
                    className="tc-mono"
                    style={{ fontSize: 56, fontWeight: 700, color: '#1c1917', letterSpacing: '-0.04em', lineHeight: 1 }}
                >
                    {stats.totalWaiting}
                </span>
                <span
                    className="tc-mono"
                    style={{ fontSize: 12, color: '#a8a29e', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600 }}
                >
                    students queued
                </span>
            </div>

            <p style={{ fontSize: 14, fontWeight: 600, color: '#1c1917', marginTop: 14 }}>
                {stats.openCount} of {stats.totalCount} services live
            </p>
            <p style={{ fontSize: 12, color: '#78716c', marginTop: 2 }}>
                {stats.busiest
                    ? `Busiest: ${stats.busiest.serviceName} · ${stats.busiest.waitingCount} waiting`
                    : 'No active queues right now'}
            </p>

            <div className="tc-ticket-divider" />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11 }}>
                <span
                    className="tc-mono"
                    style={{ color: '#16a34a', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 8, letterSpacing: '0.1em' }}
                >
                    <span className="tc-pulse-dot" /> OPS LIVE
                </span>
                <span className="tc-mono" style={{ color: '#a8a29e', letterSpacing: '0.12em', fontWeight: 600 }}>
                    ~{stats.avgWait} MIN AVG WAIT
                </span>
            </div>
        </div>
    );
}

function TicketSkeleton({ message }) {
    return (
        <div className="tc-ticket tc-ticket-stripe" style={{ minHeight: 168 }}>
            <div className="tc-ticket-cut-l" />
            <div className="tc-ticket-cut-r" />
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span className="tc-mono" style={{ fontSize: 56, fontWeight: 700, color: '#e7e5e4', letterSpacing: '-0.04em', lineHeight: 1 }}>
                    --
                </span>
                <span
                    className="tc-mono"
                    style={{ fontSize: 12, color: '#d6d3d1', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600 }}
                >
                    min wait
                </span>
            </div>
            <p style={{ fontSize: 13, color: '#a8a29e', marginTop: 18 }}>{message}</p>
            <div className="tc-ticket-divider" />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11 }}>
                <span className="tc-mono" style={{ color: '#a8a29e', fontWeight: 700, letterSpacing: '0.1em' }}>OFFLINE</span>
                <span className="tc-mono" style={{ color: '#d6d3d1', letterSpacing: '0.12em' }}>—</span>
            </div>
        </div>
    );
}
