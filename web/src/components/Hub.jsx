import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { settingsService } from '../lib/services';
import { BarChart2, Shield, Package, X, Eye, EyeOff, LogIn, Sprout, ClipboardList } from 'lucide-react';

const USER_MAP = {
    djair: 'djair@fazendavale.com',
    celso: 'celso@fazendavale.com',
    davi: 'davi@fazendavale.com',
    jean: 'jean@fazendavale.com',
    vania: 'escritorio@fazendavale.com',
    almoxarife: 'almoxarife@fazendavale.com',
};

const MODULE_ACCESS = {
    calendar: ['celso', 'djair', 'davi'],
    admin: ['jean', 'davi', 'vania'],
    inventory: ['davi', 'vania', 'almoxarife'],
};

const MODULES = [
    {
        key: 'calendar',
        title: 'Calendário Automatizado',
        desc: 'Lançamentos, calendário de pulverização, clima e dashboard.',
        Icon: BarChart2,
        gradient: 'linear-gradient(135deg, #2e7d32 0%, #66bb6a 100%)',
        glow: 'rgba(46,125,50,0.25)',
    },
    {
        key: 'admin',
        title: 'Área Administrativa',
        desc: 'Dashboard estratégico e calendário para administração.',
        Icon: Shield,
        gradient: 'linear-gradient(135deg, #5c35d5 0%, #9c6fef 100%)',
        glow: 'rgba(92,53,213,0.2)',
    },
    {
        key: 'inventory',
        title: 'Estoque de Defensivos',
        desc: 'Controle de estoque de defensivos agrícolas.',
        Icon: Package,
        gradient: 'linear-gradient(135deg, #d97706 0%, #fbbf24 100%)',
        glow: 'rgba(217,119,6,0.2)',
    },
];

