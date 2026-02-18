import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function Login() {
    const { login } = useApp();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [errors, setErrors] = useState({});
    const [serverError, setServerError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

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
        await new Promise((r) => setTimeout(r, 600));
        const result = login(formData.email, formData.password);
        setIsLoading(false);

        if (result.success) {
            navigate(result.user.role === 'admin' ? '/admin' : '/dashboard');
        } else {
            setServerError(result.error);
        }
    };

    return (
        <div className="min-h-screen flex" style={{ background: 'linear-gradient(135deg, #fef2f2 0%, #fafaf9 50%, #fffbeb 100%)' }}>
            {/* Left panel - branding */}
            <div style={{
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '48px',
                position: 'relative',
                overflow: 'hidden',
                background: 'linear-gradient(160deg, #C8102E, #960C22 40%, #6B0A1A)',
            }} className="hidden lg:flex lg:w-1/2">
                <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: '460px' }}>
                    {/* Big logo + title */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginBottom: '20px' }}>
                        <div style={{
                            width: '64px', height: '64px', borderRadius: '18px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px',
                            background: 'linear-gradient(135deg, #C8102E, #E8384F)',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                        }}>
                            🐾
                        </div>
                        <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: '42px', fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>
                            TutorCoogs
                        </span>
                    </div>

                    {/* Tagline */}
                    <h1 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '26px', fontWeight: 600, color: '#fff', lineHeight: 1.3, margin: '0 0 14px 0' }}>
                        Skip the wait, not the help.
                    </h1>

                    {/* Description */}
                    <p style={{ fontSize: '15px', color: '#fecdd3', lineHeight: 1.7, margin: '0 0 36px 0' }}>
                        Your campus tutoring hub. Know your wait time, get notified when it's your turn, and spend less time in line.
                    </p>

                    {/* Stats row */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                        {[
                            { label: 'Avg Wait', value: '~12 min' },
                            { label: 'Services', value: '6 active' },
                            { label: 'Satisfaction', value: '4.8 ★' },
                        ].map((stat) => (
                            <div key={stat.label} style={{
                                background: 'rgba(255,255,255,0.1)', borderRadius: '12px', padding: '14px 12px',
                                border: '1px solid rgba(255,255,255,0.1)',
                            }}>
                                <p style={{ color: '#fff', fontWeight: 700, fontSize: '18px', margin: '0 0 2px 0' }}>{stat.value}</p>
                                <p style={{ color: '#fecdd3', fontSize: '12px', margin: 0 }}>{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Decorative circles */}
                <div style={{ position: 'absolute', bottom: '-80px', right: '-80px', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
                <div style={{ position: 'absolute', top: '60px', right: '-40px', width: '160px', height: '160px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
                <div style={{ position: 'absolute', top: '-40px', left: '-40px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
            </div>

            {/* Right panel - form */}
            <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
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

                    <h2 className="text-2xl font-bold text-stone-800 mb-1" style={{ fontFamily: 'Outfit, sans-serif' }}>Welcome back</h2>
                    <p className="text-stone-500 mb-8">Sign in to check your queue status</p>

                    {serverError && (
                        <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="15" y1="9" x2="9" y2="15" />
                                <line x1="9" y1="9" x2="15" y2="15" />
                            </svg>
                            {serverError}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} noValidate>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-stone-700 mb-1.5" htmlFor="login-email">
                                Email address
                            </label>
                            <input
                                id="login-email"
                                type="email"
                                placeholder="you@university.edu"
                                value={formData.email}
                                onChange={(e) => { setFormData({ ...formData, email: e.target.value }); setErrors({ ...errors, email: '' }); }}
                                className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-all ${errors.email ? 'input-error border-red-300' : 'border-stone-300 hover:border-stone-400'
                                    }`}
                                style={{ background: '#fafaf9' }}
                            />
                            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-stone-700 mb-1.5" htmlFor="login-password">
                                Password
                            </label>
                            <input
                                id="login-password"
                                type="password"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={(e) => { setFormData({ ...formData, password: e.target.value }); setErrors({ ...errors, password: '' }); }}
                                className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-all ${errors.password ? 'input-error border-red-300' : 'border-stone-300 hover:border-stone-400'
                                    }`}
                                style={{ background: '#fafaf9' }}
                            />
                            {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-60 cursor-pointer border-none"
                            style={{ background: 'linear-gradient(135deg, #C8102E, #E8384F)' }}
                            id="login-submit"
                        >
                            {isLoading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                                    Signing in...
                                </span>
                            ) : 'Sign in'}
                        </button>
                    </form>

                    <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200">
                        <p className="text-xs text-amber-800 font-medium mb-1">Demo Accounts</p>
                        <p className="text-xs text-amber-700">Student: jordan@university.edu / password123</p>
                        <p className="text-xs text-amber-700">Admin: admin@university.edu / admin123</p>
                    </div>

                    <p className="mt-6 text-center text-sm text-stone-500">
                        Don't have an account?{' '}
                        <Link to="/register" className="text-red-600 hover:text-red-700 font-medium no-underline">
                            Create one
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
