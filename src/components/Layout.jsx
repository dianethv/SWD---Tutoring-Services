import { useState, useEffect } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { Outlet } from 'react-router-dom';

export default function Layout() {
    const [viewportWidth, setViewportWidth] = useState(window.innerWidth);
    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);
    const isDesktop = viewportWidth >= 1024;
    const isMobile = viewportWidth < 640;

    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            setViewportWidth(width);
            setSidebarOpen(width >= 1024);
        };
        window.addEventListener('resize', handleResize);
        handleResize();
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (!isDesktop && sidebarOpen) {
            document.body.style.overflow = 'hidden';
            return () => {
                document.body.style.overflow = '';
            };
        }

        document.body.style.overflow = '';
        return undefined;
    }, [isDesktop, sidebarOpen]);

    return (
        <div className="app-shell" style={{ minHeight: '100vh', background: '#f5f5f4', fontFamily: "'Inter', system-ui, sans-serif" }}>
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

            <main className="app-main" style={{
                paddingTop: isMobile ? '76px' : '88px',
                paddingBottom: isMobile ? '24px' : '40px',
                minHeight: '100vh',
                marginLeft: isDesktop && sidebarOpen ? '256px' : '0',
                transition: 'margin-left 0.25s ease',
            }}>
                <div className="app-content" style={{ maxWidth: '1100px', margin: '0 auto', padding: isMobile ? '0 16px' : '0 28px' }}>
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
