import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../config/api';
import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';

function toWholeMinutes(value) {
    const minutes = Number(value);
    if (!Number.isFinite(minutes)) {
        return 0;
    }
    return Math.max(0, Math.round(minutes));
}

export default function Reports() {
    const [activeTab, setActiveTab] = useState('users');
    const [usersReport, setUsersReport] = useState([]);
    const [servicesReport, setServicesReport] = useState([]);
    const [queueStats, setQueueStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [exportError, setExportError] = useState('');

    useEffect(() => {
        async function fetchReports() {
            setLoading(true);
            try {
                const [uRes, sRes, qRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/reports/users`),
                    fetch(`${API_BASE_URL}/reports/services`),
                    fetch(`${API_BASE_URL}/reports/queue-stats`),
                ]);
                if (uRes.ok) setUsersReport(await uRes.json());
                if (sRes.ok) setServicesReport(await sRes.json());
                if (qRes.ok) setQueueStats(await qRes.json());
            } catch (e) {
                console.error('Failed to fetch reports:', e);
            }
            setLoading(false);
        }
        fetchReports();
    }, []);

    // ── CSV Export ───────────────────────────────────
    const exportCSV = () => {
        let csv = '', filename = '';
        if (activeTab === 'users') {
            csv = 'Name,Email,Role,Total Visits,Served,Cancelled,No-Shows,Avg Wait (min)\n';
            usersReport.forEach(u => {
                csv += `"${u.name}","${u.email}","${u.role}",${u.totalVisits},${u.timesServed},${u.timesCancelled},${u.timesNoShow},${toWholeMinutes(u.avgWaitTime)}\n`;
            });
            filename = 'users_report.csv';
        } else if (activeTab === 'services') {
            csv = 'Service,Category,Status,Total Served,Cancelled,No-Shows,Avg Wait (min),Currently In Queue\n';
            servicesReport.forEach(s => {
                csv += `"${s.name}","${s.category}","${s.isOpen ? 'Open' : 'Closed'}",${s.totalServed},${s.totalCancelled},${s.totalNoShows},${toWholeMinutes(s.avgWaitTime)},${s.currentInQueue}\n`;
            });
            filename = 'services_report.csv';
        } else {
            csv = 'Metric,Value\n';
            if (queueStats) {
                csv += `Total Users Served,${queueStats.totalUsersServed}\n`;
                csv += `Total No-Shows,${queueStats.totalNoShows}\n`;
                csv += `Total Cancelled,${queueStats.totalCancelled}\n`;
                csv += `Avg Wait Time (min),${toWholeMinutes(queueStats.avgWaitTime)}\n`;
                csv += `Currently In Queue,${queueStats.currentlyInQueue}\n`;
                csv += `Total Users,${queueStats.totalUsers}\n`;
                csv += `Total Services,${queueStats.totalServices}\n`;
                csv += '\nService,Served,No-Shows,Avg Wait (min)\n';
                (queueStats.serviceBreakdown || []).forEach(sb => {
                    csv += `"${sb.serviceName}",${sb.totalServed},${sb.totalNoShows},${toWholeMinutes(sb.avgWaitTime)}\n`;
                });
            }
            filename = 'queue_stats_report.csv';
        }
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
        URL.revokeObjectURL(link.href);
    };

    // ── PDF Export ───────────────────────────────────
    const exportPDF = () => {
        setExportError('');
        const doc = new jsPDF('p', 'mm', 'a4');
        const pageWidth = doc.internal.pageSize.getWidth();
        const brandColor = [200, 16, 46];
        const darkText = [28, 25, 23];
        const mutedText = [120, 113, 108];
        const now = new Date();
        const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        let y = 0;

        // ── Helper: check if we need a new page ─────
        const checkPage = (needed = 30) => {
            if (y + needed > doc.internal.pageSize.getHeight() - 20) {
                doc.addPage();
                y = 20;
            }
        };

        // ── Helper: section header ──────────────────
        const sectionHeader = (title, subtitle) => {
            checkPage(30);
            doc.setFillColor(...brandColor);
            doc.rect(0, y, pageWidth, 14, 'F');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(13);
            doc.setTextColor(255, 255, 255);
            doc.text(title, 14, y + 9);
            y += 14;
            if (subtitle) {
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(9);
                doc.setTextColor(...mutedText);
                doc.text(subtitle, 14, y + 6);
                y += 10;
            }
            y += 4;
        };

        // ══════════════════════════════════════════════
        // TITLE / COVER HEADER
        // ══════════════════════════════════════════════
        doc.setFillColor(...brandColor);
        doc.rect(0, 0, pageWidth, 48, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(22);
        doc.setTextColor(255, 255, 255);
        doc.text('TutorCoogs — Reports', 14, 22);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(254, 226, 226);
        doc.text(`Generated on ${dateStr} at ${timeStr}`, 14, 32);
        doc.text('Comprehensive Queue & Service Analytics', 14, 40);

        y = 58;

        // ── Quick summary line ──────────────────────
        if (queueStats) {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.setTextColor(...mutedText);
            doc.text(
                `Total Users: ${queueStats.totalUsers}  |  Total Services: ${queueStats.totalServices}  |  ` +
                `Total Served: ${queueStats.totalUsersServed}  |  Avg Wait: ${toWholeMinutes(queueStats.avgWaitTime)} min  |  ` +
                `Currently In Queue: ${queueStats.currentlyInQueue}`,
                14, y
            );
            y += 10;
        }

        // ══════════════════════════════════════════════
        // SECTION 1 — Users & Queue Participation History
        // ══════════════════════════════════════════════
        sectionHeader(
            'Section 1: Users & Queue Participation History',
            `${usersReport.length} users — complete queue participation breakdown`
        );

        if (usersReport.length > 0) {
            autoTable(doc, {
                startY: y,
                head: [['Name', 'Email', 'Role', 'Total Visits', 'Served', 'Cancelled', 'No-Shows', 'Avg Wait']],
                body: usersReport.map(u => [
                    u.name, u.email, u.role,
                    u.totalVisits, u.timesServed, u.timesCancelled, u.timesNoShow,
                    `${toWholeMinutes(u.avgWaitTime)} min`
                ]),
                styles: { fontSize: 8, cellPadding: 3 },
                headStyles: { fillColor: brandColor, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
                alternateRowStyles: { fillColor: [250, 250, 249] },
                margin: { left: 14, right: 14 },
                tableWidth: 'auto',
            });
            y = doc.lastAutoTable.finalY + 10;

            // Per-user detailed history
            usersReport.forEach(u => {
                if (!u.history || u.history.length === 0) return;
                checkPage(25);
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(9);
                doc.setTextColor(...darkText);
                doc.text(`Queue History — ${u.name} (${u.email})`, 14, y);
                y += 2;

                autoTable(doc, {
                    startY: y,
                    head: [['Date', 'Service', 'Joined At', 'Served At', 'Wait (min)', 'Outcome']],
                    body: u.history.map(h => [
                        h.date || '—',
                        h.serviceName || '—',
                        h.joinedAt || '—',
                        h.servedAt || '—',
                        h.waitTime != null ? h.waitTime : '—',
                        h.outcome || '—',
                    ]),
                    styles: { fontSize: 7, cellPadding: 2 },
                    headStyles: { fillColor: [68, 64, 60], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7 },
                    alternateRowStyles: { fillColor: [250, 250, 249] },
                    margin: { left: 18, right: 14 },
                    tableWidth: 'auto',
                });
                y = doc.lastAutoTable.finalY + 8;
            });
        } else {
            doc.setFont('helvetica', 'italic');
            doc.setFontSize(9);
            doc.setTextColor(...mutedText);
            doc.text('No user data available.', 14, y);
            y += 10;
        }

        // ══════════════════════════════════════════════
        // SECTION 2 — Service Details & Queue Activity
        // ══════════════════════════════════════════════
        sectionHeader(
            'Section 2: Service Details & Queue Activity',
            `${servicesReport.length} services — activity and performance per service`
        );

        if (servicesReport.length > 0) {
            autoTable(doc, {
                startY: y,
                head: [['Service', 'Category', 'Duration', 'Status', 'Served', 'Cancelled', 'No-Shows', 'Avg Wait', 'In Queue']],
                body: servicesReport.map(s => [
                    s.name, s.category, `${s.expectedDuration} min`,
                    s.isOpen ? 'Open' : 'Closed',
                    s.totalServed, s.totalCancelled, s.totalNoShows,
                    `${toWholeMinutes(s.avgWaitTime)} min`, s.currentInQueue
                ]),
                styles: { fontSize: 8, cellPadding: 3 },
                headStyles: { fillColor: brandColor, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
                alternateRowStyles: { fillColor: [250, 250, 249] },
                margin: { left: 14, right: 14 },
                tableWidth: 'auto',
            });
            y = doc.lastAutoTable.finalY + 10;
        } else {
            doc.setFont('helvetica', 'italic');
            doc.setFontSize(9);
            doc.setTextColor(...mutedText);
            doc.text('No service data available.', 14, y);
            y += 10;
        }

        // ══════════════════════════════════════════════
        // SECTION 3 — Queue Usage Statistics
        // ══════════════════════════════════════════════
        sectionHeader(
            'Section 3: Queue Usage Statistics',
            'Aggregate metrics and per-service performance breakdown'
        );

        if (queueStats) {
            // Key metrics summary box
            const noShowRate = queueStats.totalActivity > 0
                ? `${Math.round((queueStats.totalNoShows / queueStats.totalActivity) * 100)}%`
                : '0%';

            autoTable(doc, {
                startY: y,
                head: [['Metric', 'Value']],
                body: [
                    ['Total Users Served', String(queueStats.totalUsersServed)],
                    ['Total No-Shows', String(queueStats.totalNoShows)],
                    ['Total Cancelled', String(queueStats.totalCancelled)],
                    ['Total Activity (all outcomes)', String(queueStats.totalActivity)],
                    ['No-Show Rate', noShowRate],
                    ['Average Wait Time', `${toWholeMinutes(queueStats.avgWaitTime)} min`],
                    ['Currently In Queue', String(queueStats.currentlyInQueue)],
                    ['Total Registered Users', String(queueStats.totalUsers)],
                    ['Total Configured Services', String(queueStats.totalServices)],
                ],
                styles: { fontSize: 9, cellPadding: 4 },
                headStyles: { fillColor: brandColor, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
                alternateRowStyles: { fillColor: [250, 250, 249] },
                margin: { left: 14, right: 14 },
                columnStyles: { 0: { fontStyle: 'bold', cellWidth: 80 } },
                tableWidth: 'auto',
            });
            y = doc.lastAutoTable.finalY + 10;

            // Per-service breakdown
            if (queueStats.serviceBreakdown && queueStats.serviceBreakdown.length > 0) {
                checkPage(20);
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(10);
                doc.setTextColor(...darkText);
                doc.text('Per-Service Breakdown', 14, y);
                y += 4;

                autoTable(doc, {
                    startY: y,
                    head: [['Service', 'Served', 'No-Shows', 'Total Activity', 'Avg Wait', 'In Queue Now']],
                    body: queueStats.serviceBreakdown.map(sb => [
                        sb.serviceName, sb.totalServed, sb.totalNoShows,
                        sb.totalActivity, `${toWholeMinutes(sb.avgWaitTime)} min`, sb.currentInQueue
                    ]),
                    styles: { fontSize: 8, cellPadding: 3 },
                    headStyles: { fillColor: [68, 64, 60], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
                    alternateRowStyles: { fillColor: [250, 250, 249] },
                    margin: { left: 14, right: 14 },
                    tableWidth: 'auto',
                });
                y = doc.lastAutoTable.finalY + 10;
            }
        } else {
            doc.setFont('helvetica', 'italic');
            doc.setFontSize(9);
            doc.setTextColor(...mutedText);
            doc.text('No queue statistics available.', 14, y);
            y += 10;
        }

        // ── Footer on every page ────────────────────
        const totalPages = doc.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            const ph = doc.internal.pageSize.getHeight();
            doc.setDrawColor(200, 16, 46);
            doc.setLineWidth(0.5);
            doc.line(14, ph - 14, pageWidth - 14, ph - 14);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7);
            doc.setTextColor(...mutedText);
            doc.text('TutorCoogs — Confidential Report', 14, ph - 9);
            doc.text(`Page ${i} of ${totalPages}`, pageWidth - 14, ph - 9, { align: 'right' });
        }

        doc.save(`TutorCoogs_Report_${now.toISOString().split('T')[0]}.pdf`);
    };

    // ── Editorial table styles (tc-* design language) ─
    const thStyle = {
        textAlign: 'left',
        padding: '14px 24px',
        fontSize: 10.5,
        fontWeight: 700,
        color: '#78716c',
        textTransform: 'uppercase',
        letterSpacing: '0.12em',
        whiteSpace: 'nowrap',
        fontFamily: 'JetBrains Mono, monospace',
    };
    const tdStyle = {
        padding: '16px 24px',
        fontSize: 13,
        color: '#44403c',
        borderBottom: '1px dashed #ece9e2',
    };

    const tabs = [
        { id: 'users', label: 'Users & history' },
        { id: 'services', label: 'Service activity' },
        { id: 'stats', label: 'Queue statistics' },
    ];

    if (loading) {
        return (
            <div
                className="reports-page"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}
            >
                <div style={{ textAlign: 'center' }}>
                    <div
                        style={{
                            width: 44,
                            height: 44,
                            border: '3px solid #ece9e2',
                            borderTopColor: '#C8102E',
                            borderRadius: '50%',
                            animation: 'spin 0.8s linear infinite',
                            margin: '0 auto 16px',
                        }}
                    />
                    <span className="tc-mono" style={{ fontSize: 11, color: '#78716c', letterSpacing: '0.16em', fontWeight: 700 }}>
                        LOADING REPORTS…
                    </span>
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
            </div>
        );
    }

    return (
        <div className="reports-page">
            {/* ── Hero ────────────────────────────────────────────── */}
            <section className="tc-page-hero">
                <span className="tc-page-eyebrow">Admin Reports · Analytics Center</span>
                <h1 className="tc-page-headline" style={{ marginTop: 16 }}>
                    Reports &amp; analytics<span className="tc-dot">.</span>
                </h1>
                <p className="tc-page-sub">
                    Detailed reports on user activity, service performance, and queue
                    usage. Switch tabs below and export the active view as CSV or PDF.
                </p>
            </section>

            {/* ── Tab bar + export buttons ────────────────────────── */}
            <section style={{ marginBottom: 28 }}>
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: 12,
                    }}
                >
                    {/* Tab pill row */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {tabs.map((tab) => {
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    id={`report-tab-${tab.id}`}
                                    style={{
                                        padding: '9px 16px',
                                        borderRadius: 999,
                                        fontSize: 13,
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        background: isActive ? '#1c1917' : '#fff',
                                        color: isActive ? '#fff' : '#44403c',
                                        border: `1px solid ${isActive ? '#1c1917' : '#e7e5e4'}`,
                                        transition: 'all 0.15s',
                                        fontFamily: 'inherit',
                                    }}
                                >
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                    {/* Export buttons */}
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button
                            onClick={exportCSV}
                            id="export-csv-btn"
                            style={{
                                padding: '11px 18px',
                                borderRadius: 10,
                                border: '1px solid #e7e5e4',
                                background: '#fff',
                                cursor: 'pointer',
                                fontSize: 13,
                                fontWeight: 600,
                                color: '#1c1917',
                                transition: 'all 0.15s',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 8,
                                fontFamily: 'inherit',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = '#fafaf9'; e.currentTarget.style.borderColor = '#1c1917'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#e7e5e4'; }}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="7 10 12 15 17 10" />
                                <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                            Export CSV
                        </button>
                        <button
                            onClick={() => {
                                try {
                                    exportPDF();
                                } catch (error) {
                                    console.error('Failed to export PDF:', error);
                                    setExportError('PDF export failed. Please refresh and try again.');
                                }
                            }}
                            id="export-pdf-btn"
                            style={{
                                padding: '11px 18px',
                                borderRadius: 10,
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: 13,
                                fontWeight: 600,
                                color: '#fff',
                                background: '#C8102E',
                                boxShadow: '0 4px 14px -6px rgba(200, 16, 46, 0.45)',
                                transition: 'background 0.2s',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 8,
                                fontFamily: 'inherit',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = '#960C22')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = '#C8102E')}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="6 9 6 2 18 2 18 9" />
                                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                                <rect x="6" y="14" width="12" height="8" />
                            </svg>
                            Export PDF
                        </button>
                    </div>
                </div>
                {exportError && (
                    <p
                        className="tc-mono"
                        style={{
                            margin: '14px 0 0 0',
                            color: '#dc2626',
                            fontSize: 11,
                            fontWeight: 700,
                            letterSpacing: '0.12em',
                            textTransform: 'uppercase',
                        }}
                    >
                        {exportError}
                    </p>
                )}
            </section>

            {/* ── Users & History ─────────────────────────────────── */}
            {activeTab === 'users' && (
                <section className="animate-fade-in-up" style={{ marginBottom: 36 }}>
                    <div className="tc-section-head">
                        <div>
                            <span className="tc-page-eyebrow">{usersReport.length} users</span>
                            <h2 className="tc-section-title">Users &amp; queue participation</h2>
                            <p className="tc-section-sub">Complete queue history per user</p>
                        </div>
                    </div>
                    <div className="tc-card-flush">
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: '#FAF7F2', borderBottom: '1px solid #ece9e2' }}>
                                        <th style={thStyle}>User</th>
                                        <th style={thStyle}>Role</th>
                                        <th style={{ ...thStyle, textAlign: 'center' }}>Visits</th>
                                        <th style={{ ...thStyle, textAlign: 'center' }}>Served</th>
                                        <th style={{ ...thStyle, textAlign: 'center' }}>Cancelled</th>
                                        <th style={{ ...thStyle, textAlign: 'center' }}>No-shows</th>
                                        <th style={{ ...thStyle, textAlign: 'center' }}>Avg wait</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {usersReport.map((u) => (
                                        <tr
                                            key={u.id}
                                            style={{ transition: 'background 0.15s' }}
                                            onMouseEnter={(e) => (e.currentTarget.style.background = '#fafaf9')}
                                            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                                        >
                                            <td style={tdStyle}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                    <div
                                                        className="tc-mono"
                                                        style={{
                                                            width: 36,
                                                            height: 36,
                                                            borderRadius: 8,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            color: '#fff',
                                                            fontSize: 11,
                                                            fontWeight: 700,
                                                            background: u.role === 'admin' ? '#1c1917' : '#C8102E',
                                                            letterSpacing: 0,
                                                        }}
                                                    >
                                                        {u.name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                                                    </div>
                                                    <div>
                                                        <p
                                                            style={{
                                                                fontFamily: 'Outfit, sans-serif',
                                                                fontWeight: 600,
                                                                color: '#1c1917',
                                                                margin: 0,
                                                                fontSize: 13.5,
                                                                letterSpacing: '-0.005em',
                                                            }}
                                                        >
                                                            {u.name}
                                                        </p>
                                                        <p
                                                            className="tc-mono"
                                                            style={{ fontSize: 11, color: '#a8a29e', margin: '4px 0 0 0', letterSpacing: '0.04em' }}
                                                        >
                                                            {u.email}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={tdStyle}>
                                                <span className={`tc-pill ${u.role === 'admin' ? 'tc-pill-brand' : 'tc-pill-success'}`}>
                                                    {u.role.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="tc-mono" style={{ ...tdStyle, textAlign: 'center', fontWeight: 700, color: '#1c1917' }}>
                                                {u.totalVisits}
                                            </td>
                                            <td className="tc-mono" style={{ ...tdStyle, textAlign: 'center', color: '#16a34a', fontWeight: 600 }}>
                                                {u.timesServed}
                                            </td>
                                            <td className="tc-mono" style={{ ...tdStyle, textAlign: 'center', color: '#78716c', fontWeight: 600 }}>
                                                {u.timesCancelled}
                                            </td>
                                            <td className="tc-mono" style={{ ...tdStyle, textAlign: 'center', color: '#dc2626', fontWeight: 600 }}>
                                                {u.timesNoShow}
                                            </td>
                                            <td className="tc-mono" style={{ ...tdStyle, textAlign: 'center', color: '#1c1917', fontWeight: 600 }}>
                                                {toWholeMinutes(u.avgWaitTime)}m
                                            </td>
                                        </tr>
                                    ))}
                                    {usersReport.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={7}
                                                className="tc-mono"
                                                style={{ padding: 40, textAlign: 'center', color: '#a8a29e', fontSize: 11, letterSpacing: '0.16em', fontWeight: 700 }}
                                            >
                                                NO USER DATA
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>
            )}

            {/* ── Service Activity ───────────────────────────────── */}
            {activeTab === 'services' && (
                <section className="animate-fade-in-up" style={{ marginBottom: 36 }}>
                    <div className="tc-section-head">
                        <div>
                            <span className="tc-page-eyebrow">{servicesReport.length} services</span>
                            <h2 className="tc-section-title">Service details &amp; activity</h2>
                            <p className="tc-section-sub">Performance and queue activity per service</p>
                        </div>
                    </div>
                    <div className="tc-card-flush">
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: '#FAF7F2', borderBottom: '1px solid #ece9e2' }}>
                                        <th style={thStyle}>Service</th>
                                        <th style={thStyle}>Category</th>
                                        <th style={{ ...thStyle, textAlign: 'center' }}>Status</th>
                                        <th style={{ ...thStyle, textAlign: 'center' }}>Served</th>
                                        <th style={{ ...thStyle, textAlign: 'center' }}>Cancelled</th>
                                        <th style={{ ...thStyle, textAlign: 'center' }}>No-shows</th>
                                        <th style={{ ...thStyle, textAlign: 'center' }}>Avg wait</th>
                                        <th style={{ ...thStyle, textAlign: 'center' }}>In queue</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {servicesReport.map((s) => (
                                        <tr
                                            key={s.id}
                                            style={{ transition: 'background 0.15s' }}
                                            onMouseEnter={(e) => (e.currentTarget.style.background = '#fafaf9')}
                                            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                                        >
                                            <td style={tdStyle}>
                                                <p
                                                    style={{
                                                        fontFamily: 'Outfit, sans-serif',
                                                        fontWeight: 600,
                                                        color: '#1c1917',
                                                        margin: 0,
                                                        fontSize: 14,
                                                        letterSpacing: '-0.005em',
                                                    }}
                                                >
                                                    {s.name}
                                                </p>
                                                <p
                                                    style={{
                                                        fontSize: 12,
                                                        color: '#78716c',
                                                        margin: '4px 0 0 0',
                                                        maxWidth: 280,
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap',
                                                    }}
                                                >
                                                    {s.description}
                                                </p>
                                            </td>
                                            <td style={tdStyle}>{s.category}</td>
                                            <td style={{ ...tdStyle, textAlign: 'center' }}>
                                                <span className={`tc-pill ${s.isOpen ? 'tc-pill-success' : 'tc-pill-neutral'}`}>
                                                    {s.isOpen ? <><span className="tc-pulse-dot" /> OPEN</> : 'CLOSED'}
                                                </span>
                                            </td>
                                            <td className="tc-mono" style={{ ...tdStyle, textAlign: 'center', fontWeight: 700, color: '#16a34a' }}>
                                                {s.totalServed}
                                            </td>
                                            <td className="tc-mono" style={{ ...tdStyle, textAlign: 'center', fontWeight: 600, color: '#78716c' }}>
                                                {s.totalCancelled}
                                            </td>
                                            <td className="tc-mono" style={{ ...tdStyle, textAlign: 'center', fontWeight: 600, color: '#dc2626' }}>
                                                {s.totalNoShows}
                                            </td>
                                            <td className="tc-mono" style={{ ...tdStyle, textAlign: 'center', color: '#1c1917', fontWeight: 600 }}>
                                                {toWholeMinutes(s.avgWaitTime)}m
                                            </td>
                                            <td style={{ ...tdStyle, textAlign: 'center' }}>
                                                <span
                                                    className="tc-mono"
                                                    style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        minWidth: 36,
                                                        height: 30,
                                                        padding: '0 10px',
                                                        borderRadius: 8,
                                                        fontSize: 13,
                                                        fontWeight: 700,
                                                        background: s.currentInQueue > 0 ? '#fef2f2' : '#fafaf9',
                                                        color: s.currentInQueue > 0 ? '#C8102E' : '#a8a29e',
                                                        letterSpacing: '-0.01em',
                                                    }}
                                                >
                                                    {s.currentInQueue}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {servicesReport.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={8}
                                                className="tc-mono"
                                                style={{ padding: 40, textAlign: 'center', color: '#a8a29e', fontSize: 11, letterSpacing: '0.16em', fontWeight: 700 }}
                                            >
                                                NO SERVICE DATA
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>
            )}

            {/* ── Queue Statistics ───────────────────────────────── */}
            {activeTab === 'stats' && queueStats && (
                <section className="animate-fade-in-up" style={{ marginBottom: 36 }}>
                    <div className="tc-section-head">
                        <div>
                            <span className="tc-page-eyebrow">Aggregate Metrics</span>
                            <h2 className="tc-section-title">Queue statistics</h2>
                            <p className="tc-section-sub">Center-wide totals and per-service breakdown</p>
                        </div>
                    </div>

                    {/* Stat cards */}
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                            gap: 16,
                            marginBottom: 28,
                        }}
                    >
                        {[
                            {
                                label: 'Total Served',
                                value: queueStats.totalUsersServed,
                                meta: 'sessions completed across all services',
                            },
                            {
                                label: 'Avg Wait Time',
                                value: `${toWholeMinutes(queueStats.avgWaitTime)}m`,
                                meta: 'across all served sessions',
                            },
                            {
                                label: 'No-Show Rate',
                                value:
                                    queueStats.totalActivity > 0
                                        ? `${Math.round((queueStats.totalNoShows / queueStats.totalActivity) * 100)}%`
                                        : '0%',
                                meta: `${queueStats.totalNoShows} of ${queueStats.totalActivity} total`,
                            },
                            {
                                label: 'Currently In Queue',
                                value: queueStats.currentlyInQueue,
                                meta: `${queueStats.totalUsers} total users · ${queueStats.totalServices} services`,
                            },
                        ].map((stat) => (
                            <div key={stat.label} className="tc-stat">
                                <p className="tc-stat-eyebrow">
                                    <span>{stat.label}</span>
                                </p>
                                <p className="tc-stat-value">{stat.value}</p>
                                <p className="tc-stat-meta">{stat.meta}</p>
                            </div>
                        ))}
                    </div>

                    {/* Per-service breakdown table */}
                    <div className="tc-section-head">
                        <div>
                            <span className="tc-page-eyebrow">Per-Service Breakdown</span>
                            <h3 className="tc-section-title">Queue usage by service</h3>
                        </div>
                    </div>
                    <div className="tc-card-flush">
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: '#FAF7F2', borderBottom: '1px solid #ece9e2' }}>
                                        <th style={thStyle}>Service</th>
                                        <th style={{ ...thStyle, textAlign: 'center' }}>Served</th>
                                        <th style={{ ...thStyle, textAlign: 'center' }}>No-shows</th>
                                        <th style={{ ...thStyle, textAlign: 'center' }}>Total activity</th>
                                        <th style={{ ...thStyle, textAlign: 'center' }}>Avg wait</th>
                                        <th style={{ ...thStyle, textAlign: 'center' }}>In queue</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(queueStats.serviceBreakdown || []).map((sb) => (
                                        <tr
                                            key={sb.serviceId}
                                            style={{ transition: 'background 0.15s' }}
                                            onMouseEnter={(e) => (e.currentTarget.style.background = '#fafaf9')}
                                            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                                        >
                                            <td style={tdStyle}>
                                                <span
                                                    style={{
                                                        fontFamily: 'Outfit, sans-serif',
                                                        fontWeight: 600,
                                                        fontSize: 14,
                                                        color: '#1c1917',
                                                        letterSpacing: '-0.005em',
                                                    }}
                                                >
                                                    {sb.serviceName}
                                                </span>
                                            </td>
                                            <td className="tc-mono" style={{ ...tdStyle, textAlign: 'center', fontWeight: 700, color: '#16a34a' }}>
                                                {sb.totalServed}
                                            </td>
                                            <td className="tc-mono" style={{ ...tdStyle, textAlign: 'center', fontWeight: 600, color: '#dc2626' }}>
                                                {sb.totalNoShows}
                                            </td>
                                            <td className="tc-mono" style={{ ...tdStyle, textAlign: 'center', fontWeight: 700, color: '#1c1917' }}>
                                                {sb.totalActivity}
                                            </td>
                                            <td className="tc-mono" style={{ ...tdStyle, textAlign: 'center', color: '#1c1917', fontWeight: 600 }}>
                                                {toWholeMinutes(sb.avgWaitTime)}m
                                            </td>
                                            <td style={{ ...tdStyle, textAlign: 'center' }}>
                                                <span
                                                    className="tc-mono"
                                                    style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        minWidth: 36,
                                                        height: 30,
                                                        padding: '0 10px',
                                                        borderRadius: 8,
                                                        fontSize: 13,
                                                        fontWeight: 700,
                                                        background: sb.currentInQueue > 0 ? '#fef2f2' : '#fafaf9',
                                                        color: sb.currentInQueue > 0 ? '#C8102E' : '#a8a29e',
                                                        letterSpacing: '-0.01em',
                                                    }}
                                                >
                                                    {sb.currentInQueue}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
}
