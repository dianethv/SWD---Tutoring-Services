import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function Navbar({ onMenuToggle }) {
    const { currentUser, logout, getUnreadCount, getUserNotifications, markNotificationRead, markAllNotificationsRead } = useApp();
    const [showNotifs, setShowNotifs] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const notifRef = useRef(null);
    const profileRef = useRef(null);
    const navigate = useNavigate();
    const unreadCount = getUnreadCount();
    const notifications = getUserNotifications();

    useEffect(() => {
        function handleClick(e) {
            if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifs(false);
            if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false);
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const getInitials = (name) =>
        name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || '?';

    const timeAgo = (timestamp) => {
        const diff = Date.now() - new Date(timestamp).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'just now';
        if (mins < 60) return `${mins}m ago`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}h ago`;
        return `${Math.floor(hours / 24)}d ago`;
    };

    const notifIcon = (type) => {
        switch (type) {
            case 'queue_update': return '📋';
            case 'status_change': return '🔄';
            case 'reminder': return '⏰';
            default: return 'ℹ️';
        }
    };

    return (
        <nav
            className="fixed top-0 left-0 right-0 z-50 border-b border-stone-200"
            style={{
                height: '64px',
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
            }}
        >
            <div className="flex items-center justify-between h-full px-4 lg:px-6">
                {/* Left: Hamburger + Logo */}
                <div className="flex items-center gap-3">
                    {/* Mobile hamburger */}
                    <button
                        onClick={onMenuToggle}
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-stone-500 hover:bg-stone-100 hover:text-stone-700 transition-colors cursor-pointer border-none bg-transparent"
                        aria-label="Toggle sidebar"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="3" y1="6" x2="21" y2="6" />
                            <line x1="3" y1="12" x2="21" y2="12" />
                            <line x1="3" y1="18" x2="21" y2="18" />
                        </svg>
                    </button>

                    {/* Logo */}
                    <Link to={currentUser?.role === 'admin' ? '/admin' : '/dashboard'} className="flex items-center gap-2.5 no-underline">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
                            style={{ background: 'linear-gradient(135deg, #C8102E, #E8384F)' }}>
                            🐾
                        </div>
                        <span className="text-lg font-bold text-stone-800" style={{ fontFamily: 'Outfit, sans-serif' }}>
                            Tutor<span style={{ color: '#C8102E' }}>Coogs</span>
                        </span>
                    </Link>
                </div>
                 {/* Search Bar (Desktop) */}
                    <div className="flex-1 max-w-md mx-6 hidden md:block">
                        <input
                            type="text"
                            placeholder="Search services..."
                            className="w-full px-4 py-2 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                    </div>
                {/* Right side */}
                <div className="flex items-center gap-2">
                    {/* Notifications */}
                    <div ref={notifRef} className="relative">
                        <button
                            onClick={() => setShowNotifs(!showNotifs)}
                            className="relative w-10 h-10 rounded-xl flex items-center justify-center text-stone-500 hover:bg-stone-100 hover:text-stone-700 transition-colors cursor-pointer border-none bg-transparent"
                            id="notification-bell"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                            </svg>
                            {unreadCount > 0 && (
                                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-semibold badge-pulse">
                                    {unreadCount}
                                </span>
                            )}
                        </button>

                        {showNotifs && (
                            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-stone-200 overflow-hidden animate-fade-in-up"
                                style={{ maxHeight: '420px' }}>
                                <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100">
                                    <h3 className="font-semibold text-stone-800 text-sm">Notifications</h3>
                                    {unreadCount > 0 && (
                                        <button
                                            onClick={markAllNotificationsRead}
                                            className="text-xs font-medium cursor-pointer border-none bg-transparent" style={{ color: '#C8102E' }}
                                        >
                                            Mark all read
                                        </button>
                                    )}
                                </div>
                                <div className="overflow-y-auto" style={{ maxHeight: '340px' }}>
                                    {notifications.length === 0 ? (
                                        <div className="px-4 py-8 text-center text-stone-400 text-sm">
                                            No notifications yet
                                        </div>
                                    ) : (
                                        notifications.slice(0, 8).map((n) => (
                                            <div
                                                key={n.id}
                                                onClick={() => markNotificationRead(n.id)}
                                                className={`px-4 py-3 border-b border-stone-50 cursor-pointer hover:bg-stone-50 transition-colors flex gap-3 ${!n.read ? 'bg-red-50/40' : ''
                                                    }`}
                                            >
                                                <span className="text-lg flex-shrink-0 mt-0.5">{notifIcon(n.type)}</span>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium text-sm text-stone-800 truncate">{n.title}</span>
                                                        {!n.read && <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#C8102E' }} />}
                                                    </div>
                                                    <p className="text-xs text-stone-500 mt-0.5">{n.message}</p>
                                                    <span className="text-xs text-stone-400 mt-1 block">{timeAgo(n.timestamp)}</span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Profile dropdown */}
                    <div ref={profileRef} className="relative">
                        <button
                            onClick={() => setShowProfile(!showProfile)}
                            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-stone-100 transition-colors cursor-pointer border-none bg-transparent"
                            id="profile-menu"
                        >
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                                style={{ background: currentUser?.role === 'admin' ? 'linear-gradient(135deg, #960C22, #C8102E)' : 'linear-gradient(135deg, #C8102E, #E8384F)' }}>
                                {currentUser ? getInitials(currentUser.name) : '?'}
                            </div>
                            <span className="text-sm font-medium text-stone-700 hidden sm:block">{currentUser?.name?.split(' ')[0]}</span>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-stone-400">
                                <polyline points="6 9 12 15 18 9" />
                            </svg>
                        </button>

                        {showProfile && (
                            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-stone-200 overflow-hidden animate-fade-in-up">
                                <div className="px-4 py-3 border-b border-stone-100">
                                    <p className="font-semibold text-sm text-stone-800">{currentUser?.name}</p>
                                    <p className="text-xs text-stone-500">{currentUser?.email}</p>
                                    <span className="inline-block mt-1.5 px-2 py-0.5 rounded-md text-xs font-medium capitalize"
                                        style={{
                                            background: '#fef2f2',
                                            color: '#C8102E',
                                        }}>
                                        {currentUser?.role}
                                    </span>
                                </div>
                                <div className="py-1">
                                    <button
                                        onClick={handleLogout}
                                        className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors cursor-pointer border-none bg-transparent flex items-center gap-2"
                                        id="logout-button"
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                            <polyline points="16 17 21 12 16 7" />
                                            <line x1="21" y1="12" x2="9" y2="12" />
                                        </svg>
                                        Sign out
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
