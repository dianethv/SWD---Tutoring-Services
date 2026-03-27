import { useApp } from '../../context/AppContext';
import { Link } from 'react-router-dom';

export default function QueueStatus() {
  const { services, getUserActiveQueues, getEstimatedWait, leaveQueue } = useApp();
  const activeQueues = getUserActiveQueues();

  const heading = { fontFamily: "'Outfit', sans-serif", fontSize: '24px', fontWeight: 700, color: '#1c1917', margin: '0 0 6px 0' };
  const card = { background: '#fff', border: '1px solid #e7e5e4', borderRadius: '16px', overflow: 'hidden' };

  /* ── Empty State ─────────────────────────────── */
  if (activeQueues.length === 0) {
    return (
      <div>
        <div style={{ marginBottom: '32px' }}>
          <h1 style={heading}>Queue Status</h1>
          <p style={{ fontSize: '14px', color: '#78716c', margin: 0 }}>Track your current position in active queues.</p>
        </div>

        <div style={{
          ...card, textAlign: 'center', padding: '64px 24px',
          background: 'linear-gradient(180deg, #fff 0%, #fafaf9 100%)',
        }}>
          <div style={{ fontSize: '56px', marginBottom: '16px' }}>🎯</div>
          <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '20px', fontWeight: 700, color: '#1c1917', margin: '0 0 8px 0' }}>
            You're not in any queues
          </h2>
          <p style={{ fontSize: '14px', color: '#78716c', margin: '0 0 28px 0', maxWidth: '340px', marginLeft: 'auto', marginRight: 'auto' }}>
            Ready to get help? Join a tutoring session to get started.
          </p>
          <Link
            to="/join-queue"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '12px 28px', borderRadius: '12px',
              background: 'linear-gradient(135deg, #C8102E, #E8384F)',
              color: '#fff', fontSize: '14px', fontWeight: 600,
              textDecoration: 'none', boxShadow: '0 4px 14px rgba(200,16,46,0.3)',
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            ➕ Join a Session
          </Link>
        </div>
      </div>
    );
  }

  /* ── Active Queues ───────────────────────────── */
  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={heading}>Queue Status</h1>
        <p style={{ fontSize: '14px', color: '#78716c', margin: 0 }}>Live updates for your active queues.</p>
      </div>

      {/* Summary pill */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: '8px',
        padding: '8px 18px', borderRadius: '20px',
        background: '#fef2f2', border: '1px solid #fecaca',
        fontSize: '13px', fontWeight: 600, color: '#C8102E',
        marginBottom: '24px',
      }}>
        🔴 {activeQueues.length} active queue{activeQueues.length > 1 ? 's' : ''}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {activeQueues.map((q) => {
          const service = services.find((s) => s.id === q.serviceId);
          const eta = getEstimatedWait(q.serviceId, q.position);
          const progressPct = Math.max(10, 100 - (q.position - 1) * 25);
          const isNext = q.position === 1;
          const isAlmostReady = q.position <= 2;
          const minAgo = Math.round((Date.now() - new Date(q.joinedAt).getTime()) / 60000);

          // Color scheme based on urgency
          const accent = isNext ? '#16a34a' : isAlmostReady ? '#ea580c' : '#C8102E';
          const accentLight = isNext ? '#f0fdf4' : isAlmostReady ? '#fff7ed' : '#fef2f2';
          const accentBorder = isNext ? '#bbf7d0' : isAlmostReady ? '#fed7aa' : '#fecaca';
          const statusText = isNext ? "You're next!" : isAlmostReady ? 'Almost your turn' : 'Waiting';
          const statusEmoji = isNext ? '🟢' : isAlmostReady ? '🟠' : '🔴';

          const steps = [
            { label: 'Joined', done: true },
            { label: 'Waiting', done: q.position <= 3 },
            { label: 'Almost Ready', done: q.position <= 2 },
            { label: 'Your Turn', done: q.position === 1 },
          ];

          return (
            <div key={q.id} style={{ ...card, position: 'relative' }}>
              {/* Top accent strip */}
              <div style={{
                height: '4px',
                background: `linear-gradient(90deg, ${accent}, ${accent}99)`,
              }} />

              <div style={{ padding: '28px' }}>
                {/* Service header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                      width: '56px', height: '56px', borderRadius: '14px',
                      background: accentLight, border: `1px solid ${accentBorder}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '28px',
                    }}>
                      {service?.icon}
                    </div>
                    <div>
                      <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '18px', fontWeight: 700, color: '#1c1917', margin: 0 }}>
                        {service?.name}
                      </h2>
                      <p style={{ fontSize: '13px', color: '#78716c', margin: '4px 0 0 0' }}>{service?.category}</p>
                      {q.notes && (
                        <p style={{ fontSize: '12px', color: '#a8a29e', margin: '6px 0 0 0', fontStyle: 'italic' }}>"{q.notes}"</p>
                      )}
                    </div>
                  </div>

                  {/* Status badge */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '6px 16px', borderRadius: '20px',
                    background: accentLight, border: `1px solid ${accentBorder}`,
                    fontSize: '12px', fontWeight: 700, color: accent,
                    whiteSpace: 'nowrap',
                  }}>
                    {statusEmoji} {statusText}
                  </div>
                </div>

                {/* Stat cards — Position, ETA, Joined */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '24px' }}>
                  {/* Position */}
                  <div style={{
                    textAlign: 'center', padding: '20px 16px', borderRadius: '14px',
                    background: `linear-gradient(135deg, ${accentLight}, #fff)`,
                    border: `1px solid ${accentBorder}`,
                  }}>
                    <p style={{ fontSize: '11px', fontWeight: 600, color: '#a8a29e', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px 0' }}>
                      Position
                    </p>
                    <p style={{ fontSize: '36px', fontWeight: 800, color: accent, margin: 0, lineHeight: 1, fontFamily: "'Outfit', sans-serif" }}>
                      #{q.position}
                    </p>
                  </div>

                  {/* Est. Wait */}
                  <div style={{
                    textAlign: 'center', padding: '20px 16px', borderRadius: '14px',
                    background: 'linear-gradient(135deg, #fafaf9, #fff)',
                    border: '1px solid #e7e5e4',
                  }}>
                    <p style={{ fontSize: '11px', fontWeight: 600, color: '#a8a29e', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px 0' }}>
                      Est. Wait
                    </p>
                    <p style={{ fontSize: '36px', fontWeight: 800, color: '#1c1917', margin: 0, lineHeight: 1, fontFamily: "'Outfit', sans-serif" }}>
                      {eta > 0 ? eta : '<1'}
                    </p>
                    <p style={{ fontSize: '11px', color: '#78716c', margin: '6px 0 0 0' }}>minutes</p>
                  </div>

                  {/* Joined */}
                  <div style={{
                    textAlign: 'center', padding: '20px 16px', borderRadius: '14px',
                    background: 'linear-gradient(135deg, #fafaf9, #fff)',
                    border: '1px solid #e7e5e4',
                  }}>
                    <p style={{ fontSize: '11px', fontWeight: 600, color: '#a8a29e', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px 0' }}>
                      Joined
                    </p>
                    <p style={{ fontSize: '18px', fontWeight: 700, color: '#1c1917', margin: 0, lineHeight: 1 }}>
                      {new Date(q.joinedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p style={{ fontSize: '11px', color: '#78716c', margin: '6px 0 0 0' }}>{minAgo} min ago</p>
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#57534e' }}>Progress</span>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: accent }}>{Math.round(progressPct)}%</span>
                  </div>
                  <div style={{ height: '10px', background: '#f5f5f4', borderRadius: '8px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: '8px',
                      width: `${progressPct}%`,
                      background: `linear-gradient(90deg, ${accent}, ${accent}cc)`,
                      transition: 'width 1s ease-out',
                    }} />
                  </div>
                </div>

                {/* Timeline steps */}
                <div style={{
                  display: 'flex', alignItems: 'flex-start',
                  marginBottom: '28px', padding: '20px', borderRadius: '14px',
                  background: '#fafaf9', border: '1px solid #f0eeee',
                }}>
                  {steps.map((step, i) => (
                    <div key={step.label} style={{ display: 'contents' }}>
                      {/* Step circle + label */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          width: '36px', height: '36px', borderRadius: '50%',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: step.done ? '16px' : '14px',
                          background: step.done ? accent : '#fff',
                          color: step.done ? '#fff' : '#a8a29e',
                          border: step.done ? 'none' : '2px solid #d6d3d1',
                          fontWeight: 700,
                          boxShadow: step.done ? `0 2px 8px ${accent}44` : 'none',
                          transition: 'all 0.3s',
                          flexShrink: 0,
                        }}>
                          {step.done ? '✓' : i + 1}
                        </div>
                        <span style={{
                          fontSize: '11px', fontWeight: 600,
                          color: step.done ? accent : '#a8a29e',
                          whiteSpace: 'nowrap',
                        }}>
                          {step.label}
                        </span>
                      </div>
                      {/* Connector line between circles */}
                      {i < steps.length - 1 && (
                        <div style={{
                          flex: 1, height: '2px', marginTop: '17px',
                          background: steps[i + 1].done ? accent : '#e7e5e4',
                          transition: 'background 0.3s',
                        }} />
                      )}
                    </div>
                  ))}
                </div>

                {/* Leave queue button */}
                <button
                  onClick={() => leaveQueue(q.id)}
                  style={{
                    width: '100%', padding: '12px', borderRadius: '12px',
                    border: '2px solid #fecaca', background: '#fef2f2', color: '#991b1b',
                    fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#fee2e2'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#fef2f2'}
                >
                  Leave Queue
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}