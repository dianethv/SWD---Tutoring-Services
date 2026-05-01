import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Wordmark, ServiceTicket, useLiveInsights, useDerivedStats } from '../components/authShared';

export default function Login() {
    const { login } = useApp();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [errors, setErrors] = useState({});
    const [serverError, setServerError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [now, setNow] = useState(new Date());
    const { insights, status } = useLiveInsights();
    const stats = useDerivedStats(insights);

    useEffect(() => {
        const id = setInterval(() => setNow(new Date()), 60_000);
        return () => clearInterval(id);
    }, []);

    const validate = () => {
        const errs = {};
        if (!formData.email.trim()) errs.email = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errs.email = 'Enter a valid email address';
        if (!formData.password) errs.password = 'Password is required';
        else if (formData.password.length < 6) errs.password = 'Password must be at least 6 characters';
        return errs;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setServerError('');
        const errs = validate();
        setErrors(errs);
        if (Object.keys(errs).length > 0) return;

        setIsLoading(true);
        const result = await login(formData.email, formData.password);
        setIsLoading(false);

        if (result.success) {
            const destination =
                result.user.role === 'admin'
                    ? '/admin'
                    : result.user.role === 'tutor'
                        ? '/tutor'
                        : '/dashboard';
            navigate(destination);
        } else {
            setServerError(result.error);
        }
    };

    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    const dateStr = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

    return (
        <div className="auth-page">
            {/* ── Aside (left) ─────────────────────────────────────────── */}
            <aside
                className="auth-aside hidden lg:flex lg:w-[44%] flex-col justify-between"
                style={{ padding: '40px 56px' }}
            >
                <div className="auth-accent-line" />
                <div className="auth-aside-rule" />

                {/* Wordmark */}
                <div className="relative z-10">
                    <Wordmark />
                </div>

                {/* Center: live ticket + tagline */}
                <div className="relative z-10" style={{ maxWidth: 380 }}>
                    <div className="auth-eyebrow" style={{ marginBottom: 18 }}>Live Queue</div>

                    <ServiceTicket insights={insights} status={status} />

                    {/* Real-data stat strip */}
                    <div
                        style={{
                            marginTop: 28,
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr 1fr',
                            borderTop: '1px solid #ece9e2',
                            borderBottom: '1px solid #ece9e2',
                        }}
                    >
                        {[
                            { v: stats.avgWait > 0 ? `~${stats.avgWait}` : '—', l: 'min avg wait' },
                            { v: stats.openCount > 0 ? `${stats.openCount}/${stats.totalCount}` : '—', l: 'services live' },
                            { v: String(stats.totalWaiting), l: 'in queue now' },
                        ].map((s, i) => (
                            <div
                                key={s.l}
                                style={{
                                    padding: '14px 0',
                                    borderRight: i < 2 ? '1px solid #ece9e2' : 'none',
                                }}
                            >
                                <p className="tc-mono" style={{ fontSize: 18, fontWeight: 700, color: '#1c1917', lineHeight: 1, margin: 0 }}>
                                    {s.v}
                                </p>
                                <p style={{ fontSize: 10, color: '#a8a29e', letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 4 }}>
                                    {s.l}
                                </p>
                            </div>
                        ))}
                    </div>

                    <p
                        style={{
                            fontFamily: 'Outfit, sans-serif',
                            fontSize: 24,
                            fontWeight: 600,
                            color: '#1c1917',
                            letterSpacing: '-0.018em',
                            lineHeight: 1.25,
                            margin: '30px 0 0 0',
                        }}
                    >
                        Skip the wait,<br />
                        <span style={{ color: '#C8102E' }}>not the help.</span>
                    </p>
                </div>

                {/* Footer signature */}
                <div
                    className="flex items-end justify-between relative z-10"
                    style={{ fontSize: 10, color: '#a8a29e', letterSpacing: '0.18em', textTransform: 'uppercase' }}
                >
                    <span className="tc-mono">UH · Cougars · 2026</span>
                    <span className="tc-mono">{dateStr.toUpperCase()} · {timeStr}</span>
                </div>
            </aside>

            {/* ── Form panel (right) ─────────────────────────────────── */}
            <main className="auth-form-shell">
                <div className="w-full animate-fade-in-up" style={{ maxWidth: 400 }}>
                    {/* Mobile wordmark */}
                    <div className="lg:hidden mb-10">
                        <Wordmark />
                    </div>

                    <div className="auth-eyebrow" style={{ marginBottom: 14 }}>Welcome back</div>
                    <h1
                        style={{
                            fontFamily: 'Outfit, sans-serif',
                            fontSize: 38,
                            fontWeight: 700,
                            color: '#1c1917',
                            letterSpacing: '-0.025em',
                            lineHeight: 1.05,
                            margin: 0,
                        }}
                    >
                        Sign in<span style={{ color: '#C8102E' }}>.</span>
                    </h1>
                    <p style={{ fontSize: 14, color: '#78716c', marginTop: 12, marginBottom: 40 }}>
                        Pick up right where you left off in the queue.
                    </p>

                    {serverError && (
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                                padding: '12px 14px',
                                marginBottom: 24,
                                background: '#fef2f2',
                                border: '1px solid #fee2e2',
                                borderRadius: 10,
                                color: '#b91c1c',
                                fontSize: 13,
                                fontWeight: 500,
                            }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="15" y1="9" x2="9" y2="15" />
                                <line x1="9" y1="9" x2="15" y2="15" />
                            </svg>
                            {serverError}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} noValidate>
                        <div className={`tc-field ${errors.email ? 'tc-error' : ''}`}>
                            <input
                                id="login-email"
                                type="email"
                                placeholder=" "
                                className="tc-input"
                                value={formData.email}
                                onChange={(e) => { setFormData({ ...formData, email: e.target.value }); setErrors({ ...errors, email: '' }); }}
                            />
                            <label htmlFor="login-email" className="tc-label">Email address</label>
                        </div>
                        {errors.email && <p className="tc-error-text">{errors.email}</p>}

                        <div className={`tc-field ${errors.password ? 'tc-error' : ''}`} style={{ marginTop: 18 }}>
                            <input
                                id="login-password"
                                type={showPassword ? 'text' : 'password'}
                                placeholder=" "
                                className="tc-input"
                                value={formData.password}
                                onChange={(e) => { setFormData({ ...formData, password: e.target.value }); setErrors({ ...errors, password: '' }); }}
                            />
                            <label htmlFor="login-password" className="tc-label">Password</label>
                            <button
                                type="button"
                                className="tc-field-toggle"
                                onClick={() => setShowPassword(!showPassword)}
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                            >
                                {showPassword ? (
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                                        <line x1="1" y1="1" x2="23" y2="23" />
                                    </svg>
                                ) : (
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                        <circle cx="12" cy="12" r="3" />
                                    </svg>
                                )}
                            </button>
                        </div>
                        {errors.password && <p className="tc-error-text">{errors.password}</p>}

                        <button
                            id="login-submit"
                            type="submit"
                            className="tc-cta"
                            disabled={isLoading}
                            style={{ marginTop: 40 }}
                        >
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24">
                                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" opacity="0.25" />
                                        <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />
                                    </svg>
                                    Signing in
                                </>
                            ) : (
                                <>
                                    Sign in
                                    <svg className="tc-cta-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="5" y1="12" x2="19" y2="12" />
                                        <polyline points="12 5 19 12 12 19" />
                                    </svg>
                                </>
                            )}
                        </button>
                    </form>

                    <div className="tc-link-row">
                        <span>New around here?</span>
                        <Link to="/register" className="tc-link-arrow">
                            Create an account
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="5" y1="12" x2="19" y2="12" />
                                <polyline points="12 5 19 12 12 19" />
                            </svg>
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    );
}
