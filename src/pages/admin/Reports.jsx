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

// ── CSV cell escaping ────────────────────────────────
// RFC 4180: wrap a cell in double quotes if it contains a comma, quote, or
// newline; double-up any embedded quotes. Numbers/booleans/null pass through
// as plain strings so spreadsheets read them as numbers.
function csvCell(value) {
    if (value === null || value === undefined) return '';
    const s = String(value);
    if (s === '') return '';
    if (/[",\r\n]/.test(s)) {
        return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
}

function csvRow(cells) {
    return cells.map(csvCell).join(',') + '\r\n';
}

// Builds a CSV blob string with a UTF-8 BOM so Excel opens it with the
// correct encoding (otherwise accented characters render as garbage).
function buildCsv(lines) {
    return '\ufeff' + lines.join('');
}

function downloadCsv(content, filename) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
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
    // Produces a structured, Excel-friendly CSV with a metadata header,
    // labelled sections separated by blank rows, totals where it helps the
    // reader, and proper RFC 4180 escaping. UTF-8 BOM is prepended so Excel
    // opens it without character corruption.
    const exportCSV = () => {
        const now = new Date();
        const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        const isoStamp = now.toISOString().split('T')[0];
        const blank = '\r\n';

        // Standard metadata header — appears at the top of every CSV export.
        const metadataHeader = (subtitle) => [
            csvRow(['TutorCoogs — Tutoring Center Analytics']),
            csvRow([subtitle]),
            csvRow([`Generated: ${dateStr} at ${timeStr}`]),
            blank,
        ];

        const fmtOutcome = (o) => {
            if (!o) return '—';
            // 'no-show' → 'No Show', 'served' → 'Served'
            return o.replace(/\b\w/g, (c) => c.toUpperCase()).replace(/-/g, ' ');
        };

        let lines = [];
        let filename = '';

        if (activeTab === 'users') {
            // ── USERS REPORT ──────────────────────────
            lines.push(...metadataHeader('Users & Queue Participation Report'));
            lines.push(csvRow([`Total Users: ${usersReport.length}`]));
            lines.push(blank);

            // Section 1: Summary table — one row per user
            lines.push(csvRow(['== USER SUMMARY ==']));
            lines.push(csvRow([
                'Name', 'Email', 'Role',
                'Total Visits', 'Served', 'Cancelled', 'No-Shows',
                'Avg Wait (min)',
            ]));
            usersReport.forEach((u) => {
                lines.push(csvRow([
                    u.name, u.email, u.role,
                    u.totalVisits, u.timesServed, u.timesCancelled, u.timesNoShow,
                    toWholeMinutes(u.avgWaitTime),
                ]));
            });
            // Totals
            const totals = usersReport.reduce((acc, u) => ({
                visits: acc.visits + (u.totalVisits || 0),
                served: acc.served + (u.timesServed || 0),
                cancelled: acc.cancelled + (u.timesCancelled || 0),
                noShow: acc.noShow + (u.timesNoShow || 0),
            }), { visits: 0, served: 0, cancelled: 0, noShow: 0 });
            lines.push(csvRow([
                'TOTAL', '', '',
                totals.visits, totals.served, totals.cancelled, totals.noShow,
                '',
            ]));
            lines.push(blank);

            // Section 2: Detailed per-user history (one row per visit)
            const usersWithHistory = usersReport.filter((u) => u.history && u.history.length > 0);
            if (usersWithHistory.length > 0) {
                lines.push(csvRow(['== DETAILED QUEUE HISTORY ==']));
                lines.push(csvRow([
                    'User', 'Email', 'Date', 'Service',
                    'Joined At', 'Served At', 'Wait (min)', 'Outcome',
                ]));
                usersWithHistory.forEach((u) => {
                    u.history.forEach((h) => {
                        lines.push(csvRow([
                            u.name, u.email,
                            h.date || '—',
                            h.serviceName || '—',
                            h.joinedAt || '—',
                            h.servedAt || '—',
                            h.waitTime != null ? h.waitTime : '',
                            fmtOutcome(h.outcome),
                        ]));
                    });
                });
                lines.push(blank);
            }

            lines.push(csvRow(['== END OF REPORT ==']));
            filename = `TutorCoogs_Users_Report_${isoStamp}.csv`;

        } else if (activeTab === 'services') {
            // ── SERVICES REPORT ───────────────────────
            lines.push(...metadataHeader('Services & Queue Activity Report'));
            lines.push(csvRow([`Total Services: ${servicesReport.length}`]));
            const openCount = servicesReport.filter((s) => s.isOpen).length;
            lines.push(csvRow([`Currently Open: ${openCount}`]));
            lines.push(blank);

            // Section 1: Service activity table
            lines.push(csvRow(['== SERVICE ACTIVITY ==']));
            lines.push(csvRow([
                'Service', 'Category', 'Status', 'Duration (min)',
                'Total Served', 'Cancelled', 'No-Shows', 'Total Activity',
                'Avg Wait (min)', 'Currently In Queue',
            ]));
            servicesReport.forEach((s) => {
                lines.push(csvRow([
                    s.name, s.category,
                    s.isOpen ? 'Open' : 'Closed',
                    s.expectedDuration,
                    s.totalServed, s.totalCancelled, s.totalNoShows,
                    (s.totalServed || 0) + (s.totalCancelled || 0) + (s.totalNoShows || 0),
                    toWholeMinutes(s.avgWaitTime),
                    s.currentInQueue,
                ]));
            });
            // Totals
            const sTotals = servicesReport.reduce((acc, s) => ({
                served: acc.served + (s.totalServed || 0),
                cancelled: acc.cancelled + (s.totalCancelled || 0),
                noShow: acc.noShow + (s.totalNoShows || 0),
                inQueue: acc.inQueue + (s.currentInQueue || 0),
            }), { served: 0, cancelled: 0, noShow: 0, inQueue: 0 });
            lines.push(csvRow([
                'TOTAL', '', '', '',
                sTotals.served, sTotals.cancelled, sTotals.noShow,
                sTotals.served + sTotals.cancelled + sTotals.noShow,
                '', sTotals.inQueue,
            ]));
            lines.push(blank);

            // Section 2: Service descriptions (long text on its own table)
            lines.push(csvRow(['== SERVICE DESCRIPTIONS ==']));
            lines.push(csvRow(['Service', 'Category', 'Description']));
            servicesReport.forEach((s) => {
                lines.push(csvRow([s.name, s.category, s.description || '—']));
            });
            lines.push(blank);

            lines.push(csvRow(['== END OF REPORT ==']));
            filename = `TutorCoogs_Services_Report_${isoStamp}.csv`;

        } else {
            // ── QUEUE STATS REPORT ────────────────────
            lines.push(...metadataHeader('Queue Usage Statistics Report'));

            if (!queueStats) {
                lines.push(csvRow(['No queue statistics available.']));
                lines.push(blank);
                lines.push(csvRow(['== END OF REPORT ==']));
                filename = `TutorCoogs_QueueStats_Report_${isoStamp}.csv`;
            } else {
                const noShowRate = queueStats.totalActivity > 0
                    ? `${Math.round((queueStats.totalNoShows / queueStats.totalActivity) * 100)}%`
                    : '0%';

                // Section 1: Aggregate metrics
                lines.push(csvRow(['== AGGREGATE METRICS ==']));
                lines.push(csvRow(['Metric', 'Value']));
                lines.push(csvRow(['Total Users Served', queueStats.totalUsersServed]));
                lines.push(csvRow(['Total No-Shows', queueStats.totalNoShows]));
                lines.push(csvRow(['Total Cancelled', queueStats.totalCancelled]));
                lines.push(csvRow(['Total Activity (all outcomes)', queueStats.totalActivity]));
                lines.push(csvRow(['No-Show Rate', noShowRate]));
                lines.push(csvRow(['Average Wait Time (min)', toWholeMinutes(queueStats.avgWaitTime)]));
                lines.push(csvRow(['Currently In Queue', queueStats.currentlyInQueue]));
                lines.push(csvRow(['Total Registered Users', queueStats.totalUsers]));
                lines.push(csvRow(['Total Configured Services', queueStats.totalServices]));
                lines.push(blank);

                // Section 2: Per-service breakdown
                if (queueStats.serviceBreakdown && queueStats.serviceBreakdown.length > 0) {
                    lines.push(csvRow(['== PER-SERVICE BREAKDOWN ==']));
                    lines.push(csvRow([
                        'Service', 'Total Served', 'No-Shows', 'Total Activity',
                        'Avg Wait (min)', 'Currently In Queue',
                    ]));
                    queueStats.serviceBreakdown.forEach((sb) => {
                        lines.push(csvRow([
                            sb.serviceName,
                            sb.totalServed,
                            sb.totalNoShows,
                            sb.totalActivity,
                            toWholeMinutes(sb.avgWaitTime),
                            sb.currentInQueue,
                        ]));
                    });
                    lines.push(blank);
                }

                // Section 3: Daily volume (when present)
                if (queueStats.dailyVolume && queueStats.dailyVolume.length > 0) {
                    lines.push(csvRow(['== DAILY SESSION VOLUME ==']));
                    lines.push(csvRow(['Date', 'Sessions']));
                    queueStats.dailyVolume.forEach((d) => {
                        lines.push(csvRow([d.date, d.count]));
                    });
                    lines.push(blank);
                }

                lines.push(csvRow(['== END OF REPORT ==']));
                filename = `TutorCoogs_QueueStats_Report_${isoStamp}.csv`;
            }
        }

        downloadCsv(buildCsv(lines), filename);
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

    // ── Styles ──────────────────────────────────────
    const card = { background: '#fff', border: '1px solid #e7e5e4', borderRadius: '16px', padding: '24px' };
    const heading = { fontFamily: "'Outfit', sans-serif", fontSize: '18px', fontWeight: 700, color: '#1c1917', margin: 0 };
    const subtext = { fontSize: '13px', color: '#78716c', marginTop: '4px' };
    const thStyle = { textAlign: 'left', padding: '14px 20px', fontSize: '11px', fontWeight: 600, color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' };
    const tdStyle = { padding: '14px 20px', fontSize: '13px', color: '#44403c', borderBottom: '1px solid #f5f5f4' };

    const tabs = [
        { id: 'users', label: 'Users & History', icon: '👥' },
        { id: 'services', label: 'Service Activity', icon: '📋' },
        { id: 'stats', label: 'Queue Statistics', icon: '📊' },
    ];

    if (loading) {
        return (
            <div className="reports-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ width: '48px', height: '48px', border: '4px solid #e7e5e4', borderTopColor: '#C8102E', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
                    <p style={{ color: '#78716c', fontSize: '14px' }}>Loading reports…</p>
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
            </div>
        );
    }

    return (
        <div className="reports-page">
            {/* ── Hero Banner ─────────────────────────────── */}
            <div style={{
                borderRadius: '20px', padding: '48px 40px',
                background: 'linear-gradient(135deg, #C8102E 0%, #A60F26 50%, #7A0B1C 100%)',
                position: 'relative', overflow: 'hidden', marginBottom: '32px',
            }}>
                <div className="glow-orb" style={{ position: 'absolute', top: '-80px', right: '-80px', width: '260px', height: '260px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
                <div className="glow-orb" style={{ position: 'absolute', bottom: '-60px', left: '30%', width: '180px', height: '180px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)', animationDelay: '2s' }} />
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div className="fade-up" style={{ marginBottom: '14px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#fecdd3' }}>
                            Admin Reports • Analytics Center
                        </span>
                    </div>
                    <h1 className="fade-up" style={{ fontFamily: "'Outfit', sans-serif", fontSize: '32px', fontWeight: 700, color: '#fff', margin: '0 0 12px 0', lineHeight: 1.25 }}>
                        Reports & Analytics 📊
                    </h1>
                    <p className="fade-up-delay" style={{ fontSize: '15px', color: '#fee2e2', lineHeight: 1.6, margin: 0, maxWidth: '600px' }}>
                        Generate detailed reports on user activity, service performance, and queue usage statistics. Export data as CSV or PDF.
                    </p>
                </div>
                <div style={{ position: 'absolute', top: '20px', right: '28px', fontSize: '48px', opacity: 0.15, userSelect: 'none' }}>📈</div>
            </div>

            {/* ── Tab Bar + Export ─────────────────────────── */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', gap: '6px', background: '#fff', borderRadius: '14px', padding: '4px', border: '1px solid #e7e5e4' }}>
                    {tabs.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)} id={`report-tab-${tab.id}`}
                            style={{
                                padding: '10px 20px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                                fontSize: '13px', fontWeight: 600, transition: 'all 0.2s',
                                background: activeTab === tab.id ? '#C8102E' : 'transparent',
                                color: activeTab === tab.id ? '#fff' : '#57534e',
                            }}>
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={exportCSV} id="export-csv-btn" style={{
                        padding: '10px 20px', borderRadius: '10px', border: '1px solid #e7e5e4', background: '#fff',
                        cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: '#44403c', transition: 'all 0.2s',
                    }}>📥 Export CSV</button>
                    <button onClick={() => {
                        try {
                            exportPDF();
                        } catch (error) {
                            console.error('Failed to export PDF:', error);
                            setExportError('PDF export failed. Please refresh and try again.');
                        }
                    }} id="export-pdf-btn" style={{
                        padding: '10px 20px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                        fontSize: '13px', fontWeight: 600, color: '#fff', transition: 'all 0.2s',
                        background: 'linear-gradient(135deg, #C8102E, #E8384F)',
                    }}>🖨️ Export PDF</button>
                </div>
            </div>

            {/* ── Tab Content ─────────────────────────────── */}
            {exportError && (
                <p style={{ margin: '-12px 0 20px 0', color: '#dc2626', fontSize: '13px', fontWeight: 600 }}>
                    {exportError}
                </p>
            )}
            {activeTab === 'users' && (
                <div className="animate-fade-in-up">
                    <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e7e5e4' }}>
                            <h2 style={heading}>Users & Queue Participation History</h2>
                            <p style={subtext}>{usersReport.length} users found • Showing complete queue history per user</p>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: '#fafaf9', borderBottom: '1px solid #e7e5e4' }}>
                                        <th style={thStyle}>User</th>
                                        <th style={thStyle}>Role</th>
                                        <th style={{ ...thStyle, textAlign: 'center' }}>Total Visits</th>
                                        <th style={{ ...thStyle, textAlign: 'center' }}>Served</th>
                                        <th style={{ ...thStyle, textAlign: 'center' }}>Cancelled</th>
                                        <th style={{ ...thStyle, textAlign: 'center' }}>No-Shows</th>
                                        <th style={{ ...thStyle, textAlign: 'center' }}>Avg Wait</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {usersReport.map(u => (
                                        <tr key={u.id} style={{ transition: 'background 0.15s' }}
                                            onMouseEnter={e => e.currentTarget.style.background = '#fafaf9'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                            <td style={tdStyle}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <div style={{
                                                        width: '36px', height: '36px', borderRadius: '10px', display: 'flex',
                                                        alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '12px', fontWeight: 700,
                                                        background: u.role === 'admin' ? 'linear-gradient(135deg, #960C22, #C8102E)' : 'linear-gradient(135deg, #C8102E, #E8384F)',
                                                    }}>
                                                        {u.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                                    </div>
                                                    <div>
                                                        <p style={{ fontWeight: 600, color: '#1c1917', margin: 0, fontSize: '13px' }}>{u.name}</p>
                                                        <p style={{ fontSize: '12px', color: '#78716c', margin: '2px 0 0 0' }}>{u.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={tdStyle}>
                                                <span style={{ padding: '3px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, textTransform: 'capitalize', background: u.role === 'admin' ? '#fef2f2' : '#f0fdf4', color: u.role === 'admin' ? '#C8102E' : '#16a34a' }}>
                                                    {u.role}
                                                </span>
                                            </td>
                                            <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 700 }}>{u.totalVisits}</td>
                                            <td style={{ ...tdStyle, textAlign: 'center' }}>
                                                <span style={{ color: '#16a34a', fontWeight: 600 }}>{u.timesServed}</span>
                                            </td>
                                            <td style={{ ...tdStyle, textAlign: 'center' }}>
                                                <span style={{ color: '#d97706', fontWeight: 600 }}>{u.timesCancelled}</span>
                                            </td>
                                            <td style={{ ...tdStyle, textAlign: 'center' }}>
                                                <span style={{ color: '#dc2626', fontWeight: 600 }}>{u.timesNoShow}</span>
                                            </td>
                                            <td style={{ ...tdStyle, textAlign: 'center' }}>{toWholeMinutes(u.avgWaitTime)}m</td>
                                        </tr>
                                    ))}
                                    {usersReport.length === 0 && (
                                        <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#a8a29e', fontSize: '14px' }}>No user data available</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'services' && (
                <div className="animate-fade-in-up">
                    <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e7e5e4' }}>
                            <h2 style={heading}>Service Details & Queue Activity</h2>
                            <p style={subtext}>{servicesReport.length} services • Activity and performance per service</p>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: '#fafaf9', borderBottom: '1px solid #e7e5e4' }}>
                                        <th style={thStyle}>Service</th>
                                        <th style={thStyle}>Category</th>
                                        <th style={{ ...thStyle, textAlign: 'center' }}>Status</th>
                                        <th style={{ ...thStyle, textAlign: 'center' }}>Total Served</th>
                                        <th style={{ ...thStyle, textAlign: 'center' }}>Cancelled</th>
                                        <th style={{ ...thStyle, textAlign: 'center' }}>No-Shows</th>
                                        <th style={{ ...thStyle, textAlign: 'center' }}>Avg Wait</th>
                                        <th style={{ ...thStyle, textAlign: 'center' }}>In Queue</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {servicesReport.map(s => (
                                        <tr key={s.id} style={{ transition: 'background 0.15s' }}
                                            onMouseEnter={e => e.currentTarget.style.background = '#fafaf9'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                            <td style={tdStyle}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafaf9', fontSize: '20px' }}>{s.icon}</div>
                                                    <div>
                                                        <p style={{ fontWeight: 600, color: '#1c1917', margin: 0, fontSize: '13px' }}>{s.name}</p>
                                                        <p style={{ fontSize: '11px', color: '#78716c', margin: '2px 0 0 0', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.description}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={tdStyle}>{s.category}</td>
                                            <td style={{ ...tdStyle, textAlign: 'center' }}>
                                                <span style={{
                                                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                                                    padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                                                    background: s.isOpen ? '#f0fdf4' : '#f5f5f4',
                                                    color: s.isOpen ? '#16a34a' : '#78716c',
                                                }}>
                                                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: s.isOpen ? '#16a34a' : '#a8a29e' }} />
                                                    {s.isOpen ? 'Open' : 'Closed'}
                                                </span>
                                            </td>
                                            <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 700, color: '#16a34a' }}>{s.totalServed}</td>
                                            <td style={{ ...tdStyle, textAlign: 'center', color: '#d97706', fontWeight: 600 }}>{s.totalCancelled}</td>
                                            <td style={{ ...tdStyle, textAlign: 'center', color: '#dc2626', fontWeight: 600 }}>{s.totalNoShows}</td>
                                            <td style={{ ...tdStyle, textAlign: 'center' }}>{toWholeMinutes(s.avgWaitTime)}m</td>
                                            <td style={{ ...tdStyle, textAlign: 'center' }}>
                                                <span style={{
                                                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                                    width: '32px', height: '32px', borderRadius: '8px', fontSize: '13px', fontWeight: 700,
                                                    background: s.currentInQueue > 0 ? '#fef2f2' : '#fafaf9',
                                                    color: s.currentInQueue > 0 ? '#C8102E' : '#a8a29e',
                                                }}>{s.currentInQueue}</span>
                                            </td>
                                        </tr>
                                    ))}
                                    {servicesReport.length === 0 && (
                                        <tr><td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#a8a29e', fontSize: '14px' }}>No service data available</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'stats' && queueStats && (
                <div className="animate-fade-in-up">
                    {/* Summary Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                        {[
                            { label: 'Total Served', value: queueStats.totalUsersServed, bg: '#d1fae5', ic: '#059669', icon: <>
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></> },
                            { label: 'Avg Wait Time', value: `${toWholeMinutes(queueStats.avgWaitTime)}m`, bg: '#fef3c7', ic: '#d97706', icon: <>
                                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></> },
                            { label: 'No-Show Rate', value: queueStats.totalActivity > 0 ? `${Math.round((queueStats.totalNoShows / queueStats.totalActivity) * 100)}%` : '0%', bg: '#fce7f3', ic: '#db2777', icon: <>
                                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></> },
                            { label: 'Currently in Queue', value: queueStats.currentlyInQueue, bg: '#dbeafe', ic: '#3b82f6', icon: <>
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></> },
                        ].map(stat => (
                            <div key={stat.label} style={card}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={stat.ic} strokeWidth="2">{stat.icon}</svg>
                                </div>
                                <p style={{ fontSize: '28px', fontWeight: 700, color: '#1c1917', margin: '0 0 2px 0', lineHeight: 1 }}>{stat.value}</p>
                                <p style={{ fontSize: '13px', color: '#78716c', margin: 0 }}>{stat.label}</p>
                            </div>
                        ))}
                    </div>

                    {/* Service Breakdown Table */}
                    <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e7e5e4' }}>
                            <h2 style={heading}>Queue Usage by Service</h2>
                            <p style={subtext}>Breakdown of queue activity per service</p>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: '#fafaf9', borderBottom: '1px solid #e7e5e4' }}>
                                        <th style={thStyle}>Service</th>
                                        <th style={{ ...thStyle, textAlign: 'center' }}>Served</th>
                                        <th style={{ ...thStyle, textAlign: 'center' }}>No-Shows</th>
                                        <th style={{ ...thStyle, textAlign: 'center' }}>Total Activity</th>
                                        <th style={{ ...thStyle, textAlign: 'center' }}>Avg Wait</th>
                                        <th style={{ ...thStyle, textAlign: 'center' }}>In Queue Now</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(queueStats.serviceBreakdown || []).map(sb => (
                                        <tr key={sb.serviceId} style={{ transition: 'background 0.15s' }}
                                            onMouseEnter={e => e.currentTarget.style.background = '#fafaf9'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                            <td style={tdStyle}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <span style={{ fontSize: '18px' }}>{sb.icon}</span>
                                                    <span style={{ fontWeight: 600, fontSize: '13px', color: '#1c1917' }}>{sb.serviceName}</span>
                                                </div>
                                            </td>
                                            <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 700, color: '#16a34a' }}>{sb.totalServed}</td>
                                            <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 600, color: '#dc2626' }}>{sb.totalNoShows}</td>
                                            <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 700 }}>{sb.totalActivity}</td>
                                            <td style={{ ...tdStyle, textAlign: 'center' }}>{toWholeMinutes(sb.avgWaitTime)}m</td>
                                            <td style={{ ...tdStyle, textAlign: 'center' }}>
                                                <span style={{
                                                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                                    width: '32px', height: '32px', borderRadius: '8px', fontSize: '13px', fontWeight: 700,
                                                    background: sb.currentInQueue > 0 ? '#fef2f2' : '#fafaf9',
                                                    color: sb.currentInQueue > 0 ? '#C8102E' : '#a8a29e',
                                                }}>{sb.currentInQueue}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
