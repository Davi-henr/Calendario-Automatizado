import React, { useState, useEffect, useMemo } from 'react';
import { registrosService } from '../lib/services';
import { parseISO, format, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Map as MapIcon, Calendar, Beaker, Activity, Clock, 
  AlertCircle, Maximize2, Minimize2, CheckCircle2, PlayCircle, Filter 
} from 'lucide-react';
import PageHeader from './PageHeader';

const QUADRAS_DATA = [
  { id: "021", d: "M281.102 508L226.602 558L164.102 532.5L223.602 485L281.102 508Z" },
  { id: "026", d: "M289.602 498L282.102 507.5L262.602 501.5L313.602 432.5L323.602 439L293.102 485.5L289.602 498Z" },
  { id: "027", d: "M272.102 425L222.102 484.5L224.102 486L264.602 500L305.602 441L272.102 425Z" },
  { id: "007", d: "M494.102 209.5L431.602 259L246.602 195L258.602 131L494.102 209.5Z" },
  { id: "033", d: "M319.102 421.5L305.602 441L272.602 426L273.602 423L276.102 389.5L272.602 366.5L273.602 360L321.602 396.5L324.602 402L319.102 421.5Z" },
  { id: "005C", d: "M322.602 396.5L325.602 398.5L333.602 393.5L382.102 326.5L330.102 303L291.102 372L325.602 398.5Z" },
  { id: "005B", d: "M281.602 278L328.602 302L291.102 368L288.102 369.5L248.102 338.5L281.602 278Z" },
  { id: "005A", d: "M217.602 246L281.602 278L247.602 338L185.102 288.5L217.602 246Z" },
  { id: "006A", d: "M306.602 217L281.102 276L218.602 244L245.102 195L306.602 217Z" },
  { id: "006B", d: "M308.102 217.5L282.102 276L381.102 325.5L397.102 287L428.602 260V258L312.602 218.5L308.102 217.5Z" },
  { id: "024", d: "M421.602 310L411.602 317L421.602 298V292L433.602 279.5L443.602 276.5L446.102 279.5L430.102 295L421.602 310Z" },
  { id: "017", d: "M431.602 258L448.102 277L457.602 274.5L475.102 264.5L493.102 268.5L501.602 260L504.602 246.5L516.602 222.5L519.102 205L513.102 196H511.102L431.602 258Z" },
  { id: "008", d: "M511.602 191L493.602 209.5L260.102 132.5L267.102 101.5L301.102 111L321.602 90.5L407.602 119.5L481.102 151.5L511.602 191Z" },
  { id: "001", d: "M267.102 86L258.102 130.5L245.102 193.5L165.102 116.5L267.102 86Z" },
  { id: "018", d: "M298.102 40.5L268.102 80L166.602 41.5L171.602 27.5L165.102 21L169.102 6.5L298.102 40.5Z" },
  { id: "034", d: "M237.602 76.5L230.602 96.5L248.102 92V79L237.602 76.5Z" },
  { id: "022", d: "M171.602 27L166.102 40L134.102 27L147.102 1L168.102 7L164.102 20.5L171.602 27Z" },
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
  { id: "020", d: "M185.602 472L159.602 531.5H163.102L223.602 486.5L185.602 472Z" },
  { id: "019", d: "M158.602 530L134.102 517.5L141.102 454.5L183.602 470L158.602 530Z" },
  { id: "028", d: "M271.602 424.5L224.602 484.5L174.602 466.5L224.602 407.5L271.602 424.5Z" },
  { id: "029", d: "M222.602 407.5L173.102 465.5L139.102 453.5L151.102 369.5L222.602 407.5Z" },
  { id: "032", d: "M274.102 393V426L221.102 408L249.602 339L274.102 357V393Z" },
  { id: "031", d: "M243.602 353L222.102 407.5L172.102 380L187.602 361L217.602 345.5L243.602 353Z" },
  { id: "030", d: "M149.602 369.5L171.602 378L186.602 361.5L218.102 346.5L242.602 352.5L248.602 339L186.602 289L149.602 343.5V369.5Z" }
];

