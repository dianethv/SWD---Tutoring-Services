import { useApp } from '../../context/AppContext';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
    const { currentUser, services, queueEntries: queue, toggleService, stats } = useApp();

    const getDisplayName = () => {
        const parts = currentUser?.name?.split(' ') || [];
        return parts.length >= 3 ? `${parts[0]} ${parts[parts.length - 1]}` : currentUser?.name || 'Admin';
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    };

    const activeStudents = queue.filter((q) => q.status === 'waiting' || q.status === 'almost_ready').length;
    const openServices = services.filter((s) => s.isOpen).length;

    const serviceStats = services.map((s) => {
        const inQueue = queue.filter((q) => q.serviceId === s.id && (q.status === 'waiting' || q.status === 'almost_ready')).length;
        return { ...s, inQueue };
    });

    const busiest = serviceStats
        .filter((s) => s.isOpen)
        .slice()
        .sort((a, b) => b.inQueue - a.inQueue)[0];

    const rawVolume = stats?.dailyVolume || [];
    const dailyVolume = rawVolume.map((d) => (typeof d === 'object' ? d.count : d));
    const dayLabels =
        rawVolume.length > 0 && typeof rawVolume[0] === 'object'
            ? rawVolume.map((d) => d.day)
            : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const maxVol = Math.max(...dailyVolume, 1);
    const totalVol = dailyVolume.reduce((a, b) => a + b, 0);
    const todayIdx = ((new Date().getDay() + 6) % 7); // Mon=0 ... Sun=6

    return (
        <div className="admin-dashboard-page">
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
                        <span className="tc-page-eyebrow">Admin Console · Live</span>
                        <h1 className="tc-page-headline" style={{ marginTop: 16 }}>
                            {getGreeting()}, {getDisplayName()}<span className="tc-dot">.</span>
                        </h1>
                        <p className="tc-page-sub">
                            {activeStudents > 0
                                ? `${activeStudents} ${activeStudents === 1 ? 'student is' : 'students are'} waiting across ${openServices} live ${openServices === 1 ? 'service' : 'services'}. Keep things moving.`
                                : 'All queues are clear. A great moment to review services and prep for upcoming sessions.'}
                        </p>
                        <div style={{ marginTop: 24, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                            <Link
                                to="/admin/queues"
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
                                Manage queues
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="5" y1="12" x2="19" y2="12" />
                                    <polyline points="12 5 19 12 12 19" />
                                </svg>
                            </Link>
                            <Link
                                to="/admin/services"
                                style={{
                                    padding: '12px 22px',
                                    borderRadius: 12,
                                    background: '#ffffff',
                                    color: '#1c1917',
                                    fontSize: 13,
                                    fontWeight: 600,
                                    textDecoration: 'none',
                                    border: '1px solid #ece9e2',
                                    transition: 'border-color 0.2s',
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#1c1917')}
                                onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#ece9e2')}
                            >
                                Edit services
                            </Link>
                            <Link
                                to="/admin/reports"
                                style={{
                                    padding: '12px 22px',
                                    borderRadius: 12,
                                    background: '#ffffff',
                                    color: '#1c1917',
                                    fontSize: 13,
                                    fontWeight: 600,
                                    textDecoration: 'none',
                                    border: '1px solid #ece9e2',
                                    transition: 'border-color 0.2s',
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#1c1917')}
                                onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#ece9e2')}
                            >
                                View reports
                            </Link>
                        </div>
                    </div>

                    {/* Live ops ticket */}
                    <div className="dashboard-hero-ticket">
                        <div className="tc-ticket tc-ticket-stripe" style={{ padding: '24px 28px' }}>
                            <div className="tc-ticket-cut-l" />
                            <div className="tc-ticket-cut-r" />

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                                <span className="tc-pill tc-pill-brand">LIVE OPS</span>
                                <span className="tc-mono" style={{ fontSize: 11, color: '#a8a29e', letterSpacing: '0.12em', fontWeight: 600 }}>
                                    {openServices}/{services.length} OPEN
                                </span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                                <span className="tc-mono" style={{ fontSize: 56, fontWeight: 700, color: '#1c1917', letterSpacing: '-0.04em', lineHeight: 1 }}>
                                    {activeStudents}
                                </span>
                                <span className="tc-mono" style={{ fontSize: 12, color: '#a8a29e', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600 }}>
                                    in queue
                                </span>
                            </div>

                            <p style={{ fontSize: 14, fontWeight: 600, color: '#1c1917', marginTop: 14 }}>
                                {busiest && busiest.inQueue > 0 ? `Busiest: ${busiest.name}` : 'All queues are clear'}
                            </p>
                            <p style={{ fontSize: 12, color: '#78716c', marginTop: 2 }}>
                                {busiest && busiest.inQueue > 0
                                    ? `${busiest.inQueue} ${busiest.inQueue === 1 ? 'student is' : 'students are'} waiting on this service`
                                    : 'Nothing pressing — perfect time to plan'}
                            </p>

                            <div className="tc-ticket-divider" />

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11 }}>
                                <span className="tc-pill tc-pill-success">
                                    <span className="tc-pulse-dot" /> CONSOLE LIVE
                                </span>
                                <Link
                                    to="/admin/queues"
                                    style={{ color: '#1c1917', fontWeight: 700, fontSize: 11, letterSpacing: '0.12em', fontFamily: 'JetBrains Mono, monospace', textDecoration: 'none' }}
                                >
                                    OPEN →
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Today's snapshot ──────────────────────────────────── */}
            <section style={{ marginBottom: 36 }}>
                <div className="tc-section-head">
                    <div>
                        <span className="tc-page-eyebrow">Today's Snapshot</span>
                        <h2 className="tc-section-title">Operational metrics</h2>
                    </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                    {[
                        {
                            label: 'In Queue',
                            value: activeStudents,
                            meta: `across ${openServices} live ${openServices === 1 ? 'service' : 'services'}`,
                        },
                        {
                            label: 'Served Today',
                            value: stats?.totalServedToday ?? 47,
                            meta: '↑ 12% vs yesterday',
                        },
                        {
                            label: 'Avg Wait',
                            value: `${stats?.avgWaitTime ?? 14}m`,
                            meta: 'peak 2–4 PM',
                        },
                        {
                            label: 'No-Show Rate',
                            value: `${stats?.noShowRate ?? 8}%`,
                            meta: `${stats?.noShows ?? 4} students today`,
                        },
                    ].map((stat) => (
                        <div key={stat.label} className="tc-stat">
                            <p className="tc-stat-eyebrow"><span>{stat.label}</span></p>
                            <p className="tc-stat-value">{stat.value}</p>
                            <p className="tc-stat-meta">{stat.meta}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── Volume + Service load ─────────────────────────────── */}
            <section style={{ marginBottom: 36, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
                {/* Weekly volume */}
                <div className="tc-card">
                    <div className="tc-section-head" style={{ marginBottom: 22 }}>
                        <div>
                            <span className="tc-page-eyebrow">This Week</span>
                            <h3 className="tc-section-title">Weekly volume</h3>
                            <p className="tc-section-sub">Students served per day</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <p className="tc-mono" style={{ fontSize: 22, fontWeight: 700, color: '#1c1917', margin: 0, letterSpacing: '-0.02em' }}>
                                {totalVol}
                            </p>
                            <p className="tc-mono" style={{ fontSize: 10, color: '#a8a29e', margin: '4px 0 0 0', letterSpacing: '0.12em', fontWeight: 600, textTransform: 'uppercase' }}>
                                Total
                            </p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, height: 180 }}>
                        {dailyVolume.map((val, i) => (
                            <div
                                key={i}
                                style={{
                                    flex: 1,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: 8,
                                    height: '100%',
                                    justifyContent: 'flex-end',
                                }}
                            >
                                <span className="tc-mono" style={{ fontSize: 11, fontWeight: 700, color: i === todayIdx ? '#C8102E' : '#78716c', letterSpacing: '0.04em' }}>
                                    {val}
                                </span>
                                <div
                                    style={{
                                        width: '100%',
                                        borderRadius: 8,
                                        height: `${(val / maxVol) * 100}%`,
                                        minHeight: 14,
                                        background: i === todayIdx
                                            ? 'linear-gradient(180deg, #C8102E, #E8384F)'
                                            : '#f5f5f4',
                                        border: i === todayIdx ? 'none' : '1px solid #ece9e2',
                                        transition: 'all 0.5s ease',
                                    }}
                                />
                                <span className="tc-mono" style={{ fontSize: 10, color: i === todayIdx ? '#1c1917' : '#a8a29e', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                                    {dayLabels[i]}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Service load */}
                <div className="tc-card">
                    <div className="tc-section-head" style={{ marginBottom: 22 }}>
                        <div>
                            <span className="tc-page-eyebrow">Right Now</span>
                            <h3 className="tc-section-title">Service load</h3>
                            <p className="tc-section-sub">Live queue size by service</p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {serviceStats
                            .slice()
                            .sort((a, b) => b.inQueue - a.inQueue)
                            .map((s) => {
                                const maxQ = Math.max(...serviceStats.map((x) => x.inQueue), 1);
                                const pct = s.inQueue > 0 ? (s.inQueue / maxQ) * 100 : 0;
                                return (
                                    <div key={s.id}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                            <span style={{ fontSize: 13, fontWeight: 600, color: '#1c1917', maxWidth: '70%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {s.name}
                                            </span>
                                            <span className="tc-mono" style={{ fontSize: 13, fontWeight: 700, color: s.isOpen ? '#1c1917' : '#a8a29e', letterSpacing: '-0.01em' }}>
                                                {s.inQueue}
                                            </span>
                                        </div>
                                        <div className="tc-bar-track">
                                            <div
                                                className={`tc-bar-fill ${s.isOpen ? '' : 'tc-bar-fill-muted'}`}
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                </div>
            </section>

            {/* ── Services overview table ───────────────────────────── */}
            <section style={{ marginBottom: 36 }}>
                <div className="tc-section-head">
                    <div>
                        <span className="tc-page-eyebrow">Catalogue · {services.length} configured</span>
                        <h2 className="tc-section-title">Services overview</h2>
                    </div>
                    <Link to="/admin/services" className="tc-link">
                        Manage services
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="5" y1="12" x2="19" y2="12" />
                            <polyline points="12 5 19 12 12 19" />
                        </svg>
                    </Link>
                </div>
                <div className="tc-card-flush">
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', fontSize: 14, borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: '#FAF7F2', borderBottom: '1px solid #ece9e2' }}>
                                    {['Service', 'Category', 'Duration', 'In Queue', 'Status', 'Toggle'].map((h, i) => (
                                        <th
                                            key={h}
                                            className="tc-mono"
                                            style={{
                                                textAlign: i === 0 || i === 1 ? 'left' : 'center',
                                                padding: '14px 24px',
                                                fontSize: 10.5,
                                                fontWeight: 700,
                                                color: '#78716c',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.12em',
                                            }}
                                        >
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {services.map((s) => {
                                    const inQueue = queue.filter((q) => q.serviceId === s.id && (q.status === 'waiting' || q.status === 'almost_ready')).length;
                                    return (
                                        <tr
                                            key={s.id}
                                            style={{ borderBottom: '1px dashed #ece9e2', transition: 'background 0.15s' }}
                                            onMouseEnter={(e) => (e.currentTarget.style.background = '#fafaf9')}
                                            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                                        >
                                            <td style={{ padding: '16px 24px' }}>
                                                <p style={{ fontWeight: 600, color: '#1c1917', margin: 0, fontSize: 14 }}>{s.name}</p>
                                                <p style={{ fontSize: 12, color: '#78716c', margin: '4px 0 0 0', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {s.description}
                                                </p>
                                            </td>
                                            <td style={{ padding: '16px 24px', color: '#57534e', fontSize: 13 }}>{s.category}</td>
                                            <td className="tc-mono" style={{ padding: '16px 24px', textAlign: 'center', color: '#57534e', fontSize: 13, letterSpacing: '0.02em' }}>
                                                {s.expectedDuration}m
                                            </td>
                                            <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                                                <span
                                                    className="tc-mono"
                                                    style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        minWidth: 36,
                                                        height: 30,
                                                        padding: '0 10px',
                                                        borderRadius: 8,
                                                        fontSize: 13,
                                                        fontWeight: 700,
                                                        background: inQueue > 0 ? '#fef2f2' : '#fafaf9',
                                                        color: inQueue > 0 ? '#C8102E' : '#a8a29e',
                                                        letterSpacing: '-0.01em',
                                                    }}
                                                >
                                                    {inQueue}
                                                </span>
                                            </td>
                                            <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                                                <span className={`tc-pill ${s.isOpen ? 'tc-pill-success' : 'tc-pill-neutral'}`}>
                                                    {s.isOpen ? <span className="tc-pulse-dot" /> : <span className="tc-pill-dot" />}
                                                    {s.isOpen ? 'OPEN' : 'CLOSED'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                                                <button
                                                    onClick={() => toggleService(s.id)}
                                                    style={{
                                                        position: 'relative',
                                                        width: 44,
                                                        height: 24,
                                                        borderRadius: 12,
                                                        background: s.isOpen ? '#C8102E' : '#d6d3d1',
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        transition: 'background 0.2s',
                                                    }}
                                                    title={s.isOpen ? 'Close service' : 'Open service'}
                                                >
                                                    <span
                                                        style={{
                                                            position: 'absolute',
                                                            top: 2,
                                                            left: s.isOpen ? 22 : 2,
                                                            width: 20,
                                                            height: 20,
                                                            borderRadius: '50%',
                                                            background: '#fff',
                                                            boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                                                            transition: 'left 0.2s ease',
                                                        }}
                                                    />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            {/* ── Tips ──────────────────────────────────────────────── */}
            <section className="tc-tip">
                <span className="tc-page-eyebrow">Management Tips</span>
                <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 18, fontWeight: 700, color: '#1c1917', margin: '12px 0 14px 0', letterSpacing: '-0.012em' }}>
                    Run a healthy tutoring center
                </h3>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                    {[
                        ['Watch no-shows', 'Send reminders or tighten the queue during peak hours.'],
                        ['Balance load', 'If one service is backed up, temporarily close another to redirect tutors.'],
                        ['Review weekly volume', 'Use the chart above to identify demand patterns and schedule tutors.'],
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
