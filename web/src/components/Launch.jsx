import React, { useState, useEffect } from 'react';
import { registrosService } from '../lib/services';
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
    FileDown
} from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Launch() {
    const [registros, setRegistros] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [filters, setFilters] = useState({ block: 'Todos', recipe: 'Todos' });

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
    }, []);

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
            if (editingId) {
                await registrosService.update(editingId, formData);
                setEditingId(null);
            } else {
                await registrosService.create(formData);
            }
            setShowForm(false);
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

    const handleFinalize = async (reg) => {
        const dataFinal = prompt('Informe a data de finalização (AAAA-MM-DD):', format(new Date(), 'yyyy-MM-dd'));
        if (!dataFinal) return;

        try {
            setLoading(true);
            await registrosService.update(reg.id, {
                situacao: 'Finalizada',
                data_final: dataFinal
            });
            loadRegistros();
        } catch (error) {
            alert('Erro ao finalizar: ' + error.message);
        } finally {
            setLoading(true);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Excluir este registro?')) {
            try {
                await registrosService.delete(id);
                loadRegistros();
            } catch (error) {
                alert('Erro ao excluir');
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
        // Find if there is a record of same quadra/receita that started AFTER this one was defined
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
                    <div style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '18px',
                        background: 'var(--secondary-gradient)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 8px 15px rgba(251, 140, 0, 0.2)'
                    }}>
                        <Plus color="white" size={28} />
                    </div>
                    <div>
                        <h2 style={{ color: 'var(--text)', fontWeight: '900', letterSpacing: '-0.8px', fontFamily: 'var(--font-display)', fontSize: '1.8rem' }}>Gestão de Lançamentos</h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600' }}>Controle diário de pulverização e aplicações</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <button onClick={exportToPDF} className="action-btn">
                        <FileDown size={18} /> Exportar PDF
                    </button>
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="btn btn-secondary"
                        style={{ padding: '0.75rem 1.5rem', borderRadius: '16px', fontWeight: '800' }}
                    >
                        {showForm ? <X size={20} /> : <Plus size={20} />}
                        {showForm ? 'Fechar' : 'Novo Lançamento'}
                    </button>
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
                            <label>Data Final</label>
                            <input type="date" name="data_final" value={formData.data_final} onChange={handleInputChange} className="input-field" />
                        </div>
                        <div className="form-group">
                            <label>Situação</label>
                            <select name="situacao" value={formData.situacao} onChange={handleInputChange} className="input-field">
                                <option value="Iniciada">Iniciada</option>
                                <option value="Finalizada">Finalizada</option>
                                <option value="Pendente">Pendente</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Quadra</label>
                            <select name="quadra" value={formData.quadra} onChange={handleInputChange} className="input-field" required>
                                <option value="">Selecione</option>
                                {blocks.map(b => <option key={b} value={b}>{b}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Receita</label>
                            <select name="receita" value={formData.receita} onChange={handleInputChange} className="input-field" required>
                                <option value="">Selecione</option>
                                {recipes.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Nº Bombas</label>
                            <input type="number" name="quantidade_bombas" value={formData.quantidade_bombas} onChange={handleInputChange} className="input-field" />
                        </div>
                        <div className="form-group">
                            <label>Pés Tratados</label>
                            <input type="number" name="pes_tratados" value={formData.pes_tratados} onChange={handleInputChange} className="input-field" />
                        </div>
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
                                <Save size={20} /> {editingId ? 'Salvar Alterações' : 'Salvar Registro'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Filters */}
            <div className="premium-card glass" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
                <Search size={20} color="var(--primary)" />
                <select value={filters.block} onChange={(e) => setFilters(f => ({ ...f, block: e.target.value }))} className="filter-select">
                    <option value="Todos">Todas Quadras</option>
                    {blocks.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
                <select value={filters.recipe} onChange={(e) => setFilters(f => ({ ...f, recipe: e.target.value }))} className="filter-select">
                    <option value="Todos">Todas Receitas</option>
                    {recipes.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <select value={filters.status || 'Todos'} onChange={(e) => setFilters(f => ({ ...f, status: e.target.value }))} className="filter-select">
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
                    <div className="table-wrapper" style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
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
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                {reg.situacao !== 'Finalizada' && (
                                                    <button onClick={() => handleFinalize(reg)} className="action-btn" style={{ color: '#2e7d32' }} title="Finalizar"><CheckCircle size={16} /></button>
                                                )}
                                                <button onClick={() => { setEditingId(reg.id); setFormData(reg); setShowForm(true); }} className="action-btn"><Edit2 size={16} /></button>
                                                <button onClick={() => handleDelete(reg.id)} className="action-btn" style={{ color: '#ef5350' }}><Trash2 size={16} /></button>
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
        .input-field {
          width: 100%;
          padding: 0.6rem;
          border-radius: 8px;
          border: 1px solid var(--border);
          outline: none;
        }
        .filter-select {
          padding: 0.5rem;
          border-radius: 8px;
          border: 1px solid var(--border);
          background: white;
          color: var(--primary);
          font-weight: 600;
        }
        .action-btn {
          background: #f5f5f5;
          border: 1px solid var(--border);
          border-radius: 6px;
          padding: 0.4rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        .action-btn:hover {
          background: #e0e0e0;
        }
        .form-group label {
          display: block;
          font-size: 0.85rem;
          font-weight: 600;
          margin-bottom: 0.25rem;
          color: var(--text-muted);
        }
      `}</style>
        </div>
    );
}
