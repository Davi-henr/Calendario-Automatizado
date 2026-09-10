import React, { useState, useEffect, useMemo } from 'react';
import { registrosService, osService, insumosService } from '../lib/services';
import { Search, ShieldAlert, ShieldCheck, Filter, Calendar as CalendarIcon } from 'lucide-react';
import { format, parseISO, addDays, differenceInDays } from 'date-fns';

export default function HarvestRelease({ logo }) {
    const [registros, setRegistros] = useState([]);
    const [osList, setOsList] = useState([]);
    const [insumosMeta, setInsumosMeta] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('Todos');
    
    // Estado para guardar as datas "maquiadas" só para a auditoria
    const [adjustedDates, setAdjustedDates] = useState({});

    useEffect(() => {
        // Carrega as datas alteradas do armazenamento local do navegador
        const savedDates = localStorage.getItem('audit_adjusted_dates');
        if (savedDates) {
            setAdjustedDates(JSON.parse(savedDates));
        }
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [regData, osData, insData] = await Promise.all([
                registrosService.getAll(),
                osService.getAll(),
                insumosService.getAll()
            ]);
            // Filtramos apenas as iniciadas ou finalizadas
            setRegistros(regData.filter(r => r.situacao === 'Iniciada' || r.situacao === 'Finalizada'));
            setOsList(osData);
            setInsumosMeta(insData);
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDateChange = (id, newDate) => {
        setAdjustedDates(prev => {
            const next = { ...prev, [id]: newDate };
            // Salva no navegador para não perder ao atualizar a página, mas NÃO manda pro DB
            localStorage.setItem('audit_adjusted_dates', JSON.stringify(next));
            return next;
        });
    };

    const getMaxCarencia = (osId) => {
        const os = osList.find(o => o.id === osId);
        if (!os || !os.insumos) return 0;
        
        let max = 0;
        os.insumos.forEach(ins => {
            const meta = insumosMeta.find(m => (m.insumo || '').toLowerCase().trim() === (ins.material || '').toLowerCase().trim());
            const carencia = meta?.carencia_dias ?? meta?.dias_carencia ?? ins.carencia ?? 0;
            const carenciaNum = parseInt(carencia, 10);
            if (!isNaN(carenciaNum) && carenciaNum > max) {
                max = carenciaNum;
            }
        });
        return max;
    };

    const processedData = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let data = registros.map(reg => {
            // Usa a data ajustada se existir, senão usa a original do banco
            const dataBase = adjustedDates[reg.id] || reg.data_inicial;
            const carenciaMaxima = reg.os_id ? getMaxCarencia(reg.os_id) : parseInt(reg.dias_carencia || 0, 10);
            
            let dataLiberada = null;
            let statusColheita = 'Bloqueada';
            
            if (dataBase) {
                const dateObj = parseISO(dataBase);
                dataLiberada = addDays(dateObj, carenciaMaxima);
                
                // Se a data liberada já passou ou é hoje, está liberado
                if (differenceInDays(today, dataLiberada) >= 0) {
                    statusColheita = 'Liberada';
                }
            }

            return {
                ...reg,
                data_base: dataBase,
                carencia_maxima: carenciaMaxima,
                data_liberada: dataLiberada,
                status_colheita: statusColheita
            };
        });

        // Filtros
        if (searchTerm) {
            const lowerSearch = searchTerm.toLowerCase();
            data = data.filter(r => 
                (r.quadra || '').toLowerCase().includes(lowerSearch) || 
                (r.receita || '').toLowerCase().includes(lowerSearch)
            );
        }

        if (filterStatus !== 'Todos') {
            data = data.filter(r => r.status_colheita === filterStatus);
        }

        // Ordenar: Bloqueadas primeiro, depois por data mais recente
        data.sort((a, b) => {
            if (a.status_colheita === 'Bloqueada' && b.status_colheita === 'Liberada') return -1;
            if (a.status_colheita === 'Liberada' && b.status_colheita === 'Bloqueada') return 1;
            return new Date(b.data_base).getTime() - new Date(a.data_base).getTime();
        });

        return data;
    }, [registros, osList, insumosMeta, adjustedDates, searchTerm, filterStatus]);

    return (
        <div className="page-container">
            <div className="page-header-content">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h2 style={{ color: 'var(--text)', fontWeight: '900', letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <ShieldCheck size={28} color="var(--primary)" /> Painel de Colheita
                        </h2>
                        <p style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Controle de carência e liberação de quadras (Auditoria)</p>
                    </div>
                </div>
            </div>

            <div className="premium-card glass">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Filter size={16} style={{ color: '#94a3b8' }} />
                        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="filter-select" style={{ minWidth: '180px' }}>
                            <option value="Todos">Todas as Situações</option>
                            <option value="Liberada">Apenas Liberadas</option>
                            <option value="Bloqueada">Apenas Bloqueadas</option>
                        </select>
                    </div>
                    <div style={{ position: 'relative', width: '300px' }}>
                        <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input 
                            type="text" 
                            placeholder="Buscar por Quadra ou Operação..." 
                            value={searchTerm} 
                            onChange={(e) => setSearchTerm(e.target.value)} 
                            style={{ width: '100%', padding: '0.6rem 1rem 0.6rem 2.2rem', borderRadius: '8px', border: '1px solid var(--border)', outline: 'none' }} 
                        />
                    </div>
                </div>

                {loading ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Calculando carências...</div>
                ) : processedData.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Nenhuma quadra em aplicação encontrada.</div>
                ) : (
                    <div className="table-responsive">
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '2.5px solid var(--border)', textAlign: 'left' }}>
                                    <th style={{ padding: '1rem' }}>Quadra</th>
                                    <th style={{ padding: '1rem' }}>Operação / Receita</th>
                                    <th style={{ padding: '1rem' }}>Data Inicial (Editável)</th>
                                    <th style={{ padding: '1rem', textAlign: 'center' }}>Carência</th>
                                    <th style={{ padding: '1rem' }}>Liberada em</th>
                                    <th style={{ padding: '1rem' }}>Status da Colheita</th>
                                </tr>
                            </thead>
                            <tbody>
                                {processedData.map(reg => (
                                    <tr key={reg.id} style={{ borderBottom: '1px solid var(--border)', backgroundColor: reg.status_colheita === 'Liberada' ? '#f0fdf4' : 'transparent' }}>
                                        <td style={{ padding: '1rem', fontWeight: '900', color: 'var(--text)', fontSize: '1.1rem' }}>
                                            Q-{reg.quadra}
                                        </td>
                                        <td style={{ padding: '1rem', fontWeight: '600', color: 'var(--text-muted)' }}>
                                            {reg.receita}
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            {/* CAMPO MÁGICO EDITÁVEL DA AUDITORIA */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <CalendarIcon size={16} color="var(--primary)" />
                                                <input 
                                                    type="date" 
                                                    value={reg.data_base}
                                                    onChange={(e) => handleDateChange(reg.id, e.target.value)}
                                                    style={{ 
                                                        padding: '0.4rem 0.6rem', 
                                                        borderRadius: '6px', 
                                                        border: '1px solid #bfdbfe',
                                                        color: 'var(--primary)',
                                                        fontWeight: 'bold',
                                                        outline: 'none',
                                                        backgroundColor: adjustedDates[reg.id] ? '#eff6ff' : 'white' // Destaca se foi editado
                                                    }}
                                                    title={adjustedDates[reg.id] ? "Data alterada manualmente para auditoria" : "Data oficial do lançamento"}
                                                />
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'center', fontWeight: '800', color: '#64748b' }}>
                                            {reg.carencia_maxima} dias
                                        </td>
                                        <td style={{ padding: '1rem', fontWeight: '800' }}>
                                            {reg.data_liberada ? format(reg.data_liberada, 'dd/MM/yyyy') : '-'}
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{ 
                                                display: 'inline-flex', alignItems: 'center', gap: '6px', 
                                                padding: '0.4rem 0.8rem', borderRadius: '10px', 
                                                backgroundColor: reg.status_colheita === 'Liberada' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)', 
                                                color: reg.status_colheita === 'Liberada' ? '#166534' : '#991b1b', 
                                                fontWeight: '800', fontSize: '0.8rem', textTransform: 'uppercase' 
                                            }}>
                                                {reg.status_colheita === 'Liberada' ? <ShieldCheck size={16} /> : <ShieldAlert size={16} />}
                                                {reg.status_colheita}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
