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
        if (entry) {
            leaveQueue(entry.id);
        }
    };

    return (
        <div className="animate-fade-in-up">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-stone-800 mb-1" style={{ fontFamily: 'Outfit, sans-serif' }}>
                    Join a Queue
                </h1>
                <p className="text-stone-500">Select a tutoring service below to get in line.</p>
            </div>

            {joinSuccess && (
                <div className="fixed top-20 right-4 z-50 p-4 rounded-2xl bg-green-50 border border-green-200 text-green-800 text-sm font-medium shadow-lg flex items-center gap-2">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                    Successfully joined the queue!
                </div>
            )}

            {joinError && (
                <div className="fixed top-20 right-4 z-50 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium shadow-lg flex items-center gap-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="15" y1="9" x2="9" y2="15" />
                        <line x1="9" y1="9" x2="15" y2="15" />
                    </svg>
                    {joinError}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {services.map((service) => {
                    const queueLength = getQueueForService(service.id).length;
                    const userEntry = getUserQueueEntry(service.id);
                    const isInQueue = !!userEntry;
                    const eta = getEstimatedWait(service.id, queueLength + 1);
                    const isSelected = selectedService === service.id;

                    return (
                        <div
                            key={service.id}
                            className={`bg-white rounded-2xl border transition-all ${isSelected ? 'border-red-300 shadow-md ring-1 ring-red-100' : 'border-stone-200 hover:shadow-sm'} ${!service.isOpen ? 'opacity-60' : ''}`}
                        >
                            <div className="p-5">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-start gap-3">
                                        <span className="text-3xl">{service.icon}</span>
                                        <div>
                                            <h3 className="font-bold text-stone-800">{service.name}</h3>
                                            <p className="text-xs text-stone-500 mt-0.5">{service.category}</p>
                                        </div>
                                    </div>
                                    <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${service.isOpen ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-stone-100 text-stone-500 border border-stone-200'}`}>
                                        {service.isOpen ? 'Open' : 'Closed'}
                                    </span>
                                </div>

                                <p className="text-sm text-stone-600 mb-4 leading-relaxed">{service.description}</p>

                                <div className="flex items-center gap-4 mb-4 text-xs text-stone-500">
                                    <span className="flex items-center gap-1.5">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <circle cx="12" cy="12" r="10" />
                                            <polyline points="12 6 12 12 16 14" />
                                        </svg>
                                        ~{service.expectedDuration} min/session
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                            <circle cx="9" cy="7" r="4" />
                                        </svg>
                                        {queueLength} in queue
                                    </span>
                                </div>

                                <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 mb-4">
                                    <div>
                                        <p className="font-bold text-stone-700">Estimated wait: {eta > 0 ? `~${eta} min` : 'No wait!'}</p>
                                        {/* <p className="font-bold text-stone-800">{eta > 0 ? `~${eta} min` : 'No wait!'}</p> */}
                                    </div>
                                </div>

                                {isSelected && !isInQueue && service.isOpen && (
                                    <div className="mb-4">
                                        <label className="block text-xs font-medium text-stone-600 mb-1.5">
                                            What do you need help with? (optional)
                                        </label>
                                        <textarea
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                            placeholder="e.g., Integration by parts, Chapter 5 problems..."
                                            rows={2}
                                            className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm resize-none hover:border-stone-400"
                                            style={{ background: '#fafaf9' }}
                                        />
                                        <div className="mt-2">
                                            <label className="block text-xs font-medium text-stone-600 mb-1.5">Priority</label>
                                            <div className="flex gap-2">
                                                {['normal', 'high'].map((p) => (
                                                    <button
                                                        key={p}
                                                        type="button"
                                                        onClick={() => setPriority(p)}
                                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${priority === p ? 'bg-red-50 border-red-300 text-red-700' : 'bg-white border-stone-200 text-stone-600 hover:border-stone-300'}`}
                                                    >
                                                        {p === 'high' ? '🔥 Urgent (exam soon)' : '📝 Normal'}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {service.isOpen ? (
                                    isInQueue ? (
                                        <button
                                            onClick={() => handleLeave(service.id)}
                                            className="w-full py-2.5 rounded-xl border-2 border-red-200 bg-red-50 text-red-700 text-sm font-semibold hover:bg-red-100 transition-colors"
                                        >
                                            Leave Queue
                                        </button>
                                    ) : isSelected ? (
                                        <button
                                            onClick={() => handleJoin(service.id)}
                                            className="w-full py-2.5 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90 border-none"
                                            style={{ background: 'linear-gradient(135deg, #C8102E, #E8384F)' }}
                                        >
                                            Join Queue
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => setSelectedService(service.id)}
                                            className="w-full py-2.5 rounded-xl border-2 border-red-200 bg-red-50 text-red-700 text-sm font-semibold hover:bg-red-100 transition-colors"
                                        >
                                            Select Service
                                        </button>
                                    )
                                ) : (
                                    <button disabled className="w-full py-2.5 rounded-xl bg-stone-100 text-stone-400 text-sm font-semibold cursor-not-allowed border-none">
                                        Currently Closed
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}