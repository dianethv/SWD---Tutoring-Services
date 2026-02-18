import { useState } from 'react';
import { useApp } from '../../context/AppContext';

export default function ServiceManagement() {
    const { services, createService, updateService } = useApp();
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        expectedDuration: '',
        priorityLevel: 'medium',
        icon: '📚',
        category: '',
    });
    const [errors, setErrors] = useState({});
    const [successMsg, setSuccessMsg] = useState('');

    const icons = ['📐', '💻', '✍️', '⚛️', '📊', '🧪', '🔬', '📚', '🎨', '🧮', '🌐', '📝'];

    const validate = () => {
        const errs = {};
        if (!formData.name.trim()) errs.name = 'Service name is required';
        else if (formData.name.length > 100) errs.name = 'Name cannot exceed 100 characters';
        if (!formData.description.trim()) errs.description = 'Description is required';
        if (!formData.expectedDuration) errs.expectedDuration = 'Duration is required';
        else if (isNaN(formData.expectedDuration) || Number(formData.expectedDuration) < 1) errs.expectedDuration = 'Enter a valid duration (minutes)';
        else if (Number(formData.expectedDuration) > 120) errs.expectedDuration = 'Duration cannot exceed 120 minutes';
        if (!formData.category.trim()) errs.category = 'Category is required';
        return errs;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const errs = validate();
        setErrors(errs);
        if (Object.keys(errs).length > 0) return;

        const data = {
            ...formData,
            expectedDuration: Number(formData.expectedDuration),
        };

        if (editingId) {
            updateService(editingId, data);
            setSuccessMsg('Service updated successfully!');
        } else {
            createService(data);
            setSuccessMsg('Service created successfully!');
        }

        resetForm();
        setTimeout(() => setSuccessMsg(''), 3000);
    };

    const startEdit = (service) => {
        setEditingId(service.id);
        setFormData({
            name: service.name,
            description: service.description,
            expectedDuration: service.expectedDuration.toString(),
            priorityLevel: service.priorityLevel,
            icon: service.icon,
            category: service.category,
        });
        setShowForm(true);
        setErrors({});
    };

    const resetForm = () => {
        setFormData({ name: '', description: '', expectedDuration: '', priorityLevel: 'medium', icon: '📚', category: '' });
        setEditingId(null);
        setShowForm(false);
        setErrors({});
    };

    const updateField = (field, value) => {
        setFormData({ ...formData, [field]: value });
        if (errors[field]) setErrors({ ...errors, [field]: '' });
    };

    return (
        <div className="animate-fade-in-up">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-stone-800 mb-1" style={{ fontFamily: 'Outfit, sans-serif' }}>
                        Service Management
                    </h1>
                    <p className="text-stone-500">Create and edit tutoring services offered to students.</p>
                </div>
                <button
                    onClick={() => { resetForm(); setShowForm(!showForm); }}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90 cursor-pointer border-none"
                    style={{ background: 'linear-gradient(135deg, #C8102E, #E8384F)' }}
                    id="create-service-btn"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                    New Service
                </button>
            </div>

            {/* Success toast */}
            {successMsg && (
                <div className="fixed top-20 right-4 z-50 p-4 rounded-2xl bg-green-50 border border-green-200 text-green-800 text-sm font-medium shadow-lg toast-enter flex items-center gap-2">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                    {successMsg}
                </div>
            )}

            {/* Create / Edit Form */}
            {showForm && (
                <div className="bg-white rounded-2xl border border-stone-200 p-6 mb-8 animate-fade-in-up">
                    <h2 className="text-lg font-bold text-stone-800 mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>
                        {editingId ? 'Edit Service' : 'Create New Service'}
                    </h2>

                    <form onSubmit={handleSubmit} noValidate>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label htmlFor="service-name" className="block text-sm font-medium text-stone-700 mb-1.5">
                                    Service Name <span className="text-red-500">*</span>
                                </label>
                                <input id="service-name" type="text" placeholder="e.g., Calculus Help"
                                    value={formData.name} onChange={(e) => updateField('name', e.target.value)} maxLength={100}
                                    className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-all ${errors.name ? 'input-error border-red-300' : 'border-stone-300 hover:border-stone-400'}`}
                                    style={{ background: '#fafaf9' }} />
                                <div className="flex justify-between mt-1">
                                    {errors.name ? <p className="text-xs text-red-600">{errors.name}</p> : <span />}
                                    <span className="text-xs text-stone-400">{formData.name.length}/100</span>
                                </div>
                            </div>

                            <div>
                                <label htmlFor="service-category" className="block text-sm font-medium text-stone-700 mb-1.5">
                                    Category <span className="text-red-500">*</span>
                                </label>
                                <input id="service-category" type="text" placeholder="e.g., Mathematics"
                                    value={formData.category} onChange={(e) => updateField('category', e.target.value)}
                                    className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-all ${errors.category ? 'input-error border-red-300' : 'border-stone-300 hover:border-stone-400'}`}
                                    style={{ background: '#fafaf9' }} />
                                {errors.category && <p className="mt-1 text-xs text-red-600">{errors.category}</p>}
                            </div>
                        </div>

                        <div className="mb-4">
                            <label htmlFor="service-description" className="block text-sm font-medium text-stone-700 mb-1.5">
                                Description <span className="text-red-500">*</span>
                            </label>
                            <textarea id="service-description" placeholder="Describe what students will get help with..."
                                value={formData.description} onChange={(e) => updateField('description', e.target.value)} rows={3}
                                className={`w-full px-4 py-2.5 rounded-xl border text-sm resize-none transition-all ${errors.description ? 'input-error border-red-300' : 'border-stone-300 hover:border-stone-400'}`}
                                style={{ background: '#fafaf9' }} />
                            {errors.description && <p className="mt-1 text-xs text-red-600">{errors.description}</p>}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div>
                                <label htmlFor="service-duration" className="block text-sm font-medium text-stone-700 mb-1.5">
                                    Expected Duration (min) <span className="text-red-500">*</span>
                                </label>
                                <input id="service-duration" type="number" placeholder="25" min="1" max="120"
                                    value={formData.expectedDuration} onChange={(e) => updateField('expectedDuration', e.target.value)}
                                    className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-all ${errors.expectedDuration ? 'input-error border-red-300' : 'border-stone-300 hover:border-stone-400'}`}
                                    style={{ background: '#fafaf9' }} />
                                {errors.expectedDuration && <p className="mt-1 text-xs text-red-600">{errors.expectedDuration}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-1.5">Priority Level</label>
                                <div className="flex gap-2">
                                    {['low', 'medium', 'high'].map((p) => (
                                        <button key={p} type="button" onClick={() => updateField('priorityLevel', p)}
                                            className={`flex-1 px-3 py-2.5 rounded-xl text-xs font-semibold border cursor-pointer transition-all capitalize ${formData.priorityLevel === p ? `priority-${p}` : 'bg-white border-stone-200 text-stone-500 hover:border-stone-300'
                                                }`}>
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-1.5">Icon</label>
                                <div className="flex flex-wrap gap-1.5">
                                    {icons.map((icon) => (
                                        <button key={icon} type="button" onClick={() => updateField('icon', icon)}
                                            className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg cursor-pointer border transition-all ${formData.icon === icon ? 'border-teal-400 bg-red-50 shadow-sm' : 'border-stone-200 bg-white hover:border-stone-300'
                                                }`}>
                                            {icon}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 pt-2">
                            <button type="submit"
                                className="px-6 py-2.5 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90 cursor-pointer border-none"
                                style={{ background: 'linear-gradient(135deg, #C8102E, #E8384F)' }}
                                id="save-service-btn">
                                {editingId ? 'Save Changes' : 'Create Service'}
                            </button>
                            <button type="button" onClick={resetForm}
                                className="px-6 py-2.5 rounded-xl border border-stone-300 text-stone-600 text-sm font-semibold hover:bg-stone-50 transition-colors cursor-pointer bg-white">
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Services Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 stagger-children">
                {services.map((s) => (
                    <div key={s.id} className="bg-white rounded-2xl border border-stone-200 p-5 card-hover animate-fade-in-up">
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex items-start gap-3">
                                <span className="text-3xl">{s.icon}</span>
                                <div>
                                    <h3 className="font-bold text-stone-800">{s.name}</h3>
                                    <p className="text-xs text-stone-500">{s.category}</p>
                                </div>
                            </div>
                            <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${s.isOpen ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-stone-100 text-stone-500 border border-stone-200'
                                }`}>
                                {s.isOpen ? 'Open' : 'Closed'}
                            </span>
                        </div>

                        <p className="text-sm text-stone-600 mb-3 leading-relaxed line-clamp-2">{s.description}</p>

                        <div className="flex items-center gap-3 mb-4 text-xs text-stone-500">
                            <span>~{s.expectedDuration} min</span>
                            <span>•</span>
                            <span className={`px-2 py-0.5 rounded-md font-medium priority-${s.priorityLevel}`}>{s.priorityLevel}</span>
                        </div>

                        <button onClick={() => startEdit(s)}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-stone-200 text-stone-600 text-sm font-medium hover:bg-stone-50 transition-colors cursor-pointer bg-white"
                            id={`edit-service-${s.id}`}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9" /><path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z" /></svg>
                            Edit
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
