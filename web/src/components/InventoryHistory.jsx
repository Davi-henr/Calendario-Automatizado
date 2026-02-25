import React, { useState, useEffect } from 'react';
import {
    History,
    Search,
    ArrowUpRight,
    Map,
    Activity,
    Calendar,
    Filter,
    Edit3,
    CheckCircle2,
    Trash2,
    X,
    Save,
    Calculator,
    AlertTriangle,
    CheckCircle,
    Info,
    Truck,
    Clock,
    ClipboardList
} from 'lucide-react';
import { saidasService, ordensSaidaService, quadrasService, atividadesService, insumosService } from '../lib/services';
import { format } from 'date-fns';

export default function InventoryHistory({ subview }) {
    const [saidas, setSaidas] = useState([]);
    const [ordens, setOrdens] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal states
    const [editingOrder, setEditingOrder] = useState(null);
    const [checkingOrder, setCheckingOrder] = useState(null);

    useEffect(() => {
        fetchData();
    }, [subview]);

    const fetchData = async () => {
        try {
            setLoading(true);
            if (subview === 'geral') {
                const data = await saidasService.getAll();
                setSaidas(data);
            } else {
                const data = await ordensSaidaService.getAll();
                setOrdens(data);
            }
        } catch (error) {
            console.error('Error fetching history:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteOrder = async (id) => {
        if (!confirm('Tem certeza que deseja excluir esta Ordem de Saída? Todos os itens vinculados serão removidos.')) return;
        try {
            await ordensSaidaService.delete(id);
            fetchData();
        } catch (error) {
            alert('Erro ao excluir: ' + error.message);
        }
    };

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Carregando histórico...</div>;

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
            {/* Header */}
            <div style={{
                padding: '1.5rem 2rem', borderBottom: '1px solid rgba(0,0,0,0.06)',
                backgroundColor: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(10px)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                        width: '48px', height: '48px', borderRadius: '14px',
                        background: 'linear-gradient(135deg, #ef4444, #b91c1c)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white'
                    }}>
                        <History size={24} />
                    </div>
                    <div>
                        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: '900', color: 'var(--text)', fontSize: '1.4rem' }}>
                            {subview === 'geral' ? 'Histórico Geral de Saídas' : 'Histórico por Receita'}
                        </h2>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600' }}>
                            {subview === 'geral' ? 'Listagem individual de cada item retirado' : 'Gestão de ordens e conferência de devolução'}
                        </span>
                    </div>
                </div>

                <div style={{ position: 'relative', width: '350px' }}>
                    <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                        type="text"
                        placeholder="Buscar..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%', padding: '0.7rem 1rem 0.7rem 2.8rem',
                            borderRadius: '12px', border: '1px solid rgba(0,0,0,0.1)',
                            fontSize: '0.9rem', outline: 'none', backgroundColor: '#f8fafc'
                        }}
                    />
                </div>
            </div>

            {/* List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 2rem', backgroundColor: '#fafbfc' }}>
                {subview === 'geral' ? (
                    <GeneralView saidas={saidas} searchTerm={searchTerm} />
                ) : (
                    <RecipeView
                        ordens={ordens}
                        searchTerm={searchTerm}
                        onEdit={setEditingOrder}
                        onCheck={setCheckingOrder}
                        onDelete={handleDeleteOrder}
                    />
                )}
            </div>

            {/* Modals */}
            {editingOrder && (
                <OrderModal
                    order={editingOrder}
                    onClose={() => setEditingOrder(null)}
                    onSave={fetchData}
                    mode="edit"
                />
            )}
            {checkingOrder && (
                <OrderModal
                    order={checkingOrder}
                    onClose={() => setCheckingOrder(null)}
                    onSave={fetchData}
                    mode="check"
                />
            )}
        </div>
    );
}

