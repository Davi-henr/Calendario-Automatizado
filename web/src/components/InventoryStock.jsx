import React, { useState, useEffect } from 'react';
import {
    Search,
    Package,
    ArrowUpRight,
    ArrowDownLeft,
    Filter,
    Activity
} from 'lucide-react';
import { insumosService, entradasService, saidasService } from '../lib/services';

export default function InventoryStock() {
    const [stockData, setStockData] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [insumos, entradas, saidas] = await Promise.all([
                insumosService.getAll(),
                entradasService.getAll(),
                saidasService.getAll()
            ]);

            const consolidated = insumos.map(insumo => {
                const totalEntradas = (entradas || [])
                    .filter(e => e.insumo_id === insumo.id)
                    .reduce((sum, e) => sum + Number(e.quantidade || 0), 0);

                // Lê saídas, ignorando as apagadas
                const totalSaidas = (saidas || [])
                    .filter(s => s.insumo_id === insumo.id && s.ordens_saida?.ativo !== false)
                    .reduce((sum, s) => sum + Number(s.quantidade || 0), 0);

                // LÓGICA SIMPLES E CORRETA: Apenas soma as devoluções, ignorando as apagadas.
                // Como a transferência já gera a saída acima, a conta se anula perfeitamente.
                const totalDevolucoes = (saidas || [])
                    .filter(s => s.insumo_id === insumo.id && s.ordens_saida?.ativo !== false)
                    .reduce((sum, s) => sum + Number(s.devolucao || 0), 0);

                const saldoInicial = Number(insumo.saldo_inicial || 0);
                const consumoReal = totalSaidas - totalDevolucoes;
                const saldoAtual = saldoInicial + totalEntradas - consumoReal;

                return {
                    id: insumo.id,
                    insumo: insumo.insumo,
                    classificacao: insumo.classificacao,
                    saldo_inicial: parseFloat(saldoInicial.toFixed(2)),
                    total_entradas: parseFloat(totalEntradas.toFixed(2)),
                    total_saidas: parseFloat(totalSaidas.toFixed(2)),
                    total_devolucoes: parseFloat(totalDevolucoes.toFixed(2)),
                    consumo_real: parseFloat(consumoReal.toFixed(2)),
                    saldo_atual: parseFloat(saldoAtual.toFixed(2))
                };
            });

            setStockData(consolidated);
        } catch (error) {
            console.error('Error fetching stock data:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredData = stockData.filter(item => {
        const search = searchTerm.toLowerCase();
        return (
            item.insumo.toLowerCase().includes(search) ||
            (item.classificacao?.toLowerCase().includes(search) || '')
        );
    });

    return (
        <div style={{
            height: 'calc(100vh - 180px)',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: 'white',
            borderRadius: '24px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.04)',
            border: '1px solid rgba(0,0,0,0.05)',
            overflow: 'hidden'
        }}>
            {/* Header Fixo */}
            <div style={{
                padding: '1.5rem 2rem',
                borderBottom: '1px solid rgba(0,0,0,0.06)',
                backgroundColor: 'rgba(255,255,255,0.8)',
                backdropFilter: 'blur(10px)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                zIndex: 10
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                        width: '48px', height: '48px', borderRadius: '14px',
                        background: 'linear-gradient(135deg, var(--primary), #6366f1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white'
                    }}>
                        <Package size={24} />
                    </div>
                    <div>
                        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: '900', color: 'var(--text)', fontSize: '1.4rem' }}>
                            Estoque Geral
                        </h2>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600' }}>
                            Posição consolidada de insumos
                        </span>
                    </div>
                </div>

                <div style={{ position: 'relative', width: '350px' }}>
                    <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                        type="text"
                        placeholder="Buscar por insumo ou classificação..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%', padding: '0.7rem 1rem 0.7rem 2.8rem',
                            borderRadius: '12px', border: '1px solid rgba(0,0,0,0.1)',
                            fontSize: '0.9rem', outline: 'none', transition: 'all 0.2s',
                            backgroundColor: '#f8fafc'
                        }}
                    />
                </div>
            </div>

            {/* Tabela de Estoque */}
            <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '1rem 2rem',
                backgroundColor: '#fafbfc'
            }}>
                <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                    <thead style={{ position: 'sticky', top: 0, zIndex: 5, backgroundColor: '#fafbfc' }}>
                        <tr style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1.5px' }}>
                            <th style={{ textAlign: 'left', padding: '1rem', fontWeight: '800' }}>Insumo</th>
                            <th style={{ textAlign: 'left', padding: '1rem', fontWeight: '800' }}>Classificação</th>
                            <th style={{ textAlign: 'center', padding: '1rem', fontWeight: '800' }}>Saldo Inicial</th>
                            <th style={{ textAlign: 'center', padding: '1rem', fontWeight: '800' }}>Entradas</th>
                            <th style={{ textAlign: 'center', padding: '1rem', fontWeight: '800' }}>Saídas</th>
                            <th style={{ textAlign: 'center', padding: '1rem', fontWeight: '800' }}>Devoluções</th>
                            <th style={{ textAlign: 'center', padding: '1rem', fontWeight: '800' }}>Consumo Real</th>
                            <th style={{ textAlign: 'center', padding: '1rem', fontWeight: '800' }}>Saldo Atual</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="8" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>Calculando posições de estoque...</td></tr>
                        ) : filteredData.length === 0 ? (
                            <tr><td colSpan="8" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>Nenhum insumo encontrado no cadastro.</td></tr>
                        ) : (
                            filteredData.map(item => (
                                <tr
                                    key={item.id}
                                    style={{
                                        backgroundColor: '#ffffff',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                                        border: '1px solid rgba(0,0,0,0.04)',
                                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                    }}
                                >
                                    <td style={{ padding: '1.2rem 1rem', fontWeight: '800', color: 'var(--text)', borderRadius: '12px 0 0 12px' }}>
                                        {item.insumo}
                                    </td>
                                    <td style={{ padding: '1.2rem 1rem' }}>
                                        <span style={{
                                            padding: '0.4rem 0.8rem', borderRadius: '8px',
                                            background: '#f1f5f9', color: 'var(--text-muted)',
                                            fontSize: '0.8rem', fontWeight: '600'
                                        }}>
                                            {item.classificacao || '-'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1.2rem 1rem', textAlign: 'center', fontWeight: '700', color: '#64748b' }}>
                                        {item.saldo_inicial}
                                    </td>
                                    <td style={{ padding: '1.2rem 1rem', textAlign: 'center', fontWeight: '700', color: '#10b981' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                            <ArrowDownLeft size={14} /> {item.total_entradas}
                                        </div>
                                    </td>
                                    <td style={{ padding: '1.2rem 1rem', textAlign: 'center', fontWeight: '700', color: '#ef4444' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                            <ArrowUpRight size={14} /> {item.total_saidas}
                                        </div>
                                    </td>
                                    <td style={{ padding: '1.2rem 1rem', textAlign: 'center', fontWeight: '700', color: '#2563eb' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                            <ArrowDownLeft size={14} /> {item.total_devolucoes}
                                        </div>
                                    </td>
                                    <td style={{ padding: '1.2rem 1rem', textAlign: 'center', fontWeight: '700', color: '#f59e0b' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                            <Activity size={14} /> {item.consumo_real}
                                        </div>
                                    </td>
                                    <td style={{ padding: '1.2rem 1rem', textAlign: 'center', borderRadius: '0 12px 12px 0' }}>
                                        <div style={{
                                            display: 'inline-block',
                                            padding: '0.5rem 1rem',
                                            borderRadius: '10px',
                                            backgroundColor: item.saldo_atual > 0 ? '#ecfdf5' : '#fef2f2',
                                            color: item.saldo_atual > 0 ? '#059669' : '#dc2626',
                                            fontWeight: '900',
                                            fontSize: '1rem'
                                        }}>
                                            {item.saldo_atual}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Footer de Legenda */}
            <div style={{
                padding: '1rem 2rem',
                backgroundColor: 'white',
                borderTop: '1px solid rgba(0,0,0,0.06)',
                display: 'flex',
                justifyContent: 'flex-start',
                alignItems: 'center',
                gap: '2rem',
                color: 'var(--text-muted)',
                fontSize: '0.8rem',
                fontWeight: '600'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10b981' }} /> Entradas
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ef4444' }} /> Saídas
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#2563eb' }} /> Devoluções
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#f59e0b' }} /> Consumo
                </div>
            </div>
        </div>
    );
}
