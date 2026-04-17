import React, { useState, useEffect } from 'react';
import {
    Plus,
    Trash2,
    Save,
    Printer,
    Search,
    ArrowUpRight,
    Calendar,
    Map,
    Activity,
    Package,
    Clock,
    Truck,
    FileText,
    Calculator,
    X,
    CheckCircle
} from 'lucide-react';
import {
    ordensSaidaService,
    insumosService,
    quadrasService,
    atividadesService,
    osService
} from '../lib/services';
import { format } from 'date-fns';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function InventoryOutbound({ logo }) {
    // states
    const [insumosMeta, setInsumosMeta] = useState([]);
    const [quadras, setQuadras] = useState([]);
    const [atividades, setAtividades] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showPrescriptionLookup, setShowPrescriptionLookup] = useState(false);
    const [pendingPrescriptions, setPendingPrescriptions] = useState([]);

    // Header form state
    const [header, setHeader] = useState({
        data: format(new Date(), 'yyyy-MM-dd'),
        turno: 'DIA',
        quantidade_bombas: '',
        numero_receita: '',
        numero_carreta: '',
        atividade_id: '',
        quadra_id: '',
        os_id: ''
    });

    // List of insumos for the current order
    const [items, setItems] = useState([]);

    useEffect(() => {
        fetchMetadata();
    }, []);

    const fetchMetadata = async () => {
        try {
            setLoading(true);
            const [insData, quaData, atiData] = await Promise.all([
                insumosService.getAll(),
                quadrasService.getAll(),
                atividadesService.getAll()
            ]);
            setInsumosMeta(insData);
            setQuadras(quaData);
            setAtividades(atiData);
        } catch (error) {
            console.error('Error fetching metadata:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchPendingOS = async () => {
        try {
            const data = await osService.getPending();
            setPendingPrescriptions(data);
        } catch (error) {
            console.error('Error fetching prescriptions:', error);
        }
    };

    const selectPrescription = (os) => {
        const quadra = quadras.find(q => q.nome === os.quadra);
        const atividade = atividades.find(a => a.nome === os.operacao);

        setHeader({
            ...header,
            numero_receita: `${format(new Date(os.data_prescricao), 'yy')}/${os.numero_os.toString().padStart(6, '0')}`,
            quadra_id: quadra?.id || '',
            atividade_id: atividade?.id || '',
            os_id: os.id
        });

        const newItems = os.insumos.map(ins => {
            // Prioridade 1: Nome exato (ignorando caixa)
            let meta = insumosMeta.find(m => m.insumo?.toLowerCase() === ins.material?.toLowerCase());

            // Prioridade 2: Código (apenas se o nome não bater)
            if (!meta && ins.codigo) {
                meta = insumosMeta.find(m => m.codigo === ins.codigo);
            }

            return {
                id: crypto.randomUUID(),
                insumo_id: meta?.id || '',
                codigo: meta?.codigo || ins.codigo,
                insumo_nome: meta?.insumo || ins.material,
                dosagem: ins.dosagem.toString().replace(',', '.'),
                quantidade: (parseFloat(header.quantidade_bombas || 0) * parseFloat(ins.dosagem.toString().replace(',', '.'))).toFixed(2),
                quantidade_sobra: 0
            };
        });

        setItems(newItems);
        setShowPrescriptionLookup(false);
    };

    // Auto-update quantity if bombas change
    useEffect(() => {
        const bombas = parseFloat(header.quantidade_bombas) || 0;
        setItems(items.map(item => {
            const dosagem = parseFloat(item.dosagem) || 0;
            return { ...item, quantidade: (bombas * dosagem).toFixed(2) };
        }));
    }, [header.quantidade_bombas]);

    // Nova função: Adiciona uma linha em branco direto na tabela
    const handleAddNewRow = () => {
        setItems([...items, { 
            id: crypto.randomUUID(), 
            insumo_id: '', 
            codigo: '', 
            insumo_nome: '', 
            dosagem: '', 
            quantidade: '', 
            quantidade_sobra: '0' 
        }]);
    };

    // Nova função: Edita qualquer campo direto na linha da tabela
    const handleItemChange = (id, field, value) => {
        setItems(items.map(item => {
            if (item.id === id) {
                const updatedItem = { ...item, [field]: value };

                // Se o usuário trocou o Insumo, preenchemos os dados automáticos
                if (field === 'insumo_id') {
                    const insumoData = insumosMeta.find(i => i.id === value);
                    updatedItem.codigo = insumoData?.codigo || '';
                    updatedItem.insumo_nome = insumoData?.insumo || '';
                    updatedItem.dosagem = insumoData?.dosagem?.toString().replace(',', '.') || '';
                    
                    // Recalcula a quantidade (Bombas * Dosagem)
                    const bombas = parseFloat(header.quantidade_bombas) || 0;
                    const dosagem = parseFloat(updatedItem.dosagem) || 0;
                    updatedItem.quantidade = (bombas * dosagem).toFixed(2);
                }

                // Se o usuário mexer na dosagem manualmente, recalcula o total
                if (field === 'dosagem') {
                    updatedItem.dosagem = value.replace(',', '.');
                    const bombas = parseFloat(header.quantidade_bombas) || 0;
                    const dosagem = parseFloat(updatedItem.dosagem) || 0;
                    updatedItem.quantidade = (bombas * dosagem).toFixed(2);
                }

                return updatedItem;
            }
            return item;
        }));
    };

    const removeItem = (id) => {
        setItems(items.filter(item => item.id !== id));
    };

    const handleSave = async () => {
        if (!header.quadra_id || items.length === 0) {
            alert('Preencha a quadra e adicione ao menos um insumo.');
            return;
        }

        try {
            await ordensSaidaService.create(header, items);
            alert('Ordem de Saída registrada com sucesso!');
            // Reset form
            setHeader({
                data: format(new Date(), 'yyyy-MM-dd'),
                turno: 'DIA',
                quantidade_bombas: '',
                numero_receita: '',
                numero_carreta: '',
                atividade_id: '',
                quadra_id: '',
                os_id: ''
            });
            setItems([]);
        } catch (error) {
            alert('Erro ao salvar: ' + error.message);
        }
    };

    const generatePDF = () => {
        // Portrait orientation 'p', A4
        const doc = new jsPDF('p', 'mm', 'a4');
        const pw = doc.internal.pageSize.getWidth(); // 210mm
        const ph = doc.internal.pageSize.getHeight(); // 297mm

        const q = quadras.find(q => q.id === header.quadra_id)?.nome || '';
        const a = atividades.find(at => at.id === header.atividade_id)?.nome || '';

        doc.setFont('helvetica', 'bold');
        doc.setLineWidth(0.3);

        // ==========================================
        // 1. PRIMEIRA PARTE: ORDEM DE SAÍDA INTACTA
        // ==========================================
        doc.rect(5, 5, pw - 10, 12);
        if (logo) {
            try {
                doc.addImage(logo, 'PNG', 7, 6.5, 18, 9);
            } catch (e) {
                console.error('Logo error:', e);
            }
        }
        doc.setFontSize(14);
        doc.text('ORDEM DE SAIDA DE DEFENSIVOS AGRICOLA', pw / 2 + 10, 12.5, { align: 'center' });

        doc.setFontSize(8);
        let currentY = 17;
        const rowH = 7;

        doc.rect(5, currentY, 50, rowH);
        doc.text('DATA:', 7, currentY + 4.5);
        doc.setFont('helvetica', 'normal');
        doc.text(header.data ? format(new Date(header.data + 'T00:00:00'), 'dd/MM/yyyy') : '', 20, currentY + 4.5);

        doc.rect(55, currentY, 50, rowH);
        doc.setFont('helvetica', 'bold');
        doc.text('TURNO:', 57, currentY + 4.5);
        doc.setFont('helvetica', 'normal');
        doc.text(header.turno, 72, currentY + 4.5);

        doc.rect(105, currentY, pw - 110, rowH);
        doc.setFont('helvetica', 'bold');
        doc.text('Qtd. Bombas:', 107, currentY + 4.5);
        doc.setFont('helvetica', 'normal');
        doc.text(`${header.quantidade_bombas?.toString() || ''} BOMBAS`, 130, currentY + 4.5);

        currentY += rowH;

        doc.rect(5, currentY, 40, rowH);
        doc.setFont('helvetica', 'bold');
        doc.text('CARRETA N°:', 7, currentY + 4.5);
        doc.setFont('helvetica', 'normal');
        doc.text(header.numero_carreta || '', 25, currentY + 4.5);

        doc.rect(45, currentY, 40, rowH);
        doc.setFont('helvetica', 'bold');
        doc.text('QUADRA:', 47, currentY + 4.5);
        doc.setFont('helvetica', 'normal');
        doc.text(q, 62, currentY + 4.5);

        doc.rect(85, currentY, 80, rowH);
        doc.setFont('helvetica', 'bold');
        doc.text('OPERAÇÃO:', 87, currentY + 4.5);
        doc.setFont('helvetica', 'normal');
        doc.text(a, 107, currentY + 4.5);

        doc.rect(165, currentY, pw - 170, rowH);
        doc.setFont('helvetica', 'bold');
        doc.text('N° RECEITA:', 167, currentY + 4.5);
        doc.setFont('helvetica', 'normal');
        doc.text(header.numero_receita || '', 188, currentY + 4.5);

        currentY += rowH;

        doc.rect(5, currentY, pw - 10, 5);
        doc.setFontSize(6);
        doc.setFont('helvetica', 'bold');
        doc.text('DEVOUÇÃO AO ESTOQUE | TRANSFERENCIA DE LOTE', 7, currentY + 3.5);
        doc.setFont('helvetica', 'normal');
        doc.text('ESTOQUE (  )  QUADRA: ___________  N° ___________', pw - 15, currentY + 3.5, { align: 'right' });

        currentY += 5;

        const formatVal = (val) => {
            if (val === undefined || val === null || val === '') return '';
            const normalized = val.toString().replace(',', '.');
            const num = parseFloat(normalized);
            if (isNaN(num) || num === 0) return '';
            return num.toFixed(2).replace('.', ',');
        };

        const tableBody = [];
        const checkContent = '( ) Conforme\n( ) Não Conforme';
        for (let i = 0; i < 8; i++) {
            const item = items[i];
            tableBody.push([
                item ? item.insumo_nome : '',
                item ? formatVal(item.dosagem) : '',
                item ? formatVal(item.quantidade) : '',
                '', // Second Qtd Lacrada
                checkContent,
                '', // Second Qtd Lacrada 2
                '', // Second Qtd Sobra 2
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
                2: { cellWidth: 20, textColor: [180, 180, 180] }, // <-- Cor Cinza Claro Aplicada
                3: { cellWidth: 20 },
                4: { cellWidth: 25, fontSize: 5, halign: 'left' },
                5: { cellWidth: 20 },
                6: { cellWidth: 20 },
                7: { cellWidth: 25, fontSize: 5, halign: 'left' }
            },
            margin: { left: 5, right: 5 }
        });

        const finalY = doc.lastAutoTable.finalY + 3;

        // Observation Area
        doc.rect(5, finalY, 70, 18);
        doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.text('OBSERVAÇÃO:', 7, finalY + 4);
        doc.setFont('helvetica', 'normal');
        if (header.observacao) {
            doc.text(header.observacao || '', 7, finalY + 8, { maxWidth: 65 });
        }


        // ==========================================
        // 2. NOVA PARTE: REGISTRO DE BOMBAS APLICADAS
        // ==========================================
        const pumpControlStartY = finalY + 24;

        // Novo Cabeçalho com Logo
        doc.rect(5, pumpControlStartY, pw - 10, 12);
        if (logo) {
            try {
                doc.addImage(logo, 'PNG', 7, pumpControlStartY + 1.5, 18, 9);
            } catch (e) {
                console.error('Logo error:', e);
            }
        }
        
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.text('REGISTRO DE BOMBAS APLICADAS', pw / 2 + 10, pumpControlStartY + 7.5, { align: 'center' });

        // Nova Tabela com as colunas solicitadas e 6 linhas vazias
        autoTable(doc, {
            startY: pumpControlStartY + 13, // Logo abaixo do novo cabeçalho
            head: [['Trator', 'Operador', 'Horário 1º Bomba', 'Horário Última bomba', 'Qtde. bombas']],
            body: Array(6).fill(['', '', '', '', '']), // 6 linhas vazias para o campo
            theme: 'grid',
            styles: { 
                halign: 'center', 
                valign: 'middle', 
                fontSize: 9, 
                cellPadding: 1, 
                lineColor: 0, 
                lineWidth: 0.1, 
                minCellHeight: 12 // Altura espaçosa para escrever os nomes e horários confortavelmente
            },
            headStyles: { fillColor: 245, textColor: 0, fontStyle: 'bold', minCellHeight: 8 },
            margin: { left: 5, right: 5 }
        });

        const afterPumpY = doc.lastAutoTable.finalY + 15;

        // Signatures (As assinaturas vão logo abaixo da nova tabela)
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.line(80, afterPumpY, 115, afterPumpY); doc.text('Administrador:', 80, afterPumpY + 3.5);
        doc.line(120, afterPumpY, 155, afterPumpY); doc.text('Encarregado:', 120, afterPumpY + 3.5);
        doc.line(160, afterPumpY, pw - 5, afterPumpY); doc.text('Almoxarife:', 160, afterPumpY + 3.5);

        // Footer note
        doc.setFontSize(5.5);
        doc.text('LEMBRETE: ESSA ORDEM DE SERVIÇO SÓ TERÁ DUAS VIAS, DEVERÁ SER GRAMPEADA JUNTO À RECEITA DE TRATAMENTO. NÃO PODENDO SER EXTRAVIADA.', 5, afterPumpY + 12, { maxWidth: pw - 10 });

        doc.save(`Ordem_Saida_${header.data}.pdf`);
    };

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Carregando dados...</div>;

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
            {/* Header com Lupa para Receitas */}
            <div style={{
                padding: '1rem 2rem',
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
                        width: '40px', height: '40px', borderRadius: '12px',
                        background: 'linear-gradient(135deg, #ef4444, #b91c1c)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white'
                    }}>
                        <ArrowUpRight size={20} />
                    </div>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: '900', color: 'var(--text)', fontSize: '1.2rem' }}>
                        Nova Ordem de Saída
                    </h2>
                </div>

                <button
                    onClick={() => { setShowPrescriptionLookup(true); fetchPendingOS(); }}
                    style={{
                        padding: '0.6rem 1.2rem', borderRadius: '12px', background: '#f1f5f9',
                        border: '1px solid #e2e8f0', color: 'var(--text)', fontWeight: '800',
                        fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.6rem'
                    }}
                >
                    <Search size={18} /> Buscar Receita Pendente
                </button>
            </div>

            {/* Form de Registro */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '2rem', backgroundColor: '#fafbfc' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2.5rem' }}>
                    <div className="form-group">
                        <label style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '0.4rem', display: 'block' }}>Data</label>
                        <input type="date" value={header.data} onChange={e => setHeader({ ...header, data: e.target.value })} className="input-field" />
                    </div>
                    <div className="form-group">
                        <label style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '0.4rem', display: 'block' }}>Turno</label>
                        <select value={header.turno} onChange={e => setHeader({ ...header, turno: e.target.value })} className="input-field" style={{ padding: '0.85rem' }}>
                            <option value="DIA">DIA</option>
                            <option value="NOITE">NOITE</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '0.4rem', display: 'block' }}>Qtde Bombas</label>
                        <input type="number" value={header.quantidade_bombas} onChange={e => setHeader({ ...header, quantidade_bombas: e.target.value })} className="input-field" placeholder="Ex: 35" />
                    </div>
                    <div className="form-group">
                        <label style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '0.4rem', display: 'block' }}>N° Receita</label>
                        <input type="text" value={header.numero_receita} onChange={e => setHeader({ ...header, numero_receita: e.target.value })} className="input-field" placeholder="YY/XXXXXX" />
                    </div>

                    <div className="form-group">
                        <label style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '0.4rem', display: 'block' }}>N° Carreta</label>
                        <input type="text" value={header.numero_carreta} onChange={e => setHeader({ ...header, numero_carreta: e.target.value })} className="input-field" placeholder="003" />
                    </div>
                    <div className="form-group">
                        <label style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '0.4rem', display: 'block' }}>Atividade</label>
                        <select value={header.atividade_id} onChange={e => setHeader({ ...header, atividade_id: e.target.value })} className="input-field" style={{ padding: '0.85rem' }}>
                            <option value="">Selecione...</option>
                            {atividades.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
                        </select>
                    </div>
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '0.4rem', display: 'block' }}>Quadra</label>
                        <select value={header.quadra_id} onChange={e => setHeader({ ...header, quadra_id: e.target.value })} className="input-field" style={{ padding: '0.85rem' }}>
                            <option value="">Selecione...</option>
                            {quadras.map(q => <option key={q.id} value={q.id}>{q.nome}</option>)}
                        </select>
                    </div>
                </div>

                <div style={{ borderTop: '2px dashed #e2e8f0', paddingTop: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: '900', color: 'var(--text)' }}>Insumos da Aplicação</h3>
                        <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }}></div>
                    </div>

                    {/* NOVA TABELA EDITÁVEL INLINE */}
                    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px', marginBottom: '1rem' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                <th style={{ padding: '0.5rem 1rem', width: '15%' }}>Código</th>
                                <th style={{ padding: '0.5rem 1rem', width: '40%' }}>Insumo</th>
                                <th style={{ padding: '0.5rem 1rem' }}>Dosagem</th>
                                <th style={{ padding: '0.5rem 1rem' }}>Qtd Retirar</th>
                                <th style={{ padding: '0.5rem 1rem' }}>Sobra</th>
                                <th style={{ width: '50px' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item) => (
                                <tr key={item.id} style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                                    
                                    {/* CÓDIGO (Preenche automático) */}
                                    <td style={{ padding: '0.5rem 1rem', borderRadius: '12px 0 0 12px' }}>
                                        <input type="text" value={item.codigo} readOnly className="input-field" style={{ backgroundColor: '#f1f5f9', fontSize: '0.8rem', width: '100%' }} placeholder="Cód" />
                                    </td>

                                    {/* INSUMO (Select Editável direto na linha) */}
                                    <td style={{ padding: '0.5rem 1rem' }}>
                                        <select
                                            value={item.insumo_id}
                                            onChange={(e) => handleItemChange(item.id, 'insumo_id', e.target.value)}
                                            className="input-field"
                                            style={{ width: '100%', fontWeight: '800', color: 'var(--primary)', padding: '0.6rem' }}
                                            required
                                        >
                                            <option value="">Selecione o produto...</option>
                                            {insumosMeta.map(i => <option key={i.id} value={i.id}>{i.insumo}</option>)}
                                        </select>
                                    </td>

                                    {/* DOSAGEM */}
                                    <td style={{ padding: '0.5rem 1rem' }}>
                                        <input
                                            type="text"
                                            value={item.dosagem}
                                            onChange={e => handleItemChange(item.id, 'dosagem', e.target.value)}
                                            className="input-field"
                                            style={{ width: '80px', padding: '0.6rem' }}
                                            placeholder="0.00"
                                            required
                                        />
                                    </td>

                                    {/* QTD A RETIRAR */}
                                    <td style={{ padding: '0.5rem 1rem' }}>
                                        <input
                                            type="text"
                                            value={item.quantidade}
                                            onChange={e => handleItemChange(item.id, 'quantidade', e.target.value)}
                                            style={{ width: '90px', padding: '0.6rem', border: '1px solid #e2e8f0', borderRadius: '8px', fontWeight: '900', color: '#ef4444' }}
                                            required
                                        />
                                    </td>

                                    {/* SOBRA */}
                                    <td style={{ padding: '0.5rem 1rem' }}>
                                        <input
                                            type="text"
                                            value={item.quantidade_sobra}
                                            onChange={e => handleItemChange(item.id, 'quantidade_sobra', e.target.value)}
                                            style={{ width: '70px', padding: '0.6rem', border: '1px solid #e2e8f0', borderRadius: '8px', fontWeight: '800' }}
                                        />
                                    </td>

                                    {/* BOTÃO EXCLUIR LINHA */}
                                    <td style={{ padding: '0.5rem 1rem', borderRadius: '0 12px 12px 0', textAlign: 'center' }}>
                                        <button type="button" onClick={() => removeItem(item.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }} title="Remover Insumo">
                                            <Trash2 size={20} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* BOTÃO INCLUIR LINHA NOVA */}
                    <button type="button" onClick={handleAddNewRow} className="btn btn-outline" style={{ alignSelf: 'flex-start', marginTop: '0.5rem' }}>
                        <div className="btn-inner" style={{ padding: '0.5rem 1rem', color: '#10b981', borderColor: '#10b981' }}>
                            <Plus size={16} /> Adicionar Nova Linha
                        </div>
                    </button>
                </div>
            </div>

            {/* Footer com Actions */}
            <div style={{
                padding: '1.5rem 2rem',
                backgroundColor: 'white',
                borderTop: '1px solid rgba(0,0,0,0.06)',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '1rem',
                boxShadow: '0 -4px 15px rgba(0,0,0,0.02)'
            }}>
                <button
                    onClick={generatePDF}
                    disabled={items.length === 0}
                    className="btn btn-outline"
                    style={{ padding: '0.8rem 2rem', borderRadius: '14px', opacity: items.length === 0 ? 0.3 : 1 }}
                >
                    <div className="btn-inner" style={{ fontSize: '0.95rem', fontWeight: '800' }}><Printer size={20} /> Imprimir PDF</div>
                </button>
                <button
                    onClick={handleSave}
                    disabled={items.length === 0}
                    className="btn btn-primary"
                    style={{ padding: '0.8rem 2.5rem', borderRadius: '14px', background: '#ef4444' }}
                >
                    <div className="btn-inner" style={{ fontSize: '0.95rem', fontWeight: '800' }}><Save size={20} /> Baixar Ordem de Saída</div>
                </button>
            </div>

            {/* Modal de Lookup de Receitas */}
            {showPrescriptionLookup && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(8px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '2rem'
                }}>
                    <div className="premium-card" style={{
                        maxWidth: '800px', width: '100%', padding: '2rem',
                        position: 'relative', backgroundColor: 'white', borderRadius: '28px'
                    }}>
                        <button onClick={() => setShowPrescriptionLookup(false)} style={{ position: 'absolute', top: '1.2rem', right: '1.2rem', background: '#f1f5f9', border: 'none', cursor: 'pointer', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <X size={20} />
                        </button>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.4rem', fontWeight: '900', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                <FileText size={24} style={{ color: '#ef4444' }} />
                                Receitas Pendentes
                            </h3>
                            <p style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Selecione uma receita para carregar os dados automaticamente.</p>
                        </div>

                        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead style={{ position: 'sticky', top: 0, backgroundColor: 'white', borderBottom: '2px solid #f1f5f9' }}>
                                    <tr style={{ textAlign: 'left', fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)' }}>
                                        <th style={{ padding: '1rem' }}>Receita</th>
                                        <th style={{ padding: '1rem' }}>Data</th>
                                        <th style={{ padding: '1rem' }}>Quadra</th>
                                        <th style={{ padding: '1rem' }}>Operação</th>
                                        <th style={{ padding: '1rem', textAlign: 'right' }}>Ação</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pendingPrescriptions.map(os => (
                                        <tr key={os.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={{ padding: '1rem', fontWeight: '800' }}>#{os.numero_os}</td>
                                            <td style={{ padding: '1rem' }}>{format(new Date(os.data_prescricao), 'dd/MM/yyyy')}</td>
                                            <td style={{ padding: '1rem', fontWeight: '700' }}>Q-{os.quadra}</td>
                                            <td style={{ padding: '1rem' }}>{os.operacao}</td>
                                            <td style={{ padding: '1rem', textAlign: 'right' }}>
                                                <button
                                                    onClick={() => selectPrescription(os)}
                                                    className="btn btn-mini"
                                                    style={{ background: '#ef4444', color: 'white' }}
                                                >
                                                    <div className="btn-inner">Adicionar</div>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {pendingPrescriptions.length === 0 && (
                                        <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Nenhuma receita pendente encontrada.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
