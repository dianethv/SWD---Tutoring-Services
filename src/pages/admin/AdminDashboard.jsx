import { useApp } from '../../context/AppContext';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
    const { services, queueEntries: queue, toggleService, stats } = useApp();

    const activeStudents = queue.filter((q) => q.status === 'waiting' || q.status === 'almost_ready').length;
    const openServices = services.filter((s) => s.isOpen).length;

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    };

    // Build service stats from queue
    const serviceStats = services.map((s) => {
        const inQueue = queue.filter((q) => q.serviceId === s.id && (q.status === 'waiting' || q.status === 'almost_ready')).length;
        return { ...s, inQueue };
    });

    // Volume chart data
    const rawVolume = stats?.dailyVolume || [];
    const dailyVolume = rawVolume.map((d) => (typeof d === 'object' ? d.count : d));
    const dayLabels = rawVolume.length > 0 && typeof rawVolume[0] === 'object'
        ? rawVolume.map((d) => d.day)
        : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const maxVol = Math.max(...dailyVolume, 1);

    // Shared style tokens (matching student dashboard)
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
                        <span style={{ fontSize: '13px', fontWeight: 500, color: '#fecdd3' }}>Admin Dashboard</span>
                    </div>
                    <h1 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '28px', fontWeight: 700, color: '#fff', lineHeight: 1.3, margin: '0 0 10px 0' }}>
                        {getGreeting()}, Admin 🛠️
                    </h1>
                    <p style={{ fontSize: '15px', color: '#fecdd3', lineHeight: 1.6, margin: '0 0 24px 0' }}>
                        {activeStudents > 0
                            ? `${activeStudents} student${activeStudents > 1 ? 's' : ''} currently waiting across ${openServices} open service${openServices > 1 ? 's' : ''}. Keep things moving!`
                            : 'All queues are clear right now. A great time to review services and prepare for upcoming sessions.'}
                    </p>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <Link to="/admin/queues" style={{
                            display: 'inline-flex', alignItems: 'center', gap: '8px',
                            padding: '10px 20px', borderRadius: '10px',
                            background: '#fff', color: '#960C22', fontSize: '13px', fontWeight: 600, textDecoration: 'none',
                        }}>
                            Manage Queues
                        </Link>
                        <Link to="/admin/services" style={{
                            display: 'inline-flex', alignItems: 'center', gap: '8px',
                            padding: '10px 20px', borderRadius: '10px',
                            background: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: '13px', fontWeight: 600,
                            textDecoration: 'none', border: '1px solid rgba(255,255,255,0.2)',
                        }}>
                            Edit Services
                        </Link>
                    </div>
                </div>
                {/* Decorative */}
                <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
                <div style={{ position: 'absolute', bottom: '-60px', right: '80px', width: '140px', height: '140px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
                <div style={{ position: 'absolute', top: '20px', right: '28px', fontSize: '48px', opacity: 0.15, userSelect: 'none' }}>📊</div>
            </div>

            {/* ── Key Metrics ──────────────────────────────────── */}
            <div style={sectionGap}>
                <h2 style={heading}>Today's Snapshot</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '16px' }}>
                    {[
                        { label: 'Students in Queue', value: activeStudents, bg: '#dbeafe', iconColor: '#3b82f6', extra: `across ${openServices} active services`, icon: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></> },
                        { label: 'Served Today', value: stats?.totalServedToday || 47, bg: '#d1fae5', iconColor: '#059669', extra: '↑ 12% vs yesterday', icon: <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></> },
                        { label: 'Avg Wait Time', value: `${stats?.avgWaitTime || 14}m`, bg: '#fef3c7', iconColor: '#d97706', extra: 'Peak: 2–4 PM', icon: <><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></> },
                        { label: 'No-Show Rate', value: `${stats?.noShowRate || 8}%`, bg: '#fce7f3', iconColor: '#db2777', extra: `${stats?.noShows || 4} students today`, icon: <><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></> },
                    ].map((stat) => (
                        <div key={stat.label} style={card}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={stat.iconColor} strokeWidth="2">{stat.icon}</svg>
                            </div>
                            <p style={{ fontSize: '28px', fontWeight: 700, color: '#1c1917', margin: '0 0 2px 0', lineHeight: 1 }}>{stat.value}</p>
                            <p style={{ fontSize: '13px', color: '#78716c', margin: 0 }}>{stat.label}</p>
                            <p style={{ fontSize: '11px', color: '#a8a29e', marginTop: '8px', margin: '8px 0 0 0' }}>{stat.extra}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Weekly Volume + Service Load ─────────────────── */}
            <div style={{ ...sectionGap, display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
                {/* Volume Chart */}
                <div style={card}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                        <div>
                            <h3 style={heading}>Weekly Volume</h3>
                            <p style={subtext}>Students served per day this week</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <p style={{ fontSize: '22px', fontWeight: 700, color: '#1c1917', margin: 0 }}>{dailyVolume.reduce((a, b) => a + b, 0)}</p>
                            <p style={{ fontSize: '12px', color: '#78716c', margin: '2px 0 0 0' }}>total this week</p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '12px', height: '180px' }}>
                        {dailyVolume.map((val, i) => (
                            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', height: '100%', justifyContent: 'flex-end' }}>
                                <span style={{ fontSize: '12px', fontWeight: 600, color: '#44403c' }}>{val}</span>
                                <div style={{
                                    width: '100%',
                                    borderRadius: '10px',
                                    height: `${(val / maxVol) * 100}%`,
                                    minHeight: '16px',
                                    background: i === new Date().getDay() - 1
                                        ? 'linear-gradient(180deg, #C8102E, #E8384F)'
                                        : 'linear-gradient(180deg, #fecdd3, #fecaca)',
                                    transition: 'all 0.5s ease',
                                }} />
                                <span style={{ fontSize: '11px', color: '#78716c', fontWeight: 500 }}>{dayLabels[i]}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Service Load */}
                <div style={card}>
                    <h3 style={{ ...heading, marginBottom: '4px' }}>Service Load</h3>
                    <p style={{ ...subtext, marginBottom: '20px' }}>Current queue by service</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                        {serviceStats.sort((a, b) => b.inQueue - a.inQueue).map((s) => {
                            const maxQ = Math.max(...serviceStats.map((x) => x.inQueue), 1);
                            return (
                                <div key={s.id}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <span style={{ fontSize: '18px' }}>{s.icon}</span>
                                            <span style={{ fontSize: '13px', fontWeight: 500, color: '#44403c', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</span>
                                        </div>
                                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#1c1917' }}>{s.inQueue}</span>
                                    </div>
                                    <div style={{ height: '8px', background: '#f5f5f4', borderRadius: '4px', overflow: 'hidden' }}>
                                        <div style={{
                                            height: '100%', borderRadius: '4px',
                                            width: s.inQueue > 0 ? `${(s.inQueue / maxQ) * 100}%` : '0%',
                                            background: s.isOpen ? 'linear-gradient(90deg, #C8102E, #E8384F)' : '#d1d5db',
                                            transition: 'width 0.7s ease',
                                        }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* ── Services Table ───────────────────────────────── */}
            <div style={sectionGap}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <h2 style={heading}>Services Overview</h2>
                    <Link to="/admin/services" style={linkStyle}>Manage services →</Link>
                </div>
                <p style={subtext}>{services.length} total services configured</p>
                <div style={{ ...card, padding: 0, overflow: 'hidden', marginTop: '16px' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', fontSize: '14px', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: '#fafaf9', borderBottom: '1px solid #e7e5e4' }}>
                                    <th style={{ textAlign: 'left', padding: '14px 24px', fontSize: '11px', fontWeight: 600, color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Service</th>
                                    <th style={{ textAlign: 'left', padding: '14px 24px', fontSize: '11px', fontWeight: 600, color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Category</th>
                                    <th style={{ textAlign: 'center', padding: '14px 24px', fontSize: '11px', fontWeight: 600, color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Duration</th>
                                    <th style={{ textAlign: 'center', padding: '14px 24px', fontSize: '11px', fontWeight: 600, color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.05em' }}>In Queue</th>
                                    <th style={{ textAlign: 'center', padding: '14px 24px', fontSize: '11px', fontWeight: 600, color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                                    <th style={{ textAlign: 'center', padding: '14px 24px', fontSize: '11px', fontWeight: 600, color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Toggle</th>
                                </tr>
                            </thead>
                            <tbody>
                                {services.map((s) => {
                                    const inQueue = queue.filter((q) => q.serviceId === s.id && (q.status === 'waiting' || q.status === 'almost_ready')).length;
                                    return (
                                        <tr key={s.id} style={{ borderBottom: '1px solid #f5f5f4', transition: 'background 0.15s' }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = '#fafaf9'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                                            <td style={{ padding: '16px 24px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafaf9', fontSize: '20px' }}>{s.icon}</div>
                                                    <div>
                                                        <p style={{ fontWeight: 600, color: '#1c1917', margin: 0, fontSize: '14px' }}>{s.name}</p>
                                                        <p style={{ fontSize: '12px', color: '#78716c', margin: '2px 0 0 0', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.description}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '16px 24px', color: '#57534e', fontSize: '13px' }}>{s.category}</td>
                                            <td style={{ padding: '16px 24px', textAlign: 'center', color: '#57534e', fontSize: '13px' }}>{s.expectedDuration} min</td>
                                            <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                                                <span style={{
                                                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                                    width: '32px', height: '32px', borderRadius: '8px', fontSize: '13px', fontWeight: 700,
                                                    background: inQueue > 0 ? '#fef2f2' : '#fafaf9',
                                                    color: inQueue > 0 ? '#C8102E' : '#a8a29e',
                                                }}>
                                                    {inQueue}
                                                </span>
                                            </td>
                                            <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                                                <span style={{
                                                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                                                    padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                                                    background: s.isOpen ? '#f0fdf4' : '#f5f5f4',
                                                    color: s.isOpen ? '#16a34a' : '#78716c',
                                                }}>
                                                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: s.isOpen ? '#16a34a' : '#a8a29e' }} />
                                                    {s.isOpen ? 'Open' : 'Closed'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                                                <button
                                                    onClick={() => toggleService(s.id)}
                                                    style={{
                                                        position: 'relative', width: '44px', height: '24px', borderRadius: '12px',
                                                        background: s.isOpen ? '#16a34a' : '#d6d3d1',
                                                        border: 'none', cursor: 'pointer', transition: 'background 0.2s',
                                                    }}
                                                    title={s.isOpen ? 'Close service' : 'Open service'}
                                                >
                                                    <span style={{
                                                        position: 'absolute', top: '2px',
                                                        left: s.isOpen ? '22px' : '2px',
                                                        width: '20px', height: '20px', borderRadius: '50%',
                                                        background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                                                        transition: 'left 0.2s ease',
                                                    }} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* ── Tips ───────────────────────────────────────── */}
            <div style={{
                borderRadius: '16px', border: '1px solid #fecaca', background: '#fffbeb', padding: '28px',
            }}>
                <div style={{ display: 'flex', gap: '16px' }}>
                    <span style={{ fontSize: '28px', flexShrink: 0 }}>🎯</span>
                    <div>
                        <h3 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, color: '#78350f', margin: '0 0 10px 0', fontSize: '15px' }}>Management Tips</h3>
                        <ul style={{ margin: 0, padding: 0, listStyle: 'none', fontSize: '13px', color: '#92400e', lineHeight: 1.7 }}>
                            <li style={{ marginBottom: '6px' }}>• <strong>Monitor no-shows</strong> — consider sending reminders or adjusting queue timing during peak hours.</li>
                            <li style={{ marginBottom: '6px' }}>• <strong>Balance load</strong> — if one service is backed up, consider temporarily closing others to redirect tutors.</li>
                            <li>• <strong>Review weekly volume</strong> — use the chart above to identify demand patterns and schedule tutors.</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
