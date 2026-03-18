import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Sprout, KeyRound, ArrowLeft } from 'lucide-react';

export default function Auth({ onSession }) {
    const [loading, setLoading] = useState(false);
    const [view, setView] = useState('login'); // login, reset
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState({ type: '', text: '' });

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        const { error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            setMessage({ type: 'error', text: 'E-mail ou senha incorretos.' });
        } else {
            // Session will be updated by listener in App.jsx
        }
        setLoading(false);
    };

    const handleReset = async (e) => {
        e.preventDefault();
        setLoading(true);
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) {
            setMessage({ type: 'error', text: error.message });
        } else {
            setMessage({ type: 'success', text: 'Se o e-mail existir, um link de recuperação foi enviado!' });
        }
        setLoading(false);
    };

    const inputStyle = {
        width: '100%',
        padding: '0.85rem',
        borderRadius: '8px',
        border: '1px solid var(--border)',
        fontSize: '1rem',
        marginBottom: '1rem',
        outline: 'none',
        backgroundColor: '#ffffff'
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: '1rem',
            background: 'linear-gradient(135deg, #efebe9 0%, #d7ccc8 100%)'
        }}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                    <Sprout size={32} color="var(--secondary)" />
                    <h1 style={{ fontSize: '2.2rem', fontWeight: '900', color: 'var(--primary)', margin: 0 }}>AgroControl</h1>
                </div>
                <p style={{ color: 'var(--text-muted)', fontWeight: '600', marginTop: '0.5rem' }}>Gestão de Safra e Pulverização</p>
            </div>

            <div className="premium-card glass" style={{ width: '100%', maxWidth: '420px', padding: '2.5rem' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '2rem', fontWeight: '800', color: 'var(--primary)' }}>
                    {view === 'login' ? 'Acesso ao Sistema' : 'Recuperar Senha'}
                </h2>

                {message.text && (
                    <div style={{
                        padding: '1rem',
                        borderRadius: '8px',
                        marginBottom: '1.5rem',
                        backgroundColor: message.type === 'error' ? '#fee2e2' : '#dcfce7',
                        color: message.type === 'error' ? '#991b1b' : '#166534',
                        fontSize: '0.9rem',
                        fontWeight: '700',
                        textAlign: 'center',
                        border: `1px solid ${message.type === 'error' ? '#fca5a5' : '#bbf7d0'}`
                    }}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={view === 'login' ? handleLogin : handleReset}>
                    
                    <div style={{ marginBottom: '0.5rem' }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                            Seu e-mail de acesso
                        </label>
                        <input
                            type="email"
                            placeholder="contato@fazenda.com.br"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            style={inputStyle}
                        />
                    </div>

                    {view !== 'reset' && (
                        <div style={{ marginBottom: '0.5rem' }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                                Senha
                            </label>
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                style={inputStyle}
                            />
                        </div>
                    )}

                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading}
                        style={{ width: '100%', marginTop: '1rem', padding: '0.9rem', fontSize: '1.05rem' }}
                    >
                        <div className="btn-inner" style={{ justifyContent: 'center' }}>
                            {loading ? 'Processando...' : view === 'login' ? 'Entrar' : 'Enviar E-mail de Recuperação'}
                        </div>
                    </button>
                </form>

                <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center' }}>
                    {view === 'login' ? (
                        <button onClick={() => setView('reset')} className="btn btn-mini" style={{ color: 'var(--text-muted)' }}>
                            <div className="btn-inner">
                                <KeyRound size={16} /> Esqueci minha senha
                            </div>
                        </button>
                    ) : (
                        <button onClick={() => setView('login')} className="btn btn-mini" style={{ color: 'var(--text-muted)' }}>
                            <div className="btn-inner">
                                <ArrowLeft size={16} /> Voltar para o Login
                            </div>
                        </button>
                    )}
                </div>
            </div>
            
            <p style={{ marginTop: '2rem', fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                Acesso restrito a funcionários autorizados.<br/>
                Para novos acessos, contate a administração.
            </p>
        </div>
    );
}
