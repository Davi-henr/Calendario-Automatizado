import React, { useState, useEffect } from 'react';
import {
    Plus,
    Trash2,
    Edit2,
    Save,
    X,
    Search,
    Beaker,
    Activity,
    Map as MapIcon,
    AlertCircle,
    CheckCircle2,
    Filter,
    ChevronRight
} from 'lucide-react';
import { insumosService, atividadesService, quadrasService } from '../lib/services';

// Static data from Prescriptions.jsx
const INITIAL_MATERIALS = [
    { code: "501,0009", name: "ACIDO BORICO" },
    { code: "501,0224", name: "ACIDO GIBERÉLICO" },
    { code: "501,0010", name: "ACTARA 250 WG" },
    { code: "517,0172", name: "ALCOOL ETILICO - 96%" },
    { code: "501,0150", name: "ALIETTE" },
    { code: "501,0119", name: "ALION SC 500 - GL 5 L" },
    { code: "502,0070", name: "ALLGOR BLEND" },
    { code: "501,0013", name: "AURORA 400 EC - GL 5L" },
    { code: "501,0282", name: "AVURA" },
    { code: "501,0015", name: "BELT" },
    { code: "501,0258", name: "BENEVIA 10 OD - GL 5L" },
    { code: "501,0226", name: "BIOTRAP AMARELA" },
    { code: "501,0246", name: "BRANDT DOME" },
    { code: "501,0202", name: "BULLDOCK 125 SC - FR 1 LT" },
    { code: "502,0071", name: "CABUM" },
    { code: "502,0095", name: "CARBOPLEX" },
    { code: "501,0019", name: "COMET GL 5" },
    { code: "501,0020", name: "CONNECT" },
    { code: "501,0097", name: "COPPERCROP" },
    { code: "501,0265", name: "CURBIX" },
    { code: "501,0265", name: "CURYON" },
    { code: "502,0092", name: "DECCO SOLAR" },
    { code: "501,0024", name: "DIMEXION 400 EC - GL 5 L" },
    { code: "501,0159", name: "DIOX" },
    { code: "501,0025", name: "DIPEL" },
    { code: "501,0275", name: "DMA 806 (2.4.D)" },
    { code: "501,0170", name: "DRIPSOL MAP PURIFICADO" },
    { code: "501,0027", name: "ENGEO PLENO" },
    { code: "501,0190", name: "ENVIDOR 240 SC -  FR 400ML" },
    { code: "501,0221", name: "EPINGLE" },
    { code: "501,0231", name: "EUROFIT MAX" },
    { code: "501,0134", name: "FASTER" },
    { code: "501,0077", name: "FEGATEX" },
    { code: "501,0125", name: "FEROCITRUS -ARMADILHA  FURAO" },
    { code: "502,0073", name: "FINALE" },
    { code: "501,0225", name: "FIXA TOP" },
    { code: "501,0028", name: "FLAK 200 SL" },
    { code: "501,0113", name: "FLINT WG 50 PCT 500 GR" },
    { code: "501,0074", name: "FLUMYZIN" },
    { code: "501,0264", name: "FORMICIDA" },
    { code: "501,0233", name: "FRUTYCON" },
    { code: "501,0177", name: "FUJIMITE 50 SC" },
    { code: "501,0029", name: "GALIGAN" },
    { code: "501,0283", name: "GARLON" },
    { code: "501,0032", name: "GLUFOSINATO NORTOX" },
    { code: "501,0180", name: "GOAL" },
    { code: "502,0050", name: "HEAT 350G" },
    { code: "501,0276", name: "K TOP" },
    { code: "502,0009", name: "KENTAN" },
    { code: "502,0075", name: "KRISTA K" },
    { code: "502,0022", name: "KRISTA MAG" },
    { code: "502,0072", name: "KRISTA MAP" },
    { code: "501,0237", name: "MAG-NUM" },
    { code: "501,0237", name: "MALATHION 1000 BD 20 L" },
    { code: "501,0039", name: "MANZATE WG 25 KG" },
    { code: "502,0069", name: "MARSHAL" },
    { code: "502,0049", name: "MAX FULL" },
    { code: "502,0069", name: "MAXIMUS" },
    { code: "501,0078", name: "MICROTHIOL DISPERS 80% WG - SC 25" },
    { code: "501,0253", name: "MINECTO PRO" },
    { code: "501,0182", name: "MIRAVIS DUO" },
    { code: "501,0118", name: "MOSCATEX" },
    { code: "501,0041", name: "MUSTANG 350 EC - GL 5 L" },
    { code: "501,0041", name: "NATIVO BD 20 LTS" },
    { code: "501,0166", name: "NEUFIX" },
    { code: "501,0100", name: "NOKALT" },
    { code: "501,0238", name: "OBERON" },
    { code: "501,0250", name: "OBNY" },
    { code: "501,0250", name: "OFF ROAD" },
    { code: "501,0158", name: "OKAY" },
    { code: "501,0277", name: "ORTUS" },
    { code: "501,0227", name: "PERITO 970 SG" },
    { code: "501,0075", name: "PICK UP ROUTEN" },
    { code: "501,0047", name: "PK 70 10 FOSFITO" },
    { code: "501,0048", name: "PREMIO 20 SC - GL 5L" },
    { code: "501,0048", name: "PROVADO SC 200 - GL 5 L" },
    { code: "501,0049", name: "QUATERMON" },
    { code: "501,0051", name: "ROUNDUP ORIG. MAIS BD 20LTS" },
    { code: "501,0227", name: "SELECT" },
    { code: "501,0203", name: "SERENADE SC - GL 5L" },
    { code: "501,0201", name: "SHOCK" },
    { code: "501,0235", name: "SILWET L 77  P5,0161" },
    { code: "501,0256", name: "SIVANTO PRIME 200SL GL 5L" },
    { code: "501,0205", name: "SMITE" },
    { code: "501,0093", name: "SOIL SET" },
    { code: "501,0187", name: "SPERTO" },
    { code: "502,0035", name: "SS 220" },
    { code: "502,0048", name: "SS 260" },
    { code: "502,0040", name: "SS CARBO C.A" },
    { code: "502,0090", name: "STOLLER P51 20L" },
    { code: "501,0060", name: "SUMIRODY" },
    { code: "501,0061", name: "SUMYZIN" },
    { code: "501,0063", name: "TALSTAR 100 ec - GL 10 L" },
    { code: "501,0239", name: "TRICLON" },
    { code: "501,0254", name: "TRUNFO" },
    { code: "501,0268", name: "UNIZEB GOLD 15KG" },
    { code: "502,0068", name: "VALLET COBRES" },
    { code: "502,0030", name: "VALLET DELTA" },
    { code: "502,0078", name: "VALLET TIKKUN" },
    { code: "501,0216", name: "VERTIMEC 84 SC 5L" },
    { code: "502,0054", name: "VISCONDE PREMIUM" },
    { code: "501,0071", name: "WINNER GL 5 LTS" },
    { code: "502,0051", name: "ZINCO 22" }
];

