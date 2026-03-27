import { useState } from 'react';
import { useApp } from '../../context/AppContext';

export default function JoinQueue() {
    const { services, joinQueue, getUserQueueEntry, getQueueForService, getEstimatedWait, leaveQueue } = useApp();
    const [selectedService, setSelectedService] = useState(null);
    const [notes, setNotes] = useState('');
    const [priority, setPriority] = useState('normal');
    const [joinSuccess, setJoinSuccess] = useState(null);
    const [joinError, setJoinError] = useState('');

    const handleJoin = (serviceId) => {
        setJoinError('');
        const result = joinQueue(serviceId, notes, priority);
        if (result?.success) {
            setJoinSuccess(serviceId);
            setNotes('');
            setPriority('normal');
            setTimeout(() => setJoinSuccess(null), 3000);
        } else if (result) {
            setJoinError(result.error);
            setTimeout(() => setJoinError(''), 3000);
        }
    };

    const handleLeave = (serviceId) => {
        const entry = getUserQueueEntry(serviceId);
        if (entry) leaveQueue(entry.id);
    };

    // Shared tokens
    const card = { background: '#fff', border: '1px solid #e7e5e4', borderRadius: '16px', padding: '24px' };
    const heading = { fontFamily: "'Outfit', sans-serif", fontSize: '18px', fontWeight: 700, color: '#1c1917', margin: 0 };

    return (
        <div>
            {/* Header */}
            <div style={{ marginBottom: '32px' }}>
                <h1 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '24px', fontWeight: 700, color: '#1c1917', margin: '0 0 6px 0' }}>
                    Join a Queue
                </h1>
                <p style={{ fontSize: '14px', color: '#78716c', margin: 0 }}>Select a tutoring service below to get in line.</p>
            </div>

            {/* Toast Notifications */}
            {joinSuccess && (
                <div style={{
                    position: 'fixed', top: '80px', right: '16px', zIndex: 50,
                    padding: '14px 20px', borderRadius: '14px',
                    background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534',
                    fontSize: '13px', fontWeight: 500, boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                    display: 'flex', alignItems: 'center', gap: '10px',
                }}>
                    ✅ Successfully joined the queue!
                </div>
            )}
            {joinError && (
                <div style={{
                    position: 'fixed', top: '80px', right: '16px', zIndex: 50,
                    padding: '14px 20px', borderRadius: '14px',
                    background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b',
                    fontSize: '13px', fontWeight: 500, boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                    display: 'flex', alignItems: 'center', gap: '10px',
                }}>
                    ❌ {joinError}
                </div>
            )}

            {/* Services Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
                {services.map((service) => {
                    const queueLength = getQueueForService(service.id).length;
                    const userEntry = getUserQueueEntry(service.id);
                    const isInQueue = !!userEntry;
                    const eta = getEstimatedWait(service.id, queueLength + 1);
                    const isSelected = selectedService === service.id;

                    return (
                        <div key={service.id} style={{
                            ...card,
                            opacity: service.isOpen ? 1 : 0.55,
                            border: isSelected ? '2px solid #C8102E' : '1px solid #e7e5e4',
                            boxShadow: isSelected ? '0 0 0 3px rgba(200,16,46,0.1)' : 'none',
                            transition: 'all 0.2s ease',
                            position: 'relative',
                            overflow: 'hidden',
                        }}>
                            {/* Service Header */}
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                    <div style={{
                                        width: '48px', height: '48px', borderRadius: '12px',
                                        background: '#fafaf9', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '24px', flexShrink: 0,
                                    }}>
                                        {service.icon}
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#1c1917', margin: 0 }}>{service.name}</h3>
                                        <p style={{ fontSize: '12px', color: '#78716c', margin: '3px 0 0 0' }}>{service.category}</p>
                                    </div>
                                </div>
                                <span style={{
                                    padding: '4px 10px', borderRadius: '8px',
                                    fontSize: '11px', fontWeight: 600,
                                    background: service.isOpen ? '#f0fdf4' : '#f5f5f4',
                                    color: service.isOpen ? '#16a34a' : '#78716c',
                                    border: service.isOpen ? '1px solid #bbf7d0' : '1px solid #e7e5e4',
                                    whiteSpace: 'nowrap',
                                }}>
                                    {service.isOpen ? '● Open' : '● Closed'}
                                </span>
                            </div>

                            {/* Description */}
                            <p style={{ fontSize: '13px', color: '#57534e', lineHeight: 1.6, margin: '0 0 16px 0' }}>
                                {service.description}
                            </p>

                            {/* Meta row */}
                            <div style={{ display: 'flex', gap: '20px', marginBottom: '16px', fontSize: '12px', color: '#78716c' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    🕐 ~{service.expectedDuration} min
                                </span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    👥 {queueLength} in queue
                                </span>
                            </div>

                            {/* Estimated Wait Bar */}
                            <div style={{
                                padding: '14px 16px', borderRadius: '12px',
                                background: 'linear-gradient(135deg, #fafaf9, #f5f5f4)',
                                border: '1px solid #e7e5e4',
                                marginBottom: '16px',
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            }}>
                                <span style={{ fontSize: '12px', color: '#78716c', fontWeight: 500 }}>Estimated wait</span>
                                <span style={{ fontSize: '15px', fontWeight: 700, color: eta > 0 ? '#C8102E' : '#16a34a' }}>
                                    {eta > 0 ? `~${eta} min` : 'No wait!'}
                                </span>
                            </div>

                            {/* Expand: notes + priority */}
                            {isSelected && !isInQueue && service.isOpen && (
                                <div style={{ marginBottom: '16px', padding: '16px', borderRadius: '12px', background: '#fafaf9', border: '1px solid #f0eeee' }}>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#44403c', marginBottom: '8px' }}>
                                        What do you need help with? (optional)
                                    </label>
                                    <textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder="e.g., Integration by parts, Chapter 5 problems..."
                                        rows={2}
                                        style={{
                                            width: '100%', padding: '10px 14px', borderRadius: '10px',
                                            border: '1px solid #d6d3d1', fontSize: '13px', resize: 'none',
                                            background: '#fff', boxSizing: 'border-box',
                                            outline: 'none', fontFamily: 'inherit',
                                        }}
                                    />
                                    <div style={{ marginTop: '12px' }}>
                                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#44403c', marginBottom: '8px' }}>Priority</label>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            {['normal', 'high'].map((p) => (
                                                <button
                                                    key={p}
                                                    type="button"
                                                    onClick={() => setPriority(p)}
                                                    style={{
                                                        padding: '6px 14px', borderRadius: '8px',
                                                        fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                                                        border: priority === p ? '1px solid #C8102E' : '1px solid #d6d3d1',
                                                        background: priority === p ? '#fef2f2' : '#fff',
                                                        color: priority === p ? '#C8102E' : '#57534e',
                                                        transition: 'all 0.15s',
                                                    }}
                                                >
                                                    {p === 'high' ? '🔥 Urgent' : '📝 Normal'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Action Button */}
                            {service.isOpen ? (
                                isInQueue ? (
                                    <button
                                        onClick={() => handleLeave(service.id)}
                                        style={{
                                            width: '100%', padding: '12px', borderRadius: '12px',
                                            border: '2px solid #fecaca', background: '#fef2f2', color: '#991b1b',
                                            fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = '#fee2e2'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = '#fef2f2'}
                                    >
                                        Leave Queue
                                    </button>
                                ) : isSelected ? (
                                    <button
                                        onClick={() => handleJoin(service.id)}
                                        style={{
                                            width: '100%', padding: '12px', borderRadius: '12px',
                                            border: 'none', background: 'linear-gradient(135deg, #C8102E, #E8384F)',
                                            color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                                            transition: 'all 0.15s', boxShadow: '0 4px 12px rgba(200,16,46,0.25)',
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                                        onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                                    >
                                        Join Queue →
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => setSelectedService(service.id)}
                                        style={{
                                            width: '100%', padding: '12px', borderRadius: '12px',
                                            border: '1px solid #e7e5e4', background: '#fff', color: '#44403c',
                                            fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
                                        }}
                                        onMouseEnter={(e) => { e.currentTarget.style.background = '#fafaf9'; e.currentTarget.style.borderColor = '#C8102E'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#e7e5e4'; }}
                                    >
                                        Select Service
                                    </button>
                                )
                            ) : (
                                <button disabled style={{
                                    width: '100%', padding: '12px', borderRadius: '12px',
                                    border: 'none', background: '#f5f5f4', color: '#a8a29e',
                                    fontSize: '13px', fontWeight: 600, cursor: 'not-allowed',
                                }}>
                                    Currently Closed
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}