import React, { useState, useEffect } from 'react';
import {
    Package,
    PlusCircle,
    ArrowUpRight,
    ShoppingCart,
    History,
    Settings,
    ChevronDown,
    Beaker,
    Map,
    Activity,
    ClipboardList,
    ArrowLeft,
    Sprout,
    User,
} from 'lucide-react';
import InventoryStock from './InventoryStock';
import InventoryOrders from './InventoryOrders';
import InventoryInbound from './InventoryInbound';
import InventoryOutbound from './InventoryOutbound';
import InventoryHistory from './InventoryHistory';
import InventoryRegistration from './InventoryRegistration';

export default function Inventory({ logo, onBack }) {
    const [currentTab, setCurrentTab] = useState('estoque');
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Submenu states
    const [showRegisterSubmenu, setShowRegisterSubmenu] = useState(false);
    const [registerSubview, setRegisterSubview] = useState('insumos');

    const [showHistorySubmenu, setShowHistorySubmenu] = useState(false);
    const [historySubview, setHistorySubview] = useState('geral');

    const tabs = [
        { id: 'estoque', label: 'Estoque', icon: <Package size={18} /> },
        { id: 'entradas', label: 'Entradas', icon: <PlusCircle size={18} /> },
        { id: 'ordem-saida', label: 'Ordem Saída', icon: <ArrowUpRight size={18} /> },
        { id: 'pedidos', label: 'Pedidos', icon: <ShoppingCart size={18} /> },
        { id: 'saida', label: 'Histórico Saídas', icon: <History size={18} />, hasSubmenu: true, submenuKey: 'history' },
        { id: 'cadastro', label: 'Cadastro', icon: <Settings size={18} />, hasSubmenu: true, submenuKey: 'register' },
    ];

    const submenus = {
        register: [
            { id: 'insumos', label: 'Insumos', icon: <Beaker size={14} /> },
            { id: 'quadras', label: 'Quadras', icon: <Map size={14} /> },
            { id: 'atividade', label: 'Atividades', icon: <Activity size={14} /> },
        ],
        history: [
            { id: 'geral', label: 'Histórico Geral', icon: <ClipboardList size={14} /> },
            { id: 'receita', label: 'Histórico por Receita', icon: <Beaker size={14} /> },
        ]
    };

    const handleTabClick = (tabId) => {
        if (tabId === 'cadastro') {
            setShowRegisterSubmenu(!showRegisterSubmenu);
            setShowHistorySubmenu(false);
        } else if (tabId === 'saida') {
            setShowHistorySubmenu(!showHistorySubmenu);
            setShowRegisterSubmenu(false);
        } else {
            setCurrentTab(tabId);
            setShowRegisterSubmenu(false);
            setShowHistorySubmenu(false);
        }
    };

    const handleSubmenuClick = (tabId, subId) => {
        setCurrentTab(tabId);
        if (tabId === 'cadastro') {
            setRegisterSubview(subId);
            setShowRegisterSubmenu(false);
        } else if (tabId === 'saida') {
            setHistorySubview(subId);
            setShowHistorySubmenu(false);
        }
    };

    const renderTabContent = () => {
        switch (currentTab) {
            case 'estoque': return <InventoryStock />;
            case 'entradas': return <InventoryInbound />;
            case 'ordem-saida': return <InventoryOutbound logo={logo} />;
            case 'pedidos': return <InventoryOrders />;
            case 'saida': return <InventoryHistory subview={historySubview} />;
            case 'cadastro': return <InventoryRegistration subview={registerSubview} />;
            default: return <InventoryStock />;
        }
    };

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
                {/* Accent Gradient Line */}
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
                                Estoque <span style={{ color: 'var(--primary)' }}>Defensivos</span>
                            </h1>
                            <p style={{ fontSize: '0.65rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '2px' }}>Gestão de Insumos</p>
                        </div>
                    )}
                </div>

                {/* Center Nav */}
                {!isMobile && (
                    <nav style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#f1f5f9', padding: '0.4rem', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.05)' }}>
                        {tabs.map((tab, index) => (
                            <React.Fragment key={tab.id}>
                                {index > 0 && <div style={{ width: '1px', height: '16px', background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.1), transparent)', margin: '0 2px' }} />}
                                <div style={{ position: 'relative' }}>
                                    <button
                                        onClick={() => handleTabClick(tab.id)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '0.6rem',
                                            padding: '0.6rem 1.1rem', borderRadius: '12px', border: 'none',
                                            backgroundColor: 'transparent',
                                            color: currentTab === tab.id ? 'var(--text)' : 'var(--text-muted)',
                                            fontWeight: '900', fontSize: '0.85rem', cursor: 'pointer',
                                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                            position: 'relative'
                                        }}
                                    >
                                        {currentTab === tab.id && (
                                            <div style={{ position: 'absolute', bottom: '-4px', left: '1rem', right: '1rem', height: '3px', background: 'var(--accent-gradient)', borderRadius: '99px' }} />
                                        )}
                                        <div style={{ opacity: currentTab === tab.id ? 1 : 0.7 }}>
                                            {tab.icon}
                                        </div>
                                        {tab.label}
                                        {tab.hasSubmenu && <ChevronDown size={14} style={{ opacity: 0.5 }} />}
                                    </button>

                                    {/* Submenus */}
                                    {tab.id === 'cadastro' && showRegisterSubmenu && (
                                        <div style={{ position: 'absolute', top: '110%', left: 0, backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', border: '1px solid rgba(0,0,0,0.05)', padding: '0.5rem', minWidth: '180px', zIndex: 100, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                            {submenus.register.map(sub => (
                                                <button key={sub.id} onClick={() => handleSubmenuClick('cadastro', sub.id)} style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.8rem 1rem', borderRadius: '8px', border: 'none', background: registerSubview === sub.id && currentTab === 'cadastro' ? 'rgba(239, 68, 68, 0.1)' : 'transparent', color: registerSubview === sub.id && currentTab === 'cadastro' ? 'var(--primary)' : 'var(--text)', cursor: 'pointer', textAlign: 'left', fontWeight: '700', fontSize: '0.85rem' }}>
                                                    {sub.icon} {sub.label}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    {tab.id === 'saida' && showHistorySubmenu && (
                                        <div style={{ position: 'absolute', top: '110%', left: 0, backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', border: '1px solid rgba(0,0,0,0.05)', padding: '0.5rem', minWidth: '200px', zIndex: 100, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                            {submenus.history.map(sub => (
                                                <button key={sub.id} onClick={() => handleSubmenuClick('saida', sub.id)} style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.8rem 1rem', borderRadius: '8px', border: 'none', background: historySubview === sub.id && currentTab === 'saida' ? 'rgba(239, 68, 68, 0.1)' : 'transparent', color: historySubview === sub.id && currentTab === 'saida' ? 'var(--primary)' : 'var(--text)', cursor: 'pointer', textAlign: 'left', fontWeight: '700', fontSize: '0.85rem' }}>
                                                    {sub.icon} {sub.label}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </React.Fragment>
                        ))}
                    </nav>
                )}

                {/* Right: Voltar Button */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: isMobile ? 'none' : '1.5px solid rgba(0,0,0,0.1)', paddingLeft: isMobile ? 0 : '1.5rem' }}>
                        {!isMobile && (
                            <div style={{ textAlign: 'right' }}>
                                <p style={{ fontSize: '0.85rem', fontWeight: '900', color: 'var(--text)', marginBottom: '-2px' }}>Gestão</p>
                                <button onClick={onBack} className="btn btn-mini" style={{ color: '#ef4444', height: '24px' }} title="Voltar">
                                    <div className="btn-inner" style={{ padding: '0 0.5rem', fontSize: '0.65rem' }}>Voltar</div>
                                </button>
                            </div>
                        )}
                        <div style={{ width: '42px', height: '42px', backgroundColor: '#f1f5f9', border: '1.5px solid var(--border)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 8px rgba(0,0,0,0.04)' }}>
                            <User size={20} color="var(--primary)" />
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main style={{ padding: isMobile ? '1rem' : '2.5rem', flex: 1, position: 'relative', zIndex: 1 }}>
                <div className="container" style={{ padding: 0 }}>
                    {renderTabContent()}
                </div>
            </main>
        </div>
    );
}