const INITIAL_ACTIVITIES = ["Chuá", "Leprose", "Alternária", "Pinta Preta", "Aplicação de Winner", "Herbicida"];
const INITIAL_BLOCKS = ["001", "002", "003", "004", "005A", "005B", "005C", "006A", "006B", "007", "008", "009", "010", "011", "012", "013", "014", "015", "016", "017", "018", "019", "020", "021", "022", "024", "026", "027", "028", "029", "030", "031", "032", "033", "034"];

export default function InventoryRegistration({ subview }) {
    const [data, setData] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [isSeeding, setIsSeeding] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [selectedId, setSelectedId] = useState(null);
    const [formData, setFormData] = useState({});

    const currentService = {
        insumos: insumosService,
        atividade: atividadesService,
        quadras: quadrasService
    }[subview];

    useEffect(() => {
        fetchData();
        setSelectedId(null);
        resetForm();
    }, [subview]);

    const fetchData = async () => {
        if (!currentService) return;

        try {
            setLoading(true);
            let items = await currentService.getAll();

            if (items.length === 0 && !isSeeding) {
                setIsSeeding(true);
                if (subview === 'insumos') {
                    const initialData = INITIAL_MATERIALS.map(m => ({
                        codigo: m.code,
                        insumo: m.name,
                        classificacao: '',
                        principio_ativo: '',
                        dias_carencia: 0,
                        dosagem: ''
                    }));
                    await currentService.bulkCreate(initialData);
                } else if (subview === 'atividade') {
                    const initialData = INITIAL_ACTIVITIES.map(a => ({ nome: a }));
                    await currentService.bulkCreate(initialData);
                } else if (subview === 'quadras') {
                    const initialData = INITIAL_BLOCKS.map(b => ({ nome: b, variedade: '', hectares: null }));
                    await currentService.bulkCreate(initialData);
                }
                items = await currentService.getAll();
                setIsSeeding(false);
            }

            setData(items);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        if (subview === 'insumos') {
            setFormData({
                codigo: '',
                insumo: '',
                classificacao: '',
                principio_ativo: '',
                dias_carencia: '',
                dosagem: '',
                saldo_inicial: '',
                exibir_auditoria: true
            });
        } else if (subview === 'atividade') {
            setFormData({ nome: '' });
        } else if (subview === 'quadras') {
            // ADICIONADO CAMPO HECTARES AQUI PARA LIMPAR O FORMULÁRIO
            setFormData({ nome: '', variedade: '', hectares: '' });
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            let dataToSave = { ...formData };
            
            // TRATAMENTO ESPECÍFICO PARA HECTARES (Garante que vai como número pro banco)
            if (subview === 'quadras' && dataToSave.hectares !== undefined) {
                if (dataToSave.hectares === '') {
                    dataToSave.hectares = null;
                } else {
                    dataToSave.hectares = parseFloat(dataToSave.hectares.toString().replace(',', '.'));
                }
            }

            if (editingItem) {
                await currentService.update(editingItem.id, dataToSave);
            } else {
                await currentService.create(dataToSave);
            }
            setShowForm(false);
            setEditingItem(null);
            resetForm();
            fetchData();
        } catch (error) {
            alert('Erro ao salvar: ' + error.message);
        }
    };

    const handleEdit = () => {
        if (!selectedId) return;
        const item = data.find(i => i.id === selectedId);
        if (item) {
            setEditingItem(item);
            setFormData({ ...item });
            setShowForm(true);
        }
    };

    const handleDelete = async () => {
        if (!selectedId) return;
        if (window.confirm('Tem certeza que deseja excluir este item?')) {
            try {
                await currentService.delete(selectedId);
                setSelectedId(null);
                fetchData();
            } catch (error) {
                alert('Erro ao excluir: ' + error.message);
            }
        }
    };

    const handleInsert = () => {
        setEditingItem(null);
        resetForm();
        setShowForm(true);
    };

    const filteredData = data.filter(item => {
        const search = searchTerm.toLowerCase();
        if (subview === 'insumos') {
            const insumo = item.insumo || '';
            const codigo = item.codigo || '';
            return insumo.toLowerCase().includes(search) || codigo.toLowerCase().includes(search);
        } else {
            const nome = item.nome || '';
            return nome.toLowerCase().includes(search);
        }
    });

    const config = {
        insumos: {
            title: 'Cadastro de Insumos',
            icon: <Beaker size={24} style={{ margin: 'auto' }} />,
            columns: ['Código', 'Insumo', 'Classificação', 'Princípio Ativo', 'Carência', 'Dosagem', 'S. Inicial'],
            fields: [
                { name: 'codigo', label: 'Código *', required: true },
                { name: 'insumo', label: 'Nome do Insumo *', required: true },
                { name: 'classificacao', label: 'Classificação' },
                { name: 'principio_ativo', label: 'Princípio Ativo' },
                { name: 'dias_carencia', label: 'Dias de Carência', type: 'number' },
                { name: 'dosagem', label: 'Dosagem Recomendada' },
                { name: 'saldo_inicial', label: 'Saldo Inicial', type: 'number' },
                { name: 'exibir_auditoria', label: 'Exibir na Auditoria (Citrus)', type: 'checkbox', fullWidth: true }
            ]
        },
        atividade: {
            title: 'Cadastro de Atividades',
            icon: <Activity size={24} style={{ margin: 'auto' }} />,
            columns: ['Operação/Atividade'],
            fields: [
                { name: 'nome', label: 'Operação/Atividade *', required: true, fullWidth: true },
            ]
        },
        quadras: {
            title: 'Cadastro de Quadras',
            icon: <MapIcon size={24} style={{ margin: 'auto' }} />,
            columns: ['Identificação da Quadra', 'Variedade', 'Hectares'],
            fields: [
                { name: 'nome', label: 'Nome/Número da Quadra *', required: true },
                { name: 'variedade', label: 'Variedade (Cultura)', type: 'text' },
                { name: 'hectares', label: 'Tamanho (Hectares)', type: 'number', step: '0.01' }
            ]
        }
    }[subview];

    return (
        <div style={{
            height: 'calc(100vh - 180px)',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: 'white',
            borderRadius: '24px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.04)',
            border: '1px solid rgba(0,0,0,0.05)',
            overflow: 'hidden'
        }}>
            <div style={{
                padding: '1.5rem 2rem',
                borderBottom: '1px solid rgba(0,0,0,0.06)',
                backgroundColor: 'rgba(255,255,255,0.8)',
                backdropFilter: 'blur(10px)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                zIndex: 10
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                        width: '48px', height: '48px', borderRadius: '14px',
                        background: 'linear-gradient(135deg, var(--primary), #6366f1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white'
                    }}>
                        {config.icon}
                    </div>
                    <div>
                        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: '900', color: 'var(--text)', fontSize: '1.4rem' }}>
                            {config.title}
                        </h2>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600' }}>
                            {filteredData.length} itens encontrados
                        </span>
                    </div>
                </div>

                <div style={{ position: 'relative', width: '300px' }}>
                    <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                        type="text"
                        placeholder={subview === 'insumos' ? "Buscar por código ou nome..." : "Buscar por nome..."}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%', padding: '0.7rem 1rem 0.7rem 2.8rem',
                            borderRadius: '12px', border: '1px solid rgba(0,0,0,0.1)',
                            fontSize: '0.9rem', outline: 'none', transition: 'all 0.2s',
                            backgroundColor: '#f8fafc'
                        }}
                    />
                </div>
            </div>

            <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '1rem 2rem',
                backgroundColor: '#fafbfc'
            }}>
                <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                    <thead style={{ position: 'sticky', top: 0, zIndex: 5, backgroundColor: '#fafbfc' }}>
                        <tr style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1.5px' }}>
                            {config.columns.map(col => <th key={col} style={{ textAlign: 'left', padding: '1rem', fontWeight: '800' }}>{col}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={config.columns.length} style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>Carregando dados...</td></tr>
                        ) : filteredData.length === 0 ? (
                            <tr><td colSpan={config.columns.length} style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>Nenhum {subview === 'insumos' ? 'insumo' : 'item'} encontrado.</td></tr>
                        ) : (
                            filteredData.map(item => (
                                <tr
                                    key={item.id}
                                    onClick={() => setSelectedId(item.id)}
                                    style={{
                                        backgroundColor: selectedId === item.id ? 'white' : '#ffffff',
                                        boxShadow: selectedId === item.id ? '0 4px 15px rgba(74, 108, 247, 0.15)' : '0 2px 4px rgba(0,0,0,0.02)',
                                        border: selectedId === item.id ? '2px solid var(--primary)' : '1px solid rgba(0,0,0,0.04)',
                                        transform: selectedId === item.id ? 'scale(1.002)' : 'none',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                    }}
                                >
                                    {subview === 'insumos' ? (
                                        <>
                                            <td style={{ padding: '1.2rem 1rem', fontWeight: '800', color: 'var(--primary)', borderRadius: '12px 0 0 12px' }}>
                                                {item.codigo}
                                            </td>
                                            <td style={{ padding: '1.2rem 1rem', fontWeight: '700', color: 'var(--text)' }}>
                                                {item.insumo}
                                            </td>
                                            <td style={{ padding: '1.2rem 1rem' }}>
                                                <span style={{
                                                    padding: '0.4rem 0.8rem', borderRadius: '8px',
                                                    background: '#f1f5f9', color: 'var(--text-muted)',
                                                    fontSize: '0.8rem', fontWeight: '600'
                                                }}>
                                                    {item.classificacao || 'N/A'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1.2rem 1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                                {item.principio_ativo || '-'}
                                            </td>
                                            <td style={{ padding: '1.2rem 1rem', textAlign: 'center' }}>
                                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#64748b' }}>
                                                    <AlertCircle size={14} />
                                                    <span style={{ fontWeight: '800' }}>{item.dias_carencia}d</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '1.2rem 1rem', fontSize: '0.9rem' }}>
                                                {item.dosagem || '-'}
                                            </td>
                                            <td style={{ padding: '1.2rem 1rem', fontWeight: '800', textAlign: 'center', color: 'var(--text)', borderRadius: '0 12px 12px 0' }}>
                                                {item.saldo_inicial || 0}
                                            </td>
                                        </>
                                    ) : subview === 'atividade' ? (
                                        <td style={{ padding: '1.2rem 1rem', fontWeight: '700', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '1rem', borderRadius: '12px' }}>
                                            <ChevronRight size={18} style={{ color: 'var(--primary)' }} />
                                            {item.nome}
                                        </td>
                                    ) : (
                                        <>
                                            <td style={{ padding: '1.2rem 1rem', fontWeight: '800', color: 'var(--text)', borderRadius: '12px 0 0 12px' }}>
                                                {item.nome}
                                            </td>
                                            <td style={{ padding: '1.2rem 1rem', fontWeight: '700', color: 'var(--primary)' }}>
                                                {item.variedade || '-'}
                                            </td>
                                            <td style={{ padding: '1.2rem 1rem', fontWeight: '800', color: 'var(--text)', borderRadius: '0 12px 12px 0' }}>
                                                {item.hectares ? `${item.hectares} ha` : '-'}
                                            </td>
                                        </>
                                    )}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div style={{
                padding: '1.5rem 2rem',
                backgroundColor: 'white',
                borderTop: '1px solid rgba(0,0,0,0.06)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: '0 -4px 15px rgba(0,0,0,0.02)'
            }}>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button onClick={handleInsert} className="btn btn-primary" style={{ padding: '0.8rem 2.5rem', borderRadius: '14px' }}>
                        <div className="btn-inner" style={{ fontSize: '0.95rem', fontWeight: '800' }}><Plus size={20} /> Inserir Novo</div>
                    </button>
                    <button
                        onClick={handleEdit}
                        disabled={!selectedId}
                        className="btn btn-outline"
                        style={{ padding: '0.8rem 2rem', borderRadius: '14px', opacity: !selectedId ? 0.3 : 1, transition: 'all 0.3s' }}
                    >
                        <div className="btn-inner" style={{ fontSize: '0.95rem', fontWeight: '800' }}><Edit2 size={18} /> Editar</div>
                    </button>
                    <button
                        onClick={handleDelete}
                        disabled={!selectedId}
                        className="btn btn-outline"
                        style={{ padding: '0.8rem 2rem', borderRadius: '14px', color: '#ef4444', borderColor: '#fee2e2', opacity: !selectedId ? 0.3 : 1, transition: 'all 0.3s' }}
                    >
                        <div className="btn-inner" style={{ fontSize: '0.95rem', fontWeight: '800' }}><Trash2 size={18} /> Excluir</div>
                    </button>
                </div>

                {!selectedId && (
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Filter size={16} />
                        Selecione um item na tabela para editar ou excluir
                    </div>
                )}
            </div>

            {showForm && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(15, 23, 42, 0.6)',
                    backdropFilter: 'blur(8px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 2000,
                    padding: '2rem'
                }}>
                    <div className="premium-card" style={{
                        maxWidth: '700px',
                        width: '100%',
                        padding: '2.5rem',
                        position: 'relative',
                        backgroundColor: 'white',
                        borderRadius: '28px',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                    }}>
                        <button
                            onClick={() => setShowForm(false)}
                            style={{
                                position: 'absolute', top: '1.5rem', right: '1.5rem',
                                background: '#f1f5f9', border: 'none', cursor: 'pointer',
                                borderRadius: '50%', width: '36px', height: '36px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: '#64748b'
                            }}
                        >
                            <X size={20} />
                        </button>

                        <div style={{ marginBottom: '2rem' }}>
                            <h3 style={{ fontSize: '1.8rem', fontWeight: '900', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                {editingItem ? <Edit2 size={24} style={{ color: 'var(--primary)' }} /> : <Plus size={24} style={{ color: 'var(--primary)' }} />}
                                {editingItem ? `Editar ${subview === 'insumos' ? 'Insumo' : subview === 'atividade' ? 'Atividade' : 'Quadra'}` : `Novo ${subview === 'insumos' ? 'Insumo' : subview === 'atividade' ? 'Atividade' : 'Quadra'}`}
                            </h3>
                            <p style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Preencha os dados abaixo.</p>
                        </div>

                        <form onSubmit={handleSave} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            {config.fields.map(field => {
                                if (field.type === 'checkbox') {
                                    return (
                                        <div key={field.name} className="form-group" style={{ gridColumn: field.fullWidth ? '1 / -1' : 'auto', display: 'flex', alignItems: 'center', gap: '10px', marginTop: '0.5rem' }}>
                                            <input
                                                type="checkbox"
                                                id={field.name}
                                                checked={formData[field.name] !== false}
                                                onChange={e => setFormData({ ...formData, [field.name]: e.target.checked })}
                                                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                                            />
                                            <label htmlFor={field.name} style={{ color: 'var(--text)', fontWeight: '800', fontSize: '0.9rem', cursor: 'pointer', margin: 0 }}>
                                                {field.label}
                                            </label>
                                        </div>
                                    );
                                }

                                return (
                                    <div key={field.name} className="form-group" style={{ gridColumn: field.fullWidth ? '1 / -1' : 'auto' }}>
                                        <label style={{ color: 'var(--text)', fontWeight: '800', fontSize: '0.85rem', marginBottom: '0.5rem', display: 'block' }}>{field.label}</label>
                                        <input
                                            type={field.type || 'text'}
                                            className="input-field"
                                            style={{ width: '100%', padding: '0.9rem', borderRadius: '12px' }}
                                            value={formData[field.name] || ''}
                                            onChange={e => setFormData({ ...formData, [field.name]: e.target.value })}
                                            required={field.required}
                                        />
                                    </div>
                                );
                            })}

                            <div style={{ gridColumn: '1 / -1', marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: '1rem', borderRadius: '14px' }}>
                                    <div className="btn-inner" style={{ fontSize: '1.1rem', fontWeight: '900' }}><Save size={22} /> Salvar Alterações</div>
                                </button>
                                <button type="button" onClick={() => setShowForm(false)} className="btn btn-outline" style={{ flex: 1, padding: '1rem', borderRadius: '14px' }}>
                                    <div className="btn-inner" style={{ fontSize: '1.1rem', fontWeight: '900' }}><X size={22} /> Cancelar</div>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
