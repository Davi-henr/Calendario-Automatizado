import React, { useState, useEffect } from 'react';
import { registrosService } from '../lib/services';
import { differenceInDays, parseISO, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Map as MapIcon, Info, Calendar, Beaker, Activity, Clock, AlertCircle } from 'lucide-react';
import PageHeader from './PageHeader';

export default function InteractiveMap({ logo }) {
    const [registros, setRegistros] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedActivity, setSelectedActivity] = useState('Todos');
    const [selectedQuadraId, setSelectedQuadraId] = useState(null);

    useEffect(() => {
        const fetchRegistros = async () => {
            try {
                const data = await registrosService.getAll();
                setRegistros(data);
            } catch (error) {
                console.error("Erro ao carregar registros:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchRegistros();
    }, []);

    const activities = ['Todos', ...new Set(registros.map(r => r.receita).filter(Boolean))];

    const getLatestRecord = (quadraId) => {
        let filtered = registros.filter(r => String(r.quadra) === String(quadraId));
        if (selectedActivity !== 'Todos') {
            filtered = filtered.filter(r => r.receita === selectedActivity);
        }
        filtered.sort((a, b) => new Date(b.data_inicial) - new Date(a.data_inicial));
        return filtered[0] || null;
    };

    const getQuadraColor = (quadraId) => {
        const latest = getLatestRecord(quadraId);
        if (!latest) return '#f1f5f9'; // Cinza se não houver dados

        const daysAgo = differenceInDays(new Date(), parseISO(latest.data_inicial));

        if (daysAgo <= 15) return '#86efac'; // Verde
        if (daysAgo <= 30) return '#fef08a'; // Amarelo
        return '#fca5a5'; // Vermelho
    };

    const latestSelected = selectedQuadraId ? getLatestRecord(selectedQuadraId) : null;

    // Função auxiliar para renderizar as quadras do seu SVG
    const renderPath = (id, d) => (
        <path
            key={id}
            id={id}
            d={d}
            fill={getQuadraColor(id)}
            onClick={() => setSelectedQuadraId(id)}
            stroke={selectedQuadraId === id ? "var(--primary)" : "black"}
            strokeWidth={selectedQuadraId === id ? "3" : "1"}
            style={{ cursor: 'pointer', transition: 'all 0.2s' }}
        >
            <title>{`Quadra ${id}`}</title>
        </path>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: 'calc(100vh - 120px)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <PageHeader title="Mapa da Fazenda" subtitle="Controle Visual de Pulverização" logo={logo} />
                
                <div className="premium-card glass" style={{ padding: '0.8rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontWeight: '800' }}>Filtrar Atividade:</span>
                    <select value={selectedActivity} onChange={(e) => setSelectedActivity(e.target.value)} className="filter-select">
                        {activities.map(act => <option key={act} value={act}>{act}</option>)}
                    </select>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '1.5rem', flex: 1, overflow: 'hidden' }}>
                {/* MAPA */}
                <div className="premium-card" style={{ flex: 2, display: 'flex', justifyContent: 'center', background: '#fff' }}>
                    {loading ? <p>Carregando mapa...</p> : (
                        <svg width="100%" height="100%" viewBox="0 0 522 646" fill="none">
                            {/* AQUI VOCÊ PRECISA SUBSTITUIR O "ID_DA_QUADRA" PELO NÚMERO REAL (EX: "001") 
                                Eu coloquei os caminhos exatos que você mandou abaixo:
                            */}
                            {renderPath("001", "M44.6018 447L47.1018 446.5L47.2381 446.473L49.6018 446M20.1018 456.5C20.1018 452.5 20.1018 450 20.1018 454.5C20.1018 458.1 20.1018 457.333 20.1018 456.5Z")}
                            {renderPath("002", "M165.102 637.5L170.602 641.5")}
                            {renderPath("003", "M160.102 542.5L158.602 532")}
                            {renderPath("004", "M5.10178 315L0.601776 302.5L13.1018 294L24.1018 283.5L28.1018 276")}
                            {renderPath("005A", "M281.102 508L226.602 558L164.102 532.5L223.602 485L281.102 508Z")}
                            {renderPath("005B", "M289.602 498L282.102 507.5L262.602 501.5L313.602 432.5L323.602 439L293.102 485.5L289.602 498Z")}        
                            {renderPath("005C", "M272.102 425L222.102 484.5L224.102 486L264.602 500L305.602 441L272.102 425Z")}  
                            {renderPath("006A", "M319.102 421.5L305.602 441L272.602 426L273.602 423L276.102 389.5L272.602 366.5L273.602 360L321.602 396.5L324.602 402L319.102 421.5Z")}
                            {renderPath("006B", "M322.602 396.5L325.602 398.5M325.602 398.5L333.602 393.5L382.102 326.5L330.102 303L291.102 372L325.602 398.5ZZ")}
                            
                            {/* Adicione os outros caminhos seguindo o mesmo modelo renderPath("NUMERO", "COORDENADAS") */}
                        </svg>
                    )}
                </div>

                {/* INFO LATERAL */}
                <div className="premium-card" style={{ flex: 1, background: 'white' }}>
                    <h3>{selectedQuadraId ? `Quadra ${selectedQuadraId}` : 'Selecione no mapa'}</h3>
                    {latestSelected ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div className="status-badge" style={{ background: 'var(--primary-gradient)', color: 'white', padding: '10px' }}>
                                <strong>Última:</strong> {latestSelected.receita}
                            </div>
                            <p><Calendar size={16}/> <strong>Aplicado em:</strong> {format(parseISO(latestSelected.data_inicial), "dd/MM/yyyy")}</p>
                            <p><Clock size={16}/> <strong>Próxima:</strong> {latestSelected.proxima_pulverizacao || '---'}</p>
                            <p><Beaker size={16}/> <strong>Obs:</strong> {latestSelected.observacao || 'Sem notas'}</p>
                        </div>
                    ) : <p>Selecione uma quadra para ver os detalhes.</p>}
                </div>
            </div>
        </div>
    );
}
