import React, { useState, useEffect, useRef } from 'react';
import { registrosService, chuvasService, insumosService, settingsService } from '../lib/services';
import PageHeader from './PageHeader';
import InteractiveMap from './InteractiveMap';
import {
    BarChart3,
    Droplets,
    Layers,
    CloudRain,
    ClipboardList,
    FileSpreadsheet,
    Plus,
    Trash2,
    Sun,
    Clock,
    CheckCircle,
    FileDown,
    Search,
    X,
    Bug,
    AlertTriangle,
    ListFilter,
    Map,
    Edit2,
    Printer
} from 'lucide-react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    PointElement,
    LineElement,
    ArcElement
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import {
    format,
    parseISO,
    startOfMonth,
    endOfMonth,
    subMonths,
    startOfWeek,
    addDays,
    subDays,
    isWithinInterval,
    differenceInDays
} from 'date-fns';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Title, Tooltip, Legend);

const API_KEY = "29f247c5a06de34f0992ec03ba8f0a12";
const CIDADE = "Bariri, São Paulo, BR";
const blocks = ["001", "002", "003", "004", "005A", "005B", "005C", "006A", "006B", "007", "008", "009", "010", "011", "012", "013", "014", "015", "016", "017", "018", "019", "020", "021", "022", "024", "026", "027", "028", "029", "030", "031", "032", "033", "034"];

// --- COORDENADAS DO MAPA DA FAZENDA ---
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
  "003": { x: 130, y: 220 },
  "004": { x: 135, y: 310 },
  "032": { x: 250, y: 385 },
  "017": { x: 480, y: 235 },
  "024": { x: 428, y: 295 },
  "015": { x: 145, y: 580 },
  "016": { x: 185, y: 590 },
  "020": { x: 188, y: 500 },
  "012": { x: 95,  y: 455 },
  "030": { x: 195, y: 340 },
  "013": { x: 95,  y: 520 },
  "034": { x: 239, y: 86 }
};

const getPathCenter = (id, d) => {
  if (MANUAL_CENTERS[id]) return MANUAL_CENTERS[id];
  const points = d.match(/([0-9.]+)/g);
  if (!points || points.length < 2) return { x: 0, y: 0 };
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (let i = 0; i < points.length; i += 2) {
    const x = parseFloat(points[i]); const y = parseFloat(points[i + 1]);
    if (!isNaN(x)) { minX = Math.min(minX, x); maxX = Math.max(maxX, x); }
    if (!isNaN(y)) { minY = Math.min(minY, y); maxY = Math.max(maxY, y); }
  }
  return { x: minX + (maxX - minX) / 2, y: minY + (maxY - minY) / 2 };
};

const formatQuadraLabel = (id) => id.replace(/^0+/, '');

