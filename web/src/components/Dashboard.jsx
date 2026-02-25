import React, { useState, useEffect } from 'react';
import { registrosService, chuvasService } from '../lib/services';
import PageHeader from './PageHeader';
import InteractiveMap from './InteractiveMap';
import {
    BarChart3,
    TrendingUp,
    Droplets,
    Layers,
    Calendar as CalendarIcon,
    CloudRain,
    ClipboardList,
    FileSpreadsheet,
    Plus,
    Trash2,
    Printer,
    ChevronRight,
    ChevronLeft,
    Sun,
    Cloud,
    AirVent,
    Clock,
    CheckCircle,
    FileDown,
    Search,
    X
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
import { Bar, Pie } from 'react-chartjs-2';
import {
    format,
    parseISO,
    startOfMonth,
    endOfMonth,
    eachMonthOfInterval,
    subMonths,
    startOfWeek,
    endOfWeek,
    addDays,
    subDays,
    isWithinInterval,
    differenceInDays,
    isSameDay
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Title, Tooltip, Legend);

const API_KEY = "29f247c5a06de34f0992ec03ba8f0a12";
const CIDADE = "Bariri, São Paulo, BR";

export default function Dashboard({ logo }) {
    const [activeTab, setActiveTab] = useState('chuva'); // chuva, planejamento, resumo, mapa
    const [registros, setRegistros] = useState([]);
    const [chuvas, setChuvas] = useState([]);
    const [forecast, setForecast] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters for Planejamento
    const [filterActivity, setFilterActivity] = useState('Todos');
    const [showWeekly, setShowWeekly] = useState(false);

    // Filters for Resumo
    const [summaryFilters, setSummaryFilters] = useState({ quadra: 'Todos', receita: 'Todos' });
    const [summaryStartDate, setSummaryStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
    const [summaryEndDate, setSummaryEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));

    // Period Filter for Chuva Chart
    const [rainStartDate, setRainStartDate] = useState(format(subMonths(new Date(), 1), 'yyyy-MM-dd'));
    const [rainEndDate, setRainEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));

    // Rain Form State
    const [showRainForm, setShowRainForm] = useState(false);
    const [rainFormData, setRainFormData] = useState({
        data: format(new Date(), 'yyyy-MM-dd'),
        mm: '',
        local: 'Sede'
    });

    useEffect(() => {
        fetchData();
        fetchWeather();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [regData, rainData] = await Promise.all([
                registrosService.getAll(),
                chuvasService.getAll()
            ]);
            setRegistros(regData);
            setChuvas(rainData);
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

    // --- Helpers for Summary Logic ---
    const calculateDelay = (reg) => {
        if (reg.situacao !== 'Finalizada' || !reg.data_inicial) return '-';
        // Find previous record for same block/recipe
        const history = registros
            .filter(r => r.quadra === reg.quadra && r.receita === reg.receita && r.id !== reg.id)
            .sort((a, b) => new Date(b.data_inicial) - new Date(a.data_inicial));

        // Find the closest one BEFORE this one's data_inicial
        const prev = history.find(r => new Date(r.data_inicial) < new Date(reg.data_inicial));
        if (!prev || !prev.proxima_pulverizacao) return 'Primeira';

        const scheduledDate = parseISO(prev.proxima_pulverizacao);
        const actualDate = parseISO(reg.data_inicial);
        const diff = differenceInDays(actualDate, scheduledDate);

        if (diff === 0) return 'No prazo';
        if (diff > 0) return `${diff} dias de atraso`;
        return `${Math.abs(diff)} dias adiantado`;
    };

    // --- Sub-Tab Renderers ---

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

        // Aggregate by month
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
                {/* Weather Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem' }}>
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

                {/* Rain Entry Button */}
                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                    <button onClick={() => setShowRainForm(!showRainForm)} className="btn btn-primary">
                        <div className="btn-inner">
                            {showRainForm ? <X size={18} /> : <Plus size={18} />}
                            {showRainForm ? 'Cancelar' : 'Inserir Chuva'}
                        </div>
                    </button>
                </div>

                {showRainForm && (
                    <div className="premium-card glass" style={{ maxWidth: '600px' }}>
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

                {/* Chart and Table */}
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
                        <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2rem' }}>
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
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: {
                                            legend: { display: false },
                                            tooltip: {
                                                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                                                titleFont: { family: 'var(--font-main)', size: 14, weight: 'bold' },
                                                bodyFont: { family: 'var(--font-main)', size: 13 },
                                                padding: 12,
                                                cornerRadius: 12,
                                                displayColors: false
                                            }
                                        },
                                        scales: {
                                            y: { grid: { display: true, color: 'rgba(0,0,0,0.03)' }, ticks: { font: { family: 'var(--font-main)', weight: '600' } } },
                                            x: { grid: { display: false }, ticks: { font: { family: 'var(--font-main)', weight: '600' } } }
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
                                        <th style={{ padding: '0.75rem' }}>Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {chuvas.map(c => (
                                        <tr key={c.id} style={{ borderBottom: '1px solid #f5f5f5', fontSize: '0.85rem' }}>
                                            <td style={{ padding: '0.75rem' }}>{format(parseISO(c.data), 'dd/MM/yyyy')}</td>
                                            <td style={{ padding: '0.75rem' }}>{c.local}</td>
                                            <td style={{ padding: '0.75rem', fontWeight: 'bold', color: '#1976d2' }}>{c.mm} mm</td>
                                            <td style={{ padding: '0.75rem' }}>
                                                <button
                                                    onClick={async () => { if (confirm('Excluir?')) { await chuvasService.delete(c.id); fetchData(); } }}
                                                    className="btn btn-mini"
                                                    style={{ color: '#ef5350' }}
                                                    title="Excluir"
                                                >
                                                    <div className="btn-inner" style={{ padding: '0.4rem' }}>
                                                        <Trash2 size={16} />
                                                    </div>
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
        // Week Logic: Mon-Fri + previous Sat/Sun
        const today = new Date();
        const mon = startOfWeek(today, { weekStartsOn: 1 });
        const fri = addDays(mon, 4);
        const prevSat = subDays(mon, 2);

        // Show PROXIMA PULVERIZACAO from Finalizada records that HAVE NO SUCCESSOR
        let upcoming = registros.filter(r => {
            if (r.situacao !== 'Finalizada' || !r.proxima_pulverizacao) return false;

            // Successor check: any record that started AFTER this one's data_inicial
            const hasSuccessor = registros.some(succ =>
                succ.quadra === r.quadra &&
                succ.receita === r.receita &&
                new Date(succ.data_inicial) > new Date(r.data_inicial)
            );
            return !hasSuccessor;
        });

        if (showWeekly) {
            upcoming = upcoming.filter(r => {
                const d = parseISO(r.proxima_pulverizacao);
                return isWithinInterval(d, { start: prevSat, end: fri });
            });
        }

        if (filterActivity !== 'Todos') {
            upcoming = upcoming.filter(r => r.receita === filterActivity);
        }

        const recipes = ["Chuá", "Leprose", "Alternária", "Pinta Preta", "Aplicação de Winner", "Herbicida"];

        const ongoing = registros.filter(r => r.situacao === 'Iniciada').sort((a, b) => new Date(a.data_inicial) - new Date(b.data_inicial));

        const exportPDF = () => {
            const doc = new jsPDF();
            doc.text('Planejamento de Pulverização', 14, 15);

            // Ongoing section
            if (ongoing.length > 0) {
                doc.setFontSize(14);
                doc.text('Em Andamento', 14, 25);
                doc.autoTable({
                    head: [['Início', 'Quadra', 'Atividade', 'Obs', 'Bombas']],
                    body: ongoing.map(r => [format(parseISO(r.data_inicial), 'dd/MM/yyyy'), r.quadra, r.receita, r.observacao || '', r.quantidade_bombas || '']),
                    startY: 30
                });
            }

            const nextY = ongoing.length > 0 ? doc.lastAutoTable.finalY + 15 : 25;
            doc.setFontSize(14);
            doc.text('Próximas Pulverizações', 14, nextY);

            const data = upcoming.map(r => [
                format(parseISO(r.proxima_pulverizacao), 'dd/MM/yyyy'),
                r.quadra,
                r.receita,
                r.observacao || '',
                r.quantidade_bombas || '',
                r.pes_tratados || '',
                `${differenceInDays(parseISO(r.proxima_pulverizacao), new Date())} d`
            ]);
            doc.autoTable({
                head: [['Vencimento', 'Quadra', 'Atividade', 'Obs', 'Bombas', 'Pés', 'Restante']],
                body: data,
                startY: nextY + 5
            });
            doc.save('planejamento.pdf');
        };

        return (
            <div className="premium-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <select value={filterActivity} onChange={e => setFilterActivity(e.target.value)} className="filter-select">
                            <option value="Todos">Todas Atividades</option>
                            {recipes.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                        <button
                            onClick={() => setShowWeekly(!showWeekly)}
                            className="btn btn-outline"
                            style={{ height: '38px', minWidth: '160px' }}
                        >
                            <div className="btn-inner" style={{ background: showWeekly ? 'var(--secondary)' : 'white', color: showWeekly ? 'white' : 'black', padding: '0 1rem' }}>
                                <Clock size={16} /> Nesta Semana
                            </div>
                        </button>
                    </div>
                    <button onClick={exportPDF} className="btn btn-secondary" style={{ marginBottom: '1.5rem' }}>
                        <div className="btn-inner">
                            <FileDown size={18} /> Exportar PDF (Planejamento)
                        </div>
                    </button>
                </div>

                {/* --- Ongoing Table --- */}
                {ongoing.length > 0 && (
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
                )}

                <h4 style={{ marginBottom: '1.2rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <CalendarIcon size={20} /> Próximas Pulverizações
                </h4>
                <div className="table-responsive">
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                                <th style={{ padding: '0.75rem' }}>Próxima</th>
                                <th style={{ padding: '0.75rem' }}>Quadra</th>
                                <th style={{ padding: '0.75rem' }}>Atividade</th>
                                <th style={{ padding: '0.75rem' }}>Obs</th>
                                <th style={{ padding: '0.75rem' }}>Bombas</th>
                                <th style={{ padding: '0.75rem' }}>Dias Rest.</th>
                            </tr>
                        </thead>
                        <tbody>
                            {upcoming.map(r => (
                                <tr key={r.id} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '0.75rem' }}>{format(parseISO(r.proxima_pulverizacao), 'dd/MM/yyyy')}</td>
                                    <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>{r.quadra}</td>
                                    <td style={{ padding: '0.75rem' }}>{r.receita}</td>
                                    <td style={{ padding: '0.75rem', fontSize: '0.8rem', maxWidth: '200px' }}>{r.observacao}</td>
                                    <td style={{ padding: '0.75rem' }}>{r.quantidade_bombas}</td>
                                    <td style={{ padding: '0.75rem' }}>
                                        <span style={{
                                            padding: '0.2rem 0.5rem',
                                            borderRadius: '4px',
                                            backgroundColor: differenceInDays(parseISO(r.proxima_pulverizacao), new Date()) < 0 ? '#ffebee' : '#e8f5e9',
                                            color: differenceInDays(parseISO(r.proxima_pulverizacao), new Date()) < 0 ? '#c62828' : '#2e7d32',
                                            fontWeight: 'bold'
                                        }}>
                                            {differenceInDays(parseISO(r.proxima_pulverizacao), new Date())} d
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const renderResumo = () => {
        const activityTotals = {};
        registros.forEach(r => {
            activityTotals[r.receita] = (activityTotals[r.receita] || 0) + (parseInt(r.quantidade_bombas) || 0);
        });

        const finalizadas = registros.filter(r =>
            r.situacao === 'Finalizada' &&
            (summaryFilters.quadra === 'Todos' || r.quadra === summaryFilters.quadra) &&
            (summaryFilters.receita === 'Todos' || r.receita === summaryFilters.receita) &&
            r.data_final && isWithinInterval(parseISO(r.data_final), { start: parseISO(summaryStartDate), end: parseISO(summaryEndDate) })
        ).sort((a, b) => new Date(b.data_final) - new Date(a.data_final));

        const concluídasHist = registros.filter(r =>
            (summaryFilters.quadra === 'Todos' || r.quadra === summaryFilters.quadra) &&
            (summaryFilters.receita === 'Todos' || r.receita === summaryFilters.receita) &&
            isWithinInterval(parseISO(r.data_inicial), { start: parseISO(summaryStartDate), end: parseISO(summaryEndDate) })
        ).sort((a, b) => new Date(b.data_inicial) - new Date(a.data_inicial));

        const blocks = ["001", "002", "003", "004", "005A", "005B", "005C", "006A", "006B", "007", "008", "009", "010", "011", "012", "013", "014", "015", "016", "017", "018", "019", "020", "021", "022", "024", "026", "027", "028", "029", "030", "031", "032", "033", "034"];
        const recipes = ["Chuá", "Leprose", "Alternária", "Pinta Preta", "Aplicação de Winner", "Herbicida"];

        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {/* Total Bombas Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    {Object.entries(activityTotals).map(([act, total]) => (
                        <div key={act} className="premium-card" style={{ borderLeft: '4px solid var(--secondary)' }}>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{act}</p>
                            <h3 style={{ fontSize: '1.4rem', fontWeight: '800' }}>{total} <span style={{ fontSize: '0.9rem', fontWeight: 'normal' }}>Bombas</span></h3>
                        </div>
                    ))}
                </div>

                <div className="premium-card glass" style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
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
                    <h4 style={{ marginBottom: '1.5rem' }}>Histórico de Desempenho (Atrasos)</h4>
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
                                {finalizadas.slice(0, 15).map(r => {
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

                <div className="premium-card">
                    <h4 style={{ marginBottom: '1.5rem' }}>Todas Pulverizações</h4>
                    <div className="table-responsive">
                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '500px' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                                    <th style={{ padding: '0.75rem' }}>Data</th>
                                    <th style={{ padding: '0.75rem' }}>Quadra</th>
                                    <th style={{ padding: '0.75rem' }}>Atividade</th>
                                    <th style={{ padding: '0.75rem' }}>Bombas</th>
                                </tr>
                            </thead>
                            <tbody>
                                {concluídasHist.slice(0, 10).map(r => (
                                    <tr key={r.id} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={{ padding: '0.75rem' }}>{format(parseISO(r.data_inicial), 'dd/MM/yyyy')}</td>
                                        <td style={{ padding: '0.75rem' }}>{r.quadra}</td>
                                        <td style={{ padding: '0.75rem' }}>{r.receita}</td>
                                        <td style={{ padding: '0.75rem' }}>{r.quantidade_bombas}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <PageHeader title="Dashboard Estratégico" subtitle="Análise e indicadores de desempenho" logo={logo} />
            </div>

            {/* Submenu Tabs */}
            <div style={{ display: 'flex', gap: '0.8rem', paddingBottom: '0.8rem', marginBottom: '1.5rem', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                {[
                    { id: 'chuva', label: 'Chuva', icon: <Droplets size={18} /> },
                    { id: 'planejamento', label: 'Planejamento', icon: <ClipboardList size={18} /> },
                    { id: 'resumo', label: 'Resumo', icon: <FileSpreadsheet size={18} /> },
                    { id: 'mapa', label: 'Mapa Interativo', icon: <Layers size={18} /> },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={activeTab === tab.id ? 'selection-gradient' : ''}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: activeTab === tab.id ? '2.5px' : '0.75rem 1.25rem',
                            borderRadius: '14px',
                            border: '1.5px solid var(--border)',
                            background: activeTab === tab.id ? 'transparent' : 'white',
                            color: activeTab === tab.id ? 'var(--text)' : 'var(--text-muted)',
                            cursor: 'pointer',
                            fontWeight: '900',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            whiteSpace: 'nowrap',
                            fontSize: '0.85rem'
                        }}
                    >
                        {activeTab === tab.id ? (
                            <div className="selection-gradient-inner" style={{ padding: '0.65rem 1.1rem', gap: '0.5rem', borderRadius: '12px' }}>
                                {tab.icon}
                                {tab.label}
                            </div>
                        ) : (
                            <>
                                {tab.icon}
                                {tab.label}
                            </>
                        )}
                    </button>
                ))}
            </div>

            {loading ? (
                <p style={{ textAlign: 'center', padding: '2rem' }}>Carregando dados...</p>
            ) : (
                <>
                    {activeTab === 'chuva' && renderChuva()}
                    {activeTab === 'planejamento' && renderPlanejamento()}
                    {activeTab === 'resumo' && renderResumo()}
                    {activeTab === 'mapa' && <InteractiveMap registros={registros} chuvas={chuvas} />}
                </>
            )}

            <style>{`
        .filter-select {
          padding: 0.5rem;
          border-radius: 8px;
          border: 1px solid var(--border);
          background: white;
          font-weight: 600;
        }
        .input-field {
          padding: 0.5rem;
          border-radius: 8px;
          border: 1px solid var(--border);
        }
      `}</style>
        </div>
    );
}
