import { useApp } from '../../context/AppContext';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
    const { services, queue, toggleService, adminStats } = useApp();
    const stats = adminStats;

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

    // Volume chart (simple bar vis for the last 7 days)
    const dailyVolume = stats?.dailyVolume || [12, 18, 24, 22, 30, 26, 15];
    const maxVol = Math.max(...dailyVolume);
    const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    return (
        <div>
            {/* ── Hero Section ─────────────────────────────────── */}
            <div className="rounded-3xl p-8 md:p-10 mb-10 relative overflow-hidden animate-fade-in-up"
                style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 50%, #4c1d95 100%)' }}>
                <div className="relative z-10 max-w-xl">
                    <p className="text-purple-200 text-sm font-medium mb-2 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-purple-300 animate-pulse-soft" />
                        Admin Dashboard
                    </p>
                    <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight mb-3" style={{ fontFamily: 'Outfit, sans-serif' }}>
                        {getGreeting()}, Admin 🛠️
                    </h1>
                    <p className="text-purple-200 text-base leading-relaxed mb-6 max-w-lg">
                        {activeStudents > 0
                            ? `${activeStudents} student${activeStudents > 1 ? 's' : ''} currently waiting across ${openServices} open service${openServices > 1 ? 's' : ''}. Keep things moving!`
                            : 'All queues are clear right now. A great time to review services and prepare for upcoming sessions.'}
                    </p>
                    <div className="flex flex-wrap gap-3">
                        <Link to="/admin/queues"
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-purple-700 text-sm font-semibold no-underline hover:bg-purple-50 transition-colors">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                            Manage Queues
                        </Link>
                        <Link to="/admin/services"
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/15 backdrop-blur text-white text-sm font-semibold no-underline border border-white/20 hover:bg-white/25 transition-colors">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
                            Edit Services
                        </Link>
                    </div>
                </div>
                <div className="absolute -top-10 -right-10 w-64 h-64 rounded-full bg-white/5" />
                <div className="absolute -bottom-16 right-20 w-40 h-40 rounded-full bg-white/5" />
                <div className="absolute top-6 right-8 text-6xl opacity-20 select-none">📊</div>
            </div>

            {/* ── Key Metrics ──────────────────────────────────── */}
            <div className="mb-10">
                <h2 className="text-lg font-bold text-stone-800 mb-5" style={{ fontFamily: 'Outfit, sans-serif' }}>
                    Today's Snapshot
                </h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 stagger-children">
                    <div className="bg-white rounded-2xl p-6 border border-stone-200 card-hover animate-fade-in-up">
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                            style={{ background: 'linear-gradient(135deg, #dbeafe, #bfdbfe)' }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>
                        </div>
                        <p className="text-3xl font-bold text-stone-800 mb-1">{activeStudents}</p>
                        <p className="text-sm text-stone-500">Students in Queue</p>
                        <p className="text-xs text-stone-400 mt-2">across {openServices} active services</p>
                    </div>

                    <div className="bg-white rounded-2xl p-6 border border-stone-200 card-hover animate-fade-in-up">
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                            style={{ background: 'linear-gradient(135deg, #d1fae5, #a7f3d0)' }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                        </div>
                        <p className="text-3xl font-bold text-stone-800 mb-1">{stats?.totalServed || 47}</p>
                        <p className="text-sm text-stone-500">Served Today</p>
                        <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="18 15 12 9 6 15" /></svg>
                            12% vs yesterday
                        </p>
                    </div>

                    <div className="bg-white rounded-2xl p-6 border border-stone-200 card-hover animate-fade-in-up">
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                            style={{ background: 'linear-gradient(135deg, #fef3c7, #fde68a)' }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                        </div>
                        <p className="text-3xl font-bold text-stone-800 mb-1">{stats?.avgWaitTime || 14}m</p>
                        <p className="text-sm text-stone-500">Avg Wait Time</p>
                        <p className="text-xs text-stone-400 mt-2">Peak: 2:00 PM – 4:00 PM</p>
                    </div>

                    <div className="bg-white rounded-2xl p-6 border border-stone-200 card-hover animate-fade-in-up">
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                            style={{ background: 'linear-gradient(135deg, #fce7f3, #fbcfe8)' }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#db2777" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
                        </div>
                        <p className="text-3xl font-bold text-stone-800 mb-1">{stats?.noShowRate || 8}%</p>
                        <p className="text-sm text-stone-500">No-Show Rate</p>
                        <p className="text-xs text-stone-400 mt-2">{stats?.noShows || 4} students today</p>
                    </div>
                </div>
            </div>

            {/* ── Activity Chart + Service Breakdown ─────────── */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-10">
                {/* Volume Chart */}
                <div className="xl:col-span-2 bg-white rounded-2xl border border-stone-200 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="font-bold text-stone-800" style={{ fontFamily: 'Outfit, sans-serif' }}>Weekly Volume</h3>
                            <p className="text-xs text-stone-500 mt-0.5">Students served per day this week</p>
                        </div>
                        <div className="text-right">
                            <p className="text-2xl font-bold text-stone-800">{dailyVolume.reduce((a, b) => a + b, 0)}</p>
                            <p className="text-xs text-stone-500">total this week</p>
                        </div>
                    </div>
                    <div className="flex items-end justify-between gap-3" style={{ height: '200px' }}>
                        {dailyVolume.map((val, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                                <span className="text-xs font-semibold text-stone-700">{val}</span>
                                <div
                                    className="w-full rounded-xl transition-all duration-500"
                                    style={{
                                        height: `${(val / maxVol) * 100}%`,
                                        minHeight: '16px',
                                        background: i === new Date().getDay() - 1
                                            ? 'linear-gradient(180deg, #7c3aed, #a78bfa)'
                                            : 'linear-gradient(180deg, #e9d5ff, #ddd6fe)',
                                    }}
                                />
                                <span className="text-xs text-stone-500 font-medium">{dayLabels[i]}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Service Breakdown */}
                <div className="bg-white rounded-2xl border border-stone-200 p-6">
                    <h3 className="font-bold text-stone-800 mb-1" style={{ fontFamily: 'Outfit, sans-serif' }}>Service Load</h3>
                    <p className="text-xs text-stone-500 mb-6">Current queue by service</p>
                    <div className="space-y-5">
                        {serviceStats.sort((a, b) => b.inQueue - a.inQueue).map((s) => {
                            const maxQ = Math.max(...serviceStats.map((x) => x.inQueue), 1);
                            return (
                                <div key={s.id}>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2.5">
                                            <span className="text-lg">{s.icon}</span>
                                            <span className="text-sm font-medium text-stone-700 truncate" style={{ maxWidth: '140px' }}>{s.name}</span>
                                        </div>
                                        <span className="text-sm font-bold text-stone-800">{s.inQueue}</span>
                                    </div>
                                    <div className="h-2.5 bg-stone-100 rounded-full overflow-hidden">
                                        <div className="h-full rounded-full transition-all duration-700"
                                            style={{
                                                width: s.inQueue > 0 ? `${(s.inQueue / maxQ) * 100}%` : '0%',
                                                background: s.isOpen ? 'linear-gradient(90deg, #7c3aed, #a78bfa)' : '#d1d5db',
                                            }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* ── Services Table ───────────────────────────────── */}
            <div className="mb-10">
                <div className="flex items-center justify-between mb-5">
                    <div>
                        <h2 className="text-lg font-bold text-stone-800" style={{ fontFamily: 'Outfit, sans-serif' }}>
                            Services Overview
                        </h2>
                        <p className="text-sm text-stone-500 mt-1">{services.length} total services configured</p>
                    </div>
                    <Link to="/admin/services"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-50 text-purple-700 text-sm font-semibold no-underline hover:bg-purple-100 transition-colors border border-purple-200">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></svg>
                        Add Service
                    </Link>
                </div>
                <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-stone-50 border-b border-stone-200">
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-stone-500 uppercase tracking-wider">Service</th>
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-stone-500 uppercase tracking-wider">Category</th>
                                    <th className="text-center px-6 py-4 text-xs font-semibold text-stone-500 uppercase tracking-wider">Duration</th>
                                    <th className="text-center px-6 py-4 text-xs font-semibold text-stone-500 uppercase tracking-wider">In Queue</th>
                                    <th className="text-center px-6 py-4 text-xs font-semibold text-stone-500 uppercase tracking-wider">Status</th>
                                    <th className="text-center px-6 py-4 text-xs font-semibold text-stone-500 uppercase tracking-wider">Toggle</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-100">
                                {services.map((s) => {
                                    const inQueue = queue.filter((q) => q.serviceId === s.id && (q.status === 'waiting' || q.status === 'almost_ready')).length;
                                    return (
                                        <tr key={s.id} className="hover:bg-stone-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-stone-50 text-xl">{s.icon}</div>
                                                    <div>
                                                        <p className="font-semibold text-stone-800">{s.name}</p>
                                                        <p className="text-xs text-stone-500 mt-0.5 truncate" style={{ maxWidth: '200px' }}>{s.description}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-stone-600">{s.category}</td>
                                            <td className="px-6 py-4 text-center text-stone-600">{s.expectedDuration} min</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold ${inQueue > 0 ? 'bg-purple-50 text-purple-700' : 'bg-stone-50 text-stone-400'
                                                    }`}>
                                                    {inQueue}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${s.isOpen ? 'bg-green-50 text-green-700' : 'bg-stone-100 text-stone-500'
                                                    }`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${s.isOpen ? 'bg-green-500' : 'bg-stone-400'}`} />
                                                    {s.isOpen ? 'Open' : 'Closed'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button
                                                    onClick={() => toggleService(s.id)}
                                                    className={`relative w-12 h-6 rounded-full transition-colors cursor-pointer border-none ${s.isOpen ? 'bg-green-500' : 'bg-stone-300'
                                                        }`}
                                                    title={s.isOpen ? 'Close service' : 'Open service'}
                                                >
                                                    <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${s.isOpen ? 'left-6' : 'left-0.5'
                                                        }`} />
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

            {/* ── Quick Tips for Admins ─────────────────────────── */}
            <div className="rounded-2xl border border-purple-200 bg-purple-50/50 p-6 md:p-8 animate-fade-in-up">
                <div className="flex items-start gap-4">
                    <div className="text-3xl flex-shrink-0">🎯</div>
                    <div>
                        <h3 className="font-bold text-purple-900 mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>Management Tips</h3>
                        <ul className="text-sm text-purple-800 space-y-2 leading-relaxed">
                            <li className="flex items-start gap-2">
                                <span className="text-purple-400 mt-1">•</span>
                                <span><strong>Monitor no-shows</strong> — consider sending reminders or adjusting queue timing during peak hours.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-purple-400 mt-1">•</span>
                                <span><strong>Balance load</strong> — if one service is backed up, consider temporarily closing others to redirect tutors.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-purple-400 mt-1">•</span>
                                <span><strong>Review weekly volume</strong> — use the chart above to identify demand patterns and schedule tutors accordingly.</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
