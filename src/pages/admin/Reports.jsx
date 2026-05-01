import { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '../../config/api';

export default function Reports() {
    const [activeTab, setActiveTab] = useState('users');
    const [usersReport, setUsersReport] = useState([]);
    const [servicesReport, setServicesReport] = useState([]);
    const [queueStats, setQueueStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const printRef = useRef(null);

    useEffect(() => {
        async function fetchReports() {
            setLoading(true);
            try {
                const [uRes, sRes, qRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/reports/users`),
                    fetch(`${API_BASE_URL}/reports/services`),
                    fetch(`${API_BASE_URL}/reports/queue-stats`),
                ]);
                if (uRes.ok) setUsersReport(await uRes.json());
                if (sRes.ok) setServicesReport(await sRes.json());
                if (qRes.ok) setQueueStats(await qRes.json());
            } catch (e) {
                console.error('Failed to fetch reports:', e);
            }
            setLoading(false);
        }
        fetchReports();
    }, []);

    // ── CSV Export ───────────────────────────────────
    const exportCSV = () => {
        let csv = '', filename = '';
        if (activeTab === 'users') {
            csv = 'Name,Email,Role,Total Visits,Served,Cancelled,No-Shows,Avg Wait (min)\n';
            usersReport.forEach(u => {
                csv += `"${u.name}","${u.email}","${u.role}",${u.totalVisits},${u.timesServed},${u.timesCancelled},${u.timesNoShow},${u.avgWaitTime}\n`;
            });
            filename = 'users_report.csv';
        } else if (activeTab === 'services') {
            csv = 'Service,Category,Status,Total Served,Cancelled,No-Shows,Avg Wait (min),Currently In Queue\n';
            servicesReport.forEach(s => {
                csv += `"${s.name}","${s.category}","${s.isOpen ? 'Open' : 'Closed'}",${s.totalServed},${s.totalCancelled},${s.totalNoShows},${s.avgWaitTime},${s.currentInQueue}\n`;
            });
            filename = 'services_report.csv';
        } else {
            csv = 'Metric,Value\n';
            if (queueStats) {
                csv += `Total Users Served,${queueStats.totalUsersServed}\n`;
                csv += `Total No-Shows,${queueStats.totalNoShows}\n`;
                csv += `Total Cancelled,${queueStats.totalCancelled}\n`;
                csv += `Avg Wait Time (min),${queueStats.avgWaitTime}\n`;
                csv += `Currently In Queue,${queueStats.currentlyInQueue}\n`;
                csv += `Total Users,${queueStats.totalUsers}\n`;
                csv += `Total Services,${queueStats.totalServices}\n`;
                csv += '\nService,Served,No-Shows,Avg Wait (min)\n';
                (queueStats.serviceBreakdown || []).forEach(sb => {
                    csv += `"${sb.serviceName}",${sb.totalServed},${sb.totalNoShows},${sb.avgWaitTime}\n`;
                });
            }
            filename = 'queue_stats_report.csv';
        }
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
        URL.revokeObjectURL(link.href);
    };

    const exportPDF = () => window.print();

    // ── Styles ──────────────────────────────────────
    const card = { background: '#fff', border: '1px solid #e7e5e4', borderRadius: '16px', padding: '24px' };
    const heading = { fontFamily: "'Outfit', sans-serif", fontSize: '18px', fontWeight: 700, color: '#1c1917', margin: 0 };
    const subtext = { fontSize: '13px', color: '#78716c', marginTop: '4px' };
    const thStyle = { textAlign: 'left', padding: '14px 20px', fontSize: '11px', fontWeight: 600, color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' };
    const tdStyle = { padding: '14px 20px', fontSize: '13px', color: '#44403c', borderBottom: '1px solid #f5f5f4' };

    const tabs = [
        { id: 'users', label: 'Users & History', icon: '👥' },
        { id: 'services', label: 'Service Activity', icon: '📋' },
        { id: 'stats', label: 'Queue Statistics', icon: '📊' },
    ];

    if (loading) {
        return (
            <div className="reports-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ width: '48px', height: '48px', border: '4px solid #e7e5e4', borderTopColor: '#C8102E', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
                    <p style={{ color: '#78716c', fontSize: '14px' }}>Loading reports…</p>
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
            </div>
        );
    }

    return (
        <div className="reports-page" ref={printRef}>
            {/* ── Hero Banner ─────────────────────────────── */}
            <div style={{
                borderRadius: '20px', padding: '48px 40px',
                background: 'linear-gradient(135deg, #C8102E 0%, #A60F26 50%, #7A0B1C 100%)',
                position: 'relative', overflow: 'hidden', marginBottom: '32px',
            }}>
                <div className="glow-orb" style={{ position: 'absolute', top: '-80px', right: '-80px', width: '260px', height: '260px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
                <div className="glow-orb" style={{ position: 'absolute', bottom: '-60px', left: '30%', width: '180px', height: '180px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)', animationDelay: '2s' }} />
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div className="fade-up" style={{ marginBottom: '14px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#fecdd3' }}>
                            Admin Reports • Analytics Center
                        </span>
                    </div>
                    <h1 className="fade-up" style={{ fontFamily: "'Outfit', sans-serif", fontSize: '32px', fontWeight: 700, color: '#fff', margin: '0 0 12px 0', lineHeight: 1.25 }}>
                        Reports & Analytics 📊
                    </h1>
                    <p className="fade-up-delay" style={{ fontSize: '15px', color: '#fee2e2', lineHeight: 1.6, margin: 0, maxWidth: '600px' }}>
                        Generate detailed reports on user activity, service performance, and queue usage statistics. Export data as CSV or PDF.
                    </p>
                </div>
                <div style={{ position: 'absolute', top: '20px', right: '28px', fontSize: '48px', opacity: 0.15, userSelect: 'none' }}>📈</div>
            </div>

            {/* ── Tab Bar + Export ─────────────────────────── */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', gap: '6px', background: '#fff', borderRadius: '14px', padding: '4px', border: '1px solid #e7e5e4' }}>
                    {tabs.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)} id={`report-tab-${tab.id}`}
                            style={{
                                padding: '10px 20px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                                fontSize: '13px', fontWeight: 600, transition: 'all 0.2s',
                                background: activeTab === tab.id ? '#C8102E' : 'transparent',
                                color: activeTab === tab.id ? '#fff' : '#57534e',
                            }}>
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={exportCSV} id="export-csv-btn" style={{
                        padding: '10px 20px', borderRadius: '10px', border: '1px solid #e7e5e4', background: '#fff',
                        cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: '#44403c', transition: 'all 0.2s',
                    }}>📥 Export CSV</button>
                    <button onClick={exportPDF} id="export-pdf-btn" style={{
                        padding: '10px 20px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                        fontSize: '13px', fontWeight: 600, color: '#fff', transition: 'all 0.2s',
                        background: 'linear-gradient(135deg, #C8102E, #E8384F)',
                    }}>🖨️ Export PDF</button>
                </div>
            </div>

            {/* ── Tab Content ─────────────────────────────── */}
            {activeTab === 'users' && (
                <div className="animate-fade-in-up">
                    <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e7e5e4' }}>
                            <h2 style={heading}>Users & Queue Participation History</h2>
                            <p style={subtext}>{usersReport.length} users found • Showing complete queue history per user</p>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: '#fafaf9', borderBottom: '1px solid #e7e5e4' }}>
                                        <th style={thStyle}>User</th>
                                        <th style={thStyle}>Role</th>
                                        <th style={{ ...thStyle, textAlign: 'center' }}>Total Visits</th>
                                        <th style={{ ...thStyle, textAlign: 'center' }}>Served</th>
                                        <th style={{ ...thStyle, textAlign: 'center' }}>Cancelled</th>
                                        <th style={{ ...thStyle, textAlign: 'center' }}>No-Shows</th>
                                        <th style={{ ...thStyle, textAlign: 'center' }}>Avg Wait</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {usersReport.map(u => (
                                        <tr key={u.id} style={{ transition: 'background 0.15s' }}
                                            onMouseEnter={e => e.currentTarget.style.background = '#fafaf9'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                            <td style={tdStyle}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <div style={{
                                                        width: '36px', height: '36px', borderRadius: '10px', display: 'flex',
                                                        alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '12px', fontWeight: 700,
                                                        background: u.role === 'admin' ? 'linear-gradient(135deg, #960C22, #C8102E)' : 'linear-gradient(135deg, #C8102E, #E8384F)',
                                                    }}>
                                                        {u.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                                    </div>
                                                    <div>
                                                        <p style={{ fontWeight: 600, color: '#1c1917', margin: 0, fontSize: '13px' }}>{u.name}</p>
                                                        <p style={{ fontSize: '12px', color: '#78716c', margin: '2px 0 0 0' }}>{u.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={tdStyle}>
                                                <span style={{ padding: '3px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, textTransform: 'capitalize', background: u.role === 'admin' ? '#fef2f2' : '#f0fdf4', color: u.role === 'admin' ? '#C8102E' : '#16a34a' }}>
                                                    {u.role}
                                                </span>
                                            </td>
                                            <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 700 }}>{u.totalVisits}</td>
                                            <td style={{ ...tdStyle, textAlign: 'center' }}>
                                                <span style={{ color: '#16a34a', fontWeight: 600 }}>{u.timesServed}</span>
                                            </td>
                                            <td style={{ ...tdStyle, textAlign: 'center' }}>
                                                <span style={{ color: '#d97706', fontWeight: 600 }}>{u.timesCancelled}</span>
                                            </td>
                                            <td style={{ ...tdStyle, textAlign: 'center' }}>
                                                <span style={{ color: '#dc2626', fontWeight: 600 }}>{u.timesNoShow}</span>
                                            </td>
                                            <td style={{ ...tdStyle, textAlign: 'center' }}>{u.avgWaitTime}m</td>
                                        </tr>
                                    ))}
                                    {usersReport.length === 0 && (
                                        <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#a8a29e', fontSize: '14px' }}>No user data available</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'services' && (
                <div className="animate-fade-in-up">
                    <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e7e5e4' }}>
                            <h2 style={heading}>Service Details & Queue Activity</h2>
                            <p style={subtext}>{servicesReport.length} services • Activity and performance per service</p>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: '#fafaf9', borderBottom: '1px solid #e7e5e4' }}>
                                        <th style={thStyle}>Service</th>
                                        <th style={thStyle}>Category</th>
                                        <th style={{ ...thStyle, textAlign: 'center' }}>Status</th>
                                        <th style={{ ...thStyle, textAlign: 'center' }}>Total Served</th>
                                        <th style={{ ...thStyle, textAlign: 'center' }}>Cancelled</th>
                                        <th style={{ ...thStyle, textAlign: 'center' }}>No-Shows</th>
                                        <th style={{ ...thStyle, textAlign: 'center' }}>Avg Wait</th>
                                        <th style={{ ...thStyle, textAlign: 'center' }}>In Queue</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {servicesReport.map(s => (
                                        <tr key={s.id} style={{ transition: 'background 0.15s' }}
                                            onMouseEnter={e => e.currentTarget.style.background = '#fafaf9'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                            <td style={tdStyle}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafaf9', fontSize: '20px' }}>{s.icon}</div>
                                                    <div>
                                                        <p style={{ fontWeight: 600, color: '#1c1917', margin: 0, fontSize: '13px' }}>{s.name}</p>
                                                        <p style={{ fontSize: '11px', color: '#78716c', margin: '2px 0 0 0', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.description}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={tdStyle}>{s.category}</td>
                                            <td style={{ ...tdStyle, textAlign: 'center' }}>
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
                                            <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 700, color: '#16a34a' }}>{s.totalServed}</td>
                                            <td style={{ ...tdStyle, textAlign: 'center', color: '#d97706', fontWeight: 600 }}>{s.totalCancelled}</td>
                                            <td style={{ ...tdStyle, textAlign: 'center', color: '#dc2626', fontWeight: 600 }}>{s.totalNoShows}</td>
                                            <td style={{ ...tdStyle, textAlign: 'center' }}>{s.avgWaitTime}m</td>
                                            <td style={{ ...tdStyle, textAlign: 'center' }}>
                                                <span style={{
                                                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                                    width: '32px', height: '32px', borderRadius: '8px', fontSize: '13px', fontWeight: 700,
                                                    background: s.currentInQueue > 0 ? '#fef2f2' : '#fafaf9',
                                                    color: s.currentInQueue > 0 ? '#C8102E' : '#a8a29e',
                                                }}>{s.currentInQueue}</span>
                                            </td>
                                        </tr>
                                    ))}
                                    {servicesReport.length === 0 && (
                                        <tr><td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#a8a29e', fontSize: '14px' }}>No service data available</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'stats' && queueStats && (
                <div className="animate-fade-in-up">
                    {/* Summary Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                        {[
                            { label: 'Total Served', value: queueStats.totalUsersServed, bg: '#d1fae5', ic: '#059669', icon: <>
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></> },
                            { label: 'Avg Wait Time', value: `${queueStats.avgWaitTime}m`, bg: '#fef3c7', ic: '#d97706', icon: <>
                                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></> },
                            { label: 'No-Show Rate', value: queueStats.totalActivity > 0 ? `${Math.round((queueStats.totalNoShows / queueStats.totalActivity) * 100)}%` : '0%', bg: '#fce7f3', ic: '#db2777', icon: <>
                                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></> },
                            { label: 'Currently in Queue', value: queueStats.currentlyInQueue, bg: '#dbeafe', ic: '#3b82f6', icon: <>
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></> },
                        ].map(stat => (
                            <div key={stat.label} style={card}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={stat.ic} strokeWidth="2">{stat.icon}</svg>
                                </div>
                                <p style={{ fontSize: '28px', fontWeight: 700, color: '#1c1917', margin: '0 0 2px 0', lineHeight: 1 }}>{stat.value}</p>
                                <p style={{ fontSize: '13px', color: '#78716c', margin: 0 }}>{stat.label}</p>
                            </div>
                        ))}
                    </div>

                    {/* Service Breakdown Table */}
                    <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e7e5e4' }}>
                            <h2 style={heading}>Queue Usage by Service</h2>
                            <p style={subtext}>Breakdown of queue activity per service</p>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: '#fafaf9', borderBottom: '1px solid #e7e5e4' }}>
                                        <th style={thStyle}>Service</th>
                                        <th style={{ ...thStyle, textAlign: 'center' }}>Served</th>
                                        <th style={{ ...thStyle, textAlign: 'center' }}>No-Shows</th>
                                        <th style={{ ...thStyle, textAlign: 'center' }}>Total Activity</th>
                                        <th style={{ ...thStyle, textAlign: 'center' }}>Avg Wait</th>
                                        <th style={{ ...thStyle, textAlign: 'center' }}>In Queue Now</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(queueStats.serviceBreakdown || []).map(sb => (
                                        <tr key={sb.serviceId} style={{ transition: 'background 0.15s' }}
                                            onMouseEnter={e => e.currentTarget.style.background = '#fafaf9'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                            <td style={tdStyle}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <span style={{ fontSize: '18px' }}>{sb.icon}</span>
                                                    <span style={{ fontWeight: 600, fontSize: '13px', color: '#1c1917' }}>{sb.serviceName}</span>
                                                </div>
                                            </td>
                                            <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 700, color: '#16a34a' }}>{sb.totalServed}</td>
                                            <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 600, color: '#dc2626' }}>{sb.totalNoShows}</td>
                                            <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 700 }}>{sb.totalActivity}</td>
                                            <td style={{ ...tdStyle, textAlign: 'center' }}>{sb.avgWaitTime}m</td>
                                            <td style={{ ...tdStyle, textAlign: 'center' }}>
                                                <span style={{
                                                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                                    width: '32px', height: '32px', borderRadius: '8px', fontSize: '13px', fontWeight: 700,
                                                    background: sb.currentInQueue > 0 ? '#fef2f2' : '#fafaf9',
                                                    color: sb.currentInQueue > 0 ? '#C8102E' : '#a8a29e',
                                                }}>{sb.currentInQueue}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
