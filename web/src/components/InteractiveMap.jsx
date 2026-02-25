import React, { useState, useEffect } from 'react';
import { registrosService } from '../lib/services';
import { differenceInDays, parseISO, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Map as MapIcon, Calendar, Beaker, Activity, Clock, AlertCircle } from 'lucide-react';
import PageHeader from './PageHeader';

// Aqui estão as coordenadas extraídas do teu SVG. 
// Ajusta o primeiro valor (ex: "A", "B") para o número real da quadra (ex: "001", "002")
const QUADRAS_DATA = [
  { id: "30", d: "M281.102 508L226.602 558L164.102 532.5L223.602 485L281.102 508Z" },
  { id: "31", d: "M289.602 498L282.102 507.5L262.602 501.5L313.602 432.5L323.602 439L293.102 485.5L289.602 498Z" },
  { id: "28", d: "M272.102 425L222.102 484.5L224.102 486L264.602 500L305.602 441L272.102 425Z" },
  { id: "27", d: "M319.102 421.5L305.602 441L272.602 426L273.602 423L276.102 389.5L272.602 366.5L273.602 360L321.602 396.5L324.602 402L319.102 421.5Z" },
  { id: "32", d: "M281.602 278L328.602 302L291.102 368L288.102 369.5L248.102 338.5L281.602 278Z" },
  { id: "24", d: "M217.602 246L281.602 278L247.602 338L185.102 288.5L217.602 246Z" },
  { id: "21", d: "M306.602 217L281.102 276L218.602 244L245.102 195L306.602 217Z" },
  { id: "20", d: "M308.102 217.5L282.102 276L381.102 325.5L397.102 287L428.602 260V258L312.602 218.5L308.102 217.5Z" },
  { id: "19", d: "M421.602 310L411.602 317L421.602 298V292L433.602 279.5L443.602 276.5L446.102 279.5L430.102 295L421.602 310Z" },
  { id: "18", d: "M185.602 472L159.602 531.5H163.102L223.602 486.5L185.602 472Z" },
  { id: "17", d: "M158.602 530L134.102 517.5L141.102 454.5L183.602 470L158.602 530Z" },
  { id: "16", d: "M271.602 424.5L224.602 484.5L174.602 466.5L224.602 407.5L271.602 424.5Z" },
  { id: "15", d: "M222.602 407.5L173.102 465.5L139.102 453.5L151.102 369.5L222.602 407.5Z" },
  { id: "14", d: "M274.102 393V426L221.102 408L249.602 339L274.102 357V393Z" },
  { id: "13", d: "M243.602 353L222.102 407.5L172.102 380L187.602 361L217.602 345.5L243.602 353Z" },
  { id: "12", d: "M149.602 369.5L171.602 378L186.602 361.5L218.102 346.5L242.602 352.5L248.602 339L186.602 289L149.602 343.5V369.5Z" }
];