export default function Dashboard({ logo }) {
    const [activeTab, setActiveTab] = useState('chuva'); 
    const [registros, setRegistros] = useState([]);
    const [chuvas, setChuvas] = useState([]);
    const [insumos, setInsumos] = useState([]);
    const [mapSvg, setMapSvg] = useState('');
    const [forecast, setForecast] = useState([]);
    const [loading, setLoading] = useState(true);

    const normalRegistros = registros.filter(r => r.situacao !== 'MapaManual');
    const manualRegistros = registros.filter(r => r.situacao === 'MapaManual');

    const [filterActivity, setFilterActivity] = useState('Todos');
    const [showWeekly, setShowWeekly] = useState(false);

    const [summaryFilters, setSummaryFilters] = useState({ quadra: 'Todos', receita: 'Todos' });
    const [summaryStartDate, setSummaryStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
    const [summaryEndDate, setSummaryEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));

    const [actReportActivity, setActReportActivity] = useState('Todos');
    const [actReportClass, setActReportClass] = useState('Todos');

    const [manualFilters, setManualFilters] = useState({ atividade: 'Adubação', produto: '' });
    const [selectedMapQuadra, setSelectedMapQuadra] = useState(null);
    const [showManualForm, setShowManualForm] = useState(false);
    const [showManualRegistros, setShowManualRegistros] = useState(false);
    const [manualFormData, setManualFormData] = useState({ id: null, atividade: 'Adubação', produto: '', data: format(new Date(), 'yyyy-MM-dd'), cor: '#3b82f6', observacao: '' });
    const mapContainerRef = useRef(null);

    const [rainStartDate, setRainStartDate] = useState(format(subMonths(new Date(), 1), 'yyyy-MM-dd'));
    const [rainEndDate, setRainEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));

    const [showRainForm, setShowRainForm] = useState(false);
    const [rainFormData, setRainFormData] = useState({ data: format(new Date(), 'yyyy-MM-dd'), mm: '', local: 'Sede' });

    useEffect(() => {
        fetchData();
        fetchWeather();
    }, []);

    // Effect reponsável pela renderização da pintura no SVG do Mapa Manual
    useEffect(() => {
        if (activeTab === 'mapaManual' && mapContainerRef.current) {
            const svgEl = mapContainerRef.current.querySelector('svg');
            if (!svgEl) return;

            svgEl.style.width = '100%';
            svgEl.style.height = '100%';

            const currentActRecords = registros.filter(r => r.situacao === 'MapaManual' && r.receita === manualFilters.atividade);
            const latest = {};
            currentActRecords.forEach(r => {
                if (!latest[r.quadra] || new Date(r.data_inicial) > new Date(latest[r.quadra].data_inicial)) {
                    latest[r.quadra] = r;
                }
            });

            const needsProduct = ['Adubação', 'Calcário', 'Gesso'].includes(manualFilters.atividade);
            if (needsProduct && manualFilters.produto) {
                Object.keys(latest).forEach(k => {
                    try {
                        const meta = JSON.parse(latest[k].observacao);
                        if (!meta.produto || !meta.produto.toLowerCase().includes(manualFilters.produto.toLowerCase())) {
                            delete latest[k];
                        }
                    } catch(e) {}
                });
            }

            svgEl.querySelectorAll('.manual-text').forEach(e => e.remove());

            blocks.forEach(b => {
                const el = svgEl.querySelector(`[id="${b}"]`);
                if (el) {
                    el.style.fill = '#f8fafc'; 
                    el.style.stroke = selectedMapQuadra === b ? '#0f172a' : '#cbd5e1';
                    el.style.strokeWidth = selectedMapQuadra === b ? '3px' : '1px';
                    el.style.cursor = 'pointer';
                    el.onclick = () => setSelectedMapQuadra(b);
                }
            });

            Object.values(latest).forEach(reg => {
                const el = svgEl.querySelector(`[id="${reg.quadra}"]`);
                if (el) {
                    try {
                        const meta = JSON.parse(reg.observacao);
                        el.style.fill = meta.cor || '#3b82f6';

                        const bbox = el.getBBox();
                        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                        text.setAttribute('x', bbox.x + bbox.width / 2);
                        text.setAttribute('y', bbox.y + bbox.height / 2 + 16);
                        text.setAttribute('text-anchor', 'middle');
                        text.setAttribute('class', 'manual-text');
                        
                        // CORREÇÕES APLICADAS AQUI: Cor preta, fonte menor (10px) e contorno claro
                        text.setAttribute('fill', '#000000'); 
                        text.setAttribute('font-size', '10px');
                        text.setAttribute('font-weight', '900');
                        text.setAttribute('pointer-events', 'none');
                        text.setAttribute('style', 'text-shadow: 1px 1px 2px rgba(255,255,255,0.9), -1px -1px 2px rgba(255,255,255,0.9);');
                        
                        text.textContent = format(parseISO(reg.data_inicial), 'dd/MM');
                        svgEl.appendChild(text);
                    } catch(e) {}
                }
            });
        }
    }, [activeTab, registros, manualFilters, selectedMapQuadra]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [regData, rainData, insData, settings] = await Promise.all([
                registrosService.getAll(),
                chuvasService.getAll(),
                insumosService.getAll(),
                settingsService.get()
            ]);
            setRegistros(regData);
            setChuvas(rainData);
            setInsumos(insData);
            setMapSvg(settings?.map_svg || '');
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchWeather = async () => {
        try {
            const resp = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${CIDADE}&appid=${API_KEY}&units=metric&lang=pt_br`);
            const data = await resp.json();
            const daily = {};
            data.list.forEach(item => {
                const date = item.dt_txt.split(' ')[0];
                if (!daily[date]) daily[date] = { temp: item.main.temp, icon: item.weather[0].main, desc: item.weather[0].description };
            });
            setForecast(Object.entries(daily).slice(0, 5));
        } catch (err) { console.error(err); }
    };

    const calculateDelay = (reg) => {
        if (reg.situacao !== 'Finalizada' || !reg.data_inicial) return '-';
        const history = normalRegistros
            .filter(r => r.quadra === reg.quadra && r.receita === reg.receita && r.id !== reg.id)
            .sort((a, b) => new Date(b.data_inicial) - new Date(a.data_inicial));

        const prev = history.find(r => new Date(r.data_inicial) < new Date(reg.data_inicial));
        if (!prev || !prev.proxima_pulverizacao) return 'Primeira';

        const scheduledDate = parseISO(prev.proxima_pulverizacao);
        const actualDate = parseISO(reg.data_inicial);
        const diff = differenceInDays(actualDate, scheduledDate);

        if (diff === 0) return 'No prazo';
        if (diff > 0) return `${diff} dias de atraso`;
        return `${Math.abs(diff)} dias adiantado`;
    };

    const handleAddRain = async (e) => {
        e.preventDefault();
        try {
            await chuvasService.create(rainFormData);
            setShowRainForm(false);
            setRainFormData({ data: format(new Date(), 'yyyy-MM-dd'), mm: '', local: 'Sede' });
            fetchData();
        } catch (err) { alert('Erro ao salvar chuva: ' + err.message); }
    };

    const renderChuva = () => {
        const filteredChuvas = chuvas.filter(c =>
            isWithinInterval(parseISO(c.data), { start: parseISO(rainStartDate), end: parseISO(rainEndDate) })
        ).sort((a, b) => new Date(a.data) - new Date(b.data));

        const monthlyMap = {};
        filteredChuvas.forEach(c => {
            const key = format(parseISO(c.data), 'MM/yyyy');
            monthlyMap[key] = (monthlyMap[key] || 0) + parseFloat(c.mm || 0);
        });
        const rainChartLabels = Object.keys(monthlyMap);
        const rainChartValues = Object.values(monthlyMap);
        const totalRain = filteredChuvas.reduce((acc, c) => acc + parseFloat(c.mm || 0), 0);

        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div className="no-print" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem' }}>
                    {forecast.map(([date, data]) => (
                        <div key={date} className="premium-card" style={{ textAlign: 'center', backgroundColor: '#e3f2fd', padding: '1rem' }}>
                            <p style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#1565c0' }}>{format(parseISO(date), 'dd/MM')}</p>
                            <div style={{ margin: '0.5rem 0' }}>
                                {data.icon === 'Rain' ? <CloudRain color="#1976d2" size={24} /> : <Sun color="#fbc02d" size={24} />}
                            </div>
                            <p style={{ fontSize: '1.4rem', fontWeight: '800', color: '#1565c0' }}>{Math.round(data.temp)}°</p>
                            <p style={{ fontSize: '0.65rem', textTransform: 'capitalize' }}>{data.desc}</p>
                        </div>
                    ))}
                </div>

                <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-start' }}>
                    <button onClick={() => setShowRainForm(!showRainForm)} className="btn btn-primary">
                        <div className="btn-inner">
                            {showRainForm ? <X size={18} /> : <Plus size={18} />}
                            {showRainForm ? 'Cancelar' : 'Inserir Chuva'}
                        </div>
                    </button>
                </div>

                {showRainForm && (
                    <div className="premium-card glass no-print" style={{ maxWidth: '600px' }}>
                        <form onSubmit={handleAddRain} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
                            <div className="form-group">
                                <label>Data</label>
                                <input type="date" value={rainFormData.data} onChange={e => setRainFormData({ ...rainFormData, data: e.target.value })} className="input-field" required />
                            </div>
                            <div className="form-group">
                                <label>Milímetros (mm)</label>
                                <input type="number" step="0.1" value={rainFormData.mm} onChange={e => setRainFormData({ ...rainFormData, mm: e.target.value })} className="input-field" placeholder="Ex: 25.5" required />
                            </div>
                            <div className="form-group">
                                <label>Local</label>
                                <input type="text" value={rainFormData.local} onChange={e => setRainFormData({ ...rainFormData, local: e.target.value })} className="input-field" placeholder="Ex: Sede" />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                                    <div className="btn-inner">Gravar</div>
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                    <div className="premium-card glass" style={{ border: '1px solid rgba(255,255,255,0.4)', boxShadow: 'var(--shadow)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                            <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontFamily: 'var(--font-display)', fontWeight: '800', color: 'var(--text)' }}>
                                <div style={{ padding: '0.4rem', background: 'rgba(25, 118, 210, 0.1)', borderRadius: '10px' }}>
                                    <BarChart3 size={20} color="#1976d2" />
                                </div>
                                Acumulado por Mês
                            </h4>
                            <div style={{ textAlign: 'right', padding: '0.6rem 1rem', background: 'rgba(25,118,210,0.08)', borderRadius: '12px' }}>
                                <p style={{ fontSize: '0.65rem', fontWeight: '800', color: '#1976d2', textTransform: 'uppercase', marginBottom: '2px' }}>Total no Período</p>
                                <p style={{ fontSize: '1.4rem', fontWeight: '900', color: '#1565c0', fontFamily: 'var(--font-display)', lineHeight: 1 }}>{totalRain.toFixed(1)} mm</p>
                            </div>
                        </div>
                        <div className="no-print" style={{ display: 'flex', gap: '1.5rem', marginBottom: '2rem' }}>
                            <div className="form-group" style={{ flex: 1 }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>De:</label>
                                <input type="date" value={rainStartDate} onChange={e => setRainStartDate(e.target.value)} className="input-field" style={{ fontSize: '0.85rem', borderRadius: '12px' }} />
                            </div>
                            <div className="form-group" style={{ flex: 1 }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Até:</label>
                                <input type="date" value={rainEndDate} onChange={e => setRainEndDate(e.target.value)} className="input-field" style={{ fontSize: '0.85rem', borderRadius: '12px' }} />
                            </div>
                        </div>
                        <div style={{ height: '320px' }}>
                            {filteredChuvas.length > 0 ? (
                                <Bar
                                    data={{
                                        labels: rainChartLabels,
                                        datasets: [{
                                            label: 'Chuva (mm)',
                                            data: rainChartValues,
                                            backgroundColor: (context) => {
                                                const ctx = context.chart.ctx;
                                                const gradient = ctx.createLinearGradient(0, 0, 0, 300);
                                                gradient.addColorStop(0, '#60a5fa');
                                                gradient.addColorStop(1, '#2563eb');
                                                return gradient;
                                            },
                                            borderRadius: 8,
                                            hoverBackgroundColor: '#1d4ed8'
                                        }]
                                    }}
                                    options={{
                                        responsive: true, maintainAspectRatio: false,
                                        plugins: { legend: { display: false } },
                                        scales: {
                                            y: { grid: { display: true, color: 'rgba(0,0,0,0.03)' } },
                                            x: { grid: { display: false } }
                                        }
                                    }}
                                />
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                                    <CloudRain size={48} style={{ opacity: 0.1, marginBottom: '1rem' }} />
                                    <p style={{ fontSize: '0.9rem', fontWeight: '600' }}>Nenhum dado no período selecionado.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="premium-card">
                        <h4 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <CloudRain size={20} color="#1976d2" /> Histórico de Lançamentos
                        </h4>
                        <div className="table-responsive" style={{ maxHeight: '380px' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '400px' }}>
                                <thead style={{ position: 'sticky', top: 0, backgroundColor: 'white', zIndex: 1, borderBottom: '2px solid var(--border)' }}>
                                    <tr style={{ textAlign: 'left', fontSize: '0.8rem' }}>
                                        <th style={{ padding: '0.75rem' }}>Data</th>
                                        <th style={{ padding: '0.75rem' }}>Local</th>
                                        <th style={{ padding: '0.75rem' }}>mm</th>
                                        <th className="no-print" style={{ padding: '0.75rem' }}>Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {chuvas.map(c => (
                                        <tr key={c.id} style={{ borderBottom: '1px solid #f5f5f5', fontSize: '0.85rem' }}>
                                            <td style={{ padding: '0.75rem' }}>{format(parseISO(c.data), 'dd/MM/yyyy')}</td>
                                            <td style={{ padding: '0.75rem' }}>{c.local}</td>
                                            <td style={{ padding: '0.75rem', fontWeight: 'bold', color: '#1976d2' }}>{c.mm} mm</td>
                                            <td className="no-print" style={{ padding: '0.75rem' }}>
                                                <button onClick={async () => { if (confirm('Excluir?')) { await chuvasService.delete(c.id); fetchData(); } }} className="btn btn-mini" style={{ color: '#ef5350' }} title="Excluir">
                                                    <div className="btn-inner" style={{ padding: '0.4rem' }}><Trash2 size={16} /></div>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderPlanejamento = () => {
        const recipes = ["Chuá", "Leprose", "Alternária", "Pinta Preta", "Aplicação de Winner", "Herbicida"];
        
        let ongoing = normalRegistros.filter(r => r.situacao === 'Iniciada').sort((a, b) => a.quadra.localeCompare(b.quadra, undefined, { numeric: true }));
        
        if (filterActivity !== 'Todos') {
            ongoing = ongoing.filter(r => r.receita === filterActivity);
        }

        const exportPDF = () => {
            const doc = new jsPDF();
            doc.text('Planejamento de Pulverização', 14, 15);

            if (ongoing.length > 0) {
                doc.setFontSize(14);
                doc.text('Em Andamento', 14, 25);
                doc.autoTable({
                    head: [['Início', 'Quadra', 'Atividade', 'Obs', 'Bombas']],
                    body: ongoing.map(r => [format(parseISO(r.data_inicial), 'dd/MM/yyyy'), r.quadra, r.receita, r.observacao || '', r.quantidade_bombas || '']),
                    startY: 30
                });
            }
            doc.save('planejamento.pdf');
        };

        return (
            <div className="premium-card">
                <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <select value={filterActivity} onChange={e => setFilterActivity(e.target.value)} className="filter-select">
                            <option value="Todos">Todas Atividades</option>
                            {recipes.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>
                    <button onClick={exportPDF} className="btn btn-secondary" style={{ marginBottom: '1.5rem' }}>
                        <div className="btn-inner">
                            <FileDown size={18} /> Exportar PDF (Planejamento)
                        </div>
                    </button>
                </div>

                {ongoing.length > 0 ? (
                    <div style={{ marginBottom: '3rem' }}>
                        <h4 style={{ marginBottom: '1.2rem', color: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <Droplets size={20} /> Pulverizações em Andamento
                        </h4>
                        <div className="table-responsive">
                            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                                        <th style={{ padding: '0.75rem' }}>Início</th>
                                        <th style={{ padding: '0.75rem' }}>Quadra</th>
                                        <th style={{ padding: '0.75rem' }}>Atividade</th>
                                        <th style={{ padding: '0.75rem' }}>Obs</th>
                                        <th style={{ padding: '0.75rem' }}>Bombas</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {ongoing.map(r => (
                                        <tr key={r.id} style={{ borderBottom: '1px solid #eee', backgroundColor: 'rgba(251, 140, 0, 0.02)' }}>
                                            <td style={{ padding: '0.75rem' }}>{format(parseISO(r.data_inicial), 'dd/MM/yyyy')}</td>
                                            <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>{r.quadra}</td>
                                            <td style={{ padding: '0.75rem' }}>{r.receita}</td>
                                            <td style={{ padding: '0.75rem', fontSize: '0.8rem', maxWidth: '200px' }}>{r.observacao}</td>
                                            <td style={{ padding: '0.75rem' }}>{r.quantidade_bombas}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                        Nenhuma pulverização em andamento encontrada.
                    </p>
                )}
            </div>
        );
    };

    const renderResumo = () => {
        const activityTotals = {};
        normalRegistros.forEach(r => {
            activityTotals[r.receita] = (activityTotals[r.receita] || 0) + (parseInt(r.quantidade_bombas) || 0);
        });

        const finalizadasRaw = normalRegistros.filter(r =>
            r.situacao === 'Finalizada' &&
            (summaryFilters.quadra === 'Todos' || r.quadra === summaryFilters.quadra) &&
            (summaryFilters.receita === 'Todos' || r.receita === summaryFilters.receita) &&
            r.data_final && isWithinInterval(parseISO(r.data_final), { start: parseISO(summaryStartDate), end: parseISO(summaryEndDate) })
        );

        const latestFinalizadas = {};
        finalizadasRaw.forEach(r => {
            const key = `${r.quadra}_${r.receita}`;
            if (!latestFinalizadas[key] || new Date(r.data_final) > new Date(latestFinalizadas[key].data_final)) {
                latestFinalizadas[key] = r;
            }
        });

        const finalizadasData = Object.values(latestFinalizadas).sort((a, b) => a.quadra.localeCompare(b.quadra, undefined, { numeric: true }));
        const recipes = ["Chuá", "Leprose", "Alternária", "Pinta Preta", "Aplicação de Winner", "Herbicida"];

        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    {Object.entries(activityTotals).map(([act, total]) => (
                        <div key={act} className="premium-card" style={{ borderLeft: '4px solid var(--secondary)' }}>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{act}</p>
                            <h3 style={{ fontSize: '1.4rem', fontWeight: '800' }}>{total} <span style={{ fontSize: '0.9rem', fontWeight: 'normal' }}>Bombas</span></h3>
                        </div>
                    ))}
                </div>

                <div className="premium-card glass no-print" style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flex: 1, minWidth: '300px' }}>
                        <div style={{ padding: '0.6rem', background: 'rgba(46, 125, 50, 0.1)', borderRadius: '10px', display: 'flex', alignItems: 'center' }}>
                            <Search size={18} color="var(--primary)" />
                        </div>
                        <select value={summaryFilters.quadra} onChange={(e) => setSummaryFilters(s => ({ ...s, quadra: e.target.value }))} className="filter-select">
                            <option value="Todos">Todas Quadras</option>
                            {blocks.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                        <select value={summaryFilters.receita} onChange={(e) => setSummaryFilters(s => ({ ...s, receita: e.target.value }))} className="filter-select">
                            <option value="Todos">Todas Receitas</option>
                            {recipes.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', borderLeft: '1px solid var(--border)', paddingLeft: '1rem' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label style={{ fontSize: '0.7rem', marginBottom: '0.2rem' }}>De:</label>
                            <input type="date" value={summaryStartDate} onChange={e => setSummaryStartDate(e.target.value)} className="input-field" style={{ fontSize: '0.8rem', padding: '0.4rem' }} />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label style={{ fontSize: '0.7rem', marginBottom: '0.2rem' }}>Até:</label>
                            <input type="date" value={summaryEndDate} onChange={e => setSummaryEndDate(e.target.value)} className="input-field" style={{ fontSize: '0.8rem', padding: '0.4rem' }} />
                        </div>
                    </div>
                </div>

                <div className="premium-card">
                    <h4 style={{ marginBottom: '1.5rem' }}>Histórico de Desempenho (Atrasos - Últimas Aplicações)</h4>
                    <div className="table-responsive">
                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                                    <th style={{ padding: '0.75rem' }}>Quadra</th>
                                    <th style={{ padding: '0.75rem' }}>Atividade</th>
                                    <th style={{ padding: '0.75rem' }}>Início</th>
                                    <th style={{ padding: '0.75rem' }}>Fim</th>
                                    <th style={{ padding: '0.75rem' }}>Situação</th>
                                </tr>
                            </thead>
                            <tbody>
                                {finalizadasData.slice(0, 20).map(r => {
                                    const delay = calculateDelay(r);
                                    return (
                                        <tr key={r.id} style={{ borderBottom: '1px solid #eee' }}>
                                            <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>{r.quadra}</td>
                                            <td style={{ padding: '0.75rem' }}>{r.receita}</td>
                                            <td style={{ padding: '0.75rem' }}>{format(parseISO(r.data_inicial), 'dd/MM/yyyy')}</td>
                                            <td style={{ padding: '0.75rem' }}>{format(parseISO(r.data_final), 'dd/MM/yyyy')}</td>
                                            <td style={{ padding: '0.75rem' }}>
                                                <span style={{
                                                    color: delay.includes('atraso') ? '#c62828' : '#2e7d32',
                                                    fontWeight: 'bold',
                                                    fontSize: '0.85rem'
                                                }}>{delay}</span>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    const renderLeprose = () => {
        const leproseRegs = normalRegistros.filter(r => r.receita?.toLowerCase().includes('leprose') && r.data_inicial);

        const latestByQuadra = {};
        leproseRegs.forEach(r => {
            if (!latestByQuadra[r.quadra] || new Date(r.data_inicial) > new Date(latestByQuadra[r.quadra].data_inicial)) {
                latestByQuadra[r.quadra] = r;
            }
        });

        const tableData = Object.values(latestByQuadra).sort((a, b) => a.quadra.localeCompare(b.quadra, undefined, { numeric: true }));

        const getAcaricidaInfo = (observacao) => {
            if (!observacao) return { nome: '-', dosagem: '-' };
            const acaricidas = insumos.filter(i => i.classificacao?.toLowerCase().includes('acaricida'));
            let foundNome = '-';
            let foundDosagem = '-';
            for (const aca of acaricidas) {
                const regex = new RegExp(`${aca.insumo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*(?:\\(([^)]+)\\))?`, 'i');
                const match = observacao.match(regex);
                if (match) {
                    foundNome = aca.insumo;
                    foundDosagem = match[1] || '-';
                    break;
                }
            }
            return { nome: foundNome, dosagem: foundDosagem };
        };

        const exportPDF = () => {
            const doc = new jsPDF();
            doc.text('Relatório de Controle de Leprose', 14, 15);
            doc.setFontSize(10);
            doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 22);

            const dataToExport = tableData.map(r => {
                const info = getAcaricidaInfo(r.observacao);
                const dias = differenceInDays(new Date(), parseISO(r.data_inicial));
                return [
                    format(parseISO(r.data_inicial), 'dd/MM/yyyy'),
                    r.quadra,
                    info.nome,
                    info.dosagem,
                    `${dias} dias`
                ];
            });

            doc.autoTable({
                head: [['Data Aplicação', 'Quadra', 'Acaricida Utilizado', 'Dosagem', 'Dias desde a aplicação']],
                body: dataToExport,
                startY: 30,
                theme: 'grid',
                headStyles: { fillColor: [239, 68, 68] },
                styles: { fontSize: 9, cellPadding: 3 }
            });
            doc.save(`relatorio-leprose-${format(new Date(), 'dd-MM-yyyy')}.pdf`);
        };

        return (
            <div className="premium-card glass" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', borderTop: '4px solid #ef4444' }}>
                <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text)', margin: 0 }}>
                        <div style={{ padding: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '10px' }}>
                            <Bug size={20} color="#ef4444" />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: '800' }}>Últimas Aplicações de Leprose</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>Monitoramento de carência de Acaricidas por Quadra</span>
                        </div>
                    </h4>
                    <button onClick={exportPDF} className="btn btn-secondary">
                        <div className="btn-inner">
                            <FileDown size={18} /> Exportar Relatório
                        </div>
                    </button>
                </div>

                <div className="table-responsive">
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
                        <thead style={{ backgroundColor: '#fafbfc' }}>
                            <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                <th style={{ padding: '1rem', fontWeight: '800' }}>Data Aplicação</th>
                                <th style={{ padding: '1rem', fontWeight: '800' }}>Quadra</th>
                                <th style={{ padding: '1rem', fontWeight: '800' }}>Acaricida Utilizado</th>
                                <th style={{ padding: '1rem', fontWeight: '800' }}>Dosagem</th>
                                <th style={{ padding: '1rem', fontWeight: '800' }}>Dias desde a aplicação</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tableData.length === 0 ? (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                                        <Bug size={48} style={{ opacity: 0.1, marginBottom: '1rem', display: 'block', margin: '0 auto' }} />
                                        Nenhuma aplicação de Leprose encontrada no histórico.
                                    </td>
                                </tr>
                            ) : (
                                tableData.map(r => {
                                    const info = getAcaricidaInfo(r.observacao);
                                    const dias = differenceInDays(new Date(), parseISO(r.data_inicial));
                                    const passouDoLimite = dias >= 160;

                                    return (
                                        <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: passouDoLimite ? 'rgba(239, 68, 68, 0.03)' : '#ffffff', transition: 'all 0.2s' }}>
                                            <td style={{ padding: '1.2rem 1rem', fontWeight: '700', color: 'var(--text)' }}>
                                                {format(parseISO(r.data_inicial), 'dd/MM/yyyy')}
                                            </td>
                                            <td style={{ padding: '1.2rem 1rem', fontWeight: '900', fontSize: '1.1rem', color: 'var(--text)' }}>
                                                {r.quadra}
                                            </td>
                                            <td style={{ padding: '1.2rem 1rem', color: 'var(--primary)', fontWeight: '800' }}>
                                                {info.nome}
                                            </td>
                                            <td style={{ padding: '1.2rem 1rem', fontWeight: '600', color: 'var(--text-muted)' }}>
                                                {info.dosagem}
                                            </td>
                                            <td style={{ padding: '1.2rem 1rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                                    <span style={{
                                                        padding: '0.4rem 0.8rem',
                                                        borderRadius: '8px',
                                                        backgroundColor: passouDoLimite ? '#fee2e2' : '#f1f5f9',
                                                        color: passouDoLimite ? '#ef4444' : 'var(--text-muted)',
                                                        fontWeight: '900',
                                                        fontSize: '0.85rem'
                                                    }}>
                                                        {dias} dias
                                                    </span>
                                                    {passouDoLimite && (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#ef4444', fontSize: '0.75rem', fontWeight: '800', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '4px 8px', borderRadius: '6px' }}>
                                                            <AlertTriangle size={14} /> Passou de 160 dias
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const renderRelatorioAtividade = () => {
        const recipes = ["Chuá", "Leprose", "Alternária", "Pinta Preta", "Aplicação de Winner", "Herbicida"];
        const classOptions = ['Todos', 'Inseticida', 'Acaricida', 'Fungicida', 'Bactericida', 'Fertilizante Foliar', 'Redutor de PH'];

        const latestByQA = {};
        normalRegistros.forEach(r => {
            if (!r.data_inicial) return; 
            if (actReportActivity !== 'Todos' && r.receita !== actReportActivity) return;

            const key = `${r.quadra}_${r.receita}`;
            if (!latestByQA[key] || new Date(r.data_inicial) > new Date(latestByQA[key].data_inicial)) {
                latestByQA[key] = r;
            }
        });

        const reportData = Object.values(latestByQA);

        const getInsumosFiltrados = (observacao, filterClass) => {
            if (!observacao) return [];
            let found = [];
            insumos.forEach(ins => {
                if (filterClass !== 'Todos' && (!ins.classificacao || !ins.classificacao.toLowerCase().includes(filterClass.toLowerCase()))) {
                    return; 
                }
                const safeInsumo = ins.insumo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const regex = new RegExp(`${safeInsumo}\\s*(?:\\(([^)]+)\\))?`, 'i');
                const match = observacao.match(regex);
                if (match) {
                    found.push(`${ins.insumo} ${match[1] ? `(${match[1]})` : ''}`.trim());
                }
            });
            return found;
        };

        const tableData = [];
        reportData.forEach(r => {
            const extracted = getInsumosFiltrados(r.observacao, actReportClass);
            if (actReportClass !== 'Todos' && extracted.length === 0) return;

            const insumoUtilizado = extracted.length > 0 ? extracted.join(', ') : (actReportClass === 'Todos' ? (r.observacao || '-') : '-');
            tableData.push({ ...r, insumoUtilizado });
        });

        tableData.sort((a, b) => a.quadra.localeCompare(b.quadra, undefined, { numeric: true }));

        const exportPDFAtividade = () => {
            const doc = new jsPDF();
            doc.text('Relatório por Atividade e Insumos', 14, 15);
            doc.setFontSize(10);
            doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 22);
            doc.text(`Filtros - Atividade: ${actReportActivity} | Classe: ${actReportClass}`, 14, 28);

            const dataToExport = tableData.map(r => {
                const dias = r.proxima_pulverizacao ? differenceInDays(parseISO(r.proxima_pulverizacao), new Date()) : null;
                const infoRestante = r.situacao === 'Iniciada' ? 'Em Andamento' : (dias !== null ? `${dias} d` : '-');

                return [
                    format(parseISO(r.data_inicial), 'dd/MM/yyyy'),
                    r.quadra,
                    r.proxima_pulverizacao ? format(parseISO(r.proxima_pulverizacao), 'dd/MM/yyyy') : '-',
                    r.receita,
                    r.insumoUtilizado,
                    infoRestante
                ];
            });

            doc.autoTable({
                head: [['Data Aplicação', 'Quadra', 'Próx. Pulverização', 'Atividade', 'Insumos', 'Restante']],
                body: dataToExport,
                startY: 35,
                theme: 'grid',
                headStyles: { fillColor: [25, 118, 210] },
                styles: { fontSize: 8, cellPadding: 3 }
            });
            doc.save(`relatorio-atividade-${format(new Date(), 'dd-MM-yyyy')}.pdf`);
        };

        return (
            <div className="premium-card glass" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', borderTop: '4px solid var(--primary)' }}>
                <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text)', margin: 0 }}>
                        <div style={{ padding: '0.5rem', background: 'rgba(25, 118, 210, 0.1)', borderRadius: '10px' }}>
                            <ListFilter size={20} color="var(--primary)" />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: '800' }}>Relatório Cruzado de Atividades</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>Exibindo a última pulverização por Quadra e Atividade</span>
                        </div>
                    </h4>
                    <button onClick={exportPDFAtividade} className="btn btn-secondary">
                        <div className="btn-inner">
                            <FileDown size={18} /> Exportar Relatório
                        </div>
                    </button>
                </div>

                <div className="no-print" style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flex: 1, minWidth: '300px' }}>
                        <div style={{ padding: '0.6rem', background: 'rgba(25, 118, 210, 0.1)', borderRadius: '10px', display: 'flex', alignItems: 'center' }}>
                            <Search size={18} color="var(--primary)" />
                        </div>
                        <select value={actReportActivity} onChange={(e) => setActReportActivity(e.target.value)} className="filter-select">
                            <option value="Todos">Todas Atividades</option>
                            {recipes.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                        <select value={actReportClass} onChange={(e) => setActReportClass(e.target.value)} className="filter-select">
                            {classOptions.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                </div>

                <div className="table-responsive">
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                        <thead style={{ backgroundColor: '#fafbfc' }}>
                            <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                <th style={{ padding: '1rem', fontWeight: '800' }}>Data Aplicação</th>
                                <th style={{ padding: '1rem', fontWeight: '800' }}>Quadra</th>
                                <th style={{ padding: '1rem', fontWeight: '800' }}>Próx. Pulverização</th>
                                <th style={{ padding: '1rem', fontWeight: '800' }}>Atividade</th>
                                <th style={{ padding: '1rem', fontWeight: '800' }}>Insumo Utilizado</th>
                                <th style={{ padding: '1rem', fontWeight: '800' }}>Dias Rest.</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tableData.length === 0 ? (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                                        <ListFilter size={48} style={{ opacity: 0.1, marginBottom: '1rem', display: 'block', margin: '0 auto' }} />
                                        Nenhum registro encontrado para os filtros selecionados.
                                    </td>
                                </tr>
                            ) : (
                                tableData.map(r => {
                                    const dias = r.proxima_pulverizacao ? differenceInDays(parseISO(r.proxima_pulverizacao), new Date()) : null;
                                    const isIniciada = r.situacao === 'Iniciada';
                                    const isAtrasado = !isIniciada && dias !== null && dias < 0;
                                    
                                    const rowBgColor = isIniciada ? 'rgba(251, 140, 0, 0.03)' : (isAtrasado ? 'rgba(239, 68, 68, 0.02)' : 'transparent');

                                    return (
                                        <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'all 0.2s', backgroundColor: rowBgColor }}>
                                            <td style={{ padding: '1.2rem 1rem', fontWeight: '700', color: 'var(--text)' }}>
                                                {format(parseISO(r.data_inicial), 'dd/MM/yyyy')}
                                            </td>
                                            <td style={{ padding: '1.2rem 1rem', fontWeight: '900', fontSize: '1.1rem', color: 'var(--text)' }}>
                                                {r.quadra}
                                            </td>
                                            <td style={{ padding: '1.2rem 1rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                                                {r.proxima_pulverizacao ? format(parseISO(r.proxima_pulverizacao), 'dd/MM/yyyy') : '-'}
                                            </td>
                                            <td style={{ padding: '1.2rem 1rem', color: 'var(--text)', fontWeight: '800' }}>
                                                {r.receita}
                                            </td>
                                            <td style={{ padding: '1.2rem 1rem', color: 'var(--primary)', fontWeight: '600', maxWidth: '250px' }}>
                                                {r.insumoUtilizado}
                                            </td>
                                            <td style={{ padding: '1.2rem 1rem' }}>
                                                {isIniciada ? (
                                                    <span style={{
                                                        padding: '0.4rem 0.8rem',
                                                        borderRadius: '8px',
                                                        backgroundColor: '#fff8e1',
                                                        color: '#f57f17',
                                                        fontWeight: '900',
                                                        fontSize: '0.85rem',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.4rem',
                                                        width: 'fit-content'
                                                    }}>
                                                        <Droplets size={14} /> Em Andamento
                                                    </span>
                                                ) : dias !== null ? (
                                                    <span style={{
                                                        padding: '0.4rem 0.8rem',
                                                        borderRadius: '8px',
                                                        backgroundColor: isAtrasado ? '#fee2e2' : '#e8f5e9',
                                                        color: isAtrasado ? '#ef4444' : '#2e7d32',
                                                        fontWeight: '900',
                                                        fontSize: '0.85rem'
                                                    }}>
                                                        {dias} dias
                                                    </span>
                                                ) : '-'}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const renderMapaManual = () => {
        const manualActivities = ['Adubação', 'Roçadeira', 'Desbrota', 'Lenha', 'Calcário', 'Gesso'];
        const needsProduct = ['Adubação', 'Calcário', 'Gesso'].includes(manualFilters.atividade);

        const currentActRecords = manualRegistros.filter(r => r.receita === manualFilters.atividade);
        
        const latestByQuadra = {};
        currentActRecords.forEach(r => {
            if (!latestByQuadra[r.quadra] || new Date(r.data_inicial) > new Date(latestByQuadra[r.quadra].data_inicial)) {
                latestByQuadra[r.quadra] = r;
            }
        });

        if (needsProduct && manualFilters.produto) {
            Object.keys(latestByQuadra).forEach(k => {
                try {
                    const meta = JSON.parse(latestByQuadra[k].observacao);
                    if (!meta.produto || !meta.produto.toLowerCase().includes(manualFilters.produto.toLowerCase())) {
                        delete latestByQuadra[k];
                    }
                } catch(e) {}
            });
        }

        const legendItems = {};
        Object.values(latestByQuadra).forEach(r => {
            try {
                const meta = JSON.parse(r.observacao);
                const label = needsProduct ? (meta.produto || r.receita) : r.receita;
                const key = `${meta.cor}_${label}`;
                if (!legendItems[key]) legendItems[key] = { cor: meta.cor, label: label };
            } catch(e) {}
        });

        const handleOpenForm = () => {
            if (!selectedMapQuadra) return alert('Selecione uma quadra no mapa primeiro!');
            const existing = latestByQuadra[selectedMapQuadra];
            if (existing) {
                try {
                    const meta = JSON.parse(existing.observacao);
                    setManualFormData({
                        id: existing.id, atividade: existing.receita, produto: meta.produto || '',
                        data: existing.data_inicial, cor: meta.cor || '#3b82f6', observacao: meta.obs || ''
                    });
                } catch(e) {}
            } else {
                setManualFormData({
                    id: null, atividade: manualFilters.atividade, produto: '',
                    data: format(new Date(), 'yyyy-MM-dd'), cor: '#3b82f6', observacao: ''
                });
            }
            setShowManualForm(true);
        };

        const handleSaveManual = async (e) => {
            e.preventDefault();
            const payload = {
                quadra: selectedMapQuadra,
                receita: manualFormData.atividade,
                data_inicial: manualFormData.data,
                situacao: 'MapaManual',
                observacao: JSON.stringify({
                    produto: needsProduct ? manualFormData.produto : '',
                    cor: manualFormData.cor,
                    obs: manualFormData.observacao
                }),
                quantidade_bombas: 0, pes_tratados: 0, dias_carencia: 0
            };

            setLoading(true);
            try {
                if (manualFormData.id) {
                    await registrosService.update(manualFormData.id, payload);
                } else {
                    await registrosService.create(payload);
                }
                setShowManualForm(false);
                fetchData();
            } catch(err) {
                alert('Erro: ' + err.message);
                setLoading(false);
            }
        };

        const handleDeleteManual = async () => {
            if (!selectedMapQuadra) return alert('Selecione uma quadra no mapa!');
            const existing = latestByQuadra[selectedMapQuadra];
            if (!existing) return alert('Esta quadra já está vazia!');
            if (window.confirm(`Tem certeza que deseja excluir a pintura da quadra ${selectedMapQuadra}?`)) {
                setLoading(true);
                await registrosService.delete(existing.id);
                setSelectedMapQuadra(null);
                fetchData();
            }
        };

        const currentTableRecords = currentActRecords.sort((a, b) => a.quadra.localeCompare(b.quadra, undefined, { numeric: true }));

        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div className="no-print" style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ padding: '0.6rem', background: 'rgba(25, 118, 210, 0.1)', borderRadius: '10px', display: 'flex', alignItems: 'center' }}>
                        <Map size={18} color="var(--primary)" />
                    </div>
                    <select value={manualFilters.atividade} onChange={(e) => {
                        setManualFilters({ atividade: e.target.value, produto: '' });
                        setSelectedMapQuadra(null);
                    }} className="filter-select">
                        {manualActivities.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                    {needsProduct && (
                        <input 
                            type="text" 
                            placeholder="Filtrar por Adubo/Produto..." 
                            value={manualFilters.produto} 
                            onChange={(e) => setManualFilters({ ...manualFilters, produto: e.target.value })} 
                            className="input-field" 
                            style={{ minWidth: '200px' }}
                        />
                    )}
                </div>

                {/* Área de Impressão (Mapa SVG NATIVO + Legenda) */}
                <div className="map-print-area" style={{ width: '100%', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid var(--border)', padding: '1rem', display: 'flex', flexDirection: 'column' }}>
                    <h2 className="print-only-title" style={{ display: 'none', textAlign: 'center', marginBottom: '2rem', color: '#000', fontFamily: 'Arial, sans-serif' }}>
                        Mapa de Operação: {manualFilters.atividade} {manualFilters.produto && ` - ${manualFilters.produto}`}
                    </h2>
                    
                    <div ref={mapContainerRef} style={{ flex: 1, minHeight: '75vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <svg id="fazenda-map-svg-manual" viewBox="0 0 522 646" style={{ width: '100%', height: '100%', maxHeight: '85vh' }}>
                            {QUADRAS_DATA.map((q) => {
                                const center = getPathCenter(q.id, q.d);
                                const label = formatQuadraLabel(q.id);
                                const reg = latestByQuadra[q.id];
                                let fillColor = '#f8fafc';
                                
                                if (reg) {
                                    try {
                                        const meta = JSON.parse(reg.observacao);
                                        fillColor = meta.cor || '#3b82f6';
                                    } catch(e) {}
                                }
                                
                                const isSelected = selectedMapQuadra === q.id;

                                return (
                                    <g key={q.id}>
                                        <path
                                            d={q.d}
                                            fill={fillColor}
                                            stroke={isSelected ? "#0f172a" : "#cbd5e1"}
                                            strokeWidth={isSelected ? "3" : "1"}
                                            onClick={() => setSelectedMapQuadra(q.id)}
                                            style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                                        />
                                        <text 
                                            x={center.x} 
                                            y={center.y + 4} 
                                            textAnchor="middle" 
                                            fill="#334155" 
                                            fontSize="11" 
                                            fontWeight="800" 
                                            pointerEvents="none"
                                            style={{ opacity: 0.8 }}
                                        >
                                            {label}
                                        </text>
                                    </g>
                                );
                            })}
                        </svg>
                    </div>
                    
                    <div className="print-legend" style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginTop: '2rem', padding: '1.5rem', borderTop: '2px solid #f1f5f9' }}>
                        <span style={{ fontWeight: '900', color: '#334155' }}>Legenda:</span>
                        {Object.values(legendItems).length === 0 ? (
                            <span style={{ color: 'var(--text-muted)' }}>Nenhum dado lançado para esta atividade.</span>
                        ) : (
                            Object.values(legendItems).map((l, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                    <div style={{ width: '20px', height: '20px', backgroundColor: l.cor, borderRadius: '6px', border: '2px solid #94a3b8' }}></div>
                                    <span style={{ fontSize: '1rem', fontWeight: 'bold', color: '#1e293b' }}>{l.label}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Botões Inferiores */}
                <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', padding: '1rem', backgroundColor: 'white', borderRadius: '12px', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', gap: '0.8rem' }}>
                        <button onClick={handleOpenForm} className="btn btn-primary">
                            <div className="btn-inner">
                                <Edit2 size={18} /> {selectedMapQuadra ? (latestByQuadra[selectedMapQuadra] ? 'Alterar Pintura' : 'Incluir Pintura') : 'Selecione uma Quadra...'}
                            </div>
                        </button>
                        <button onClick={handleDeleteManual} className="btn btn-outline" style={{ borderColor: '#ef4444', color: '#ef4444' }}>
                            <div className="btn-inner">
                                <Trash2 size={18} /> Limpar Quadra
                            </div>
                        </button>
                    </div>
                    <div style={{ display: 'flex', gap: '0.8rem' }}>
                        <button onClick={() => setShowManualRegistros(true)} className="btn btn-outline">
                            <div className="btn-inner">
                                <ClipboardList size={18} /> Ver Registros
                            </div>
                        </button>
                        <button onClick={() => window.print()} className="btn btn-secondary">
                            <div className="btn-inner">
                                <Printer size={18} /> Imprimir Mapa
                            </div>
                        </button>
                    </div>
                </div>

                {/* Modal Formulário */}
                {showManualForm && (
                    <div className="no-print" style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', zIndex: 3000, display: 'grid', placeItems: 'center', padding: '1rem' }}>
                        <div className="premium-card glass" style={{ width: '100%', maxWidth: '500px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h3 style={{ margin: 0, color: 'var(--primary)' }}>Quadra {selectedMapQuadra} - {manualFormData.atividade}</h3>
                                <button onClick={() => setShowManualForm(false)} className="btn btn-mini"><div className="btn-inner" style={{ padding: '0.4rem' }}><X size={20} /></div></button>
                            </div>
                            <form onSubmit={handleSaveManual} style={{ display: 'grid', gap: '1.2rem' }}>
                                {needsProduct && (
                                    <div className="form-group">
                                        <label>Nome do Produto/Adubo</label>
                                        <input type="text" value={manualFormData.produto} onChange={e => setManualFormData({...manualFormData, produto: e.target.value})} className="input-field" required placeholder="Ex: Ureia, Yoorin..." />
                                    </div>
                                )}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div className="form-group">
                                        <label>Data Finalizado</label>
                                        <input type="date" value={manualFormData.data} onChange={e => setManualFormData({...manualFormData, data: e.target.value})} className="input-field" required />
                                    </div>
                                    <div className="form-group">
                                        <label>Cor de Preenchimento</label>
                                        <input type="color" value={manualFormData.cor} onChange={e => setManualFormData({...manualFormData, cor: e.target.value})} style={{ width: '100%', height: '42px', padding: '0', border: 'none', borderRadius: '8px', cursor: 'pointer' }} />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Observação (Opcional)</label>
                                    <textarea value={manualFormData.observacao} onChange={e => setManualFormData({...manualFormData, observacao: e.target.value})} className="input-field" style={{ minHeight: '80px' }}></textarea>
                                </div>
                                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
                                    <div className="btn-inner"><CheckCircle size={20} /> Salvar no Mapa</div>
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* Modal Registros A-Z */}
                {showManualRegistros && (
                    <div className="no-print" style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', zIndex: 3000, display: 'grid', placeItems: 'center', padding: '1rem' }}>
                        <div className="premium-card glass" style={{ width: '100%', maxWidth: '800px', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h3 style={{ margin: 0, color: 'var(--primary)' }}>Histórico Completo - {manualFilters.atividade}</h3>
                                <button onClick={() => setShowManualRegistros(false)} className="btn btn-mini"><div className="btn-inner" style={{ padding: '0.4rem' }}><X size={20} /></div></button>
                            </div>
                            <div className="table-responsive" style={{ overflowY: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                                    <thead style={{ position: 'sticky', top: 0, backgroundColor: 'white' }}>
                                        <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                                            <th style={{ padding: '1rem' }}>Quadra</th>
                                            <th style={{ padding: '1rem' }}>Data</th>
                                            <th style={{ padding: '1rem' }}>Produto</th>
                                            <th style={{ padding: '1rem' }}>Observação</th>
                                            <th style={{ padding: '1rem' }}>Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentTableRecords.map(r => {
                                            let meta = {};
                                            try { meta = JSON.parse(r.observacao); } catch(e) {}
                                            return (
                                                <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                    <td style={{ padding: '1rem', fontWeight: 'bold' }}>{r.quadra}</td>
                                                    <td style={{ padding: '1rem' }}>{format(parseISO(r.data_inicial), 'dd/MM/yyyy')}</td>
                                                    <td style={{ padding: '1rem', color: 'var(--primary)', fontWeight: 'bold' }}>{meta.produto || '-'}</td>
                                                    <td style={{ padding: '1rem', fontSize: '0.85rem' }}>{meta.obs || '-'}</td>
                                                    <td style={{ padding: '1rem' }}>
                                                        <button onClick={async () => { if (confirm('Excluir?')) { await registrosService.delete(r.id); fetchData(); } }} className="btn btn-mini" style={{ color: '#ef4444' }}>
                                                            <div className="btn-inner" style={{ padding: '0.4rem' }}><Trash2 size={16} /></div>
                                                        </button>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <PageHeader title="Dashboard Estratégico" subtitle="Análise e indicadores de desempenho" logo={logo} />
            </div>

            {/* Submenu Tabs */}
            <div className="no-print" style={{ display: 'flex', gap: '0.8rem', paddingBottom: '0.8rem', marginBottom: '1.5rem', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                {[
                    { id: 'chuva', label: 'Chuva', icon: <Droplets size={18} /> },
                    { id: 'planejamento', label: 'Planejamento', icon: <ClipboardList size={18} /> },
                    { id: 'resumo', label: 'Resumo', icon: <FileSpreadsheet size={18} /> },
                    { id: 'mapa', label: 'Mapa Operacional', icon: <Layers size={18} /> },
                    { id: 'mapaManual', label: 'Mapa Manual (Livre)', icon: <Map size={18} /> },
                    { id: 'leprose', label: 'Relatório Leprose', icon: <Bug size={18} /> },
                    { id: 'relatorioAtividade', label: 'Relatório por Atividade', icon: <ListFilter size={18} /> },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={activeTab === tab.id ? 'selection-gradient' : ''}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                            padding: activeTab === tab.id ? '2.5px' : '0.75rem 1.25rem',
                            borderRadius: '14px', border: '1.5px solid var(--border)',
                            background: activeTab === tab.id ? 'transparent' : 'white',
                            color: activeTab === tab.id ? (tab.id === 'leprose' ? '#ef4444' : 'var(--text)') : 'var(--text-muted)',
                            cursor: 'pointer', fontWeight: '900',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            whiteSpace: 'nowrap', fontSize: '0.85rem'
                        }}
                    >
                        {activeTab === tab.id ? (
                            <div className="selection-gradient-inner" style={{ padding: '0.65rem 1.1rem', gap: '0.5rem', borderRadius: '12px' }}>
                                {tab.icon} {tab.label}
                            </div>
                        ) : (
                            <>{tab.icon} {tab.label}</>
                        )}
                    </button>
                ))}
            </div>

            {loading ? (
                <p className="no-print" style={{ textAlign: 'center', padding: '2rem' }}>Carregando dados...</p>
            ) : (
                <>
                    {activeTab === 'chuva' && renderChuva()}
                    {activeTab === 'planejamento' && renderPlanejamento()}
                    {activeTab === 'resumo' && renderResumo()}
                    {activeTab === 'mapa' && <div className="no-print"><InteractiveMap registros={normalRegistros} chuvas={chuvas} /></div>}
                    {activeTab === 'leprose' && renderLeprose()}
                    {activeTab === 'relatorioAtividade' && renderRelatorioAtividade()}
                    {activeTab === 'mapaManual' && renderMapaManual()}
                </>
            )}

            <style>{`
        .filter-select { padding: 0.5rem; border-radius: 8px; border: 1px solid var(--border); background: white; font-weight: 600; }
        .input-field { padding: 0.5rem; border-radius: 8px; border: 1px solid var(--border); }
        
        @media print {
            @page { size: landscape; margin: 10mm; }
            body { background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            body * { visibility: hidden; }
            .map-print-area, .map-print-area * { visibility: visible; }
            .map-print-area { 
                position: absolute; 
                top: 0; 
                left: 0; 
                width: 100vw; 
                height: 100vh; 
                padding: 0 !important; 
                margin: 0 !important; 
                border: none !important; 
                display: flex !important; 
                flex-direction: column !important; 
                justify-content: center !important;
                align-items: center !important;
            }
            .print-only-title { 
                display: block !important; 
                text-align: center !important; 
                margin-bottom: 10px !important; 
                font-size: 24px !important; 
                color: black !important;
            }
            .print-legend { 
                position: relative !important; 
                justify-content: center !important; 
                border-top: none !important; 
                padding: 10px !important; 
                margin-top: 10px !important; 
            }
            #fazenda-map-svg-manual {
                height: 80vh !important;
                width: auto !important;
            }
        }
      `}</style>
        </div>
    );
}
