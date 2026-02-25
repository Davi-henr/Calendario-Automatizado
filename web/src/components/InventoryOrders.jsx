import React, { useState, useEffect } from 'react';
import {
    ShoppingCart,
    Plus,
    Search,
    Printer,
    Edit2,
    Trash2,
    Save,
    X,
    Filter,
    Package
} from 'lucide-react';
import { pedidosService, insumosService, entradasService, saidasService } from '../lib/services';
import { format } from 'date-fns';

export default function InventoryOrders() {
    const [pedidos, setPedidos] = useState([]);
    const [insumos, setInsumos] = useState([]);
    const [stockMap, setStockMap] = useState({});
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [selectedId, setSelectedId] = useState(null);
    const [formData, setFormData] = useState({
        insumo_id: '',
        quantidade_solicitada: '',
        status: 'Pendente'
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [pedidosData, insumosData, entradasData, saidasData] = await Promise.all([
                pedidosService.getAll(),
                insumosService.getAll(),
                entradasService.getAll(),
                saidasService.getAll()
            ]);

            // Calculate current stock map
            const currentStock = {};
            insumosData.forEach(insumo => {
                const entradas = entradasData
                    .filter(e => e.insumo_id === insumo.id)
                    .reduce((sum, e) => sum + Number(e.quantidade), 0);
                const saidas = saidasData
                    .filter(s => s.insumo_id === insumo.id)
                    .reduce((sum, s) => sum + Number(s.quantidade), 0);
                currentStock[insumo.id] = Number(insumo.saldo_inicial || 0) + entradas - saidas;
            });

            setPedidos(pedidosData);
            setInsumos(insumosData);
            setStockMap(currentStock);
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (editingItem) {
                await pedidosService.update(editingItem.id, formData);
            } else {
                await pedidosService.create(formData);
            }
            setShowForm(false);
            setEditingItem(null);
            setFormData({ insumo_id: '', quantidade_solicitada: '', status: 'Pendente' });
            fetchData();
        } catch (error) {
            alert('Erro ao salvar: ' + error.message);
        }
    };

    const handleEdit = () => {
        if (!selectedId) return;
        const item = pedidos.find(i => i.id === selectedId);
        if (item) {
            setEditingItem(item);
            setFormData({
                insumo_id: item.insumo_id,
                quantidade_solicitada: item.quantidade_solicitada,
                status: item.status
            });
            setShowForm(true);
        }
    };

    const handleDelete = async () => {
        if (!selectedId) return;
        if (window.confirm('Excluir este pedido?')) {
            try {
                await pedidosService.delete(selectedId);
                setSelectedId(null);
                fetchData();
            } catch (error) {
                alert('Erro ao excluir: ' + error.message);
            }
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const filteredPedidos = pedidos.filter(pedido => {
        const search = searchTerm.toLowerCase();
        return pedido.insumos?.insumo?.toLowerCase().includes(search);
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
            <div className="no-print" style={{
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
                        background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white'
                    }}>
                        <ShoppingCart size={24} />
                    </div>
                    <div>
                        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: '900', color: 'var(--text)', fontSize: '1.4rem' }}>
                            Sugestão de Pedidos
                        </h2>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600' }}>
                            Gestão de compras de insumos
                        </span>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ position: 'relative', width: '250px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Buscar insumo..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%', padding: '0.7rem 1rem 0.7rem 2.8rem',
                                borderRadius: '12px', border: '1px solid rgba(0,0,0,0.1)',
                                fontSize: '0.9rem', outline: 'none', backgroundColor: '#f8fafc'
                            }}
                        />
                    </div>
                    <button onClick={handlePrint} className="btn btn-outline" style={{ padding: '0.7rem 1.5rem', borderRadius: '12px' }}>
                        <Printer size={18} /> Imprimir PDF
                    </button>
                </div>
            </div>

            {/* Tabela de Pedidos */}
            <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '1rem 2rem',
                backgroundColor: '#fafbfc'
            }}>
                {/* Cabeçalho de Impressão (Só aparece no Print) */}
                <div className="print-only" style={{ display: 'none', textAlign: 'center', marginBottom: '2rem' }}>
                    <h1 style={{ fontWeight: '900', color: '#111' }}>Sugestão de Pedidos de Insumos</h1>
                    <p>Relatório gerado em {format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
                    <hr style={{ margin: '1rem 0', borderColor: '#eee' }} />
                </div>

                <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                    <thead style={{ position: 'sticky', top: 0, zIndex: 5, backgroundColor: '#fafbfc' }}>
                        <tr style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1.5px' }}>
                            <th style={{ textAlign: 'left', padding: '1rem', fontWeight: '800' }}>Insumo</th>
                            <th style={{ textAlign: 'left', padding: '1rem', fontWeight: '800' }}>Classificação</th>
                            <th style={{ textAlign: 'center', padding: '1rem', fontWeight: '800' }}>Saldo Atual</th>
                            <th style={{ textAlign: 'center', padding: '1rem', fontWeight: '800' }}>Qtd Solicitada</th>
                            <th style={{ textAlign: 'center', padding: '1rem', fontWeight: '800' }}>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="5" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>Buscando pedidos...</td></tr>
                        ) : filteredPedidos.length === 0 ? (
                            <tr><td colSpan="5" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>Nenhum pedido pendente.</td></tr>
                        ) : (
                            filteredPedidos.map(item => (
                                <tr
                                    key={item.id}
                                    onClick={() => setSelectedId(item.id)}
                                    style={{
                                        backgroundColor: selectedId === item.id ? 'white' : '#ffffff',
                                        boxShadow: selectedId === item.id ? '0 4px 15px rgba(245, 158, 11, 0.15)' : '0 2px 4px rgba(0,0,0,0.02)',
                                        border: selectedId === item.id ? '2px solid #f59e0b' : '1px solid rgba(0,0,0,0.04)',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                    }}
                                >
                                    <td style={{ padding: '1.2rem 1rem', fontWeight: '800', color: 'var(--text)', borderRadius: '12px 0 0 12px' }}>
                                        {item.insumos?.insumo}
                                    </td>
                                    <td style={{ padding: '1.2rem 1rem' }}>
                                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                            {item.insumos?.classificacao || '-'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1.2rem 1rem', textAlign: 'center', fontWeight: '700' }}>
                                        {stockMap[item.insumo_id] || 0}
                                    </td>
                                    <td style={{ padding: '1.2rem 1rem', textAlign: 'center', fontWeight: '800', color: 'var(--primary)', fontSize: '1.1rem' }}>
                                        {item.quantidade_solicitada}
                                    </td>
                                    <td style={{ padding: '1.2rem 1rem', textAlign: 'center', borderRadius: '0 12px 12px 0' }}>
                                        <span style={{
                                            padding: '0.4rem 0.8rem', borderRadius: '8px',
                                            background: item.status === 'Pedido' ? '#ecfdf5' : '#fff7ed',
                                            color: item.status === 'Pedido' ? '#059669' : '#f59e0b',
                                            fontSize: '0.75rem', fontWeight: '800'
                                        }}>
                                            {item.status}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Footer Fixo */}
            <div className="no-print" style={{
                padding: '1.5rem 2rem',
                backgroundColor: 'white',
                borderTop: '1px solid rgba(0,0,0,0.06)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button onClick={() => { setEditingItem(null); setShowForm(true); }} className="btn btn-primary" style={{ padding: '0.8rem 2.5rem', background: '#f59e0b' }}>
                        <Plus size={20} /> Novo Pedido
                    </button>
                    <button onClick={handleEdit} disabled={!selectedId} className="btn btn-outline" style={{ opacity: !selectedId ? 0.3 : 1 }}>
                        <Edit2 size={18} /> Editar
                    </button>
                    <button onClick={handleDelete} disabled={!selectedId} className="btn btn-outline" style={{ color: '#ef4444', borderColor: '#fee2e2', opacity: !selectedId ? 0.3 : 1 }}>
                        <Trash2 size={18} /> Excluir
                    </button>
                </div>
            </div>

            {/* Modal de Formulário */}
            {showForm && (
                <div className="no-print" style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(8px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000
                }}>
                    <div className="premium-card" style={{ maxWidth: '500px', width: '90%', padding: '2.5rem' }}>
                        <div style={{ marginBottom: '2rem' }}>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                <ShoppingCart size={24} style={{ color: '#f59e0b' }} />
                                {editingItem ? 'Editar Pedido' : 'Sugestão de Pedido'}
                            </h3>
                        </div>

                        <form onSubmit={handleSave}>
                            <div className="form-group" style={{ marginBottom: '1.2rem' }}>
                                <label style={{ fontWeight: '800', marginBottom: '0.5rem', display: 'block' }}>Insumo *</label>
                                <select
                                    className="input-field"
                                    value={formData.insumo_id}
                                    onChange={e => setFormData({ ...formData, insumo_id: e.target.value })}
                                    required
                                >
                                    <option value="">Selecione...</option>
                                    {insumos.map(insumo => (
                                        <option key={insumo.id} value={insumo.id}>{insumo.insumo}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group" style={{ marginBottom: '1.2rem' }}>
                                <label style={{ fontWeight: '800', marginBottom: '0.5rem', display: 'block' }}>Qtd Sugerida/Solicitada *</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="input-field"
                                    value={formData.quantidade_solicitada}
                                    onChange={e => setFormData({ ...formData, quantidade_solicitada: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-group" style={{ marginBottom: '2rem' }}>
                                <label style={{ fontWeight: '800', marginBottom: '0.5rem', display: 'block' }}>Status</label>
                                <select
                                    className="input-field"
                                    value={formData.status}
                                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                                >
                                    <option value="Pendente">Pendente</option>
                                    <option value="Pedido">Já Pedido</option>
                                    <option value="Cotando">Cotando</option>
                                </select>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1, background: '#f59e0b' }}>Salvar</button>
                                <button type="button" onClick={() => setShowForm(false)} className="btn btn-outline" style={{ flex: 1 }}>Cancelar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    .print-only { display: block !important; }
                    body { background: white !important; }
                    .container { width: 100% !important; max-width: none !important; padding: 0 !important; }
                    table { border: 1px solid #eee !important; width: 100% !important; }
                    th, td { border: 1px solid #eee !important; padding: 10px !important; }
                }
            `}</style>
        </div>
    );
}
