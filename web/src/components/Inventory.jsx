import React from 'react';
import { Package, ArrowLeft, Wrench } from 'lucide-react';

export default function Inventory({ onBack }) {
    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 40%, #fed7aa 100%)',
            position: 'relative'
        }}>
            {/* Geometric Background */}
            <div className="geometric-bg">
                <div className="shape shape-1" style={{ background: 'rgba(245, 124, 0, 0.06)' }}></div>
                <div className="shape shape-2" style={{ background: 'rgba(245, 124, 0, 0.04)' }}></div>
            </div>

            {/* Header */}
            <header style={{
                padding: '1rem 2rem',
                backgroundColor: 'rgba(255,255,255,0.9)',
                backdropFilter: 'blur(12px)',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                zIndex: 100
            }}>
                <button
                    onClick={onBack}
                    style={{
                        background: 'white', border: '1px solid var(--border)', borderRadius: '12px',
                        padding: '0.6rem 1rem', cursor: 'pointer', display: 'flex', alignItems: 'center',
                        gap: '0.5rem', fontWeight: '700', color: 'var(--text)', fontSize: '0.85rem',
                        transition: 'all 0.2s'
                    }}
                >
                    <ArrowLeft size={16} /> Voltar ao Menu
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                        width: '40px', height: '40px', borderRadius: '12px',
                        background: 'var(--secondary-gradient)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 6px 15px rgba(245,124,0,0.25)'
                    }}>
                        <Package size={20} color="white" />
                    </div>
                    <div>
                        <h2 style={{ fontWeight: '900', fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--text)' }}>
                            Estoque de Defensivos
                        </h2>
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '600' }}>Área Restrita</p>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', zIndex: 1 }}>
                <div className="premium-card" style={{ maxWidth: '480px', textAlign: 'center', padding: '3rem 2rem' }}>
                    <div style={{
                        width: '64px', height: '64px', borderRadius: '18px',
                        background: 'linear-gradient(135deg, #f97316, #fb923c)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 1.5rem auto', boxShadow: '0 10px 30px rgba(245,124,0,0.3)'
                    }}>
                        <Wrench size={30} color="white" />
                    </div>
                    <h3 style={{ fontWeight: '900', fontSize: '1.4rem', fontFamily: 'var(--font-display)', marginBottom: '0.8rem', color: 'var(--text)' }}>
                        Em Construção
                    </h3>
                    <p style={{ color: 'var(--text-muted)', fontWeight: '600', lineHeight: 1.6, marginBottom: '2rem', fontSize: '0.9rem' }}>
                        O módulo de Estoque de Defensivos está sendo desenvolvido. Em breve você poderá gerenciar entradas, saídas, saldo e histórico de produtos.
                    </p>
                    <div style={{
                        display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.8rem',
                        opacity: 0.4, pointerEvents: 'none'
                    }}>
                        {['Entradas', 'Saídas', 'Saldo Atual', 'Histórico'].map(item => (
                            <div key={item} style={{
                                padding: '0.75rem', borderRadius: '12px',
                                background: '#f8fafc', border: '1px solid var(--border)',
                                fontWeight: '700', fontSize: '0.8rem', color: 'var(--text-muted)'
                            }}>
                                {item}
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}
