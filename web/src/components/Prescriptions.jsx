import React, { useState, useEffect, useMemo } from 'react';
import { osService, insumosService, quadrasService, ordensSaidaService, entradasService, saidasService } from '../lib/services';
import {
    Plus, Search, FileText, Printer, Trash2, X,
    Save, ClipboardList, Package, Droplets, ChevronDown, ChevronUp,
    AlertCircle, CheckCircle, Clock, Map as MapIcon, Edit2, Copy, Filter
} from 'lucide-react';
import { format, parseISO, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const Prescriptions = ({ logo }) => {
    const [ordens, setOrdens] = useState([]);
    const [searchTerm, setSearchTerm] = useState(''); 
    const [statusFilter, setStatusFilter] = useState('Pendente');
    const [insumosMeta, setInsumosMeta] = useState([]);
    const [quadrasMeta, setQuadrasMeta] = useState([]);
    const [entradasMeta, setEntradasMeta] = useState([]);
    const [saidasMeta, setSaidasMeta] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null); 
    
    const [showHistoryModal, setShowHistoryModal] = useState(false);

    const [formData, setFormData] = useState({
        quadra: '',
        operacao: '',
        area_ha: '',
        equipamento: 'PULVERIZADOR NATALI ALFA 4.000',
        recomendacao: '',
        carencia: '',
        data_prescricao: format(new Date(), 'yyyy-MM-dd'),
        insumos: [{ material: '', dosagem: '', sequencia: '', finalidade: '', principio: '', saldo_atual: '' }],
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

    const operations = ["Chuá","Chuá - Fertilizante", "Leprose", "Alternária", "Pinta Preta", "Aplicação de Winner", "Aplicação de Sivanto", "Herbicida Manual", "Herbicida"];

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

        if (refStart > todayStart) {
            return 'Programado';
        } else if (refStart === todayStart) {
            const currentHour = today.getHours();
            const isDayNow = currentHour >= 5 && currentHour < 18; 

            if (item.turno && item.turno.toUpperCase() === 'NOITE') {
                if (isDayNow) {
                    return 'Programado'; 
                }
            }
            return 'Pendente'; 
        } else {
            return 'Pendente';
        }
    };

    const filteredOrdens = useMemo(() => {
        let filtered = ordens.filter(os => {
            const search = searchTerm.toLowerCase();
            const osNum = String(os.numero_os || '').padStart(6, '0');
            const quadra = (os.quadra || '').toLowerCase();
            const operacao = (os.operacao || '').toLowerCase();
            
            const matchSearch = osNum.includes(search) || quadra.includes(search) || operacao.includes(search);
            const dynamicStatus = getDynamicStatus(os);
            const matchStatus = statusFilter === 'Todos' || dynamicStatus === statusFilter;

            return matchSearch && matchStatus;
        });

        filtered.sort((a, b) => {
            const dateA = new Date(a.data_prescricao || 0).getTime();
            const dateB = new Date(b.data_prescricao || 0).getTime();
            if (dateB !== dateA) return dateB - dateA;
            return (b.numero_os || 0) - (a.numero_os || 0);
        });

        return filtered;
    }, [ordens, searchTerm, statusFilter]);

    // ====================================================================
    // CIRURGIA: CÓPIA EXATA DA LÓGICA DE SALDO DO MÓDULO DE PEDIDOS
    // ====================================================================
    const safeNum = (val) => {
        if (!val) return 0;
        const parsed = parseFloat(val.toString().replace(',', '.'));
        return isNaN(parsed) ? 0 : parsed;
    };

    const calcularSaldoInsumo = (insumoNome) => {
        if (!insumoNome) return '';

        const insumoBase = insumosMeta.find(i => i.insumo.toLowerCase() === insumoNome.toLowerCase());
        if (!insumoBase) return '';

        const cutoffDate = insumoBase.data_saldo_inicial || '1970-01-01';

        const totalEntradas = entradasMeta
            .filter(e => e.insumo_id === insumoBase.id && e.data_entrada >= cutoffDate && e.ativo !== false)
            .reduce((sum, e) => sum + safeNum(e.quantidade), 0);
        
        const validSaidas = saidasMeta.filter(s => 
            s.insumo_id === insumoBase.id && 
            s.ativo !== false && // Garante ignorar saídas excluídas logicamente (Soft Delete)
            s.data_saida >= cutoffDate
        );

        const totalSaidas = validSaidas.reduce((sum, s) => sum + safeNum(s.quantidade), 0);
        const totalDevolucoes = validSaidas.reduce((sum, s) => sum + safeNum(s.devolucao), 0);
        
        const saldoInicial = safeNum(insumoBase.saldo_inicial);
        const consumoReal = totalSaidas - totalDevolucoes;
        
        let saldo = saldoInicial + totalEntradas - consumoReal;
        
        return saldo % 1 === 0 ? saldo.toString() : saldo.toFixed(2);
    };
    // ====================================================================

    const handleQuadraChange = (e) => {
        const selectedQuadra = e.target.value;
        const quadraInfo = quadrasMeta.find(q => q.nome === selectedQuadra);
        
        setFormData({ 
            ...formData, 
            quadra: selectedQuadra,
            area_ha: quadraInfo?.hectares ? String(quadraInfo.hectares) : formData.area_ha 
        });
    };

    const handleAddInsumo = () => {
        setFormData({
            ...formData,
            insumos: [...formData.insumos, { material: '', dosagem: '', saldo_atual: '' }]
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

        if (field === 'material') {
            const matchedMaterial = insumosMeta.find(m => m.insumo.toLowerCase() === value.toLowerCase());
            if (matchedMaterial) {
                newInsumos[index].codigo = matchedMaterial.codigo || '';
                newInsumos[index].dosagem = matchedMaterial.dosagem || '';
                newInsumos[index].saldo_atual = calcularSaldoInsumo(matchedMaterial.insumo);
            } else {
                newInsumos[index].codigo = '';
                newInsumos[index].saldo_atual = '';
            }
        }

        setFormData({ ...formData, insumos: newInsumos });
    };

    const handleInsumoBlur = (index) => {
        const currentMaterial = formData.insumos[index].material;
        if (currentMaterial) {
            const exists = insumosMeta.some(m => m.insumo.toLowerCase() === currentMaterial.toLowerCase());
            if (!exists) {
                const newInsumos = [...formData.insumos];
                newInsumos[index].material = '';
                newInsumos[index].codigo = '';
                newInsumos[index].dosagem = '';
                newInsumos[index].saldo_atual = '';
                setFormData({ ...formData, insumos: newInsumos });
                alert('Por favor, selecione um insumo válido da lista de cadastro.');
            }
        }
    };

    const handleEdit = (os) => {
        const insumosComSaldo = os.insumos.map(ins => ({
            ...ins,
            saldo_atual: calcularSaldoInsumo(ins.material)
        }));

        setFormData({
            quadra: os.quadra || '',
            operacao: os.operacao || '',
            area_ha: os.area_ha || '',
            equipamento: os.equipamento || '',
            recomendacao: os.recomendacao || '',
            carencia: os.carencia || '7',
            data_prescricao: os.data_prescricao ? format(parseISO(os.data_prescricao), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
            insumos: insumosComSaldo.length > 0 ? insumosComSaldo : [{ material: '', dosagem: '', sequencia: '', finalidade: '', principio: '', saldo_atual: '' }],
            dados_tecnicos: os.dados_tecnicos || { pressao: '', pes: '', marcha: '', rpm: '', velocidade: '', pontas: '', volume_calda: '' }
        });
        setEditingId(os.id);
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDuplicate = (os) => {
        const insumosComSaldo = os.insumos.map(ins => ({
            ...ins,
            saldo_atual: calcularSaldoInsumo(ins.material)
        }));

        setFormData({
            quadra: os.quadra || '',
            operacao: os.operacao || '',
            area_ha: os.area_ha || '',
            equipamento: os.equipamento || '',
            recomendacao: os.recomendacao || '',
            carencia: os.carencia || '7',
            data_prescricao: format(new Date(), 'yyyy-MM-dd'), 
            insumos: insumosComSaldo.length > 0 ? insumosComSaldo : [{ material: '', dosagem: '', sequencia: '', finalidade: '', principio: '', saldo_atual: '' }],
            dados_tecnicos: os.dados_tecnicos || { pressao: '', pes: '', marcha: '', rpm: '', velocidade: '', pontas: '', volume_calda: '' }
        });
        setEditingId(null); 
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const hasInvalidInsumo = formData.insumos.some(ins => !ins.material || ins.material.trim() === '');
        if (hasInvalidInsumo) {
            alert('Por favor, preencha corretamente todos os insumos selecionados ou remova as linhas vazias.');
            return;
        }

        const confirmMessage = editingId 
            ? "Deseja salvar as alterações nesta Receita Agronômica?" 
            : "Deseja adicionar esta nova Receita Agronômica?";
            
        if (!window.confirm(confirmMessage)) {
            return; 
        }

        try {
            const insumosToSave = formData.insumos.map(({ saldo_atual, ...rest }) => rest);

            const sanitizedData = {
                ...formData,
                insumos: insumosToSave,
                area_ha: formData.area_ha === '' ? null : formData.area_ha,
                carencia: formData.carencia === '' ? null : formData.carencia
            };

            if (editingId) {
                await osService.update(editingId, sanitizedData);
            } else {
                await osService.create(sanitizedData);
            }

            setShowForm(false);
            setEditingId(null);
            setFormData({
                quadra: '', operacao: '', area_ha: '', equipamento: '', recomendacao: '', carencia: '7',
                data_prescricao: format(new Date(), 'yyyy-MM-dd'),
                insumos: [{ material: '', dosagem: '', sequencia: '', finalidade: '', principio: '', saldo_atual: '' }],
                dados_tecnicos: { pressao: '', pes: '', marcha: '', rpm: '', velocidade: '', pontas: '', volume_calda: '' }
            });
            fetchData();
        } catch (error) {
            alert('Erro ao salvar OS: ' + error.message);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Tem certeza que deseja EXCLUIR esta Ordem de Serviço permanentemente?')) {
            try {
                await osService.delete(id);
                fetchData();
            } catch (error) {
                alert('Erro ao excluir: ' + error.message);
            }
        }
    };

    const getLastFinalizedOS = () => {
        if (!formData.quadra) return null;
        
        let finalized = ordens.filter(os => 
            os.quadra === formData.quadra && os.situacao === 'Finalizada'
        );

        if (formData.operacao === 'Leprose') {
            finalized = finalized.filter(os => os.operacao === 'Leprose');
        }
        
        if (finalized.length === 0) return null;
        
        return finalized.sort((a, b) => {
            const dateA = new Date(a.data_prescricao).getTime();
            const dateB = new Date(b.data_prescricao).getTime();
            if (dateB === dateA) {
                return (b.numero_os || 0) - (a.numero_os || 0);
            }
            return dateB - dateA;
        })[0];
    };

    const exportToPDF = async (os) => {
        try {
            const outbounds = await ordensSaidaService.getByOsId(os.id);
            const reg = os.registros?.[0] || {};
            const doc = new jsPDF('l', 'mm', 'a4');
            const pw = doc.internal.pageSize.getWidth();
            const ph = doc.internal.pageSize.getHeight();

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
                margin: { left: 25 },
                tableWidth: pw - 30
            });

            const shiftY = doc.lastAutoTable.finalY + 4;
            const shiftHead = ['N° Trator', 'N° Equip.', 'Operador', 'Qtd. Bombas'];
            const emptyShiftRows = [['', '', '', ''], ['', '', '', ''], ['', '', '', ''], ['', '', '', ''], ['', '', '', '']];

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8); 

            const shiftTableMargin = 25; 
            
            autoTable(doc, {
                startY: shiftY,
                head: [[{ content: 'TURNO DO DIA', colSpan: 4, styles: { halign: 'left', fillColor: [220, 220, 220] } }], shiftHead],
                body: emptyShiftRows,
                theme: 'grid',
                styles: { fontSize: 8, cellPadding: 0.5 }, 
                margin: { left: shiftTableMargin },
                tableWidth: 135
            });

            autoTable(doc, {
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

            const totalBombas = reg.quantidade_bombas?.toString() || '';
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
                    <button onClick={() => {
                        // CIRURGIA: Limpa a sujeira do form sempre que for criar nova receita
                        if (showForm) {
                            setShowForm(false);
                            setEditingId(null); 
                        } else {
                            setFormData({
                                quadra: '',
                                operacao: '',
                                area_ha: '',
                                equipamento: 'PULVERIZADOR NATALI ALFA 4.000',
                                recomendacao: '',
                                carencia: '',
                                data_prescricao: format(new Date(), 'yyyy-MM-dd'),
                                insumos: [{ material: '', dosagem: '', sequencia: '', finalidade: '', principio: '', saldo_atual: '' }],
                                dados_tecnicos: { pressao: '', pes: '', marcha: '', rpm: '', velocidade: '', pontas: '', volume_calda: '' }
                            });
                            setEditingId(null);
                            setShowForm(true);
                        }
                    }} className="btn btn-primary">
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
                        
                        {editingId && (
                            <div style={{ padding: '10px 15px', background: '#e0f2fe', color: '#0369a1', borderRadius: '8px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Edit2 size={18} /> Você está EDITANDO uma receita já existente.
                            </div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                            <div className="form-group">
                                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                                    <span><Search size={14} /> Quadra</span>
                                    {formData.quadra && (
                                        <button 
                                            type="button" 
                                            onClick={(e) => { e.preventDefault(); setShowHistoryModal(true); }}
                                            style={{ 
                                                background: 'rgba(25, 118, 210, 0.1)', border: 'none', color: '#1976d2', 
                                                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', 
                                                fontSize: '0.75rem', fontWeight: 'bold', padding: '4px 8px', borderRadius: '6px' 
                                            }}
                                            title="Ver histórico de produtos na quadra"
                                        >
                                            <Search size={12} /> Histórico
                                        </button>
                                    )}
                                </label>
                                <select 
                                    value={formData.quadra} 
                                    onChange={handleQuadraChange} 
                                    className="filter-select" 
                                    style={{ width: '100%' }} 
                                    required
                                >
                                    <option value="">Selecione...</option>
                                    {quadrasMeta.map(q => <option key={q.id} value={q.nome}>{q.nome}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label><MapIcon size={14} /> Área (Hectares)</label>
                                <input 
                                    type="text" 
                                    value={formData.area_ha || ''} 
                                    onChange={e => setFormData({ ...formData, area_ha: e.target.value })} 
                                    className="input-field" 
                                    placeholder="Ex: 12.5"
                                />
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
                                <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 100px 120px 40px', gap: '0.8rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border)' }}>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)' }}>Cód.</label>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)' }}>Material / Insumo *</label>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)' }}>Saldo Atual</label>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)' }}>Dosagem *</label>
                                    <label></label>
                                </div>

                                {formData.insumos.map((insumo, idx) => (
                                    <div key={idx} style={{ display: 'grid', gridTemplateColumns: '80px 1fr 100px 120px 40px', gap: '0.8rem', alignItems: 'center' }}>
                                        <input 
                                            placeholder="Cod" 
                                            value={insumo.codigo} 
                                            onChange={e => handleInsumoChange(idx, 'codigo', e.target.value)} 
                                            className="input-field" 
                                            disabled 
                                        />
                                        <input
                                            placeholder="Busque o insumo..."
                                            list="materials-list"
                                            value={insumo.material}
                                            onChange={e => handleInsumoChange(idx, 'material', e.target.value)}
                                            onBlur={() => handleInsumoBlur(idx)}
                                            className="input-field"
                                            required
                                        />
                                        <datalist id="materials-list">
                                            {insumosMeta.map(i => (
                                                <option key={i.id} value={i.insumo} />
                                            ))}
                                        </datalist>
                                        
                                        <input 
                                            placeholder="Saldo" 
                                            value={insumo.saldo_atual || ''} 
                                            className="input-field" 
                                            style={{ backgroundColor: '#f8fafc', color: 'var(--primary)', fontWeight: 'bold' }}
                                            disabled 
                                        />

                                        <input
                                            placeholder="L / Kg"
                                            value={insumo.dosagem}
                                            onChange={e => handleInsumoChange(idx, 'dosagem', e.target.value)}
                                            className="input-field"
                                            required
                                        />
                                        
                                        {formData.insumos.length > 1 ? (
                                            <button type="button" onClick={() => handleRemoveInsumo(idx)} className="btn btn-mini" style={{ color: '#ef5350' }}>
                                                <div className="btn-inner"><Trash2 size={16} /></div>
                                            </button>
                                        ) : <div></div>}
                                    </div>
                                ))}
                                <button type="button" onClick={handleAddInsumo} className="btn btn-outline" style={{ marginTop: '0.5rem', alignSelf: 'flex-start' }}>
                                    <div className="btn-inner" style={{ padding: '0.5rem 1rem' }}><Plus size={16} /> Adicionar Produto</div>
                                </button>
                            </div>
                        </div>

                        <button type="submit" className="btn btn-primary" style={{ height: '50px' }}>
                            <div className="btn-inner" style={{ fontSize: '1rem' }}>
                                <Save size={20} /> {editingId ? 'Atualizar Receita Agronômica' : 'Salvar Receita Agronômica'}
                            </div>
                        </button>
                    </form>
                </div>
            )}

            <div className="premium-card glass">
                {!showForm && ordens.length > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem', gap: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Filter size={16} style={{ color: '#94a3b8' }} />
                            <select 
                                value={statusFilter} 
                                onChange={(e) => setStatusFilter(e.target.value)} 
                                className="filter-select"
                                style={{ minWidth: '150px' }}
                            >
                                <option value="Todos">Todas as Situações</option>
                                <option value="Pendente">Pendentes</option>
                                <option value="Iniciada">Iniciadas</option>
                                <option value="Finalizada">Finalizadas</option>
                            </select>
                        </div>
                        
                        <div style={{ position: 'relative', width: '300px' }}>
                            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                            <input 
                                type="text" 
                                placeholder="Buscar por OS, Quadra ou Operação..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ width: '100%', padding: '0.6rem 1rem 0.6rem 2.2rem', borderRadius: '8px', border: '1px solid var(--border)', outline: 'none' }}
                            />
                        </div>
                    </div>
                )}

                {loading ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Buscando receitas...</div>
                ) : ordens.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center' }}>
                        <div style={{ opacity: 0.3, marginBottom: '1rem' }}><ClipboardList size={48} style={{ margin: '0 auto' }} /></div>
                        <p style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Nenhuma receita cadastrada.</p>
                    </div>
                ) : filteredOrdens.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <p>Nenhum resultado encontrado para os filtros atuais.</p>
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
                                {filteredOrdens.map(os => {
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
                                                    <button onClick={() => handleEdit(os)} className="btn btn-mini" title="Editar Receita" style={{ color: 'var(--primary)', borderColor: '#bfdbfe' }}>
                                                        <div className="btn-inner"><Edit2 size={16} /></div>
                                                    </button>
                                                    <button onClick={() => handleDuplicate(os)} className="btn btn-mini" title="Fazer uma igual (Duplicar)" style={{ color: '#f59e0b', borderColor: '#fef3c7' }}>
                                                        <div className="btn-inner"><Copy size={16} /></div>
                                                    </button>
                                                    <button onClick={() => exportToPDF(os)} className="btn btn-mini" title="Imprimir PDF">
                                                        <div className="btn-inner"><Printer size={16} /></div>
                                                    </button>
                                                    <button onClick={() => handleDelete(os.id)} className="btn btn-mini" style={{ color: '#ef5350', borderColor: '#fee2e2' }} title="Excluir">
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

            {showHistoryModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <div className="premium-card glass" style={{ background: '#fff', padding: '2rem', borderRadius: '15px', width: '90%', maxWidth: '700px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                            <h3 style={{ margin: 0, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Clock size={20} /> Última Aplicação ({formData.operacao === 'Leprose' ? 'Leprose' : 'Geral'}) - Quadra {formData.quadra}
                            </h3>
                            <button type="button" onClick={() => setShowHistoryModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                                <X size={24} />
                            </button>
                        </div>
                        
                        {(() => {
                            const lastOS = getLastFinalizedOS();
                            const isLeprose = formData.operacao === 'Leprose';
                            
                            if (!lastOS) return <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>Nenhuma aplicação <b>FINALIZADA</b> de {isLeprose ? 'Leprose' : 'qualquer operação'} encontrada no histórico para esta quadra.</p>;
                            
                            const headerProduto = isLeprose ? 'Acaricida Utilizado' : 'Inseticida Utilizado';
                            
                            const insumosFiltradosParaExibicao = lastOS.insumos ? lastOS.insumos.filter(ins => {
                                const matchedMaterial = insumosMeta.find(m => m.insumo?.toLowerCase() === ins.material?.toLowerCase().trim());
                                const classificacao = (matchedMaterial?.classificacao || ins.finalidade || '').toLowerCase();
                                
                                if (isLeprose) {
                                    return classificacao.includes('acaricida');
                                } else {
                                    return classificacao.includes('inseticida');
                                }
                            }) : [];
                            
                            return (
                                <div className="table-responsive">
                                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '2px solid var(--border)', backgroundColor: '#f8fafc' }}>
                                                <th style={{ padding: '1rem', fontSize: '0.85rem' }}>Data Aplicação</th>
                                                <th style={{ padding: '1rem', fontSize: '0.85rem' }}>Quadra</th>
                                                <th style={{ padding: '1rem', fontSize: '0.85rem' }}>Atividade</th>
                                                <th style={{ padding: '1rem', fontSize: '0.85rem' }}>{headerProduto}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                                <td style={{ padding: '1rem', fontWeight: 'bold' }}>{format(parseISO(lastOS.data_prescricao), 'dd/MM/yyyy')}</td>
                                                <td style={{ padding: '1rem', fontWeight: 'bold' }}>{lastOS.quadra}</td>
                                                <td style={{ padding: '1rem' }}>{lastOS.operacao}</td>
                                                <td style={{ padding: '1rem' }}>
                                                    {insumosFiltradosParaExibicao.length > 0 ? (
                                                        insumosFiltradosParaExibicao.map((i, idx) => (
                                                            <div key={idx} style={{ fontSize: '0.85rem', marginBottom: '0.2rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                                                                • {i.material} ({i.dosagem})
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontStyle: 'italic' }}>
                                                            Nenhum {isLeprose ? 'acaricida' : 'inseticida'} identificado no cadastro.
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            );
                        })()}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Prescriptions;
