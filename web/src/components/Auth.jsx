import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Sprout, LogIn, UserPlus, KeyRound, ArrowLeft } from 'lucide-react';

export default function Auth({ onSession }) {
    const [loading, setLoading] = useState(false);
    const [view, setView] = useState('login'); // login, signup, reset
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [username, setUsername] = useState('');
    const [message, setMessage] = useState({ type: '', text: '' });

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        const { error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            setMessage({ type: 'error', text: error.message });
        } else {
            // Session will be updated by listener in App.jsx
        }
        setLoading(false);
    };

    const handleSignup = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                    username: username,
                },
            },
        });

        if (error) {
            setMessage({ type: 'error', text: error.message });
        } else {
            setMessage({ type: 'success', text: 'Cadastro realizado! Verifique seu e-mail.' });
            setView('login');
        }
        setLoading(false);
    };

    const handleReset = async (e) => {
        e.preventDefault();
        setLoading(true);
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) setMessage({ type: 'error', text: error.message });
        else setMessage({ type: 'success', text: 'E-mail de recuperação enviado!' });
        setLoading(false);
    };

    const inputStyle = {
        width: '100%',
        padding: '0.75rem',
        borderRadius: '8px',
        border: '1px solid var(--border)',
        fontSize: '1rem',
        marginBottom: '1rem',
        outline: 'none',
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
                    <h1 style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--primary)' }}>AgroControl</h1>
                </div>
                <p style={{ color: 'var(--text-muted)' }}>Calendário de Pulverização</p>
            </div>

            <div className="premium-card" style={{ width: '100%', maxWidth: '400px' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', fontWeight: '700' }}>
                    {view === 'login' ? 'Entrar' : view === 'signup' ? 'Criar Conta' : 'Recuperar Senha'}
                </h2>

                {message.text && (
                    <div style={{
                        padding: '0.75rem',
                        borderRadius: '8px',
                        marginBottom: '1rem',
                        backgroundColor: message.type === 'error' ? '#ffebee' : '#e8f5e9',
                        color: message.type === 'error' ? '#c62828' : '#2e7d32',
                        fontSize: '0.9rem',
                        textAlign: 'center'
                    }}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={view === 'login' ? handleLogin : view === 'signup' ? handleSignup : handleReset}>
                    {view === 'signup' && (
                        <>
                            <input
                                type="text"
                                placeholder="Nome Completo"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                required
                                style={inputStyle}
                            />
                            <input
                                type="text"
                                placeholder="Username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                style={inputStyle}
                            />
                        </>
                    )}

                    <input
                        type="email"
                        placeholder="E-mail"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        style={inputStyle}
                    />

                    {view !== 'reset' && (
                        <input
                            type="password"
                            placeholder="Senha"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            style={inputStyle}
                        />
                    )}

                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading}
                        style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}
                    >
                        {loading ? 'Carregando...' : view === 'login' ? 'Entrar' : view === 'signup' ? 'Cadastrar' : 'Enviar E-mail'}
                    </button>
                </form>

                <div style={{ marginTop: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center' }}>
                    {view === 'login' ? (
                        <>
                            <button onClick={() => setView('signup')} className="btn" style={{ fontSize: '0.9rem', color: 'var(--primary)' }}>
                                <UserPlus size={16} /> Criar Conta
                            </button>
                            <button onClick={() => setView('reset')} className="btn" style={{ fontSize: '0.9rem', color: 'var(--primary)' }}>
                                <KeyRound size={16} /> Esqueceu a Senha?
                            </button>
                        </>
                    ) : (
                        <button onClick={() => setView('login')} className="btn" style={{ fontSize: '0.9rem', color: 'var(--primary)' }}>
                            <ArrowLeft size={16} /> Voltar ao Login
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