function GeneralView({ saidas, searchTerm }) {
    const filtered = saidas.filter(s => {
        const search = searchTerm.toLowerCase();
        return (
            s.insumos?.insumo?.toLowerCase().includes(search) ||
            s.quadras?.nome?.toLowerCase().includes(search) ||
            s.ordens_saida?.numero_receita?.toLowerCase().includes(search)
        );
    });

    return (
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 5, backgroundColor: '#fafbfc' }}>
                <tr style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    <th style={{ textAlign: 'left', padding: '1rem' }}>Data</th>
                    <th style={{ textAlign: 'left', padding: '1rem' }}>Receita</th>
                    <th style={{ textAlign: 'left', padding: '1rem' }}>Insumo</th>
                    <th style={{ textAlign: 'center', padding: '1rem' }}>Saída</th>
                    <th style={{ textAlign: 'center', padding: '1rem' }}>Devolução</th>
                    <th style={{ textAlign: 'center', padding: '1rem' }}>Turno</th>
                    <th style={{ textAlign: 'center', padding: '1rem' }}>Carreta</th>
                    <th style={{ textAlign: 'left', padding: '1rem' }}>Quadra</th>
                </tr>
            </thead>
            <tbody>
                {filtered.map(s => (
                    <tr key={s.id} style={{ backgroundColor: '#ffffff', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                        <td style={{ padding: '1rem', fontWeight: '800', borderRadius: '12px 0 0 12px' }}>{format(new Date(s.data_saida + 'T00:00:00'), 'dd/MM/yyyy')}</td>
                        <td style={{ padding: '1rem', fontWeight: '700' }}>{s.ordens_saida?.numero_receita || '-'}</td>
                        <td style={{ padding: '1rem', fontWeight: '800', color: 'var(--primary)' }}>{s.insumos?.insumo}</td>
                        <td style={{ padding: '1rem', textAlign: 'center', fontWeight: '800', color: '#ef4444' }}>{s.quantidade}</td>
                        <td style={{ padding: '1rem', textAlign: 'center', fontWeight: '800', color: '#10b981' }}>{s.devolucao || 0}</td>
                        <td style={{ padding: '1rem', textAlign: 'center' }}>{s.ordens_saida?.turno}</td>
                        <td style={{ padding: '1rem', textAlign: 'center' }}>{s.ordens_saida?.numero_carreta}</td>
                        <td style={{ padding: '1rem', borderRadius: '0 12px 12px 0' }}>{s.quadras?.nome}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

function RecipeView({ ordens, searchTerm, onEdit, onCheck, onDelete }) {
    const filtered = ordens.filter(o => {
        const search = searchTerm.toLowerCase();
        return (
            o.numero_receita?.toLowerCase().includes(search) ||
            o.quadras?.nome?.toLowerCase().includes(search) ||
            o.atividades?.nome?.toLowerCase().includes(search)
        );
    });

    return (
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 5, backgroundColor: '#fafbfc' }}>
                <tr style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    <th style={{ textAlign: 'left', padding: '1rem' }}>Data</th>
                    <th style={{ textAlign: 'left', padding: '1rem' }}>N° Receita</th>
                    <th style={{ textAlign: 'left', padding: '1rem' }}>Atividade</th>
                    <th style={{ textAlign: 'left', padding: '1rem' }}>Quadra</th>
                    <th style={{ textAlign: 'center', padding: '1rem' }}>Situação</th>
                    <th style={{ textAlign: 'right', padding: '1rem' }}>Ações</th>
                </tr>
            </thead>
            <tbody>
                {filtered.map(o => (
                    <tr key={o.id} style={{ backgroundColor: '#ffffff', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                        <td style={{ padding: '1rem', fontWeight: '800', borderRadius: '12px 0 0 12px' }}>{format(new Date(o.data + 'T00:00:00'), 'dd/MM/yyyy')}</td>
                        <td style={{ padding: '1rem', fontWeight: '700' }}>{o.numero_receita}</td>
                        <td style={{ padding: '1rem' }}>{o.atividades?.nome}</td>
                        <td style={{ padding: '1rem', fontWeight: '700' }}>{o.quadras?.nome}</td>
                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                            <span style={{
                                padding: '0.4rem 0.8rem', borderRadius: '10px', fontSize: '0.75rem', fontWeight: '800',
                                backgroundColor: o.situacao === 'Conferida' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                color: o.situacao === 'Conferida' ? '#10b981' : '#ef4444'
                            }}>
                                {o.situacao}
                            </span>
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'right', borderRadius: '0 12px 12px 0' }}>
                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                <button onClick={() => onEdit(o)} className="btn btn-mini" style={{ color: 'var(--primary)' }} title="Editar">
                                    <div className="btn-inner"><Edit3 size={16} /></div>
                                </button>
                                <button onClick={() => onCheck(o)} className="btn btn-mini" style={{ color: '#10b981' }} title="Conferir">
                                    <div className="btn-inner"><CheckCircle2 size={16} /></div>
                                </button>
                                <button onClick={() => onDelete(o.id)} className="btn btn-mini" style={{ color: '#ef4444' }} title="Excluir">
                                    <div className="btn-inner"><Trash2 size={16} /></div>
                                </button>
                            </div>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

function OrderModal({ order, onClose, onSave, mode }) {
    const [header, setHeader] = useState({ ...order });
    const [items, setItems] = useState([...order.saidas]);
    const [quadras, setQuadras] = useState([]);
    const [atividades, setAtividades] = useState([]);

    useEffect(() => {
        fetchMeta();
    }, []);

    const fetchMeta = async () => {
        const [q, a] = await Promise.all([quadrasService.getAll(), atividadesService.getAll()]);
        setQuadras(q);
        setAtividades(a);
    };

    const handleSave = async () => {
        try {
            const headerUpdates = {
                data: header.data,
                turno: header.turno,
                quantidade_bombas: header.quantidade_bombas,
                bombas_aplicadas: header.bombas_aplicadas,
                numero_receita: header.numero_receita,
                numero_carreta: header.numero_carreta,
                atividade_id: header.atividade_id,
                quadra_id: header.quadra_id,
                observacao: header.observacao,
                situacao: mode === 'check' ? 'Conferida' : header.situacao
            };

            // Calculate divergence observations during check
            const itemsWithObs = items.map(item => {
                if (mode === 'check') {
                    const bombasAplicadas = parseFloat(header.bombas_aplicadas) || 0;
                    const predictedReturn = (parseFloat(item.quantidade) - (bombasAplicadas * parseFloat(item.dosagem))).toFixed(2);
                    const actualReturn = parseFloat(item.devolucao) || 0;

                    let obs = '';
                    if (actualReturn != predictedReturn) {
                        obs = `Divergência: Esperado ${predictedReturn}, recebido ${actualReturn}`;
                    }
                    return { ...item, observacao_divergencia: obs };
                }
                return item;
            });

            await ordensSaidaService.update(order.id, headerUpdates, itemsWithObs);
            alert('Sucesso!');
            onSave();
            onClose();
        } catch (error) {
            alert('Erro: ' + error.message);
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '2rem'
        }}>
            <div className="premium-card" style={{ maxWidth: '1000px', width: '100%', padding: '2.5rem', backgroundColor: 'white', borderRadius: '28px', maxHeight: '90vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                        {mode === 'edit' ? <Edit3 size={24} /> : <CheckCircle2 size={24} />}
                        {mode === 'edit' ? 'Editar Ordem de Saída' : 'Conferir Devolução'}
                    </h3>
                    <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', cursor: 'pointer', borderRadius: '50%', width: '40px', height: '40px' }}><X size={20} /></button>
                </div>

                {/* Header Fields */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
                    <div className="form-group">
                        <label style={{ fontSize: '0.75rem', fontWeight: '800' }}>Data</label>
                        <input type="date" value={header.data} readOnly={mode === 'check'} onChange={e => setHeader({ ...header, data: e.target.value })} className="input-field" />
                    </div>
                    <div className="form-group">
                        <label style={{ fontSize: '0.75rem', fontWeight: '800' }}>Receita</label>
                        <input type="text" value={header.numero_receita} readOnly={mode === 'check'} onChange={e => setHeader({ ...header, numero_receita: e.target.value })} className="input-field" />
                    </div>
                    <div className="form-group">
                        <label style={{ fontSize: '0.75rem', fontWeight: '800' }}>Quadra</label>
                        <select value={header.quadra_id} disabled={mode === 'check'} onChange={e => setHeader({ ...header, quadra_id: e.target.value })} className="input-field">
                            {quadras.map(q => <option key={q.id} value={q.id}>{q.nome}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label style={{ fontSize: '0.75rem', fontWeight: '800' }}>Qtde Bombas Prevista</label>
                        <input type="number" value={header.quantidade_bombas} readOnly={mode === 'check'} className="input-field" />
                    </div>

                    <div className="form-group">
                        <label style={{ fontSize: '0.75rem', fontWeight: '800', color: mode === 'check' ? 'var(--primary)' : 'inherit' }}>Qtde Bombas Aplicada</label>
                        <input
                            type="number"
                            value={header.bombas_aplicadas}
                            onChange={e => setHeader({ ...header, bombas_aplicadas: e.target.value })}
                            className="input-field"
                            style={mode === 'check' ? { border: '2px solid var(--primary)', backgroundColor: 'rgba(239, 68, 68, 0.05)' } : {}}
                        />
                    </div>
                </div>

                <div style={{ marginBottom: '2rem' }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: '900', marginBottom: '1rem', color: 'var(--text)' }}>Itens da Receita</h4>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ borderBottom: '2px solid #f1f5f9' }}>
                            <tr style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'left' }}>
                                <th style={{ padding: '0.8rem' }}>Insumo</th>
                                <th style={{ padding: '0.8rem' }}>Dosagem</th>
                                <th style={{ padding: '0.8rem' }}>Qtd Retirada</th>
                                {mode === 'check' && <th style={{ padding: '0.8rem' }}>Devolução Prevista</th>}
                                <th style={{ padding: '0.8rem' }}>Devolução</th>
                                {mode === 'check' && <th style={{ padding: '0.8rem' }}>Divergência</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item, idx) => {
                                const bombasAplicadas = parseFloat(header.bombas_aplicadas || 0);
                                const predictedReturn = (parseFloat(item.quantidade) - (bombasAplicadas * parseFloat(item.dosagem))).toFixed(2);
                                const isDivergent = mode === 'check' && (parseFloat(item.devolucao || 0) != predictedReturn);

                                return (
                                    <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '0.8rem', fontWeight: '800' }}>{item.insumos?.insumo}</td>
                                        <td style={{ padding: '0.8rem' }}>
                                            <input
                                                type="text"
                                                value={item.dosagem}
                                                readOnly={mode === 'check'}
                                                onChange={e => {
                                                    const newItems = [...items];
                                                    newItems[idx].dosagem = e.target.value.replace(',', '.');
                                                    setItems(newItems);
                                                }}
                                                className="input-field" style={{ width: '60px', padding: '0.3rem' }}
                                            />
                                        </td>
                                        <td style={{ padding: '0.8rem' }}>
                                            <input
                                                type="text"
                                                value={item.quantidade}
                                                readOnly={mode === 'check'}
                                                onChange={e => {
                                                    const newItems = [...items];
                                                    newItems[idx].quantidade = e.target.value.replace(',', '.');
                                                    setItems(newItems);
                                                }}
                                                className="input-field" style={{ width: '80px', padding: '0.3rem' }}
                                            />
                                        </td>
                                        {mode === 'check' && (
                                            <td style={{ padding: '0.8rem', fontWeight: '800', color: 'var(--info)' }}>
                                                {predictedReturn}
                                            </td>
                                        )}
                                        <td style={{ padding: '0.8rem' }}>
                                            <input
                                                type="text"
                                                value={item.devolucao}
                                                onChange={e => {
                                                    const newItems = [...items];
                                                    newItems[idx].devolucao = e.target.value.replace(',', '.');
                                                    setItems(newItems);
                                                }}
                                                className="input-field"
                                                style={{ width: '80px', padding: '0.3rem', border: mode === 'check' ? '2px solid #10b981' : '1px solid #e2e8f0' }}
                                            />
                                        </td>
                                        {mode === 'check' && (
                                            <td style={{ padding: '0.8rem' }}>
                                                {isDivergent ? (
                                                    <div style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem' }}>
                                                        <AlertTriangle size={14} /> Divergente
                                                    </div>
                                                ) : (
                                                    <div style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem' }}>
                                                        <CheckCircle size={14} /> Ok
                                                    </div>
                                                )}
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                    <button onClick={onClose} className="btn btn-outline"><div className="btn-inner">Cancelar</div></button>
                    <button onClick={handleSave} className="btn btn-primary" style={{ background: mode === 'check' ? '#10b981' : 'var(--primary)' }}>
                        <div className="btn-inner">
                            <Save size={18} /> {mode === 'edit' ? 'Salvar Alterações' : 'Concluir Conferência'}
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
}
