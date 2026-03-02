import React, { useState, useEffect } from 'react';
import PageHeader from './PageHeader';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    CheckCircle,
    Clock,
    ChevronDown,
    ChevronUp,
    Save,
    X,
    FileDown,
    ClipboardList,
} from 'lucide-react';
import { osService, registrosService, ordensSaidaService } from '../lib/services';
import { format, parseISO, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Launch({ logo }) {
    const [registros, setRegistros] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [filters, setFilters] = useState({ block: 'Todos', recipe: 'Todos', status: 'Iniciada' });
    const [showOSModal, setShowOSModal] = useState(false);
    const [pendingOS, setPendingOS] = useState([]);
    const [selectedOS, setSelectedOS] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        quantidade_bombas: '',
        pes_tratados: '',
        marcha: '1ªA',
        data_inicial: format(new Date(), 'yyyy-MM-dd'),
        data_final: '',
        quadra: '',
        receita: '',
        dias_carencia: '7',
        observacao: '',
        situacao: 'Iniciada'
    });

    const blocks = ["001", "002", "003", "004", "005A", "005B", "005C", "006A", "006B", "007", "008", "009", "010", "011", "012", "013", "014", "015", "016", "017", "018", "019", "020", "021", "022", "024", "026", "027", "028", "029", "030", "031", "032", "033", "034"];
    const recipes = ["Chuá", "Leprose", "Alternária", "Pinta Preta", "Aplicação de Winner", "Herbicida"];
    const gears = ["1ªA", "1ªRA", "2ªA", "2ªRA", "3ªA", "3ªRA", "4ªA", "4ªRA"];

    useEffect(() => {
        loadRegistros();
        loadPendingOS();
    }, []);

    const loadPendingOS = async () => {
        try {
            const data = await osService.getPending();
            const strictlyPending = data.filter(os => os.situacao !== 'Iniciada');
            setPendingOS(strictlyPending);
        } catch (error) {
            console.error('Error loading OS:', error);
        }
    };

    const loadRegistros = async () => {
        try {
            const data = await registrosService.getAll();
            setRegistros(data);
        } catch (error) {
            console.error('Error loading registros:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const sanitizedData = {
                ...formData,
                data_final: formData.data_final || null,
                quantidade_bombas: formData.quantidade_bombas || 0,
                pes_tratados: formData.pes_tratados || 0
            };

            if (editingId) {
                await registrosService.update(editingId, sanitizedData);
                setEditingId(null);
            } else {
                const newReg = await registrosService.create({
                    ...sanitizedData,
                    os_id: selectedOS?.id
                });

                if (selectedOS) {
                    await osService.update(selectedOS.id, { situacao: 'Iniciada' });
                }
            }
            setShowForm(false);
            setSelectedOS(null);
            setFormData({
                quantidade_bombas: '',
                pes_tratados: '',
                marcha: '1ªA',
                data_inicial: format(new Date(), 'yyyy-MM-dd'),
                data_final: '',
                quadra: '',
                receita: '',
                dias_carencia: '7',
                observacao: '',
                situacao: 'Iniciada'
            });
            loadRegistros();
            loadPendingOS();
        } catch (error) {
            alert('Erro ao salvar: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async (reg) => {
        const newStatus = reg.situacao === 'Concluído' ? 'Pendente' : 'Concluído';
        const completionDate = newStatus === 'Concluído' ? format(new Date(), 'yyyy-MM-dd') : null;

        try {
            await registrosService.update(reg.id, {
                situacao: newStatus,
                data_conclusao: completionDate
            });
            loadRegistros();
        } catch (error) {
            alert('Erro ao atualizar status');
        }
    };

    const [showFinalizeModal, setShowFinalizeModal] = useState(false);
    const [finalizingReg, setFinalizingReg] = useState(null);
    const [finalizeData, setFinalizeData] = useState({
        data_final: format(new Date(), 'yyyy-MM-dd'),
        quantidade_bombas: '',
        pes_tratados: '',
        nao_agendar: false 
    });

    useEffect(() => {
        if (finalizingReg?.os_id) {
            const fetchPumps = async () => {
                try {
                    const total = await ordensSaidaService.getPumpsSummary(finalizingReg.os_id);
                    setFinalizeData(prev => ({ ...prev, quantidade_bombas: total > 0 ? total.toString() : '' }));
                } catch (error) {
                    console.error('Erro ao buscar resumo de bombas:', error);
                }
            };
            fetchPumps();
        }
    }, [finalizingReg]);

    const handleFinalize = async (e) => {
        e.preventDefault();
        if (!finalizingReg) return;

        try {
            setLoading(true);
            await registrosService.update(finalizingReg.id, {
                data_final: finalizeData.data_final || null,
                quantidade_bombas: finalizeData.quantidade_bombas || 0,
                pes_tratados: finalizeData.pes_tratados || 0,
                situacao: 'Finalizada',
                nao_agendar: finalizeData.nao_agendar
            });

            if (finalizingReg.os_id) {
                await osService.update(finalizingReg.os_id, { situacao: 'Finalizada' });
            }

            setShowFinalizeModal(false);
            setFinalizingReg(null);
            setFinalizeData({
                data_final: format(new Date(), 'yyyy-MM-dd'),
                quantidade_bombas: '',
                pes_tratados: '',
                nao_agendar: false 
            });
            loadRegistros();
            loadPendingOS();
        } catch (error) {
            alert('Erro ao finalizar: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    // AQUI ESTÁ A CORREÇÃO NA EXCLUSÃO
    const handleDelete = async (reg) => {
        if (window.confirm('Excluir este lançamento? Se ele estiver vinculado a uma Receita, ela voltará para Pendente.')) {
            try {
                // 1. Apaga o lançamento do calendário
                await registrosService.delete(reg.id);
                
                // 2. Se tinha uma Receita (OS) vinculada, devolve ela para o status "Pendente"
                if (reg.os_id) {
                    await osService.update(reg.os_id, { situacao: 'Pendente' });
                }
                
                // 3. Atualiza as listas na tela
                loadRegistros();
                loadPendingOS();
            } catch (error) {
                alert('Erro ao excluir: ' + error.message);
            }
        }
    };

    const filteredRegistros = registros.filter(r => {
        return (filters.block === 'Todos' || r.quadra === filters.block) &&
            (filters.recipe === 'Todos' || r.receita === filters.recipe) &&
            (filters.status === 'Todos' || !filters.status || r.situacao === filters.status);
    });

    const getDaysDiff = (dateStr) => {
        if (!dateStr) return '?';
        const diff = differenceInDays(parseISO(dateStr), new Date());
        return diff;
    };

    const findSuccessor = (reg) => {
        return registros.find(r =>
            r.quadra === reg.quadra &&
            r.receita === reg.receita &&
            new Date(r.data_inicial) > new Date(reg.data_inicial)
        );
    };

    const exportToPDF = () => {
        const doc = new jsPDF();
        doc.text('Relatório de Pulverização - AgroControl', 14, 15);

        const tableData = filteredRegistros.map(reg => [
            reg.situacao,
            format(parseISO(reg.data_inicial), 'dd/MM/yyyy'),
            reg.data_final ? format(parseISO(reg.data_final), 'dd/MM/yyyy') : '-',
            reg.quadra,
            reg.receita,
            reg.proxima_pulverizacao ? format(parseISO(reg.proxima_pulverizacao), 'dd/MM/yyyy') : '',
            reg.observacao || ''
        ]);

        doc.autoTable({
            head: [['Situação', 'Início', 'Fim', 'Quadra', 'Receita', 'Próxima', 'Obs']],
            body: tableData,
            startY: 25,
            theme: 'grid'
        });

        doc.save(`relatorio-pulverizacao-${format(new Date(), 'dd-MM-yyyy')}.pdf`);
    };

    return (
        <div className="premium-card glass" style={{ border: 'none', boxShadow: 'none', background: 'transparent', padding: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <PageHeader title="Gestão de Lançamentos" subtitle="Controle diário de pulverização e aplicações" logo={logo} />
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <button onClick={exportToPDF} className="btn btn-secondary">
                        <div className="btn-inner" style={{ padding: '0.6rem 1.2rem' }}>
                            <FileDown size={18} /> Exportar PDF
                        </div>
                    </button>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button onClick={() => setShowOSModal(true)} className="btn btn-mini" title="Puxar Receita Agronômica">
                            <div className="btn-inner" style={{ padding: '0.5rem' }}>
                                <Search size={20} />
                            </div>
                        </button>
                        <button
                            onClick={() => { setShowForm(!showForm); if (!showForm) { setEditingId(null); setSelectedOS(null); } }}
                            className="btn btn-primary"
                        >
                            <div className="btn-inner">
                                {showForm ? <X size={20} /> : <Plus size={20} />}
                                {showForm ? 'Cancelar' : 'Novo Lançamento'}
                            </div>
                        </button>
                    </div>
                </div>
            </div>

            {showForm && (
                <div className="premium-card">
                    <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                        <div className="form-group">
                            <label>Data Inicial</label>
                            <input type="date" name="data_inicial" value={formData.data_inicial} onChange={handleInputChange} className="input-field" required />
                        </div>
                        <div className="form-group">
                            <label>Situação</label>
                            <select name="situacao" value={formData.situacao} onChange={handleInputChange} className="filter-select" style={{ width: '100%' }}>
                                <option value="Iniciada">Iniciada</option>
                                <option value="Finalizada">Finalizada</option>
                                <option value="Pendente">Pendente</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Quadra</label>
                            <select name="quadra" value={formData.quadra} onChange={handleInputChange} className="filter-select" style={{ width: '100%' }} required>
                                <option value="">Selecione</option>
                                {blocks.map(b => <option key={b} value={b}>{b}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Receita</label>
                            <select name="receita" value={formData.receita} onChange={handleInputChange} className="filter-select" style={{ width: '100%' }} required>
                                <option value="">Selecione</option>
                                {recipes.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>

                        {formData.situacao !== 'Iniciada' && (
                            <>
                                <div className="form-group">
                                    <label>Data Final</label>
                                    <input type="date" name="data_final" value={formData.data_final} onChange={handleInputChange} className="input-field" />
                                </div>
                                <div className="form-group">
                                    <label>Nº Bombas</label>
                                    <input type="number" name="quantidade_bombas" value={formData.quantidade_bombas} onChange={handleInputChange} className="input-field" />
                                </div>
                                <div className="form-group">
                                    <label>Pés Tratados</label>
                                    <input type="number" name="pes_tratados" value={formData.pes_tratados} onChange={handleInputChange} className="input-field" />
                                </div>
                            </>
                        )}

                        <div className="form-group">
                            <label>Carência (Dias)</label>
                            <input type="number" name="dias_carencia" value={formData.dias_carencia} onChange={handleInputChange} className="input-field" />
                        </div>
                        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                            <label>Observação</label>
                            <textarea name="observacao" value={formData.observacao} onChange={handleInputChange} className="input-field" style={{ minHeight: '80px', fontFamily: 'inherit' }} placeholder="Ex: Produto X usou..."></textarea>
                        </div>
                        <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                            <button type="submit" className="btn btn-primary">
                                <div className="btn-inner">
                                    <Save size={20} /> {editingId ? 'Salvar Alterações' : 'Salvar Registro'}
                                </div>
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {showFinalizeModal && (
                <div style={{
                    position: 'fixed', inset: 0,
                    background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(8px)',
                    zIndex: 2000, display: 'grid', placeItems: 'start center',
                    padding: '2rem 1.5rem', overflowY: 'auto'
                }}>
                    <div className="premium-card glass" style={{ maxWidth: '500px', width: '100%', position: 'relative', border: '1px solid rgba(255,255,255,0.4)', padding: '2.5rem' }}>
                        <button onClick={() => {
                            setShowFinalizeModal(false);
                            setFinalizingReg(null); 
                        }} className="btn btn-mini" style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', opacity: 0.8 }}>
                            <div className="btn-inner" style={{ padding: '0.4rem' }}>
                                <X size={20} />
                            </div>
                        </button>
                        <h3 style={{ marginBottom: '0.5rem', color: 'var(--primary)', fontWeight: '900', fontFamily: 'var(--font-display)', fontSize: '1.6rem' }}>Finalizar Quadra</h3>
                        <p style={{ marginBottom: '2rem', fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                            Confirme os dados de aplicação da quadra <span style={{ color: 'var(--secondary)' }}>{finalizingReg?.quadra}</span>
                        </p>

                        <form onSubmit={handleFinalize} style={{ display: 'grid', gap: '1.5rem' }}>
                            <div className="form-group">
                                <label>Data Final</label>
                                <input type="date" value={finalizeData.data_final} onChange={e => setFinalizeData({ ...finalizeData, data_final: e.target.value })} className="input-field" required />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label>Qtd Bombas</label>
                                    <input type="number" value={finalizeData.quantidade_bombas} onChange={e => setFinalizeData({ ...finalizeData, quantidade_bombas: e.target.value })} className="input-field" required placeholder="Ex: 5" />
                                </div>
                                <div className="form-group">
                                    <label>Pés Tratados</label>
                                    <input type="number" value={finalizeData.pes_tratados} onChange={e => setFinalizeData({ ...finalizeData, pes_tratados: e.target.value })} className="input-field" required placeholder="Ex: 400" />
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                                <input 
                                    type="checkbox" 
                                    id="nao_agendar" 
                                    checked={finalizeData.nao_agendar}
                                    onChange={e => setFinalizeData({ ...finalizeData, nao_agendar: e.target.checked })}
                                    style={{ width: '18px', height: '18px', accentColor: 'var(--primary)', cursor: 'pointer' }}
                                />
                                <label htmlFor="nao_agendar" style={{ fontSize: '0.9rem', color: 'var(--text)', cursor: 'pointer', fontWeight: '600' }}>
                                    Atividade sem carência (Não exibir no calendário)
                                </label>
                            </div>

                            <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem', width: '100%' }}>
                                <div className="btn-inner">
                                    <CheckCircle size={22} /> Confirmar e Finalizar
                                </div>
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="premium-card glass" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
                <div style={{ padding: '0.6rem', background: 'rgba(46, 125, 50, 0.1)', borderRadius: '10px', display: 'flex', alignItems: 'center' }}>
                    <Search size={20} color="var(--primary)" />
                </div>
                <select value={filters.block} onChange={(e) => setFilters(f => ({ ...f, block: e.target.value }))} className="filter-select">
                    <option value="Todos">Todas Quadras</option>
                    {blocks.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
                <select value={filters.recipe} onChange={(e) => setFilters(f => ({ ...f, recipe: e.target.value }))} className="filter-select">
                    <option value="Todos">Todas Receitas</option>
                    {recipes.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <select value={filters.status} onChange={(e) => setFilters(f => ({ ...f, status: e.target.value }))} className="filter-select">
                    <option value="Todos">Todas Situações</option>
                    <option value="Iniciada">Iniciada</option>
                    <option value="Finalizada">Finalizada</option>
                    <option value="Pendente">Pendente</option>
                </select>
            </div>

            {/* Results Table/Cards */}
            <div className="results-container">
                {loading ? (
                    <p style={{ textAlign: 'center', padding: '2rem' }}>Carregando dados...</p>
                ) : filteredRegistros.length === 0 ? (
                    <p style={{ textAlign: 'center', padding: '2rem' }}>Nenhum registro encontrado.</p>
                ) : (
                    <div className="table-responsive">
                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--border)' }}>
                                    <th style={{ padding: '1rem' }}>Situação</th>
                                    <th style={{ padding: '1rem' }}>Início</th>
                                    <th style={{ padding: '1rem' }}>Fim</th>
                                    <th style={{ padding: '1rem' }}>Quadra</th>
                                    <th style={{ padding: '1rem' }}>Receita</th>
                                    <th style={{ padding: '1rem' }}>Próxima</th>
                                    <th style={{ padding: '1rem' }}>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRegistros.map(reg => (
                                    <tr key={reg.id} style={{ borderBottom: '1px solid var(--border)', backgroundColor: reg.situacao === 'Concluído' ? '#f1f8e9' : 'transparent' }}>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                {reg.situacao === 'Finalizada' ?
                                                    <CheckCircle size={20} color="#2e7d32" /> :
                                                    <Clock size={20} color={reg.situacao === 'Iniciada' ? '#fbc02d' : '#c62828'} />
                                                }
                                                <span style={{
                                                    fontWeight: '700',
                                                    color: reg.situacao === 'Finalizada' ? '#2e7d32' : (reg.situacao === 'Iniciada' ? '#f9a825' : '#c62828'),
                                                    fontSize: '0.85rem'
                                                }}>
                                                    {reg.situacao}
                                                </span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>{format(parseISO(reg.data_inicial), 'dd/MM/yyyy')}</td>
                                        <td style={{ padding: '1rem' }}>{reg.data_final ? format(parseISO(reg.data_final), 'dd/MM/yyyy') : '-'}</td>
                                        <td style={{ padding: '1rem', fontWeight: 'bold' }}>{reg.quadra}</td>
                                        <td style={{ padding: '1rem' }}>{reg.receita}</td>
                                        <td style={{ padding: '1rem' }}>
                                            {reg.proxima_pulverizacao ? (() => {
                                                const succ = findSuccessor(reg);
                                                return (
                                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                        <span style={{
                                                            textDecoration: succ ? 'line-through' : 'none',
                                                            color: succ ? '#2e7d32' : 'inherit',
                                                            fontWeight: succ ? 'bold' : 'normal'
                                                        }}>
                                                            {format(parseISO(reg.proxima_pulverizacao), 'dd/MM/yyyy')}
                                                        </span>
                                                        {succ ? (
                                                            <span style={{ fontSize: '0.7rem', color: '#2e7d32', fontWeight: 'bold' }}>
                                                                Iniciada: {format(parseISO(succ.data_inicial), 'dd/MM/yyyy')}
                                                            </span>
                                                        ) : (
                                                            <span style={{
                                                                fontSize: '0.7rem',
                                                                padding: '0.1rem 0.3rem',
                                                                borderRadius: '4px',
                                                                backgroundColor: getDaysDiff(reg.proxima_pulverizacao) < 0 ? '#ffebee' : '#e8f5e9',
                                                                color: getDaysDiff(reg.proxima_pulverizacao) < 0 ? '#c62828' : '#2e7d32',
                                                                width: 'fit-content'
                                                            }}>
                                                                {getDaysDiff(reg.proxima_pulverizacao)}d
                                                            </span>
                                                        )}
                                                    </div>
                                                );
                                            })() : '-'}
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ display: 'flex', gap: '0.6rem' }}>
                                                {reg.situacao !== 'Finalizada' && (
                                                    <button onClick={() => { 
                                                        setFinalizeData({
                                                            data_final: format(new Date(), 'yyyy-MM-dd'),
                                                            quantidade_bombas: '',
                                                            pes_tratados: '',
                                                            nao_agendar: false
                                                        });
                                                        setFinalizingReg(reg); 
                                                        setShowFinalizeModal(true); 
                                                    }} className="btn btn-mini" style={{ color: '#2e7d32' }} title="Finalizar">
                                                        <div className="btn-inner">
                                                            <CheckCircle size={16} />
                                                        </div>
                                                    </button>
                                                )}
                                                <button onClick={() => { setEditingId(reg.id); setFormData(reg); setShowForm(true); }} className="btn btn-mini" title="Editar">
                                                    <div className="btn-inner">
                                                        <Edit2 size={16} />
                                                    </div>
                                                </button>
                                                
                                                {/* O BOTÃO QUE FOI ALTERADO PARA PASSAR O 'reg' INTEIRO ESTÁ AQUI */}
                                                <button onClick={() => handleDelete(reg)} className="btn btn-mini" style={{ color: '#ef5350' }} title="Excluir">
                                                    <div className="btn-inner">
                                                        <Trash2 size={16} />
                                                    </div>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <style>{`
                input::placeholder { color: #94a3b8 !important; }
            `}</style>
            
            {showOSModal && (
                <div style={{
                    position: 'fixed', inset: 0,
                    background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)',
                    zIndex: 2500, display: 'grid', placeItems: 'center', padding: '1rem'
                }}>
                    <div className="premium-card glass" style={{ maxWidth: '600px', width: '100%', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0, color: 'var(--primary)', fontWeight: '900' }}>Puxar Receita Agronômica</h3>
                            <button onClick={() => setShowOSModal(false)} className="btn btn-mini">
                                <div className="btn-inner" style={{ padding: '0.4rem' }}><X size={20} /></div>
                            </button>
                        </div>

                        {pendingOS.length === 0 ? (
                            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                Nenhuma receita pendente encontrada.
                            </div>
                        ) : (
                            <div style={{ overflowY: 'auto', flex: 1, display: 'grid', gap: '1rem' }}>
                                {pendingOS.map(os => (
                                    <button
                                        key={os.id}
                                        onClick={() => {
                                            const insumosStr = os.insumos
                                                ?.filter(i => i.material)
                                                .map(i => `${i.material} (${i.dosagem || ''})`)
                                                .join(', ');

                                            setFormData({
                                                ...formData,
                                                quadra: os.quadra,
                                                receita: os.operacao,
                                                situacao: 'Iniciada',
                                                observacao: insumosStr ? `Produtos da OS: ${insumosStr}` : formData.observacao
                                            });
                                            setSelectedOS(os);
                                            setShowOSModal(false);
                                            setShowForm(true);
                                        }}
                                        style={{
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                            padding: '1.25rem', borderRadius: '16px', border: '1.5px solid var(--border)',
                                            background: 'white', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                                        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                                    >
                                        <div>
                                            <div style={{ fontWeight: '900', color: 'var(--primary)', fontSize: '1.1rem' }}>OS Nº {String(os.numero_os).padStart(4, '0')}</div>
                                            <div style={{ fontWeight: '700', color: 'var(--text)' }}>Q-{os.quadra} • {os.operacao}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{format(parseISO(os.data_prescricao), 'dd/MM/yyyy')}</div>
                                        </div>
                                        <div style={{ background: 'var(--primary-gradient)', color: 'white', padding: '0.5rem', borderRadius: '10px' }}>
                                            <Plus size={20} />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
