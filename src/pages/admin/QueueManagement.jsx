import { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { API_BASE_URL } from '../../config/api';

export default function QueueManagement() {
    const { services, getQueueForService, serveNext, markNoShow, reorderQueue, leaveQueue } = useApp();
    const [selectedServiceId, setSelectedServiceId] = useState(services[0]?.id || '');
    const [allUsers, setAllUsers] = useState([]);

    useEffect(() => {
        fetch(`${API_BASE_URL}/users`)
            .then((res) => res.json())
            .then((data) => setAllUsers(data))
            .catch(() => { });
    }, []);

    const selectedService = services.find((s) => s.id === selectedServiceId);
    const queue = getQueueForService(selectedServiceId);

    const getUserName = (userId) => allUsers.find((u) => u.id === userId)?.name || 'Unknown student';
    const getUserEmail = (userId) => allUsers.find((u) => u.id === userId)?.email || '';

    const getTimeInQueue = (joinedAt) => {
        const mins = Math.round((Date.now() - new Date(joinedAt).getTime()) / 60000);
        if (mins < 1) return 'just now';
        if (mins < 60) return `${mins}m`;
        return `${Math.floor(mins / 60)}h ${mins % 60}m`;
    };

    const openServices = services.filter((s) => s.isOpen);
    const totalInQueue = openServices.reduce((sum, s) => sum + getQueueForService(s.id).length, 0);

    // Icon-only square button helper
    const iconBtn = (variant) => ({
        width: 34,
        height: 34,
        borderRadius: 8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#fff',
        cursor: 'pointer',
        transition: 'all 0.15s',
        ...(variant === 'subtle' && { border: '1px solid #e7e5e4', color: '#78716c' }),
        ...(variant === 'warning' && { border: '1px solid #fde68a', color: '#d97706' }),
        ...(variant === 'danger' && { border: '1px solid #fecaca', color: '#dc2626' }),
    });

    return (
        <div className="queue-management-page">
            {/* ── Hero ────────────────────────────────────────────── */}
            <section className="tc-page-hero">
                <span className="tc-page-eyebrow">
                    Live Operations · {totalInQueue} {totalInQueue === 1 ? 'student' : 'students'} waiting
                </span>
                <h1 className="tc-page-headline" style={{ marginTop: 16 }}>
                    Queue management<span className="tc-dot">.</span>
                </h1>
                <p className="tc-page-sub">
                    Serve the next student, mark no-shows, and re-order the line. Pick a
                    service tab below to focus on its queue.
                </p>
            </section>

            {/* ── Stat row ────────────────────────────────────────── */}
            <section style={{ marginBottom: 36 }}>
                <div className="tc-section-head">
                    <div>
                        <span className="tc-page-eyebrow">Live Snapshot</span>
                        <h2 className="tc-section-title">Right now</h2>
                    </div>
                </div>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: 16,
                }}>
                    <div className="tc-stat">
                        <p className="tc-stat-eyebrow"><span>Total Waiting</span></p>
                        <p className="tc-stat-value">{totalInQueue}</p>
                        <p className="tc-stat-meta">
                            {totalInQueue === 0 ? 'all queues clear' : `across ${openServices.length} ${openServices.length === 1 ? 'service' : 'services'}`}
                        </p>
                    </div>
                    <div className="tc-stat">
                        <p className="tc-stat-eyebrow"><span>Open Services</span></p>
                        <p className="tc-stat-value">{openServices.length}</p>
                        <p className="tc-stat-meta">accepting students right now</p>
                    </div>
                    <div className="tc-stat">
                        <p className="tc-stat-eyebrow"><span>Selected Queue</span></p>
                        <p className="tc-stat-value">{queue.length}</p>
                        <p className="tc-stat-meta">
                            {selectedService ? `for ${selectedService.name}` : 'no service selected'}
                        </p>
                    </div>
                </div>
            </section>

            {/* ── Service tab row ─────────────────────────────────── */}
            <section style={{ marginBottom: 18 }}>
                <div className="tc-section-head">
                    <div>
                        <span className="tc-page-eyebrow">Queues · Pick One To Manage</span>
                        <h2 className="tc-section-title">Active services</h2>
                    </div>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {openServices.length === 0 ? (
                        <span className="tc-mono" style={{ fontSize: 11, color: '#a8a29e', letterSpacing: '0.12em', fontWeight: 600 }}>
                            NO OPEN SERVICES
                        </span>
                    ) : (
                        openServices.map((s) => {
                            const qLen = getQueueForService(s.id).length;
                            const isActive = selectedServiceId === s.id;
                            return (
                                <button
                                    key={s.id}
                                    onClick={() => setSelectedServiceId(s.id)}
                                    id={`select-queue-${s.id}`}
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 8,
                                        padding: '9px 16px',
                                        borderRadius: 999,
                                        fontSize: 13,
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        transition: 'all 0.15s',
                                        background: isActive ? '#1c1917' : '#fff',
                                        color: isActive ? '#fff' : '#44403c',
                                        border: `1px solid ${isActive ? '#1c1917' : '#e7e5e4'}`,
                                        fontFamily: 'inherit',
                                    }}
                                >
                                    {s.name}
                                    {qLen > 0 && (
                                        <span
                                            className="tc-mono"
                                            style={{
                                                minWidth: 20,
                                                height: 20,
                                                borderRadius: 999,
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: 10,
                                                fontWeight: 800,
                                                background: isActive ? '#C8102E' : '#fef2f2',
                                                color: isActive ? '#fff' : '#C8102E',
                                                padding: '0 6px',
                                                letterSpacing: 0,
                                            }}
                                        >
                                            {qLen}
                                        </span>
                                    )}
                                </button>
                            );
                        })
                    )}
                </div>
            </section>

            {/* ── Queue panel ─────────────────────────────────────── */}
            {selectedService && (
                <section style={{ marginBottom: 36 }}>
                    <div style={{
                        background: '#fff',
                        border: '1px solid #e7e5e4',
                        borderTop: '3px solid #C8102E',
                        borderRadius: 16,
                        overflow: 'hidden',
                    }}>
                        {/* Panel header */}
                        <div
                            className="queue-panel-header"
                            style={{
                                padding: '22px 26px',
                                borderBottom: '1px solid #ece9e2',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: 12,
                                flexWrap: 'wrap',
                            }}
                        >
                            <div>
                                <span className="tc-stat-eyebrow" style={{ margin: '0 0 6px 0' }}>
                                    {selectedService.category}
                                </span>
                                <h2 style={{
                                    fontFamily: 'Outfit, sans-serif',
                                    fontSize: 20,
                                    fontWeight: 700,
                                    color: '#1c1917',
                                    margin: 0,
                                    letterSpacing: '-0.012em',
                                }}>
                                    {selectedService.name}
                                </h2>
                                <p className="tc-mono" style={{
                                    fontSize: 11,
                                    color: '#78716c',
                                    margin: '6px 0 0 0',
                                    letterSpacing: '0.1em',
                                    fontWeight: 600,
                                    textTransform: 'uppercase',
                                }}>
                                    {queue.length} {queue.length === 1 ? 'STUDENT' : 'STUDENTS'} · ~{selectedService.expectedDuration}M PER SESSION
                                </p>
                            </div>

                            {queue.length > 0 && (
                                <button
                                    onClick={() => serveNext(selectedServiceId)}
                                    id="serve-next-btn"
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 8,
                                        padding: '11px 22px',
                                        borderRadius: 12,
                                        border: 'none',
                                        background: '#C8102E',
                                        color: '#fff',
                                        fontSize: 13,
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        boxShadow: '0 4px 14px -6px rgba(200, 16, 46, 0.45)',
                                        transition: 'background 0.2s, transform 0.2s',
                                        fontFamily: 'inherit',
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.background = '#960C22'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = '#C8102E'; e.currentTarget.style.transform = 'translateY(0)'; }}
                                >
                                    Serve next
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="5" y1="12" x2="19" y2="12" />
                                        <polyline points="12 5 19 12 12 19" />
                                    </svg>
                                </button>
                            )}
                        </div>

                        {/* Panel body */}
                        {queue.length === 0 ? (
                            <div style={{
                                textAlign: 'center',
                                padding: '52px 24px',
                                background: '#FAF7F2',
                                backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(28, 25, 23, 0.06) 1px, transparent 0)',
                                backgroundSize: '22px 22px',
                            }}>
                                <span className="tc-mono" style={{
                                    fontSize: 11,
                                    color: '#a8a29e',
                                    letterSpacing: '0.16em',
                                    fontWeight: 700,
                                }}>
                                    QUEUE IS EMPTY
                                </span>
                                <p style={{
                                    fontSize: 14,
                                    color: '#78716c',
                                    margin: '12px 0 0 0',
                                    maxWidth: 320,
                                    marginLeft: 'auto',
                                    marginRight: 'auto',
                                }}>
                                    No students are waiting for this service right now.
                                </p>
                            </div>
                        ) : (
                            <div>
                                {queue.map((entry, idx) => {
                                    const isFirst = idx === 0;
                                    const isLast = idx === queue.length - 1;
                                    return (
                                        <div
                                            key={entry.id}
                                            className="queue-entry-row"
                                            style={{
                                                padding: '18px 26px',
                                                borderBottom: idx < queue.length - 1 ? '1px dashed #ece9e2' : 'none',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                gap: 12,
                                                flexWrap: 'wrap',
                                                background: isFirst ? 'linear-gradient(90deg, rgba(200,16,46,0.04), transparent 80%)' : 'transparent',
                                                transition: 'background 0.15s',
                                            }}
                                            onMouseEnter={(e) => { if (!isFirst) e.currentTarget.style.background = '#fafaf9'; }}
                                            onMouseLeave={(e) => { if (!isFirst) e.currentTarget.style.background = 'transparent'; }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 18, minWidth: 0 }}>
                                                {/* Position badge — mono receipt-number */}
                                                <div
                                                    className="tc-mono"
                                                    style={{
                                                        minWidth: 56,
                                                        padding: '0 10px',
                                                        height: 56,
                                                        borderRadius: 12,
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontWeight: 700,
                                                        flexShrink: 0,
                                                        background: isFirst ? '#C8102E' : '#fafaf9',
                                                        color: isFirst ? '#fff' : '#1c1917',
                                                        border: isFirst ? 'none' : '1px solid #ece9e2',
                                                        boxShadow: isFirst ? '0 4px 14px -6px rgba(200, 16, 46, 0.4)' : 'none',
                                                    }}
                                                >
                                                    <span style={{ fontSize: 22, letterSpacing: '-0.04em', lineHeight: 1 }}>
                                                        #{entry.position}
                                                    </span>
                                                    <span style={{
                                                        fontSize: 8,
                                                        letterSpacing: '0.12em',
                                                        opacity: 0.7,
                                                        marginTop: 4,
                                                        fontWeight: 700,
                                                    }}>
                                                        {isFirst ? 'NEXT' : 'POS'}
                                                    </span>
                                                </div>

                                                {/* Student info */}
                                                <div style={{ minWidth: 0 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                                        <p style={{
                                                            fontFamily: 'Outfit, sans-serif',
                                                            fontWeight: 600,
                                                            color: '#1c1917',
                                                            margin: 0,
                                                            fontSize: 15,
                                                            letterSpacing: '-0.005em',
                                                        }}>
                                                            {getUserName(entry.userId)}
                                                        </p>
                                                        {entry.priority === 'high' && (
                                                            <span className="tc-pill tc-pill-danger">URGENT</span>
                                                        )}
                                                    </div>
                                                    <p className="tc-mono" style={{
                                                        fontSize: 11,
                                                        color: '#a8a29e',
                                                        margin: '4px 0 0 0',
                                                        letterSpacing: '0.06em',
                                                    }}>
                                                        {getUserEmail(entry.userId)} · WAITING {getTimeInQueue(entry.joinedAt).toUpperCase()}
                                                    </p>
                                                    {entry.notes && (
                                                        <p style={{
                                                            fontSize: 12,
                                                            color: '#78716c',
                                                            margin: '6px 0 0 0',
                                                            fontStyle: 'italic',
                                                            maxWidth: 360,
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            whiteSpace: 'nowrap',
                                                        }}>
                                                            "{entry.notes}"
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Action buttons */}
                                            <div className="queue-entry-actions" style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                                <button
                                                    onClick={() => reorderQueue(selectedServiceId, entry.id, 'up')}
                                                    disabled={isFirst}
                                                    style={{
                                                        ...iconBtn('subtle'),
                                                        opacity: isFirst ? 0.3 : 1,
                                                        cursor: isFirst ? 'not-allowed' : 'pointer',
                                                    }}
                                                    onMouseEnter={(e) => { if (!isFirst) e.currentTarget.style.background = '#fafaf9'; }}
                                                    onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; }}
                                                    title="Move up"
                                                >
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polyline points="18 15 12 9 6 15" /></svg>
                                                </button>
                                                <button
                                                    onClick={() => reorderQueue(selectedServiceId, entry.id, 'down')}
                                                    disabled={isLast}
                                                    style={{
                                                        ...iconBtn('subtle'),
                                                        opacity: isLast ? 0.3 : 1,
                                                        cursor: isLast ? 'not-allowed' : 'pointer',
                                                    }}
                                                    onMouseEnter={(e) => { if (!isLast) e.currentTarget.style.background = '#fafaf9'; }}
                                                    onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; }}
                                                    title="Move down"
                                                >
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polyline points="6 9 12 15 18 9" /></svg>
                                                </button>
                                                <button
                                                    onClick={() => markNoShow(entry.id)}
                                                    style={iconBtn('warning')}
                                                    onMouseEnter={(e) => (e.currentTarget.style.background = '#fffbeb')}
                                                    onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}
                                                    title="Mark as no-show"
                                                >
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                                                        <circle cx="12" cy="12" r="10" />
                                                        <line x1="12" y1="8" x2="12" y2="12" />
                                                        <line x1="12" y1="16" x2="12.01" y2="16" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => leaveQueue(entry.id)}
                                                    style={iconBtn('danger')}
                                                    onMouseEnter={(e) => (e.currentTarget.style.background = '#fef2f2')}
                                                    onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}
                                                    title="Remove from queue"
                                                >
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                                                        <line x1="18" y1="6" x2="6" y2="18" />
                                                        <line x1="6" y1="6" x2="18" y2="18" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </section>
            )}
        </div>
    );
}
