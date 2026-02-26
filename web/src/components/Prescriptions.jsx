import React, { useState, useEffect } from 'react';
import { osService, insumosService, quadrasService, ordensSaidaService } from '../lib/services';
import {
    Plus, Search, FileText, Printer, Trash2, X,
    Save, ClipboardList, Package, Droplets, ChevronDown, ChevronUp,
    AlertCircle, CheckCircle, Clock
} from 'lucide-react';
import { format, parseISO, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const Prescriptions = ({ logo }) => {
    const [ordens, setOrdens] = useState([]);
    const [insumosMeta, setInsumosMeta] = useState([]);
    const [quadrasMeta, setQuadrasMeta] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        quadra: '',
        operacao: '',
        area_ha: '',
        equipamento: '',
        recomendacao: '',
        carencia: '7',
        data_prescricao: format(new Date(), 'yyyy-MM-dd'),
        insumos: [{ material: '', dosagem: '', sequencia: '', finalidade: '', principio: '' }],
        dados_tecnicos: {
            pressao: '',
            pes: '',
            marcha: '',
            rpm: '',
            velocidade: '',
            pontas: '',
            volume_calda: ''
        }
    });

    const operations = ["Chuá", "Leprose", "Alternária", "Pinta Preta", "Aplicação de Winner", "Herbicida"];

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [osData, insData, quaData] = await Promise.all([
                osService.getAll(),
                insumosService.getAll(),
                quadrasService.getAll()
            ]);
            setOrdens(osData);
            setInsumosMeta(insData);
            setQuadrasMeta(quaData || []);
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddInsumo = () => {
        setFormData({
            ...formData,
            insumos: [...formData.insumos, { material: '', dosagem: '' }]
        });
    };

    const handleRemoveInsumo = (index) => {
        const newInsumos = [...formData.insumos];
        newInsumos.splice(index, 1);
        setFormData({ ...formData, insumos: newInsumos });
    };

    const handleInsumoChange = (index, field, value) => {
        const newInsumos = [...formData.insumos];
        newInsumos[index][field] = value;

        // Auto-complete if material is selected
        if (field === 'material') {
            const matchedMaterial = insumosMeta.find(m => m.insumo.toLowerCase() === value.toLowerCase());
            if (matchedMaterial) {
                newInsumos[index].codigo = matchedMaterial.codigo || '';
                newInsumos[index].dosagem = matchedMaterial.dosagem || '';
            }
        }

        setFormData({ ...formData, insumos: newInsumos });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const sanitizedData = {
                ...formData,
                area_ha: formData.area_ha === '' ? null : formData.area_ha,
                carencia: formData.carencia === '' ? null : formData.carencia
            };
            await osService.create(sanitizedData);
            setShowForm(false);
            setFormData({
                quadra: '',
                operacao: '',
                area_ha: '',
                equipamento: '',
                recomendacao: '',
                data_prescricao: format(new Date(), 'yyyy-MM-dd'),
                insumos: [{ material: '', dosagem: '', sequencia: '', finalidade: '', principio: '' }],
                dados_tecnicos: { pressao: '', pes: '', marcha: '', rpm: '', velocidade: '', pontas: '', volume_calda: '' }
            });
            fetchData();
        } catch (error) {
            alert('Erro ao salvar OS: ' + error.message);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Excluir esta Ordem de Serviço?')) {
            try {
                await osService.delete(id);
                fetchData();
            } catch (error) {
                alert('Erro ao excluir: ' + error.message);
            }
        }
    };

    const exportToPDF = async (os) => {
        try {
            const outbounds = await ordensSaidaService.getByOsId(os.id);
            const reg = os.registros?.[0] || {};
            const doc = new jsPDF('l', 'mm', 'a4');
            const pw = doc.internal.pageSize.getWidth();
            const ph = doc.internal.pageSize.getHeight();

            // Set Global Styles
            doc.setFont('helvetica', 'normal');
            doc.setDrawColor(0);
            doc.setLineWidth(0.4);

            // 1. TOP HEADER - LOGO & TITLE & ID BOX
            doc.rect(5, 5, 25, 18);
            if (logo) {
                doc.addImage(logo, 'PNG', 6, 6, 23, 16);
            } else {
                doc.setFontSize(8);
                doc.text('Fazenda', 17.5, 12, { align: 'center' });
                doc.text('Vale dos Laranjais', 17.5, 16, { align: 'center' });
            }

            doc.rect(30, 5, pw - 85, 18);
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.text('ORDEM DE SERVIÇO - APLICAÇÃO DE INSUMOS', pw / 2 - 12.5, 14, { align: 'center' });

            doc.rect(pw - 55, 5, 50, 18);
            doc.setFontSize(6);
            doc.setFont('helvetica', 'normal');
            doc.text(`Identificação: RQ 05`, pw - 53, 9);
            doc.text(`Elaborador por: Administrativo`, pw - 53, 12);
            doc.text(`Aprovado: Gabriel Fortes`, pw - 53, 15);
            doc.text(`Aprovado em: 01/09/2020`, pw - 53, 18);

            // 2. IDENTIFICATION GRID
            const idStartY = 23;
            let osYear = format(parseISO(os.data_prescricao), 'yy');
            let osFullNum = `${osYear}/${String(os.numero_os || '').padStart(6, '0')}`;

            doc.rect(5, idStartY, 25, 6); doc.text('Quadra:', 7, idStartY + 4.5);
            doc.rect(30, idStartY, 60, 6); doc.setFont('helvetica', 'bold'); doc.text(os.quadra || '', 32, idStartY + 4.5); doc.setFont('helvetica', 'normal');
            doc.rect(90, idStartY, 45, 6); doc.text('N° Ordem Serviço:', 92, idStartY + 4.5);
            doc.rect(135, idStartY, 40, 6); doc.setFont('helvetica', 'bold'); doc.text(osFullNum, 137, idStartY + 4.5); doc.setFont('helvetica', 'normal');
            doc.rect(175, idStartY, 35, 6); doc.text('Data Inicial:', 177, idStartY + 4.5);
            doc.rect(210, idStartY, 35, 6); doc.text(os.data_prescricao ? format(parseISO(os.data_prescricao), 'dd/MM/yyyy') : '        /        /        ', 212, idStartY + 4.5);
            doc.rect(245, idStartY, 25, 6); doc.text('Pressão PSI:', 247, idStartY + 4.5);
            doc.rect(270, idStartY, 22, 6); doc.text(os.dados_tecnicos?.pressao || '', 272, idStartY + 4.5);

            const row2Y = idStartY + 6;
            doc.rect(5, row2Y, 25, 6); doc.text('Área Ha:', 7, row2Y + 4.5);
            doc.rect(30, row2Y, 60, 6); doc.text(os.area_ha || '', 32, row2Y + 4.5);
            doc.rect(90, row2Y, 45, 6); doc.text('N° Recomendação:', 92, row2Y + 4.5);
            doc.rect(135, row2Y, 40, 6); doc.text(os.recomendacao || '', 137, row2Y + 4.5);
            doc.rect(175, row2Y, 35, 6); doc.text('Hora Inicial:', 177, row2Y + 4.5);
            doc.rect(210, row2Y, 35, 6); doc.text('        :        ', 212, row2Y + 4.5);
            doc.rect(245, row2Y, 25, 6); doc.text('Qtde de Pés:', 247, row2Y + 4.5);
            const rawPes = reg.pes_tratados || os.dados_tecnicos?.pes || '';
            doc.rect(270, row2Y, 22, 6); doc.setFont('helvetica', 'bold'); doc.text(rawPes.toString(), 272, row2Y + 4.5); doc.setFont('helvetica', 'normal');

            const row3Y = row2Y + 6;
            doc.rect(5, row3Y, 25, 6); doc.text('Operação:', 7, row3Y + 4.5);
            doc.rect(30, row3Y, 60, 6); doc.text(os.operacao || '', 32, row3Y + 4.5);
            doc.rect(90, row3Y, 45, 6); doc.text('N° Lançamento:', 92, row3Y + 4.5);
            doc.rect(135, row3Y, 40, 6); doc.text('', 137, row3Y + 4.5);
            doc.rect(175, row3Y, 35, 6); doc.text('Data Final:', 177, row3Y + 4.5);

            const dataFinalStr = reg.data_final ? format(parseISO(reg.data_final), 'dd / MM / yyyy') : '        /        /        ';
            doc.rect(210, row3Y, 35, 6); doc.text(dataFinalStr, 212, row3Y + 4.5);
            doc.rect(245, row3Y, 25, 6); doc.text('Marcha:', 247, row3Y + 4.5);
            doc.rect(270, row3Y, 22, 6); doc.text(os.dados_tecnicos?.marcha || '', 272, row3Y + 4.5);

            const row4Y = row3Y + 6;
            const variety = quadrasMeta.find(q => q.nome === os.quadra)?.variedade || '';

            doc.rect(5, row4Y, 25, 6); doc.text('Equipamento:', 7, row4Y + 4.5);
            doc.rect(30, row4Y, 60, 6); doc.text(os.equipamento || '', 32, row4Y + 4.5);
            doc.rect(90, row4Y, 45, 6); doc.text('VARIEDADE:', 92, row4Y + 4.5);
            doc.rect(135, row4Y, 40, 6); doc.setFont('helvetica', 'bold'); doc.text(variety, 137, row4Y + 4.5); doc.setFont('helvetica', 'normal');
            doc.rect(175, row4Y, 35, 6); doc.text('Hora Final:', 177, row4Y + 4.5);
            doc.rect(210, row4Y, 35, 6); doc.text('        :        ', 212, row4Y + 4.5);
            doc.rect(245, row4Y, 25, 6); doc.text('Rotação:', 247, row4Y + 4.5);
            doc.rect(270, row4Y, 22, 6); doc.text(os.dados_tecnicos?.rpm || '', 272, row4Y + 4.5);

            const formatVal = (val) => {
                if (val === undefined || val === null || val === '') return '';
                const normalized = val.toString().replace(',', '.');
                const num = parseFloat(normalized);
                if (isNaN(num) || num === 0) return '';
                return num.toFixed(2).replace('.', ',');
            };

            // 3. CONSUMO DATA AGGREGATION
            const consumptionMap = {};
            outbounds.forEach(out => {
                out.saidas?.forEach(s => {
                    const idKey = s.insumo_id;
                    const nameKey = s.insumos?.insumo?.toLowerCase().trim();

                    if (idKey) {
                        if (!consumptionMap[idKey]) consumptionMap[idKey] = { retirada: 0, real: 0, devolucao: 0 };
                        const q = parseFloat(s.quantidade) || 0;
                        const d = parseFloat(s.devolucao) || 0;
                        consumptionMap[idKey].retirada += q;
                        consumptionMap[idKey].real += (q - d);
                        consumptionMap[idKey].devolucao += d;
                    }

                    if (nameKey) {
                        if (!consumptionMap[nameKey]) consumptionMap[nameKey] = { retirada: 0, real: 0, devolucao: 0 };
                        const q = parseFloat(s.quantidade) || 0;
                        const d = parseFloat(s.devolucao) || 0;
                        consumptionMap[nameKey].retirada += q;
                        consumptionMap[nameKey].real += (q - d);
                        consumptionMap[nameKey].devolucao += d;
                    }
                });
            });

            // 4. INSUMOS TABLE WITH DYNAMIC PRINCIPIO E CARENCIA
            const tableY = row4Y + 6;
            const insumosRows = [];
            let maxCarencia = 0;

            for (let i = 0; i < 12; i++) {
                const ins = os.insumos?.[i] || {};
                const desc = ins.sequencia ? `${ins.sequencia} - ${ins.material || ''}` : (ins.material || '');

                const consById = ins.insumo_id ? consumptionMap[ins.insumo_id] : null;
                const consByName = ins.material ? consumptionMap[ins.material.toLowerCase().trim()] : null;
                const cons = consById || consByName || { retirada: 0, real: 0, devolucao: 0 };

                // Busca o insumo no banco de dados para extrair Principio e Carencia
                const matchedMaterial = ins.material ? insumosMeta.find(m => m.insumo?.toLowerCase() === ins.material.toLowerCase().trim()) : null;
                const principioAtivo = matchedMaterial?.principio_ativo || matchedMaterial?.principio || ins.principio || '';
                
                // Extrai a carência testando os nomes mais comuns que podem estar no seu banco
                const carenciaRaw = matchedMaterial?.carencia_dias ?? matchedMaterial?.dias_carencia ?? matchedMaterial?.carencia ?? ins.carencia;
                const carenciaDias = (carenciaRaw !== null && carenciaRaw !== undefined && carenciaRaw !== '') ? String(carenciaRaw) : '';

                // Registra qual é a maior carência do tanque
                const parsedCarencia = parseInt(carenciaDias, 10);
                if (!isNaN(parsedCarencia) && parsedCarencia > maxCarencia) {
                    maxCarencia = parsedCarencia;
                }

                insumosRows.push([
                    ins.codigo || '',
                    desc,
                    formatVal(ins.dosagem),
                    ins.finalidade || '',
                    principioAtivo,
                    carenciaDias, // Aqui a carência aparece na tabela
                    cons.retirada > 0 ? 'TOTAL' : '',
                    formatVal(cons.retirada),
                    formatVal(cons.real),
                    formatVal(cons.devolucao)
                ]);
            }

            autoTable(doc, {
                startY: tableY,
                head: [[
                    'Código\nMaterial', 'Sequencia de Mistura\nDescrição', 'Dosagem\n4000 Lts', 'Finalidade\nAlvo', 'Princípio\nAtivo', 'Carência\ndias',
                    { content: 'CONSUMO', colSpan: 4, styles: { halign: 'center' } }
                ], [
                    '', '', '', '', '', '', 'DATA', 'Retirada Estoque', 'Consumo Real', 'Devolução'
                ]],
                body: insumosRows,
                theme: 'grid',
                styles: { fontSize: 6, cellPadding: 1, overflow: 'linebreak', halign: 'left', lineColor: 0, lineWidth: 0.1 },
                headStyles: { fillColor: 255, textColor: 0, fontStyle: 'bold' },
                columnStyles: {
                    0: { cellWidth: 15 }, 1: { cellWidth: 50 }, 2: { cellWidth: 25 }, 3: { cellWidth: 25 }, 4: { cellWidth: 25 }, 5: { cellWidth: 15 },
                    6: { cellWidth: 25 }, 7: { cellWidth: 35 }, 8: { cellWidth: 35 }, 9: { cellWidth: 25 }
                },
                margin: { left: 5, right: 5 }
            });

            // 4. MIDDLE STRIP (Cálculo Automático da Carência e Liberação)
            const midY = doc.lastAutoTable.finalY;
            doc.rect(5, midY, 85, 6); doc.text('Reentrada de Pessoas', 7, midY + 4.5);
            doc.rect(90, midY, 45, 6); doc.text('24 Horas após aplicação', 92, midY + 4.5);
            
            // Imprime a maior carência que foi encontrada
            const carenciaParaImprimir = maxCarencia > 0 ? maxCarencia : parseInt(os.carencia || 0, 10);
            doc.rect(135, midY, 75, 6); doc.text('Carencia (Dias):    ' + carenciaParaImprimir, 137, midY + 4.5);
            
            // Lógica para Liberado Colheita: APENAS se estiver FINALIZADA
            let liberadoColheitaText = 'LIBERADO COLHEITA:';
            if (os.situacao === 'Finalizada' && reg.data_final) {
                const finalDate = parseISO(reg.data_final);
                const releaseDate = addDays(finalDate, carenciaParaImprimir);
                liberadoColheitaText += ' ' + format(releaseDate, 'dd/MM/yyyy');
            } else {
                liberadoColheitaText += ' (Aguardando Fim)';
            }

            doc.rect(210, midY, 82, 6); 
            doc.setFont('helvetica', 'bold');
            doc.text(liberadoColheitaText, 212, midY + 4.5);
            doc.setFont('helvetica', 'normal');

            // 5. WEATHER PARAMETERS & SHIFT TABLES
            const subY = midY + 6;
            const weatherData = [
                ['Temperatura ar°:', '', '', 'Velocidade do Vento:', '', '', 'Umidade Relativa do Ar:', '', ''],
                ['Temperatura ar°:', '', '', 'Velocidade do Vento:', '', '', 'Umidade Relativa do Ar:', '', ''],
                ['Temperatura ar°:', '', '', 'Velocidade do Vento:', '', '', 'Umidade Relativa do Ar:', '', '']
            ];

            autoTable(doc, {
                startY: subY,
                head: [['', 'HORARIO', 'PARAMETRO', '', 'HORARIO', 'PARAMETRO', '', 'HORARIO', 'PARAMETRO']],
                body: weatherData,
                theme: 'grid',
                styles: { fontSize: 6, cellPadding: 1 },
                headStyles: { fillColor: [240, 240, 240], textColor: 0 },
                margin: { left: 25 },
                tableWidth: pw - 30
            });

            const shiftY = doc.lastAutoTable.finalY + 10;
            const shiftHead = ['N° Trator', 'N° Equip.', 'Operador', 'Qtd. Bombas'];
            const emptyShiftRows = [['', '', '', ''], ['', '', '', ''], ['', '', '', ''], ['', '', '', ''], ['', '', '', '']];

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(6);

            const shiftTableMargin = 25; 
            autoTable(doc, {
                startY: shiftY,
                head: [[{ content: 'TURNO DO DIA', colSpan: 4, styles: { halign: 'left', fillColor: [220, 220, 220] } }], shiftHead],
                body: emptyShiftRows,
                theme: 'grid',
                styles: { fontSize: 6, cellPadding: 1 },
                margin: { left: shiftTableMargin },
                tableWidth: 135
            });

            autoTable(doc, {
                startY: shiftY,
                head: [[{ content: 'TURNO DA NOITE', colSpan: 4, styles: { halign: 'left', fillColor: [220, 220, 220] } }], shiftHead],
                body: emptyShiftRows,
                theme: 'grid',
                styles: { fontSize: 6, cellPadding: 1 },
                margin: { left: shiftTableMargin + 135 + 2 },
                tableWidth: 135
            });

            const totalY = doc.lastAutoTable.finalY;
            doc.rect(25, totalY, 110, 6); doc.setFont('helvetica', 'bold'); doc.text('TOTAL DE BOMBAS', 105, totalY + 4.5, { align: 'right' });
            doc.rect(shiftTableMargin + 135 + 2, totalY, 109, 6); doc.text('TOTAL DE BOMBAS', 236, totalY + 4.5, { align: 'right' });

            const totalBombas = reg.quantidade_bombas?.toString() || '';
            doc.rect(135, totalY, 25, 6); doc.text(totalBombas, 137, totalY + 4.5);
            doc.rect(pw - 31, totalY, 26, 6); doc.text(totalBombas, pw - 29, totalY + 4.5);
            doc.setFont('helvetica', 'normal');

            // 6. BOTTOM SECTIONS
            const sigStartY = totalY + 6;
            doc.rect(25, sigStartY, 135, 6); doc.text('Assinatura Preparador de Calda: ____________________________________________________________________', 27, sigStartY + 4.5);
            doc.rect(162, sigStartY, pw - 167, 6);
            doc.text('Assinatura Preparador de Calda: ____________________________________________________________________', 164, sigStartY + 4.5);

            const lastRowY = sigStartY + 6;
            doc.rect(25, lastRowY, 135, 6);
            doc.text('DIA:      (      ) PARCIAL  (      ) FECHADO', 50, lastRowY + 4.5);
            doc.rect(162, lastRowY, pw - 167, 6);
            doc.text('Noite:      (      ) PARCIAL  (      ) FECHADO', 185, lastRowY + 4.5);

            const finalContentY = lastRowY + 6;
            const labelBoxH = finalContentY - subY;
            doc.rect(5, subY, 20, labelBoxH);
            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.saveGraphicsState();
            doc.setTextColor(0);
            doc.text('APLICAÇÃO DE INSUMOS', 13, subY + (labelBoxH / 2), { angle: 90, align: 'center' });
            doc.restoreGraphicsState();
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(6);

            // 7. FINAL FOOTER SIGNATURES
            const footY = ph - 12;
            doc.setLineWidth(0.4);

            doc.line(5, footY, 70, footY); doc.text('Responsável Técnico', 5, footY + 4);
            doc.line(80, footY, 145, footY); doc.text('Administrador', 80, footY + 4);
            doc.line(155, footY, 220, footY); doc.text('Encarregado', 155, footY + 4);
            doc.line(230, footY, pw - 5, footY); doc.text('Encarregado Adm.', 230, footY + 4);

            osYear = format(parseISO(os.data_prescricao), 'yy');
            osFullNum = `${osYear}/${String(os.numero_os || '').padStart(6, '0')}`;
            doc.save(`OS_${osFullNum.replace('/', '_')}_${os.quadra}.pdf`);
        } catch (error) {
            console.error('Erro ao gerar PDF:', error);
            alert('Erro ao gerar layout: ' + error.message);
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Finalizada': return { bg: 'rgba(46, 125, 50, 0.1)', color: '#2e7d32', icon: <CheckCircle size={14} /> };
            case 'Iniciada': return { bg: 'rgba(25, 118, 210, 0.1)', color: '#1976d2', icon: <Clock size={14} /> };
            case 'Parcial': return { bg: 'rgba(251, 140, 0, 0.1)', color: '#f57c00', icon: <AlertCircle size={14} /> };
            default: return { bg: 'rgba(100, 116, 139, 0.1)', color: '#64748b', icon: <ClipboardList size={14} /> };
        }
    };

    return (
        <div className="page-container">
            <div className="page-header-content">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <div>
                        <h2 style={{ color: 'var(--text)', fontWeight: '900', letterSpacing: '-0.5px' }}>📋 Receitas Agronômicas</h2>
                        <p style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Gestão de Ordens de Serviço (OS)</p>
                    </div>
                    <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
                        <div className="btn-inner">
                            {showForm ? <X size={18} /> : <Plus size={18} />}
                            {showForm ? 'Cancelar' : 'Nova Receita'}
                        </div>
                    </button>
                </div>
            </div>

            {showForm && (
                <div className="premium-card glass" style={{ marginBottom: '2rem', border: '1px solid var(--primary-light)' }}>
                    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '2rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                            <div className="form-group">
                                <label><Search size={14} /> Quadra</label>
                                <select value={formData.quadra} onChange={e => setFormData({ ...formData, quadra: e.target.value })} className="filter-select" style={{ width: '100%' }} required>
                                    <option value="">Selecione...</option>
                                    {quadrasMeta.map(q => <option key={q.id} value={q.nome}>{q.nome}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label><ClipboardList size={14} /> Operação</label>
                                <select value={formData.operacao} onChange={e => setFormData({ ...formData, operacao: e.target.value })} className="filter-select" style={{ width: '100%' }} required>
                                    <option value="">Selecione...</option>
                                    {operations.map(o => <option key={o} value={o}>{o}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label><FileText size={14} /> Data Prescrição</label>
                                <input type="date" value={formData.data_prescricao} onChange={e => setFormData({ ...formData, data_prescricao: e.target.value })} className="input-field" required />
                            </div>
                        </div>

                        <div style={{ background: 'rgba(251, 140, 0, 0.03)', padding: '1.5rem', borderRadius: '15px', border: '1px dashed var(--secondary-light)' }}>
                            <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.2rem', color: 'var(--secondary)' }}>
                                <Droplets size={18} /> Insumos & Produtos
                            </h4>
                            <div style={{ display: 'grid', gap: '1rem' }}>
                                {formData.insumos.map((insumo, idx) => (
                                    <div key={idx} style={{ display: 'grid', gridTemplateColumns: '100px 1fr 150px 50px', gap: '0.8rem', alignItems: 'center' }}>
                                        <input placeholder="Cod" value={insumo.codigo} onChange={e => handleInsumoChange(idx, 'codigo', e.target.value)} className="input-field" />
                                        <input
                                            placeholder="Material / Insumo"
                                            list="materials-list"
                                            value={insumo.material}
                                            onChange={e => handleInsumoChange(idx, 'material', e.target.value)}
                                            className="input-field"
                                            required
                                        />
                                        <datalist id="materials-list">
                                            {insumosMeta.map(i => (
                                                <option key={i.id} value={i.insumo} />
                                            ))}
                                        </datalist>
                                        <input
                                            placeholder="Dosagem"
                                            value={insumo.dosagem}
                                            onChange={e => handleInsumoChange(idx, 'dosagem', e.target.value)}
                                            className="input-field"
                                            required
                                        />
                                        {formData.insumos.length > 1 && (
                                            <button type="button" onClick={() => handleRemoveInsumo(idx)} className="btn btn-mini" style={{ color: '#ef5350' }}>
                                                <div className="btn-inner"><Trash2 size={16} /></div>
                                            </button>
                                        )}
                                    </div>
                                ))}
                                <button type="button" onClick={handleAddInsumo} className="btn btn-outline" style={{ marginTop: '0.5rem', alignSelf: 'flex-start' }}>
                                    <div className="btn-inner" style={{ padding: '0.5rem 1rem' }}><Plus size={16} /> Add Produto</div>
                                </button>
                            </div>
                        </div>

                        <button type="submit" className="btn btn-primary" style={{ height: '50px' }}>
                            <div className="btn-inner" style={{ fontSize: '1rem' }}>
                                <Save size={20} /> Salvar Receita Agronômica
                            </div>
                        </button>
                    </form>
                </div>
            )}

            <div className="premium-card glass">
                {loading ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Buscando receitas...</div>
                ) : ordens.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center' }}>
                        <div style={{ opacity: 0.3, marginBottom: '1rem' }}><ClipboardList size={48} style={{ margin: '0 auto' }} /></div>
                        <p style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Nenhuma receita cadastrada.</p>
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '2.5px solid var(--border)', textAlign: 'left' }}>
                                    <th style={{ padding: '1rem' }}>OS Nº</th>
                                    <th style={{ padding: '1rem' }}>Data</th>
                                    <th style={{ padding: '1rem' }}>Quadra</th>
                                    <th style={{ padding: '1rem' }}>Operação</th>
                                    <th style={{ padding: '1rem' }}>Insumos</th>
                                    <th style={{ padding: '1rem' }}>Status</th>
                                    <th style={{ padding: '1rem' }}>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ordens.map(os => {
                                    const status = getStatusStyle(os.situacao);
                                    return (
                                        <tr key={os.id} style={{ borderBottom: '1px solid var(--border)', fontSize: '0.88rem' }}>
                                            <td style={{ padding: '1rem', fontWeight: '900', color: 'var(--primary)' }}>
                                                {`${format(parseISO(os.data_prescricao), 'yy')}/${String(os.numero_os).padStart(6, '0')}`}
                                            </td>
                                            <td style={{ padding: '1rem', fontWeight: '600' }}>
                                                {format(parseISO(os.data_prescricao), 'dd/MM/yy')}
                                            </td>
                                            <td style={{ padding: '1rem', fontWeight: '800' }}>Q-{os.quadra}</td>
                                            <td style={{ padding: '1rem', fontWeight: '700' }}>{os.operacao}</td>
                                            <td style={{ padding: '1rem' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                                    {os.insumos.map((i, idx) => (
                                                        <span key={idx} style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                            • {i.material} ({i.dosagem})
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <span style={{
                                                    display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                                                    padding: '0.4rem 0.8rem', borderRadius: '10px',
                                                    backgroundColor: status.bg, color: status.color,
                                                    fontWeight: '800', fontSize: '0.75rem', textTransform: 'uppercase'
                                                }}>
                                                    {status.icon} {os.situacao}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <div style={{ display: 'flex', gap: '0.6rem' }}>
                                                    <button onClick={() => exportToPDF(os)} className="btn btn-mini" title="Imprimir PDF">
                                                        <div className="btn-inner"><Printer size={16} /></div>
                                                    </button>
                                                    <button onClick={() => handleDelete(os.id)} className="btn btn-mini" style={{ color: '#ef5350' }} title="Excluir">
                                                        <div className="btn-inner"><Trash2 size={16} /></div>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Prescriptions;
