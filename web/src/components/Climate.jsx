import React, { useState, useEffect } from 'react';
import { chuvasService } from '../lib/services';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import {
    CloudRain,
    Sun,
    Cloud,
    Thermometer,
    Droplets,
    Wind,
    Plus,
    Trash2,
    Calendar as CalendarIcon,
    Wind as AirIcon,
    FileDown
} from 'lucide-react';
import { format, parseISO, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const API_KEY = "29f247c5a06de34f0992ec03ba8f0a12";
const CIDADE = "Bariri, São Paulo, BR";

export default function Climate() {
    const [forecast, setForecast] = useState([]);
    const [chuvas, setChuvas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddChuva, setShowAddChuva] = useState(false);
    const [newChuva, setNewChuva] = useState({
        data: format(new Date(), 'yyyy-MM-dd'),
        local: 'Pluviômetro Portaria',
        mm: ''
    });

    const locais = ["Pluviômetro Quadra 17", "Pluviômetro Murcote", "Pluviômetro Piscinao", "Pluviômetro Portaria"];

    useEffect(() => {
        fetchWeather();
        loadChuvas();
    }, []);

    const fetchWeather = async () => {
        try {
            const response = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${CIDADE}&appid=${API_KEY}&units=metric&lang=pt_br`);
            const data = await response.json();

            // Process daily forecast
            const daily = {};
            data.list.forEach(item => {
                const date = item.dt_txt.split(' ')[0];
                if (!daily[date]) {
                    daily[date] = {
                        temp_max: item.main.temp_max,
                        temp_min: item.main.temp_min,
                        description: item.weather[0].description,
                        icon: item.weather[0].main,
                        humidity: item.main.humidity,
                        wind: item.wind.speed * 3.6,
                        pop: item.pop * 100
                    };
                } else {
                    daily[date].temp_max = Math.max(daily[date].temp_max, item.main.temp_max);
                    daily[date].temp_min = Math.min(daily[date].temp_min, item.main.temp_min);
                }
            });
            setForecast(Object.entries(daily).slice(0, 5));
        } catch (error) {
            console.error('Error fetching weather:', error);
        }
    };

    const loadChuvas = async () => {
        try {
            const data = await chuvasService.getAll();
            setChuvas(data);
        } catch (error) {
            console.error('Error loading chuvas:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddChuva = async (e) => {
        e.preventDefault();
        try {
            await chuvasService.create({ ...newChuva, mm: parseFloat(newChuva.mm) });
            setNewChuva({ data: format(new Date(), 'yyyy-MM-dd'), local: 'Pluviômetro Portaria', mm: '' });
            setShowAddChuva(false);
            loadChuvas();
        } catch (error) {
            alert('Erro ao salvar chuva');
        }
    };

    const handleDeleteChuva = async (id) => {
        if (window.confirm('Excluir este registro?')) {
            await chuvasService.delete(id);
            loadChuvas();
        }
    };

    const getWeatherIcon = (main) => {
        switch (main) {
            case 'Clear': return <Sun color="#FFC107" size={32} />;
            case 'Rain': return <CloudRain color="#42A5F5" size={32} />;
            case 'Clouds': return <Cloud color="#90A4AE" size={32} />;
            default: return <Sun color="#FFC107" size={32} />;
        }
    };

    const exportToPDF = () => {
        const doc = new jsPDF();
        doc.text('Relatório de Precipitação - AgroControl', 14, 15);

        const tableData = chuvas.map(c => [
            format(parseISO(c.data), 'dd/MM/yyyy'),
            c.local,
            `${c.mm} mm`
        ]);

        doc.autoTable({
            head: [['Data', 'Local', 'Milímetros (mm)']],
            body: tableData,
            startY: 25,
            theme: 'grid'
        });

        doc.save(`relatorio-chuvas-${format(new Date(), 'dd-MM-yyyy')}.pdf`);
    };

    return (
        <div className="premium-card glass" style={{ border: 'none', boxShadow: 'none', background: 'transparent', padding: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
                    <div style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '18px',
                        background: 'var(--primary-gradient)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 8px 15px rgba(46, 125, 50, 0.2)'
                    }}>
                        <CloudRain color="white" size={28} />
                    </div>
                    <div>
                        <h2 style={{ color: 'var(--text)', fontWeight: '900', letterSpacing: '-0.8px', fontFamily: 'var(--font-display)', fontSize: '1.8rem' }}>Previsão e Clima</h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600' }}>Monitoramento meteorológico em tempo real</p>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontWeight: '700', fontSize: '0.85rem' }}>
                    <Sun size={18} color="#fb8c00" /> {CIDADE}
                </div>
            </div>

            <div style={{ marginBottom: '3.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
                    {forecast.map(([date, data]) => {
                        const isToday = isSameDay(parseISO(date), new Date());
                        return (
                            <div key={date} className="premium-card glass" style={{
                                textAlign: 'center',
                                padding: isToday ? '1.2rem' : '1rem',
                                border: isToday ? '2px solid var(--primary)' : '1px solid var(--border)',
                                background: isToday ? 'white' : 'rgba(255,255,255,0.6)',
                                transform: isToday ? 'scale(1.02)' : 'none',
                                zIndex: isToday ? 2 : 1
                            }}>
                                <p style={{ fontWeight: '800', fontSize: '0.65rem', color: isToday ? 'var(--primary)' : 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.8rem', letterSpacing: '0.5px' }}>
                                    {isToday ? 'Hoje' : format(parseISO(date), 'eee, dd/MM', { locale: ptBR })}
                                </p>
                                <div style={{ margin: '0.8rem 0' }}>{getWeatherIcon(data.icon)}</div>
                                <p style={{ fontSize: '1.4rem', fontWeight: '900', fontFamily: 'var(--font-display)', color: 'var(--text)', marginBottom: '0.2rem' }}>{Math.round(data.temp_max)}°</p>
                                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'capitalize' }}>{data.description}</p>

                                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                                        <Droplets size={12} color="#3b82f6" />
                                        <span style={{ fontSize: '0.65rem', fontWeight: '800' }}>{Math.round(data.pop)}%</span>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                                        <Wind size={12} color="var(--text-muted)" />
                                        <span style={{ fontSize: '0.65rem', fontWeight: '800' }}>{Math.round(data.wind)}<span style={{ fontSize: '0.55rem', opacity: 0.6 }}>km/h</span></span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ color: 'var(--text)', fontWeight: '900', letterSpacing: '-0.5px' }}>📋 Registros de Chuva</h2>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button onClick={exportToPDF} className="action-btn">
                            <FileDown size={18} /> Exportar PDF
                        </button>
                        <button onClick={() => setShowAddChuva(!showAddChuva)} className="btn btn-secondary">
                            {showAddChuva ? <X size={20} /> : <Plus size={20} />}
                            {showAddChuva ? 'Cancelar' : 'Registrar Chuva'}
                        </button>
                    </div>
                </div>

                {showAddChuva && (
                    <div className="premium-card" style={{ marginBottom: '1.5rem' }}>
                        <form onSubmit={handleAddChuva} style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end' }}>
                            <div style={{ flex: 1, minWidth: '150px' }}>
                                <label style={{ fontSize: '0.8rem', fontWeight: '600' }}>Data</label>
                                <input type="date" value={newChuva.data} onChange={e => setNewChuva({ ...newChuva, data: e.target.value })} className="input-field" required />
                            </div>
                            <div style={{ flex: 2, minWidth: '200px' }}>
                                <label style={{ fontSize: '0.8rem', fontWeight: '600' }}>Pluviômetro</label>
                                <select value={newChuva.local} onChange={e => setNewChuva({ ...newChuva, local: e.target.value })} className="input-field" required>
                                    {locais.map(l => <option key={l} value={l}>{l}</option>)}
                                </select>
                            </div>
                            <div style={{ flex: 1, minWidth: '100px' }}>
                                <label style={{ fontSize: '0.8rem', fontWeight: '600' }}>Milímetros (mm)</label>
                                <input type="number" step="0.1" value={newChuva.mm} onChange={e => setNewChuva({ ...newChuva, mm: e.target.value })} className="input-field" required />
                            </div>
                            <button type="submit" className="btn btn-primary">Salvar</button>
                        </form>
                    </div>
                )}

                <div className="premium-card">
                    <div className="table-responsive">
                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--border)' }}>
                                    <th style={{ padding: '0.75rem' }}>Data</th>
                                    <th style={{ padding: '0.75rem' }}>Local</th>
                                    <th style={{ padding: '0.75rem' }}>mm</th>
                                    <th style={{ padding: '0.75rem' }}>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {chuvas.slice(0, 10).map(c => (
                                    <tr key={c.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ padding: '0.75rem' }}>{format(parseISO(c.data), 'dd/MM/yyyy')}</td>
                                        <td style={{ padding: '0.75rem' }}>{c.local}</td>
                                        <td style={{ padding: '0.75rem', fontWeight: '700', color: 'var(--secondary)' }}>{c.mm} mm</td>
                                        <td style={{ padding: '0.75rem' }}>
                                            <button onClick={() => handleDeleteChuva(c.id)} className="action-btn" style={{ color: '#ef5350' }}><Trash2 size={16} /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <style>{`
        .input-field {
          width: 100%;
          padding: 0.6rem;
          border-radius: 8px;
          border: 1px solid var(--border);
          outline: none;
        }
        .action-btn {
          background: #f5f5f5;
          border: 1px solid var(--border);
          border-radius: 6px;
          padding: 0.4rem;
          cursor: pointer;
        }
      `}</style>
        </div >
    );
}
