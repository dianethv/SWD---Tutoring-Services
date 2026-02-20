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

    return (
        <div className="animate-fade-in-up">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-stone-800 mb-1" style={{ fontFamily: 'Outfit, sans-serif' }}>
                    Queue Management
                </h1>
                <p className="text-stone-500">Manage active queues, serve students, and handle no-shows.</p>
            </div>

            {/* Service Selector */}
            <div className="flex flex-wrap gap-2 mb-6">
                {services.filter((s) => s.isOpen).map((s) => {
                    const qLen = getQueueForService(s.id).length;
                    return (
                        <button key={s.id}
                            onClick={() => setSelectedServiceId(s.id)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border cursor-pointer transition-all ${selectedServiceId === s.id
                                ? 'bg-red-50 border-red-300 text-red-700'
                                : 'bg-white border-stone-200 text-stone-600 hover:border-stone-300'
                                }`}
                            id={`select-queue-${s.id}`}
                        >
                            <span>{s.icon}</span>
                            {s.name}
                            {qLen > 0 && (
                                <span className="w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
                                    {qLen}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Queue Panel */}
            {selectedService && (
                <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">{selectedService.icon}</span>
                            <div>
                                <h2 className="font-bold text-stone-800">{selectedService.name}</h2>
                                <p className="text-xs text-stone-500">{queue.length} student{queue.length !== 1 ? 's' : ''} in queue • ~{selectedService.expectedDuration} min/session</p>
                            </div>
                        </div>

                        {queue.length > 0 && (
                            <button
                                onClick={() => serveNext(selectedServiceId)}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90 cursor-pointer border-none"
                                style={{ background: 'linear-gradient(135deg, #C8102E, #E8384F)' }}
                                id="serve-next-btn"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                                Serve Next
                            </button>
                        )}
                    </div>

                    {queue.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="text-5xl mb-4">✨</div>
                            <h3 className="text-lg font-bold text-stone-800 mb-1" style={{ fontFamily: 'Outfit, sans-serif' }}>Queue is empty</h3>
                            <p className="text-stone-500 text-sm">No students are currently waiting for this service.</p>
                        </div>
                    ) : (
                        <div>
                            {queue.map((entry, idx) => (
                                <div key={entry.id}
                                    className={`px-6 py-4 border-b border-stone-50 flex items-center justify-between hover:bg-stone-50 transition-colors ${idx === 0 ? 'bg-red-50/30' : ''
                                        }`}>
                                    <div className="flex items-center gap-4">
                                        {/* Position */}
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${idx === 0
                                            ? 'text-white'
                                            : 'bg-stone-100 text-stone-600'
                                            }`}
                                            style={idx === 0 ? { background: 'linear-gradient(135deg, #C8102E, #E8384F)' } : {}}>
                                            #{entry.position}
                                        </div>

                                        {/* Info */}
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="font-semibold text-stone-800 text-sm">{getUserName(entry.userId)}</p>
                                                {entry.priority === 'high' && (
                                                    <span className="px-1.5 py-0.5 rounded-md text-xs font-medium priority-high">🔥 Urgent</span>
                                                )}
                                            </div>
                                            <p className="text-xs text-stone-500">{getUserEmail(entry.userId)} • Waiting: {getTimeInQueue(entry.joinedAt)}</p>
                                            {entry.notes && <p className="text-xs text-stone-400 mt-0.5 italic">"{entry.notes}"</p>}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-1.5">
                                        <button
                                            onClick={() => reorderQueue(selectedServiceId, entry.id, 'up')}
                                            disabled={idx === 0}
                                            className="w-8 h-8 rounded-lg flex items-center justify-center border border-stone-200 text-stone-500 hover:bg-stone-100 hover:text-stone-700 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed bg-white"
                                            title="Move up"
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="18 15 12 9 6 15" /></svg>
                                        </button>
                                        <button
                                            onClick={() => reorderQueue(selectedServiceId, entry.id, 'down')}
                                            disabled={idx === queue.length - 1}
                                            className="w-8 h-8 rounded-lg flex items-center justify-center border border-stone-200 text-stone-500 hover:bg-stone-100 hover:text-stone-700 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed bg-white"
                                            title="Move down"
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
                                        </button>
                                        <button
                                            onClick={() => markNoShow(entry.id)}
                                            className="w-8 h-8 rounded-lg flex items-center justify-center border border-amber-200 text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer bg-white"
                                            title="Mark as no-show"
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                                        </button>
                                        <button
                                            onClick={() => leaveQueue(entry.id)}
                                            className="w-8 h-8 rounded-lg flex items-center justify-center border border-red-200 text-red-500 hover:bg-red-50 transition-colors cursor-pointer bg-white"
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
