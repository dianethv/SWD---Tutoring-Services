import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { formatWait, averageWaitMinutes } from '../../utils/formatWait';

export default function Dashboard() {
    const { currentUser, services, getUserActiveQueues, getEstimatedWait, getUserNotifications, getUserHistory } = useApp();
    const activeQueues = getUserActiveQueues();
    const recentNotifs = getUserNotifications().filter((n) => !n.read);
    const history = getUserHistory();
    const openServices = services.filter((s) => s.isOpen);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    };

    const firstName = currentUser?.name?.split(' ')[0] || 'there';
    const servedHistory = history.filter((h) => h.outcome === 'served');
    const waitedHistory = history.filter((h) => h.waitTime);
    const servedCount = servedHistory.length;
    // averageWaitMinutes caps each sample so a single 1289-min outlier
    // (e.g. someone joined yesterday and was served today) can't dominate.
    const avgWaitRaw = averageWaitMinutes(waitedHistory.map((h) => h.waitTime));
    const avgWaitDisplay = formatWait(avgWaitRaw);

    // Hero "my queue" ticket — features the user's first active queue.
    const heroQueue = activeQueues[0];
    const heroService = heroQueue ? services.find((s) => s.id === heroQueue.serviceId) : null;
    const heroEta = heroQueue ? getEstimatedWait(heroQueue.serviceId, heroQueue.position) : 0;

    return (
        <div className="dashboard-page">
            {/* ── Hero ────────────────────────────────────────────────── */}
            <section className="tc-page-hero">
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 320px)',
                        gap: 32,
                        alignItems: 'center',
                    }}
                    className="dashboard-hero-grid"
                >
                    <div>
                        <span className="tc-page-eyebrow">
                            {activeQueues.length > 0 ? 'Live Queue · You\'re In' : 'Tutoring Center · Live'}
                        </span>
                        <h1 className="tc-page-headline" style={{ marginTop: 16 }}>
                            {getGreeting()}, {firstName}
                            <span className="tc-dot">.</span>
                        </h1>
                        <p className="tc-page-sub">
                            {activeQueues.length > 0
                                ? `You're in ${activeQueues.length} ${activeQueues.length > 1 ? 'queues' : 'queue'} right now. We'll notify you before your turn — keep studying.`
                                : `Browse ${openServices.length} live tutoring ${openServices.length === 1 ? 'service' : 'services'}. Hop in a queue and we'll notify you when it's your turn.`}
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
                            {activeQueues.length > 0 && (
                                <Link
                                    to="/queue-status"
                                    style={{
                                        padding: '12px 22px',
                                        borderRadius: 12,
                                        background: '#ffffff',
                                        color: '#1c1917',
                                        fontSize: 13,
                                        fontWeight: 600,
                                        textDecoration: 'none',
                                        border: '1px solid #ece9e2',
                                        transition: 'border-color 0.2s, color 0.2s',
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#1c1917'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#ece9e2'; }}
                                >
                                    View live tracking
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* Hero ticket — user's primary queue or a CTA card */}
                    <div className="dashboard-hero-ticket">
                        {heroQueue && heroService ? (
                            <Link to="/queue-status" style={{ textDecoration: 'none', display: 'block' }}>
                                <div className="tc-ticket tc-ticket-stripe" style={{ padding: '24px 28px' }}>
                                    <div className="tc-ticket-cut-l" />
                                    <div className="tc-ticket-cut-r" />

                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                                        <span className="tc-pill tc-pill-brand">YOUR TICKET</span>
                                        <span style={{ fontSize: 11, fontWeight: 700, color: '#a8a29e', letterSpacing: '0.12em', fontFamily: 'JetBrains Mono, monospace' }}>
                                            #{heroQueue.id?.slice(-4).toUpperCase() || '0001'}
                                        </span>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                                        <span className="tc-mono" style={{ fontSize: 56, fontWeight: 700, color: '#1c1917', letterSpacing: '-0.04em', lineHeight: 1 }}>
                                            #{heroQueue.position}
                                        </span>
                                        <span className="tc-mono" style={{ fontSize: 12, color: '#a8a29e', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600 }}>
                                            in line
                                        </span>
                                    </div>

                                    <p style={{ fontSize: 14, fontWeight: 600, color: '#1c1917', marginTop: 14 }}>{heroService.name}</p>
                                    <p style={{ fontSize: 12, color: '#78716c', marginTop: 2 }}>
                                        {heroService.category} · {heroEta > 0 ? formatWait(heroEta, { prefix: '~' }) : '<1m'} wait
                                    </p>

                                    <div className="tc-ticket-divider" />

                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11 }}>
                                        <span className="tc-pill tc-pill-success">
                                            <span className="tc-pulse-dot" /> {heroQueue.position === 1 ? "YOU'RE NEXT" : 'WAITING'}
                                        </span>
                                        <span className="tc-mono" style={{ color: '#a8a29e', letterSpacing: '0.12em', fontWeight: 600 }}>
                                            VIEW LIVE →
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ) : (
                            <div className="tc-ticket tc-ticket-stripe" style={{ padding: '24px 28px' }}>
                                <div className="tc-ticket-cut-l" />
                                <div className="tc-ticket-cut-r" />

                                <span className="tc-pill tc-pill-neutral">NO TICKET YET</span>

                                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 16 }}>
                                    <span className="tc-mono" style={{ fontSize: 56, fontWeight: 700, color: '#1c1917', letterSpacing: '-0.04em', lineHeight: 1 }}>
                                        {openServices.length}
                                    </span>
                                    <span className="tc-mono" style={{ fontSize: 12, color: '#a8a29e', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600 }}>
                                        live services
                                    </span>
                                </div>

                                <p style={{ fontSize: 14, fontWeight: 600, color: '#1c1917', marginTop: 14 }}>
                                    Ready when you are.
                                </p>
                                <p style={{ fontSize: 12, color: '#78716c', marginTop: 2 }}>
                                    Pick a service and grab a ticket.
                                </p>

                                <div className="tc-ticket-divider" />

                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11 }}>
                                    <span className="tc-pill tc-pill-success">
                                        <span className="tc-pulse-dot" /> CENTER OPEN
                                    </span>
                                    <Link
                                        to="/join-queue"
                                        style={{ color: '#1c1917', fontWeight: 700, fontSize: 11, letterSpacing: '0.12em', fontFamily: 'JetBrains Mono, monospace', textDecoration: 'none' }}
                                    >
                                        JOIN →
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* ── Stats row ─────────────────────────────────────────── */}
            <section style={{ marginBottom: 36 }}>
                <div className="tc-section-head">
                    <div>
                        <span className="tc-page-eyebrow">Your Overview</span>
                        <h2 className="tc-section-title">At a glance</h2>
                    </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                    {[
                        { label: 'Active Queues', value: activeQueues.length, meta: activeQueues.length > 0 ? `next: ${services.find((s) => s.id === activeQueues[0].serviceId)?.name || '—'}` : 'not in any queue' },
                        { label: 'Sessions Done', value: servedCount, meta: servedCount > 0 ? `${servedHistory[0]?.serviceName || ''} most recent` : 'no sessions yet' },
                        { label: 'Unread Alerts', value: recentNotifs.length, meta: recentNotifs.length > 0 ? 'check the bell' : 'all caught up' },
                        { label: 'Avg Wait', value: avgWaitDisplay, meta: waitedHistory.length > 0 ? `across ${waitedHistory.length} sessions` : 'first time soon' },
                    ].map((stat) => (
                        <div key={stat.label} className="tc-stat">
                            <p className="tc-stat-eyebrow">
                                <span>{stat.label}</span>
                            </p>
                            <p className="tc-stat-value">{stat.value}</p>
                            <p className="tc-stat-meta">{stat.meta}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── Active queues ─────────────────────────────────────── */}
            {activeQueues.length > 0 && (
                <section style={{ marginBottom: 36 }}>
                    <div className="tc-section-head">
                        <div>
                            <span className="tc-page-eyebrow">Live · Updates Every Few Seconds</span>
                            <h2 className="tc-section-title">Your active queues</h2>
                        </div>
                        <Link to="/queue-status" className="tc-link">
                            View details
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="5" y1="12" x2="19" y2="12" />
                                <polyline points="12 5 19 12 12 19" />
                            </svg>
                        </Link>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                        {activeQueues.map((q) => {
                            const service = services.find((s) => s.id === q.serviceId);
                            const eta = getEstimatedWait(q.serviceId, q.position);
                            const isNext = q.position === 1;
                            return (
                                <Link
                                    to="/queue-status"
                                    key={q.id}
                                    className="tc-lift"
                                    style={{
                                        textDecoration: 'none',
                                        background: '#ffffff',
                                        border: '1px solid #e7e5e4',
                                        borderTop: `3px solid ${isNext ? '#16a34a' : '#C8102E'}`,
                                        borderRadius: 14,
                                        padding: 22,
                                        display: 'block',
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                                        <span className="tc-stat-eyebrow" style={{ margin: 0 }}>{service?.category || '—'}</span>
                                        {isNext ? (
                                            <span className="tc-pill tc-pill-success">
                                                <span className="tc-pulse-dot" /> NEXT UP
                                            </span>
                                        ) : (
                                            <span className="tc-pill tc-pill-brand">WAITING</span>
                                        )}
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                                        <span className="tc-mono" style={{ fontSize: 44, fontWeight: 700, color: '#1c1917', letterSpacing: '-0.035em', lineHeight: 1 }}>
                                            #{q.position}
                                        </span>
                                        <span className="tc-mono" style={{ fontSize: 11, color: '#a8a29e', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600 }}>
                                            position
                                        </span>
                                    </div>
                                    <p style={{ fontSize: 14, fontWeight: 600, color: '#1c1917', marginTop: 12 }}>{service?.name || 'Service'}</p>

                                    <div className="tc-divider-dashed" />

                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11 }}>
                                        <span className="tc-mono" style={{ color: '#78716c', letterSpacing: '0.1em', fontWeight: 600 }}>
                                            ETA <span style={{ color: '#1c1917' }}>{eta > 0 ? formatWait(eta, { prefix: '~' }).toUpperCase() : '<1M'}</span>
                                        </span>
                                        <span className="tc-mono" style={{ color: '#a8a29e', letterSpacing: '0.12em', fontWeight: 600 }}>
                                            VIEW →
                                        </span>
                                    </div>

                                    <div className="tc-bar-track" style={{ marginTop: 14 }}>
                                        <div
                                            className="tc-bar-fill"
                                            style={{ width: `${Math.max(15, 100 - (q.position - 1) * 25)}%` }}
                                        />
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </section>
            )}

            {/* ── Available services ────────────────────────────────── */}
            <section style={{ marginBottom: 36 }}>
                <div className="tc-section-head">
                    <div>
                        <span className="tc-page-eyebrow">Open Now · {openServices.length} {openServices.length === 1 ? 'service' : 'services'}</span>
                        <h2 className="tc-section-title">Available services</h2>
                    </div>
                    <Link to="/join-queue" className="tc-link">
                        Browse all
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="5" y1="12" x2="19" y2="12" />
                            <polyline points="12 5 19 12 12 19" />
                        </svg>
                    </Link>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
                    {openServices.slice(0, 6).map((service) => (
                        <Link
                            to="/join-queue"
                            key={service.id}
                            className="tc-lift"
                            style={{
                                textDecoration: 'none',
                                background: '#ffffff',
                                border: '1px solid #e7e5e4',
                                borderRadius: 14,
                                padding: 22,
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                gap: 16,
                            }}
                        >
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                                    <span className="tc-stat-eyebrow" style={{ margin: 0 }}>{service.category}</span>
                                    <span className="tc-pill tc-pill-success">
                                        <span className="tc-pulse-dot" /> OPEN
                                    </span>
                                </div>
                                <p style={{ fontSize: 16, fontWeight: 600, color: '#1c1917', margin: '0 0 6px 0', letterSpacing: '-0.005em' }}>
                                    {service.name}
                                </p>
                                <p style={{ fontSize: 13, color: '#78716c', lineHeight: 1.55, margin: 0 }}>{service.description}</p>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 14, borderTop: '1px dashed #e7e5e4' }}>
                                <span className="tc-mono" style={{ fontSize: 11, color: '#78716c', letterSpacing: '0.1em', fontWeight: 600 }}>
                                    ~{service.expectedDuration}M SESSION
                                </span>
                                <span style={{ fontSize: 11, fontWeight: 600, color: '#1c1917', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                    Join
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="5" y1="12" x2="19" y2="12" />
                                        <polyline points="12 5 19 12 12 19" />
                                    </svg>
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            </section>

            {/* ── Recent activity ───────────────────────────────────── */}
            {history.length > 0 && (
                <section style={{ marginBottom: 36 }}>
                    <div className="tc-section-head">
                        <div>
                            <span className="tc-page-eyebrow">Receipts</span>
                            <h2 className="tc-section-title">Recent activity</h2>
                        </div>
                        <Link to="/history" className="tc-link">
                            Full history
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="5" y1="12" x2="19" y2="12" />
                                <polyline points="12 5 19 12 12 19" />
                            </svg>
                        </Link>
                    </div>
                    <div className="tc-card-flush">
                        {history.slice(0, 5).map((h, i) => {
                            const pillClass =
                                h.outcome === 'served' ? 'tc-pill-success' :
                                h.outcome === 'cancelled' ? 'tc-pill-neutral' : 'tc-pill-danger';
                            const pillLabel = h.outcome === 'served' ? 'SERVED' : h.outcome === 'cancelled' ? 'CANCELLED' : 'NO SHOW';
                            return (
                                <div
                                    key={h.id}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        flexWrap: 'wrap',
                                        gap: 12,
                                        padding: '18px 24px',
                                        borderBottom: i < Math.min(history.length, 5) - 1 ? '1px dashed #ece9e2' : 'none',
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, minWidth: 0, flex: '1 1 200px' }}>
                                        <span
                                            className="tc-mono"
                                            style={{ fontSize: 11, color: '#a8a29e', letterSpacing: '0.12em', minWidth: 90, textTransform: 'uppercase', fontWeight: 600 }}
                                        >
                                            {h.date}
                                        </span>
                                        <div style={{ minWidth: 0 }}>
                                            <p style={{ fontWeight: 600, color: '#1c1917', margin: 0, fontSize: 14 }}>{h.serviceName}</p>
                                            <p className="tc-mono" style={{ fontSize: 11, color: '#a8a29e', margin: '4px 0 0 0', letterSpacing: '0.06em' }}>
                                                {h.joinedAt}{h.servedAt ? ` → ${h.servedAt}` : ''}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="dashboard-activity-meta" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                        {h.waitTime != null && h.waitTime > 0 && (
                                            <span className="tc-mono" style={{ fontSize: 12, color: '#78716c', letterSpacing: '0.06em', fontWeight: 600 }}>
                                                {formatWait(h.waitTime)} wait
                                            </span>
                                        )}
                                        <span className={`tc-pill ${pillClass}`}>{pillLabel}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}

            {/* ── Tips ──────────────────────────────────────────────── */}
            <section className="tc-tip">
                <span className="tc-page-eyebrow">Pro Tips</span>
                <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 18, fontWeight: 700, color: '#1c1917', margin: '12px 0 14px 0', letterSpacing: '-0.012em' }}>
                    Make the most of your visit
                </h3>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                    {[
                        ['Come prepared', 'Bring your notes and specific questions for a more productive session.'],
                        ['Watch notifications', "We alert you 2 spots before your turn so you don't miss it."],
                        ['Pick off-peak hours', 'Mornings and late afternoons usually have the shortest waits.'],
                    ].map(([title, body], i) => (
                        <li
                            key={title}
                            style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: 14,
                                padding: '10px 0',
                                borderBottom: i < 2 ? '1px dashed #ece9e2' : 'none',
                            }}
                        >
                            <span className="tc-mono" style={{ fontSize: 11, color: '#C8102E', fontWeight: 700, paddingTop: 3, minWidth: 22 }}>
                                0{i + 1}
                            </span>
                            <span style={{ fontSize: 13, color: '#44403c', lineHeight: 1.55 }}>
                                <strong style={{ color: '#1c1917' }}>{title}.</strong> {body}
                            </span>
                        </li>
                    ))}
                </ul>
            </section>
        </div>
    );
}