// --- NOVO: FUNDO INTERATIVO COM LARANJAS FLUTUANTES ---
const InteractiveOrchardBackground = () => {
    const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 });
    // Gera posições e tamanhos aleatórios para 15 laranjas
    const [oranges] = useState(() => Array.from({ length: 15 }).map(() => ({
        id: Math.random(),
        baseX: Math.random() * 100, // %
        baseY: Math.random() * 100, // %
        size: 16 + Math.random() * 14, // 16 a 30px
        floatSpeed: 3 + Math.random() * 4, // 3s a 7s
        rotation: Math.random() * 360,
    })));

    useEffect(() => {
        const handleMouseMove = (e) => {
            setMousePos({ x: e.clientX, y: e.clientY });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            overflow: 'hidden', pointerEvents: 'none', zIndex: 0
        }}>
            <style>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(-15px) rotate(10deg); }
                }
            `}</style>
            {oranges.map((orange) => {
                // Cálculo de repulsão do mouse
                const windowWidth = window.innerWidth;
                const windowHeight = window.innerHeight;
                const orangePixelX = (orange.baseX / 100) * windowWidth;
                const orangePixelY = (orange.baseY / 100) * windowHeight;
                
                const dx = orangePixelX - mousePos.x;
                const dy = orangePixelY - mousePos.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const repelRadius = 150; // Distância que o mouse afeta a laranja
                
                let repelX = 0;
                let repelY = 0;
                
                if (distance < repelRadius) {
                    const force = (repelRadius - distance) / repelRadius;
                    repelX = (dx / distance) * force * 40; // Empurra até 40px
                    repelY = (dy / distance) * force * 40;
                }

                return (
                    <div
                        key={orange.id}
                        style={{
                            position: 'absolute',
                            left: `${orange.baseX}%`,
                            top: `${orange.baseY}%`,
                            fontSize: `${orange.size}px`,
                            opacity: 0.15, // Sutileza para não atrapalhar a leitura
                            transform: `translate(${repelX}px, ${repelY}px) rotate(${orange.rotation}deg)`,
                            transition: 'transform 0.2s ease-out',
                        }}
                    >
                        <div style={{
                            animation: `float ${orange.floatSpeed}s ease-in-out infinite`,
                        }}>
                            🍊
                        </div>
                    </div>
                );
            })}
        </div>
    );
};


const ParticleLogo = ({ customLogo }) => {
    const particles = Array.from({ length: 24 });

    return (
        <div style={{ position: 'relative', height: '100px', margin: '0 auto 1.5rem auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <style>{`
                @keyframes logo-anim {
                    0%, 10% { transform: scale(1); opacity: 1; filter: drop-shadow(0 0 0px rgba(46,125,50,1)); }
                    15% { transform: scale(1.15); filter: drop-shadow(0 0 15px rgba(46,125,50,0.8)); opacity: 1; }
                    20%, 80% { transform: scale(0); opacity: 0; }
                    85% { transform: scale(1.15); filter: drop-shadow(0 0 15px rgba(46,125,50,0.8)); opacity: 1; }
                    90%, 100% { transform: scale(1); opacity: 1; filter: drop-shadow(0 0 0px rgba(46,125,50,1)); }
                }
                @keyframes particle-anim {
                    0%, 15% { transform: translate(0, 0) scale(0); opacity: 0; }
                    20% { transform: translate(0, 0) scale(1.2); opacity: 1; background: #2e7d32; }
                    50% { transform: translate(var(--tx), var(--ty)) scale(0.6) rotate(var(--rot)); opacity: 0.7; background: #fb8c00; }
                    80% { transform: translate(0, 0) scale(1.2); opacity: 1; background: #2e7d32; }
                    85%, 100% { transform: translate(0, 0) scale(0); opacity: 0; }
                }
            `}</style>

            <div style={{
                animation: 'logo-anim 6s infinite cubic-bezier(0.4, 0, 0.2, 1)',
                width: customLogo ? 'auto' : '80px', 
                height: customLogo ? '90px' : '80px',
                background: customLogo ? 'transparent' : 'var(--primary-gradient)',
                borderRadius: customLogo ? '0' : '22px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: customLogo ? 'none' : '0 10px 30px rgba(46, 125, 50, 0.2)',
                position: 'relative',
                zIndex: 2
            }}>
                {customLogo ? (
                    <img src={customLogo} alt="Logo empresa" style={{ height: '100%', width: 'auto', objectFit: 'contain' }} />
                ) : (
                    <Sprout size={42} color="white" />
                )}
            </div>

            {particles.map((_, i) => {
                const angle = (i / particles.length) * 360;
                const distance = 50 + Math.random() * 50; 
                const tx = `${Math.cos(angle * Math.PI / 180) * distance}px`;
                const ty = `${Math.sin(angle * Math.PI / 180) * distance}px`;
                const size = 4 + Math.random() * 6; 
                const rot = `${Math.random() * 360}deg`;

                return (
                    <div key={i} style={{
                        position: 'absolute',
                        width: `${size}px`, height: `${size}px`,
                        borderRadius: i % 3 === 0 ? '4px' : '50%',
                        top: '50%', left: '50%',
                        marginLeft: `-${size / 2}px`, marginTop: `-${size / 2}px`,
                        '--tx': tx, '--ty': ty, '--rot': rot,
                        animation: 'particle-anim 6s infinite cubic-bezier(0.4, 0, 0.2, 1)',
                        zIndex: 1
                    }} />
                )
            })}
        </div>
    );
};

export default function Hub({ onNavigate, logo }) {
    const [selectedModule, setSelectedModule] = useState(null);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const openModal = (key) => {
        setSelectedModule(key);
        setUsername(''); setPassword(''); setError(''); setShowPw(false);
    };
    const closeModal = () => { setSelectedModule(null); setError(''); };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true); setError('');
        
        const inputStr = username.trim().toLowerCase();
        
        const loginEmail = USER_MAP[inputStr] || inputStr;

        if (USER_MAP[inputStr] && !MODULE_ACCESS[selectedModule].includes(inputStr)) {
            setError(`Usuário "${inputStr}" Você não tem acesso a esta área.`); 
            setLoading(false); 
            return;
        }

        const { error: authError } = await supabase.auth.signInWithPassword({ email: loginEmail, password });
        
        if (authError) { 
            setError('E-mail/Usuário ou senha incorretos.'); 
            setLoading(false); 
            return; 
        }

        onNavigate(selectedModule);
        closeModal(); 
        setLoading(false);
    };

    const mod = MODULES.find(m => m.key === selectedModule);

    return (
        <div style={{
            minHeight: '100vh', display: 'flex', flexDirection: 'column',
            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
            fontFamily: 'var(--font-display, "Inter", sans-serif)',
            position: 'relative', overflow: 'hidden'
        }}>
            {/* ELEMENTOS DE FUNDO */}
            <InteractiveOrchardBackground />
            <div style={{ position: 'fixed', top: '-10%', right: '-5%', width: '40vw', height: '40vw', background: 'radial-gradient(circle, rgba(74, 222, 128, 0.08) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none', zIndex: 0 }} />
            <div style={{ position: 'fixed', bottom: '-10%', left: '-5%', width: '35vw', height: '35vw', background: 'radial-gradient(circle, rgba(251, 140, 0, 0.06) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none', zIndex: 0 }} />

            <div style={{
                position: 'fixed', top: '20%', left: '-50px', width: '200px', height: '400px',
                background: 'linear-gradient(135deg, rgba(46, 125, 50, 0.05), rgba(251, 140, 0, 0.05))',
                borderRadius: '50%', transform: 'rotate(-25deg)', pointerEvents: 'none', zIndex: 0
            }} />

            {/* Top Bar */}
            <header style={{
                padding: '1.2rem 2rem',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                borderBottom: '1px solid rgba(0,0,0,0.06)',
                backdropFilter: 'blur(12px)',
                backgroundColor: 'rgba(255,255,255,0.85)',
                position: 'sticky', top: 0, zIndex: 100,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {logo ? (
                        <img src={logo} alt="Logo" style={{ height: '40px', width: 'auto', objectFit: 'contain', borderRadius: '8px' }} />
                    ) : (
                        <div style={{ width: '40px', height: '40px', background: 'var(--primary-gradient)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Sprout size={22} color="white" />
                        </div>
                    )}
                    <div>
                        <p style={{ color: 'var(--text)', fontWeight: '800', fontSize: '0.95rem', letterSpacing: '-0.3px' }}>ERP Sistema de Operações Agrícola</p>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Desenvolvido por Davi Henrique</p>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px rgba(34, 197, 94, 0.4)' }} />
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: '700' }}>ON</span>
                </div>
            </header>

            {/* Hero */}
            <div style={{ textAlign: 'center', padding: '4rem 2rem 3rem', position: 'relative', zIndex: 1 }}>
                <ParticleLogo customLogo={logo} />
                <h1 style={{ fontSize: '2.5rem', fontWeight: '900', color: 'var(--text)', letterSpacing: '-1.5px', marginBottom: '0.8rem', lineHeight: 1.1 }}>
                    DORIVAL   <span style={{ background: 'linear-gradient(90deg, #2e7d32, #fb8c00)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}> FORTES</span>
                </h1>
                <p style={{ color: 'var(--text-muted)', fontWeight: '600', fontSize: '1.1rem' }}>Identifique-se para acessar os módulos</p>
            </div>

            {/* Design Minimalista dos Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '1.5rem',
                maxWidth: '950px', width: '100%',
                margin: '0 auto',
                padding: '0 1.5rem 4rem',
                zIndex: 1,
            }}>
                {MODULES.map(({ key, title }) => (
                    <button
                        key={key}
                        onClick={() => openModal(key)}
                        style={{
                            position: 'relative',
                            padding: '2px', // Espessura da Borda Gradiente
                            background: 'linear-gradient(135deg, #fb8c00 0%, #ffffff 50%, #2e7d32 100%)', // Laranja, Branco e Verde
                            borderRadius: '16px',
                            border: 'none',
                            cursor: 'pointer',
                            textAlign: 'left',
                            boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            outline: 'none',
                            display: 'flex',
                            flexDirection: 'column',
                            textDecoration: 'none'
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.transform = 'translateY(-6px)';
                            e.currentTarget.style.boxShadow = '0 15px 35px rgba(0,0,0,0.1)';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.05)';
                        }}
                    >
                        <div style={{
                            background: '#ffffff', // Fundo Sólido Branco do Cartão
                            borderRadius: '14px', 
                            padding: '2.5rem 2rem',
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            boxSizing: 'border-box'
                        }}>
                            <div>
                                <h3 style={{ 
                                    fontWeight: '900', 
                                    fontSize: '1.35rem', 
                                    color: 'var(--text)', 
                                    textTransform: 'uppercase', 
                                    letterSpacing: '-0.5px', 
                                    margin: 0,
                                    lineHeight: 1.2
                                }}>
                                    {title}
                                </h3>
                            </div>

                            <div style={{ marginTop: '3.5rem' }}>
                                {/* A linha separadora sutil */}
                                <div style={{ height: '1px', width: '100%', backgroundColor: '#e2e8f0', marginBottom: '1.2rem' }} />
                                
                                {/* O texto minimalista de acesso */}
                                <span style={{ 
                                    fontSize: '0.8rem', 
                                    fontWeight: '800', 
                                    color: '#94a3b8', 
                                    textTransform: 'uppercase', 
                                    letterSpacing: '3px' 
                                }}>
                                    Acessar
                                </span>
                            </div>
                        </div>
                    </button>
                ))}
            </div>

            {/* Login Modal */}
            {selectedModule && mod && (
                <div
                    style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}
                    onClick={e => { if (e.target === e.currentTarget) closeModal(); }}
                >
                    <div style={{
                        background: 'white',
                        border: '1px solid var(--border)',
                        borderRadius: '28px',
                        padding: '2.5rem 2rem',
                        width: '100%', maxWidth: '400px',
                        boxShadow: `0 40px 100px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.02)`,
                        animation: 'popIn 0.3s cubic-bezier(0.34,1.56,0.64,1)',
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: mod.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 8px 16px ${mod.glow}` }}>
                                    <mod.Icon size={24} color="white" />
                                </div>
                                <div>
                                    <p style={{ fontWeight: '900', color: 'var(--text)', fontSize: '1.05rem', letterSpacing: '-0.3px' }}>{mod.title}</p>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>Acesso ao Módulo</p>
                                </div>
                            </div>
                            <button onClick={closeModal} className="btn btn-mini" style={{ opacity: 0.8 }}>
                                <div className="btn-inner" style={{ padding: '0.4rem' }}>
                                    <X size={20} />
                                </div>
                            </button>
                        </div>

                        {error && (
                            <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', padding: '0.7rem 1rem', borderRadius: '10px', fontSize: '0.82rem', fontWeight: '700', marginBottom: '1rem' }}>
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                            <div>
                                <label style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '0.4rem', display: 'block', letterSpacing: '1px' }}>E-MAIL OU USUÁRIO</label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={e => setUsername(e.target.value)}
                                    placeholder="Ex: greening@citrus.com"
                                    autoFocus required
                                    style={{ width: '100%', boxSizing: 'border-box', padding: '0.85rem 1.1rem', borderRadius: '14px', border: '1.5px solid var(--border)', background: '#f8fafc', color: 'var(--text)', fontSize: '1rem', outline: 'none', fontFamily: 'inherit', fontWeight: '600' }}
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block', letterSpacing: '0.8px' }}>SENHA</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type={showPw ? 'text' : 'password'}
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        placeholder="Digite sua senha"
                                        required
                                        style={{ width: '100%', boxSizing: 'border-box', padding: '0.85rem 3rem 0.85rem 1.1rem', borderRadius: '14px', border: '1.5px solid var(--border)', background: '#f8fafc', color: 'var(--text)', fontSize: '1rem', outline: 'none', fontFamily: 'inherit', fontWeight: '600' }}
                                    />
                                    <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: '0.9rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
                                        {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="btn btn-accent"
                                style={{ width: '100%', marginTop: '0.6rem' }}
                            >
                                <div className="btn-inner">
                                    {loading ? 'Validando...' : 'Entrar no Módulo'}
                                </div>
                            </button>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes popIn { from { opacity:0; transform:scale(0.88) translateY(12px); } to { opacity:1; transform:scale(1) translateY(0); } }
                input::placeholder { color: #94a3b8 !important; }
                input:focus { border-color: var(--primary) !important; box-shadow: 0 0 0 4px rgba(46, 125, 50, 0.1) !important; }
            `}</style>
        </div>
    );
}
