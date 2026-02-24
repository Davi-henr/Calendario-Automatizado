import React, { useState } from 'react';
import { Sprout, BarChart2, ShieldCheck, Package, Lock, Shield, X, Eye, EyeOff } from 'lucide-react';

// Role definitions
const ROLES = {
    jean: 'admin',
    celso: 'calendar',
    djair: 'calendar',
    davi: 'inventory',
};

export default function Hub({ session, onNavigate, onLogout }) {
    const [showInventoryModal, setShowInventoryModal] = useState(false);
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [showPw, setShowPw] = useState(false);

    const username = (session?.user?.user_metadata?.username || '').toLowerCase();
    const role = ROLES[username] || 'all'; // 'admin' | 'calendar' | 'inventory' | 'all'

    const canAccess = (area) => {
        if (role === 'all') return true;
        return role === area;
    };

    const handleCardClick = (area) => {
        if (!canAccess(area)) return;
        if (area === 'inventory') {
            // davi goes directly (already authorized by role)
            onNavigate('inventory');
        } else if (area === 'admin') {
            onNavigate('admin');
        } else {
            onNavigate('main');
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 40%, #bbf7d0 100%)',
            padding: '2rem',
            position: 'relative'
        }}>
            <div className="geometric-bg">
                <div className="shape shape-1"></div>
                <div className="shape shape-2"></div>
            </div>

            <div style={{ textAlign: 'center', marginBottom: '3rem', zIndex: 1 }}>
                <div style={{
                    width: '72px', height: '72px',
                    background: 'var(--primary-gradient)',
                    borderRadius: '20px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 1.5rem auto',
                    boxShadow: '0 15px 40px rgba(46,125,50,0.3)'
                }}>
                    <Sprout size={38} color="white" />
                </div>
                <h1 style={{
                    fontSize: '2.2rem', fontWeight: '900', letterSpacing: '-1px',
                    color: 'var(--text)', fontFamily: 'var(--font-display)', lineHeight: 1.1
                }}>
                    Bem-vindo, {session?.user?.user_metadata?.username || 'Usuário'}! 👋
                </h1>
                <p style={{ color: 'var(--text-muted)', fontWeight: '600', marginTop: '0.5rem', fontSize: '1rem' }}>
                    Escolha uma área para acessar
                </p>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '1.5rem',
                maxWidth: '820px',
                width: '100%',
                zIndex: 1
            }}>
                {/* ADM Card - jean only */}
                {(canAccess('admin')) && (
                    <HubCard
                        icon={<Shield size={26} color="white" />}
                        iconBg="linear-gradient(135deg, #7c3aed, #a855f7)"
                        iconShadow="rgba(124,58,237,0.3)"
                        hoverShadow="rgba(124,58,237,0.12)"
                        hoverBorder="#7c3aed"
                        title="Área ADM"
                        description="Dashboard estratégico e calendário de pulverização para administração."
                        actionLabel="Acessar →"
                        actionColor="#7c3aed"
                        locked={!canAccess('admin')}
                        onClick={() => handleCardClick('admin')}
                    />
                )}

                {/* Calendário Card - celso, djair */}
                {(canAccess('calendar')) && (
                    <HubCard
                        icon={<BarChart2 size={26} color="white" />}
                        iconBg="var(--primary-gradient)"
                        iconShadow="rgba(46,125,50,0.25)"
                        hoverShadow="rgba(46,125,50,0.15)"
                        hoverBorder="var(--primary)"
                        title="Calendário Automatizado"
                        description="Lançamentos, calendário de pulverização, clima e dashboard de análise."
                        actionLabel="Acessar →"
                        actionColor="var(--primary)"
                        locked={!canAccess('calendar')}
                        onClick={() => handleCardClick('calendar')}
                    />
                )}

                {/* Estoque Card - davi */}
                {(canAccess('inventory')) && (
                    <HubCard
                        icon={<Package size={26} color="white" />}
                        iconBg="var(--secondary-gradient)"
                        iconShadow="rgba(245,124,0,0.2)"
                        hoverShadow="rgba(245,124,0,0.12)"
                        hoverBorder="var(--secondary)"
                        title="Estoque Defensivos"
                        description="Controle de estoque de defensivos agrícolas. Acesso restrito."
                        actionLabel="Acessar →"
                        actionColor="var(--secondary)"
                        locked={!canAccess('inventory')}
                        onClick={() => handleCardClick('inventory')}
                    />
                )}

                {/* If role is 'all' (no recognized user), show all 3 cards unlocked */}
                {role === 'all' && (
                    <>
                        <HubCard
                            icon={<Shield size={26} color="white" />}
                            iconBg="linear-gradient(135deg, #7c3aed, #a855f7)"
                            iconShadow="rgba(124,58,237,0.3)"
                            hoverShadow="rgba(124,58,237,0.12)"
                            hoverBorder="#7c3aed"
                            title="Área ADM"
                            description="Dashboard estratégico e calendário de pulverização para administração."
                            actionLabel="Acessar →"
                            actionColor="#7c3aed"
                            locked={false}
                            onClick={() => handleCardClick('admin')}
                        />
                        <HubCard
                            icon={<BarChart2 size={26} color="white" />}
                            iconBg="var(--primary-gradient)"
                            iconShadow="rgba(46,125,50,0.25)"
                            hoverShadow="rgba(46,125,50,0.15)"
                            hoverBorder="var(--primary)"
                            title="Calendário Automatizado"
                            description="Lançamentos, calendário de pulverização, clima e dashboard."
                            actionLabel="Acessar →"
                            actionColor="var(--primary)"
                            locked={false}
                            onClick={() => handleCardClick('calendar')}
                        />
                        <HubCard
                            icon={<Package size={26} color="white" />}
                            iconBg="var(--secondary-gradient)"
                            iconShadow="rgba(245,124,0,0.2)"
                            hoverShadow="rgba(245,124,0,0.12)"
                            hoverBorder="var(--secondary)"
                            title="Estoque Defensivos"
                            description="Controle de estoque de defensivos agrícolas."
                            actionLabel="Acessar →"
                            actionColor="var(--secondary)"
                            locked={false}
                            onClick={() => handleCardClick('inventory')}
                        />
                    </>
                )}
            </div>

            <div style={{ marginTop: '3rem', zIndex: 1, textAlign: 'center' }}>
                <button
                    onClick={onLogout}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontWeight: '700', cursor: 'pointer', fontSize: '0.85rem' }}
                >
                    Sair da conta
                </button>
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
            `}</style>
        </div>
    );
}

function HubCard({ icon, iconBg, iconShadow, hoverShadow, hoverBorder, title, description, actionLabel, actionColor, locked, onClick }) {
    return (
        <button
            onClick={locked ? undefined : onClick}
            style={{
                background: 'white',
                border: '1px solid var(--border)',
                borderRadius: '24px',
                padding: '2.5rem 2rem',
                cursor: locked ? 'not-allowed' : 'pointer',
                textAlign: 'left',
                boxShadow: '0 8px 30px rgba(0,0,0,0.06)',
                transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                position: 'relative',
                opacity: locked ? 0.45 : 1
            }}
            onMouseEnter={e => {
                if (locked) return;
                e.currentTarget.style.transform = 'translateY(-6px)';
                e.currentTarget.style.boxShadow = `0 20px 50px ${hoverShadow}`;
                e.currentTarget.style.borderColor = hoverBorder;
            }}
            onMouseLeave={e => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.06)';
                e.currentTarget.style.borderColor = 'var(--border)';
            }}
        >
            {locked && (
                <div style={{ position: 'absolute', top: '1.2rem', right: '1.2rem', color: 'var(--text-muted)', opacity: 0.6 }}>
                    <Lock size={16} />
                </div>
            )}
            <div style={{
                width: '54px', height: '54px',
                borderRadius: '16px',
                background: iconBg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 8px 20px ${iconShadow}`
            }}>
                {icon}
            </div>
            <div>
                <h3 style={{ fontWeight: '900', fontSize: '1.2rem', color: 'var(--text)', fontFamily: 'var(--font-display)', marginBottom: '0.3rem' }}>
                    {title}
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600', lineHeight: 1.5 }}>
                    {description}
                </p>
            </div>
            <span style={{ color: actionColor, fontWeight: '800', fontSize: '0.8rem' }}>
                {locked ? 'Sem acesso' : actionLabel}
            </span>
        </button>
    );
}
