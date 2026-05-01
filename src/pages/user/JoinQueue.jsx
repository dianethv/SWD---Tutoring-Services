import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatWait } from '../../utils/formatWait';

export default function JoinQueue() {
    const {
        services,
        joinQueue,
        getUserQueueEntry,
        getQueueForService,
        getEstimatedWait,
        getRecommendedAlternative,
        leaveQueue,
    } = useApp();
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
            setSelectedService(null);
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

    const openServices = services.filter((s) => s.isOpen);
    const totalInLine = services.reduce(
        (sum, s) => sum + getQueueForService(s.id).length,
        0
    );

    return (
        <div className="join-queue-page">
            {/* ── Hero ────────────────────────────────────────────────── */}
            <section className="tc-page-hero">
                <span className="tc-page-eyebrow">
                    {openServices.length > 0
                        ? `Open Now · ${openServices.length} ${openServices.length === 1 ? 'service' : 'services'}`
                        : 'Tutoring Center · Closed'}
                </span>
                <h1 className="tc-page-headline" style={{ marginTop: 16 }}>
                    Pick a service<span className="tc-dot">.</span>
                </h1>
                <p className="tc-page-sub">
                    Browse the live tutoring services below and grab a ticket.
                    {totalInLine > 0
                        ? ` ${totalInLine} ${totalInLine === 1 ? 'student is' : 'students are'} already in line.`
                        : ' No one is waiting right now — perfect time to hop in.'}
                </p>
            </section>

            {/* ── Toast Notifications ────────────────────────────────── */}
            {joinSuccess && (
                <div className="app-toast" style={{
                    position: 'fixed', top: '80px', right: '16px', zIndex: 50,
                    padding: '14px 20px', borderRadius: 14,
                    background: '#fff', border: '1px solid #bbf7d0',
                    color: '#166534', fontSize: 13, fontWeight: 500,
                    boxShadow: '0 14px 40px -16px rgba(22, 163, 74, 0.35)',
                    display: 'flex', alignItems: 'center', gap: 10,
                }}>
                    <span className="tc-pulse-dot" />
                    Successfully joined the queue.
                </div>
            )}
            {joinError && (
                <div className="app-toast" style={{
                    position: 'fixed', top: '80px', right: '16px', zIndex: 50,
                    padding: '14px 20px', borderRadius: 14,
                    background: '#fff', border: '1px solid #fecaca',
                    color: '#991b1b', fontSize: 13, fontWeight: 500,
                    boxShadow: '0 14px 40px -16px rgba(220, 38, 38, 0.35)',
                    display: 'flex', alignItems: 'center', gap: 10,
                }}>
                    <span style={{ width: 8, height: 8, borderRadius: 999, background: '#dc2626', display: 'inline-block' }} />
                    {joinError}
                </div>
            )}

            {/* ── Services Section ───────────────────────────────────── */}
            <section style={{ marginBottom: 36 }}>
                <div className="tc-section-head">
                    <div>
                        <span className="tc-page-eyebrow">All Services</span>
                        <h2 className="tc-section-title">Available now</h2>
                    </div>
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: 16,
                }}>
                    {services.map((service) => {
                        const queueLength = getQueueForService(service.id).length;
                        const userEntry = getUserQueueEntry(service.id);
                        const isInQueue = !!userEntry;
                        const eta = getEstimatedWait(service.id, queueLength + 1);
                        const recommendation = getRecommendedAlternative(service.id);
                        const isSelected = selectedService === service.id;
                        const accent = !service.isOpen
                            ? '#d6d3d1'
                            : isInQueue
                                ? '#16a34a'
                                : isSelected
                                    ? '#C8102E'
                                    : '#e7e5e4';

                        return (
                            <div
                                key={service.id}
                                className={service.isOpen ? 'tc-lift' : ''}
                                style={{
                                    background: '#ffffff',
                                    border: `1px solid ${isSelected ? '#C8102E' : '#e7e5e4'}`,
                                    borderTop: `3px solid ${accent}`,
                                    borderRadius: 14,
                                    padding: 22,
                                    opacity: service.isOpen ? 1 : 0.6,
                                    boxShadow: isSelected ? '0 0 0 3px rgba(200,16,46,0.08)' : 'none',
                                    transition: 'all 0.2s ease',
                                    display: 'flex',
                                    flexDirection: 'column',
                                }}
                            >
                                {/* Top row: category + status pill */}
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                                    <span className="tc-stat-eyebrow" style={{ margin: 0 }}>
                                        {service.category}
                                    </span>
                                    {service.isOpen ? (
                                        isInQueue ? (
                                            <span className="tc-pill tc-pill-success">
                                                <span className="tc-pulse-dot" /> IN LINE · #{userEntry.position}
                                            </span>
                                        ) : (
                                            <span className="tc-pill tc-pill-success">
                                                <span className="tc-pulse-dot" /> OPEN
                                            </span>
                                        )
                                    ) : (
                                        <span className="tc-pill tc-pill-neutral">CLOSED</span>
                                    )}
                                </div>

                                {/* Service name */}
                                <p style={{
                                    fontFamily: 'Outfit, sans-serif',
                                    fontSize: 18,
                                    fontWeight: 700,
                                    color: '#1c1917',
                                    margin: '0 0 6px 0',
                                    letterSpacing: '-0.012em',
                                    lineHeight: 1.2,
                                }}>
                                    {service.name}
                                </p>

                                {/* Description */}
                                <p style={{
                                    fontSize: 13,
                                    color: '#78716c',
                                    lineHeight: 1.55,
                                    margin: '0 0 18px 0',
                                    flex: 1,
                                }}>
                                    {service.description}
                                </p>

                                {/* Mono meta row */}
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    paddingTop: 14,
                                    borderTop: '1px dashed #e7e5e4',
                                    marginBottom: 14,
                                }}>
                                    <span className="tc-mono" style={{ fontSize: 11, color: '#78716c', letterSpacing: '0.1em', fontWeight: 600 }}>
                                        ~{service.expectedDuration}M SESSION
                                    </span>
                                    <span className="tc-mono" style={{ fontSize: 11, color: '#78716c', letterSpacing: '0.1em', fontWeight: 600 }}>
                                        {queueLength} IN QUEUE
                                    </span>
                                </div>

                                {/* Estimated wait — receipt-style numbers */}
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'baseline',
                                    justifyContent: 'space-between',
                                    paddingBottom: 14,
                                    marginBottom: 14,
                                    borderBottom: '1px dashed #e7e5e4',
                                }}>
                                    <span className="tc-mono" style={{ fontSize: 11, color: '#78716c', letterSpacing: '0.1em', fontWeight: 600 }}>
                                        ESTIMATED WAIT
                                    </span>
                                    <span className="tc-mono" style={{
                                        fontSize: 22,
                                        fontWeight: 700,
                                        color: eta > 0 ? '#1c1917' : '#16a34a',
                                        letterSpacing: '-0.025em',
                                        lineHeight: 1,
                                    }}>
                                        {eta > 0 ? formatWait(eta, { prefix: '~' }) : 'No wait'}
                                    </span>
                                </div>

                                {/* Recommendation tip */}
                                {recommendation && service.isOpen && !isInQueue && (
                                    <div
                                        className="smart-recommendation"
                                        style={{
                                            position: 'relative',
                                            background: '#FAF7F2',
                                            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(28, 25, 23, 0.06) 1px, transparent 0)',
                                            backgroundSize: '14px 14px',
                                            border: '1px solid #ece9e2',
                                            borderTop: '2px solid #C8102E',
                                            borderRadius: 10,
                                            padding: '12px 14px',
                                            marginBottom: 14,
                                            fontSize: 12,
                                            color: '#44403c',
                                            lineHeight: 1.55,
                                        }}
                                    >
                                        <span className="tc-mono" style={{ fontSize: 10, color: '#C8102E', fontWeight: 700, letterSpacing: '0.12em', display: 'block', marginBottom: 4 }}>
                                            FASTER OPTION
                                        </span>
                                        <strong style={{ color: '#1c1917' }}>{recommendation.serviceName}</strong>{' '}
                                        is open with a {formatWait(recommendation.smartEstimate, { prefix: '~' })} wait — saves about{' '}
                                        <strong style={{ color: '#C8102E' }}>{formatWait(recommendation.minutesSaved)}</strong>.
                                    </div>
                                )}

                                {/* Expanded form: notes + priority */}
                                {isSelected && !isInQueue && service.isOpen && (
                                    <div style={{
                                        background: '#fafaf9',
                                        border: '1px solid #f0eeee',
                                        borderRadius: 10,
                                        padding: 14,
                                        marginBottom: 14,
                                    }}>
                                        <span className="tc-mono" style={{
                                            fontSize: 10,
                                            fontWeight: 700,
                                            color: '#78716c',
                                            letterSpacing: '0.12em',
                                            display: 'block',
                                            marginBottom: 8,
                                        }}>
                                            WHAT DO YOU NEED HELP WITH?
                                        </span>
                                        <textarea
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                            placeholder="e.g., Integration by parts, Chapter 5 problems..."
                                            rows={2}
                                            style={{
                                                width: '100%',
                                                padding: '8px 12px',
                                                borderRadius: 8,
                                                border: '1px solid #e7e5e4',
                                                fontSize: 13,
                                                resize: 'none',
                                                background: '#fff',
                                                boxSizing: 'border-box',
                                                outline: 'none',
                                                fontFamily: 'inherit',
                                                color: '#1c1917',
                                                minHeight: 'unset',
                                                lineHeight: 1.5,
                                            }}
                                        />
                                        <span className="tc-mono" style={{
                                            fontSize: 10,
                                            fontWeight: 700,
                                            color: '#78716c',
                                            letterSpacing: '0.12em',
                                            display: 'block',
                                            margin: '12px 0 8px 0',
                                        }}>
                                            PRIORITY
                                        </span>
                                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                            {[
                                                { id: 'normal', label: 'Normal' },
                                                { id: 'high', label: 'Urgent' },
                                            ].map((p) => (
                                                <button
                                                    key={p.id}
                                                    type="button"
                                                    onClick={() => setPriority(p.id)}
                                                    className="tc-mono"
                                                    style={{
                                                        padding: '6px 14px',
                                                        borderRadius: 999,
                                                        fontSize: 11,
                                                        fontWeight: 700,
                                                        cursor: 'pointer',
                                                        border: priority === p.id ? '1px solid #C8102E' : '1px solid #e7e5e4',
                                                        background: priority === p.id ? '#fef2f2' : '#fff',
                                                        color: priority === p.id ? '#C8102E' : '#78716c',
                                                        letterSpacing: '0.08em',
                                                        textTransform: 'uppercase',
                                                        transition: 'all 0.15s',
                                                    }}
                                                >
                                                    {p.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Action button */}
                                {service.isOpen ? (
                                    isInQueue ? (
                                        <button
                                            onClick={() => handleLeave(service.id)}
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
                                    ) : isSelected ? (
                                        <button
                                            onClick={() => handleJoin(service.id)}
                                            style={{
                                                width: '100%',
                                                padding: '12px 16px',
                                                borderRadius: 10,
                                                border: 'none',
                                                background: '#C8102E',
                                                color: '#fff',
                                                fontSize: 13,
                                                fontWeight: 600,
                                                cursor: 'pointer',
                                                transition: 'all 0.15s',
                                                boxShadow: '0 4px 14px -6px rgba(200, 16, 46, 0.45)',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: 8,
                                                fontFamily: 'inherit',
                                            }}
                                            onMouseEnter={(e) => { e.currentTarget.style.background = '#960C22'; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.background = '#C8102E'; }}
                                        >
                                            Confirm & join
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <line x1="5" y1="12" x2="19" y2="12" />
                                                <polyline points="12 5 19 12 12 19" />
                                            </svg>
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => setSelectedService(service.id)}
                                            style={{
                                                width: '100%',
                                                padding: '12px 16px',
                                                borderRadius: 10,
                                                border: '1px solid #e7e5e4',
                                                background: '#fff',
                                                color: '#1c1917',
                                                fontSize: 13,
                                                fontWeight: 600,
                                                cursor: 'pointer',
                                                transition: 'all 0.15s',
                                                fontFamily: 'inherit',
                                            }}
                                            onMouseEnter={(e) => { e.currentTarget.style.background = '#fafaf9'; e.currentTarget.style.borderColor = '#1c1917'; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#e7e5e4'; }}
                                        >
                                            Select service
                                        </button>
                                    )
                                ) : (
                                    <button disabled style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        borderRadius: 10,
                                        border: '1px solid #e7e5e4',
                                        background: '#fafaf9',
                                        color: '#a8a29e',
                                        fontSize: 13,
                                        fontWeight: 600,
                                        cursor: 'not-allowed',
                                        fontFamily: 'inherit',
                                    }}>
                                        Currently closed
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            </section>
        </div>
    );
}