export default function InteractiveMap({ logo }) {
    const [registros, setRegistros] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedActivity, setSelectedActivity] = useState('Todos');
    const [selectedQuadraId, setSelectedQuadraId] = useState(null);

    useEffect(() => {
        const fetchRegistros = async () => {
            try {
                // Puxa os dados reais do teu Supabase
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
        if (!latest) return '#f1f5f9'; // Cinza: Sem aplicação registrada

        const daysAgo = differenceInDays(new Date(), parseISO(latest.data_inicial));

        if (daysAgo <= 15) return '#86efac'; // Verde: Aplicação recente
        if (daysAgo <= 30) return '#fef08a'; // Amarelo: Atenção
        return '#fca5a5'; // Vermelho: Atrasado (Mais de 30 dias)
    };

    const latestSelected = selectedQuadraId ? getLatestRecord(selectedQuadraId) : null;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: 'calc(100vh - 120px)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <PageHeader title="Mapa da Fazenda" subtitle="Controle Visual de Pulverização" logo={logo} />
                
                <div className="premium-card glass" style={{ padding: '0.8rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontWeight: '800' }}>Atividade:</span>
                    <select value={selectedActivity} onChange={(e) => setSelectedActivity(e.target.value)} className="filter-select">
                        {activities.map(act => <option key={act} value={act}>{act}</option>)}
                    </select>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '1.5rem', flex: 1, overflow: 'hidden' }}>
                {/* ÁREA DO MAPA */}
                <div className="premium-card" style={{ flex: 2, display: 'flex', justifyContent: 'center', background: '#fff', overflow: 'auto' }}>
                    {loading ? <p>Carregando dados da fazenda...</p> : (
                        <svg viewBox="0 0 522 646" style={{ width: 'auto', height: '100%', maxHeight: '650px' }}>
                            {QUADRAS_DATA.map((quadra) => (
                                <path
                                    key={quadra.id}
                                    d={quadra.d}
                                    fill={getQuadraColor(quadra.id)}
                                    stroke={selectedQuadraId === quadra.id ? "#3b82f6" : "black"}
                                    strokeWidth={selectedQuadraId === quadra.id ? "3" : "1"}
                                    onClick={() => setSelectedQuadraId(quadra.id)}
                                    style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                                >
                                    <title>{`Quadra ${quadra.id}`}</title>
                                </path>
                            ))}
                        </svg>
                    )}
                </div>

                {/* PAINEL DE INFORMAÇÕES */}
                <div className="premium-card" style={{ flex: 1, background: 'white', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ borderBottom: '2px solid var(--border)', paddingBottom: '0.5rem' }}>
                        <h2 style={{ color: 'var(--primary)', margin: 0, fontSize: '1.2rem' }}>
                            <MapIcon size={20} style={{ verticalAlign: 'middle', marginRight: '8px' }}/>
                            {selectedQuadraId ? `Quadra ${selectedQuadraId}` : 'Selecione uma quadra'}
                        </h2>
                    </div>

                    {!selectedQuadraId ? (
                        <div style={{ textAlign: 'center', color: '#94a3b8', marginTop: '2rem' }}>
                            <Activity size={40} opacity={0.2} style={{ margin: '0 auto 1rem' }}/>
                            <p>Clica numa área do mapa para ver o histórico de pulverização desta quadra.</p>
                        </div>
                    ) : latestSelected ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                            <div style={{ background: 'var(--primary-gradient)', padding: '1rem', borderRadius: '12px', color: 'white' }}>
                                <small style={{ opacity: 0.8, fontWeight: 'bold' }}>ÚLTIMA ATIVIDADE</small>
                                <div style={{ fontSize: '1.2rem', fontWeight: '900' }}>{latestSelected.receita}</div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                    <Calendar size={18} color="#64748b"/>
                                    <div>
                                        <small style={{ color: '#64748b', display: 'block' }}>Data de Aplicação</small>
                                        <strong>{format(parseISO(latestSelected.data_inicial), "dd 'de' MMMM", { locale: ptBR })}</strong>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                    <Clock size={18} color="#f59e0b"/>
                                    <div>
                                        <small style={{ color: '#64748b', display: 'block' }}>Próxima (Estimada)</small>
                                        <strong>{latestSelected.proxima_pulverizacao ? format(parseISO(latestSelected.proxima_pulverizacao), "dd/MM/yyyy") : 'Não definida'}</strong>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'start' }}>
                                    <Beaker size={18} color="#ef4444" style={{ marginTop: '4px' }}/>
                                    <div>
                                        <small style={{ color: '#64748b', display: 'block' }}>Observações / Insumos</small>
                                        <p style={{ margin: 0, fontSize: '0.9rem', color: '#334155' }}>{latestSelected.observacao || 'Sem observações registadas.'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', color: '#94a3b8', marginTop: '2rem' }}>
                            <AlertCircle size={40} opacity={0.2} style={{ margin: '0 auto 1rem' }}/>
                            <p>Não foram encontrados registos recentes para a Quadra {selectedQuadraId} com o filtro selecionado.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
