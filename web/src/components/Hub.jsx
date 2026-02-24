import React, { useState } from 'react';
import { Sprout, BarChart2, ShieldCheck, Package, Lock, X, Eye, EyeOff } from 'lucide-react';

export default function Hub({ session, onNavigate, onLogout }) {
    const [showInventoryModal, setShowInventoryModal] = useState(false);
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [showPw, setShowPw] = useState(false);

    const username = session?.user?.user_metadata?.username || session?.user?.email || '';
    const isDavi = username.toLowerCase() === 'davi';

    const handleInventoryClick = () => {
        if (isDavi) {
            onNavigate('inventory');
        } else {
            setShowInventoryModal(true);
            setPassword('');
            setError('');
        }
    };

    const handlePasswordSubmit = (e) => {
        e.preventDefault();
        if (password === '01042002') {
            setShowInventoryModal(false);
            onNavigate('inventory');
        } else {
            setError('Senha incorreta. Apenas usuários autorizados têm acesso.');
            setPassword('');
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
            {/* Geometric Background */}
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
                    color: 'var(--text)', fontFamily: 'var(--font-display)',
                    lineHeight: 1.1
                }}>Bem-vindo, {username || 'Usuário'}! 👋</h1>
                <p style={{ color: 'var(--text-muted)', fontWeight: '600', marginTop: '0.5rem', fontSize: '1rem' }}>
                    Escolha uma área para acessar
                </p>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '1.5rem',
                maxWidth: '700px',
                width: '100%',
                zIndex: 1
            }}>
                {/* Card 1 - Calendário / ADM */}
                <button
                    onClick={() => onNavigate('main')}
                    style={{
                        background: 'white',
                        border: '1px solid var(--border)',
                        borderRadius: '24px',
                        padding: '2.5rem 2rem',
                        cursor: 'pointer',
                        textAlign: 'left',
                        boxShadow: '0 8px 30px rgba(0,0,0,0.06)',
                        transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1rem'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = '0 20px 50px rgba(46,125,50,0.15)'; e.currentTarget.style.borderColor = 'var(--primary)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.06)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                >
                    <div style={{
                        width: '54px', height: '54px',
                        borderRadius: '16px',
                        background: 'var(--primary-gradient)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 8px 20px rgba(46,125,50,0.25)'
                    }}>
                        <BarChart2 size={26} color="white" />
                    </div>
                    <div>
                        <h3 style={{ fontWeight: '900', fontSize: '1.2rem', color: 'var(--text)', fontFamily: 'var(--font-display)', marginBottom: '0.3rem' }}>
                            Calendário Automatizado
                        </h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600', lineHeight: 1.5 }}>
                            Lançamentos, calendário de pulverização, clima e dashboard de análise.
                        </p>
                    </div>
                    <span style={{ color: 'var(--primary)', fontWeight: '800', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        Acessar →
                    </span>
                </button>

                {/* Card 2 - Estoque Defensivos */}
                <button
                    onClick={handleInventoryClick}
                    style={{
                        background: 'white',
                        border: '1px solid var(--border)',
                        borderRadius: '24px',
                        padding: '2.5rem 2rem',
                        cursor: 'pointer',
                        textAlign: 'left',
                        boxShadow: '0 8px 30px rgba(0,0,0,0.06)',
                        transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1rem',
                        position: 'relative'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = '0 20px 50px rgba(245,124,0,0.12)'; e.currentTarget.style.borderColor = 'var(--secondary)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.06)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                >
                    {!isDavi && (
                        <div style={{ position: 'absolute', top: '1.2rem', right: '1.2rem', color: 'var(--text-muted)', opacity: 0.4 }}>
                            <Lock size={16} />
                        </div>
                    )}
                    <div style={{
                        width: '54px', height: '54px',
                        borderRadius: '16px',
                        background: 'var(--secondary-gradient)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 8px 20px rgba(245,124,0,0.2)'
                    }}>
                        <Package size={26} color="white" />
                    </div>
                    <div>
                        <h3 style={{ fontWeight: '900', fontSize: '1.2rem', color: 'var(--text)', fontFamily: 'var(--font-display)', marginBottom: '0.3rem' }}>
                            Estoque Defensivos
                        </h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600', lineHeight: 1.5 }}>
                            Controle de estoque de defensivos agrícolas. Acesso restrito.
                        </p>
                    </div>
                    <span style={{ color: 'var(--secondary)', fontWeight: '800', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        {isDavi ? 'Acessar →' : 'Requer senha →'}
                    </span>
                </button>
            </div>

            {/* Logout Footer */}
            <div style={{ marginTop: '3rem', zIndex: 1, textAlign: 'center' }}>
                <button
                    onClick={onLogout}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontWeight: '700', cursor: 'pointer', fontSize: '0.85rem' }}
                >
                    Sair da conta
                </button>
            </div>

            {/* Password Modal */}
            {showInventoryModal && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
                    backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', zIndex: 9999, padding: '1rem'
                }}>
                    <div className="premium-card" style={{ width: '100%', maxWidth: '380px', animation: 'fadeIn 0.2s' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                <div style={{ padding: '0.5rem', background: 'rgba(245,124,0,0.1)', borderRadius: '10px' }}>
                                    <ShieldCheck size={20} style={{ color: 'var(--secondary)' }} />
                                </div>
                                <h4 style={{ fontWeight: '800', fontFamily: 'var(--font-display)' }}>Área Restrita</h4>
                            </div>
                            <button onClick={() => setShowInventoryModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                                <X size={20} />
                            </button>
                        </div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600', marginBottom: '1.5rem' }}>
                            Digite a senha de acesso ao Estoque de Defensivos.
                        </p>
                        <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showPw ? 'text' : 'password'}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="Senha"
                                    className="input-field"
                                    style={{ width: '100%', boxSizing: 'border-box', paddingRight: '2.5rem' }}
                                    autoFocus
                                />
                                <button
                                    type="button" onClick={() => setShowPw(!showPw)}
                                    style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                                >
                                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            {error && <p style={{ color: '#ef4444', fontSize: '0.8rem', fontWeight: '700' }}>{error}</p>}
                            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Entrar</button>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
            `}</style>
        </div>
    );
}
