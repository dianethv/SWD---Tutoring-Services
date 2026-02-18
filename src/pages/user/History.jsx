import { useApp } from '../../context/AppContext';

export default function History() {
    const { getUserHistory } = useApp();
    const history = getUserHistory();

    const getOutcomeBadge = (outcome) => {
        switch (outcome) {
            case 'served':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-green-50 text-green-700 border border-green-200 text-xs font-semibold">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                        Served
                    </span>
                );
            case 'cancelled':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-100 text-stone-600 border border-stone-200 text-xs font-semibold">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
                        Cancelled
                    </span>
                );
            case 'no-show':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-50 text-red-600 border border-red-200 text-xs font-semibold">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                        No Show
                    </span>
                );
            default:
                return null;
        }
    };

    return (
        <div className="animate-fade-in-up">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-stone-800 mb-1" style={{ fontFamily: 'Outfit, sans-serif' }}>
                    Session History
                </h1>
                <p className="text-stone-500">Review your past tutoring sessions and outcomes.</p>
            </div>

            {history.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-stone-200">
                    <div className="text-5xl mb-4">📚</div>
                    <h2 className="text-xl font-bold text-stone-800 mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
                        No history yet
                    </h2>
                    <p className="text-stone-500 text-sm">Your completed tutoring sessions will appear here.</p>
                </div>
            ) : (
                <>
                    {/* Summary cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                        <div className="bg-white rounded-2xl p-5 border border-stone-200">
                            <p className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-1">Total Sessions</p>
                            <p className="text-3xl font-bold text-stone-800">{history.length}</p>
                        </div>
                        <div className="bg-white rounded-2xl p-5 border border-stone-200">
                            <p className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-1">Successfully Served</p>
                            <p className="text-3xl font-bold text-green-600">{history.filter((h) => h.outcome === 'served').length}</p>
                        </div>
                        <div className="bg-white rounded-2xl p-5 border border-stone-200">
                            <p className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-1">Avg. Wait Time</p>
                            <p className="text-3xl font-bold text-stone-800">
                                {Math.round(
                                    history.filter((h) => h.waitTime).reduce((sum, h) => sum + h.waitTime, 0) /
                                    Math.max(1, history.filter((h) => h.waitTime).length)
                                )} <span className="text-base font-normal text-stone-500">min</span>
                            </p>
                        </div>
                    </div>

                    {/* History Table */}
                    <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full" id="history-table">
                                <thead>
                                    <tr className="border-b border-stone-100">
                                        <th className="text-left px-5 py-3.5 text-xs font-semibold text-stone-500 uppercase tracking-wide">Date</th>
                                        <th className="text-left px-5 py-3.5 text-xs font-semibold text-stone-500 uppercase tracking-wide">Service</th>
                                        <th className="text-left px-5 py-3.5 text-xs font-semibold text-stone-500 uppercase tracking-wide">Joined</th>
                                        <th className="text-left px-5 py-3.5 text-xs font-semibold text-stone-500 uppercase tracking-wide">Served</th>
                                        <th className="text-left px-5 py-3.5 text-xs font-semibold text-stone-500 uppercase tracking-wide">Wait</th>
                                        <th className="text-left px-5 py-3.5 text-xs font-semibold text-stone-500 uppercase tracking-wide">Outcome</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {history.map((h, i) => (
                                        <tr key={h.id} className={`border-b border-stone-50 hover:bg-stone-50 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-stone-50/30'}`}>
                                            <td className="px-5 py-4 text-sm text-stone-700 font-medium whitespace-nowrap">{h.date}</td>
                                            <td className="px-5 py-4 text-sm text-stone-800 font-semibold">{h.serviceName}</td>
                                            <td className="px-5 py-4 text-sm text-stone-600">{h.joinedAt}</td>
                                            <td className="px-5 py-4 text-sm text-stone-600">{h.servedAt || '—'}</td>
                                            <td className="px-5 py-4 text-sm text-stone-600">{h.waitTime ? `${h.waitTime} min` : '—'}</td>
                                            <td className="px-5 py-4">{getOutcomeBadge(h.outcome)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
