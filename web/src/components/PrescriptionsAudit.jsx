import React, { useState, useEffect, useMemo } from 'react';
import { osService, insumosService, quadrasService, ordensSaidaService, entradasService, saidasService } from '../lib/services';
import { Search, Printer, ClipboardList, CheckCircle, Clock, AlertCircle, Filter, CheckSquare } from 'lucide-react';
import { format, parseISO, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const PrescriptionsAudit = ({ logo }) => {
    const [ordens, setOrdens] = useState([]);
    const [searchTerm, setSearchTerm] = useState(''); 
    const [insumosMeta, setInsumosMeta] = useState([]);
    const [quadrasMeta, setQuadrasMeta] = useState([]);
    const [entradasMeta, setEntradasMeta] = useState([]);
    const [saidasMeta, setSaidasMeta] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isPrinting, setIsPrinting] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [osData, insData, quaData, inData, outData] = await Promise.all([
                osService.getAll(),
                insumosService.getAll(),
                quadrasService.getAll(),
                entradasService.getAll().catch(() => []), 
                saidasService.getAll().catch(() => [])   
            ]);
            setOrdens(osData);
            setInsumosMeta(insData);
            setQuadrasMeta(quaData || []);
            setEntradasMeta(inData || []);
            setSaidasMeta(outData || []);
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
        } finally {
            setLoading(false);
        }
    };

    const getDynamicStatus = (item) => {
        if (item.situacao === 'Conferida') return 'Conferida';
        const dataRef = item.data || item.data_prescricao;
        if (!dataRef) return 'Pendente';
        const today = new Date();
        const refDate = new Date(dataRef + 'T00:00:00');
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
        const refStart = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate()).getTime();
        
        if (refStart > todayStart) return 'Programado';
        if (refStart === todayStart) {
            const currentHour = today.getHours();
            if (item.turno && item.turno.toUpperCase() === 'NOITE' && currentHour >= 5 && currentHour < 18) {
                return 'Programado'; 
            }
            return 'Pendente';
        }
        return 'Pendente';
    };

    // FILTRO VITAL DA AUDITORIA (Remove da tela e do PDF)
    const filtrarInsumosAuditoria = (insumos) => {
        if (!insumos) return [];
        return insumos.filter(ins => {
            const matchedMaterial = insumosMeta.find(m => m.insumo?.toLowerCase() === ins.material?.toLowerCase().trim());
            // Se o produto existir e estiver marcado como FALSE, ele sai da lista.
            if (matchedMaterial && matchedMaterial.exibir_auditoria === false) return false;
            return true;
        });
    };

    const filteredOrdens = useMemo(() => {
        let filtered = ordens.filter(os => {
            const search = searchTerm.toLowerCase();
            const osNum = String(os.numero_os || '').padStart(6, '0');
            const quadra = (os.quadra || '').toLowerCase();
            const operacao = (os.operacao || '').toLowerCase();
            
            const matchSearch = osNum.includes(search) || quadra.includes(search) || operacao.includes(search);
            // TRAVADO: Só aceita se a OS estiver Finalizada
            const matchStatus = os.situacao === 'Finalizada'; 
            
            return matchSearch && matchStatus;
        });
        filtered.sort((a, b) => {
            const dateA = new Date(a.data_prescricao || 0).getTime();
            const dateB = new Date(b.data_prescricao || 0).getTime();
            if (dateB !== dateA) return dateB - dateA;
            return (b.numero_os || 0) - (a.numero_os || 0);
        });
        return filtered;
    }, [ordens, searchTerm]);

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(filteredOrdens.map(os => os.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectOs = (id) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
    };

    const exportBulkPDF = async () => {
        if (selectedIds.length === 0) return alert('Selecione pelo menos uma OS para imprimir.');
        
        try {
            setIsPrinting(true);
            const doc = new jsPDF('l', 'mm', 'a4');
            const pw = doc.internal.pageSize.getWidth();
            const ph = doc.internal.pageSize.getHeight();
            
            const selectedOrdens = ordens.filter(os => selectedIds.includes(os.id));

            for (let index = 0; index < selectedOrdens.length; index++) {
                const os = selectedOrdens[index];
                if (index > 0) doc.addPage(); // Adiciona página no mesmo arquivo

                const outbounds = await ordensSaidaService.getByOsId(os.id);
                const reg = os.registros?.[0] || {};
                const quadraInfo = quadrasMeta.find(q => q.nome === os.quadra) || {};
                const areaHa = quadraInfo.hectares ? String(quadraInfo.hectares) : String(os.area_ha || '');
                const variety = quadraInfo.variedade || '';

                doc.setFont('helvetica', 'normal');
                doc.setDrawColor(0);
                doc.setLineWidth(0.4);

                doc.rect(5, 5, 25, 18);
                if (logo) {
                    doc.addImage(logo, 'PNG', 6, 6, 23, 16);
                } else {
                    doc.setFontSize(10); 
                    doc.text('Fazenda', 17.5, 12, { align: 'center' });
                    doc.text('Vale dos Laranjais', 17.5, 16, { align: 'center' });
                }

                doc.rect(30, 5, pw - 85, 18);
                doc.setFontSize(13); 
                doc.setFont('helvetica', 'bold');
                doc.text('ORDEM DE SERVIÇO - APLICAÇÃO DE INSUMOS', pw / 2 - 12.5, 14, { align: 'center' });

                doc.rect(pw - 55, 5, 50, 18);
                doc.setFontSize(8); 
                doc.setFont('helvetica', 'normal');
                doc.text(`Identificação: RQ 05`, pw - 53, 9);
                doc.text(`Elaborador por: Administrativo`, pw - 53, 12);
                doc.text(`Aprovado: Gabriel Fortes`, pw - 53, 15);
                doc.text(`Aprovado em: 01/09/2020`, pw - 53, 18);

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
                doc.rect(270, idStartY, 22, 6); doc.text(String(os.dados_tecnicos?.pressao || ''), 272, idStartY + 4.5);

                const row2Y = idStartY + 6;
                doc.rect(5, row2Y, 25, 6); doc.text('Área Ha:', 7, row2Y + 4.5);
                doc.rect(30, row2Y, 60, 6); doc.text(areaHa, 32, row2Y + 4.5); 
                doc.rect(90, row2Y, 45, 6); doc.text('N° Recomendação:', 92, row2Y + 4.5);
                doc.rect(135, row2Y, 40, 6); doc.text(String(os.recomendacao || ''), 137, row2Y + 4.5);
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
                doc.rect(270, row3Y, 22, 6); doc.text(String(os.dados_tecnicos?.marcha || ''), 272, row3Y + 4.5);

                const row4Y = row3Y + 6;
                doc.rect(5, row4Y, 25, 6); doc.text('Equipamento:', 7, row4Y + 4.5);
                doc.rect(30, row4Y, 60, 6); doc.text(os.equipamento || '', 32, row4Y + 4.5);
                doc.rect(90, row4Y, 45, 6); doc.text('VARIEDADE:', 92, row4Y + 4.5);
                doc.rect(135, row4Y, 40, 6); doc.setFont('helvetica', 'bold'); doc.text(variety, 137, row4Y + 4.5); doc.setFont('helvetica', 'normal');
                doc.rect(175, row4Y, 35, 6); doc.text('Hora Final:', 177, row4Y + 4.5);
                doc.rect(210, row4Y, 35, 6); doc.text('        :        ', 212, row4Y + 4.5);
                doc.rect(245, row4Y, 25, 6); doc.text('Rotação:', 247, row4Y + 4.5);
                doc.rect(270, row4Y, 22, 6); doc.text(String(os.dados_tecnicos?.rpm || ''), 272, row4Y + 4.5);

                const formatVal = (val) => {
                    if (val === undefined || val === null || val === '') return '';
                    const normalized = val.toString().replace(',', '.');
                    const num = parseFloat(normalized);
                    if (isNaN(num) || num === 0) return '';
                    return num.toFixed(2).replace('.', ',');
                };

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

                const tableY = row4Y + 6;
                const insumosRows = [];
                let maxCarencia = 0;

                // AQUI APLICAMOS O FILTRO NA HORA DE DESENHAR AS LINHAS DO PDF
                const insumosFiltrados = filtrarInsumosAuditoria(os.insumos);

                for (let i = 0; i < 12; i++) {
                    const ins = insumosFiltrados[i] || {};
                    const desc = ins.sequencia ? `${ins.sequencia} - ${ins.material || ''}` : (ins.material || '');
                    const consById = ins.insumo_id ? consumptionMap[ins.insumo_id] : null;
                    const consByName = ins.material ? consumptionMap[ins.material.toLowerCase().trim()] : null;
                    const cons = consById || consByName || { retirada: 0, real: 0, devolucao: 0 };
                    const matchedMaterial = ins.material ? insumosMeta.find(m => m.insumo?.toLowerCase() === ins.material.toLowerCase().trim()) : null;
                    const principioAtivo = matchedMaterial?.principio_ativo || matchedMaterial?.principio || ins.principio || '';
                    const finalidadeAlvo = matchedMaterial?.classificacao || ins.finalidade || '';
                    const carenciaRaw = matchedMaterial?.carencia_dias ?? matchedMaterial?.dias_carencia ?? matchedMaterial?.carencia ?? ins.carencia;
                    const carenciaDias = (carenciaRaw !== null && carenciaRaw !== undefined && carenciaRaw !== '') ? String(carenciaRaw) : '';
                    
                    const parsedCarencia = parseInt(carenciaDias, 10);
                    if (!isNaN(parsedCarencia) && parsedCarencia > maxCarencia) maxCarencia = parsedCarencia;

                    insumosRows.push([
                        ins.codigo || '', desc, formatVal(ins.dosagem), finalidadeAlvo, principioAtivo, carenciaDias,
                        cons.retirada > 0 ? 'TOTAL' : '', formatVal(cons.retirada), formatVal(cons.real), formatVal(cons.devolucao)
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
                    styles: { fontSize: 8, cellPadding: 0.5, overflow: 'linebreak', halign: 'left', lineColor: 0, lineWidth: 0.1 }, 
                    headStyles: { fillColor: 255, textColor: 0, fontStyle: 'bold' },
                    columnStyles: {
                        0: { cellWidth: 15 }, 1: { cellWidth: 50 }, 2: { cellWidth: 25 }, 3: { cellWidth: 25 }, 4: { cellWidth: 25 }, 5: { cellWidth: 15 },
                        6: { cellWidth: 25 }, 7: { cellWidth: 35 }, 8: { cellWidth: 35 }, 9: { cellWidth: 25 }
                    },
                    margin: { left: 5, right: 5 }
                });

                const midY = doc.lastAutoTable.finalY;
                doc.rect(5, midY, 85, 6); doc.text('Reentrada de Pessoas', 7, midY + 4.5);
                doc.rect(90, midY, 45, 6); doc.text('24 Horas após aplicação', 92, midY + 4.5);
                const carenciaParaImprimir = maxCarencia > 0 ? maxCarencia : parseInt(os.carencia || 0, 10);
                doc.rect(135, midY, 75, 6); doc.text('Carencia (Dias):    ' + carenciaParaImprimir, 137, midY + 4.5);
                
                let liberadoColheitaText = 'LIBERADO COLHEITA:';
                if (os.situacao === 'Finalizada' && reg.data_final) {
                    const releaseDate = addDays(parseISO(reg.data_final), carenciaParaImprimir);
                    liberadoColheitaText += ' ' + format(releaseDate, 'dd/MM/yyyy');
                } else {
                    liberadoColheitaText += ' (Aguardando Fim)';
                }

                doc.rect(210, midY, 82, 6); 
                doc.setFont('helvetica', 'bold'); doc.text(liberadoColheitaText, 212, midY + 4.5); doc.setFont('helvetica', 'normal');

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
                    styles: { fontSize: 8, cellPadding: 0.5 }, 
                    headStyles: { fillColor: [240, 240, 240], textColor: 0 },
                    margin: { left: 25 }, tableWidth: pw - 30
                });

                const shiftY = doc.lastAutoTable.finalY + 4;
                const shiftHead = ['N° Trator', 'N° Equip.', 'Operador', 'Qtd. Bombas'];
                const emptyShiftRows = [['', '', '', ''], ['', '', '', ''], ['', '', '', ''], ['', '', '', ''], ['', '', '', '']];

                doc.setFont('helvetica', 'normal'); doc.setFontSize(8); 
                const shiftTableMargin = 25; 
                
                autoTable(doc, { startY: shiftY, head: [[{ content: 'TURNO DO DIA', colSpan: 4, styles: { halign: 'left', fillColor: [220, 220, 220] } }], shiftHead], body: emptyShiftRows, theme: 'grid', styles: { fontSize: 8, cellPadding: 0.5 }, margin: { left: shiftTableMargin }, tableWidth: 135 });
                autoTable(doc, { startY: shiftY, head: [[{ content: 'TURNO DA NOITE', colSpan: 4, styles: { halign: 'left', fillColor: [220, 220, 220] } }], shiftHead], body: emptyShiftRows, theme: 'grid', styles: { fontSize: 8, cellPadding: 0.5 }, margin: { left: shiftTableMargin + 135 + 2 }, tableWidth: 135 });

                const totalY = doc.lastAutoTable.finalY;
                doc.rect(25, totalY, 110, 6); doc.setFont('helvetica', 'bold'); doc.text('TOTAL DE BOMBAS', 105, totalY + 4.5, { align: 'right' });
                doc.rect(shiftTableMargin + 135 + 2, totalY, 109, 6); doc.text('TOTAL DE BOMBAS', 236, totalY + 4.5, { align: 'right' });
                const totalBombas = reg.quantidade_bombas?.toString() || '';
                doc.rect(135, totalY, 25, 6); doc.text(totalBombas, 137, totalY + 4.5);
                doc.rect(pw - 31, totalY, 26, 6); doc.text(totalBombas, pw - 29, totalY + 4.5);
                doc.setFont('helvetica', 'normal');

                const sigStartY = totalY + 5;
                doc.rect(25, sigStartY, 135, 6); doc.text('Assinatura Preparador de Calda: ____________________________________________________________________', 27, sigStartY + 4.5);
                doc.rect(162, sigStartY, pw - 167, 6); doc.text('Assinatura Preparador de Calda: ____________________________________________________________________', 164, sigStartY + 4.5);

                const lastRowY = sigStartY + 5;
                doc.rect(25, lastRowY, 135, 6); doc.text('DIA:      (      ) PARCIAL  (      ) FECHADO', 50, lastRowY + 4.5);
                doc.rect(162, lastRowY, pw - 167, 6); doc.text('Noite:      (      ) PARCIAL  (      ) FECHADO', 185, lastRowY + 4.5);

                const labelBoxH = (lastRowY + 6) - subY;
                doc.rect(5, subY, 20, labelBoxH);
                doc.setFontSize(10); doc.setFont('helvetica', 'bold');
                doc.saveGraphicsState(); doc.setTextColor(0);
                doc.text('APLICAÇÃO DE INSUMOS', 13, subY + (labelBoxH / 2), { angle: 90, align: 'center' });
                doc.restoreGraphicsState();
                doc.setFont('helvetica', 'normal'); doc.setFontSize(8); 

                const footY = ph - 12;
                doc.setLineWidth(0.4);
                doc.line(5, footY, 70, footY); doc.text('Responsável Técnico', 5, footY + 4);
                doc.line(80, footY, 145, footY); doc.text('Administrador', 80, footY + 4);
                doc.line(155, footY, 220, footY); doc.text('Encarregado', 155, footY + 4);
                doc.line(230, footY, pw - 5, footY); doc.text('Encarregado Adm.', 230, footY + 4);
            }

            doc.save(`Auditoria_Receitas_${format(new Date(), 'dd-MM-yyyy')}.pdf`);
        } catch (error) {
            console.error('Erro ao gerar PDF em lote:', error);
            alert('Erro ao gerar relatórios: ' + error.message);
        } finally {
            setIsPrinting(false);
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
                        <h2 style={{ color: 'var(--text)', fontWeight: '900', letterSpacing: '-0.5px' }}>🛡️ Auditoria Agronômica</h2>
                        <p style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Impressão em lote de Receitas (Filtro Citrus)</p>
                    </div>
                    <button onClick={exportBulkPDF} disabled={isPrinting} className="btn btn-primary" style={{ display: 'flex', gap: '8px' }}>
                        {isPrinting ? 'Processando PDFs...' : <><Printer size={18} /> Imprimir {selectedIds.length} Selecionadas</>}
                    </button>
                </div>
            </div>

            <div className="premium-card glass">
                {ordens.length > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem', gap: '1rem' }}>
                        <div style={{ position: 'relative', width: '300px' }}>
                            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                            <input type="text" placeholder="Buscar por OS, Quadra..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ width: '100%', padding: '0.6rem 1rem 0.6rem 2.2rem', borderRadius: '8px', border: '1px solid var(--border)', outline: 'none' }} />
                        </div>
                    </div>
                )}

                {loading ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Buscando dados da auditoria...</div>
                ) : filteredOrdens.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <p>Nenhum resultado encontrado.</p>
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '2.5px solid var(--border)', textAlign: 'left' }}>
                                    <th style={{ padding: '1rem', width: '40px' }}>
                                        <input type="checkbox" onChange={handleSelectAll} checked={selectedIds.length === filteredOrdens.length && filteredOrdens.length > 0} style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                                    </th>
                                    <th style={{ padding: '1rem' }}>OS Nº</th>
                                    <th style={{ padding: '1rem' }}>Data</th>
                                    <th style={{ padding: '1rem' }}>Quadra</th>
                                    <th style={{ padding: '1rem' }}>Operação</th>
                                    <th style={{ padding: '1rem' }}>Insumos (Filtrados)</th>
                                    <th style={{ padding: '1rem' }}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredOrdens.map(os => {
                                    const status = getStatusStyle(os.situacao);
                                    const insumosParaAuditoria = filtrarInsumosAuditoria(os.insumos);
                                    
                                    return (
                                        <tr key={os.id} style={{ borderBottom: '1px solid var(--border)', fontSize: '0.88rem' }}>
                                            <td style={{ padding: '1rem' }}>
                                                <input type="checkbox" checked={selectedIds.includes(os.id)} onChange={() => handleSelectOs(os.id)} style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                                            </td>
                                            <td style={{ padding: '1rem', fontWeight: '900', color: 'var(--primary)' }}>
                                                {`${format(parseISO(os.data_prescricao), 'yy')}/${String(os.numero_os).padStart(6, '0')}`}
                                            </td>
                                            <td style={{ padding: '1rem', fontWeight: '600' }}>{format(parseISO(os.data_prescricao), 'dd/MM/yy')}</td>
                                            <td style={{ padding: '1rem', fontWeight: '800' }}>Q-{os.quadra}</td>
                                            <td style={{ padding: '1rem', fontWeight: '700' }}>{os.operacao}</td>
                                            <td style={{ padding: '1rem' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                                    {insumosParaAuditoria.length === 0 ? (
                                                        <span style={{ fontSize: '0.75rem', color: '#9ca3af', fontStyle: 'italic' }}>Nenhum insumo válido p/ auditoria</span>
                                                    ) : (
                                                        insumosParaAuditoria.map((i, idx) => (
                                                            <span key={idx} style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>• {i.material} ({i.dosagem})</span>
                                                        ))
                                                    )}
                                                </div>
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.8rem', borderRadius: '10px', backgroundColor: status.bg, color: status.color, fontWeight: '800', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                                                    {status.icon} {os.situacao}
                                                </span>
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

export default PrescriptionsAudit;
