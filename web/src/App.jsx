import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import emailjs from '@emailjs/browser';
import { differenceInDays, parseISO } from 'date-fns';
import {
    Sprout,
    PlusSquare,
    CloudSun,
    Calendar as CalendarIcon,
    PieChart,
    Menu,
    X,
    User,
    Settings as SettingsIcon,
    ClipboardList,
} from 'lucide-react';

import Launch from './components/Launch';
import Climate from './components/Climate';
import SprayingCalendar from './components/SprayingCalendar';
import Dashboard from './components/Dashboard';
import Hub from './components/Hub';
import Inventory from './components/Inventory';
import Prescriptions from './components/Prescriptions';
import Settings from './components/Settings';
import { settingsService } from './lib/services';

// --- FUNÇÃO VIGIA GLOBAL DE LEPROSE ---
const verificarAlertasGerais = async () => {
    try {
        const { data: registrosLeprose, error } = await supabase
            .from('registros')
            .select('*')
            .eq('receita', 'Leprose')
            .eq('situacao', 'Finalizada')
            .eq('ativo', true)
            .eq('alerta_leprose_enviado', false); 

        if (error || !registrosLeprose || registrosLeprose.length === 0) return;

        const hoje = new Date();
        const grupoA = ['obny', 'okay'];
        const grupoB = ['envidor', 'oberon'];
        const acaricidasConhecidos = [...grupoA, ...grupoB];

        let disparosFeitos = 0;

        for (const reg of registrosLeprose) {
            const diasPassados = differenceInDays(hoje, parseISO(reg.data_inicial));

            if (diasPassados >= 180) {
                
                const obsFormatada = (reg.observacao || '').toLowerCase();
                let produtoUsadoNome = reg.observacao || 'Não identificado';
                let produtoRecomendadoStr = 'um acaricida de grupo químico diferente';
                
                const acaricidaEncontrado = acaricidasConhecidos.find(ac => obsFormatada.includes(ac));
                
                if (acaricidaEncontrado) {
                    produtoUsadoNome = acaricidaEncontrado.toUpperCase();
                    if (grupoA.includes(acaricidaEncontrado)) {
                        produtoRecomendadoStr = 'ENVIDOR ou OBERON';
                    } else if (grupoB.includes(acaricidaEncontrado)) {
                        produtoRecomendadoStr = 'OBNY ou OKAY';
                    }
                }

                const templateParams = {
                    quadra: reg.quadra,
                    produto_antigo: produtoUsadoNome,
                    produto_recomendado: produtoRecomendadoStr,
                    email: "davi.fvl@markbemcitrus.com.br" 
                };

                try {
                    await emailjs.send('service_tybtcoc', 'template_rismosj', templateParams, '7_OdWq1mfyUmAIhEc');
                    
                    await supabase
                        .from('registros')
                        .update({ alerta_leprose_enviado: true })
                        .eq('id', reg.id);
                        
                    console.log(`✅ Alerta global enviado: Quadra ${reg.quadra}`);
                    disparosFeitos++;
                } catch (err) {
                    console.error("❌ Erro no disparo do alerta global:", err);
                }
            }
        }
        
        if (disparosFeitos > 0) {
            console.log(`SUCESSO! O sistema global acabou de disparar ${disparosFeitos} e-mail(s) de Leprose.`);
        }
        
    } catch (err) {
        console.error("❌ Erro na verificação global:", err);
    }
};

