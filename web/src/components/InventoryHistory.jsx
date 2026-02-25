import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
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
    ClipboardList,
    Printer
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { saidasService, ordensSaidaService, quadrasService, atividadesService, insumosService, osService, settingsService } from '../lib/services';
import { format } from 'date-fns';

export default function InventoryHistory({ subview }) {
    const [saidas, setSaidas] = useState([]);
    const [ordens, setOrdens] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [logo, setLogo] = useState(null);

    // Modal states
    const [editingOrder, setEditingOrder] = useState(null);
    const [checkingOrder, setCheckingOrder] = useState(null);

    useEffect(() => {
        fetchData();
        settingsService.get().then(s => setLogo(s.logo_url));
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

    const handlePrintOrder = (order) => {
        const doc = new jsPDF('p', 'mm', 'a4');
        const pw = doc.internal.pageSize.getWidth();
        const ph = doc.internal.pageSize.getHeight();

        doc.setFont('helvetica', 'bold');
        doc.setLineWidth(0.3);

        // Header Title Box
        doc.rect(5, 5, pw - 10, 12);
        if (logo) {
            try { doc.addImage(logo, 'PNG', 7, 6.5, 18, 9); } catch (e) { }
        }
        doc.setFontSize(14);
        doc.text('ORDEM DE SAIDA DE DEFENSIVOS AGRICOLA', pw / 2 + 10, 12.5, { align: 'center' });

        doc.setFontSize(8);
        let currentY = 17;
        const rowH = 7;

        // Row 1: Data, Turno, Qtd Bombas
        doc.rect(5, currentY, 50, rowH);
        doc.text('DATA:', 7, currentY + 4.5);
        doc.setFont('helvetica', 'normal');
        doc.text(order.data ? format(new Date(order.data + 'T00:00:00'), 'dd/MM/yyyy') : '', 20, currentY + 4.5);

        doc.rect(55, currentY, 50, rowH);
        doc.setFont('helvetica', 'bold');
        doc.text('TURNO:', 57, currentY + 4.5);
        doc.setFont('helvetica', 'normal');
        doc.text(order.turno || '', 72, currentY + 4.5);

        doc.rect(105, currentY, pw - 110, rowH);
        doc.setFont('helvetica', 'bold');
        doc.text('Qtd. Bombas:', 107, currentY + 4.5);
        doc.setFont('helvetica', 'normal');
        doc.text(`${order.quantidade_bombas?.toString() || ''} BOMBAS`, 130, currentY + 4.5);

        currentY += rowH;

        // Row 2: Carreta, Quadra, Operação, Receita
        doc.rect(5, currentY, 40, rowH);
        doc.setFont('helvetica', 'bold');
        doc.text('CARRETA N°:', 7, currentY + 4.5);
        doc.setFont('helvetica', 'normal');
        doc.text(order.numero_carreta || '', 25, currentY + 4.5);

        doc.rect(45, currentY, 40, rowH);
        doc.setFont('helvetica', 'bold');
        doc.text('QUADRA:', 47, currentY + 4.5);
        doc.setFont('helvetica', 'normal');
        doc.text(order.quadras?.nome || '', 62, currentY + 4.5);

        doc.rect(85, currentY, 80, rowH);
        doc.setFont('helvetica', 'bold');
        doc.text('OPERAÇÃO:', 87, currentY + 4.5);
        doc.setFont('helvetica', 'normal');
        doc.text(order.atividades?.nome || '', 107, currentY + 4.5);

        doc.rect(165, currentY, pw - 170, rowH);
        doc.setFont('helvetica', 'bold');
        doc.text('N° RECEITA:', 167, currentY + 4.5);
        doc.setFont('helvetica', 'normal');
        doc.text(order.numero_receita || '', 188, currentY + 4.5);

        currentY += rowH;

        // Subheader Note
        doc.rect(5, currentY, pw - 10, 5);
        doc.setFontSize(6);
        doc.setFont('helvetica', 'bold');
        doc.text('DEVOUÇÃO AO ESTOQUE | TRANSFERENCIA DE LOTE', 7, currentY + 3.5);
        doc.setFont('helvetica', 'normal');
        doc.text('ESTOQUE (  )  QUADRA: ___________  N° ___________', pw - 15, currentY + 3.5, { align: 'right' });

        currentY += 5;

        const tableBody = [];
        const items = order.saidas || [];
        const checkContent = '( ) Conforme\n( ) Não Conforme';
        for (let i = 0; i < 8; i++) {
            const it = items[i];
            tableBody.push([
                it ? it.insumos?.insumo : '',
                it ? it.dosagem?.toString().replace('.', ',') : '',
                it ? it.quantidade?.toString().replace('.', ',') : '',
                '', // Sobra
                checkContent,
                '', // Qtd Lacrada 2
                '', // Qtd Sobra 2
                checkContent
            ]);
        }

        autoTable(doc, {
            startY: currentY,
            head: [['Insumo', 'Dosagem', 'Qtd Lacrada', 'Qtd Sobra', 'Conferido', 'Qtd Lacrada', 'Qtd Sobra', 'Situação']],
            body: tableBody,
            theme: 'grid',
            styles: { fontSize: 9, halign: 'center', cellPadding: 1, lineWidth: 0.1, lineColor: 0, minCellHeight: 8 },
            headStyles: { fillColor: 245, textColor: 0, fontStyle: 'bold', lineWidth: 0.1, fontSize: 8 },
            columnStyles: {
                0: { halign: 'left', cellWidth: 45 },
                1: { cellWidth: 15 },
                2: { cellWidth: 20 },
                3: { cellWidth: 20 },
                4: { cellWidth: 25, fontSize: 5, halign: 'left' },
                5: { cellWidth: 20 },
                6: { cellWidth: 20 },
                7: { cellWidth: 25, fontSize: 5, halign: 'left' }
            },
            margin: { left: 5, right: 5 }
        });

        const finalY = doc.lastAutoTable.finalY + 3;

        // Obs
        doc.rect(5, finalY, 70, 18);
        doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.text('OBSERVAÇÃO:', 7, finalY + 4);
        doc.setFont('helvetica', 'normal');
        doc.text(order.observacao || '', 7, finalY + 8, { maxWidth: 65 });

        // Signatures
        const sigY = finalY + 14;
        doc.line(80, sigY, 115, sigY); doc.text('Administrador:', 80, sigY + 3.5);
        doc.line(120, sigY, 155, sigY); doc.text('Encarregado:', 120, sigY + 3.5);
        doc.line(160, sigY, pw - 5, sigY); doc.text('Almoxarife:', 160, sigY + 3.5);

        doc.setFontSize(5.5);
        doc.text('LEMBRETE: ESSA ORDEM DE SERVIÇO SÓ TERÁ DUAS VIAS, DEVERÁ SER GRAMPEADA JUNTO À RECEITA DE TRATAMENTO. NÃO PODENDO SER EXTRAVIADA.', 5, finalY + 23, { maxWidth: pw - 10 });

        doc.save(`Ordem_Saida_${order.data}.pdf`);
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
                        onPrint={handlePrintOrder}
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
                        <td style={{ padding: '1rem', textAlign: 'center', fontWeight: '800', color: '#10b981' }}>
                            {s.devolucao || 0}
                            {s.ordens_saida?.observacao?.includes(s.insumos?.insumo) && s.ordens_saida?.observacao?.includes('transferida') && (
                                <div style={{ fontSize: '0.65rem', color: 'var(--info)', fontWeight: '700', marginTop: '4px' }}>
                                    {s.ordens_saida.observacao.split('\n').find(l => l.includes(s.insumos?.insumo) && l.includes('transferida'))?.split('p/')[1]?.trim()}
                                </div>
                            )}
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'center' }}>{s.ordens_saida?.turno}</td>
                        <td style={{ padding: '1rem', textAlign: 'center' }}>{s.ordens_saida?.numero_carreta}</td>
                        <td style={{ padding: '1rem', borderRadius: '0 12px 12px 0' }}>{s.quadras?.nome}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

function RecipeView({ ordens, searchTerm, onEdit, onCheck, onDelete, onPrint }) {
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
                                <button onClick={() => onPrint(o)} className="btn btn-mini" style={{ color: 'var(--info)' }} title="Imprimir">
                                    <div className="btn-inner"><Printer size={16} /></div>
                                </button>
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
    const [targetOS, setTargetOS] = useState(null);
    const [itemDestinations, setItemDestinations] = useState({}); // { itemId: 'estoque' | 'transfer' }
    const [pendingOS, setPendingOS] = useState([]);
    const [showLookup, setShowLookup] = useState(false);
    const [osSearchTerm, setOsSearchTerm] = useState('');

    useEffect(() => {
        fetchMeta();
    }, []);

    const fetchMeta = async () => {
        const [q, a, pos] = await Promise.all([
            quadrasService.getAll(),
            atividadesService.getAll(),
            osService.getPending()
        ]);
        setQuadras(q);
        setAtividades(a);
        setPendingOS(pos);
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

            const itemsWithObs = items.map(item => {
                const bAplicadas = parseFloat(header.bombas_aplicadas || 0);
                const predictedReturn = (parseFloat(item.quantidade) - (bAplicadas * parseFloat(item.dosagem))).toFixed(2);
                const actualReturn = parseFloat(item.devolucao || 0);

                let obs = '';
                if (mode === 'check' && actualReturn != predictedReturn) {
                    obs = `Divergência: Esperado ${predictedReturn}, recebido ${actualReturn}`;
                }
                return { ...item, observacao_divergencia: obs };
            });

            // Traceability: Log transfer destination in source header
            let observationPrefix = header.observacao || '';
            const transferItems = items.filter(it => (itemDestinations[it.id] === 'transfer') && parseFloat(it.devolucao || 0) > 0);

            if (transferItems.length > 0 && targetOS) {
                const targetRecipeNo = `${format(new Date(targetOS.data_prescricao + 'T00:00:00'), 'yy')}/${targetOS.numero_os.toString().padStart(6, '0')}`;
                const transferNote = `\n[Sobra transferida p/ Receita ${targetRecipeNo} na Quadra ${targetOS.quadra}]`;
                if (!observationPrefix.includes(transferNote)) {
                    headerUpdates.observacao = observationPrefix + transferNote;
                }
            }

            await ordensSaidaService.update(order.id, headerUpdates, itemsWithObs);

            // REFINED AUTO-TRANSFER LOGIC (Granular & Robust)
            if (mode === 'check' && Object.values(itemDestinations).includes('transfer')) {
                if (!targetOS) {
                    throw new Error('Você selecionou transferência para uma quadra, mas não vinculou a receita de destino.');
                }

                const targetQId = quadras.find(q =>
                    q.nome?.toString().trim().toLowerCase() === targetOS.quadra?.toString().trim().toLowerCase()
                )?.id || header.quadra_id;

                const targetAId = atividades.find(at =>
                    at.nome?.trim().toLowerCase() === targetOS.operacao?.trim().toLowerCase()
                )?.id || header.atividade_id;

                // Target Recipe Number (Standardized)
                const targetRecipeNo = `${format(new Date(targetOS.data_prescricao + 'T00:00:00'), 'yy')}/${targetOS.numero_os.toString().padStart(6, '0')}`;

                for (const item of items) {
                    const destination = itemDestinations[item.id] || 'estoque';
                    const amountToTransfer = parseFloat(item.devolucao || 0);

                    if (destination === 'transfer' && amountToTransfer > 0) {
                        try {
                            const transferItemNote = `\n- ${item.insumos?.insumo}: ${amountToTransfer} unidades transferidas p/ Receita ${targetRecipeNo} (Quadra ${targetOS.quadra})`;
                            if (!headerUpdates.observacao.includes(transferItemNote)) {
                                headerUpdates.observacao += transferItemNote;
                            }

                            // 1. Search for existing unconfirmed saidas for this Product + OS ID
                            const { data: existingSaidas, error: searchError } = await supabase
                                .from('saidas')
                                .select('*, ordens_saida!inner(id, os_id, situacao)')
                                .eq('insumo_id', item.insumo_id)
                                .eq('ordens_saida.os_id', targetOS.id)
                                .neq('ordens_saida.situacao', 'Conferida');

                            if (searchError) throw searchError;

                            if (existingSaidas && existingSaidas.length > 0) {
                                // 2. Update existing saida
                                const targetSaida = existingSaidas[0];
                                const newQty = parseFloat(targetSaida.quantidade || 0) + amountToTransfer;
                                await saidasService.update(targetSaida.id, { quantidade: newQty });
                            } else {
                                // 3. Check if there's any unconfirmed Ordem de Saída for this OS ID
                                const { data: existingOrdens, error: oError } = await supabase
                                    .from('ordens_saida')
                                    .select('id')
                                    .eq('os_id', targetOS.id)
                                    .neq('situacao', 'Conferida')
                                    .limit(1);

                                if (oError) throw oError;

                                if (existingOrdens && existingOrdens.length > 0) {
                                    // 4. Append to existing Ordem de Saída
                                    const newItem = {
                                        insumo_id: item.insumo_id,
                                        dosagem: item.dosagem,
                                        quantidade: amountToTransfer,
                                        ordem_saida_id: existingOrdens[0].id,
                                        data_saida: format(new Date(), 'yyyy-MM-dd'),
                                        quadra_id: targetQId,
                                        atividade_id: targetAId
                                    };
                                    await saidasService.create(newItem);
                                } else {
                                    // 5. Create new header + item
                                    const newHeader = {
                                        data: format(new Date(), 'yyyy-MM-dd'),
                                        turno: header.turno,
                                        quantidade_bombas: targetOS.quantidade_bombas || 0,
                                        numero_carreta: header.numero_carreta,
                                        os_id: targetOS.id,
                                        quadra_id: targetQId,
                                        atividade_id: targetAId,
                                        numero_receita: targetRecipeNo,
                                        observacao: `Recebido por transferência da Receita #[${header.numero_receita}]`,
                                        situacao: 'Pendente'
                                    };
                                    const newItem = {
                                        insumo_id: item.insumo_id,
                                        dosagem: item.dosagem,
                                        quantidade: amountToTransfer
                                    };
                                    await ordensSaidaService.create(newHeader, [newItem]);
                                }
                            }
                        } catch (transferErr) {
                            console.error('Transfer failed for item:', item.insumos?.insumo, transferErr);
                        }
                    }
                }
            }

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

                {mode === 'check' && (
                    <div style={{ padding: '1.2rem', backgroundColor: '#f8fafc', borderRadius: '16px', marginBottom: '2rem', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                < Truck size={20} style={{ color: 'var(--primary)' }} />
                                <h4 style={{ fontSize: '0.9rem', fontWeight: '900', color: 'var(--text)' }}>Vincular Quadra de Destino</h4>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end', animation: 'fadeIn 0.3s ease' }}>
                            <div style={{ flex: 1, position: 'relative' }}>
                                <label style={{ fontSize: '0.7rem', fontWeight: '800', display: 'block', marginBottom: '4px' }}>Buscar Receita Pendente</label>
                                <div style={{ position: 'relative' }}>
                                    <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                    <input
                                        type="text"
                                        placeholder="N° Receita ou Quadra..."
                                        value={osSearchTerm}
                                        onChange={e => {
                                            setOsSearchTerm(e.target.value);
                                            setShowLookup(true);
                                        }}
                                        onFocus={() => setShowLookup(true)}
                                        className="input-field"
                                        style={{ paddingLeft: '2.5rem' }}
                                    />
                                </div>

                                {showLookup && (
                                    <div style={{
                                        position: 'absolute', top: '100%', left: 0, width: '100%', zIndex: 100,
                                        backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                                        border: '1px solid #e2e8f0', marginTop: '5px', maxHeight: '200px', overflowY: 'auto'
                                    }}>
                                        {pendingOS.filter(os => {
                                            const recipeNo = `${format(new Date(os.data_prescricao + 'T00:00:00'), 'yy')}/${os.numero_os.toString().padStart(6, '0')}`;
                                            return (
                                                recipeNo.includes(osSearchTerm) ||
                                                os.numero_os?.toString().includes(osSearchTerm) ||
                                                os.quadra?.toString().toLowerCase().includes(osSearchTerm.toLowerCase())
                                            );
                                        }).map(os => {
                                            const recipeNo = `${format(new Date(os.data_prescricao + 'T00:00:00'), 'yy')}/${os.numero_os.toString().padStart(6, '0')}`;
                                            const unconfirmedOrders = os.ordens_saida?.filter(o => o.situacao !== 'Conferida') || [];
                                            const hasUnconfirmed = unconfirmedOrders.length > 0;
                                            const productList = os.insumos?.map(i => i.material || i.insumo).join(', ') || 'Nenhum insumo';

                                            return (
                                                <div
                                                    key={os.id}
                                                    onClick={() => {
                                                        setTargetOS(os);
                                                        setOsSearchTerm(recipeNo);
                                                        setShowLookup(false);
                                                    }}
                                                    style={{
                                                        padding: '1rem', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem',
                                                        borderLeft: `6px solid ${hasUnconfirmed ? '#10b981' : '#ef4444'}`,
                                                        backgroundColor: hasUnconfirmed ? 'rgba(16, 185, 129, 0.02)' : 'rgba(239, 68, 68, 0.02)'
                                                    }}
                                                    onMouseEnter={e => e.currentTarget.style.backgroundColor = hasUnconfirmed ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.05)'}
                                                    onMouseLeave={e => e.currentTarget.style.backgroundColor = hasUnconfirmed ? 'rgba(16, 185, 129, 0.02)' : 'rgba(239, 68, 68, 0.02)'}
                                                >
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                                                        <span><strong>{recipeNo}</strong> - Quadra: {os.quadra}</span>
                                                        <span style={{
                                                            fontSize: '0.65rem', fontWeight: '900', padding: '2px 6px', borderRadius: '4px',
                                                            backgroundColor: hasUnconfirmed ? '#10b981' : '#ef4444', color: 'white'
                                                        }}>
                                                            {hasUnconfirmed ? 'SAÍDA LANÇADA' : 'SEM SAÍDA'}
                                                        </span>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                        <span style={{ fontWeight: '700' }}>{os.operacao}</span>
                                                        <span style={{ opacity: 0.3 }}>|</span>
                                                        <span style={{
                                                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '300px'
                                                        }} title={productList}>
                                                            {productList}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {targetOS && (
                                <div style={{ flex: 1, padding: '0.8rem', backgroundColor: 'rgba(16, 185, 129, 0.05)', borderRadius: '10px', border: '1px dashed #10b981' }}>
                                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: '800', marginBottom: '2px' }}>VINCULADO AO DESTINO</div>
                                    <div style={{ fontSize: '0.85rem', fontWeight: '900', color: '#10b981' }}>
                                        Receita {`${format(new Date(targetOS.data_prescricao + 'T00:00:00'), 'yy')}/${targetOS.numero_os.toString().padStart(6, '0')}`} | Quadra {targetOS.quadra}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

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
                                {mode === 'check' && <th style={{ padding: '0.8rem' }}>Destino Sobra</th>}
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
                                            {mode === 'check' && header.situacao === 'Conferida' && header.observacao?.includes(item.insumos?.insumo) && (
                                                <div style={{ fontSize: '0.6rem', color: 'var(--info)', marginTop: '4px', maxWidth: '100px' }}>
                                                    {header.observacao.split('\n').find(l => l.includes(item.insumos?.insumo) && l.includes('transferida'))?.split('p/')[1]?.trim()}
                                                </div>
                                            )}
                                        </td>
                                        {mode === 'check' && (
                                            <td style={{ padding: '0.8rem' }}>
                                                <div style={{ display: 'flex', gap: '4px', backgroundColor: '#f1f5f9', padding: '4px', borderRadius: '8px' }}>
                                                    <button
                                                        onClick={() => setItemDestinations({ ...itemDestinations, [item.id]: 'estoque' })}
                                                        style={{
                                                            padding: '4px 8px', borderRadius: '6px', border: 'none', fontSize: '0.65rem', fontWeight: '800', cursor: 'pointer',
                                                            backgroundColor: (itemDestinations[item.id] || 'estoque') === 'estoque' ? 'white' : 'transparent',
                                                            boxShadow: (itemDestinations[item.id] || 'estoque') === 'estoque' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
                                                            color: (itemDestinations[item.id] || 'estoque') === 'estoque' ? 'var(--primary)' : 'var(--text-muted)'
                                                        }}
                                                    >Estoque</button>
                                                    <button
                                                        onClick={() => setItemDestinations({ ...itemDestinations, [item.id]: 'transfer' })}
                                                        style={{
                                                            padding: '4px 8px', borderRadius: '6px', border: 'none', fontSize: '0.65rem', fontWeight: '800', cursor: 'pointer',
                                                            backgroundColor: itemDestinations[item.id] === 'transfer' ? 'white' : 'transparent',
                                                            boxShadow: itemDestinations[item.id] === 'transfer' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
                                                            color: itemDestinations[item.id] === 'transfer' ? 'var(--info)' : 'var(--text-muted)'
                                                        }}
                                                    >Quadra</button>
                                                </div>
                                            </td>
                                        )}
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
