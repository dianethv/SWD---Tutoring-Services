import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';

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

    const servedCount = history.filter((h) => h.outcome === 'served').length;
    const avgWait = history.filter((h) => h.waitTime).length > 0
        ? Math.round(history.filter((h) => h.waitTime).reduce((s, h) => s + h.waitTime, 0) / history.filter((h) => h.waitTime).length)
        : 0;

    // Shared style tokens
    const card = {
        background: '#fff',
        border: '1px solid #e7e5e4',
        borderRadius: '16px',
        padding: '24px',
    };
    const sectionGap = { marginBottom: '32px' };
    const heading = { fontFamily: "'Outfit', sans-serif", fontSize: '18px', fontWeight: 700, color: '#1c1917', margin: 0 };
    const subtext = { fontSize: '13px', color: '#78716c', marginTop: '4px' };
    const linkStyle = { fontSize: '13px', color: '#C8102E', fontWeight: 600, textDecoration: 'none' };

    return (
        <div>
            {/* ── Welcome Banner ─────────────────────────────── */}
            <div style={{
                ...sectionGap,
                borderRadius: '16px',
                padding: '36px 32px',
                background: 'linear-gradient(135deg, #C8102E, #960C22 60%, #6B0A1A)',
                position: 'relative',
                overflow: 'hidden',
            }}>
                <div style={{ position: 'relative', zIndex: 1, maxWidth: '520px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#6ee7b7' }} />
                        <span style={{ fontSize: '13px', fontWeight: 500, color: '#fecdd3' }}>Tutoring Center — Open Now</span>
                    </div>
                    <h1 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '28px', fontWeight: 700, color: '#fff', lineHeight: 1.3, margin: '0 0 10px 0' }}>
                        {getGreeting()}, {currentUser?.name?.split(' ')[0]} 👋
                    </h1>
                    <p style={{ fontSize: '15px', color: '#fecdd3', lineHeight: 1.6, margin: '0 0 24px 0' }}>
                        {activeQueues.length > 0
                            ? `You're in ${activeQueues.length} queue${activeQueues.length > 1 ? 's' : ''} right now. Check your status or browse more services.`
                            : `Browse available tutoring services and hop in a queue. We'll notify you when it's your turn.`}
                    </p>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <Link to="/join-queue" style={{
                            display: 'inline-flex', alignItems: 'center', gap: '8px',
                            padding: '10px 20px', borderRadius: '10px',
                            background: '#fff', color: '#960C22', fontSize: '13px', fontWeight: 600, textDecoration: 'none',
                        }}>
                            + Join a Queue
                        </Link>
                        {activeQueues.length > 0 && (
                            <Link to="/queue-status" style={{
                                display: 'inline-flex', alignItems: 'center', gap: '8px',
                                padding: '10px 20px', borderRadius: '10px',
                                background: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: '13px', fontWeight: 600,
                                textDecoration: 'none', border: '1px solid rgba(255,255,255,0.2)',
                            }}>
                                Check My Status
                            </Link>
                        )}
                    </div>
                </div>
                {/* Decorative */}
                <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
                <div style={{ position: 'absolute', bottom: '-60px', right: '80px', width: '140px', height: '140px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
                <div style={{ position: 'absolute', top: '20px', right: '28px', fontSize: '48px', opacity: 0.15, userSelect: 'none' }}>🐾</div>
            </div>

            {/* ── Stats Row ──────────────────────────────────── */}
            <div style={{ ...sectionGap }}>
                <h2 style={heading}>Your Overview</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '16px' }}>
                    {[
                        { label: 'Active Queues', value: activeQueues.length, bg: '#dbeafe', iconColor: '#3b82f6', icon: <><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></> },
                        { label: 'Sessions Done', value: servedCount, bg: '#d1fae5', iconColor: '#059669', icon: <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></> },
                        { label: 'Unread Alerts', value: recentNotifs.length, bg: '#fef2f2', iconColor: '#d97706', icon: <><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></> },
                        { label: 'Avg Wait', value: avgWait > 0 ? `${avgWait}m` : '—', bg: '#ede9fe', iconColor: '#7c3aed', icon: <><path d="M3 3v5h5" /><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8" /><path d="M12 7v5l4 2" /></> },
                    ].map((stat) => (
                        <div key={stat.label} style={card}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={stat.iconColor} strokeWidth="2">{stat.icon}</svg>
                            </div>
                            <p style={{ fontSize: '28px', fontWeight: 700, color: '#1c1917', margin: '0 0 2px 0', lineHeight: 1 }}>{stat.value}</p>
                            <p style={{ fontSize: '13px', color: '#78716c', margin: 0 }}>{stat.label}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Active Queues ───────────────────────────────── */}
            {activeQueues.length > 0 && (
                <div style={sectionGap}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <h2 style={heading}>Your Active Queues</h2>
                        <Link to="/queue-status" style={linkStyle}>View details →</Link>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
                        {activeQueues.map((q) => {
                            const service = services.find((s) => s.id === q.serviceId);
                            const eta = getEstimatedWait(q.serviceId, q.position);
                            const isNext = q.position === 1;
                            const accent = isNext ? '#3b82f6' : '#C8102E';
                            return (
                                <Link to="/queue-status" key={q.id} style={{ ...card, textDecoration: 'none', borderTop: `3px solid ${accent}`, padding: 0, overflow: 'hidden' }}>
                                    <div style={{ padding: '24px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#fafaf9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>
                                                    {service?.icon}
                                                </div>
                                                <div>
                                                    <p style={{ fontWeight: 600, color: '#1c1917', margin: 0, fontSize: '15px' }}>{service?.name}</p>
                                                    <p style={{ fontSize: '12px', color: '#a8a29e', margin: '2px 0 0 0' }}>{service?.category}</p>
                                                </div>
                                            </div>
                                            <span style={{
                                                padding: '4px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
                                                background: isNext ? '#eff6ff' : '#f0fdf4',
                                                color: isNext ? '#2563eb' : '#16a34a',
                                                border: `1px solid ${isNext ? '#bfdbfe' : '#bbf7d0'}`,
                                            }}>
                                                {isNext ? "You're next!" : 'Waiting'}
                                            </span>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                                            <div style={{ padding: '14px', borderRadius: '10px', background: '#fafaf9', textAlign: 'center' }}>
                                                <p style={{ fontSize: '11px', color: '#78716c', margin: '0 0 4px 0', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Position</p>
                                                <p style={{ fontSize: '24px', fontWeight: 700, color: accent, margin: 0 }}>#{q.position}</p>
                                            </div>
                                            <div style={{ padding: '14px', borderRadius: '10px', background: '#fafaf9', textAlign: 'center' }}>
                                                <p style={{ fontSize: '11px', color: '#78716c', margin: '0 0 4px 0', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Est. Wait</p>
                                                <p style={{ fontSize: '24px', fontWeight: 700, color: '#1c1917', margin: 0 }}>{eta > 0 ? `${eta}m` : '<1m'}</p>
                                            </div>
                                        </div>
                                        <div style={{ height: '6px', background: '#f5f5f4', borderRadius: '3px', overflow: 'hidden' }}>
                                            <div style={{
                                                height: '100%', borderRadius: '3px',
                                                width: `${Math.max(15, 100 - (q.position - 1) * 25)}%`,
                                                background: `linear-gradient(90deg, ${accent}, ${isNext ? '#60a5fa' : '#E8384F'})`,
                                                transition: 'width 0.7s ease',
                                            }} />
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ── Available Services ─────────────────────────── */}
            <div style={sectionGap}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <h2 style={heading}>Available Services</h2>
                    <Link to="/join-queue" style={linkStyle}>Browse all →</Link>
                </div>
                <p style={subtext}>{openServices.length} services currently accepting students</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px', marginTop: '16px' }}>
                    {openServices.slice(0, 6).map((service) => (
                        <Link to="/join-queue" key={service.id} style={{ ...card, textDecoration: 'none', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '12px' }}>
                                    <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#fafaf9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>
                                        {service.icon}
                                    </div>
                                    <div>
                                        <p style={{ fontWeight: 600, color: '#1c1917', margin: 0, fontSize: '15px' }}>{service.name}</p>
                                        <span style={{ fontSize: '12px', color: '#a8a29e' }}>{service.category}</span>
                                    </div>
                                </div>
                                <p style={{ fontSize: '13px', color: '#57534e', lineHeight: 1.6, margin: '0 0 16px 0' }}>
                                    {service.description}
                                </p>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '14px', borderTop: '1px solid #f5f5f4' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <span style={{ fontSize: '12px', color: '#78716c' }}>~{service.expectedDuration} min</span>
                                    <span style={{
                                        padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600,
                                        background: service.priorityLevel === 'high' ? '#fef2f2' : '#f0fdf4',
                                        color: service.priorityLevel === 'high' ? '#dc2626' : '#16a34a',
                                    }}>
                                        {service.priorityLevel}
                                    </span>
                                </div>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#16a34a', fontWeight: 600 }}>
                                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#16a34a' }} />
                                    Open
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            {/* ── Recent Activity ────────────────────────────── */}
            {history.length > 0 && (
                <div style={sectionGap}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <h2 style={heading}>Recent Activity</h2>
                        <Link to="/history" style={linkStyle}>Full history →</Link>
                    </div>
                    <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
                        {history.slice(0, 4).map((h, i) => (
                            <div key={h.id} style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '16px 24px',
                                borderBottom: i < Math.min(history.length, 4) - 1 ? '1px solid #f5f5f4' : 'none',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                    <div style={{
                                        width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700,
                                        background: h.outcome === 'served' ? '#f0fdf4' : h.outcome === 'cancelled' ? '#f5f5f4' : '#fef2f2',
                                        color: h.outcome === 'served' ? '#16a34a' : h.outcome === 'cancelled' ? '#78716c' : '#dc2626',
                                    }}>
                                        {h.outcome === 'served' ? '✓' : h.outcome === 'cancelled' ? '—' : '!'}
                                    </div>
                                    <div>
                                        <p style={{ fontWeight: 600, color: '#1c1917', margin: 0, fontSize: '14px' }}>{h.serviceName}</p>
                                        <p style={{ fontSize: '12px', color: '#a8a29e', margin: '2px 0 0 0' }}>{h.date} at {h.joinedAt}</p>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <span style={{
                                        display: 'inline-block', padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
                                        background: h.outcome === 'served' ? '#f0fdf4' : h.outcome === 'cancelled' ? '#f5f5f4' : '#fef2f2',
                                        color: h.outcome === 'served' ? '#16a34a' : h.outcome === 'cancelled' ? '#78716c' : '#dc2626',
                                    }}>
                                        {h.outcome === 'served' ? 'Served' : h.outcome === 'cancelled' ? 'Cancelled' : 'No Show'}
                                    </span>
                                    {h.waitTime && <p style={{ fontSize: '11px', color: '#a8a29e', margin: '4px 0 0 0' }}>{h.waitTime} min wait</p>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Tips ───────────────────────────────────────── */}
            <div style={{
                borderRadius: '16px', border: '1px solid #fecaca', background: '#fffbeb', padding: '28px',
            }}>
                <div style={{ display: 'flex', gap: '16px' }}>
                    <span style={{ fontSize: '28px', flexShrink: 0 }}>💡</span>
                    <div>
                        <h3 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, color: '#78350f', margin: '0 0 10px 0', fontSize: '15px' }}>Tutoring Tips</h3>
                        <ul style={{ margin: 0, padding: 0, listStyle: 'none', fontSize: '13px', color: '#92400e', lineHeight: 1.7 }}>
                            <li style={{ marginBottom: '6px' }}>• <strong>Come prepared</strong> — bring your notes and specific questions for a more productive session.</li>
                            <li style={{ marginBottom: '6px' }}>• <strong>Watch notifications</strong> — we alert you 2 spots before your turn so you don't miss it.</li>
                            <li>• <strong>Peak hours</strong> are 2–4 PM on weekdays. Morning visits often have shorter waits.</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
