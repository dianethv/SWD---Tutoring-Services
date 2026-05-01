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
            setSuccessMsg('Service updated successfully.');
        } else {
            createService(data);
            setSuccessMsg('Service created successfully.');
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

    // Editorial input styles
    const labelStyle = {
        display: 'block',
        fontSize: 10.5,
        fontWeight: 700,
        color: '#78716c',
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        marginBottom: 8,
        fontFamily: 'JetBrains Mono, monospace',
    };
    const inputStyle = (hasError) => ({
        width: '100%',
        padding: '10px 14px',
        borderRadius: 10,
        fontSize: 14,
        border: `1px solid ${hasError ? '#fca5a5' : '#e7e5e4'}`,
        background: '#fff',
        color: '#1c1917',
        outline: 'none',
        transition: 'border 0.15s, box-shadow 0.15s',
        boxSizing: 'border-box',
        fontFamily: 'inherit',
        minHeight: 'unset',
    });

    const openCount = services.filter((s) => s.isOpen).length;
    const closedCount = services.length - openCount;

    return (
        <div className="service-management-page">
            {/* ── Hero ────────────────────────────────────────────── */}
            <section className="tc-page-hero">
                <span className="tc-page-eyebrow">
                    Catalogue · {services.length} {services.length === 1 ? 'service' : 'services'} configured
                </span>
                <h1 className="tc-page-headline" style={{ marginTop: 16 }}>
                    Service management<span className="tc-dot">.</span>
                </h1>
                <p className="tc-page-sub">
                    Create, edit and tune the tutoring services your center offers.
                    {openCount > 0
                        ? ` ${openCount} ${openCount === 1 ? 'service is' : 'services are'} live for students right now.`
                        : ' No services are currently live.'}
                </p>
                <div style={{ marginTop: 24, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <button
                        onClick={() => { resetForm(); setShowForm(!showForm); }}
                        id="create-service-btn"
                        style={{
                            padding: '12px 22px',
                            borderRadius: 12,
                            background: showForm ? '#fff' : '#C8102E',
                            color: showForm ? '#1c1917' : '#fff',
                            fontSize: 13,
                            fontWeight: 600,
                            border: showForm ? '1px solid #ece9e2' : 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                            cursor: 'pointer',
                            boxShadow: showForm ? 'none' : '0 4px 14px -6px rgba(200, 16, 46, 0.45)',
                            transition: 'background 0.2s, transform 0.2s',
                            fontFamily: 'inherit',
                        }}
                        onMouseEnter={(e) => {
                            if (!showForm) { e.currentTarget.style.background = '#960C22'; e.currentTarget.style.transform = 'translateY(-1px)'; }
                            else { e.currentTarget.style.borderColor = '#1c1917'; }
                        }}
                        onMouseLeave={(e) => {
                            if (!showForm) { e.currentTarget.style.background = '#C8102E'; e.currentTarget.style.transform = 'translateY(0)'; }
                            else { e.currentTarget.style.borderColor = '#ece9e2'; }
                        }}
                    >
                        {showForm ? 'Close form' : 'New service'}
                        {!showForm && (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="12" y1="5" x2="12" y2="19" />
                                <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                        )}
                    </button>
                </div>
            </section>

            {/* ── Stat row ────────────────────────────────────────── */}
            <section style={{ marginBottom: 36 }}>
                <div className="tc-section-head">
                    <div>
                        <span className="tc-page-eyebrow">Catalogue Snapshot</span>
                        <h2 className="tc-section-title">At a glance</h2>
                    </div>
                </div>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: 16,
                }}>
                    <div className="tc-stat">
                        <p className="tc-stat-eyebrow"><span>Total Services</span></p>
                        <p className="tc-stat-value">{services.length}</p>
                        <p className="tc-stat-meta">configured in the catalogue</p>
                    </div>
                    <div className="tc-stat">
                        <p className="tc-stat-eyebrow"><span>Open</span></p>
                        <p className="tc-stat-value">{openCount}</p>
                        <p className="tc-stat-meta">accepting students right now</p>
                    </div>
                    <div className="tc-stat">
                        <p className="tc-stat-eyebrow"><span>Closed</span></p>
                        <p className="tc-stat-value">{closedCount}</p>
                        <p className="tc-stat-meta">paused or not yet open</p>
                    </div>
                </div>
            </section>

            {/* ── Success toast ───────────────────────────────────── */}
            {successMsg && (
                <div className="app-toast" style={{
                    position: 'fixed', top: 80, right: 16, zIndex: 50,
                    padding: '14px 20px', borderRadius: 14,
                    background: '#fff', border: '1px solid #bbf7d0',
                    color: '#166534', fontSize: 13, fontWeight: 500,
                    boxShadow: '0 14px 40px -16px rgba(22, 163, 74, 0.35)',
                    display: 'flex', alignItems: 'center', gap: 10,
                }}>
                    <span className="tc-pulse-dot" />
                    {successMsg}
                </div>
            )}

            {/* ── Create / Edit form ──────────────────────────────── */}
            {showForm && (
                <section style={{ marginBottom: 36 }}>
                    <div style={{
                        background: '#fff',
                        border: '1px solid #e7e5e4',
                        borderTop: '3px solid #C8102E',
                        borderRadius: 14,
                        padding: 26,
                    }}>
                        <div style={{ marginBottom: 22 }}>
                            <span className="tc-page-eyebrow">{editingId ? 'Editing' : 'New entry'}</span>
                            <h2 className="tc-section-title" style={{ marginTop: 6 }}>
                                {editingId ? 'Edit service' : 'Create service'}
                            </h2>
                        </div>

                        <form onSubmit={handleSubmit} noValidate>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 18, marginBottom: 18 }}>
                                <div>
                                    <label htmlFor="service-name" style={labelStyle}>SERVICE NAME *</label>
                                    <input
                                        id="service-name"
                                        type="text"
                                        placeholder="e.g., Calculus Help"
                                        value={formData.name}
                                        onChange={(e) => updateField('name', e.target.value)}
                                        maxLength={100}
                                        style={inputStyle(errors.name)}
                                    />
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                                        {errors.name
                                            ? <span style={{ fontSize: 11, color: '#dc2626' }}>{errors.name}</span>
                                            : <span />}
                                        <span className="tc-mono" style={{ fontSize: 10, color: '#a8a29e', letterSpacing: '0.06em' }}>
                                            {formData.name.length}/100
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="service-category" style={labelStyle}>CATEGORY *</label>
                                    <input
                                        id="service-category"
                                        type="text"
                                        placeholder="e.g., Mathematics"
                                        value={formData.category}
                                        onChange={(e) => updateField('category', e.target.value)}
                                        style={inputStyle(errors.category)}
                                    />
                                    {errors.category && <span style={{ fontSize: 11, color: '#dc2626', marginTop: 6, display: 'block' }}>{errors.category}</span>}
                                </div>
                            </div>

                            <div style={{ marginBottom: 18 }}>
                                <label htmlFor="service-description" style={labelStyle}>DESCRIPTION *</label>
                                <textarea
                                    id="service-description"
                                    placeholder="Describe what students will get help with..."
                                    value={formData.description}
                                    onChange={(e) => updateField('description', e.target.value)}
                                    rows={3}
                                    style={{ ...inputStyle(errors.description), resize: 'none', lineHeight: 1.55 }}
                                />
                                {errors.description && <span style={{ fontSize: 11, color: '#dc2626', marginTop: 6, display: 'block' }}>{errors.description}</span>}
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 18, marginBottom: 22 }}>
                                <div>
                                    <label htmlFor="service-duration" style={labelStyle}>DURATION (MIN) *</label>
                                    <input
                                        id="service-duration"
                                        type="number"
                                        placeholder="25"
                                        min="1"
                                        max="120"
                                        value={formData.expectedDuration}
                                        onChange={(e) => updateField('expectedDuration', e.target.value)}
                                        style={inputStyle(errors.expectedDuration)}
                                    />
                                    {errors.expectedDuration && <span style={{ fontSize: 11, color: '#dc2626', marginTop: 6, display: 'block' }}>{errors.expectedDuration}</span>}
                                </div>

                                <div>
                                    <label style={labelStyle}>PRIORITY</label>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        {['low', 'medium', 'high'].map((p) => {
                                            const isActive = formData.priorityLevel === p;
                                            return (
                                                <button
                                                    key={p}
                                                    type="button"
                                                    onClick={() => updateField('priorityLevel', p)}
                                                    className="tc-mono"
                                                    style={{
                                                        flex: 1,
                                                        padding: '10px 12px',
                                                        borderRadius: 10,
                                                        fontSize: 11,
                                                        fontWeight: 700,
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.08em',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.15s',
                                                        background: isActive ? '#fef2f2' : '#fff',
                                                        color: isActive ? '#C8102E' : '#78716c',
                                                        border: `1px solid ${isActive ? '#fecaca' : '#e7e5e4'}`,
                                                    }}
                                                >
                                                    {p}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div>
                                    <label style={labelStyle}>ICON</label>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                        {icons.map((icon) => (
                                            <button
                                                key={icon}
                                                type="button"
                                                onClick={() => updateField('icon', icon)}
                                                style={{
                                                    width: 36,
                                                    height: 36,
                                                    borderRadius: 8,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: 18,
                                                    cursor: 'pointer',
                                                    transition: 'all 0.15s',
                                                    background: formData.icon === icon ? '#fef2f2' : '#fff',
                                                    border: `1px solid ${formData.icon === icon ? '#fecaca' : '#e7e5e4'}`,
                                                    boxShadow: formData.icon === icon ? '0 0 0 2px rgba(200,16,46,0.12)' : 'none',
                                                }}
                                            >
                                                {icon}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                                flexWrap: 'wrap',
                                paddingTop: 18,
                                borderTop: '1px dashed #ece9e2',
                            }}>
                                <button
                                    type="submit"
                                    id="save-service-btn"
                                    style={{
                                        padding: '11px 22px',
                                        borderRadius: 10,
                                        border: 'none',
                                        background: '#C8102E',
                                        color: '#fff',
                                        fontSize: 13,
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        boxShadow: '0 4px 14px -6px rgba(200, 16, 46, 0.45)',
                                        transition: 'background 0.2s',
                                        fontFamily: 'inherit',
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.background = '#960C22')}
                                    onMouseLeave={(e) => (e.currentTarget.style.background = '#C8102E')}
                                >
                                    {editingId ? 'Save changes' : 'Create service'}
                                </button>
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    style={{
                                        padding: '11px 22px',
                                        borderRadius: 10,
                                        border: '1px solid #e7e5e4',
                                        background: '#fff',
                                        color: '#1c1917',
                                        fontSize: 13,
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        transition: 'all 0.15s',
                                        fontFamily: 'inherit',
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.background = '#fafaf9'; e.currentTarget.style.borderColor = '#1c1917'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#e7e5e4'; }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </section>
            )}

            {/* ── Services grid ───────────────────────────────────── */}
            <section style={{ marginBottom: 36 }}>
                <div className="tc-section-head">
                    <div>
                        <span className="tc-page-eyebrow">All Services</span>
                        <h2 className="tc-section-title">Catalogue</h2>
                    </div>
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: 16,
                }}>
                    {services.map((s) => (
                        <div
                            key={s.id}
                            className="tc-lift"
                            style={{
                                background: '#fff',
                                border: '1px solid #e7e5e4',
                                borderTop: `3px solid ${s.isOpen ? '#16a34a' : '#d6d3d1'}`,
                                borderRadius: 14,
                                padding: 22,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 14,
                            }}
                        >
                            {/* Header: category + status */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span className="tc-stat-eyebrow" style={{ margin: 0 }}>{s.category}</span>
                                <span className={`tc-pill ${s.isOpen ? 'tc-pill-success' : 'tc-pill-neutral'}`}>
                                    {s.isOpen
                                        ? <><span className="tc-pulse-dot" /> OPEN</>
                                        : 'CLOSED'}
                                </span>
                            </div>

                            {/* Service name */}
                            <div>
                                <p style={{
                                    fontFamily: 'Outfit, sans-serif',
                                    fontSize: 18,
                                    fontWeight: 700,
                                    color: '#1c1917',
                                    margin: 0,
                                    letterSpacing: '-0.012em',
                                    lineHeight: 1.2,
                                }}>
                                    {s.name}
                                </p>
                                <p style={{
                                    fontSize: 13,
                                    color: '#78716c',
                                    margin: '6px 0 0 0',
                                    lineHeight: 1.55,
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                }}>
                                    {s.description}
                                </p>
                            </div>

                            {/* Mono meta row */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                paddingTop: 14,
                                borderTop: '1px dashed #e7e5e4',
                            }}>
                                <span className="tc-mono" style={{ fontSize: 11, color: '#78716c', letterSpacing: '0.1em', fontWeight: 600 }}>
                                    ~{s.expectedDuration}M SESSION
                                </span>
                                <span
                                    className="tc-mono"
                                    style={{
                                        fontSize: 11,
                                        color: s.priorityLevel === 'high' ? '#C8102E' : s.priorityLevel === 'medium' ? '#d97706' : '#2563eb',
                                        letterSpacing: '0.1em',
                                        fontWeight: 700,
                                        textTransform: 'uppercase',
                                    }}
                                >
                                    {s.priorityLevel} PRIORITY
                                </span>
                            </div>

                            {/* Edit button */}
                            <button
                                onClick={() => startEdit(s)}
                                id={`edit-service-${s.id}`}
                                style={{
                                    width: '100%',
                                    padding: '10px 16px',
                                    borderRadius: 10,
                                    border: '1px solid #e7e5e4',
                                    background: '#fff',
                                    color: '#1c1917',
                                    fontSize: 13,
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    transition: 'all 0.15s',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 8,
                                    fontFamily: 'inherit',
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = '#fafaf9'; e.currentTarget.style.borderColor = '#1c1917'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#e7e5e4'; }}
                            >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                                    <path d="M12 20h9" />
                                    <path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z" />
                                </svg>
                                Edit service
                            </button>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}
