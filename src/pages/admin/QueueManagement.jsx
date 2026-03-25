import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { mockUsers } from '../../data/mockData';

export default function QueueManagement() {
    const { services, getQueueForService, serveNext, markNoShow, reorderQueue, leaveQueue } = useApp();
    const [selectedServiceId, setSelectedServiceId] = useState(services[0]?.id || '');

    const selectedService = services.find((s) => s.id === selectedServiceId);
    const queue = getQueueForService(selectedServiceId);

    const getUserName = (userId) => {
        const user = mockUsers.find((u) => u.id === userId);
        return user?.name || 'Unknown Student';
    };

    const getUserEmail = (userId) => {
        const user = mockUsers.find((u) => u.id === userId);
        return user?.email || '';
    };

    const getTimeInQueue = (joinedAt) => {
        const mins = Math.round((Date.now() - new Date(joinedAt).getTime()) / 60000);
        if (mins < 1) return 'just now';
        if (mins < 60) return `${mins} min`;
        return `${Math.floor(mins / 60)}h ${mins % 60}m`;
    };

    // Style tokens
    const card = { background: '#fff', border: '1px solid #e7e5e4', borderRadius: '16px', overflow: 'hidden' };
    const heading = { fontFamily: "'Outfit', sans-serif", fontSize: '24px', fontWeight: 700, color: '#1c1917', margin: '0 0 6px 0' };
    const btnIcon = (borderColor, textColor, hoverBg) => ({
        width: '34px', height: '34px', borderRadius: '10px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: `1px solid ${borderColor}`, background: '#fff',
        color: textColor, cursor: 'pointer', transition: 'all 0.15s',
    });

    const openServices = services.filter((s) => s.isOpen);
    const totalInQueue = openServices.reduce((sum, s) => sum + getQueueForService(s.id).length, 0);

    return (
        <div>
            {/* Header */}
            <div style={{ marginBottom: '28px' }}>
                <h1 style={heading}>Queue Management</h1>
                <p style={{ fontSize: '14px', color: '#78716c', margin: 0 }}>Manage active queues, serve students, and handle no-shows.</p>
            </div>

            {/* Overview stats */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                <div style={{
                    padding: '6px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                    background: totalInQueue > 0 ? '#fef2f2' : '#f0fdf4',
                    border: `1px solid ${totalInQueue > 0 ? '#fecaca' : '#bbf7d0'}`,
                    color: totalInQueue > 0 ? '#C8102E' : '#16a34a',
                }}>
                    {totalInQueue > 0 ? `🔴 ${totalInQueue} waiting` : '✅ All clear'}
                </div>
                <div style={{
                    padding: '6px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                    background: '#dbeafe', border: '1px solid #93c5fd', color: '#2563eb',
                }}>
                    📋 {openServices.length} open services
                </div>
            </div>

            {/* Service Selector */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '24px' }}>
                {services.filter((s) => s.isOpen).map((s) => {
                    const qLen = getQueueForService(s.id).length;
                    const isActive = selectedServiceId === s.id;
                    return (
                        <button key={s.id}
                            onClick={() => setSelectedServiceId(s.id)}
                            id={`select-queue-${s.id}`}
                            style={{
                                display: 'inline-flex', alignItems: 'center', gap: '8px',
                                padding: '10px 18px', borderRadius: '12px',
                                fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                                transition: 'all 0.15s',
                                background: isActive ? '#fef2f2' : '#fff',
                                color: isActive ? '#C8102E' : '#57534e',
                                border: `1.5px solid ${isActive ? '#fecaca' : '#e7e5e4'}`,
                                boxShadow: isActive ? '0 0 0 3px rgba(200,16,46,0.08)' : 'none',
                            }}
                        >
                            <span style={{ fontSize: '18px' }}>{s.icon}</span>
                            {s.name}
                            {qLen > 0 && (
                                <span style={{
                                    minWidth: '22px', height: '22px', borderRadius: '11px',
                                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '11px', fontWeight: 800,
                                    background: isActive ? '#C8102E' : '#ef4444',
                                    color: '#fff', padding: '0 6px',
                                }}>
                                    {qLen}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Queue Panel */}
            {selectedService && (
                <div style={card}>
                    {/* Panel header with accent strip */}
                    <div style={{ height: '3px', background: 'linear-gradient(90deg, #C8102E, #E8384F)' }} />
                    <div style={{
                        padding: '22px 28px', borderBottom: '1px solid #f5f5f4',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <div style={{
                                width: '48px', height: '48px', borderRadius: '12px',
                                background: '#fef2f2', border: '1px solid #fecaca',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '24px',
                            }}>
                                {selectedService.icon}
                            </div>
                            <div>
                                <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '17px', fontWeight: 700, color: '#1c1917', margin: 0 }}>
                                    {selectedService.name}
                                </h2>
                                <p style={{ fontSize: '12px', color: '#78716c', margin: '2px 0 0 0' }}>
                                    {queue.length} student{queue.length !== 1 ? 's' : ''} in queue • ~{selectedService.expectedDuration} min/session
                                </p>
                            </div>
                        </div>

                        {queue.length > 0 && (
                            <button
                                onClick={() => serveNext(selectedServiceId)}
                                id="serve-next-btn"
                                style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                                    padding: '10px 22px', borderRadius: '12px', border: 'none',
                                    background: 'linear-gradient(135deg, #C8102E, #E8384F)',
                                    color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                                    boxShadow: '0 4px 14px rgba(200,16,46,0.25)',
                                    transition: 'opacity 0.15s',
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                                Serve Next
                            </button>
                        )}
                    </div>

                    {queue.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '56px 24px' }}>
                            <div style={{ fontSize: '48px', marginBottom: '12px' }}>✨</div>
                            <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '18px', fontWeight: 700, color: '#1c1917', margin: '0 0 8px 0' }}>Queue is empty</h3>
                            <p style={{ fontSize: '13px', color: '#78716c', margin: 0 }}>No students are currently waiting for this service.</p>
                        </div>
                    ) : (
                        <div>
                            {queue.map((entry, idx) => (
                                <div key={entry.id}
                                    style={{
                                        padding: '18px 28px', borderBottom: '1px solid #f5f5f4',
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        background: idx === 0 ? 'linear-gradient(90deg, rgba(200,16,46,0.04), transparent)' : 'transparent',
                                        transition: 'background 0.15s',
                                    }}
                                    onMouseEnter={(e) => { if (idx !== 0) e.currentTarget.style.background = '#fafaf9'; }}
                                    onMouseLeave={(e) => { if (idx !== 0) e.currentTarget.style.background = 'transparent'; }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                        {/* Position badge */}
                                        <div style={{
                                            width: '42px', height: '42px', borderRadius: '12px',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '14px', fontWeight: 800, flexShrink: 0,
                                            background: idx === 0 ? 'linear-gradient(135deg, #C8102E, #E8384F)' : '#f5f5f4',
                                            color: idx === 0 ? '#fff' : '#57534e',
                                            boxShadow: idx === 0 ? '0 2px 8px rgba(200,16,46,0.25)' : 'none',
                                        }}>
                                            #{entry.position}
                                        </div>

                                        {/* Student info */}
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <p style={{ fontWeight: 600, color: '#1c1917', margin: 0, fontSize: '14px' }}>{getUserName(entry.userId)}</p>
                                                {entry.priority === 'high' && (
                                                    <span style={{
                                                        padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700,
                                                        background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca',
                                                    }}>
                                                        🔥 Urgent
                                                    </span>
                                                )}
                                            </div>
                                            <p style={{ fontSize: '12px', color: '#78716c', margin: '3px 0 0 0' }}>
                                                {getUserEmail(entry.userId)} • Waiting: <span style={{ fontWeight: 600, color: '#C8102E' }}>{getTimeInQueue(entry.joinedAt)}</span>
                                            </p>
                                            {entry.notes && <p style={{ fontSize: '11px', color: '#a8a29e', margin: '4px 0 0 0', fontStyle: 'italic' }}>"{entry.notes}"</p>}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <button
                                            onClick={() => reorderQueue(selectedServiceId, entry.id, 'up')}
                                            disabled={idx === 0}
                                            style={{
                                                ...btnIcon('#e7e5e4', '#78716c'),
                                                opacity: idx === 0 ? 0.3 : 1,
                                                cursor: idx === 0 ? 'not-allowed' : 'pointer',
                                            }}
                                            onMouseEnter={(e) => { if (idx !== 0) e.currentTarget.style.background = '#fafaf9'; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; }}
                                            title="Move up"
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="18 15 12 9 6 15" /></svg>
                                        </button>
                                        <button
                                            onClick={() => reorderQueue(selectedServiceId, entry.id, 'down')}
                                            disabled={idx === queue.length - 1}
                                            style={{
                                                ...btnIcon('#e7e5e4', '#78716c'),
                                                opacity: idx === queue.length - 1 ? 0.3 : 1,
                                                cursor: idx === queue.length - 1 ? 'not-allowed' : 'pointer',
                                            }}
                                            onMouseEnter={(e) => { if (idx !== queue.length - 1) e.currentTarget.style.background = '#fafaf9'; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; }}
                                            title="Move down"
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
                                        </button>
                                        <button
                                            onClick={() => markNoShow(entry.id)}
                                            style={btnIcon('#fde68a', '#d97706')}
                                            onMouseEnter={(e) => e.currentTarget.style.background = '#fffbeb'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}
                                            title="Mark as no-show"
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                                        </button>
                                        <button
                                            onClick={() => leaveQueue(entry.id)}
                                            style={btnIcon('#fecaca', '#ef4444')}
                                            onMouseEnter={(e) => e.currentTarget.style.background = '#fef2f2'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}
                                            title="Remove from queue"
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
