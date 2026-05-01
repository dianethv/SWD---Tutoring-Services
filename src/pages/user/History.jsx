import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { formatWait, averageWaitMinutes } from '../../utils/formatWait';

export default function History() {
    const { getUserHistory } = useApp();
    const history = getUserHistory();

    const servedHistory = history.filter((h) => h.outcome === 'served');
    const waitedHistory = history.filter((h) => h.waitTime);
    // Outlier-safe average — caps each sample so a 1289-min entry can't dominate.
    const avgWaitDisplay = formatWait(
        averageWaitMinutes(waitedHistory.map((h) => h.waitTime))
    );

    const outcomeMeta = (outcome) => {
        switch (outcome) {
            case 'served':
                return { label: 'SERVED', pill: 'tc-pill-success' };
            case 'cancelled':
                return { label: 'CANCELLED', pill: 'tc-pill-neutral' };
            case 'no-show':
                return { label: 'NO SHOW', pill: 'tc-pill-danger' };
            default:
                return { label: '—', pill: 'tc-pill-neutral' };
        }
    };

    /* ── Empty state ─────────────────────────────────────── */
    if (history.length === 0) {
        return (
            <div className="history-page">
                <section className="tc-page-hero">
                    <span className="tc-page-eyebrow">Receipts · Past Visits</span>
                    <h1 className="tc-page-headline" style={{ marginTop: 16 }}>
                        Session history<span className="tc-dot">.</span>
                    </h1>
                    <p className="tc-page-sub">
                        Every tutoring session you complete shows up here as a receipt — wait
                        times, outcomes, and timestamps.
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
                            Join your first queue
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="5" y1="12" x2="19" y2="12" />
                                <polyline points="12 5 19 12 12 19" />
                            </svg>
                        </Link>
                    </div>
                </section>

                <section style={{
                    background: '#FAF7F2',
                    backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(28, 25, 23, 0.06) 1px, transparent 0)',
                    backgroundSize: '22px 22px',
                    border: '1px solid #ece9e2',
                    borderRadius: 16,
                    padding: '40px 24px',
                    textAlign: 'center',
                }}>
                    <span className="tc-mono" style={{
                        fontSize: 11,
                        color: '#a8a29e',
                        letterSpacing: '0.16em',
                        fontWeight: 700,
                    }}>
                        NO RECEIPTS YET
                    </span>
                    <p style={{
                        fontSize: 14,
                        color: '#78716c',
                        margin: '12px 0 0 0',
                        maxWidth: 380,
                        marginLeft: 'auto',
                        marginRight: 'auto',
                        lineHeight: 1.55,
                    }}>
                        Join a queue and complete a session — your receipt will land here when
                        you're done.
                    </p>
                </section>
            </div>
        );
    }

    /* ── Active state ────────────────────────────────────── */
    return (
        <div className="history-page">
            {/* ── Hero ──────────────────────────────────────────── */}
            <section className="tc-page-hero">
                <span className="tc-page-eyebrow">Receipts · {history.length} past {history.length === 1 ? 'visit' : 'visits'}</span>
                <h1 className="tc-page-headline" style={{ marginTop: 16 }}>
                    Session history<span className="tc-dot">.</span>
                </h1>
                <p className="tc-page-sub">
                    A clean record of every tutoring session you've started or completed.
                    Use it to see your patterns and remember what worked.
                </p>
            </section>

            {/* ── Stats row ─────────────────────────────────────── */}
            <section style={{ marginBottom: 36 }}>
                <div className="tc-section-head">
                    <div>
                        <span className="tc-page-eyebrow">Your Numbers</span>
                        <h2 className="tc-section-title">At a glance</h2>
                    </div>
                </div>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: 16,
                }}>
                    <div className="tc-stat">
                        <p className="tc-stat-eyebrow"><span>Total Sessions</span></p>
                        <p className="tc-stat-value">{history.length}</p>
                        <p className="tc-stat-meta">
                            {history.length === 1 ? 'first visit logged' : 'across your account'}
                        </p>
                    </div>
                    <div className="tc-stat">
                        <p className="tc-stat-eyebrow"><span>Completed</span></p>
                        <p className="tc-stat-value">{servedHistory.length}</p>
                        <p className="tc-stat-meta">
                            {history.length > 0
                                ? `${Math.round((servedHistory.length / history.length) * 100)}% completion rate`
                                : 'no sessions yet'}
                        </p>
                    </div>
                    <div className="tc-stat">
                        <p className="tc-stat-eyebrow"><span>Avg Wait</span></p>
                        <p className="tc-stat-value">{avgWaitDisplay}</p>
                        <p className="tc-stat-meta">
                            {waitedHistory.length > 0
                                ? `across ${waitedHistory.length} ${waitedHistory.length === 1 ? 'session' : 'sessions'}`
                                : 'no wait data'}
                        </p>
                    </div>
                </div>
            </section>

            {/* ── Receipt-style list ───────────────────────────── */}
            <section style={{ marginBottom: 36 }}>
                <div className="tc-section-head">
                    <div>
                        <span className="tc-page-eyebrow">Receipts · Newest First</span>
                        <h2 className="tc-section-title">Every visit</h2>
                    </div>
                </div>
                <div className="tc-card-flush">
                    {history.map((h, i) => {
                        const meta = outcomeMeta(h.outcome);
                        const isLast = i === history.length - 1;
                        return (
                            <div
                                key={h.id}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    flexWrap: 'wrap',
                                    gap: 14,
                                    padding: '20px 26px',
                                    borderBottom: isLast ? 'none' : '1px dashed #ece9e2',
                                    transition: 'background 0.15s',
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.background = '#fafaf9')}
                                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                            >
                                {/* Left: date + service info */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 18, minWidth: 0, flex: '1 1 240px' }}>
                                    <span
                                        className="tc-mono"
                                        style={{
                                            fontSize: 11,
                                            color: '#a8a29e',
                                            letterSpacing: '0.12em',
                                            minWidth: 96,
                                            textTransform: 'uppercase',
                                            fontWeight: 600,
                                            flexShrink: 0,
                                        }}
                                    >
                                        {h.date}
                                    </span>
                                    <div style={{ minWidth: 0 }}>
                                        <p style={{
                                            fontFamily: 'Outfit, sans-serif',
                                            fontWeight: 600,
                                            color: '#1c1917',
                                            margin: 0,
                                            fontSize: 15,
                                            letterSpacing: '-0.005em',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                        }}>
                                            {h.serviceName}
                                        </p>
                                        <p
                                            className="tc-mono"
                                            style={{
                                                fontSize: 11,
                                                color: '#a8a29e',
                                                margin: '4px 0 0 0',
                                                letterSpacing: '0.06em',
                                            }}
                                        >
                                            {h.joinedAt}
                                            {h.servedAt ? ` → ${h.servedAt}` : ''}
                                        </p>
                                    </div>
                                </div>

                                {/* Right: wait time + outcome pill */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
                                    {h.waitTime != null && h.waitTime > 0 && (
                                        <span className="tc-mono" style={{
                                            fontSize: 12,
                                            color: '#78716c',
                                            letterSpacing: '0.06em',
                                            fontWeight: 600,
                                        }}>
                                            {formatWait(h.waitTime)} wait
                                        </span>
                                    )}
                                    <span className={`tc-pill ${meta.pill}`}>{meta.label}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>
        </div>
    );
}
