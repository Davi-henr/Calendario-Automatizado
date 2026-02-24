import React, { useState } from 'react';
import { Camera, Trash2, Check } from 'lucide-react';
import PageHeader from './PageHeader';

export default function Settings({ logo, onLogoChange }) {
    const [preview, setPreview] = useState(logo);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result);
                onLogoChange(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeLogo = () => {
        setPreview(null);
        onLogoChange(null);
    };

    return (
        <div className="premium-card glass" style={{ maxWidth: '600px', margin: '3rem auto', border: '1px solid var(--border)' }}>
            <PageHeader title="Configurações do Sistema" subtitle="Gerencie a identidade visual e os parâmetros do sistema" />

            <div style={{ marginBottom: '2.5rem' }}>
                <label style={{ display: 'block', marginBottom: '1rem', fontWeight: '800', fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Logo Comercial da Fazenda</label>

                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '1.5rem',
                    padding: '3rem 2rem',
                    border: '2px dashed var(--border)',
                    borderRadius: '24px',
                    backgroundColor: 'rgba(248, 250, 252, 0.4)',
                    transition: 'all 0.3s'
                }}>
                    {preview ? (
                        <div style={{ position: 'relative', padding: '1rem', background: 'white', borderRadius: '16px', boxShadow: 'var(--shadow-sm)' }}>
                            <img src={preview} alt="Logo preview" style={{ maxHeight: '100px', maxWidth: '100%', objectFit: 'contain' }} />
                            <button
                                onClick={removeLogo}
                                style={{
                                    position: 'absolute',
                                    top: '-12px',
                                    right: '-12px',
                                    backgroundColor: '#ef4444',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '50%',
                                    width: '28px',
                                    height: '28px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: '0 4px 10px rgba(239, 68, 68, 0.3)'
                                }}
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                            <div style={{
                                width: '80px',
                                height: '80px',
                                margin: '0 auto 1rem',
                                background: 'white',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '1px solid var(--border)'
                            }}>
                                <Camera size={32} style={{ opacity: 0.2 }} />
                            </div>
                            <p style={{ fontSize: '0.9rem', fontWeight: '600' }}>Nenhuma logo personalizada</p>
                            <p style={{ fontSize: '0.75rem', opacity: 0.7 }}>Envie um arquivo PNG ou JPG</p>
                        </div>
                    )}

                    <div style={{ position: 'relative' }}>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            style={{
                                position: 'absolute',
                                opacity: 0,
                                width: '100%',
                                height: '100%',
                                cursor: 'pointer',
                                zIndex: 2
                            }}
                        />
                        <button className="btn btn-primary" style={{ width: '100%' }}>
                            <div className="btn-inner">
                                <Camera size={20} /> Alterar Logotipo
                            </div>
                        </button>
                    </div>
                </div>
            </div>

            <div style={{
                padding: '1.2rem',
                backgroundColor: 'rgba(16, 185, 129, 0.08)',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '1rem',
                color: '#065f46',
                border: '1px solid rgba(16, 185, 129, 0.2)'
            }}>
                <div style={{ padding: '4px', background: 'white', borderRadius: '50%' }}>
                    <Check size={14} />
                </div>
                <div style={{ fontSize: '0.85rem' }}>
                    <p style={{ fontWeight: '800', marginBottom: '2px' }}>Atualização Automática</p>
                    <p style={{ fontWeight: '500', opacity: 0.8 }}>Sua logo aparecerá instantaneamente no menu lateral e em todos os relatórios digitais gerados.</p>
                </div>
            </div>
        </div>
    );
}
