import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const roleContent = {
    student: {
        headline: 'Skip the wait,\nnot the help.',
        subtitle: 'Join thousands of students who get tutored smarter — know your wait time, get notified, and never miss your turn.',
        features: [
            {
                icon: (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                    </svg>
                ),
                title: 'Real-time queue position',
                desc: 'Know exactly where you stand and when it\'s your turn — no more guessing.',
            },
            {
                icon: (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
                    </svg>
                ),
                title: 'Pick your service',
                desc: 'Choose from multiple tutoring subjects across math, CS, writing, sciences, and more.',
            },
            {
                icon: (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    </svg>
                ),
                title: 'Never miss your turn',
                desc: 'Get notified the moment you\'re up next so you can keep studying until then.',
            },
        ],
        stats: [
            { value: '~12 min', label: 'Avg Wait' },
            { value: '6 active', label: 'Services' },
            { value: '4.8 ★', label: 'Satisfaction' },
        ],
        steps: [
            { num: '1', title: 'Create your account', desc: 'Sign up in seconds with your university email' },
            { num: '2', title: 'Join a queue', desc: 'Pick a tutoring service and hop in line' },
            { num: '3', title: 'Get tutored', desc: 'We\'ll notify you when it\'s your turn — show up and learn' },
        ],
    },
    admin: {
        headline: 'Manage smarter,\nnot harder.',
        subtitle: 'Powerful tools to run efficient tutoring services, monitor demand, and help more students every day.',
        features: [
            {
                icon: (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                    </svg>
                ),
                title: 'Service control',
                desc: 'Create, edit, and toggle tutoring services on the fly — name, duration, priority, all of it.',
            },
            {
                icon: (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                ),
                title: 'Live queue management',
                desc: 'Serve students, reorder the queue, handle no-shows — all from one dashboard.',
            },
            {
                icon: (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
                    </svg>
                ),
                title: 'Analytics & insights',
                desc: 'Track daily volume, average wait times, no-show rates, and peak hours at a glance.',
            },
        ],
        stats: [
            { value: '47', label: 'Served Today' },
            { value: '22 min', label: 'Avg Wait' },
            { value: '6', label: 'Services' },
        ],
        steps: [
            { num: '1', title: 'Set up services', desc: 'Define tutoring services with duration and priority' },
            { num: '2', title: 'Monitor queues', desc: 'Watch students join and manage flow in real time' },
            { num: '3', title: 'Review & improve', desc: 'Use analytics to optimize scheduling and reduce wait times' },
        ],
    },
};

