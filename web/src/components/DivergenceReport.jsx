import React, { useState, useEffect, useMemo } from 'react';
import {
    Search,
    Printer,
    Filter,
    Calendar,
    AlertTriangle,
    Truck,
    Clock,
    FileText,
    Map as MapIcon
} from 'lucide-react';
import { saidasService, settingsService } from '../lib/services';
import { format, parseISO } from 'date-fns';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function DivergenceReport() {
    const [saidas, setSaidas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [logo, setLogo] = useState(null);

    // Filtros
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [turnoFilter, setTurnoFilter] = useState('Todos');
    const [carretaFilter, setCarretaFilter] = useState('');

    useEffect(() => {
        fetchData();
        settingsService.get().then(s => setLogo(s.logo_url)).catch(() => {});
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const data = await saidasService.getAll();
            setSaidas(data);
        } catch (error) {
            console.error('Erro ao buscar saídas:', error);
        } finally {
            setLoading(false);
        }
    };

    // Processamento das divergências
    const divergences = useMemo(() => {
        const result = [];
        
        saidas.forEach(s => {
            // Ignora deletados logicamente e ordens não conferidas
            if (s.ativo === false) return;
            if (!s.ordens_saida || s.ordens_saida.situacao !== 'Conferida') return;

            const retirado = parseFloat(s.quantidade) || 0;
            const devolvido = parseFloat(s.devolucao) || 0;
            const dosagem = parseFloat(s.dosagem) || 0;
            const bombasAplicadas = parseFloat(s.ordens_saida.bombas_aplicadas) || 0;

            // Matemática da divergência
            const sobraEsperada = retirado - (bombasAplicadas * dosagem);
            const divergencia = devolvido - sobraEsperada;

            // Se houver uma diferença mínima (0.01), consideramos divergente
            if (Math.abs(divergencia) >= 0.01) {
                result.push({
                    ...s,
                    divergencia,
                    sobraEsperada
                });
            }
        });

        // Ordena da mais recente para a mais antiga
        return result.sort((a, b) => {
            const dateA = new Date(a.data_saida || 0).getTime();
            const dateB = new Date(b.data_saida || 0).getTime();
            return dateB - dateA;
        });
    }, [saidas]);

    // Aplicação dos Filtros
    const filteredDivergences = useMemo(() => {
        return divergences.filter(d => {
            if (startDate && d.data_saida < startDate) return false;
            if (endDate && d.data_saida > endDate) return false;
            if (turnoFilter !== 'Todos' && d.ordens_saida?.turno !== turnoFilter) return false;
            if (carretaFilter && !d.ordens_saida?.numero_carreta?.toLowerCase().includes(carretaFilter.toLowerCase())) return false;
            return true;
        });
    }, [divergences, startDate, endDate, turnoFilter, carretaFilter]);

    const getDivergenceStyle = (div) => {
        if (div < 0) return { bg: '#fef2f2', color: '#ef4444' }; // Faltou: Vermelho
        if (div > 0) return { bg: '#fffbeb', color: '#d97706' }; // Sobrou: Amarelo
        return { bg: 'transparent', color: 'var(--text)' };
    };

    const handlePrint = () => {
        const doc = new jsPDF('p', 'mm', 'a4');
        const pw = doc.internal.pageSize.getWidth();
        
        // Cabeçalho PDF
        doc.setLineWidth(0.3);
        doc.rect(10, 10, pw - 20, 20);

        if (logo) {
            try { doc.addImage(logo, 'PNG', 12, 12, 25, 15); } catch (e) { }
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text('RELATÓRIO DE DIVERGÊNCIAS DE CAMPO', pw / 2 + 10, 20, { align: 'center' });
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, pw / 2 + 10, 26, { align: 'center' });

        const tableData = filteredDivergences.map(d => {
            const qtdeFormatada = d.divergencia > 0 ? `+${d.divergencia.toFixed(2)}` : d.divergencia.toFixed(2);
            return [
                d.data_saida ? format(parseISO(d.data_saida), 'dd/MM/yyyy') : '-',
                d.insumos?.insumo || '-',
                qtdeFormatada,
                d.ordens_saida?.numero_receita || '-',
                d.quadras?.nome || '-',
                d.ordens_saida?.numero_carreta || '-',
                d.ordens_saida?.turno || '-'
            ];
        });

        autoTable(doc, {
            startY: 35,
            head: [['Data Ocorrido', 'Insumo', 'Qtde Divergente', 'Nº Receita', 'Quadra', 'Nº Carreta', 'Turno']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [239, 68, 68], textColor: 255, fontStyle: 'bold' },
            styles: { fontSize: 8, cellPadding: 2 },
            columnStyles: {
                2: { halign: 'center', fontStyle: 'bold' },
                5: { halign: 'center' },
                6: { halign: 'center' }
            },
            didParseCell: function (data) {
                // Pinta o texto da coluna de quantidade no PDF também
                if (data.section === 'body' && data.column.index === 2) {
                    const val = parseFloat(data.cell.raw);
                    if (val < 0) data.cell.styles.textColor = [239, 68, 68];
                    if (val > 0) data.cell.styles.textColor = [217, 119, 6];
                }
            }
        });
        
        doc.save(`Divergencias_Campo_${format(new Date(), 'ddMMyyyy')}.pdf`);
    };

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
                        background: 'linear-gradient(135deg, #ef4444, #b91c1c)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white'
                    }}>
                        <AlertTriangle size={24} />
                    </div>
                    <div>
                        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: '900', color: 'var(--text)', fontSize: '1.4rem' }}>
                            Divergências de Campo
                        </h2>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600' }}>
                            Controle de devoluções a mais ou a menos das receitas conferidas
                        </span>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <button onClick={handlePrint} disabled={filteredDivergences.length === 0} className="btn btn-outline" style={{ padding: '0.7rem 1.5rem', borderRadius: '12px', opacity: filteredDivergences.length === 0 ? 0.3 : 1 }}>
                        <Printer size={18} /> Imprimir Tabela
                    </button>
                </div>
            </div>

            {/* Faixa de Filtros */}
            <div style={{ padding: '1rem 2rem', borderBottom: '1px solid rgba(0,0,0,0.06)', backgroundColor: '#fafbfc', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'white', padding: '0.3rem 0.8rem', borderRadius: '10px', border: '1px solid var(--border)' }}>
                    <Calendar size={16} style={{ color: 'var(--text-muted)' }} />
                    <input 
                        type="date" 
                        value={startDate} 
                        onChange={(e) => setStartDate(e.target.value)} 
                        style={{ border: 'none', outline: 'none', fontSize: '0.85rem', color: 'var(--text)', background: 'transparent' }} 
                    />
                    <span style={{ color: 'var(--text-muted)' }}>até</span>
                    <input 
                        type="date" 
                        value={endDate} 
                        onChange={(e) => setEndDate(e.target.value)} 
                        style={{ border: 'none', outline: 'none', fontSize: '0.85rem', color: 'var(--text)', background: 'transparent' }} 
                    />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'white', padding: '0.3rem 0.8rem', borderRadius: '10px', border: '1px solid var(--border)' }}>
                    <Clock size={16} style={{ color: 'var(--text-muted)' }} />
                    <select 
                        value={turnoFilter} 
                        onChange={(e) => setTurnoFilter(e.target.value)} 
                        style={{ border: 'none', outline: 'none', fontSize: '0.85rem', color: 'var(--text)', background: 'transparent', cursor: 'pointer' }}
                    >
                        <option value="Todos">Todos os Turnos</option>
                        <option value="DIA">DIA</option>
                        <option value="NOITE">NOITE</option>
                    </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'white', padding: '0.3rem 0.8rem', borderRadius: '10px', border: '1px solid var(--border)' }}>
                    <Truck size={16} style={{ color: 'var(--text-muted)' }} />
                    <input 
                        type="text" 
                        placeholder="Nº Carreta..." 
                        value={carretaFilter} 
                        onChange={(e) => setCarretaFilter(e.target.value)} 
                        style={{ border: 'none', outline: 'none', fontSize: '0.85rem', color: 'var(--text)', background: 'transparent', width: '100px' }} 
                    />
                </div>
            </div>

            {/* Area da Tabela */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 2rem', backgroundColor: '#fafbfc' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>Carregando dados de divergência...</div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                        <thead style={{ position: 'sticky', top: 0, zIndex: 5, backgroundColor: '#fafbfc' }}>
                            <tr style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1.5px' }}>
                                <th style={{ textAlign: 'left', padding: '1rem', fontWeight: '800' }}>Data Ocorrido</th>
                                <th style={{ textAlign: 'left', padding: '1rem', fontWeight: '800' }}>Insumo</th>
                                <th style={{ textAlign: 'center', padding: '1rem', fontWeight: '800' }}>Qtde Divergente</th>
                                <th style={{ textAlign: 'center', padding: '1rem', fontWeight: '800' }}>Nº Receita</th>
                                <th style={{ textAlign: 'center', padding: '1rem', fontWeight: '800' }}>Quadra</th>
                                <th style={{ textAlign: 'center', padding: '1rem', fontWeight: '800' }}>Nº Carreta</th>
                                <th style={{ textAlign: 'center', padding: '1rem', fontWeight: '800' }}>Turno</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredDivergences.length === 0 ? (
                                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>Nenhuma divergência de campo encontrada.</td></tr>
                            ) : (
                                filteredDivergences.map(d => {
                                    const style = getDivergenceStyle(d.divergencia);
                                    const sinal = d.divergencia > 0 ? '+' : '';
                                    return (
                                        <tr key={d.id} style={{ backgroundColor: '#ffffff', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.04)' }}>
                                            <td style={{ padding: '1.2rem 1rem', fontWeight: '700', color: 'var(--text-muted)', borderRadius: '12px 0 0 12px' }}>
                                                {d.data_saida ? format(parseISO(d.data_saida), 'dd/MM/yyyy') : '-'}
                                            </td>
                                            <td style={{ padding: '1.2rem 1rem', fontWeight: '800', color: 'var(--primary)' }}>
                                                {d.insumos?.insumo}
                                            </td>
                                            <td style={{ padding: '1.2rem 1rem', textAlign: 'center' }}>
                                                <span style={{
                                                    padding: '0.4rem 0.8rem', borderRadius: '8px',
                                                    background: style.bg,
                                                    color: style.color,
                                                    fontWeight: '900', fontSize: '0.9rem',
                                                    display: 'inline-block', minWidth: '80px'
                                                }}>
                                                    {sinal}{d.divergencia.toFixed(2)}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1.2rem 1rem', textAlign: 'center', fontWeight: '700' }}>
                                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)' }}>
                                                    <FileText size={14} /> {d.ordens_saida?.numero_receita || '-'}
                                                </div>
                                            </td>
                                            <td style={{ padding: '1.2rem 1rem', textAlign: 'center', fontWeight: '700', color: 'var(--text)' }}>
                                                Q-{d.quadras?.nome || '-'}
                                            </td>
                                            <td style={{ padding: '1.2rem 1rem', textAlign: 'center', fontWeight: '700', color: 'var(--text)' }}>
                                                {d.ordens_saida?.numero_carreta || '-'}
                                            </td>
                                            <td style={{ padding: '1.2rem 1rem', textAlign: 'center', fontWeight: '800', borderRadius: '0 12px 12px 0', color: 'var(--text)' }}>
                                                {d.ordens_saida?.turno || '-'}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
