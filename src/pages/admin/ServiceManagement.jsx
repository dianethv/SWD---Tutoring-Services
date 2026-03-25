import { useState } from 'react';
import { useApp } from '../../context/AppContext';

export default function ServiceManagement() {
    const { services, createService, updateService } = useApp();
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        name: '', description: '', expectedDuration: '', priorityLevel: 'medium', icon: '📚', category: '',
    });
    const [errors, setErrors] = useState({});
    const [successMsg, setSuccessMsg] = useState('');
    const [hoveredCard, setHoveredCard] = useState(null);

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
        const data = { ...formData, expectedDuration: Number(formData.expectedDuration) };
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
            name: service.name, description: service.description,
            expectedDuration: service.expectedDuration.toString(),
            priorityLevel: service.priorityLevel, icon: service.icon, category: service.category,
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

    // Style tokens
    const card = { background: '#fff', border: '1px solid #e7e5e4', borderRadius: '16px', overflow: 'hidden', transition: 'all 0.2s ease' };
    const heading = { fontFamily: "'Outfit', sans-serif", fontSize: '24px', fontWeight: 700, color: '#1c1917', margin: '0 0 6px 0' };
    const labelStyle = { display: 'block', fontSize: '13px', fontWeight: 600, color: '#44403c', marginBottom: '6px' };
    const inputStyle = (hasError) => ({
        width: '100%', padding: '10px 14px', borderRadius: '10px', fontSize: '13px',
        border: `1px solid ${hasError ? '#fca5a5' : '#e7e5e4'}`, background: '#fafaf9',
        outline: 'none', transition: 'border 0.15s', boxSizing: 'border-box',
    });
    const priorityColors = {
        low: { bg: '#dbeafe', color: '#2563eb', border: '#93c5fd' },
        medium: { bg: '#fef3c7', color: '#d97706', border: '#fde68a' },
        high: { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
    };

    const openCount = services.filter(s => s.isOpen).length;
    const closedCount = services.length - openCount;

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
                <div>
                    <h1 style={heading}>Service Management</h1>
                    <p style={{ fontSize: '14px', color: '#78716c', margin: 0 }}>Create and edit tutoring services offered to students.</p>
                </div>
                <button
                    onClick={() => { resetForm(); setShowForm(!showForm); }}
                    style={{
                        display: 'inline-flex', alignItems: 'center', gap: '8px',
                        padding: '10px 22px', borderRadius: '12px', border: 'none',
                        background: 'linear-gradient(135deg, #C8102E, #E8384F)',
                        color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                        boxShadow: '0 4px 14px rgba(200,16,46,0.25)', transition: 'opacity 0.15s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                    id="create-service-btn"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                    {showForm ? 'Close Form' : 'New Service'}
                </button>
            </div>

            {/* Summary pills */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
                <span style={{
                    padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                    background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a',
                }}>
                    ✅ {openCount} Open
                </span>
                <span style={{
                    padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                    background: '#f5f5f4', border: '1px solid #e7e5e4', color: '#78716c',
                }}>
                    ⏸️ {closedCount} Closed
                </span>
                <span style={{
                    padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                    background: '#fef2f2', border: '1px solid #fecaca', color: '#C8102E',
                }}>
                    📋 {services.length} Total
                </span>
            </div>

            {/* Success toast */}
            {successMsg && (
                <div style={{
                    position: 'fixed', top: '80px', right: '16px', zIndex: 50,
                    padding: '14px 20px', borderRadius: '14px',
                    background: '#f0fdf4', border: '1px solid #bbf7d0',
                    color: '#166534', fontSize: '13px', fontWeight: 600,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                    display: 'flex', alignItems: 'center', gap: '8px',
                }}>
                    ✅ {successMsg}
                </div>
            )}

            {/* Create / Edit Form */}
            {showForm && (
                <div style={{ ...card, padding: '28px', marginBottom: '28px' }}>
                    <div style={{ height: '3px', background: 'linear-gradient(90deg, #C8102E, #E8384F)', margin: '-28px -28px 24px -28px', borderRadius: '16px 16px 0 0' }} />
                    <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '18px', fontWeight: 700, color: '#1c1917', margin: '0 0 20px 0' }}>
                        {editingId ? '✏️ Edit Service' : '➕ Create New Service'}
                    </h2>

                    <form onSubmit={handleSubmit} noValidate>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                            <div>
                                <label htmlFor="service-name" style={labelStyle}>
                                    Service Name <span style={{ color: '#dc2626' }}>*</span>
                                </label>
                                <input id="service-name" type="text" placeholder="e.g., Calculus Help"
                                    value={formData.name} onChange={(e) => updateField('name', e.target.value)} maxLength={100}
                                    style={inputStyle(errors.name)} />
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                                    {errors.name ? <span style={{ fontSize: '11px', color: '#dc2626' }}>{errors.name}</span> : <span />}
                                    <span style={{ fontSize: '11px', color: '#a8a29e' }}>{formData.name.length}/100</span>
                                </div>
                            </div>
                            <div>
                                <label htmlFor="service-category" style={labelStyle}>
                                    Category <span style={{ color: '#dc2626' }}>*</span>
                                </label>
                                <input id="service-category" type="text" placeholder="e.g., Mathematics"
                                    value={formData.category} onChange={(e) => updateField('category', e.target.value)}
                                    style={inputStyle(errors.category)} />
                                {errors.category && <span style={{ fontSize: '11px', color: '#dc2626', marginTop: '4px', display: 'block' }}>{errors.category}</span>}
                            </div>
                        </div>

                        <div style={{ marginBottom: '16px' }}>
                            <label htmlFor="service-description" style={labelStyle}>
                                Description <span style={{ color: '#dc2626' }}>*</span>
                            </label>
                            <textarea id="service-description" placeholder="Describe what students will get help with..."
                                value={formData.description} onChange={(e) => updateField('description', e.target.value)} rows={3}
                                style={{ ...inputStyle(errors.description), resize: 'none' }} />
                            {errors.description && <span style={{ fontSize: '11px', color: '#dc2626', marginTop: '4px', display: 'block' }}>{errors.description}</span>}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                            <div>
                                <label htmlFor="service-duration" style={labelStyle}>
                                    Expected Duration (min) <span style={{ color: '#dc2626' }}>*</span>
                                </label>
                                <input id="service-duration" type="number" placeholder="25" min="1" max="120"
                                    value={formData.expectedDuration} onChange={(e) => updateField('expectedDuration', e.target.value)}
                                    style={inputStyle(errors.expectedDuration)} />
                                {errors.expectedDuration && <span style={{ fontSize: '11px', color: '#dc2626', marginTop: '4px', display: 'block' }}>{errors.expectedDuration}</span>}
                            </div>

                            <div>
                                <label style={labelStyle}>Priority Level</label>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    {['low', 'medium', 'high'].map((p) => {
                                        const colors = priorityColors[p];
                                        const isActive = formData.priorityLevel === p;
                                        return (
                                            <button key={p} type="button" onClick={() => updateField('priorityLevel', p)}
                                                style={{
                                                    flex: 1, padding: '10px 12px', borderRadius: '10px',
                                                    fontSize: '12px', fontWeight: 600, textTransform: 'capitalize',
                                                    cursor: 'pointer', transition: 'all 0.15s',
                                                    background: isActive ? colors.bg : '#fff',
                                                    color: isActive ? colors.color : '#78716c',
                                                    border: `1px solid ${isActive ? colors.border : '#e7e5e4'}`,
                                                }}>
                                                {p}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div>
                                <label style={labelStyle}>Icon</label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                    {icons.map((icon) => (
                                        <button key={icon} type="button" onClick={() => updateField('icon', icon)}
                                            style={{
                                                width: '36px', height: '36px', borderRadius: '8px',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: '18px', cursor: 'pointer', transition: 'all 0.15s',
                                                background: formData.icon === icon ? '#fef2f2' : '#fff',
                                                border: `1px solid ${formData.icon === icon ? '#fecaca' : '#e7e5e4'}`,
                                                boxShadow: formData.icon === icon ? '0 0 0 2px rgba(200,16,46,0.15)' : 'none',
                                            }}>
                                            {icon}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingTop: '8px', borderTop: '1px solid #f5f5f4' }}>
                            <button type="submit" id="save-service-btn"
                                style={{
                                    padding: '10px 24px', borderRadius: '10px', border: 'none',
                                    background: 'linear-gradient(135deg, #C8102E, #E8384F)',
                                    color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                                    transition: 'opacity 0.15s',
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                            >
                                {editingId ? 'Save Changes' : 'Create Service'}
                            </button>
                            <button type="button" onClick={resetForm}
                                style={{
                                    padding: '10px 24px', borderRadius: '10px',
                                    border: '1px solid #e7e5e4', background: '#fff',
                                    color: '#57534e', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                                    transition: 'background 0.15s',
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = '#fafaf9'}
                                onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Services Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
                {services.map((s) => {
                    const pColors = priorityColors[s.priorityLevel] || priorityColors.medium;
                    const isHovered = hoveredCard === s.id;
                    return (
                        <div key={s.id}
                            style={{
                                ...card,
                                position: 'relative',
                                transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
                                boxShadow: isHovered ? '0 8px 24px rgba(0,0,0,0.08)' : '0 1px 3px rgba(0,0,0,0.04)',
                            }}
                            onMouseEnter={() => setHoveredCard(s.id)}
                            onMouseLeave={() => setHoveredCard(null)}
                        >
                            {/* Accent top strip */}
                            <div style={{ height: '3px', background: s.isOpen ? 'linear-gradient(90deg, #16a34a, #4ade80)' : '#d6d3d1' }} />

                            <div style={{ padding: '22px' }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                        <div style={{
                                            width: '48px', height: '48px', borderRadius: '12px',
                                            background: s.isOpen ? '#f0fdf4' : '#f5f5f4',
                                            border: `1px solid ${s.isOpen ? '#bbf7d0' : '#e7e5e4'}`,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '24px',
                                        }}>
                                            {s.icon}
                                        </div>
                                        <div>
                                            <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '16px', fontWeight: 700, color: '#1c1917', margin: 0 }}>{s.name}</h3>
                                            <p style={{ fontSize: '12px', color: '#78716c', margin: '2px 0 0 0' }}>{s.category}</p>
                                        </div>
                                    </div>
                                    <span style={{
                                        display: 'inline-flex', alignItems: 'center', gap: '5px',
                                        padding: '4px 12px', borderRadius: '16px', fontSize: '11px', fontWeight: 700,
                                        background: s.isOpen ? '#f0fdf4' : '#f5f5f4',
                                        color: s.isOpen ? '#16a34a' : '#78716c',
                                        border: `1px solid ${s.isOpen ? '#bbf7d0' : '#e7e5e4'}`,
                                    }}>
                                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: s.isOpen ? '#16a34a' : '#a8a29e' }} />
                                        {s.isOpen ? 'Open' : 'Closed'}
                                    </span>
                                </div>

                                <p style={{ fontSize: '13px', color: '#57534e', lineHeight: 1.6, margin: '0 0 16px 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                    {s.description}
                                </p>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                                    <span style={{
                                        padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 600,
                                        background: '#fafaf9', border: '1px solid #e7e5e4', color: '#57534e',
                                    }}>
                                        ⏱ ~{s.expectedDuration} min
                                    </span>
                                    <span style={{
                                        padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 600,
                                        textTransform: 'capitalize',
                                        background: pColors.bg, color: pColors.color, border: `1px solid ${pColors.border}`,
                                    }}>
                                        {s.priorityLevel}
                                    </span>
                                </div>

                                <button onClick={() => startEdit(s)} id={`edit-service-${s.id}`}
                                    style={{
                                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                                        padding: '8px 18px', borderRadius: '10px',
                                        border: '1px solid #e7e5e4', background: '#fff', color: '#57534e',
                                        fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                                        transition: 'all 0.15s',
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.background = '#fafaf9'; e.currentTarget.style.borderColor = '#d6d3d1'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#e7e5e4'; }}
                                >
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9" /><path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z" /></svg>
                                    Edit Service
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