export default function Register() {
    const { register } = useApp();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '', role: 'student' });
    const [errors, setErrors] = useState({});
    const [serverError, setServerError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const content = roleContent[formData.role];

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
        await new Promise((r) => setTimeout(r, 600));
        const result = register(formData.name, formData.email, formData.password, formData.role);
        setIsLoading(false);

        if (result.success) {
            navigate(result.user.role === 'admin' ? '/admin' : '/dashboard');
        } else {
            setServerError(result.error);
        }
    };

    const updateField = (field, value) => {
        setFormData({ ...formData, [field]: value });
        if (errors[field]) setErrors({ ...errors, [field]: '' });
    };

    return (
        <div className="min-h-screen flex" style={{ background: 'linear-gradient(135deg, #fef2f2 0%, #fafaf9 50%, #fffbeb 100%)' }}>
            {/* ── Left Panel (dynamic) ─────────────────────── */}
            <div className="hidden lg:flex lg:w-[52%] flex-col relative overflow-hidden"
                style={{ background: 'linear-gradient(160deg, #C8102E, #960C22 40%, #6B0A1A)' }}>
                <div className="relative z-10 flex flex-col justify-between h-full" style={{ padding: '48px 56px' }}>
                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                            style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' }}>
                            🐾
                        </div>
                        <span className="text-2xl font-bold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>TutorCoogs</span>
                    </div>

                    {/* Headline + Subtitle */}
                    <div>
                        <h1 className="text-5xl font-bold text-white leading-[1.1] mb-5" style={{ fontFamily: 'Outfit, sans-serif', whiteSpace: 'pre-line' }}>
                            {content.headline}
                        </h1>
                        <p className="text-red-100 text-lg leading-relaxed max-w-lg">
                            {content.subtitle}
                        </p>
                    </div>

                    {/* Feature Cards */}
                    <div className="space-y-4">
                        {content.features.map((f) => (
                            <div key={f.title} className="flex items-start gap-4 rounded-2xl px-6 py-5 transition-all"
                                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                                    style={{ background: 'rgba(255,255,255,0.12)', color: '#fecdd3' }}>
                                    {f.icon}
                                </div>
                                <div>
                                    <p className="text-white font-semibold text-base mb-1">{f.title}</p>
                                    <p className="text-red-200 text-sm leading-relaxed">{f.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* How It Works */}
                    <div>
                        <p className="text-sm font-semibold text-red-300 uppercase tracking-wider mb-5">How it works</p>
                        <div className="flex gap-4">
                            {content.steps.map((step) => (
                                <div key={step.num} className="flex-1 rounded-2xl px-5 py-5"
                                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                    <div className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold text-white mb-3"
                                        style={{ background: 'rgba(255,255,255,0.15)' }}>
                                        {step.num}
                                    </div>
                                    <p className="text-white font-semibold text-sm mb-1">{step.title}</p>
                                    <p className="text-red-300 text-xs leading-relaxed">{step.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Decorative */}
                <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-white/5" />
                <div className="absolute top-32 -right-16 w-48 h-48 rounded-full bg-white/5" />
                <div className="absolute -top-12 left-1/2 w-32 h-32 rounded-full bg-white/[0.03]" />
            </div>

            {/* ── Right Panel (form) ───────────────────────── */}
            <div className="flex-1 flex items-center justify-center p-6 lg:p-12 overflow-y-auto">
                <div className="w-full max-w-md animate-fade-in-up">
                    {/* Mobile logo */}
                    <div className="lg:hidden flex items-center gap-2.5 mb-8">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
                            style={{ background: 'linear-gradient(135deg, #C8102E, #E8384F)' }}>
                            🐾
                        </div>
                        <span className="text-lg font-bold text-stone-800" style={{ fontFamily: 'Outfit, sans-serif' }}>
                            Tutor<span className="text-red-600">Coogs</span>
                        </span>
                    </div>

                    <h2 className="text-3xl font-bold text-stone-800 mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
                        Create your account
                    </h2>
                    <p className="text-stone-500 mb-8">Join TutorCoogs and get started in seconds</p>

                    {/* ── Role Selector (prominent) ──────────── */}
                    <div className="grid grid-cols-2 gap-4 mb-8">
                        {[
                            { role: 'student', emoji: '🎓', label: 'I\'m a Student', desc: 'Join queues and get tutoring help for your courses' },
                            { role: 'admin', emoji: '🛠️', label: 'I\'m a Tutor', desc: 'Create services and manage student queues' },
                        ].map((opt) => (
                            <button
                                type="button"
                                key={opt.role}
                                onClick={() => updateField('role', opt.role)}
                                className={`relative flex flex-col items-center gap-2 px-5 py-6 rounded-2xl border-2 text-center transition-all cursor-pointer ${
                                    formData.role === opt.role
                                        ? 'border-red-400 shadow-lg'
                                        : 'border-stone-200 bg-white text-stone-500 hover:border-stone-300 hover:shadow-sm'
                                }`}
                                style={formData.role === opt.role ? { background: 'linear-gradient(135deg, #fef2f2, #fee2e2)' } : {}}
                            >
                                {formData.role === opt.role && (
                                    <div className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center"
                                        style={{ background: '#C8102E' }}>
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                    </div>
                                )}
                                <span className="text-3xl">{opt.emoji}</span>
                                <span className={`text-base font-bold ${formData.role === opt.role ? 'text-red-700' : 'text-stone-700'}`}>
                                    {opt.label}
                                </span>
                                <span className={`text-xs leading-relaxed ${formData.role === opt.role ? 'text-red-500' : 'text-stone-400'}`}>
                                    {opt.desc}
                                </span>
                            </button>
                        ))}
                    </div>

                    {serverError && (
                        <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
                            {serverError}
                        </div>
                    )}

                    {/* ── Form Fields ─────────────────────────── */}
                    <form onSubmit={handleSubmit} noValidate>
                        <div className="space-y-5 mb-8">
                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-2" htmlFor="register-name">Full name</label>
                                <input id="register-name" type="text" placeholder="Jordan Rivera"
                                    value={formData.name} onChange={(e) => updateField('name', e.target.value)}
                                    className={`w-full px-4 py-3.5 rounded-xl border transition-all ${errors.name ? 'input-error border-red-300' : 'border-stone-300 hover:border-stone-400'}`}
                                    style={{ background: '#fafaf9' }} />
                                {errors.name && <p className="mt-1.5 text-xs text-red-600">{errors.name}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-2" htmlFor="register-email">University email</label>
                                <input id="register-email" type="email" placeholder="you@university.edu"
                                    value={formData.email} onChange={(e) => updateField('email', e.target.value)}
                                    className={`w-full px-4 py-3.5 rounded-xl border transition-all ${errors.email ? 'input-error border-red-300' : 'border-stone-300 hover:border-stone-400'}`}
                                    style={{ background: '#fafaf9' }} />
                                {errors.email && <p className="mt-1.5 text-xs text-red-600">{errors.email}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-stone-700 mb-2" htmlFor="register-password">Password</label>
                                    <div className="relative">
                                        <input id="register-password" type={showPassword ? 'text' : 'password'} placeholder="Min. 6 characters"
                                            value={formData.password} onChange={(e) => updateField('password', e.target.value)}
                                            className={`w-full px-4 py-3.5 pr-11 rounded-xl border transition-all ${errors.password ? 'input-error border-red-300' : 'border-stone-300 hover:border-stone-400'}`}
                                            style={{ background: '#fafaf9' }} />
                                        <button type="button" onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors bg-transparent border-none cursor-pointer p-0">
                                            {showPassword ? (
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                                            ) : (
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                                            )}
                                        </button>
                                    </div>
                                    {errors.password && <p className="mt-1.5 text-xs text-red-600">{errors.password}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-stone-700 mb-2" htmlFor="register-confirm">Confirm password</label>
                                    <div className="relative">
                                        <input id="register-confirm" type={showConfirm ? 'text' : 'password'} placeholder="Re-enter password"
                                            value={formData.confirmPassword} onChange={(e) => updateField('confirmPassword', e.target.value)}
                                            className={`w-full px-4 py-3.5 pr-11 rounded-xl border transition-all ${errors.confirmPassword ? 'input-error border-red-300' : 'border-stone-300 hover:border-stone-400'}`}
                                            style={{ background: '#fafaf9' }} />
                                        <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors bg-transparent border-none cursor-pointer p-0">
                                            {showConfirm ? (
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                                            ) : (
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                                            )}
                                        </button>
                                    </div>
                                    {errors.confirmPassword && <p className="mt-1.5 text-xs text-red-600">{errors.confirmPassword}</p>}
                                </div>
                            </div>
                        </div>

                        <button type="submit" disabled={isLoading}
                            className="w-full py-4 rounded-xl text-white font-semibold transition-all hover:opacity-90 disabled:opacity-60 cursor-pointer border-none"
                            style={{ background: 'linear-gradient(135deg, #C8102E, #E8384F)', fontSize: '15px' }}
                            id="register-submit">
                            {isLoading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                                    Creating account...
                                </span>
                            ) : (
                                `Create ${formData.role === 'student' ? 'student' : 'admin'} account`
                            )}
                        </button>
                    </form>

                    {/* Stats bar */}
                    <div className="mt-8 grid grid-cols-3 gap-4">
                        {content.stats.map((stat) => (
                            <div key={stat.label} className="text-center py-4 rounded-2xl bg-white border border-stone-200">
                                <p className="text-lg font-bold text-stone-800">{stat.value}</p>
                                <p className="text-xs text-stone-400 mt-0.5">{stat.label}</p>
                            </div>
                        ))}
                    </div>

                    <p className="mt-8 text-center text-sm text-stone-500">
                        Already have an account?{' '}
                        <Link to="/login" className="text-red-600 hover:text-red-700 font-medium no-underline">Sign in</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
