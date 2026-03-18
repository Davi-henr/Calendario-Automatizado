import React, { useState, useEffect } from 'react';
import PageHeader from './PageHeader';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    CheckCircle,
    Clock,
    ChevronDown,
    ChevronUp,
    Save,
    X,
    FileDown,
    ClipboardList,
    Printer // <-- IMPORTADO O ÍCONE DA IMPRESSORA
} from 'lucide-react';
// IMPORTAMOS OS SERVICES NECESSÁRIOS PARA O PDF
import { osService, registrosService, ordensSaidaService, quadrasService, insumosService } from '../lib/services';
import { format, parseISO, differenceInDays, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Launch({ logo }) {
    const [registros, setRegistros] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [filters, setFilters] = useState({ block: 'Todos', recipe: 'Todos', status: 'Iniciada' });
    const [showOSModal, setShowOSModal] = useState(false);
    const [pendingOS, setPendingOS] = useState([]);
    const [selectedOS, setSelectedOS] = useState(null);

    // Estados para alimentar o layout do PDF
    const [quadrasMeta, setQuadrasMeta] = useState([]);
    const [insumosMeta, setInsumosMeta] = useState([]);

    // Form State
    const [formData, setFormData] = useState({
        quantidade_bombas: '',
        pes_tratados: '',
        marcha: '1ªA',
        data_inicial: format(new Date(), 'yyyy-MM-dd'),
        data_final: '',
        quadra: '',
        receita: '',
        dias_carencia: '7',
        observacao: '',
        situacao: 'Iniciada'
    });

    const blocks = ["001", "002", "003", "004", "005A", "005B", "005C", "006A", "006B", "007", "008", "009", "010", "011", "012", "013", "014", "015", "016", "017", "018", "019", "020", "021", "022", "024", "026", "027", "028", "029", "030", "031", "032", "033", "034"];
    const recipes = ["Chuá", "Leprose", "Alternária", "Pinta Preta", "Aplicação de Winner", "Herbicida"];
    const gears = ["1ªA", "1ªRA", "2ªA", "2ªRA", "3ªA", "3ªRA", "4ªA", "4ªRA"];

    useEffect(() => {
        loadRegistros();
        loadPendingOS();
        // Carrega os metas silenciosamente para caso o usuário queira imprimir o PDF
        quadrasService.getAll().then(setQuadrasMeta).catch(console.error);
        insumosService.getAll().then(setInsumosMeta).catch(console.error);
    }, []);

    const loadPendingOS = async () => {
        try {
            const data = await osService.getPending();
            const strictlyPending = data.filter(os => os.situacao !== 'Iniciada');
            setPendingOS(strictlyPending);
        } catch (error) {
            console.error('Error loading OS:', error);
        }
    };

    const loadRegistros = async () => {
        try {
            const data = await registrosService.getAll();
            setRegistros(data);
        } catch (error) {
            console.error('Error loading registros:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const sanitizedData = {
                ...formData,
                data_final: formData.data_final || null,
                quantidade_bombas: formData.quantidade_bombas || 0,
                pes_tratados: formData.pes_tratados || 0
            };

            if (editingId) {
                await registrosService.update(editingId, sanitizedData);
                setEditingId(null);
            } else {
                const newReg = await registrosService.create({
                    ...sanitizedData,
                    os_id: selectedOS?.id
                });

                if (selectedOS) {
                    await osService.update(selectedOS.id, { situacao: 'Iniciada' });
                }
            }
            setShowForm(false);
            setSelectedOS(null);
            setFormData({
                quantidade_bombas: '',
                pes_tratados: '',
                marcha: '1ªA',
                data_inicial: format(new Date(), 'yyyy-MM-dd'),
                data_final: '',
                quadra: '',
                receita: '',
                dias_carencia: '7',
                observacao: '',
                situacao: 'Iniciada'
            });
            loadRegistros();
            loadPendingOS();
        } catch (error) {
            alert('Erro ao salvar: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async (reg) => {
        const newStatus = reg.situacao === 'Concluído' ? 'Pendente' : 'Concluído';
        const completionDate = newStatus === 'Concluído' ? format(new Date(), 'yyyy-MM-dd') : null;

        try {
            await registrosService.update(reg.id, {
                situacao: newStatus,
                data_conclusao: completionDate
            });
            loadRegistros();
        } catch (error) {
            alert('Erro ao atualizar status');
        }
    };

    const [showFinalizeModal, setShowFinalizeModal] = useState(false);
    const [finalizingReg, setFinalizingReg] = useState(null);
    const [finalizeData, setFinalizeData] = useState({
        data_final: format(new Date(), 'yyyy-MM-dd'),
        quantidade_bombas: '',
        pes_tratados: '',
        nao_agendar: false 
    });

    useEffect(() => {
        if (finalizingReg?.os_id) {
            const fetchPumps = async () => {
                try {
                    const total = await ordensSaidaService.getPumpsSummary(finalizingReg.os_id);
                    setFinalizeData(prev => ({ ...prev, quantidade_bombas: total > 0 ? total.toString() : '' }));
                } catch (error) {
                    console.error('Erro ao buscar resumo de bombas:', error);
                }
            };
            fetchPumps();
        }
    }, [finalizingReg]);

    const handleFinalize = async (e) => {
        e.preventDefault();
        if (!finalizingReg) return;

        try {
            setLoading(true);
            await registrosService.update(finalizingReg.id, {
                data_final: finalizeData.data_final || null,
                quantidade_bombas: finalizeData.quantidade_bombas || 0,
                pes_tratados: finalizeData.pes_tratados || 0,
                situacao: 'Finalizada',
                nao_agendar: finalizeData.nao_agendar
            });

            if (finalizingReg.os_id) {
                await osService.update(finalizingReg.os_id, { situacao: 'Finalizada' });
            }

            setShowFinalizeModal(false);
            setFinalizingReg(null);
            setFinalizeData({
                data_final: format(new Date(), 'yyyy-MM-dd'),
                quantidade_bombas: '',
                pes_tratados: '',
                nao_agendar: false 
            });
            loadRegistros();
            loadPendingOS();
        } catch (error) {
            alert('Erro ao finalizar: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (reg) => {
        if (window.confirm('Excluir este lançamento? Se ele estiver vinculado a uma Receita, ela voltará para Pendente.')) {
            try {
                // 1. Apaga o lançamento do calendário
                await registrosService.delete(reg.id);
                
                // 2. Se tinha uma Receita (OS) vinculada, devolve ela para o status "Pendente"
                if (reg.os_id) {
                    await osService.update(reg.os_id, { situacao: 'Pendente' });
                }
                
                // 3. Atualiza as listas na tela
                loadRegistros();
                loadPendingOS();
            } catch (error) {
                alert('Erro ao excluir: ' + error.message);
            }
        }
    };

    const filteredRegistros = registros.filter(r => {
        return (filters.block === 'Todos' || r.quadra === filters.block) &&
            (filters.recipe === 'Todos' || r.receita === filters.recipe) &&
            (filters.status === 'Todos' || !filters.status || r.situacao === filters.status);
    });

    const getDaysDiff = (dateStr) => {
        if (!dateStr) return '?';
        const diff = differenceInDays(parseISO(dateStr), new Date());
        return diff;
    };

    const findSuccessor = (reg) => {
        return registros.find(r =>
            r.quadra === reg.quadra &&
            r.receita === reg.receita &&
            new Date(r.data_inicial) > new Date(reg.data_inicial)
        );
    };

    const exportToPDF = () => {
        const doc = new jsPDF();
        doc.text('Relatório de Pulverização - AgroControl', 14, 15);

        const tableData = filteredRegistros.map(reg => [
            reg.situacao,
            format(parseISO(reg.data_inicial), 'dd/MM/yyyy'),
            reg.data_final ? format(parseISO(reg.data_final), 'dd/MM/yyyy') : '-',
            reg.quadra,
            reg.receita,
            reg.proxima_pulverizacao ? format(parseISO(reg.proxima_pulverizacao), 'dd/MM/yyyy') : '',
            reg.observacao || ''
        ]);

        doc.autoTable({
            head: [['Situação', 'Início', 'Fim', 'Quadra', 'Receita', 'Próxima', 'Obs']],
            body: tableData,
            startY: 25,
            theme: 'grid'
        });

        doc.save(`relatorio-pulverizacao-${format(new Date(), 'dd-MM-yyyy')}.pdf`);
    };

    // =======================================================================
    // FUNÇÃO IMPORTADA E ADAPTADA PARA IMPRIMIR A RECEITA/OS DIRETAMENTE AQUI
    // =======================================================================
    const exportOS_PDF = async (regItem) => {
        if (!regItem.os_id) {
            alert('Este lançamento foi criado manualmente e não possui Receita Agronômica vinculada.');
            return;
        }

        try {
            // Busca a OS vinculada ao lançamento
            const allOS = await osService.getAll();
            const os = allOS.find(o => o.id === regItem.os_id);
            if (!os) {
                alert('Receita original não encontrada no banco de dados.');
                return;
            }

            const outbounds = await ordensSaidaService.getByOsId(os.id);
            const doc = new jsPDF('l', 'mm', 'a4');
            const pw = doc.internal.pageSize.getWidth();
            const ph = doc.internal.pageSize.getHeight();

            const quadraInfo = quadrasMeta.find(q => q.nome === os.quadra) || {};
            const areaHa = quadraInfo.hectares ? String(quadraInfo.hectares) : (os.area_ha || '');
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
            doc.rect(270, idStartY, 22, 6); doc.text(os.dados_tecnicos?.pressao || '', 272, idStartY + 4.5);

            const row2Y = idStartY + 6;
            doc.rect(5, row2Y, 25, 6); doc.text('Área Ha:', 7, row2Y + 4.5);
            doc.rect(30, row2Y, 60, 6); doc.text(areaHa, 32, row2Y + 4.5); 
            doc.rect(90, row2Y, 45, 6); doc.text('N° Recomendação:', 92, row2Y + 4.5);
            doc.rect(135, row2Y, 40, 6); doc.text(os.recomendacao || '', 137, row2Y + 4.5);
            doc.rect(175, row2Y, 35, 6); doc.text('Hora Inicial:', 177, row2Y + 4.5);
            doc.rect(210, row2Y, 35, 6); doc.text('        :        ', 212, row2Y + 4.5);
            doc.rect(245, row2Y, 25, 6); doc.text('Qtde de Pés:', 247, row2Y + 4.5);
            const rawPes = regItem.pes_tratados || os.dados_tecnicos?.pes || '';
            doc.rect(270, row2Y, 22, 6); doc.setFont('helvetica', 'bold'); doc.text(rawPes.toString(), 272, row2Y + 4.5); doc.setFont('helvetica', 'normal');

            const row3Y = row2Y + 6;
            doc.rect(5, row3Y, 25, 6); doc.text('Operação:', 7, row3Y + 4.5);
            doc.rect(30, row3Y, 60, 6); doc.text(os.operacao || '', 32, row3Y + 4.5);
            doc.rect(90, row3Y, 45, 6); doc.text('N° Lançamento:', 92, row3Y + 4.5);
            doc.rect(135, row3Y, 40, 6); doc.text('', 137, row3Y + 4.5);
            doc.rect(175, row3Y, 35, 6); doc.text('Data Final:', 177, row3Y + 4.5);

            const dataFinalStr = regItem.data_final ? format(parseISO(regItem.data_final), 'dd / MM / yyyy') : '        /        /        ';
            doc.rect(210, row3Y, 35, 6); doc.text(dataFinalStr, 212, row3Y + 4.5);
            doc.rect(245, row3Y, 25, 6); doc.text('Marcha:', 247, row3Y + 4.5);
            doc.rect(270, row3Y, 22, 6); doc.text(os.dados_tecnicos?.marcha || '', 272, row3Y + 4.5);

            const row4Y = row3Y + 6;
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

            for (let i = 0; i < 12; i++) {
                const ins = os.insumos?.[i] || {};
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
                if (!isNaN(parsedCarencia) && parsedCarencia > maxCarencia) {
                    maxCarencia = parsedCarencia;
                }

                insumosRows.push([
                    ins.codigo || '',
                    desc,
                    formatVal(ins.dosagem),
                    finalidadeAlvo, 
                    principioAtivo,
                    carenciaDias,
                    cons.retirada > 0 ? 'TOTAL' : '',
                    formatVal(cons.retirada),
                    formatVal(cons.real),
                    formatVal(cons.devolucao)
                ]);
            }

            doc.autoTable({
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
            if (regItem.situacao === 'Finalizada' && regItem.data_final) {
                const finalDate = parseISO(regItem.data_final);
                const releaseDate = addDays(finalDate, carenciaParaImprimir);
                liberadoColheitaText += ' ' + format(releaseDate, 'dd/MM/yyyy');
            } else {
                liberadoColheitaText += ' (Aguardando Fim)';
            }

            doc.rect(210, midY, 82, 6); 
            doc.setFont('helvetica', 'bold');
            doc.text(liberadoColheitaText, 212, midY + 4.5);
            doc.setFont('helvetica', 'normal');

            const subY = midY + 6;
            const weatherData = [
                ['Temperatura ar°:', '', '', 'Velocidade do Vento:', '', '', 'Umidade Relativa do Ar:', '', ''],
                ['Temperatura ar°:', '', '', 'Velocidade do Vento:', '', '', 'Umidade Relativa do Ar:', '', ''],
                ['Temperatura ar°:', '', '', 'Velocidade do Vento:', '', '', 'Umidade Relativa do Ar:', '', '']
            ];

            doc.autoTable({
                startY: subY,
                head: [['', 'HORARIO', 'PARAMETRO', '', 'HORARIO', 'PARAMETRO', '', 'HORARIO', 'PARAMETRO']],
                body: weatherData,
                theme: 'grid',
                styles: { fontSize: 8, cellPadding: 0.5 }, 
                headStyles: { fillColor: [240, 240, 240], textColor: 0 },
                margin: { left: 25 },
                tableWidth: pw - 30
            });

            const shiftY = doc.lastAutoTable.finalY + 4;
            const shiftHead = ['N° Trator', 'N° Equip.', 'Operador', 'Qtd. Bombas'];
            const emptyShiftRows = [['', '', '', ''], ['', '', '', ''], ['', '', '', ''], ['', '', '', ''], ['', '', '', '']];

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8); 

            const shiftTableMargin = 25; 
            
            doc.autoTable({
                startY: shiftY,
                head: [[{ content: 'TURNO DO DIA', colSpan: 4, styles: { halign: 'left', fillColor: [220, 220, 220] } }], shiftHead],
                body: emptyShiftRows,
                theme: 'grid',
                styles: { fontSize: 8, cellPadding: 0.5 }, 
                margin: { left: shiftTableMargin },
                tableWidth: 135
            });

            doc.autoTable({
                startY: shiftY,
                head: [[{ content: 'TURNO DA NOITE', colSpan: 4, styles: { halign: 'left', fillColor: [220, 220, 220] } }], shiftHead],
                body: emptyShiftRows,
                theme: 'grid',
                styles: { fontSize: 8, cellPadding: 0.5 }, 
                margin: { left: shiftTableMargin + 135 + 2 },
                tableWidth: 135
            });

            const totalY = doc.lastAutoTable.finalY;
            doc.rect(25, totalY, 110, 6); doc.setFont('helvetica', 'bold'); doc.text('TOTAL DE BOMBAS', 105, totalY + 4.5, { align: 'right' });
            doc.rect(shiftTableMargin + 135 + 2, totalY, 109, 6); doc.text('TOTAL DE BOMBAS', 236, totalY + 4.5, { align: 'right' });

            const totalBombas = regItem.quantidade_bombas?.toString() || '';
            doc.rect(135, totalY, 25, 6); doc.text(totalBombas, 137, totalY + 4.5);
            doc.rect(pw - 31, totalY, 26, 6); doc.text(totalBombas, pw - 29, totalY + 4.5);
            doc.setFont('helvetica', 'normal');

            const sigStartY = totalY + 5;
            doc.rect(25, sigStartY, 135, 6); doc.text('Assinatura Preparador de Calda: ____________________________________________________________________', 27, sigStartY + 4.5);
            doc.rect(162, sigStartY, pw - 167, 6);
            doc.text('Assinatura Preparador de Calda: ____________________________________________________________________', 164, sigStartY + 4.5);

            const lastRowY = sigStartY + 5;
            doc.rect(25, lastRowY, 135, 6);
            doc.text('DIA:      (      ) PARCIAL  (      ) FECHADO', 50, lastRowY + 4.5);
            doc.rect(162, lastRowY, pw - 167, 6);
            doc.text('Noite:      (      ) PARCIAL  (      ) FECHADO', 185, lastRowY + 4.5);

            const labelBoxH = (lastRowY + 6) - subY;
            doc.rect(5, subY, 20, labelBoxH);
            doc.setFontSize(10); 
            doc.setFont('helvetica', 'bold');
            doc.saveGraphicsState();
            doc.setTextColor(0);
            doc.text('APLICAÇÃO DE INSUMOS', 13, subY + (labelBoxH / 2), { angle: 90, align: 'center' });
            doc.restoreGraphicsState();
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8); 

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

    return (
        <div className="premium-card glass" style={{ border: 'none', boxShadow: 'none', background: 'transparent', padding: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <PageHeader title="Gestão de Lançamentos" subtitle="Controle diário de pulverização e aplicações" logo={logo} />
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <button onClick={exportToPDF} className="btn btn-secondary">
                        <div className="btn-inner" style={{ padding: '0.6rem 1.2rem' }}>
                            <FileDown size={18} /> Exportar PDF
                        </div>
                    </button>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button onClick={() => setShowOSModal(true)} className="btn btn-mini" title="Puxar Receita Agronômica">
                            <div className="btn-inner" style={{ padding: '0.5rem' }}>
                                <Search size={20} />
                            </div>
                        </button>
                        <button
                            onClick={() => { setShowForm(!showForm); if (!showForm) { setEditingId(null); setSelectedOS(null); } }}
                            className="btn btn-primary"
                        >
                            <div className="btn-inner">
                                {showForm ? <X size={20} /> : <Plus size={20} />}
                                {showForm ? 'Cancelar' : 'Novo Lançamento'}
                            </div>
                        </button>
                    </div>
                </div>
            </div>

            {showForm && (
                <div className="premium-card">
                    <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                        <div className="form-group">
                            <label>Data Inicial</label>
                            <input type="date" name="data_inicial" value={formData.data_inicial} onChange={handleInputChange} className="input-field" required />
                        </div>
                        <div className="form-group">
                            <label>Situação</label>
                            <select name="situacao" value={formData.situacao} onChange={handleInputChange} className="filter-select" style={{ width: '100%' }}>
                                <option value="Iniciada">Iniciada</option>
                                <option value="Finalizada">Finalizada</option>
                                <option value="Pendente">Pendente</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Quadra</label>
                            <select name="quadra" value={formData.quadra} onChange={handleInputChange} className="filter-select" style={{ width: '100%' }} required>
                                <option value="">Selecione</option>
                                {blocks.map(b => <option key={b} value={b}>{b}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Receita</label>
                            <select name="receita" value={formData.receita} onChange={handleInputChange} className="filter-select" style={{ width: '100%' }} required>
                                <option value="">Selecione</option>
                                {recipes.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>

                        {formData.situacao !== 'Iniciada' && (
                            <>
                                <div className="form-group">
                                    <label>Data Final</label>
                                    <input type="date" name="data_final" value={formData.data_final} onChange={handleInputChange} className="input-field" />
                                </div>
                                <div className="form-group">
                                    <label>Nº Bombas</label>
                                    <input type="number" name="quantidade_bombas" value={formData.quantidade_bombas} onChange={handleInputChange} className="input-field" />
                                </div>
                                <div className="form-group">
                                    <label>Pés Tratados</label>
                                    <input type="number" name="pes_tratados" value={formData.pes_tratados} onChange={handleInputChange} className="input-field" />
                                </div>
                            </>
                        )}

                        <div className="form-group">
                            <label>Carência (Dias)</label>
                            <input type="number" name="dias_carencia" value={formData.dias_carencia} onChange={handleInputChange} className="input-field" />
                        </div>
                        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                            <label>Observação</label>
                            <textarea name="observacao" value={formData.observacao} onChange={handleInputChange} className="input-field" style={{ minHeight: '80px', fontFamily: 'inherit' }} placeholder="Ex: Produto X usou..."></textarea>
                        </div>
                        <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                            <button type="submit" className="btn btn-primary">
                                <div className="btn-inner">
                                    <Save size={20} /> {editingId ? 'Salvar Alterações' : 'Salvar Registro'}
                                </div>
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {showFinalizeModal && (
                <div style={{
                    position: 'fixed', inset: 0,
                    background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(8px)',
                    zIndex: 2000, display: 'grid', placeItems: 'start center',
                    padding: '2rem 1.5rem', overflowY: 'auto'
                }}>
                    <div className="premium-card glass" style={{ maxWidth: '500px', width: '100%', position: 'relative', border: '1px solid rgba(255,255,255,0.4)', padding: '2.5rem' }}>
                        <button onClick={() => {
                            setShowFinalizeModal(false);
                            setFinalizingReg(null); 
                        }} className="btn btn-mini" style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', opacity: 0.8 }}>
                            <div className="btn-inner" style={{ padding: '0.4rem' }}>
                                <X size={20} />
                            </div>
                        </button>
                        <h3 style={{ marginBottom: '0.5rem', color: 'var(--primary)', fontWeight: '900', fontFamily: 'var(--font-display)', fontSize: '1.6rem' }}>Finalizar Quadra</h3>
                        <p style={{ marginBottom: '2rem', fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                            Confirme os dados de aplicação da quadra <span style={{ color: 'var(--secondary)' }}>{finalizingReg?.quadra}</span>
                        </p>

                        <form onSubmit={handleFinalize} style={{ display: 'grid', gap: '1.5rem' }}>
                            <div className="form-group">
                                <label>Data Final</label>
                                <input type="date" value={finalizeData.data_final} onChange={e => setFinalizeData({ ...finalizeData, data_final: e.target.value })} className="input-field" required />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label>Qtd Bombas</label>
                                    <input type="number" value={finalizeData.quantidade_bombas} onChange={e => setFinalizeData({ ...finalizeData, quantidade_bombas: e.target.value })} className="input-field" required placeholder="Ex: 5" />
                                </div>
                                <div className="form-group">
                                    <label>Pés Tratados</label>
                                    <input type="number" value={finalizeData.pes_tratados} onChange={e => setFinalizeData({ ...finalizeData, pes_tratados: e.target.value })} className="input-field" required placeholder="Ex: 400" />
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                                <input 
                                    type="checkbox" 
                                    id="nao_agendar" 
                                    checked={finalizeData.nao_agendar}
                                    onChange={e => setFinalizeData({ ...finalizeData, nao_agendar: e.target.checked })}
                                    style={{ width: '18px', height: '18px', accentColor: 'var(--primary)', cursor: 'pointer' }}
                                />
                                <label htmlFor="nao_agendar" style={{ fontSize: '0.9rem', color: 'var(--text)', cursor: 'pointer', fontWeight: '600' }}>
                                    Atividade sem carência (Não exibir no calendário)
                                </label>
                            </div>

                            <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem', width: '100%' }}>
                                <div className="btn-inner">
                                    <CheckCircle size={22} /> Confirmar e Finalizar
                                </div>
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="premium-card glass" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
                <div style={{ padding: '0.6rem', background: 'rgba(46, 125, 50, 0.1)', borderRadius: '10px', display: 'flex', alignItems: 'center' }}>
                    <Search size={20} color="var(--primary)" />
                </div>
                <select value={filters.block} onChange={(e) => setFilters(f => ({ ...f, block: e.target.value }))} className="filter-select">
                    <option value="Todos">Todas Quadras</option>
                    {blocks.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
                <select value={filters.recipe} onChange={(e) => setFilters(f => ({ ...f, recipe: e.target.value }))} className="filter-select">
                    <option value="Todos">Todas Receitas</option>
                    {recipes.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <select value={filters.status} onChange={(e) => setFilters(f => ({ ...f, status: e.target.value }))} className="filter-select">
                    <option value="Todos">Todas Situações</option>
                    <option value="Iniciada">Iniciada</option>
                    <option value="Finalizada">Finalizada</option>
                    <option value="Pendente">Pendente</option>
                </select>
            </div>

            {/* Results Table/Cards */}
            <div className="results-container">
                {loading ? (
                    <p style={{ textAlign: 'center', padding: '2rem' }}>Carregando dados...</p>
                ) : filteredRegistros.length === 0 ? (
                    <p style={{ textAlign: 'center', padding: '2rem' }}>Nenhum registro encontrado.</p>
                ) : (
                    <div className="table-responsive">
                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--border)' }}>
                                    <th style={{ padding: '1rem' }}>Situação</th>
                                    <th style={{ padding: '1rem' }}>Início</th>
                                    <th style={{ padding: '1rem' }}>Fim</th>
                                    <th style={{ padding: '1rem' }}>Quadra</th>
                                    <th style={{ padding: '1rem' }}>Receita</th>
                                    <th style={{ padding: '1rem' }}>Próxima</th>
                                    <th style={{ padding: '1rem' }}>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRegistros.map(reg => (
                                    <tr key={reg.id} style={{ borderBottom: '1px solid var(--border)', backgroundColor: reg.situacao === 'Concluído' ? '#f1f8e9' : 'transparent' }}>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                {reg.situacao === 'Finalizada' ?
                                                    <CheckCircle size={20} color="#2e7d32" /> :
                                                    <Clock size={20} color={reg.situacao === 'Iniciada' ? '#fbc02d' : '#c62828'} />
                                                }
                                                <span style={{
                                                    fontWeight: '700',
                                                    color: reg.situacao === 'Finalizada' ? '#2e7d32' : (reg.situacao === 'Iniciada' ? '#f9a825' : '#c62828'),
                                                    fontSize: '0.85rem'
                                                }}>
                                                    {reg.situacao}
                                                </span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>{format(parseISO(reg.data_inicial), 'dd/MM/yyyy')}</td>
                                        <td style={{ padding: '1rem' }}>{reg.data_final ? format(parseISO(reg.data_final), 'dd/MM/yyyy') : '-'}</td>
                                        <td style={{ padding: '1rem', fontWeight: 'bold' }}>{reg.quadra}</td>
                                        <td style={{ padding: '1rem' }}>{reg.receita}</td>
                                        <td style={{ padding: '1rem' }}>
                                            {reg.proxima_pulverizacao ? (() => {
                                                const succ = findSuccessor(reg);
                                                return (
                                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                        <span style={{
                                                            textDecoration: succ ? 'line-through' : 'none',
                                                            color: succ ? '#2e7d32' : 'inherit',
                                                            fontWeight: succ ? 'bold' : 'normal'
                                                        }}>
                                                            {format(parseISO(reg.proxima_pulverizacao), 'dd/MM/yyyy')}
                                                        </span>
                                                        {succ ? (
                                                            <span style={{ fontSize: '0.7rem', color: '#2e7d32', fontWeight: 'bold' }}>
                                                                Iniciada: {format(parseISO(succ.data_inicial), 'dd/MM/yyyy')}
                                                            </span>
                                                        ) : (
                                                            <span style={{
                                                                fontSize: '0.7rem',
                                                                padding: '0.1rem 0.3rem',
                                                                borderRadius: '4px',
                                                                backgroundColor: getDaysDiff(reg.proxima_pulverizacao) < 0 ? '#ffebee' : '#e8f5e9',
                                                                color: getDaysDiff(reg.proxima_pulverizacao) < 0 ? '#c62828' : '#2e7d32',
                                                                width: 'fit-content'
                                                            }}>
                                                                {getDaysDiff(reg.proxima_pulverizacao)}d
                                                            </span>
                                                        )}
                                                    </div>
                                                );
                                            })() : '-'}
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ display: 'flex', gap: '0.6rem' }}>
                                                {reg.situacao !== 'Finalizada' && (
                                                    <button onClick={() => { 
                                                        setFinalizeData({
                                                            data_final: format(new Date(), 'yyyy-MM-dd'),
                                                            quantidade_bombas: '',
                                                            pes_tratados: '',
                                                            nao_agendar: false
                                                        });
                                                        setFinalizingReg(reg); 
                                                        setShowFinalizeModal(true); 
                                                    }} className="btn btn-mini" style={{ color: '#2e7d32' }} title="Finalizar">
                                                        <div className="btn-inner">
                                                            <CheckCircle size={16} />
                                                        </div>
                                                    </button>
                                                )}
                                                
                                                <button onClick={() => { setEditingId(reg.id); setFormData(reg); setShowForm(true); }} className="btn btn-mini" title="Editar">
                                                    <div className="btn-inner">
                                                        <Edit2 size={16} />
                                                    </div>
                                                </button>
                                                
                                                {/* NOVO: O BOTÃO DE IMPRESSÃO DE RECEITAS FOI ADICIONADO AQUI */}
                                                {reg.situacao === 'Finalizada' && reg.os_id && (
                                                    <button onClick={() => exportOS_PDF(reg)} className="btn btn-mini" style={{ color: '#0ea5e9' }} title="Imprimir Receita (OS)">
                                                        <div className="btn-inner">
                                                            <Printer size={16} />
                                                        </div>
                                                    </button>
                                                )}
                                                
                                                <button onClick={() => handleDelete(reg)} className="btn btn-mini" style={{ color: '#ef5350' }} title="Excluir">
                                                    <div className="btn-inner">
                                                        <Trash2 size={16} />
                                                    </div>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <style>{`
                input::placeholder { color: #94a3b8 !important; }
            `}</style>
            
            {showOSModal && (
                <div style={{
                    position: 'fixed', inset: 0,
                    background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)',
                    zIndex: 2500, display: 'grid', placeItems: 'center', padding: '1rem'
                }}>
                    <div className="premium-card glass" style={{ maxWidth: '600px', width: '100%', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0, color: 'var(--primary)', fontWeight: '900' }}>Puxar Receita Agronômica</h3>
                            <button onClick={() => setShowOSModal(false)} className="btn btn-mini">
                                <div className="btn-inner" style={{ padding: '0.4rem' }}><X size={20} /></div>
                            </button>
                        </div>

                        {pendingOS.length === 0 ? (
                            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                Nenhuma receita pendente encontrada.
                            </div>
                        ) : (
                            <div style={{ overflowY: 'auto', flex: 1, display: 'grid', gap: '1rem' }}>
                                {pendingOS.map(os => (
                                    <button
                                        key={os.id}
                                        onClick={() => {
                                            const insumosStr = os.insumos
                                                ?.filter(i => i.material)
                                                .map(i => `${i.material} (${i.dosagem || ''})`)
                                                .join(', ');

                                            setFormData({
                                                ...formData,
                                                quadra: os.quadra,
                                                receita: os.operacao,
                                                situacao: 'Iniciada',
                                                observacao: insumosStr ? `Produtos da OS: ${insumosStr}` : formData.observacao
                                            });
                                            setSelectedOS(os);
                                            setShowOSModal(false);
                                            setShowForm(true);
                                        }}
                                        style={{
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                            padding: '1.25rem', borderRadius: '16px', border: '1.5px solid var(--border)',
                                            background: 'white', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                                        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                                    >
                                        <div>
                                            <div style={{ fontWeight: '900', color: 'var(--primary)', fontSize: '1.1rem' }}>OS Nº {String(os.numero_os).padStart(4, '0')}</div>
                                            <div style={{ fontWeight: '700', color: 'var(--text)' }}>Q-{os.quadra} • {os.operacao}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{format(parseISO(os.data_prescricao), 'dd/MM/yyyy')}</div>
                                        </div>
                                        <div style={{ background: 'var(--primary-gradient)', color: 'white', padding: '0.5rem', borderRadius: '10px' }}>
                                            <Plus size={20} />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