export default function InteractiveMap({ logo }) {
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedActivity, setSelectedActivity] = useState('Todos');
  const [selectedInput, setSelectedInput] = useState('');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [selectedQuadraId, setSelectedQuadraId] = useState(null);
  const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => {
    const fetchRegistros = async () => {
      try {
        const data = await registrosService.getAll();
        setRegistros(data || []);
      } catch (error) {
        console.error("Erro ao carregar registros:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRegistros();
  }, []);

  const activities = useMemo(() => ['Todos', ...new Set(registros.map(r => r.receita).filter(Boolean))], [registros]);

  const filteredRegistros = useMemo(() => {
    return registros.filter(r => {
      const matchActivity = selectedActivity === 'Todos' || r.receita === selectedActivity;
      const matchInput = !selectedInput || (r.observacao && r.observacao.toLowerCase().includes(selectedInput.toLowerCase()));
      
      let matchDate = true;
      if (dateStart && dateEnd) {
        try {
          const rDate = new Date(r.data_inicial);
          matchDate = isWithinInterval(rDate, { start: new Date(dateStart), end: new Date(dateEnd) });
        } catch (e) { matchDate = false; }
      }
      return matchActivity && matchInput && matchDate;
    });
  }, [registros, selectedActivity, selectedInput, dateStart, dateEnd]);

  const getLatestRecord = (quadraId) => {
    const quadraRecords = filteredRegistros.filter(r => String(r.quadra) === String(quadraId));
    quadraRecords.sort((a, b) => new Date(b.data_inicial) - new Date(a.data_inicial));
    return quadraRecords[0] || null;
  };

  const getQuadraColor = (quadraId) => {
    const latest = getLatestRecord(quadraId);
    if (!latest) return '#f1f5f9'; 
    return latest.situacao === 'Iniciada' ? '#fef08a' : '#86efac';
  };

  const formatDateSafe = (dateStr) => {
    try {
      return dateStr ? format(parseISO(dateStr), "dd/MM/yy", { locale: ptBR }) : '--';
    } catch (e) { return '--'; }
  };

  const latestSelected = selectedQuadraId ? getLatestRecord(selectedQuadraId) : null;

  const containerStyle = isFullScreen ? {
    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', 
    zIndex: 9999, background: '#f8fafc', padding: '1.5rem', display: 'flex', flexDirection: 'column'
  } : { 
    display: 'flex', flexDirection: 'column', gap: '1rem', height: 'calc(100vh - 120px)' 
  };

  return (
    <div style={containerStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <PageHeader title="Mapa Vale dos Laranjais" subtitle="Monitoramento de Pulverização" logo={logo} />
        <button onClick={() => setIsFullScreen(!isFullScreen)} className="premium-button" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isFullScreen ? <Minimize2 size={18}/> : <Maximize2 size={18}/>}
          {isFullScreen ? "Sair" : "Tela Cheia"}
        </button>
      </div>

      {/* FILTROS */}
      <div className="premium-card glass" style={{ display: 'flex', gap: '1rem', padding: '1rem', flexWrap: 'wrap', alignItems: 'end' }}>
        <div style={{ flex: 1, minWidth: '150px' }}>
          <label style={{ fontSize: '0.7rem', fontWeight: 'bold' }}>ATIVIDADE / DOENÇA</label>
          <select value={selectedActivity} onChange={(e) => setSelectedActivity(e.target.value)} className="filter-select">
            {activities.map(act => <option key={act} value={act}>{act}</option>)}
          </select>
        </div>
        <div style={{ flex: 1, minWidth: '150px' }}>
          <label style={{ fontSize: '0.7rem', fontWeight: 'bold' }}>BUSCAR INSUMO (Ex: MANCOZEBE)</label>
          <input type="text" value={selectedInput} onChange={(e) => setSelectedInput(e.target.value)} className="filter-select" placeholder="Digite o produto..." />
        </div>
        <div style={{ flex: 1, minWidth: '250px' }}>
          <label style={{ fontSize: '0.7rem', fontWeight: 'bold' }}>PERÍODO</label>
          <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
            <input type="date" value={dateStart} onChange={(e) => setDateStart(e.target.value)} className="filter-select" />
            <input type="date" value={dateEnd} onChange={(e) => setDateEnd(e.target.value)} className="filter-select" />
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', flex: 1, overflow: 'hidden' }}>
        {/* MAPA */}
        <div className="premium-card" style={{ flex: 3, display: 'flex', justifyContent: 'center', background: '#fff', position: 'relative' }}>
          <svg viewBox="0 0 522 646" style={{ width: 'auto', height: '100%', maxHeight: isFullScreen ? '75vh' : '550px' }}>
            {QUADRAS_DATA.map((q) => (
              <path
                key={q.id}
                d={q.d}
                fill={getQuadraColor(q.id)}
                stroke={selectedQuadraId === q.id ? "var(--primary)" : "#334155"}
                strokeWidth={selectedQuadraId === q.id ? "3" : "1"}
                onClick={() => setSelectedQuadraId(q.id)}
                style={{ cursor: 'pointer', transition: '0.2s' }}
              />
            ))}
          </svg>
          <div style={{ position: 'absolute', bottom: '15px', left: '15px', display: 'flex', gap: '10px', fontSize: '0.7rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '10px', height: '10px', background: '#fef08a' }}></div> Iniciada</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '10px', height: '10px', background: '#86efac' }}></div> Finalizada</span>
          </div>
        </div>

        {/* DETALHES */}
        <div className="premium-card" style={{ flex: 1.2, background: 'white', display: 'flex', flexDirection: 'column', gap: '1rem', borderLeft: '5px solid var(--primary)', overflowY: 'auto' }}>
          <h2 style={{ fontSize: '1.2rem', color: 'var(--primary)' }}>Quadra {selectedQuadraId || '...'}</h2>
          
          {latestSelected ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ padding: '10px', borderRadius: '8px', textAlign: 'center', fontWeight: 'bold', background: latestSelected.situacao === 'Iniciada' ? '#fef08a' : '#86efac' }}>
                {latestSelected.situacao ? latestSelected.situacao.toUpperCase() : 'SEM STATUS'}
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px' }}>
                  <small style={{ color: '#64748b' }}>DATA INÍCIO</small>
                  <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{formatDateSafe(latestSelected.data_inicial)}</div>
                </div>
                <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px' }}>
                  <small style={{ color: '#64748b' }}>DATA TÉRMINO</small>
                  <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{formatDateSafe(latestSelected.data_final)}</div>
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px' }}>
                <small style={{ color: '#64748b' }}>QUANTIDADE BOMBAS</small>
                <div style={{ fontWeight: 'bold' }}>{latestSelected.bombas || '0'} Bombas</div>
              </div>

              <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px' }}>
                <small style={{ color: '#64748b' }}><Beaker size={12}/> INSUMOS / OBSERVAÇÃO</small>
                <p style={{ fontSize: '0.85rem', margin: '5px 0', whiteSpace: 'pre-wrap' }}>{latestSelected.observacao || 'Nenhum registro.'}</p>
              </div>

              <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '10px', borderRadius: '8px', border: '1px solid #f59e0b' }}>
                <small style={{ color: '#b45309', fontWeight: 'bold' }}>PRÓXIMA APLICAÇÃO</small>
                <div style={{ fontWeight: 'bold' }}>{latestSelected.proxima_pulverizacao ? format(parseISO(latestSelected.proxima_pulverizacao), "dd/MM/yyyy") : 'Não definida'}</div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', marginTop: '2rem', color: '#94a3b8' }}>
                <AlertCircle size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }}/>
                <p>Nenhum lançamento encontrado para esta área.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
