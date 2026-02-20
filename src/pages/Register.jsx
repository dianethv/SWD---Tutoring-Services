import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function Register() {
    const { register } = useApp();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '', role: 'student' });
    const [errors, setErrors] = useState({});
    const [serverError, setServerError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

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
            {/* Left panel */}
            <div className="hidden lg:flex lg:w-1/2 flex-col justify-between relative overflow-hidden"
                style={{ background: 'linear-gradient(160deg, #C8102E, #960C22 40%, #6B0A1A)', padding: '64px 72px' }}>
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-12">
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl"
                            style={{ background: 'linear-gradient(135deg, #C8102E, #E8384F)' }}>
                            🐾
                        </div>
                        <span className="text-2xl font-bold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>TutorCoogs</span>
                    </div>
                    <h1 className="text-4xl font-bold text-white leading-tight mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>
                        Join the smarter<br />way to get help.
                    </h1>
                    <p className="text-red-100 text-lg leading-relaxed max-w-md">
                        Create your account in seconds. No more guessing how long the line is — we'll tell you exactly when it's your turn.
                    </p>
                </div>

                <div className="relative z-10 space-y-4">
                    {[
                        { icon: '⚡', title: 'Real-time updates', desc: 'See your exact position and ETA' },
                        { icon: '🔔', title: 'Timely notifications', desc: "We'll ping you when you're up next" },
                        { icon: '📊', title: 'Track your visits', desc: 'Full history of your tutoring sessions' },
                    ].map((feature) => (
                        <div key={feature.title} className="flex items-start gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/10">
                            <span className="text-xl mt-0.5">{feature.icon}</span>
                            <div>
                                <p className="text-white font-semibold text-sm">{feature.title}</p>
                                <p className="text-red-200 text-xs">{feature.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-white/5" />
                <div className="absolute top-40 -right-10 w-40 h-40 rounded-full bg-white/5" />
            </div>

            {/* Right panel - form */}
            <div className="flex-1 flex items-center justify-center p-6 lg:p-16">
                <div className="w-full max-w-lg animate-fade-in-up">
                    <div className="lg:hidden flex items-center gap-2.5 mb-8">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
                            style={{ background: 'linear-gradient(135deg, #C8102E, #E8384F)' }}>
                            🐾
                        </div>
                        <span className="text-lg font-bold text-stone-800" style={{ fontFamily: 'Outfit, sans-serif' }}>Tutor<span className="text-red-600">Coogs</span></span>
                    </div>

                    <h2 className="text-2xl font-bold text-stone-800 mb-1" style={{ fontFamily: 'Outfit, sans-serif' }}>Create your account</h2>
                    <p className="text-stone-500 mb-8">Start getting help faster today</p>

                    {serverError && (
                        <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
                            {serverError}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} noValidate>
                        {/* Personal Info Section */}
                        <div className="bg-white rounded-2xl border border-stone-200 p-6 mb-5">
                            <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-4">Personal Information</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-stone-700 mb-1.5" htmlFor="register-name">Full name</label>
                                    <input id="register-name" type="text" placeholder="Jordan Rivera"
                                        value={formData.name} onChange={(e) => updateField('name', e.target.value)}
                                        className={`w-full px-4 py-3 rounded-xl border transition-all ${errors.name ? 'input-error border-red-300' : 'border-stone-300 hover:border-stone-400'}`}
                                        style={{ background: '#fafaf9' }} />
                                    {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-stone-700 mb-1.5" htmlFor="register-email">Email address</label>
                                    <input id="register-email" type="email" placeholder="you@university.edu"
                                        value={formData.email} onChange={(e) => updateField('email', e.target.value)}
                                        className={`w-full px-4 py-3 rounded-xl border transition-all ${errors.email ? 'input-error border-red-300' : 'border-stone-300 hover:border-stone-400'}`}
                                        style={{ background: '#fafaf9' }} />
                                    {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Security Section */}
                        <div className="bg-white rounded-2xl border border-stone-200 p-6 mb-5">
                            <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-4">Security</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-stone-700 mb-1.5" htmlFor="register-password">Password</label>
                                    <input id="register-password" type="password" placeholder="Min. 6 characters"
                                        value={formData.password} onChange={(e) => updateField('password', e.target.value)}
                                        className={`w-full px-4 py-3 rounded-xl border transition-all ${errors.password ? 'input-error border-red-300' : 'border-stone-300 hover:border-stone-400'}`}
                                        style={{ background: '#fafaf9' }} />
                                    {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-stone-700 mb-1.5" htmlFor="register-confirm">Confirm password</label>
                                    <input id="register-confirm" type="password" placeholder="Re-enter password"
                                        value={formData.confirmPassword} onChange={(e) => updateField('confirmPassword', e.target.value)}
                                        className={`w-full px-4 py-3 rounded-xl border transition-all ${errors.confirmPassword ? 'input-error border-red-300' : 'border-stone-300 hover:border-stone-400'}`}
                                        style={{ background: '#fafaf9' }} />
                                    {errors.confirmPassword && <p className="mt-1 text-xs text-red-600">{errors.confirmPassword}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Role Section */}
                        <div className="bg-white rounded-2xl border border-stone-200 p-6 mb-6">
                            <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-4">I am a...</p>
                            <div className="grid grid-cols-2 gap-3">
                                {['student', 'admin'].map((role) => (
                                    <button type="button" key={role}
                                        onClick={() => updateField('role', role)}
                                        className={`flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-xl border text-sm font-semibold transition-all cursor-pointer ${formData.role === role
                                            ? 'border-red-300 text-red-700'
                                            : 'bg-white border-stone-200 text-stone-500 hover:border-stone-300'
                                            }`}
                                        style={formData.role === role ? { background: 'linear-gradient(135deg, #fef2f2, #fee2e2)' } : {}}>
                                        <span className="text-lg">{role === 'student' ? '🎓' : '🛠️'}</span>
                                        {role === 'student' ? 'Student' : 'Admin / Tutor'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button type="submit" disabled={isLoading}
                            className="w-full py-3.5 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-60 cursor-pointer border-none"
                            style={{ background: 'linear-gradient(135deg, #C8102E, #E8384F)' }}
                            id="register-submit">
                            {isLoading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                                    Creating account...
                                </span>
                            ) : 'Create account'}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-sm text-stone-500">
                        Already have an account?{' '}
                        <Link to="/login" className="text-red-600 hover:text-red-700 font-medium no-underline">Sign in</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
