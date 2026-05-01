import { useApp } from '../../context/AppContext';
import { Link } from 'react-router-dom';
import { formatWait } from '../../utils/formatWait';

export default function QueueStatus() {
    const { services, getUserActiveQueues, getEstimatedWait, leaveQueue } = useApp();
    const activeQueues = getUserActiveQueues();

    /* ── Empty State ─────────────────────────────── */
    if (activeQueues.length === 0) {
        return (
            <div className="queue-status-page">
                <section className="tc-page-hero">
                    <span className="tc-page-eyebrow">Live Tracker · Idle</span>
                    <h1 className="tc-page-headline" style={{ marginTop: 16 }}>
                        Nothing to track yet<span className="tc-dot">.</span>
                    </h1>
                    <p className="tc-page-sub">
                        You're not in any queues right now. Pick a tutoring service and we'll
                        start the live tracker for you here.
                    </p>
                    <div style={{ marginTop: 24, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <Link
                            to="/join-queue"
                            style={{
                                padding: '12px 22px',
                                borderRadius: 12,
                                background: '#C8102E',
                                color: '#fff',
                                fontSize: 13,
                                fontWeight: 600,
                                textDecoration: 'none',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 8,
                                boxShadow: '0 4px 14px -6px rgba(200, 16, 46, 0.45)',
                                transition: 'background 0.2s, transform 0.2s',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = '#960C22'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = '#C8102E'; e.currentTarget.style.transform = 'translateY(0)'; }}
                        >
                            Join a queue
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="5" y1="12" x2="19" y2="12" />
                                <polyline points="12 5 19 12 12 19" />
                            </svg>
                        </Link>
                    </div>
                </section>
            </div>
        );
    }

    /* ── Active Queues ───────────────────────────── */
    return (
        <div className="queue-status-page">
            {/* ── Hero ────────────────────────────────────────────────── */}
            <section className="tc-page-hero">
                <span className="tc-page-eyebrow">Live · Updates Every Few Seconds</span>
                <h1 className="tc-page-headline" style={{ marginTop: 16 }}>
                    {activeQueues.length === 1 ? "You're in line" : 'Your live queues'}
                    <span className="tc-dot">.</span>
                </h1>
                <p className="tc-page-sub">
                    Tracking {activeQueues.length}{' '}
                    {activeQueues.length === 1 ? 'queue' : 'queues'} in real time. We'll
                    notify you a couple of spots before your turn — keep this tab open or
                    just check back.
                </p>
            </section>

            {/* ── Section header ───────────────────────────────────── */}
            <section style={{ marginBottom: 36 }}>
                <div className="tc-section-head">
                    <div>
                        <span className="tc-page-eyebrow">Active Tickets</span>
                        <h2 className="tc-section-title">
                            {activeQueues.length} {activeQueues.length === 1 ? 'queue' : 'queues'} active
                        </h2>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                    {activeQueues.map((q) => {
                        const service = services.find((s) => s.id === q.serviceId);
                        const eta = getEstimatedWait(q.serviceId, q.position);
                        const progressPct = Math.max(15, 100 - (q.position - 1) * 25);
                        const isNext = q.position === 1;
                        const isAlmostReady = q.position <= 2;
                        const minAgo = Math.round((Date.now() - new Date(q.joinedAt).getTime()) / 60000);

                        const accent = isNext ? '#16a34a' : isAlmostReady ? '#ea580c' : '#C8102E';
                        const statusLabel = isNext ? 'YOU\'RE NEXT' : isAlmostReady ? 'ALMOST READY' : 'WAITING';
                        const statusPillClass = isNext
                            ? 'tc-pill-success'
                            : isAlmostReady
                                ? 'tc-pill-warning'
                                : 'tc-pill-brand';

                        const steps = [
                            { label: 'Joined', done: true },
                            { label: 'Waiting', done: q.position <= 3 },
                            { label: 'Almost ready', done: q.position <= 2 },
                            { label: 'Your turn', done: q.position === 1 },
                        ];

                        return (
                            <div
                                key={q.id}
                                style={{
                                    background: '#ffffff',
                                    border: '1px solid #e7e5e4',
                                    borderTop: `3px solid ${accent}`,
                                    borderRadius: 16,
                                    overflow: 'hidden',
                                }}
                            >
                                <div className="queue-status-card-body" style={{ padding: 26 }}>
                                    {/* Header row: category eyebrow + status pill */}
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        gap: 12,
                                        flexWrap: 'wrap',
                                        marginBottom: 14,
                                    }}>
                                        <span className="tc-stat-eyebrow" style={{ margin: 0 }}>
                                            {service?.category || '—'}
                                        </span>
                                        <span className={`tc-pill ${statusPillClass}`}>
                                            {(isNext || isAlmostReady) && <span className="tc-pulse-dot" style={isNext ? {} : { background: '#ea580c' }} />}
                                            {statusLabel}
                                        </span>
                                    </div>

                                    {/* Service title + notes */}
                                    <div style={{ marginBottom: 22 }}>
                                        <h2 style={{
                                            fontFamily: 'Outfit, sans-serif',
                                            fontSize: 22,
                                            fontWeight: 700,
                                            color: '#1c1917',
                                            margin: 0,
                                            letterSpacing: '-0.012em',
                                        }}>
                                            {service?.name || 'Service'}
                                        </h2>
                                        {q.notes && (
                                            <p className="tc-mono" style={{
                                                fontSize: 12,
                                                color: '#78716c',
                                                margin: '6px 0 0 0',
                                                letterSpacing: '0.02em',
                                            }}>
                                                "{q.notes}"
                                            </p>
                                        )}
                                    </div>

                                    {/* Stat tiles: Position · ETA · Joined */}
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                                        gap: 12,
                                        marginBottom: 22,
                                    }}>
                                        {/* Position */}
                                        <div style={{
                                            background: '#fafaf9',
                                            border: '1px solid #ece9e2',
                                            borderRadius: 12,
                                            padding: '16px 18px',
                                        }}>
                                            <p className="tc-stat-eyebrow" style={{ margin: '0 0 12px 0' }}>Position</p>
                                            <p className="tc-mono" style={{
                                                fontSize: 38,
                                                fontWeight: 700,
                                                color: accent,
                                                margin: 0,
                                                lineHeight: 1,
                                                letterSpacing: '-0.035em',
                                            }}>
                                                #{q.position}
                                            </p>
                                        </div>

                                        {/* ETA */}
                                        <div style={{
                                            background: '#fafaf9',
                                            border: '1px solid #ece9e2',
                                            borderRadius: 12,
                                            padding: '16px 18px',
                                        }}>
                                            <p className="tc-stat-eyebrow" style={{ margin: '0 0 12px 0' }}>Est. wait</p>
                                            <p className="tc-mono" style={{
                                                fontSize: 38,
                                                fontWeight: 700,
                                                color: '#1c1917',
                                                margin: 0,
                                                lineHeight: 1,
                                                letterSpacing: '-0.035em',
                                            }}>
                                                {eta > 0 ? formatWait(eta) : '<1m'}
                                            </p>
                                        </div>

                                        {/* Joined */}
                                        <div style={{
                                            background: '#fafaf9',
                                            border: '1px solid #ece9e2',
                                            borderRadius: 12,
                                            padding: '16px 18px',
                                        }}>
                                            <p className="tc-stat-eyebrow" style={{ margin: '0 0 12px 0' }}>Joined</p>
                                            <p style={{
                                                fontFamily: 'Outfit, sans-serif',
                                                fontSize: 22,
                                                fontWeight: 700,
                                                color: '#1c1917',
                                                margin: 0,
                                                lineHeight: 1,
                                                letterSpacing: '-0.015em',
                                            }}>
                                                {new Date(q.joinedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                            <p className="tc-mono" style={{
                                                fontSize: 11,
                                                color: '#a8a29e',
                                                margin: '8px 0 0 0',
                                                letterSpacing: '0.06em',
                                            }}>
                                                {minAgo}M AGO
                                            </p>
                                        </div>
                                    </div>

                                    {/* Progress bar */}
                                    <div style={{ marginBottom: 22 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                            <span className="tc-mono" style={{ fontSize: 11, color: '#78716c', letterSpacing: '0.1em', fontWeight: 600 }}>
                                                PROGRESS
                                            </span>
                                            <span className="tc-mono" style={{ fontSize: 11, color: '#1c1917', letterSpacing: '0.1em', fontWeight: 700 }}>
                                                {Math.round(progressPct)}%
                                            </span>
                                        </div>
                                        <div className="tc-bar-track">
                                            <div
                                                className="tc-bar-fill"
                                                style={{
                                                    width: `${progressPct}%`,
                                                    background: isNext
                                                        ? 'linear-gradient(90deg, #16a34a, #22c55e)'
                                                        : isAlmostReady
                                                            ? 'linear-gradient(90deg, #ea580c, #f97316)'
                                                            : 'linear-gradient(90deg, #C8102E, #E8384F)',
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {/* Step timeline */}
                                    <div style={{ overflowX: 'auto', marginBottom: 22 }}>
                                        <div
                                            className="queue-status-timeline"
                                            style={{
                                                display: 'flex',
                                                alignItems: 'flex-start',
                                                padding: '18px 22px',
                                                borderRadius: 12,
                                                background: '#fafaf9',
                                                border: '1px solid #ece9e2',
                                                minWidth: 560,
                                            }}
                                        >
                                            {steps.map((step, i) => (
                                                <div key={step.label} style={{ display: 'contents' }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, minWidth: 80 }}>
                                                        <div
                                                            className="tc-mono"
                                                            style={{
                                                                width: 32,
                                                                height: 32,
                                                                borderRadius: '50%',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                fontSize: 12,
                                                                fontWeight: 700,
                                                                background: step.done ? accent : '#fff',
                                                                color: step.done ? '#fff' : '#a8a29e',
                                                                border: step.done ? 'none' : '1.5px solid #d6d3d1',
                                                                transition: 'all 0.3s',
                                                                flexShrink: 0,
                                                                boxShadow: step.done ? `0 2px 8px ${accent}33` : 'none',
                                                            }}
                                                        >
                                                            {step.done ? '✓' : i + 1}
                                                        </div>
                                                        <span
                                                            className="tc-mono"
                                                            style={{
                                                                fontSize: 10,
                                                                fontWeight: 700,
                                                                color: step.done ? accent : '#a8a29e',
                                                                whiteSpace: 'nowrap',
                                                                letterSpacing: '0.08em',
                                                                textTransform: 'uppercase',
                                                            }}
                                                        >
                                                            {step.label}
                                                        </span>
                                                    </div>
                                                    {i < steps.length - 1 && (
                                                        <div
                                                            style={{
                                                                flex: 1,
                                                                height: 1.5,
                                                                marginTop: 16,
                                                                background: steps[i + 1].done ? accent : '#e7e5e4',
                                                                transition: 'background 0.3s',
                                                            }}
                                                        />
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Leave queue button */}
                                    <button
                                        onClick={() => leaveQueue(q.id)}
                                        style={{
                                            width: '100%',
                                            padding: '12px 16px',
                                            borderRadius: 10,
                                            border: '1px solid #fecaca',
                                            background: '#fff',
                                            color: '#991b1b',
                                            fontSize: 13,
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            transition: 'all 0.15s',
                                            fontFamily: 'inherit',
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = '#fef2f2'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}
                                    >
                                        Leave queue
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>
        </div>
    );
}
