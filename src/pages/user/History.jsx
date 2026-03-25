import { useApp } from '../../context/AppContext';

export default function History() {
  const { getUserHistory } = useApp();
  const history = getUserHistory();

  const outcomeMeta = (outcome) => {
    switch (outcome) {
      case 'served':
        return { label: 'Completed', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', icon: '✅' };
      case 'cancelled':
        return { label: 'Cancelled', color: '#78716c', bg: '#fafaf9', border: '#e7e5e4', icon: '🚫' };
      case 'no-show':
        return { label: 'No Show', color: '#dc2626', bg: '#fef2f2', border: '#fecaca', icon: '⚠️' };
      default:
        return { label: '—', color: '#a8a29e', bg: '#fafaf9', border: '#e7e5e4', icon: '❔' };
    }
  };

  // Accent icons for cards — rotated in top-right corner
  const cardIcons = ['📖', '🎓', '📐', '🧮', '💡', '🔬', '📝', '🖥️'];

  const card = { background: '#fff', border: '1px solid #e7e5e4', borderRadius: '16px', padding: '24px' };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '24px', fontWeight: 700, color: '#1c1917', margin: '0 0 6px 0' }}>
          Session History
        </h1>
        <p style={{ fontSize: '14px', color: '#78716c', margin: 0 }}>A record of your tutoring activity.</p>
      </div>

      {/* Summary Stats */}
      {history.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
          <div style={card}>
            <p style={{ fontSize: '28px', fontWeight: 700, color: '#1c1917', margin: 0, lineHeight: 1 }}>{history.length}</p>
            <p style={{ fontSize: '13px', color: '#78716c', margin: '6px 0 0 0' }}>Total Sessions</p>
          </div>
          <div style={card}>
            <p style={{ fontSize: '28px', fontWeight: 700, color: '#16a34a', margin: 0, lineHeight: 1 }}>
              {history.filter((h) => h.outcome === 'served').length}
            </p>
            <p style={{ fontSize: '13px', color: '#78716c', margin: '6px 0 0 0' }}>Completed</p>
          </div>
          <div style={card}>
            <p style={{ fontSize: '28px', fontWeight: 700, color: '#C8102E', margin: 0, lineHeight: 1 }}>
              {history.filter((h) => h.waitTime).reduce((sum, h) => sum + h.waitTime, 0) > 0
                ? `${Math.round(history.filter((h) => h.waitTime).reduce((sum, h) => sum + h.waitTime, 0) / history.filter((h) => h.waitTime).length)}m`
                : '—'}
            </p>
            <p style={{ fontSize: '13px', color: '#78716c', margin: '6px 0 0 0' }}>Avg Wait Time</p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {history.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '80px 24px',
          border: '2px dashed #d6d3d1', borderRadius: '16px', background: '#fafaf9',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.6 }}>📚</div>
          <p style={{ fontSize: '14px', color: '#78716c', margin: 0 }}>Your completed sessions will appear here.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {history.map((h, i) => {
            const meta = outcomeMeta(h.outcome);
            const accent = cardIcons[i % cardIcons.length];

            return (
              <div key={h.id} style={{
                ...card,
                position: 'relative',
                overflow: 'hidden',
                transition: 'box-shadow 0.2s, transform 0.2s',
              }}
                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                {/* Corner decorative icon */}
                <div style={{
                  position: 'absolute', top: '-6px', right: '-6px',
                  width: '56px', height: '56px',
                  borderRadius: '0 16px 0 20px',
                  background: meta.bg, border: `1px solid ${meta.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '22px',
                }}>
                  {accent}
                </div>

                {/* Service name + date */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px', paddingRight: '60px' }}>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1c1917', margin: 0 }}>{h.serviceName}</h3>
                    <p style={{ fontSize: '13px', color: '#78716c', margin: '4px 0 0 0' }}>{h.date}</p>
                  </div>
                </div>

                {/* Outcome badge */}
                <div style={{ marginBottom: '16px' }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    padding: '5px 14px', borderRadius: '20px',
                    fontSize: '12px', fontWeight: 600,
                    background: meta.bg, color: meta.color, border: `1px solid ${meta.border}`,
                  }}>
                    {meta.icon} {meta.label}
                  </span>
                </div>

                {/* Divider */}
                <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, #e7e5e4, transparent)', margin: '0 0 16px 0' }} />

                {/* Stats row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                  <div>
                    <p style={{ fontSize: '11px', fontWeight: 600, color: '#a8a29e', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>Joined</p>
                    <p style={{ fontSize: '14px', fontWeight: 600, color: '#1c1917', margin: '4px 0 0 0' }}>{h.joinedAt}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '11px', fontWeight: 600, color: '#a8a29e', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>Served</p>
                    <p style={{ fontSize: '14px', fontWeight: 600, color: '#1c1917', margin: '4px 0 0 0' }}>{h.servedAt || '—'}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '11px', fontWeight: 600, color: '#a8a29e', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>Wait Time</p>
                    <p style={{ fontSize: '14px', fontWeight: 600, color: '#1c1917', margin: '4px 0 0 0' }}>{h.waitTime ? `${h.waitTime} min` : '—'}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}