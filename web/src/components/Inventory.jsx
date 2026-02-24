import React from 'react';
import { Package, ArrowLeft, Wrench } from 'lucide-react';
import PageHeader from './PageHeader';

export default function Inventory({ onBack, logo }) {
    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--bg)',
            position: 'relative'
        }}>
            {/* Header */}
            <header style={{
                padding: '1.5rem 2rem',
                backgroundColor: '#0d1117',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                zIndex: 100
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                    <PageHeader title="Estoque de Defensivos" subtitle="Área Restrita" logo={logo} />
                </div>
                <button
                    onClick={onBack}
                    className="btn btn-outline"
                >
                    <div className="btn-inner">
                        <ArrowLeft size={16} /> Voltar ao Menu
                    </div>
                </button>
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
                                background: 'white', border: '1px solid var(--border)',
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
