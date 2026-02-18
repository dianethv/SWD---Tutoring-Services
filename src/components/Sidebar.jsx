import { NavLink } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function Sidebar({ isOpen, onClose }) {
    const { currentUser } = useApp();
    const isAdmin = currentUser?.role === 'admin';

    const studentLinks = [
        { to: '/dashboard', label: 'Dashboard', icon: 'home' },
        { to: '/join-queue', label: 'Join Queue', icon: 'queue' },
        { to: '/queue-status', label: 'Queue Status', icon: 'status' },
        { to: '/history', label: 'History', icon: 'history' },
    ];

    const adminLinks = [
        { to: '/admin', label: 'Dashboard', icon: 'home' },
        { to: '/admin/services', label: 'Services', icon: 'services' },
        { to: '/admin/queues', label: 'Queue Mgmt', icon: 'queue' },
    ];

    const links = isAdmin ? adminLinks : studentLinks;

    const iconPaths = {
        home: <><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></>,
        queue: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
        status: <><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></>,
        history: <><path d="M3 3v5h5" /><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8" /><path d="M12 7v5l4 2" /></>,
        services: <><path d="M12 20h9" /><path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z" /></>,
    };

    return (
        <aside style={{
            position: 'fixed',
            left: 0,
            top: 0,
            bottom: 0,
            width: '256px',
            background: '#ffffff',
            borderRight: '1px solid #e7e5e4',
            zIndex: 40,
            paddingTop: '76px',
            transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
            transition: 'transform 0.3s ease',
        }}>
            {/* Close button */}
            <button
                onClick={onClose}
                style={{
                    position: 'absolute',
                    top: '76px',
                    right: '12px',
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#a8a29e',
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                }}
                aria-label="Close sidebar"
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
            </button>

            <div style={{ padding: '8px 12px' }}>
                <p style={{ padding: '4px 12px', marginBottom: '8px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#a8a29e' }}>
                    {isAdmin ? 'Administration' : 'Navigation'}
                </p>
                <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {links.map((link) => (
                        <NavLink
                            key={link.to}
                            to={link.to}
                            end={link.to === '/admin' || link.to === '/dashboard'}
                            onClick={onClose}
                            style={({ isActive }) => ({
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '10px 12px',
                                borderRadius: '10px',
                                fontSize: '14px',
                                fontWeight: 500,
                                textDecoration: 'none',
                                transition: 'all 0.15s ease',
                                background: isActive ? '#fef2f2' : 'transparent',
                                color: isActive ? '#C8102E' : '#57534e',
                            })}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                {iconPaths[link.icon]}
                            </svg>
                            {link.label}
                        </NavLink>
                    ))}
                </nav>
            </div>

            {/* Bottom help card */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '16px', borderTop: '1px solid #f5f5f4' }}>
                <div style={{ padding: '14px', borderRadius: '12px', background: 'linear-gradient(135deg, #fef2f2, #fee2e2)', border: '1px solid #fecaca' }}>
                    <p style={{ fontSize: '12px', fontWeight: 600, color: '#960C22', marginBottom: '4px' }}>Need help?</p>
                    <p style={{ fontSize: '12px', color: '#C8102E', lineHeight: 1.5 }}>
                        Visit the tutoring center in Room 204 of the Student Union.
                    </p>
                </div>
            </div>
        </aside>
    );
}
