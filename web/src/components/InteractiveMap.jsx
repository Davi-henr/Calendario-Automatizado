import React, { useState, useEffect } from 'react';
import { registrosService } from '../lib/services';
import { differenceInDays, parseISO, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Map as MapIcon, Calendar, Beaker, Activity, Clock, AlertCircle } from 'lucide-react';
import PageHeader from './PageHeader';

// Mapeamento das coordenadas extraídas do seu SVG
const QUADRAS_DATA = [
  { id: "021", d: "M281.102 508L226.602 558L164.102 532.5L223.602 485L281.102 508Z" },
  { id: "026", d: "M289.602 498L282.102 507.5L262.602 501.5L313.602 432.5L323.602 439L293.102 485.5L289.602 498Z" },
  { id: "027", d: "M272.102 425L222.102 484.5L224.102 486L264.602 500L305.602 441L272.102 425Z" },
  { id: "007", d: "M5.10178 315L0.601776 302.5L13.1018 294L24.1018 283.5L28.1018 276" },
  { id: "033", d: "M319.102 421.5L305.602 441L272.602 426L273.602 423L276.102 389.5L272.602 366.5L273.602 360L321.602 396.5L324.602 402L319.102 421.5Z" },
  { id: "005C", d: "M322.602 396.5L325.602 398.5L333.602 393.5L382.102 326.5L330.102 303L291.102 372L325.602 398.5Z" },
  { id: "005B", d: "M281.602 278L328.602 302L291.102 368L288.102 369.5L248.102 338.5L281.602 278Z" },
  { id: "005A", d: "M217.602 246L281.602 278L247.602 338L185.102 288.5L217.602 246Z" },
  { id: "006A", d: "M306.602 217L281.102 276L218.602 244L245.102 195L306.602 217Z" },
  { id: "006B", d: "M308.102 217.5L282.102 276L381.102 325.5L397.102 287L428.602 260V258L312.602 218.5L308.102 217.5Z" },
  { id: "024", d: "M421.602 310L411.602 317L421.602 298V292L433.602 279.5L443.602 276.5L446.102 279.5L430.102 295L421.602 310Z" },
  { id: "017", d: "M431.602 258L448.102 277L457.602 274.5L475.102 264.5L493.102 268.5L501.602 260L504.602 246.5L516.602 222.5L519.102 205L513.102 196H511.102L431.602 258Z" },
  { id: "008", d: "M511.602 191L493.602 209.5L260.102 132.5L267.102 101.5L301.102 111L321.602 90.5L407.602 119.5L481.102 151.5L511.602 191Z" },
  { id: "028", d: "M267.102 86L258.102 130.5L245.102 193.5L165.102 116.5L267.102 86Z" },
  { id: "018", d: "M298.102 40.5L268.102 80L166.602 41.5L171.602 27.5L165.102 21L169.102 6.5L298.102 40.5Z" },
  { id: "034", d: "M237.602 76.5L230.602 96.5L248.102 92V79L237.602 76.5Z" },
  { id: "034", d: "M171.602 27L166.102 40L134.102 27L147.102 1L168.102 7L164.102 20.5L171.602 27Z" },
  { id: "002", d: "M164.102 117L244.102 195L215.102 244L105.102 149L109.602 128.5L164.102 117Z" },
  { id: "003", d: "M216.602 244L183.102 288.5L90.6018 212L79.1018 218L66.6018 227.5L62.6018 226L59.1018 220V214.5L62.6018 208.5V203L67.6018 196.5L79.1018 183L105.602 149.5L216.602 244Z" },
  { id: "004", d: "M85.6018 223.5L92.1018 216.5H96.1018L185.602 291L150.602 341.5L144.602 397H142.102L96.1018 275.5L85.6018 228V223.5Z" },
  { id: "009", d: "M63.1018 228.5L81.6018 219L96.6018 274L11.6018 329L1.60178 302.5L24.1018 284.5L30.1018 274L63.1018 228.5Z" },
  { id: "010", d: "M36.1018 377.5L11.6018 330.5L97.1018 278.5L120.102 334L41.1018 385L36.1018 377.5Z" },
  { id: "011", d: "M51.6018 400.5L41.1018 386.5L118.602 334.5L142.102 396.5L62.1018 439L54.6018 419.5L51.6018 400.5Z" },
  { id: "012", d: "M139.102 457.5L143.602 396.5L61.1018 438.5L51.1018 447L57.1018 451.5L64.1018 488H61.1018V497V504L139.102 457.5Z" },
  { id: "013", d: "M62.1018 535.5V504L138.602 457L132.102 519.5L81.1018 566.5L67.1018 560V553.5V545.5L62.1018 535.5Z" },
  { id: "014", d: "M131.602 520.5L82.6018 567L91.1018 573L95.1018 595L116.102 626L131.602 520.5Z" },
  { id: "015", d: "M127.602 642.5L116.102 628L132.602 519L160.102 530L171.602 646L160.102 635.5L150.602 631.5H141.602L127.602 642.5Z" },
  { id: "016", d: "M178.602 646H172.602L157.602 529L225.602 559.5L212.602 572V582.5L194.602 600.5L187.102 622L182.602 630.5L178.602 635.5V646Z" },
  { id: "003", d: "M185.602 472L159.602 531.5H163.102L223.602 486.5L185.602 472Z" },
  { id: "002", d: "M158.602 530L134.102 517.5L141.102 454.5L183.602 470L158.602 530Z" },
  { id: "001", d: "M271.602 424.5L224.602 484.5L174.602 466.5L224.602 407.5L271.602 424.5Z" },
  { id: "029", d: "M222.602 407.5L173.102 465.5L139.102 453.5L151.102 369.5L222.602 407.5Z" },
  { id: "032", d: "M274.102 393V426L221.102 408L249.602 339L274.102 357V393Z" },
  { id: "031", d: "M243.602 353L222.102 407.5L172.102 380L187.602 361L217.602 345.5L243.602 353Z" },
  { id: "030", d: "M149.602 369.5L171.602 378L186.602 361.5L218.102 346.5L242.602 352.5L248.602 339L186.602 289L149.602 343.5V369.5Z" }
];

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
        if (!latest) return '#f1f5f9'; // Cinza

        const daysAgo = differenceInDays(new Date(), parseISO(latest.data_inicial));

        if (daysAgo <= 15) return '#86efac'; // Verde
        if (daysAgo <= 30) return '#fef08a'; // Amarelo
        return '#fca5a5'; // Vermelho
    };

    const latestSelected = selectedQuadraId ? getLatestRecord(selectedQuadraId) : null;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: 'calc(100vh - 120px)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <PageHeader title="Mapa Interativo" subtitle="Fazenda Vale dos Laranjais" logo={logo} />
                
                <div className="premium-card glass" style={{ padding: '0.8rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontWeight: '800' }}>Filtro:</span>
                    <select value={selectedActivity} onChange={(e) => setSelectedActivity(e.target.value)} className="filter-select">
                        {activities.map(act => <option key={act} value={act}>{act}</option>)}
                    </select>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '1.5rem', flex: 1, overflow: 'hidden' }}>
                <div className="premium-card" style={{ flex: 2, display: 'flex', justifyContent: 'center', background: '#fff', padding: '20px' }}>
                    {loading ? <p>Sincronizando com o Supabase...</p> : (
                        <svg viewBox="0 0 522 646" style={{ width: 'auto', height: '100%' }}>
                            {/* Quadras Interativas */}
                            {QUADRAS_DATA.map((q) => (
                                <path
                                    key={q.id}
                                    d={q.d}
                                    fill={getQuadraColor(q.id)}
                                    stroke={selectedQuadraId === q.id ? "var(--primary)" : "black"}
                                    strokeWidth={selectedQuadraId === q.id ? "3" : "1"}
                                    onClick={() => setSelectedQuadraId(q.id)}
                                    style={{ cursor: 'pointer', transition: '0.2s' }}
                                >
                                    <title>{`Quadra ${q.id}`}</title>
                                </path>
                            ))}
                            
                            {/* Números e Legendas originais do mapa (não clicáveis) */}
                            <g pointerEvents="none" opacity="0.7">
                               <path d="M144.16 1.88966C142.96 5.22304..." fill="black"/>
                               {/* ... Resto dos caminhos de texto do seu SVG original aqui ... */}
                            </g>
                        </svg>
                    )}
                </div>

                <div className="premium-card" style={{ flex: 1, background: 'white', borderLeft: '4px solid var(--primary)' }}>
                    <h2 style={{ fontSize: '1.4rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <MapIcon size={24}/> {selectedQuadraId ? `Quadra ${selectedQuadraId}` : 'Selecione no Mapa'}
                    </h2>

                    {latestSelected ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div style={{ background: 'var(--primary-gradient)', color: 'white', padding: '1.2rem', borderRadius: '15px' }}>
                                <small style={{ fontWeight: 'bold', letterSpacing: '1px' }}>ÚLTIMA PULVERIZAÇÃO</small>
                                <div style={{ fontSize: '1.5rem', fontWeight: '900' }}>{latestSelected.receita}</div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <Calendar size={20} color="var(--primary)"/>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.8rem', color: '#64748b' }}>DATA APLICADA</label>
                                        <span style={{ fontWeight: 'bold' }}>{format(parseISO(latestSelected.data_inicial), "dd 'de' MMMM, yyyy", { locale: ptBR })}</span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <Clock size={20} color="#f59e0b"/>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.8rem', color: '#64748b' }}>PRÓXIMA APLICAÇÃO</label>
                                        <span style={{ fontWeight: 'bold' }}>{latestSelected.proxima_pulverizacao ? format(parseISO(latestSelected.proxima_pulverizacao), "dd/MM/yyyy") : 'Não agendada'}</span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <Beaker size={20} color="#ef4444"/>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.8rem', color: '#64748b' }}>OBSERVAÇÕES / PRODUTOS</label>
                                        <p style={{ margin: 0, fontSize: '0.9rem' }}>{latestSelected.observacao || 'Nenhuma observação informada.'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : selectedQuadraId ? (
                        <div style={{ textAlign: 'center', marginTop: '3rem', color: '#64748b' }}>
                            <AlertCircle size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }}/>
                            <p>Nenhuma aplicação encontrada para a <strong>Quadra {selectedQuadraId}</strong> com o filtro selecionado.</p>
                        </div>
                    ) : (
                        <p style={{ color: '#64748b' }}>Clique em uma área do mapa para ver os detalhes da pulverização.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
