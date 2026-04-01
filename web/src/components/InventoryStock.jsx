import React, { useState, useEffect } from 'react';
import {
    Search,
    Package,
    ArrowUpRight,
    ArrowDownLeft,
    Activity,
    Calendar,
    ClipboardCheck,
    Save,
    X
} from 'lucide-react';
import { insumosService, entradasService, saidasService } from '../lib/services';

export default function InventoryStock() {
    const todayStr = new Date().toISOString().split('T')[0];
    const [stockData, setStockData] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDate, setFilterDate] = useState(todayStr); // Novo: Filtro de data
    const [loading, setLoading] = useState(true);

    // Estados do Modal de Inventário
    const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
    const [inventoryDate, setInventoryDate] = useState(todayStr);
    const [inventoryCounts, setInventoryCounts] = useState({});
    const [savingInventory, setSavingInventory] = useState(false);

    useEffect(() => {
        fetchData();
    }, [filterDate]); // Refaz o cálculo quando a data do filtro muda

    const fetchData = async () => {
        try {
            setLoading(true);
            const [insumos, entradas, saidas] = await Promise.all([
                insumosService.getAll(),
                entradasService.getAll(),
                saidasService.getAll()
            ]);

            const safeNum = (val) => {
                if (!val) return 0;
                const parsed = parseFloat(val.toString().replace(',', '.'));
                return isNaN(parsed) ? 0 : parsed;
            };

            const consolidated = insumos.map(insumo => {
                // PONTO DE CORTE: Define a partir de quando as movimentações valem
                const cutoffDate = insumo.data_saldo_inicial || '1970-01-01';

                // Entradas válidas: Entre a data do saldo inicial e a data do filtro
                const totalEntradas = (entradas || [])
                    .filter(e => e.insumo_id === insumo.id && e.data_entrada >= cutoffDate && e.data_entrada <= filterDate)
                    .reduce((sum, e) => sum + safeNum(e.quantidade), 0);

                // Saídas e Devoluções válidas: Entre a data do saldo inicial e a data do filtro
                const validSaidas = (saidas || []).filter(s => 
                    s.insumo_id === insumo.id && 
                    s.ordens_saida?.ativo !== false && 
                    s.data_saida >= cutoffDate && 
                    s.data_saida <= filterDate
                );

                const totalSaidas = validSaidas.reduce((sum, s) => sum + safeNum(s.quantidade), 0);
                const totalDevolucoes = validSaidas.reduce((sum, s) => sum + safeNum(s.devolucao), 0);

                const saldoInicial = safeNum(insumo.saldo_inicial);
                const consumoReal = totalSaidas - totalDevolucoes;
                
                // Se a pessoa filtrar uma data ANTES do fechamento de estoque atual, o valor será impreciso
                // pois o saldo inicial foi sobrescrito no fechamento.
                const isBeforeCutoff = filterDate < cutoffDate;
                const saldoAtual = isBeforeCutoff ? 0 : saldoInicial + totalEntradas - consumoReal;

                return {
                    id: insumo.id,
                    insumo: insumo.insumo,
                    classificacao: insumo.classificacao,
                    saldo_inicial: parseFloat(saldoInicial.toFixed(2)),
                    data_saldo_inicial: insumo.data_saldo_inicial,
                    total_entradas: parseFloat(totalEntradas.toFixed(2)),
                    total_saidas: parseFloat(totalSaidas.toFixed(2)),
                    total_devolucoes: parseFloat(totalDevolucoes.toFixed(2)),
                    consumo_real: parseFloat(consumoReal.toFixed(2)),
                    saldo_atual: isBeforeCutoff ? 'N/A' : parseFloat(saldoAtual.toFixed(2)),
                    isBeforeCutoff
                };
            });

            setStockData(consolidated);
        } catch (error) {
            console.error('Error fetching stock data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenInventory = () => {
        // Pré-preenche o formulário de inventário com os saldos atuais para facilitar a digitação
        const currentCounts = {};
        stockData.forEach(item => {
            currentCounts[item.id] = item.saldo_atual !== 'N/A' ? item.saldo_atual : item.saldo_inicial;
        });
        setInventoryCounts(currentCounts);
        setInventoryDate(todayStr);
        setIsInventoryModalOpen(true);
    };

    const handleSaveInventory = async () => {
        if (!window.confirm("Atenção: Isso irá definir o novo Saldo Inicial destes produtos e ignorar as movimentações passadas. Confirma?")) {
            return;
        }

        try {
            setSavingInventory(true);
            
            // Salva o novo saldo inicial e a data de corte para CADA insumo
            for (const item of stockData) {
                const newCount = inventoryCounts[item.id];
                // Só atualiza se o usuário tiver mexido/confirmado o valor (evita sobrescrever nulos acidentalmente)
                if (newCount !== undefined && newCount !== '') {
                    await insumosService.update(item.id, {
                        saldo_inicial: parseFloat(newCount),
                        data_saldo_inicial: inventoryDate
                    });
                }
            }

            alert('Inventário baixado e saldos ajustados com sucesso!');
            setIsInventoryModalOpen(false);
            fetchData(); // Recarrega com a nova base
        } catch (error) {
            console.error('Erro ao baixar inventário:', error);
            alert('Falha ao processar inventário.');
        } finally {
            setSavingInventory(false);
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
            height: 'calc(100vh - 180px)', display: 'flex', flexDirection: 'column',
            backgroundColor: 'white', borderRadius: '24px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.05)',
            overflow: 'hidden', position: 'relative'
        }}>
            {/* Header Fixo */}
            <div style={{
                padding: '1.5rem 2rem', borderBottom: '1px solid rgba(0,0,0,0.06)',
                backgroundColor: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(10px)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10
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

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {/* Filtro de Data */}
                    <div style={{ display: 'flex', alignItems: 'center', background: '#f8fafc', padding: '0.4rem 0.8rem', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.1)' }}>
                        <Calendar size={16} style={{ color: 'var(--text-muted)', marginRight: '8px' }} />
                        <input
                            type="date"
                            value={filterDate}
                            onChange={(e) => setFilterDate(e.target.value)}
                            style={{ border: 'none', background: 'transparent', fontSize: '0.9rem', outline: 'none', color: 'var(--text)' }}
                        />
                    </div>

                    {/* Busca */}
                    <div style={{ position: 'relative', width: '250px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Buscar insumo..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%', padding: '0.6rem 1rem 0.6rem 2.8rem',
                                borderRadius: '10px', border: '1px solid rgba(0,0,0,0.1)',
                                fontSize: '0.9rem', outline: 'none', backgroundColor: '#f8fafc'
                            }}
                        />
                    </div>

                    {/* Botão Baixar Inventário */}
                    <button 
                        onClick={handleOpenInventory}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            padding: '0.6rem 1.2rem', backgroundColor: '#10b981', color: 'white',
                            border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)', transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                        onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                        <ClipboardCheck size={18} /> Baixar Inventário
                    </button>
                </div>
            </div>

            {/* Tabela de Estoque */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 2rem', backgroundColor: '#fafbfc' }}>
                <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                    <thead style={{ position: 'sticky', top: 0, zIndex: 5, backgroundColor: '#fafbfc' }}>
                        <tr style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1.5px' }}>
                            <th style={{ textAlign: 'left', padding: '1rem', fontWeight: '800' }}>Insumo</th>
                            <th style={{ textAlign: 'center', padding: '1rem', fontWeight: '800' }}>Saldo Base</th>
                            <th style={{ textAlign: 'center', padding: '1rem', fontWeight: '800' }}>Entradas</th>
                            <th style={{ textAlign: 'center', padding: '1rem', fontWeight: '800' }}>Saídas</th>
                            <th style={{ textAlign: 'center', padding: '1rem', fontWeight: '800' }}>Devoluções</th>
                            <th style={{ textAlign: 'center', padding: '1rem', fontWeight: '800' }}>Consumo</th>
                            <th style={{ textAlign: 'center', padding: '1rem', fontWeight: '800' }}>Saldo Atual</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="7" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>Calculando posições de estoque...</td></tr>
                        ) : filteredData.length === 0 ? (
                            <tr><td colSpan="7" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>Nenhum insumo encontrado.</td></tr>
                        ) : (
                            filteredData.map(item => (
                                <tr key={item.id} style={{
                                    backgroundColor: '#ffffff', boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                                    border: '1px solid rgba(0,0,0,0.04)', opacity: item.isBeforeCutoff ? 0.6 : 1
                                }}>
                                    <td style={{ padding: '1.2rem 1rem', fontWeight: '800', color: 'var(--text)', borderRadius: '12px 0 0 12px' }}>
                                        {item.insumo}
                                        {item.data_saldo_inicial && (
                                            <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 'normal', marginTop: '4px' }}>
                                                Fechado em: {new Date(item.data_saldo_inicial + 'T00:00:00').toLocaleDateString()}
                                            </div>
                                        )}
                                    </td>
                                    <td style={{ padding: '1.2rem 1rem', textAlign: 'center', fontWeight: '700', color: '#64748b' }}>
                                        {item.saldo_inicial}
                                    </td>
                                    <td style={{ padding: '1.2rem 1rem', textAlign: 'center', fontWeight: '700', color: '#10b981' }}>
                                        {item.isBeforeCutoff ? '-' : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}><ArrowDownLeft size={14} /> {item.total_entradas}</div>}
                                    </td>
                                    <td style={{ padding: '1.2rem 1rem', textAlign: 'center', fontWeight: '700', color: '#ef4444' }}>
                                        {item.isBeforeCutoff ? '-' : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}><ArrowUpRight size={14} /> {item.total_saidas}</div>}
                                    </td>
                                    <td style={{ padding: '1.2rem 1rem', textAlign: 'center', fontWeight: '700', color: '#2563eb' }}>
                                        {item.isBeforeCutoff ? '-' : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}><ArrowDownLeft size={14} /> {item.total_devolucoes}</div>}
                                    </td>
                                    <td style={{ padding: '1.2rem 1rem', textAlign: 'center', fontWeight: '700', color: '#f59e0b' }}>
                                        {item.isBeforeCutoff ? '-' : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}><Activity size={14} /> {item.consumo_real}</div>}
                                    </td>
                                    <td style={{ padding: '1.2rem 1rem', textAlign: 'center', borderRadius: '0 12px 12px 0' }}>
                                        <div style={{
                                            display: 'inline-block', padding: '0.5rem 1rem', borderRadius: '10px',
                                            backgroundColor: item.saldo_atual === 'N/A' ? '#f1f5f9' : (item.saldo_atual > 0 ? '#ecfdf5' : '#fef2f2'),
                                            color: item.saldo_atual === 'N/A' ? '#64748b' : (item.saldo_atual > 0 ? '#059669' : '#dc2626'),
                                            fontWeight: '900', fontSize: '1rem'
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

            {/* Modal de Lançamento de Inventário */}
            {isInventoryModalOpen && (
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
                    display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 50
                }}>
                    <div style={{
                        backgroundColor: 'white', borderRadius: '24px', width: '90%', maxWidth: '800px',
                        maxHeight: '90vh', display: 'flex', flexDirection: 'column',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                    }}>
                        <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h2 style={{ fontSize: '1.4rem', fontWeight: '900', color: 'var(--text)' }}>Baixar Inventário (Fechamento)</h2>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Defina o novo saldo físico para travar a base a partir desta data.</p>
                            </div>
                            <button onClick={() => setIsInventoryModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                                <X size={24} />
                            </button>
                        </div>

                        <div style={{ padding: '1rem 2rem', backgroundColor: '#f8fafc', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: 'var(--text)', marginBottom: '8px' }}>Data da Contagem Física:</label>
                            <input 
                                type="date" 
                                value={inventoryDate}
                                onChange={(e) => setInventoryDate(e.target.value)}
                                style={{ padding: '0.8rem 1rem', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.1)', fontSize: '1rem', width: '200px' }}
                            />
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 2rem' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'left', borderBottom: '2px solid #f1f5f9' }}>
                                        <th style={{ paddingBottom: '0.5rem' }}>Insumo</th>
                                        <th style={{ paddingBottom: '0.5rem', textAlign: 'center' }}>Saldo Físico Contado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stockData.map((item) => (
                                        <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={{ padding: '0.8rem 0', fontWeight: '700', color: 'var(--text)' }}>{item.insumo}</td>
                                            <td style={{ padding: '0.8rem 0', textAlign: 'center' }}>
                                                <input 
                                                    type="number"
                                                    step="0.01"
                                                    value={inventoryCounts[item.id] !== undefined ? inventoryCounts[item.id] : ''}
                                                    onChange={(e) => setInventoryCounts({...inventoryCounts, [item.id]: e.target.value})}
                                                    style={{ 
                                                        width: '120px', padding: '0.5rem', borderRadius: '8px', 
                                                        border: '1px solid #cbd5e1', textAlign: 'center', fontSize: '1rem',
                                                        fontWeight: '700', color: '#0f172a'
                                                    }}
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div style={{ padding: '1.5rem 2rem', borderTop: '1px solid rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'flex-end', gap: '1rem', backgroundColor: '#fafbfc', borderRadius: '0 0 24px 24px' }}>
                            <button 
                                onClick={() => setIsInventoryModalOpen(false)}
                                style={{ padding: '0.8rem 1.5rem', background: 'transparent', border: '1px solid #cbd5e1', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', color: 'var(--text-muted)' }}
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={handleSaveInventory}
                                disabled={savingInventory}
                                style={{ 
                                    padding: '0.8rem 1.5rem', background: 'var(--primary)', color: 'white', 
                                    border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', gap: '8px', opacity: savingInventory ? 0.7 : 1 
                                }}
                            >
                                <Save size={18} /> {savingInventory ? 'Salvando...' : 'Aplicar Fechamento'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
