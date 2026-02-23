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

function App() {
    const [session, setSession] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState('launch'); // launch, climate, calendar, dashboard, settings
    const [isAdminMode, setIsAdminMode] = useState(false);
    const [logo, setLogo] = useState(localStorage.getItem('agrologo'));

    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    const handleLogoChange = (newLogo) => {
        setLogo(newLogo);
        if (newLogo) {
            localStorage.setItem('agrologo', newLogo);
        } else {
            localStorage.removeItem('agrologo');
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
        <div style={{ display: 'flex', height: '100vh', width: '100%', backgroundColor: 'transparent', position: 'relative', overflow: 'hidden' }}>
            {/* Geometric Background Decorations */}
            <div className="geometric-bg">
                <div className="shape shape-1"></div>
                <div className="shape shape-2"></div>
            </div>

            {/* Mobile Overlay */}
            {isMobile && isSidebarOpen && (
                <div
                    onClick={() => setIsSidebarOpen(false)}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.4)',
                        backdropFilter: 'blur(4px)',
                        zIndex: 999
                    }}
                />
            )}

            {/* Sidebar */}
            <aside style={{
                width: isMobile ? '280px' : '320px',
                background: 'white',
                color: 'var(--text)',
                display: 'flex',
                flexDirection: 'column',
                position: isMobile ? 'fixed' : 'relative',
                left: isMobile && !isSidebarOpen ? '-280px' : '0',
                zIndex: 1000,
                height: '100%',
                boxShadow: '15px 0 40px rgba(0,0,0,0.02)',
                borderRight: '1px solid var(--border)',
                transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}>
                <div style={{ padding: isMobile ? '1.5rem 1rem' : '2.5rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.2rem', textAlign: 'center' }}>
                    {logo ? (
                        <div style={{
                            width: isMobile ? '60px' : '90px',
                            height: isMobile ? '60px' : '90px',
                            backgroundColor: 'white',
                            borderRadius: '20px',
                            padding: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '0.5rem',
                            boxShadow: '0 10px 20px rgba(0,0,0,0.05)',
                            border: '1px solid var(--border)'
                        }}>
                            <img src={logo} alt="Logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                        </div>
                    ) : (
                        <div style={{
                            width: isMobile ? '60px' : '90px',
                            height: isMobile ? '60px' : '90px',
                            background: 'var(--primary-gradient)',
                            borderRadius: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 10px 20px rgba(46, 125, 50, 0.2)'
                        }}>
                            <Sprout size={isMobile ? 32 : 48} color="#fff" />
                        </div>
                    )}
                    <div>
                        <h2 style={{ fontSize: isMobile ? '1.1rem' : '1.5rem', fontWeight: '900', letterSpacing: '-0.8px', fontFamily: 'var(--font-display)', color: 'var(--text)' }}>Calendário Automatizado</h2>
                        <p style={{ fontSize: '0.7rem', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '700', marginTop: '4px' }}>por davi henrique</p>
                    </div>
                </div>

                <div style={{ padding: '0 1.5rem 1.5rem' }}>
                    <button
                        onClick={() => {
                            setIsAdminMode(!isAdminMode);
                            setCurrentPage(isAdminMode ? 'launch' : 'dashboard');
                        }}
                        style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.75rem',
                            padding: '0.8rem',
                            borderRadius: '16px',
                            border: '1px solid var(--border)',
                            background: isAdminMode ? 'var(--primary-gradient)' : 'white',
                            color: isAdminMode ? 'white' : 'var(--text)',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            fontWeight: '800',
                            transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                            boxShadow: isAdminMode ? '0 8px 15px rgba(46, 125, 50, 0.2)' : 'none'
                        }}
                    >
                        <Shield size={18} />
                        {isAdminMode ? 'Voltar para Usuário' : 'Painel de Gerenciamento'}
                    </button>
                </div>

                <nav style={{ flex: 1, padding: '0 1.2rem', overflowY: 'auto' }}>
                    {menuItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => {
                                setCurrentPage(item.id);
                                if (isMobile) setIsSidebarOpen(false);
                            }}
                            style={{
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1.2rem',
                                padding: '1.1rem 1.5rem',
                                borderRadius: '18px',
                                border: 'none',
                                backgroundColor: currentPage === item.id ? 'rgba(46, 125, 50, 0.08)' : 'transparent',
                                color: currentPage === item.id ? 'var(--primary)' : 'var(--text-muted)',
                                cursor: 'pointer',
                                textAlign: 'left',
                                marginBottom: '0.8rem',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                transform: currentPage === item.id ? 'scale(1.02)' : 'none'
                            }}
                        >
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '36px',
                                height: '36px',
                                borderRadius: '12px',
                                background: currentPage === item.id ? 'var(--primary-gradient)' : 'rgba(0,0,0,0.02)',
                                color: currentPage === item.id ? 'white' : 'inherit',
                                transition: 'all 0.3s'
                            }}>
                                {React.cloneElement(item.icon, { size: 18 })}
                            </div>
                            <span style={{ fontWeight: currentPage === item.id ? '800' : '600', fontSize: '0.95rem' }}>{item.label}</span>
                        </button>
                    ))}
                </nav>

                <div style={{ padding: isMobile ? '1.2rem' : '2rem', borderTop: '1px solid var(--border)', background: 'rgba(248, 250, 252, 0.5)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                        <div style={{
                            width: '44px',
                            height: '44px',
                            backgroundColor: 'white',
                            borderRadius: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: 'var(--shadow-sm)',
                            border: '1px solid var(--border)'
                        }}>
                            <User size={22} color="var(--primary)" />
                        </div>
                        <div style={{ overflow: 'hidden' }}>
                            <p style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--text)', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                                {session.user.user_metadata?.username || session.user.email?.split('@')[0]}
                            </p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }}></div>
                                <p style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: '700' }}>Ativo agora</p>
                            </div>
                        </div>
                    </div>
                    <button onClick={handleLogout} className="btn" style={{
                        width: '100%',
                        backgroundColor: 'white',
                        color: '#ef4444',
                        justifyContent: 'center',
                        border: '1px solid #fee2e2',
                        borderRadius: '14px',
                        padding: '0.8rem',
                        fontWeight: '700'
                    }}>
                        <LogOut size={18} /> Sair do sistema
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', width: '100%' }}>
                <header style={{
                    padding: isMobile ? '1rem 1.5rem' : '1.5rem 3rem',
                    backgroundColor: 'rgba(255,255,255,0.8)',
                    backdropFilter: 'blur(10px)',
                    borderBottom: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    zIndex: 10
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        {isMobile && (
                            <button onClick={() => setIsSidebarOpen(true)} style={{ background: 'none', border: 'none', color: 'var(--primary)', padding: '0.5rem', display: 'flex', alignItems: 'center' }}>
                                <Menu size={24} />
                            </button>
                        )}
                        <h1 style={{ fontSize: isMobile ? '1.1rem' : '1.4rem', fontWeight: '900', color: 'var(--text)', letterSpacing: '-0.5px' }}>
                            {isAdminMode ? 'Painel ADM' : menuItems.find(i => i.id === currentPage)?.label}
                        </h1>
                    </div>
                    {logo && (
                        <div style={{ height: isMobile ? '30px' : '40px' }}>
                            <img src={logo} alt="Fazenda" style={{ height: '100%', width: 'auto', borderRadius: '4px' }} />
                        </div>
                    )}
                </header>

                <section style={{ flex: 1, padding: isMobile ? '1rem' : '2rem', overflowY: 'auto' }}>
                    <div className="container" style={{ padding: 0 }}>
                        {currentPage === 'launch' && <Launch />}
                        {currentPage === 'climate' && <Climate />}
                        {currentPage === 'calendar' && <SprayingCalendar />}
                        {currentPage === 'dashboard' && <Dashboard />}
                        {currentPage === 'settings' && <Settings logo={logo} onLogoChange={handleLogoChange} />}
                    </div>
                </section>
            </main>
        </div>
    );
}

export default App;
