import React, { useState, useEffect } from 'react';
import { registrosService } from '../lib/services';
import {
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    Clock,
    CheckCircle,
    AlertCircle
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

                    const isToday = isSameDay(day, new Date());
                    const isCurrentMonth = isSameMonth(day, monthStart);

                    return (
                        <div key={formattedDate} className="premium-card glass" style={{
                            minHeight: '130px',
                            backgroundColor: isCurrentMonth ? 'white' : 'rgba(0,0,0,0.02)',
                            opacity: isCurrentMonth ? 1 : 0.4,
                            padding: '0.8rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.5rem',
                            border: isToday ? '2px solid var(--primary)' : '1px solid var(--border)',
                            boxShadow: isToday ? '0 10px 20px rgba(46, 125, 50, 0.15)' : 'var(--shadow-sm)',
                            position: 'relative',
                            transition: 'all 0.3s'
                        }}>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '4px'
                            }}>
                                <span style={{
                                    fontSize: '1rem',
                                    fontWeight: '800',
                                    fontFamily: 'var(--font-display)',
                                    color: isToday ? 'var(--primary)' : 'var(--text)',
                                }}>
                                    {format(day, 'd')}
                                </span>
                                {isToday && (
                                    <div style={{
                                        width: '8px',
                                        height: '8px',
                                        borderRadius: '50%',
                                        background: 'var(--primary)',
                                        boxShadow: '0 0 10px var(--primary)'
                                    }}></div>
                                )}
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1 }}>
                                {dayEvents.map((evt, idx) => (
                                    <div key={`${evt.id}-${evt.type}-${idx}`} style={{
                                        fontSize: '0.65rem',
                                        padding: '0.5rem 0.75rem',
                                        borderRadius: '10px',
                                        background: evt.type === 'iniciada' ? 'var(--primary-gradient)' : 'var(--secondary-gradient)',
                                        color: 'white',
                                        fontWeight: '800',
                                        boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                                        border: 'none',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '2px'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            {evt.type === 'iniciada' ? <Clock size={10} /> : <AlertCircle size={10} />}
                                            <span style={{ textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.55rem', opacity: 0.9 }}>
                                                {evt.type === 'iniciada' ? 'Iniciada' : 'Próxima'}
                                            </span>
                                        </div>
                                        <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {evt.receita} - Q{evt.quadra}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="premium-card glass" style={{ border: 'none', boxShadow: 'none', backgroundColor: 'transparent' }}>
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
                    <h2 style={{ color: 'var(--text)', fontWeight: '900', letterSpacing: '-0.8px', fontFamily: 'var(--font-display)', fontSize: '1.8rem' }}>Manejo de Pulverização</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600' }}>Calendário mensal de atividades e próximas aplicações</p>
                </div>
            </div>

            {loading ? (
                <div style={{ padding: '5rem', textAlign: 'center' }}>
                    <div className="spinner"></div>
                    <p style={{ color: 'var(--text-muted)', marginTop: '1rem', fontWeight: '600' }}>Sincronizando calendário...</p>
                </div>
            ) : (
                <div style={{ width: '100%', overflowX: 'auto' }}>
                    <div style={{ minWidth: window.innerWidth < 768 ? '600px' : 'auto' }}>
                        {renderHeader()}
                        {renderDays()}
                        {renderCells()}
                    </div>
                </div>
            )}

            <div style={{
                marginTop: '3rem',
                padding: '1.5rem',
                background: 'white',
                borderRadius: '18px',
                border: '1px solid var(--border)',
                display: 'flex',
                gap: '2rem',
                flexWrap: 'wrap',
                fontSize: '0.85rem',
                boxShadow: 'var(--shadow-sm)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <div style={{ width: '14px', height: '14px', borderRadius: '4px', background: 'var(--primary-gradient)' }}></div>
                    <span style={{ fontWeight: '700', color: 'var(--text)' }}>Atividade Iniciada</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <div style={{ width: '14px', height: '14px', borderRadius: '4px', background: 'var(--secondary-gradient)' }}></div>
                    <span style={{ fontWeight: '700', color: 'var(--text)' }}>Próxima Pulverização</span>
                </div>
                <div style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontWeight: '600' }}>
                    Total de {registros.length} registros mapeados
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
            `}</style>
        </div>
    );
}
