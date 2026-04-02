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

    const [showOrdersSubmenu, setShowOrdersSubmenu] = useState(false);
    const [ordersSubview, setOrdersSubview] = useState('fazer');

    const tabs = [
        { id: 'estoque', label: 'Estoque', icon: <Package size={18} /> },
        { id: 'entradas', label: 'Entradas', icon: <PlusCircle size={18} /> },
        { id: 'ordem-saida', label: 'Ordem Saída', icon: <ArrowUpRight size={18} /> },
        { id: 'pedidos', label: 'Pedidos', icon: <ShoppingCart size={18} />, hasSubmenu: true, submenuKey: 'orders' },
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
        ],
        orders: [
            { id: 'fazer', label: 'Fazer Pedido', icon: <PlusCircle size={14} /> },
            { id: 'relatorio', label: 'Relatório', icon: <ClipboardList size={14} /> },
        ]
    };

    const handleTabClick = (tabId) => {
        if (tabId === 'cadastro') {
            setShowRegisterSubmenu(!showRegisterSubmenu);
            setShowHistorySubmenu(false);
            setShowOrdersSubmenu(false);
        } else if (tabId === 'saida') {
            setShowHistorySubmenu(!showHistorySubmenu);
            setShowRegisterSubmenu(false);
            setShowOrdersSubmenu(false);
        } else if (tabId === 'pedidos') {
            setShowOrdersSubmenu(!showOrdersSubmenu);
            setShowHistorySubmenu(false);
            setShowRegisterSubmenu(false);
        } else {
            setCurrentTab(tabId);
            setShowRegisterSubmenu(false);
            setShowHistorySubmenu(false);
            setShowOrdersSubmenu(false);
        }
        
        // Em telas pequenas, se clica em uma aba que tem submenu, mas a aba atual não é ela, muda pra ela primeiro
        if (isMobile && (tabId === 'cadastro' || tabId === 'saida' || tabId === 'pedidos') && currentTab !== tabId) {
            setCurrentTab(tabId);
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
        } else if (tabId === 'pedidos') {
            setOrdersSubview(subId);
            setShowOrdersSubmenu(false);
        }
    };

    const renderTabContent = () => {
        switch (currentTab) {
            case 'estoque': return <InventoryStock />;
            case 'entradas': return <InventoryInbound />;
            case 'ordem-saida': return <InventoryOutbound logo={logo} />;
            case 'pedidos': return <InventoryOrders subview={ordersSubview} onNavigate={(view) => setOrdersSubview(view)} />;
            case 'saida': return <InventoryHistory subview={historySubview} />;
            case 'cadastro': return <InventoryRegistration subview={registerSubview} />;
            default: return <InventoryStock />;
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg)', position: 'relative' }}>
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
                <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '2.5px', background: 'linear-gradient(90deg, #2e7d32, #fb8c00)', opacity: 0.8 }} />

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
                    
                    {!isMobile ? (
                        <div style={{ borderLeft: '1.5px solid rgba(0,0,0,0.1)', paddingLeft: '1.25rem' }}>
                            <h1 style={{ fontSize: '1rem', fontWeight: '900', color: 'var(--text)', letterSpacing: '-0.3px', margin: 0, lineHeight: 1 }}>
                                Estoque <span style={{ color: 'var(--primary)' }}>Defensivos</span>
                            </h1>
                            <p style={{ fontSize: '0.65rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '2px' }}>Gestão de Insumos</p>
                        </div>
                    ) : (
                        <div style={{ paddingLeft: '0.5rem' }}>
                            <h1 style={{ fontSize: '1.1rem', fontWeight: '900', color: 'var(--text)', margin: 0, lineHeight: 1 }}>
                                Estoque
                            </h1>
                        </div>
                    )}
                </div>

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

                                    {/* Submenus Desktop */}
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
                                    {tab.id === 'pedidos' && showOrdersSubmenu && (
                                        <div style={{ position: 'absolute', top: '110%', left: 0, backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', border: '1px solid rgba(0,0,0,0.05)', padding: '0.5rem', minWidth: '180px', zIndex: 100, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                            {submenus.orders.map(sub => (
                                                <button key={sub.id} onClick={() => handleSubmenuClick('pedidos', sub.id)} style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.8rem 1rem', borderRadius: '8px', border: 'none', background: ordersSubview === sub.id && currentTab === 'pedidos' ? 'rgba(245, 158, 11, 0.1)' : 'transparent', color: ordersSubview === sub.id && currentTab === 'pedidos' ? '#f59e0b' : 'var(--text)', cursor: 'pointer', textAlign: 'left', fontWeight: '700', fontSize: '0.85rem' }}>
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
                        {isMobile && (
                            <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#ef4444', display: 'flex', alignItems: 'center' }}>
                                <ArrowLeft size={24} />
                            </button>
                        )}
                        <div style={{ width: '42px', height: '42px', backgroundColor: '#f1f5f9', border: '1.5px solid var(--border)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 8px rgba(0,0,0,0.04)' }}>
                            <User size={20} color="var(--primary)" />
                        </div>
                    </div>
                </div>
            </header>

            <main style={{ padding: isMobile ? '1rem 0.5rem 80px 0.5rem' : '2.5rem', flex: 1, position: 'relative', zIndex: 1, overflowY: 'auto' }}>
                <div className="container" style={{ padding: 0 }}>
                    {renderTabContent()}
                </div>
            </main>

            {/* BOTTOM NAVIGATION MOBILE */}
            {isMobile && (
                <div style={{
                    position: 'fixed',
                    bottom: 0,
                    left: 0,
                    width: '100%',
                    backgroundColor: 'white',
                    borderTop: '1px solid rgba(0,0,0,0.1)',
                    boxShadow: '0 -4px 20px rgba(0,0,0,0.05)',
                    zIndex: 2000,
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    
                    {/* Area dos Submenus (Abre em cima da barra inferior) */}
                    {(showRegisterSubmenu || showHistorySubmenu || showOrdersSubmenu) && (
                        <div style={{
                            display: 'flex',
                            gap: '0.5rem',
                            padding: '0.5rem 1rem',
                            backgroundColor: '#f8fafc',
                            borderBottom: '1px solid #e2e8f0',
                            overflowX: 'auto',
                            WebkitOverflowScrolling: 'touch',
                            scrollbarWidth: 'none' // Esconde scroll no Firefox
                        }}>
                            {showRegisterSubmenu && submenus.register.map(sub => (
                                <button key={sub.id} onClick={() => handleSubmenuClick('cadastro', sub.id)} style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '20px', border: '1px solid', background: registerSubview === sub.id ? 'var(--primary)' : 'white', borderColor: registerSubview === sub.id ? 'var(--primary)' : '#cbd5e1', color: registerSubview === sub.id ? 'white' : 'var(--text)', fontWeight: '700', fontSize: '0.8rem' }}>
                                    {React.cloneElement(sub.icon, { size: 16 })} {sub.label}
                                </button>
                            ))}
                            {showHistorySubmenu && submenus.history.map(sub => (
                                <button key={sub.id} onClick={() => handleSubmenuClick('saida', sub.id)} style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '20px', border: '1px solid', background: historySubview === sub.id ? 'var(--primary)' : 'white', borderColor: historySubview === sub.id ? 'var(--primary)' : '#cbd5e1', color: historySubview === sub.id ? 'white' : 'var(--text)', fontWeight: '700', fontSize: '0.8rem' }}>
                                    {React.cloneElement(sub.icon, { size: 16 })} {sub.label}
                                </button>
                            ))}
                            {showOrdersSubmenu && submenus.orders.map(sub => (
                                <button key={sub.id} onClick={() => handleSubmenuClick('pedidos', sub.id)} style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '20px', border: '1px solid', background: ordersSubview === sub.id ? '#f59e0b' : 'white', borderColor: ordersSubview === sub.id ? '#f59e0b' : '#cbd5e1', color: ordersSubview === sub.id ? 'white' : 'var(--text)', fontWeight: '700', fontSize: '0.8rem' }}>
                                    {React.cloneElement(sub.icon, { size: 16 })} {sub.label}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Barra de Icones Principais */}
                    <nav style={{
                        display: 'flex',
                        overflowX: 'auto',
                        padding: '0.5rem',
                        gap: '0.5rem',
                        WebkitOverflowScrolling: 'touch',
                        scrollbarWidth: 'none'
                    }}>
                        {tabs.map((tab) => {
                            const isActive = currentTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => handleTabClick(tab.id)}
                                    style={{
                                        minWidth: '70px',
                                        flex: '1 0 auto',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        padding: '0.5rem 0',
                                        borderRadius: '12px',
                                        border: 'none',
                                        backgroundColor: isActive ? 'rgba(46, 125, 50, 0.1)' : 'transparent',
                                        color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                                        cursor: 'pointer',
                                    }}
                                >
                                    <div style={{ position: 'relative', marginBottom: '4px' }}>
                                        {React.cloneElement(tab.icon, { size: 24, strokeWidth: isActive ? 2.5 : 2 })}
                                        {tab.hasSubmenu && (
                                            <div style={{ position: 'absolute', top: '-2px', right: '-8px', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: isActive ? 'var(--primary)' : '#cbd5e1' }} />
                                        )}
                                    </div>
                                    <span style={{ fontSize: '0.65rem', fontWeight: isActive ? '900' : '700', whiteSpace: 'nowrap' }}>
                                        {tab.label.split(' ')[0]} {/* Pega a primeira palavra para caber no mobile */}
                                    </span>
                                </button>
                            );
                        })}
                    </nav>
                </div>
            )}
        </div>
    );
}
