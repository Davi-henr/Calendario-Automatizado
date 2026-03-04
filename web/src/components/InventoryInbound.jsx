import React, { useState, useEffect } from 'react';
import {
    Plus,
    Trash2,
    Edit2,
    Save,
    X,
    Search,
    PlusCircle,
    Calendar,
    User,
    Package,
    AlertCircle,
    Filter,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import { entradasService, insumosService, pedidosService } from '../lib/services';
import { format } from 'date-fns';

export default function InventoryInbound() {
    const [entradas, setEntradas] = useState([]);
    const [insumos, setInsumos] = useState([]);
    const [pendingPedidos, setPendingPedidos] = useState([]); // NOVO
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [showOrderLookup, setShowOrderLookup] = useState(false); // NOVO
    const [editingItem, setEditingItem] = useState(null);
    const [selectedId, setSelectedId] = useState(null);
    
    const [formData, setFormData] = useState({
        data_entrada: format(new Date(), 'yyyy-MM-dd'),
        insumo_id: '',
        quantidade: '',
        validade: '',
        fornecedor: '',
        nf: '',
        pedido_id: null // NOVO: Para vincular ao pedido do Relatório
    });

    useEffect(() => {
        fetchData();
        fetchInsumos();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [data, pData] = await Promise.all([
                entradasService.getAll(),
                pedidosService.getAll() // Busca pedidos para achar os pendentes
            ]);
            setEntradas(data);
            setPendingPedidos(pData.filter(p => p.status === 'Pendente'));
        } catch (error) {
            console.error('Error fetching entries:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchInsumos = async () => {
        try {
            const data = await insumosService.getAll();
            setInsumos(data);
        } catch (error) {
            console.error('Error fetching status items:', error);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            // Extraímos o pedido_id para não enviar para a tabela entradas
            const { pedido_id, ...dataToSave } = formData;

            if (editingItem) {
                await entradasService.update(editingItem.id, dataToSave);
            } else {
                await entradasService.create(dataToSave);
                
                // NOVO: Se escolheu da lupa, dá baixa no Relatório de Pedidos
                if (pedido_id) {
                    await pedidosService.update(pedido_id, { status: 'Concluído' });
                }
            }
            setShowForm(false);
            setEditingItem(null);
            setFormData({
                data_entrada: format(new Date(), 'yyyy-MM-dd'),
                insumo_id: '',
                quantidade: '',
                validade: '',
                fornecedor: '',
                nf: '',
                pedido_id: null
            });
            fetchData();
        } catch (error) {
            alert('Erro ao salvar: ' + error.message);
        }
    };

    const handleEdit = () => {
        if (!selectedId) return;
        const item = entradas.find(i => i.id === selectedId);
        if (item) {
            setEditingItem(item);
            setFormData({
                data_entrada: item.data_entrada,
                insumo_id: item.insumo_id,
                quantidade: item.quantidade,
                validade: item.validade || '',
                fornecedor: item.fornecedor || '',
                nf: item.nf || '',
                pedido_id: null
            });
            setShowForm(true);
        }
    };

    const handleDelete = async () => {
        if (!selectedId) return;
        if (window.confirm('Tem certeza que deseja excluir esta entrada?')) {
            try {
                await entradasService.delete(selectedId);
                setSelectedId(null);
                fetchData();
            } catch (error) {
                alert('Erro ao excluir: ' + error.message);
            }
        }
    };

    const filteredEntradas = entradas.filter(entrada => {
        const search = searchTerm.toLowerCase();
        const insumoNome = entrada.insumos?.insumo?.toLowerCase() || '';
        const fornecedor = entrada.fornecedor?.toLowerCase() || '';
        return insumoNome.includes(search) || fornecedor.includes(search);
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
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white'
                    }}>
                        <PlusCircle size={24} />
                    </div>
                    <div>
                        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: '900', color: 'var(--text)', fontSize: '1.4rem' }}>
                            Entradas de Estoque
                        </h2>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600' }}>
                            {filteredEntradas.length} registros encontrados
                        </span>
                    </div>
                </div>

                <div style={{ position: 'relative', width: '350px' }}>
                    <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                        type="text"
                        placeholder="Buscar por insumo ou fornecedor..."
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

            {/* Tabela com Scroll */}
            <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '1rem 2rem',
                backgroundColor: '#fafbfc'
            }}>
                <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                    <thead style={{ position: 'sticky', top: 0, zIndex: 5, backgroundColor: '#fafbfc' }}>
                        <tr style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1.5px' }}>
                            <th style={{ textAlign: 'left', padding: '1rem', fontWeight: '800' }}>Data</th>
                            <th style={{ textAlign: 'left', padding: '1rem', fontWeight: '800' }}>Insumo</th>
                            <th style={{ textAlign: 'left', padding: '1rem', fontWeight: '800' }}>NF</th>
                            <th style={{ textAlign: 'left', padding: '1rem', fontWeight: '800' }}>Qtd</th>
                            <th style={{ textAlign: 'left', padding: '1rem', fontWeight: '800' }}>Validade</th>
                            <th style={{ textAlign: 'left', padding: '1rem', fontWeight: '800' }}>Fornecedor</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="5" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>Carregando registros...</td></tr>
                        ) : filteredEntradas.length === 0 ? (
                            <tr><td colSpan="5" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>Nenhuma entrada encontrada.</td></tr>
                        ) : (
                            filteredEntradas.map(item => (
                                <tr
                                    key={item.id}
                                    onClick={() => setSelectedId(item.id)}
                                    style={{
                                        backgroundColor: selectedId === item.id ? 'white' : '#ffffff',
                                        boxShadow: selectedId === item.id ? '0 4px 15px rgba(16, 185, 129, 0.15)' : '0 2px 4px rgba(0,0,0,0.02)',
                                        border: selectedId === item.id ? '2px solid #10b981' : '1px solid rgba(0,0,0,0.04)',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                    }}
                                >
                                    <td style={{ padding: '1.2rem 1rem', fontWeight: '800', color: 'var(--text)', borderRadius: '12px 0 0 12px' }}>
                                        {format(new Date(item.data_entrada + 'T00:00:00'), 'dd/MM/yyyy')}
                                    </td>
                                    <td style={{ padding: '1.2rem 1rem', fontWeight: '700', color: 'var(--primary)' }}>
                                        {item.insumos?.insumo}
                                    </td>
                                    <td style={{ padding: '1.2rem 1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                        {item.nf || '-'}
                                    </td>
                                    <td style={{ padding: '1.2rem 1rem', fontWeight: '800', color: '#10b981' }}>
                                        {item.quantidade}
                                    </td>
                                    <td style={{ padding: '1.2rem 1rem', color: 'var(--text-muted)' }}>
                                        {item.validade ? format(new Date(item.validade + 'T00:00:00'), 'dd/MM/yyyy') : '-'}
                                    </td>
                                    <td style={{ padding: '1.2rem 1rem', color: 'var(--text-muted)', fontSize: '0.9rem', borderRadius: '0 12px 12px 0' }}>
                                        {item.fornecedor || '-'}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Footer com Ações */}
            <div style={{
                padding: '1.5rem 2rem',
                backgroundColor: 'white',
                borderTop: '1px solid rgba(0,0,0,0.06)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: '0 -4px 15px rgba(0,0,0,0.02)'
            }}>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button onClick={() => { setEditingItem(null); setShowForm(true); setShowOrderLookup(false); }} className="btn btn-primary" style={{ padding: '0.8rem 2.5rem', borderRadius: '14px', background: '#10b981' }}>
                        <div className="btn-inner" style={{ fontSize: '0.95rem', fontWeight: '800' }}><Plus size={20} /> Inserir Entrada</div>
                    </button>
                    <button
                        onClick={handleEdit}
                        disabled={!selectedId}
                        className="btn btn-outline"
                        style={{ padding: '0.8rem 2rem', borderRadius: '14px', opacity: !selectedId ? 0.3 : 1 }}
                    >
                        <div className="btn-inner" style={{ fontSize: '0.95rem', fontWeight: '800' }}><Edit2 size={18} /> Editar</div>
                    </button>
                    <button
                        onClick={handleDelete}
                        disabled={!selectedId}
                        className="btn btn-outline"
                        style={{ padding: '0.8rem 2rem', borderRadius: '14px', color: '#ef4444', borderColor: '#fee2e2', opacity: !selectedId ? 0.3 : 1 }}
                    >
                        <div className="btn-inner" style={{ fontSize: '0.95rem', fontWeight: '800' }}><Trash2 size={18} /> Excluir</div>
                    </button>
                </div>

                {!selectedId && (
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Filter size={16} />
                        Selecione um registro para editar ou excluir
                    </div>
                )}
            </div>

            {/* Modal de Formulário */}
            {showForm && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(8px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '2rem'
                }}>
                    <div className="premium-card" style={{
                        maxWidth: '600px', width: '100%', padding: '2.5rem',
                        position: 'relative', backgroundColor: 'white', borderRadius: '28px'
                    }}>
                        <button onClick={() => setShowForm(false)} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: '#f1f5f9', border: 'none', cursor: 'pointer', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <X size={20} />
                        </button>

                        <div style={{ marginBottom: '2rem' }}>
                            <h3 style={{ fontSize: '1.8rem', fontWeight: '900', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                <PlusCircle size={28} style={{ color: '#10b981' }} />
                                {editingItem ? 'Editar Entrada' : 'Nova Entrada de Estoque'}
                            </h3>
                            <p style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Preencha os detalhes da nota ou carregamento.</p>
                        </div>

                        <form onSubmit={handleSave} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem' }}>
                            
                            {/* NOVO: LUPA DE PEDIDOS PENDENTES */}
                            {!editingItem && (
                                <div className="form-group" style={{ gridColumn: '1 / -1', marginBottom: '0.5rem' }}>
                                    <button type="button" onClick={() => setShowOrderLookup(!showOrderLookup)} className="btn btn-outline" style={{ width: '100%', justifyContent: 'space-between', padding: '0.8rem 1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <Search size={18} color="var(--primary)" />
                                            <span style={{ fontWeight: '800', color: 'var(--primary)' }}>Puxar Insumo Pendente de Entrega</span>
                                        </div>
                                        {showOrderLookup ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                    </button>

                                    {showOrderLookup && (
                                        <div style={{ marginTop: '0.5rem', padding: '1rem', border: '1px solid var(--primary)', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.05)', display: 'grid', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto' }}>
                                            {pendingPedidos.length === 0 ? (
                                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>Nenhum pedido pendente.</div>
                                            ) : (
                                                pendingPedidos.map(p => (
                                                    <div key={p.id} onClick={() => {
                                                        setFormData({ ...formData, insumo_id: p.insumo_id, quantidade: p.quantidade_solicitada, pedido_id: p.id });
                                                        setShowOrderLookup(false);
                                                    }} style={{ padding: '0.8rem 1rem', background: 'white', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.08)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.2s' }}
                                                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                                                    onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(0,0,0,0.08)'}>
                                                        <div>
                                                            <div style={{ fontWeight: '900', fontSize: '0.9rem', color: 'var(--text)' }}>{p.insumos?.insumo}</div>
                                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '600' }}>Pedido de {p.created_at ? format(new Date(p.created_at), 'dd/MM/yy') : '-'}</div>
                                                        </div>
                                                        <span style={{ color: 'white', background: '#f59e0b', padding: '0.2rem 0.6rem', borderRadius: '6px', fontWeight: '900', fontSize: '0.85rem' }}>{p.quantidade_solicitada} aguardando</span>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="form-group">
                                <label style={{ color: 'var(--text)', fontWeight: '800', fontSize: '0.85rem', marginBottom: '0.5rem', display: 'block' }}>Data de Entrada *</label>
                                <input
                                    type="date"
                                    className="input-field"
                                    value={formData.data_entrada}
                                    onChange={e => setFormData({ ...formData, data_entrada: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label style={{ color: 'var(--text)', fontWeight: '800', fontSize: '0.85rem', marginBottom: '0.5rem', display: 'block' }}>Insumo *</label>
                                <select
                                    className="input-field"
                                    value={formData.insumo_id}
                                    onChange={e => setFormData({ ...formData, insumo_id: e.target.value })}
                                    required
                                    style={{ width: '100%', padding: '0.9rem' }}
                                >
                                    <option value="">Selecione um insumo...</option>
                                    {insumos.map(insumo => (
                                        <option key={insumo.id} value={insumo.id}>{insumo.insumo}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label style={{ color: 'var(--text)', fontWeight: '800', fontSize: '0.85rem', marginBottom: '0.5rem', display: 'block' }}>Quantidade *</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="input-field"
                                    placeholder="0.00"
                                    value={formData.quantidade}
                                    onChange={e => setFormData({ ...formData, quantidade: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label style={{ color: 'var(--text)', fontWeight: '800', fontSize: '0.85rem', marginBottom: '0.5rem', display: 'block' }}>Data de Validade</label>
                                <input
                                    type="date"
                                    className="input-field"
                                    value={formData.validade}
                                    onChange={e => setFormData({ ...formData, validade: e.target.value })}
                                />
                            </div>

                            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                <label style={{ color: 'var(--text)', fontWeight: '800', fontSize: '0.85rem', marginBottom: '0.5rem', display: 'block' }}>Fornecedor</label>
                                <div style={{ position: 'relative' }}>
                                    <User size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                    <input
                                        type="text"
                                        className="input-field"
                                        style={{ paddingLeft: '2.8rem' }}
                                        placeholder="Nome do fornecedor"
                                        value={formData.fornecedor}
                                        onChange={e => setFormData({ ...formData, fornecedor: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label style={{ color: 'var(--text)', fontWeight: '800', fontSize: '0.85rem', marginBottom: '0.5rem', display: 'block' }}>NF (Nota Fiscal)</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="Ex: 000.123"
                                    value={formData.nf}
                                    onChange={e => setFormData({ ...formData, nf: e.target.value })}
                                />
                            </div>

                            <div style={{ gridColumn: '1 / -1', marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: '1rem', borderRadius: '14px', background: '#10b981' }}>
                                    <div className="btn-inner" style={{ fontSize: '1.1rem', fontWeight: '900' }}><Save size={22} /> Salvar Entrada</div>
                                </button>
                                <button type="button" onClick={() => setShowForm(false)} className="btn btn-outline" style={{ flex: 1, padding: '1rem', borderRadius: '14px' }}>
                                    <div className="btn-inner" style={{ fontSize: '1.1rem', fontWeight: '900' }}><X size={22} /> Cancelar</div>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
