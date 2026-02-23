import React, { useState, useEffect } from 'react';
import { registrosService } from '../lib/services';
import {
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    Clock,
    CheckCircle,
    AlertCircle,
    Info,
    Layers
} from 'lucide-react';
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths,
    parseISO
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function SprayingCalendar() {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [registros, setRegistros] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('Todos');

    const recipes = ["Chuá", "Leprose", "Alternária", "Pinta Preta", "Aplicação de Winner", "Herbicida"];

    useEffect(() => {
        loadRegistros();
    }, []);

    const loadRegistros = async () => {
        try {
            const data = await registrosService.getAll();
            setRegistros(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const renderHeader = () => {
        return (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <h3 style={{ textTransform: 'capitalize', fontWeight: '800', fontFamily: 'var(--font-display)', color: 'var(--primary)' }}>
                        {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
                    </h3>
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        style={{ padding: '0.6rem', borderRadius: '12px', border: '1px solid var(--border)', fontSize: '0.85rem', fontWeight: '600' }}
                    >
                        <option value="Todos">Todas Atividades</option>
                        {recipes.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="action-btn"><ChevronLeft size={18} /></button>
                    <button onClick={() => setCurrentMonth(new Date())} className="action-btn" style={{ fontSize: '0.85rem', fontWeight: '700' }}>Hoje</button>
                    <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="action-btn"><ChevronRight size={18} /></button>
                </div>
            </div>
        );
    };

    const renderDays = () => {
        const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        return (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: '1rem' }}>
                {days.map(day => (
                    <div key={day} style={{ textAlign: 'center', fontWeight: '800', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        {day}
                    </div>
                ))}
            </div>
        );
    };

    const getDayEvents = (day) => {
        const filteredRecords = registros.filter(r => selectedCategory === 'Todos' || r.receita === selectedCategory);
        const dayEvents = [];

        filteredRecords.forEach(r => {
            if (r.situacao === 'Iniciada' && r.data_inicial && isSameDay(parseISO(r.data_inicial), day)) {
                dayEvents.push({ ...r, type: 'iniciada' });
            }
            if (r.situacao === 'Finalizada' && r.proxima_pulverizacao && isSameDay(parseISO(r.proxima_pulverizacao), day)) {
                const hasSuccessor = registros.some(succ =>
                    succ.quadra === r.quadra &&
                    succ.receita === r.receita &&
                    new Date(succ.data_inicial) > new Date(r.data_inicial)
                );

                if (!hasSuccessor) {
                    dayEvents.push({ ...r, type: 'proxima' });
                }
            }
        });
        return dayEvents;
    };

    const renderCells = () => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart);
        const endDate = endOfWeek(monthEnd);

        const days = eachDayOfInterval({ start: startDate, end: endDate });

        return (
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: '12px',
                padding: '4px'
            }}>
                {days.map(day => {
                    const formattedDate = format(day, 'yyyy-MM-dd');
                    const dayEvents = getDayEvents(day);
                    const isToday = isSameDay(day, new Date());
                    const isSelected = isSameDay(day, selectedDate);
                    const isCurrentMonth = isSameMonth(day, monthStart);

                    const startedCount = dayEvents.filter(e => e.type === 'iniciada').length;
                    const nextCount = dayEvents.filter(e => e.type === 'proxima').length;

                    return (
                        <div
                            key={formattedDate}
                            onClick={() => setSelectedDate(day)}
                            className={`premium-card glass cell-calendar ${isSelected ? 'selected' : ''}`}
                            style={{
                                cursor: 'pointer',
                                minHeight: window.innerWidth < 768 ? '70px' : '90px',
                                backgroundColor: isCurrentMonth ? 'white' : 'rgba(0,0,0,0.02)',
                                opacity: isCurrentMonth ? 1 : 0.4,
                                padding: '0.6rem',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.4rem',
                                border: isSelected ? '2px solid var(--primary)' : (isToday ? '2px solid rgba(46, 125, 50, 0.3)' : '1px solid var(--border)'),
                                boxShadow: isSelected ? '0 10px 20px rgba(46, 125, 50, 0.15)' : 'var(--shadow-sm)',
                                position: 'relative',
                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                transform: isSelected ? 'scale(1.02)' : 'none',
                                zIndex: isSelected ? 2 : 1
                            }}
                        >
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '2px'
                            }}>
                                <span style={{
                                    fontSize: '0.95rem',
                                    fontWeight: '800',
                                    fontFamily: 'var(--font-display)',
                                    color: isSelected || isToday ? 'var(--primary)' : 'var(--text)',
                                }}>
                                    {format(day, 'd')}
                                </span>
                            </div>

                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', marginTop: 'auto' }}>
                                {startedCount > 0 && (
                                    <div style={{
                                        display: 'flex', alignItems: 'center', gap: '3px',
                                        padding: '2px 6px', borderRadius: '6px',
                                        background: 'var(--primary-gradient)', color: 'white',
                                        fontSize: '0.55rem', fontWeight: '800'
                                    }}>
                                        <Clock size={8} /> {startedCount}
                                    </div>
                                )}
                                {nextCount > 0 && (
                                    <div style={{
                                        display: 'flex', alignItems: 'center', gap: '3px',
                                        padding: '2px 6px', borderRadius: '6px',
                                        background: 'var(--secondary-gradient)', color: 'white',
                                        fontSize: '0.55rem', fontWeight: '800'
                                    }}>
                                        <AlertCircle size={8} /> {nextCount}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    const renderDetailTable = () => {
        const selectedEvents = getDayEvents(selectedDate);

        return (
            <div className="premium-card glass" style={{ marginTop: '2rem', animation: 'fadeIn 0.3s ease-out', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                        <div style={{ padding: '0.5rem', background: 'rgba(46, 125, 50, 0.1)', borderRadius: '10px', color: 'var(--primary)' }}>
                            <Layers size={18} />
                        </div>
                        <h4 style={{ fontWeight: '800', color: 'var(--text)', fontFamily: 'var(--font-display)' }}>
                            Atividades de {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
                        </h4>
                    </div>
                </div>

                {selectedEvents.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <Info size={24} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                        <p style={{ fontWeight: '600', fontSize: '0.85rem' }}>Nenhuma atividade planejada para este dia.</p>
                    </div>
                ) : (
                    <div className="table-responsive" style={{ borderRadius: '12px', border: '1px solid var(--border)' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', background: 'rgba(0,0,0,0.02)', borderBottom: '1px solid var(--border)' }}>
                                    <th style={{ padding: '1rem', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Tipo</th>
                                    <th style={{ padding: '1rem', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Quadra</th>
                                    <th style={{ padding: '1rem', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Receita</th>
                                    <th style={{ padding: '1rem', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Obs / Últimas Bombas</th>
                                </tr>
                            </thead>
                            <tbody>
                                {selectedEvents.map((evt, idx) => (
                                    <tr key={`${evt.id}-${evt.type}-${idx}`} style={{ borderBottom: idx === selectedEvents.length - 1 ? 'none' : '1px solid var(--border)' }}>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{
                                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                                color: evt.type === 'iniciada' ? 'var(--primary)' : 'var(--secondary)',
                                                fontWeight: '800', fontSize: '0.75rem'
                                            }}>
                                                {evt.type === 'iniciada' ? <Clock size={14} /> : <AlertCircle size={14} />}
                                                {evt.type === 'iniciada' ? 'INICIADA' : 'PRÓXIMA'}
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem', fontWeight: '800', fontSize: '0.9rem' }}>Q{evt.quadra}</td>
                                        <td style={{ padding: '1rem', fontWeight: '600', fontSize: '0.85rem' }}>{evt.receita}</td>
                                        <td style={{ padding: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                {evt.observacao && <span><strong>Obs:</strong> {evt.observacao}</span>}
                                                {evt.quantidade_bombas > 0 && <span><strong>Bombas:</strong> {evt.quantidade_bombas}</span>}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="premium-card glass" style={{ border: 'none', boxShadow: 'none', backgroundColor: 'transparent', padding: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem' }}>
                <div style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '16px',
                    background: 'var(--primary-gradient)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 8px 15px rgba(46, 125, 50, 0.2)'
                }}>
                    <CalendarIcon color="white" size={24} />
                </div>
                <div>
                    <h2 style={{ color: 'var(--text)', fontWeight: '900', letterSpacing: '-0.8px', fontFamily: 'var(--font-display)', fontSize: '1.8rem' }}>Calendário de Pulverização</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600' }}>Toque em uma data para ver o detalhamento completo</p>
                </div>
            </div>

            {loading ? (
                <div style={{ padding: '5rem', textAlign: 'center' }}>
                    <div className="spinner"></div>
                    <p style={{ color: 'var(--text-muted)', marginTop: '1rem', fontWeight: '600' }}>Sincronizando calendário...</p>
                </div>
            ) : (
                <>
                    <div style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                        <div style={{ minWidth: '600px', paddingBottom: '1rem' }}>
                            {renderHeader()}
                            {renderDays()}
                            {renderCells()}
                        </div>
                    </div>
                    {renderDetailTable()}
                </>
            )}

            <div style={{
                marginTop: '1.5rem',
                padding: '1rem 1.5rem',
                background: 'white',
                borderRadius: '18px',
                border: '1px solid var(--border)',
                display: 'flex',
                gap: '2rem',
                flexWrap: 'wrap',
                fontSize: '0.75rem',
                boxShadow: 'var(--shadow-sm)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: 'var(--primary-gradient)' }}></div>
                    <span style={{ fontWeight: '700', color: 'var(--text)' }}>Iniciada</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: 'var(--secondary-gradient)' }}></div>
                    <span style={{ fontWeight: '700', color: 'var(--text)' }}>Próxima Aplicação</span>
                </div>
                <div style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontWeight: '700' }}>
                    Total de {registros.length} registros
                </div>
            </div>

            <style>{`
                .action-btn {
                    background: white;
                    border: 1px solid var(--border);
                    padding: 0.6rem 1rem;
                    border-radius: 14px;
                    cursor: pointer;
                    color: var(--text);
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    display: flex;
                    alignItems: center;
                    justifyContent: center;
                }
                .action-btn:hover {
                    border-color: var(--primary);
                    color: var(--primary);
                    box-shadow: var(--shadow-sm);
                    transform: translateY(-2px);
                }
                .spinner {
                    width: 40px;
                    height: 40px;
                    border: 4px solid rgba(46, 125, 50, 0.1);
                    border-left-color: var(--primary);
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin: 0 auto;
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .cell-calendar:hover {
                    border-color: var(--primary) !important;
                    background: rgba(46, 125, 50, 0.02) !important;
                }
            `}</style>
        </div>
    );
}
