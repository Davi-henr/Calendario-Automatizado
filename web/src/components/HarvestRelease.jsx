import React, { useState, useEffect, useMemo } from 'react';
import { registrosService, osService, insumosService } from '../lib/services';
import { format, parseISO, addDays, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import PageHeader from './PageHeader';
import { 
  Search, ShieldAlert, ShieldCheck, Filter, Calendar as CalendarIcon, 
  Map as MapIcon, Maximize2, Minimize2, Printer, Beaker, AlertCircle 
} from 'lucide-react';

// ==========================================
// DADOS DO MAPA (Vindos do InteractiveMap)
// ==========================================
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

const MANUAL_CENTERS = {
  "003": { x: 130, y: 220 }, "004": { x: 135, y: 310 }, "032": { x: 250, y: 385 },
  "017": { x: 480, y: 235 }, "024": { x: 428, y: 295 }, "015": { x: 145, y: 580 },
  "016": { x: 185, y: 590 }, "020": { x: 188, y: 500 }, "012": { x: 95,  y: 455 },
  "030": { x: 195, y: 340 }, "013": { x: 95,  y: 520 }, "034": { x: 239, y: 86 }
};

const getPathCenter = (id, d) => {
  if (MANUAL_CENTERS[id]) return MANUAL_CENTERS[id];
  const points = d.match(/([0-9.]+)/g);
  if (!points || points.length < 2) return { x: 0, y: 0 };
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (let i = 0; i < points.length; i += 2) {
    const x = parseFloat(points[i]);
    const y = parseFloat(points[i + 1]);
    if (!isNaN(x)) { minX = Math.min(minX, x); maxX = Math.max(maxX, x); }
    if (!isNaN(y)) { minY = Math.min(minY, y); maxY = Math.max(maxY, y); }
  }
  return { x: minX + (maxX - minX) / 2, y: minY + (maxY - minY) / 2 };
};

const formatQuadraLabel = (id) => id.replace(/^0+/, '');

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================
export default function HarvestRelease({ logo }) {
    const [registros, setRegistros] = useState([]);
    const [osList, setOsList] = useState([]);
    const [insumosMeta, setInsumosMeta] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Filtros e UI
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('Todos');
    const [selectedQuadraId, setSelectedQuadraId] = useState(null);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    
    // Armazena as datas "maquiadas" na memória do navegador
    const [adjustedDates, setAdjustedDates] = useState({});

    useEffect(() => {
        const savedDates = localStorage.getItem('harvest_adjusted_dates');
        if (savedDates) setAdjustedDates(JSON.parse(savedDates));
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
            localStorage.setItem('harvest_adjusted_dates', JSON.stringify(next));
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

        // 1. Filtra as quadras ignoradas ANTES de fazer qualquer cálculo
        const registrosFiltrados = registros.filter(r => 
            r.quadra !== 'Bordas' && r.quadra !== 'Limão'
        );
        
        // 2. Ordena pela data REAL do banco (mais recente primeiro) e usa o ID como desempate.
        // Isso impede que a tabela se misture ou que uma quadra perca a operação certa.
        registrosFiltrados.sort((a, b) => {
            const dateA = new Date(a.data_inicial).getTime() || 0;
            const dateB = new Date(b.data_inicial).getTime() || 0;
            if (dateB !== dateA) return dateB - dateA;
            return String(b.id).localeCompare(String(a.id), undefined, { numeric: true });
        });

        // 3. Pega SOMENTE o primeiro registro de cada quadra (que já sabemos ser o mais recente)
        const quadrasMap = {};
        registrosFiltrados.forEach(reg => {
            const quadra = String(reg.quadra);
            if (!quadrasMap[quadra]) {
                quadrasMap[quadra] = reg;
            }
        });

        // 4. Agora aplica a "maquiagem" da data apenas nessas quadras separadas
        let data = Object.values(quadrasMap).map(reg => {
            const dataBase = adjustedDates[reg.id] || reg.data_inicial;
            const carenciaMaxima = reg.os_id ? getMaxCarencia(reg.os_id) : parseInt(reg.dias_carencia || 0, 10);
            
            let dataLiberada = null;
            let statusColheita = 'Bloqueada';
            
            if (dataBase) {
                const dateObj = parseISO(dataBase);
                dataLiberada = addDays(dateObj, carenciaMaxima);
                
                if (reg.situacao === 'Iniciada') {
                    statusColheita = 'Bloqueada';
                } else if (differenceInDays(today, dataLiberada) >= 0) {
                    statusColheita = 'Liberada';
                } else {
                    statusColheita = 'Bloqueada';
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

        // 5. Filtros visuais
        if (searchTerm) {
            const lowerSearch = searchTerm.toLowerCase();
            data = data.filter(r => (r.quadra || '').toLowerCase().includes(lowerSearch) || (r.receita || '').toLowerCase().includes(lowerSearch));
        }
        if (filterStatus !== 'Todos') {
            data = data.filter(r => r.status_colheita === filterStatus);
        }

        // 6. Ordem Alfanumérica (A-Z) para as linhas nunca pularem de lugar.
        data.sort((a, b) => String(a.quadra).localeCompare(String(b.quadra), undefined, { numeric: true, sensitivity: 'base' }));

        return data;
    }, [registros, osList, insumosMeta, adjustedDates, searchTerm, filterStatus]);

    // ==========================================
    // LÓGICA DE CORES DO MAPA
    // ==========================================
    const getQuadraHarvestState = (quadraId) => {
        const records = processedData.filter(r => String(r.quadra) === String(quadraId));
        if (records.length === 0) return 'Vazia'; 
        
        const isBlocked = records.some(r => r.status_colheita === 'Bloqueada');
        return isBlocked ? 'Bloqueada' : 'Liberada';
    };

    const getQuadraColor = (quadraId) => {
        const state = getQuadraHarvestState(quadraId);
        if (state === 'Bloqueada') return '#fca5a5'; 
        if (state === 'Liberada') return '#bbf7d0'; 
        return '#f1f5f9'; 
    };

    const getQuadraStroke = (quadraId) => {
        const state = getQuadraHarvestState(quadraId);
        if (selectedQuadraId === quadraId) return 'var(--primary)';
        if (state === 'Bloqueada') return '#dc2626';
        if (state === 'Liberada') return '#16a34a';
        return '#cbd5e1';
    };

    // Filtra registros apenas para o painel lateral
    const latestSelected = useMemo(() => {
        if (!selectedQuadraId) return [];
        return processedData.filter(r => String(r.quadra) === String(selectedQuadraId));
    }, [selectedQuadraId, processedData]);

    // ==========================================
    // EXPORTAÇÃO PDF (MAPA + TABELA)
    // ==========================================
    const exportMapAndTableToPDF = async () => {
        setIsExporting(true);
        try {
            const svgElement = document.getElementById('harvest-map-svg');
            if (!svgElement) throw new Error("Mapa não encontrado.");

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const svgData = new XMLSerializer().serializeToString(svgElement);
            const safeSvgData = svgData.replace(/var\(--primary\)/g, '#2563eb');
            
            const img = new Image();
            const svgBlob = new Blob([safeSvgData], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(svgBlob);

            await new Promise((resolve, reject) => {
                img.onload = () => {
                    canvas.width = svgElement.clientWidth * 2; 
                    canvas.height = svgElement.clientHeight * 2;
                    ctx.fillStyle = "#ffffff";
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    URL.revokeObjectURL(url);
                    resolve();
                };
                img.onerror = reject;
                img.src = url;
            });

            const mapBase64 = canvas.toDataURL('image/png');
            const doc = new jsPDF('p', 'mm', 'a4');
            const pw = doc.internal.pageSize.getWidth();

            if (logo) doc.addImage(logo, 'PNG', 14, 10, 25, 15);
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('Relatório de Liberação de Colheita', pw / 2, 16, { align: 'center' });
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy')}`, pw / 2, 22, { align: 'center' });

            const mapW = 110;
            const mapH = mapW * (646 / 522);
            const mapX = (pw - mapW) / 2;
            doc.addImage(mapBase64, 'PNG', mapX, 30, mapW, mapH);

            let currentY = 30 + mapH + 15;

            const tableBody = processedData.map(reg => [
                `Q-${reg.quadra}`,
                reg.receita,
                reg.data_base ? format(parseISO(reg.data_base), 'dd/MM/yyyy') : '--',
                `${reg.carencia_maxima} dias`,
                reg.data_liberada ? format(reg.data_liberada, 'dd/MM/yyyy') : '--',
                reg.status_colheita
            ]);

            if (tableBody.length > 0) {
                if (currentY > 250) { doc.addPage(); currentY = 20; }
                
                doc.setFontSize(11);
                doc.setFont('helvetica', 'bold');
                doc.text('Situação Analítica das Quadras', 14, currentY);
                
                autoTable(doc, {
                    startY: currentY + 3,
                    head: [['Quadra', 'Operação', 'Data Pulverização', 'Carência', 'Liberação', 'Status']],
                    body: tableBody,
                    theme: 'grid',
                    styles: { fontSize: 8, cellPadding: 1.5 },
                    headStyles: { fillColor: [37, 99, 235] }, 
                    didParseCell: function(data) {
                        if (data.section === 'body' && data.column.index === 5) {
                            if (data.cell.raw === 'Liberada') data.cell.styles.textColor = [22, 163, 74]; 
                            if (data.cell.raw === 'Bloqueada') data.cell.styles.textColor = [220, 38, 38]; 
                        }
                    }
                });
            } else {
                doc.setFont('helvetica', 'italic');
                doc.text('Nenhuma quadra com aplicação ativa.', pw / 2, currentY, { align: 'center' });
            }

            doc.save(`Painel_Colheita_${format(new Date(), 'ddMMyyyy')}.pdf`);
        } catch (err) {
            console.error("Erro ao gerar PDF", err);
            alert("Erro ao gerar PDF.");
        } finally {
            setIsExporting(false);
        }
    };

    const layoutStyle = isFullScreen ? {
        position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', 
        zIndex: 9999, background: '#f8fafc', padding: '1.5rem', display: 'flex', flexDirection: 'column', overflowY: 'auto'
    } : { 
        display: 'flex', flexDirection: 'column', gap: '1rem', minHeight: 'calc(100vh - 120px)', position: 'relative' 
    };

    return (
        <div style={layoutStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
                <PageHeader title={isFullScreen ? "Visão Panorâmica (Colheita)" : "Painel de Liberação de Colheita"} subtitle="Auditoria de carência e segurança" logo={logo} />
                <div style={{ display: 'flex', gap: '0.8rem', position: 'absolute', top: 0, right: 0, zIndex: 10001 }}>
                    <button onClick={exportMapAndTableToPDF} disabled={isExporting} className="btn btn-outline" style={{ background: 'white' }}>
                        <div className="btn-inner">
                            <Printer size={18}/> {isExporting ? "Gerando..." : "Exportar PDF"}
                        </div>
                    </button>
                    <button onClick={() => setIsFullScreen(!isFullScreen)} className="btn btn-primary">
                        <div className="btn-inner">
                            {isFullScreen ? <Minimize2 size={18}/> : <Maximize2 size={18}/>} {isFullScreen ? "Sair" : "Tela Cheia"}
                        </div>
                    </button>
                </div>
            </div>

            <div className="premium-card glass" style={{ display: 'flex', gap: '1rem', padding: '1rem', alignItems: 'center', flexWrap: 'wrap', zIndex: 100 }}>
                <div style={{ flex: 1, minWidth: '150px' }}>
                    <label style={{ fontSize: '0.65rem', fontWeight: '900' }}>STATUS COLHEITA</label>
                    <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="filter-select" style={{ width: '100%' }}>
                        <option value="Todos">Todas as Situações</option>
                        <option value="Liberada">Apenas Liberadas</option>
                        <option value="Bloqueada">Apenas Bloqueadas</option>
                    </select>
                </div>
                <div style={{ flex: 2, minWidth: '200px' }}>
                    <label style={{ fontSize: '0.65rem', fontWeight: '900' }}>PESQUISAR (QUADRA OU RECEITA)</label>
                    <div style={{ position: 'relative' }}>
                        <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="filter-select" placeholder="Buscar..." style={{ width: '100%', paddingLeft: '32px' }} />
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', flex: 1, minHeight: '500px' }}>
                <div className="premium-card" style={{ flex: 2.5, display: 'flex', justifyContent: 'center', background: '#fff', position: 'relative' }}>
                    {loading ? (
                        <p style={{ alignSelf: 'center', color: '#94a3b8' }}>Calculando Carências...</p>
                    ) : (
                        <>
                            <svg id="harvest-map-svg" viewBox="0 0 522 646" style={{ width: 'auto', height: '100%', maxHeight: '100%' }}>
                                {QUADRAS_DATA.map((q) => {
                                    const center = getPathCenter(q.id, q.d); 
                                    const label = formatQuadraLabel(q.id);
                                    return (
                                        <g key={q.id}>
                                            <path
                                                d={q.d}
                                                fill={getQuadraColor(q.id)}
                                                stroke={getQuadraStroke(q.id)}
                                                strokeWidth={selectedQuadraId === q.id ? "3" : "1"}
                                                onClick={() => setSelectedQuadraId(q.id)}
                                                style={{ cursor: 'pointer', transition: '0.2s' }}
                                            />
                                            <text 
                                                x={center.x} y={center.y + 4} textAnchor="middle" 
                                                fill={getQuadraHarvestState(q.id) === 'Vazia' ? "#64748b" : "#0f172a"} 
                                                fontSize="11" fontWeight="900" pointerEvents="none"
                                            >
                                                {label}
                                            </text>
                                        </g>
                                    );
                                })}
                            </svg>
                            <div style={{ position: 'absolute', bottom: '15px', left: '15px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.7rem', background: 'rgba(255,255,255,0.95)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border)', fontWeight: 'bold' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '12px', height: '12px', background: '#bbf7d0', border: '1px solid #16a34a', borderRadius: '2px' }}></div> LIBERADA</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '12px', height: '12px', background: '#fca5a5', border: '1px solid #dc2626', borderRadius: '2px' }}></div> BLOQUEADA</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b' }}><div style={{ width: '12px', height: '12px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '2px' }}></div> VAZIA</span>
                            </div>
                        </>
                    )}
                </div>

                <div className="premium-card" style={{ flex: 1.5, background: 'white', display: 'flex', flexDirection: 'column', gap: '1rem', borderLeft: '5px solid var(--primary)', overflowY: 'auto' }}>
                    <h2 style={{ fontSize: '1.2rem', color: 'var(--primary)', borderBottom: '2px solid var(--border)', paddingBottom: '0.5rem' }}>
                        <MapIcon size={20} style={{ verticalAlign: 'middle', marginRight: '5px' }}/> Quadra {selectedQuadraId || '...'}
                    </h2>
                    
                    {!selectedQuadraId ? (
                        <div style={{ textAlign: 'center', marginTop: '2rem', color: '#94a3b8' }}>
                            <AlertCircle size={40} style={{ margin: '0 auto 1rem', opacity: 0.3 }}/>
                            <p style={{ fontSize: '0.8rem' }}>Clique em uma quadra no mapa para ver a aplicação mais recente.</p>
                        </div>
                    ) : latestSelected.length === 0 ? (
                        <div style={{ textAlign: 'center', marginTop: '2rem', color: '#94a3b8' }}>
                            <ShieldCheck size={40} style={{ margin: '0 auto 1rem', color: '#22c55e', opacity: 0.5 }}/>
                            <p style={{ fontSize: '0.8rem' }}>Quadra totalmente liberada.<br/>Nenhuma aplicação recente encontrada.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {latestSelected.map((reg, idx) => (
                                <div key={idx} style={{ padding: '12px', border: `1.5px solid ${reg.status_colheita === 'Bloqueada' ? '#fca5a5' : '#bbf7d0'}`, borderRadius: '10px', background: reg.status_colheita === 'Bloqueada' ? '#fef2f2' : '#f0fdf4' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                        <strong style={{ color: 'var(--text)' }}>{reg.receita}</strong>
                                        <span style={{ fontSize: '0.7rem', fontWeight: '900', padding: '3px 8px', borderRadius: '6px', background: reg.status_colheita === 'Bloqueada' ? '#dc2626' : '#16a34a', color: 'white' }}>
                                            {reg.status_colheita.toUpperCase()}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '0.8rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', color: '#475569' }}>
                                        <div><b>Início:</b> {format(parseISO(reg.data_base), 'dd/MM/yy')}</div>
                                        <div><b>Carência:</b> {reg.carencia_maxima} dias</div>
                                        <div style={{ gridColumn: '1/-1', color: reg.status_colheita === 'Bloqueada' ? '#991b1b' : '#166534' }}>
                                            <b>Liberada em:</b> {reg.data_liberada ? format(reg.data_liberada, 'dd/MM/yyyy') : '--'}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="premium-card glass" style={{ marginTop: '1rem' }}>
                <h3 style={{ margin: '0 0 1rem 0', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Beaker size={20} color="var(--secondary)" /> Detalhamento Operacional (Edição de Auditoria)
                </h3>
                <div className="table-responsive">
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '2.5px solid var(--border)', textAlign: 'left' }}>
                                <th style={{ padding: '1rem' }}>Quadra</th>
                                <th style={{ padding: '1rem' }}>Operação / Receita</th>
                                <th style={{ padding: '1rem' }}>Data Inicial (Editável)</th>
                                <th style={{ padding: '1rem', textAlign: 'center' }}>Carência</th>
                                <th style={{ padding: '1rem' }}>Liberada em</th>
                                <th style={{ padding: '1rem' }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {processedData.length === 0 ? (
                                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>Sem dados na tabela.</td></tr>
                            ) : (
                                processedData.map(reg => (
                                    <tr key={reg.id} style={{ borderBottom: '1px solid var(--border)', backgroundColor: reg.status_colheita === 'Liberada' ? '#f0fdf4' : 'transparent' }}>
                                        <td style={{ padding: '1rem', fontWeight: '900', color: 'var(--text)' }}>Q-{reg.quadra}</td>
                                        <td style={{ padding: '1rem', fontWeight: '600', color: 'var(--text-muted)' }}>{reg.receita}</td>
                                        <td style={{ padding: '1rem' }}>
                                            {/* CAMPO EDITÁVEL ISOLADO - Só salva ao sair do campo (onBlur) */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <CalendarIcon size={16} color="var(--primary)" />
                                                <input 
                                                    type="date" 
                                                    defaultValue={reg.data_base}
                                                    onBlur={(e) => {
                                                        if (e.target.value !== reg.data_base) {
                                                            handleDateChange(reg.id, e.target.value);
                                                        }
                                                    }}
                                                    style={{ 
                                                        padding: '0.4rem 0.6rem', borderRadius: '6px', 
                                                        border: '1px solid #bfdbfe', color: 'var(--primary)',
                                                        fontWeight: 'bold', outline: 'none',
                                                        backgroundColor: adjustedDates[reg.id] ? '#eff6ff' : 'white'
                                                    }}
                                                    title={adjustedDates[reg.id] ? "Data ajustada para auditoria" : "Data real do sistema"}
                                                />
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'center', fontWeight: '800', color: '#64748b' }}>{reg.carencia_maxima} d</td>
                                        <td style={{ padding: '1rem', fontWeight: '800', color: reg.status_colheita === 'Bloqueada' ? '#991b1b' : '#166534' }}>
                                            {reg.data_liberada ? format(reg.data_liberada, 'dd/MM/yyyy') : '-'}
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{ 
                                                display: 'inline-flex', alignItems: 'center', gap: '6px', 
                                                padding: '0.4rem 0.8rem', borderRadius: '10px', 
                                                backgroundColor: reg.status_colheita === 'Liberada' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)', 
                                                color: reg.status_colheita === 'Liberada' ? '#166534' : '#991b1b', 
                                                fontWeight: '800', fontSize: '0.75rem', textTransform: 'uppercase' 
                                            }}>
                                                {reg.status_colheita === 'Liberada' ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
                                                {reg.status_colheita}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
