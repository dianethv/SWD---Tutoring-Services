import { useState } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { Outlet } from 'react-router-dom';

export default function Layout() {
    const [sidebarOpen, setSidebarOpen] = useState(true);

    return (
        <div style={{ minHeight: '100vh', background: '#f5f5f4', fontFamily: "'Inter', system-ui, sans-serif" }}>
            <Navbar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            {/* Backdrop for mobile sidebar */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-30 lg:hidden"
                    style={{ background: 'rgba(0,0,0,0.25)' }}
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <main style={{ paddingTop: '88px', paddingBottom: '40px', minHeight: '100vh' }}>
                <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 28px' }}>
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