function App() {
    const [session, setSession] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState('launch');
    const [currentRoute, setCurrentRoute] = useState('hub'); // hub | main | admin | inventory
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
        });

        loadSettings();

        // O vigia roda uma vez quando o App inicializa (quando o usuário entra no sistema)
        verificarAlertasGerais();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    const loadSettings = async () => {
        try {
            const settings = await settingsService.get();
            if (settings?.logo_url) setLogo(settings.logo_url);
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setCurrentRoute('hub');
    };

    const handleLogoChange = async (newLogo) => {
        setLogo(newLogo);
        try {
            await settingsService.updateLogo(newLogo);
        } catch (error) {
            console.error('Error updating logo in DB:', error);
        }
    };

    // Hub is PUBLIC — always show without requiring a session
    if (currentRoute === 'hub') {
        return <Hub logo={logo} onNavigate={(route) => {
            if (route === 'admin') setCurrentPage('dashboard');
            else if (route === 'main') setCurrentPage('launch');
            setCurrentRoute(route);
        }} />;
    }

    // Inventory
    if (currentRoute === 'inventory') {
        return <Inventory logo={logo} onBack={async () => {
            await supabase.auth.signOut();
            setCurrentRoute('hub');
        }} />;
    }

    // If somehow no session on main/admin, go back to hub
    if (!session) {
        setCurrentRoute('hub');
        return null;
    }

    // Menus per route
    const adminMenuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: <PieChart /> },
        { id: 'prescriptions', label: 'Receitas', icon: <ClipboardList /> },
        { id: 'calendar', label: 'Calendário', icon: <CalendarIcon /> },
    ];

    const userMenuItems = [
        { id: 'launch', label: 'Lançamento', icon: <PlusSquare /> },
        { id: 'climate', label: 'Clima e Chuva', icon: <CloudSun /> },
        { id: 'calendar', label: 'Calendário', icon: <CalendarIcon /> },
        { id: 'dashboard', label: 'Dashboard', icon: <PieChart /> },
        { id: 'settings', label: 'Configurações', icon: <SettingsIcon /> },
    ];

    const menuItems = currentRoute === 'admin' ? adminMenuItems : userMenuItems;

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg)', position: 'relative' }}>
            {/* Main Header */}
            <header style={{
                height: isMobile ? '72px' : '88px',
                backgroundColor: 'rgba(255,255,255,0.85)',
                backdropFilter: 'blur(12px)',
                borderBottom: '1px solid rgba(0,0,0,0.06)',
                padding: isMobile ? '0 1rem' : '0 2.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                position: 'sticky',
                top: 0,
                zIndex: 1000
            }}>
                {/* Accent Gradient Line at bottom of header */}
                <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '2.5px', background: 'linear-gradient(90deg, #2e7d32, #fb8c00)', opacity: 0.8 }} />
                {/* Left: Logo & Brand */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    {logo ? (
                        <img src={logo} alt="Logo" style={{ height: isMobile ? '36px' : '48px', width: 'auto', borderRadius: '10px' }} />
                    ) : (
                        <div style={{
                            width: isMobile ? '36px' : '42px',
                            height: isMobile ? '36px' : '42px',
                            backgroundColor: 'var(--primary)',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 8px 16px rgba(46, 125, 50, 0.15)'
                        }}>
                            <Sprout size={isMobile ? 18 : 22} color="white" />
                        </div>
                    )}
                    {!isMobile && (
                        <div style={{ borderLeft: '1.5px solid rgba(0,0,0,0.1)', paddingLeft: '1.25rem' }}>
                            <h1 style={{ fontSize: '1rem', fontWeight: '900', color: 'var(--text)', letterSpacing: '-0.3px', margin: 0, lineHeight: 1 }}>
                                Calendário <span style={{ color: 'var(--primary)' }}>Automatizado</span>
                            </h1>
                            <p style={{ fontSize: '0.65rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '2px' }}>Gestão Agrícola</p>
                        </div>
                    )}
                </div>
                {/* Desktop Nav */}
                {!isMobile && (
                    <nav style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#f1f5f9', padding: '0.4rem', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.05)' }}>
                        {menuItems.map((item, index) => (
                            <React.Fragment key={item.id}>
                                {index > 0 && <div style={{ width: '1px', height: '16px', background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.1), transparent)', margin: '0 2px' }} />}
                                <button
                                    onClick={() => setCurrentPage(item.id)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '0.6rem',
                                        padding: '0.6rem 1.1rem', borderRadius: '12px', border: 'none',
                                        backgroundColor: 'transparent',
                                        color: currentPage === item.id ? 'var(--text)' : 'var(--text-muted)',
                                        fontWeight: '900', fontSize: '0.85rem', cursor: 'pointer',
                                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                        position: 'relative'
                                    }}
                                >
                                    {currentPage === item.id && (
                                        <div style={{ position: 'absolute', bottom: '-4px', left: '1rem', right: '1rem', height: '3px', background: 'var(--accent-gradient)', borderRadius: '99px' }} />
                                    )}
                                    <div style={{ opacity: currentPage === item.id ? 1 : 0.7 }}>
                                        {React.cloneElement(item.icon, { size: 18 })}
                                    </div>
                                    {item.label}
                                </button>
                            </React.Fragment>
                        ))}
                    </nav>
                )}

                {/* Right: User + Mobile Toggle */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: isMobile ? 'none' : '1.5px solid rgba(0,0,0,0.1)', paddingLeft: isMobile ? 0 : '1.5rem' }}>
                        {!isMobile && (
                            <div style={{ textAlign: 'right' }}>
                                <p style={{ fontSize: '0.85rem', fontWeight: '900', color: 'var(--text)', marginBottom: '-2px' }}>{session?.user?.user_metadata?.username || 'Usuário'}</p>
                                <button onClick={handleLogout} className="btn btn-mini" style={{ color: '#ef4444', height: '24px' }} title="Sair">
                                    <div className="btn-inner" style={{ padding: '0 0.5rem', fontSize: '0.65rem' }}>Sair</div>
                                </button>
                            </div>
                        )}
                        <div style={{ width: '42px', height: '42px', backgroundColor: '#f1f5f9', border: '1.5px solid var(--border)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 8px rgba(0,0,0,0.04)' }}>
                            <User size={20} color="var(--primary)" />
                        </div>
                    </div>
                    {isMobile && (
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="btn btn-primary btn-mini"
                            style={{ width: '42px', height: '42px' }}
                        >
                            <div className="btn-inner">
                                {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
                            </div>
                        </button>
                    )}
                </div>

                {/* Mobile Dropdown */}
                {isMobile && isSidebarOpen && (
                    <div style={{
                        position: 'absolute', top: '72px', left: 0, width: '100%',
                        backgroundColor: 'white', borderBottom: '1px solid var(--border)',
                        padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.65rem',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.1)', zIndex: 999
                    }}>
                        {menuItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => { setCurrentPage(item.id); setIsSidebarOpen(false); }}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '1.2rem',
                                    padding: '1.1rem', borderRadius: '16px', border: 'none',
                                    backgroundColor: currentPage === item.id ? '#f1f5f9' : 'transparent',
                                    color: currentPage === item.id ? 'var(--primary)' : 'var(--text-muted)',
                                    fontWeight: '800', textAlign: 'left', fontSize: '1rem'
                                }}
                            >
                                {item.icon}
                                {item.label}
                            </button>
                        ))}
                        <button
                            onClick={handleLogout}
                            className="btn btn-outline"
                            style={{ width: '100%', marginTop: '0.5rem' }}
                        >
                            <div className="btn-inner">
                                Menu Principal
                            </div>
                        </button>
                    </div>
                )}
            </header>

            {/* Pages */}
            <main style={{ padding: isMobile ? '1rem' : '2.5rem', flex: 1, position: 'relative', zIndex: 1 }}>
                <div className="container" style={{ padding: 0 }}>
                    {currentPage === 'launch' && <Launch logo={logo} />}
                    {currentPage === 'prescriptions' && <Prescriptions logo={logo} />}
                    {currentPage === 'dashboard' && <Dashboard logo={logo} />}
                    {currentPage === 'calendar' && <SprayingCalendar logo={logo} />}
                    {currentPage === 'climate' && <Climate logo={logo} />}
                    {currentPage === 'settings' && <Settings logo={logo} onLogoChange={handleLogoChange} />}
                </div>
            </main>
        </div>
    );
}

export default App;
