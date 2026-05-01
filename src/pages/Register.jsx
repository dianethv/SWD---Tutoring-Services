import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Wordmark, ServiceTicket, OpsTicket, useLiveInsights, useDerivedStats } from '../components/authShared';

export default function Register() {
    const { register } = useApp();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '', role: 'student' });
    const [errors, setErrors] = useState({});
    const [serverError, setServerError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [now, setNow] = useState(new Date());
    const { insights, status } = useLiveInsights();
    const stats = useDerivedStats(insights);

    useEffect(() => {
        const id = setInterval(() => setNow(new Date()), 60_000);
        return () => clearInterval(id);
    }, []);

    const isStudent = formData.role === 'student';

    // Side content reflects the chosen role and uses real data where it can.
    const side = useMemo(() => {
        if (isStudent) {
            const open = insights.filter((s) => s.isOpen);
            const sampleNames = open.slice(0, 3).map((s) => s.serviceName);
            return {
                eyebrow: 'For Students',
                headline: 'Get tutored.\nSkip the line.',
                bullets: [
                    'See your live position in any tutoring queue',
                    sampleNames.length > 0
                        ? `Pick from ${stats.openCount} live ${stats.openCount === 1 ? 'service' : 'services'}: ${sampleNames.join(', ')}${open.length > 3 ? '…' : ''}`
                        : 'Pick from multiple tutoring services across campus',
                    stats.avgWait > 0
                        ? `Average wait right now is ~${stats.avgWait} min — get notified when you're up`
                        : 'Get notified the moment you\'re up next',
                ],
            };
        }
        return {
            eyebrow: 'For Tutors & Admins',
            headline: 'Run the queue.\nHelp more students.',
            bullets: [
                'Spin up new tutoring services in seconds',
                stats.totalCount > 0
                    ? `Manage ${stats.totalCount} configured ${stats.totalCount === 1 ? 'service' : 'services'} from one console`
                    : 'Manage every queue from one console',
                stats.busiest
                    ? `Watch demand live — busiest right now is ${stats.busiest.serviceName}`
                    : 'Track wait times, demand, and no-shows',
            ],
        };
    }, [isStudent, insights, stats]);

    const validate = () => {
        const errs = {};
        if (!formData.name.trim()) errs.name = 'Full name is required';
        else if (formData.name.trim().length < 2) errs.name = 'Name must be at least 2 characters';
        if (!formData.email.trim()) errs.email = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errs.email = 'Enter a valid email address';
        if (!formData.password) errs.password = 'Password is required';
        else if (formData.password.length < 6) errs.password = 'Password must be at least 6 characters';
        if (formData.password !== formData.confirmPassword) errs.confirmPassword = 'Passwords do not match';
        return errs;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setServerError('');
        const errs = validate();
        setErrors(errs);
        if (Object.keys(errs).length > 0) return;

        setIsLoading(true);
        const result = await register(formData.name, formData.email, formData.password, formData.role);
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

    const updateField = (field, value) => {
        setFormData({ ...formData, [field]: value });
        if (errors[field]) setErrors({ ...errors, [field]: '' });
    };

    const dateStr = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

    return (
        <div className="auth-page">
            {/* ── Aside (left) — dynamic per role ──────────────────────── */}
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

                {/* Center */}
                <div key={formData.role} className="relative z-10 animate-fade-in-up" style={{ maxWidth: 400 }}>
                    <div className="auth-eyebrow" style={{ marginBottom: 18 }}>{side.eyebrow}</div>

                    <h1
                        style={{
                            fontFamily: 'Outfit, sans-serif',
                            fontSize: 42,
                            fontWeight: 700,
                            color: '#1c1917',
                            letterSpacing: '-0.028em',
                            lineHeight: 1.05,
                            margin: 0,
                            whiteSpace: 'pre-line',
                        }}
                    >
                        {side.headline}
                    </h1>

                    <ul style={{ listStyle: 'none', margin: '32px 0 30px 0', padding: 0 }}>
                        {side.bullets.map((b, i) => (
                            <li
                                key={i}
                                style={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: 14,
                                    padding: '12px 0',
                                    borderBottom: i < side.bullets.length - 1 ? '1px solid #ece9e2' : 'none',
                                }}
                            >
                                <span
                                    className="tc-mono"
                                    style={{ fontSize: 11, color: '#C8102E', fontWeight: 700, paddingTop: 3, minWidth: 22 }}
                                >
                                    0{i + 1}
                                </span>
                                <span style={{ fontSize: 14, color: '#44403c', lineHeight: 1.55 }}>{b}</span>
                            </li>
                        ))}
                    </ul>

                    {/* Live ticket — per-service rotation for students, ops aggregate for admins */}
                    {isStudent ? (
                        <ServiceTicket insights={insights} status={status} />
                    ) : (
                        <OpsTicket insights={insights} status={status} />
                    )}
                </div>

                {/* Footer signature */}
                <div
                    className="flex items-end justify-between relative z-10"
                    style={{ fontSize: 10, color: '#a8a29e', letterSpacing: '0.18em', textTransform: 'uppercase' }}
                >
                    <span className="tc-mono">UH · Cougars · 2026</span>
                    <span className="tc-mono">{dateStr.toUpperCase()}</span>
                </div>
            </aside>

            {/* ── Form panel (right) ────────────────────────────────────── */}
            <main className="auth-form-shell" style={{ overflowY: 'auto' }}>
                <div className="w-full animate-fade-in-up" style={{ maxWidth: 420 }}>
                    {/* Mobile wordmark */}
                    <div className="lg:hidden mb-10">
                        <Wordmark />
                    </div>

                    <div className="auth-eyebrow" style={{ marginBottom: 14 }}>Get started</div>
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
                        Create account<span style={{ color: '#C8102E' }}>.</span>
                    </h1>
                    <p style={{ fontSize: 14, color: '#78716c', marginTop: 12, marginBottom: 32 }}>
                        Takes less than a minute. No credit card.
                    </p>

                    {/* Role toggle */}
                    <div style={{ marginBottom: 28 }}>
                        <p
                            style={{
                                fontSize: 11,
                                fontWeight: 600,
                                color: '#78716c',
                                letterSpacing: '0.12em',
                                textTransform: 'uppercase',
                                marginBottom: 10,
                            }}
                        >
                            I am a
                        </p>
                        <div className="tc-role-row">
                            {[
                                { role: 'student', label: 'Student', emoji: '🎓' },
                                { role: 'tutor', label: 'Tutor', emoji: '🛠️' },
                            ].map((opt) => (
                                <button
                                    key={opt.role}
                                    type="button"
                                    onClick={() => updateField('role', opt.role)}
                                    className={`tc-role-btn ${formData.role === opt.role ? 'active' : ''}`}
                                >
                                    <span style={{ fontSize: 14 }}>{opt.emoji}</span>
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

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
                        <div className={`tc-field ${errors.name ? 'tc-error' : ''}`}>
                            <input
                                id="register-name"
                                type="text"
                                placeholder=" "
                                className="tc-input"
                                value={formData.name}
                                onChange={(e) => updateField('name', e.target.value)}
                            />
                            <label htmlFor="register-name" className="tc-label">Full name</label>
                        </div>
                        {errors.name && <p className="tc-error-text">{errors.name}</p>}

                        <div className={`tc-field ${errors.email ? 'tc-error' : ''}`} style={{ marginTop: 14 }}>
                            <input
                                id="register-email"
                                type="email"
                                placeholder=" "
                                className="tc-input"
                                value={formData.email}
                                onChange={(e) => updateField('email', e.target.value)}
                            />
                            <label htmlFor="register-email" className="tc-label">University email</label>
                        </div>
                        {errors.email && <p className="tc-error-text">{errors.email}</p>}

                        <div className={`tc-field ${errors.password ? 'tc-error' : ''}`} style={{ marginTop: 14 }}>
                            <input
                                id="register-password"
                                type={showPassword ? 'text' : 'password'}
                                placeholder=" "
                                className="tc-input"
                                value={formData.password}
                                onChange={(e) => updateField('password', e.target.value)}
                            />
                            <label htmlFor="register-password" className="tc-label">Password (6+ characters)</label>
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

                        <div className={`tc-field ${errors.confirmPassword ? 'tc-error' : ''}`} style={{ marginTop: 14 }}>
                            <input
                                id="register-confirm"
                                type={showConfirm ? 'text' : 'password'}
                                placeholder=" "
                                className="tc-input"
                                value={formData.confirmPassword}
                                onChange={(e) => updateField('confirmPassword', e.target.value)}
                            />
                            <label htmlFor="register-confirm" className="tc-label">Confirm password</label>
                            <button
                                type="button"
                                className="tc-field-toggle"
                                onClick={() => setShowConfirm(!showConfirm)}
                                aria-label={showConfirm ? 'Hide password' : 'Show password'}
                            >
                                {showConfirm ? (
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
                        {errors.confirmPassword && <p className="tc-error-text">{errors.confirmPassword}</p>}

                        <button
                            id="register-submit"
                            type="submit"
                            className="tc-cta"
                            disabled={isLoading}
                            style={{ marginTop: 36 }}
                        >
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24">
                                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" opacity="0.25" />
                                        <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />
                                    </svg>
                                    Creating account
                                </>
                            ) : (
                                <>
                                    Create {isStudent ? 'student' : 'tutor'} account
                                    <svg className="tc-cta-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="5" y1="12" x2="19" y2="12" />
                                        <polyline points="12 5 19 12 12 19" />
                                    </svg>
                                </>
                            )}
                        </button>

                        <p style={{ marginTop: 14, fontSize: 11.5, color: '#a8a29e', lineHeight: 1.5, textAlign: 'center' }}>
                            By creating an account, you agree to our terms and privacy policy.
                        </p>
                    </form>

                    <div className="tc-link-row">
                        <span>Already a member?</span>
                        <Link to="/login" className="tc-link-arrow">
                            Sign in
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
