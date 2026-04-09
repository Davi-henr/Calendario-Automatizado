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
    Package,
    ClipboardList,
    CheckCircle
} from 'lucide-react';
import { pedidosService, insumosService, entradasService, saidasService } from '../lib/services';
import { format, nextTuesday } from 'date-fns';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import emailjs from '@emailjs/browser'; 

export default function InventoryOrders({ subview = 'fazer', onNavigate }) {
    const [pedidos, setPedidos] = useState([]);
    const [insumos, setInsumos] = useState([]);
    const [stockMap, setStockMap] = useState({});
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    
    // Form state (Fazer Pedido)
    const [orderQuantities, setOrderQuantities] = useState({});

    // Form state (Edição Relatório)
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
    }, [subview]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [pedidosData, insumosData, entradasData, saidasData] = await Promise.all([
                pedidosService.getAll(),
                insumosService.getAll(),
                entradasService.getAll(),
                saidasService.getAll()
            ]);

            // TRAVA DE SEGURANÇA para números com vírgula
            const safeNum = (val) => {
                if (!val) return 0;
                const parsed = parseFloat(val.toString().replace(',', '.'));
                return isNaN(parsed) ? 0 : parsed;
            };

            // CORREÇÃO: Cálculo com ponto de corte do inventário e exclusão lógica (ativo !== false)
            const currentStock = {};
            insumosData.forEach(insumo => {
                const cutoffDate = insumo.data_saldo_inicial || '1970-01-01';

                const totalEntradas = entradasData
                    .filter(e => e.insumo_id === insumo.id && e.data_entrada >= cutoffDate)
                    .reduce((sum, e) => sum + safeNum(e.quantidade), 0);
                
                const validSaidas = saidasData.filter(s => 
                    s.insumo_id === insumo.id && 
                    s.ordens_saida?.ativo !== false && 
                    s.data_saida >= cutoffDate
                );

                const totalSaidas = validSaidas.reduce((sum, s) => sum + safeNum(s.quantidade), 0);
                const totalDevolucoes = validSaidas.reduce((sum, s) => sum + safeNum(s.devolucao), 0);
                
                const saldoInicial = safeNum(insumo.saldo_inicial);
                const consumoReal = totalSaidas - totalDevolucoes;
                
                let saldo = saldoInicial + totalEntradas - consumoReal;
                currentStock[insumo.id] = saldo % 1 === 0 ? saldo.toString() : saldo.toFixed(2);
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

    const handleQuantityChange = (insumoId, value) => {
        setOrderQuantities(prev => ({
            ...prev,
            [insumoId]: value
        }));
    };

    const handleBaixarPedido = async () => {
        const itemsToOrder = Object.entries(orderQuantities).filter(([id, qty]) => Number(qty) > 0);
        
        if (itemsToOrder.length === 0) {
            alert('Preencha a quantidade solicitada de pelo menos um insumo para baixar o pedido.');
            return;
        }

        if (window.confirm(`Confirmar e enviar o pedido de ${itemsToOrder.length} insumo(s)?`)) {
            try {
                // 1. Salvar no banco de dados primeiro
                for (const [id, qty] of itemsToOrder) {
                    await pedidosService.create({
                        insumo_id: id,
                        quantidade_solicitada: qty.replace(',', '.'),
                        status: 'Pendente'
                    });
                }

                // 2. Preparar dados para o E-mail
                const dataEntrega = nextTuesday(new Date()); // Acha a próxima terça-feira
                const dataEntregaCompleta = format(dataEntrega, 'dd/MM');
                const dataEntregaCurta = format(dataEntrega, 'dd/MM');

                // Montar as linhas da tabela HTML dinamicamente
                let tabelaHTML = `
                    <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-family: Arial, sans-serif;">
                        <thead>
                            <tr style="border-bottom: 2px solid #ccc; text-align: left;">
                                <th style="padding: 10px; font-size: 16px; color: #333;">DESCRIÇÃO</th>
                                <th style="padding: 10px; font-size: 16px; color: #333;">QUANTIDADE</th>
                            </tr>
                        </thead>
                        <tbody>
                `;

                itemsToOrder.forEach(([id, qty]) => {
                    const insumo = insumos.find(i => i.id === id);
                    const nomeProduto = insumo ? insumo.insumo : 'Produto Desconhecido';

                    tabelaHTML += `
                        <tr style="border-bottom: 1px solid #eee;">
                            <td style="padding: 10px; font-size: 15px; color: #444;">${nomeProduto}</td>
                            <td style="padding: 10px; font-size: 15px; color: #444;">${qty}</td>
                        </tr>
                    `;
                });

                tabelaHTML += `
                        </tbody>
                    </table>
                `;

                const templateParams = {
                    data_entrega_completa: dataEntregaCompleta,
                    data_entrega_curta: dataEntregaCurta,
                    tabela_produtos: tabelaHTML,
                    email: "vania.fvl@hotmail.com, fvl.financeiro@markbemcitrus.com.br, f.alegria@markbemcitrus.com.br"
                };

                // 3. Enviar o E-mail
                await emailjs.send('service_tybtcoc', 'template_digqj1d', templateParams, '7_OdWq1mfyUmAIhEc');

                setOrderQuantities({}); // ZERA OS CAMPOS APÓS BAIXAR O PEDIDO
                alert('Pedido registrado e enviado por e-mail com sucesso! Acompanhe-os no Relatório.');
                if (onNavigate) onNavigate('relatorio');

            } catch (err) {
                console.error(err);
                alert('O pedido foi salvo, mas houve um erro ao enviar o e-mail: ' + err.message);
            }
        }
    };

    const handleSaveEdit = async (e) => {
        e.preventDefault();
        try {
            await pedidosService.update(editingItem.id, formData);
            setShowForm(false);
            setEditingItem(null);
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

    // Gerador de PDF Profissional
    const handlePrint = () => {
        const doc = new jsPDF('p', 'mm', 'a4');
        const pw = doc.internal.pageSize.getWidth();
        
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        
        if (subview === 'fazer') {
            doc.text('Lista de Insumos - Sugestão de Pedidos', pw / 2, 15, { align: 'center' });
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, pw / 2, 22, { align: 'center' });

            const tableData = filteredInsumos.map(insumo => {
                const qty = orderQuantities[insumo.id] ? orderQuantities[insumo.id].toString() : '';
                return [
                    insumo.insumo,
                    insumo.classificacao || '-',
                    (stockMap[insumo.id] !== undefined ? stockMap[insumo.id].toString() : '0'),
                    qty
                ];
            });

            autoTable(doc, {
                startY: 30,
                head: [['Insumo', 'Classificação', 'Saldo Atual', 'Qtd Solicitada']],
                body: tableData,
                theme: 'grid',
                headStyles: { fillColor: [245, 158, 11] },
                styles: { fontSize: 9, cellPadding: 3 },
                columnStyles: {
                    2: { halign: 'center' },
                    3: { halign: 'center' }
                }
            });
            
            doc.save(`Sugestao_Pedidos_${format(new Date(), 'ddMMyyyy')}.pdf`);
        } else {
            doc.text('Relatório de Pedidos Pendentes', pw / 2, 15, { align: 'center' });
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, pw / 2, 22, { align: 'center' });

            const tableData = filteredPedidos.map(pedido => [
                pedido.insumos?.insumo || '-',
                pedido.created_at ? format(new Date(pedido.created_at), 'dd/MM/yyyy') : '-',
                pedido.quantidade_solicitada?.toString() || '0',
                pedido.status || '-'
            ]);

            autoTable(doc, {
                startY: 30,
                head: [['Insumo', 'Data do Pedido', 'Qtd Solicitada', 'Situação']],
                body: tableData,
                theme: 'grid',
                headStyles: { fillColor: [245, 158, 11] },
                styles: { fontSize: 9, cellPadding: 3 },
                columnStyles: {
                    2: { halign: 'center' },
                    3: { halign: 'center' }
                }
            });
            
            doc.save(`Relatorio_Pedidos_${format(new Date(), 'ddMMyyyy')}.pdf`);
        }
    };

    const filteredInsumos = insumos.filter(insumo => {
        const search = searchTerm.toLowerCase();
        return insumo.insumo?.toLowerCase().includes(search) || insumo.classificacao?.toLowerCase().includes(search);
    });

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
                        background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white'
                    }}>
                        {subview === 'fazer' ? <ShoppingCart size={24} /> : <ClipboardList size={24} />}
                    </div>
                    <div>
                        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: '900', color: 'var(--text)', fontSize: '1.4rem' }}>
                            {subview === 'fazer' ? 'Fazer Pedido' : 'Relatório de Pedidos'}
                        </h2>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600' }}>
                            {subview === 'fazer' ? 'Selecione os insumos e informe a quantidade solicitada' : 'Acompanhamento de insumos pendentes de entrega'}
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
                    {subview === 'fazer' && (
                        <button onClick={handlePrint} className="btn btn-outline" style={{ padding: '0.7rem 1.5rem', borderRadius: '12px' }}>
                            <Printer size={18} /> Imprimir Tabela
                        </button>
                    )}
                </div>
            </div>

            {/* Area da Tabela */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 2rem', backgroundColor: '#fafbfc' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>Carregando dados...</div>
                ) : subview === 'fazer' ? (
                    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                        <thead style={{ position: 'sticky', top: 0, zIndex: 5, backgroundColor: '#fafbfc' }}>
                            <tr style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1.5px' }}>
                                <th style={{ textAlign: 'left', padding: '1rem', fontWeight: '800' }}>Insumo</th>
                                <th style={{ textAlign: 'left', padding: '1rem', fontWeight: '800' }}>Classificação</th>
                                <th style={{ textAlign: 'center', padding: '1rem', fontWeight: '800' }}>Saldo Atual</th>
                                <th style={{ textAlign: 'center', padding: '1rem', fontWeight: '800' }}>Qtd Solicitada</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredInsumos.map(insumo => (
                                <tr key={insumo.id} style={{ backgroundColor: '#ffffff', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.04)' }}>
                                    <td style={{ padding: '0.8rem 1rem', fontWeight: '800', color: 'var(--text)', borderRadius: '12px 0 0 12px' }}>
                                        {insumo.insumo}
                                    </td>
                                    <td style={{ padding: '0.8rem 1rem' }}>
                                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{insumo.classificacao || '-'}</span>
                                    </td>
                                    <td style={{ padding: '0.8rem 1rem', textAlign: 'center', fontWeight: '700' }}>
                                        {stockMap[insumo.id] || 0}
                                    </td>
                                    <td style={{ padding: '0.6rem 1rem', textAlign: 'center', borderRadius: '0 12px 12px 0' }}>
                                        <input 
                                            type="number"
                                            placeholder="0"
                                            value={orderQuantities[insumo.id] || ''}
                                            onChange={e => handleQuantityChange(insumo.id, e.target.value)}
                                            style={{
                                                width: '100px', padding: '0.5rem', textAlign: 'center', fontWeight: '800',
                                                border: '2px solid #f8fafc', borderRadius: '8px', outline: 'none',
                                                backgroundColor: orderQuantities[insumo.id] ? '#fffbeb' : '#f8fafc',
                                                borderColor: orderQuantities[insumo.id] ? '#fcd34d' : '#f8fafc',
                                                color: orderQuantities[insumo.id] ? '#d97706' : 'var(--text)'
                                            }}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                        <thead style={{ position: 'sticky', top: 0, zIndex: 5, backgroundColor: '#fafbfc' }}>
                            <tr style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1.5px' }}>
                                <th style={{ textAlign: 'left', padding: '1rem', fontWeight: '800' }}>Insumo</th>
                                <th style={{ textAlign: 'left', padding: '1rem', fontWeight: '800' }}>Data do Pedido</th>
                                <th style={{ textAlign: 'center', padding: '1rem', fontWeight: '800' }}>Qtd Solicitada</th>
                                <th style={{ textAlign: 'center', padding: '1rem', fontWeight: '800' }}>Situação</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPedidos.length === 0 ? (
                                <tr><td colSpan="4" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>Nenhum pedido no histórico.</td></tr>
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
                                        <td style={{ padding: '1.2rem 1rem', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem' }}>
                                            {item.created_at ? format(new Date(item.created_at), 'dd/MM/yyyy') : '-'}
                                        </td>
                                        <td style={{ padding: '1.2rem 1rem', textAlign: 'center', fontWeight: '800', color: 'var(--primary)', fontSize: '1.1rem' }}>
                                            {item.quantidade_solicitada}
                                        </td>
                                        <td style={{ padding: '1.2rem 1rem', textAlign: 'center', borderRadius: '0 12px 12px 0' }}>
                                            <span style={{
                                                padding: '0.4rem 0.8rem', borderRadius: '8px',
                                                background: item.status === 'Concluído' ? '#ecfdf5' : '#fff7ed',
                                                color: item.status === 'Concluído' ? '#059669' : '#f59e0b',
                                                fontSize: '0.75rem', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '4px'
                                            }}>
                                                {item.status === 'Concluído' ? <CheckCircle size={14}/> : <ShoppingCart size={14}/>}
                                                {item.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Footer Fixo */}
            <div style={{
                padding: '1.5rem 2rem',
                backgroundColor: 'white',
                borderTop: '1px solid rgba(0,0,0,0.06)',
                display: 'flex',
                justifyContent: subview === 'fazer' ? 'flex-end' : 'space-between',
                alignItems: 'center'
            }}>
                {subview === 'fazer' ? (
                    <button onClick={handleBaixarPedido} className="btn btn-primary" style={{ padding: '0.8rem 2.5rem', background: '#f59e0b' }}>
                        <div className="btn-inner" style={{ fontSize: '1rem' }}><Save size={20} /> Baixar e Enviar Pedido</div>
                    </button>
                ) : (
                    <>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button onClick={handleEdit} disabled={!selectedId} className="btn btn-outline" style={{ opacity: !selectedId ? 0.3 : 1 }}>
                                <Edit2 size={18} /> Editar
                            </button>
                            <button onClick={handleDelete} disabled={!selectedId} className="btn btn-outline" style={{ color: '#ef4444', borderColor: '#fee2e2', opacity: !selectedId ? 0.3 : 1 }}>
                                <Trash2 size={18} /> Excluir
                            </button>
                        </div>
                        <button onClick={handlePrint} className="btn btn-secondary" style={{ padding: '0.8rem 2.5rem' }}>
                            <div className="btn-inner" style={{ fontSize: '1rem' }}><Printer size={20} /> Imprimir Relatório</div>
                        </button>
                    </>
                )}
            </div>

            {/* Modal de Edição (Apenas no Relatório) */}
            {showForm && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(8px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000
                }}>
                    <div className="premium-card" style={{ maxWidth: '500px', width: '90%', padding: '2.5rem' }}>
                        <div style={{ marginBottom: '2rem' }}>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                <Edit2 size={24} style={{ color: '#f59e0b' }} />
                                Editar Pedido
                            </h3>
                        </div>

                        <form onSubmit={handleSaveEdit}>
                            <div className="form-group" style={{ marginBottom: '1.2rem' }}>
                                <label style={{ fontWeight: '800', marginBottom: '0.5rem', display: 'block' }}>Insumo *</label>
                                <select className="input-field" value={formData.insumo_id} disabled>
                                    <option value={formData.insumo_id}>{editingItem?.insumos?.insumo}</option>
                                </select>
                            </div>

                            <div className="form-group" style={{ marginBottom: '1.2rem' }}>
                                <label style={{ fontWeight: '800', marginBottom: '0.5rem', display: 'block' }}>Qtd Solicitada *</label>
                                <input
                                    type="number" step="0.01" className="input-field"
                                    value={formData.quantidade_solicitada}
                                    onChange={e => setFormData({ ...formData, quantidade_solicitada: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-group" style={{ marginBottom: '2rem' }}>
                                <label style={{ fontWeight: '800', marginBottom: '0.5rem', display: 'block' }}>Situação</label>
                                <select className="input-field" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                                    <option value="Pendente">Pendente</option>
                                    <option value="Concluído">Concluído</option>
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
        </div>
    );
}
