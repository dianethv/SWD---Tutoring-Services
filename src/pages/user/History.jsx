import { useApp } from '../../context/AppContext';

export default function History() {
  const { getUserHistory } = useApp();
  const history = getUserHistory();

  const outcomeMeta = (outcome) => {
    switch (outcome) {
      case 'served':
        return {
          label: 'Completed',
          color: 'text-emerald-500',
          bg: 'bg-emerald-500/10',
        };
      case 'cancelled':
        return {
          label: 'Cancelled',
          color: 'text-stone-500',
          bg: 'bg-stone-400/10',
        };
      case 'no-show':
        return {
          label: 'No Show',
          color: 'text-rose-500',
          bg: 'bg-rose-500/10',
        };
      default:
        return { label: '—', color: 'text-stone-400', bg: 'bg-stone-200/20' };
    }
  };

  return (
    <div className="max-w-5xl mx-auto animate-fade-in-up">
      {/* headerr */}
      <div className="mb-10">
        <h1
          className="text-3xl font-semibold text-stone-900 tracking-tight"
          style={{ fontFamily: 'Outfit, sans-serif' }}
        >
          Session History
        </h1>
        <p className="text-stone-500 mt-2">
          A record of your tutoring activity.
        </p>
      </div>

      {history.length === 0 ? (
        <div className="text-center py-24 border border-dashed border-stone-300 rounded-2xl">
          <div className="text-4xl mb-4 opacity-70">📚</div>
          <p className="text-stone-500 text-sm">
            Your completed sessions will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((h) => {
            const meta = outcomeMeta(h.outcome);

            return (
              <div
                key={h.id}
                className="group bg-white border border-stone-200 rounded-2xl p-6 transition-all hover:shadow-lg hover:-translate-y-[2px]"
              >
                <div className="flex items-center justify-between">
                  {/* Left */}
                  <div>
                    <p className="text-lg font-semibold text-stone-900">
                      {h.serviceName}
                    </p>
                    <p className="text-sm text-stone-500 mt-1">
                      {h.date}
                    </p>
                  </div>

                  {/* Outcome badge */}
                  <div
                    className={`px-3 py-1.5 rounded-full text-xs font-medium ${meta.bg} ${meta.color}`}
                  >
                    {meta.label}
                  </div>
                </div>

                {/* divider */}
                <div className="my-5 h-px bg-gradient-to-r from-transparent via-stone-200 to-transparent" />

                {/* stats @ bottom */}
                <div className="grid grid-cols-3 gap-6 text-sm">
                  <div>
                    <p className="text-stone-400 uppercase text-[11px] tracking-wide">
                      Joined
                    </p>
                    <p className="mt-1 font-medium text-stone-800">
                      {h.joinedAt}
                    </p>
                  </div>

                  <div>
                    <p className="text-stone-400 uppercase text-[11px] tracking-wide">
                      Served
                    </p>
                    <p className="mt-1 font-medium text-stone-800">
                      {h.servedAt || '—'}
                    </p>
                  </div>

                  <div>
                    <p className="text-stone-400 uppercase text-[11px] tracking-wide">
                      Wait Time
                    </p>
                    <p className="mt-1 font-medium text-stone-800">
                      {h.waitTime ? `${h.waitTime} min` : '—'}
                    </p>
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