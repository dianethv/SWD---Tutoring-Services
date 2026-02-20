import { useApp } from '../../context/AppContext';
import { Link } from 'react-router-dom';

export default function QueueStatus() {
  const { services, getUserActiveQueues, getEstimatedWait, leaveQueue } = useApp();
  const activeQueues = getUserActiveQueues();

  const Page = ({ children }) => (
    <div className="animate-fade-in-up w-full max-w-6xl mx-auto px-6 sm:px-8">
      {children}
    </div>
  );

  if (activeQueues.length === 0) {
    return (
      <Page>
        <div className="mb-8">
          <h1
            className="text-2xl font-bold text-stone-800 mb-1"
            style={{ fontFamily: 'Outfit, sans-serif' }}
          >
            Queue Status
          </h1>
          <p className="text-stone-500">Track your current position in active queues.</p>
        </div>

        <div className="py-16 bg-white rounded-2xl border border-stone-200 text-center">
          <div className="text-5xl mb-4">🎯</div><h2
  className="text-xl font-bold text-stone-800 mb-2"
  style={{ fontFamily: 'Outfit, sans-serif' }}
>
  You're not in any queues
</h2>

<p className="text-stone-500 mb-6 text-sm">
  Ready to get help? Join a tutoring session to get started.
</p>

<Link
  to="/join-queue"
  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-3xl text-white text-sm font-semibold no-underline transition-all hover:opacity-90"
  style={{ background: 'linear-gradient(135deg, #C8102E, #E8384F)' }}
>
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="16" />
    <line x1="8" y1="12" x2="16" y2="12" />
  </svg>
  Join a Session
</Link>
        </div>
      </Page>
    );
  }

  return (
    <Page>
      <div className="mb-8">
        <h1
          className="text-2xl font-bold text-stone-800 mb-1"
          style={{ fontFamily: 'Outfit, sans-serif' }}
        >
          Queue Status
        </h1>
        <p className="text-stone-500">Live updates for your active queues.</p>
      </div>

      <div className="space-y-6 stagger-children">
        {activeQueues.map((q) => {
          const service = services.find((s) => s.id === q.serviceId);
          const eta = getEstimatedWait(q.serviceId, q.position);
          const progressPct = Math.max(10, 100 - (q.position - 1) * 25);
          const isAlmostReady = q.position <= 2;
          const isNext = q.position === 1;

          return (
            <div
              key={q.id}
              className="bg-white rounded-2xl border border-stone-200 overflow-hidden animate-fade-in-up"
            >
              {/* Header strip */}
              <div
                className="h-1.5"
                style={{
                  background: isNext
                    ? 'linear-gradient(90deg, #3b82f6, #60a5fa)'
                    : isAlmostReady
                    ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                    : 'linear-gradient(90deg, #C8102E, #E8384F)',
                }}
              />

              <div className="p-6">
                {/* Top Row */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-start gap-4">
                    <span className="text-4xl">{service?.icon}</span>
                    <div>
                      <h2
                        className="text-lg font-bold text-stone-800"
                        style={{ fontFamily: 'Outfit, sans-serif' }}
                      >
                        {service?.name}
                      </h2>
                      <p className="text-sm text-stone-500 mt-0.5">{service?.category}</p>
                      {q.notes && (
                        <p className="text-xs text-stone-400 mt-1 italic">"{q.notes}"</p>
                      )}
                    </div>
                  </div>

                  <div
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
                    style={{
                      background: isNext ? '#eff6ff' : isAlmostReady ? '#fffbeb' : '#f0fdf4',
                      border: `1px solid ${
                        isNext ? '#bfdbfe' : isAlmostReady ? '#fde68a' : '#bbf7d0'
                      }`,
                    }}
                  >
                    <span className={`status-dot ${isNext ? 'almost-ready' : 'waiting'}`} />
                    <span
                      className="text-xs font-semibold"
                      style={{
                        color: isNext ? '#2563eb' : isAlmostReady ? '#d97706' : '#16a34a',
                      }}
                    >
                      {isNext ? "You're next!" : isAlmostReady ? 'Almost your turn' : 'Waiting'}
                    </span>
                  </div>
                </div>

                {/* Position & ETA Cards */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 rounded-xl bg-stone-50">
                    <p className="text-xs text-stone-500 mb-1 uppercase tracking-wide font-medium">
                      Position
                    </p>
                    <p
                      className="text-4xl font-bold"
                      style={{ color: isNext ? '#2563eb' : '#C8102E' }}
                    >
                      #{q.position}
                    </p>
                  </div>

                  <div className="text-center p-4 rounded-xl bg-stone-50">
                    <p className="text-xs text-stone-500 mb-1 uppercase tracking-wide font-medium">
                      Est. Wait
                    </p>
                    <p className="text-4xl font-bold text-stone-800">{eta > 0 ? eta : '<1'}</p>
                    <p className="text-xs text-stone-500 mt-0.5">minutes</p>
                  </div>

                  <div className="text-center p-4 rounded-xl bg-stone-50">
                    <p className="text-xs text-stone-500 mb-1 uppercase tracking-wide font-medium">
                      Joined
                    </p>
                    <p className="text-lg font-bold text-stone-800">
                      {new Date(q.joinedAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                    <p className="text-xs text-stone-500 mt-0.5">
                      {Math.round((Date.now() - new Date(q.joinedAt).getTime()) / 60000)} min ago
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-stone-600">Progress</span>
                    <span
                      className="text-xs font-semibold"
                      style={{ color: isNext ? '#2563eb' : '#C8102E' }}
                    >
                      {Math.round(progressPct)}%
                    </span>
                  </div>

                  <div className="h-3 bg-stone-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000 ease-out"
                      style={{
                        width: `${progressPct}%`,
                        background: isNext
                          ? 'linear-gradient(90deg, #3b82f6, #60a5fa)'
                          : isAlmostReady
                          ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                          : 'linear-gradient(90deg, #C8102E, #E8384F, #E8384F)',
                      }}
                    />
                  </div>
                </div>

                {/* Timeline / Steps */}
                <div className="flex items-center justify-between px-2 mb-6">
                  {['Joined', 'Waiting', 'Almost Ready', 'Your Turn'].map((step, i) => {
                    const isComplete =
                      i === 0 ||
                      (i === 1 && q.position <= 3) ||
                      (i === 2 && q.position <= 2) ||
                      (i === 3 && q.position === 1);

                    return (
                      <div key={step} className="flex flex-col items-center gap-1.5">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                            isComplete
                              ? 'bg-red-500 border-red-500 text-white'
                              : 'bg-white border-stone-300 text-stone-400'
                          }`}
                        >
                          {isComplete ? '✓' : i + 1}
                        </div>
                        <span
                          className={`text-xs font-medium ${
                            isComplete ? 'text-red-700' : 'text-stone-400'
                          }`}
                        >
                          {step}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Leave button */}
                <button
                  onClick={() => leaveQueue(q.id)}
                  className="w-full py-2.5 rounded-xl border-2 border-red-200 bg-red-50 text-red-700 text-sm font-semibold hover:bg-red-100 transition-colors cursor-pointer"
                  id={`leave-queue-status-${q.id}`}
                >
                  Leave Queue
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </Page>
  );
}