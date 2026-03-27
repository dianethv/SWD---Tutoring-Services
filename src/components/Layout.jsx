import { useState, useEffect } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { Outlet } from 'react-router-dom';

export default function Layout() {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

    useEffect(() => {
        const handleResize = () => {
            const desktop = window.innerWidth >= 1024;
            setIsDesktop(desktop);
            if (!desktop) setSidebarOpen(false);
        };
        window.addEventListener('resize', handleResize);
        handleResize();
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div style={{ minHeight: '100vh', background: '#f5f5f4', fontFamily: "'Inter', system-ui, sans-serif" }}>
            <Navbar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            {/* Backdrop for mobile sidebar */}
            {sidebarOpen && !isDesktop && (
                <div
                    className="fixed inset-0 z-30"
                    style={{ background: 'rgba(0,0,0,0.25)' }}
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <main style={{
                paddingTop: '88px',
                paddingBottom: '40px',
                minHeight: '100vh',
                marginLeft: isDesktop && sidebarOpen ? '256px' : '0',
                transition: 'margin-left 0.25s ease',
            }}>
                <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 28px' }}>
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
