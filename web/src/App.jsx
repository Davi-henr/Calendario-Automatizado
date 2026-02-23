import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import Auth from './components/Auth';
import {
    Sprout,
    PlusSquare,
    CloudSun,
    Calendar as CalendarIcon,
    PieChart,
    LogOut,
    Menu,
    X,
    User,
    Settings as SettingsIcon,
    Shield
} from 'lucide-react';

import Launch from './components/Launch';
import Climate from './components/Climate';
import SprayingCalendar from './components/SprayingCalendar';
import Dashboard from './components/Dashboard';
import Settings from './components/Settings';
import { settingsService } from './lib/services';

function App() {
    const [session, setSession] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState('launch'); // launch, climate, calendar, dashboard, settings
    const [isAdminMode, setIsAdminMode] = useState(false);
    const [logo, setLogo] = useState(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (session) loadSettings();
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (session) loadSettings();
        });

        return () => subscription.unsubscribe();
    }, []);

    const loadSettings = async () => {
        try {
            const settings = await settingsService.get();
            if (settings?.logo_url) {
                setLogo(settings.logo_url);
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    const handleLogoChange = async (newLogo) => {
        setLogo(newLogo);
        try {
            await settingsService.updateLogo(newLogo);
        } catch (error) {
            console.error('Error updating logo in DB:', error);
        }
    };

    if (!session) {
        return <Auth />;
    }

    const userMenuItems = [
        { id: 'launch', label: 'Lançamento', icon: <PlusSquare /> },
        { id: 'climate', label: 'Clima e Chuva', icon: <CloudSun /> },
        { id: 'calendar', label: 'Calendário', icon: <CalendarIcon /> },
        { id: 'dashboard', label: 'Dashboard', icon: <PieChart /> },
        { id: 'settings', label: 'Configurações', icon: <SettingsIcon /> },
    ];

    const adminMenuItems = [
        { id: 'dashboard', label: 'Dashboard Resumo', icon: <PieChart /> },
        { id: 'calendar', label: 'Calendário Pulverização', icon: <CalendarIcon /> },
    ];

    const menuItems = isAdminMode ? adminMenuItems : userMenuItems;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100%', backgroundColor: 'transparent', position: 'relative', overflow: 'hidden' }}>
            {/* Geometric Background Decorations */}
            <div className="geometric-bg">
                <div className="shape shape-1"></div>
                <div className="shape shape-2"></div>
            </div>

            {/* Header / Top Navigation */}
            <header style={{
                padding: isMobile ? '0.75rem 1rem' : '0 2rem',
                backgroundColor: 'rgba(255,255,255,0.9)',
                backdropFilter: 'blur(12px)',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                zIndex: 1000,
                minHeight: '80px',
                position: 'relative'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {logo ? (
                        <div style={{
                            width: '45px',
                            height: '45px',
                            backgroundColor: 'white',
                            borderRadius: '12px',
                            padding: '5px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: 'var(--shadow-sm)',
                            border: '1px solid var(--border)'
                        }}>
                            <img src={logo} alt="Logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                        </div>
                    ) : (
                        <div style={{
                            width: '45px',
                            height: '45px',
                            background: 'var(--primary-gradient)',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <Sprout size={24} color="#fff" />
                        </div>
                    )}
                    <div className="hide-mobile">
                        <h2 style={{ fontSize: '1.2rem', fontWeight: '900', color: 'var(--text)', letterSpacing: '-0.5px', fontFamily: 'var(--font-display)' }}>Calendário Automatizado</h2>
                        <p style={{ fontSize: '0.65rem', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '800', marginTop: '-2px' }}>por davi henrique</p>
                    </div>
                </div>

                {/* Desktop Menu */}
                {!isMobile && (
                    <nav style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        {menuItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setCurrentPage(item.id)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.6rem',
                                    padding: '0.75rem 1.2rem',
                                    borderRadius: '14px',
                                    border: 'none',
                                    backgroundColor: currentPage === item.id ? 'rgba(46, 125, 50, 0.08)' : 'transparent',
                                    color: currentPage === item.id ? 'var(--primary)' : 'var(--text-muted)',
                                    cursor: 'pointer',
                                    fontWeight: '700',
                                    fontSize: '0.9rem',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                                }}
                            >
                                {React.cloneElement(item.icon, { size: 18 })}
                                {item.label}
                            </button>
                        ))}

                        <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border)', margin: '0 1rem' }}></div>

                        <button
                            onClick={() => {
                                setIsAdminMode(!isAdminMode);
                                setCurrentPage(isAdminMode ? 'launch' : 'dashboard');
                            }}
                            className="btn"
                            style={{
                                background: isAdminMode ? 'var(--secondary-gradient)' : 'white',
                                border: '1px solid var(--border)',
                                color: isAdminMode ? 'white' : 'var(--text)',
                                padding: '0.6rem 1.2rem',
                                fontSize: '0.85rem'
                            }}
                        >
                            <Shield size={16} />
                            {isAdminMode ? 'Sair ADM' : 'Painel ADM'}
                        </button>
                    </nav>
                )}

                {/* Right Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.4rem', borderLeft: isMobile ? 'none' : '1px solid var(--border)', paddingLeft: isMobile ? 0 : '1rem' }}>
                        <div className="hide-mobile" style={{ textAlign: 'right' }}>
                            <p style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--text)' }}>{session.user.user_metadata?.username || 'Usuário'}</p>
                            <button onClick={handleLogout} style={{ background: 'none', border: 'none', padding: 0, fontSize: '0.7rem', color: '#ef4444', fontWeight: '700', cursor: 'pointer' }}>Sair</button>
                        </div>
                        <div style={{ width: '40px', height: '40px', backgroundColor: '#f1f5f9', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <User size={20} color="var(--primary)" />
                        </div>
                    </div>

                    {isMobile && (
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            style={{ background: 'var(--primary-gradient)', border: 'none', color: 'white', padding: '0.6rem', borderRadius: '12px', display: 'flex' }}
                        >
                            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    )}
                </div>

                {/* Mobile Dropdown Menu */}
                {isMobile && isSidebarOpen && (
                    <div style={{
                        position: 'absolute', top: '80px', left: 0, width: '100%',
                        backgroundColor: 'white', borderBottom: '1px solid var(--border)',
                        padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem',
                        boxShadow: '0 15px 30px rgba(0,0,0,0.1)', zIndex: 999
                    }}>
                        {menuItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => { setCurrentPage(item.id); setIsSidebarOpen(false); }}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '1rem',
                                    padding: '1rem', borderRadius: '12px', border: 'none',
                                    backgroundColor: currentPage === item.id ? 'rgba(46, 125, 50, 0.08)' : 'transparent',
                                    color: currentPage === item.id ? 'var(--primary)' : 'var(--text-muted)',
                                    fontWeight: '700', textAlign: 'left'
                                }}
                            >
                                {item.icon}
                                {item.label}
                            </button>
                        ))}
                        <button
                            onClick={() => {
                                setIsAdminMode(!isAdminMode);
                                setCurrentPage(isAdminMode ? 'launch' : 'dashboard');
                                setIsSidebarOpen(false);
                            }}
                            className="btn"
                            style={{ background: isAdminMode ? 'var(--secondary-gradient)' : '#f8fafc', width: '100%', marginTop: '0.5rem' }}
                        >
                            <Shield size={18} /> {isAdminMode ? 'Modo Usuário' : 'Painel ADM'}
                        </button>
                    </div>
                )}
            </header>

            {/* Main Content */}
            <main style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '1rem' : '2.5rem' }}>
                <div className="container" style={{ maxWidth: '1400px', padding: 0 }}>
                    <section>
                        {currentPage === 'launch' && <Launch />}
                        {currentPage === 'climate' && <Climate />}
                        {currentPage === 'calendar' && <SprayingCalendar />}
                        {currentPage === 'dashboard' && <Dashboard />}
                        {currentPage === 'settings' && <Settings logo={logo} onLogoChange={handleLogoChange} />}
                    </section>
                </div>
            </main>
        </div>
    );
}

export default App;
