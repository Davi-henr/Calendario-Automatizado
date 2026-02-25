import React, { useState, useMemo } from 'react';
import {
    Info,
    Droplets,
    Droplet,
    Calendar,
    Maximize2,
    Minimize2,
    Upload,
    CheckCircle,
    Clock,
    AlertTriangle,
    Wind,
    MousePointer2,
    X,
    Save,
    FileCode
} from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';

// Stylized SVG paths for the quadras based on the provided layout
// Note: These are rough approximations to create the farm shape programmatically.
// This original path from the user contains multiple sub-paths separated by 'm' or 'M'.
// We split them to make each section interactive.
const RAW_SVG_DATA = `M100 100 L200 100 L200 200 L100 200 Z`;

// Split the giant raw data into individual paths
const splitPaths = RAW_SVG_DATA.split(/([mM])/g).filter(s => s.trim().length > 1);
const QUADRA_PATHS = [];
let currentPrefix = '';

for (let i = 0; i < splitPaths.length; i++) {
    const val = splitPaths[i];
    if (val === 'm' || val === 'M') {
        currentPrefix = val;
    } else {
        QUADRA_PATHS.push({
            id: `part-${QUADRA_PATHS.length}`,
            name: '', // Will be mapped below
            d: currentPrefix + val
        });
    }
}

// Map known quadra IDs to the split segments (based on visual order in the mesh)
const MAPPING = ['outline', '022', '018', '034', '001', '002', '003', '008', '007', '006A', '006B', '017', '024', '005A', '005B', '005C', '030', '031', '032', '033', '004', '009', '010', '011', '012', '013', '025', '019', '029', '028', '027', '026', '020', '021', '014', '015', '016'];
QUADRA_PATHS.forEach((p, idx) => {
    if (MAPPING[idx]) {
        p.name = MAPPING[idx];
        p.id = MAPPING[idx];
    }
});

export default function InteractiveMap({ registros = [], chuvas = [] }) {
    const [selectedQuadra, setSelectedQuadra] = useState(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [hoveredQuadra, setHoveredQuadra] = useState(null);

    // Calculate status for each quadra
    const quadraStats = useMemo(() => {
        const stats = {};

        // Quadras from the SVG
        const uniqueQuadras = [...new Set(QUADRA_PATHS.map(p => p.name))];

        uniqueQuadras.forEach(qName => {
            // Latest finalized record
            const history = registros
                .filter(r => r.quadra?.toString() === qName.toString() && r.situacao === 'Finalizada')
                .sort((a, b) => new Date(b.data_final) - new Date(a.data_final));

            const lastRecord = history[0];

            // Pending prescriptions
            const pendingRec = registros.some(r =>
                r.quadra?.toString() === qName.toString() &&
                r.situacao !== 'Finalizada'
            );

            // Latest rain
            const lastRain = chuvas
                .filter(c => c.local?.toString().toLowerCase().includes(qName.toLowerCase()) || c.local === 'Sede')
                .sort((a, b) => new Date(b.data) - new Date(a.data))[0];

            // Determine status color
            let color = '#f1f5f9'; // Grey (no data)
            let status = 'Sem Dados';
            let icon = <Info size={14} />;

            if (lastRecord) {
                const daysSince = differenceInDays(new Date(), parseISO(lastRecord.data_final));
                if (daysSince <= 7) {
                    color = '#dcfce7'; // Light Green
                    status = 'Tratado (Recente)';
                    icon = <CheckCircle size={14} color="#16a34a" />;
                } else if (daysSince <= 15) {
                    color = '#fef9c3'; // Light Yellow
                    status = 'Tratado (Atenção)';
                    icon = <Clock size={14} color="#ca8a04" />;
                } else {
                    color = '#ffedd5'; // Light Orange
                    status = 'Tratado (Necessita)';
                    icon = <AlertTriangle size={14} color="#ea580c" />;
                }
            }

            if (pendingRec) {
                // Overlay orange if has pending
                status = 'Prescrição Pendente';
                color = '#ffedd5';
            }

            stats[qName] = { lastRecord, lastRain, status, color, icon, daysSince: lastRecord ? differenceInDays(new Date(), parseISO(lastRecord.data_final)) : null };
        });

        return stats;
    }, [registros, chuvas]);

    const handleQuadraClick = (qName) => {
        setSelectedQuadra(qName === selectedQuadra ? null : qName);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: isFullscreen ? '100vh' : 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: '900' }}>
                    <MousePointer2 size={20} color="var(--primary)" /> Mapa Interativo da Fazenda
                </h4>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                        className="btn btn-outline"
                        style={{ padding: '0.5rem' }}
                        onClick={() => setIsFullscreen(!isFullscreen)}
                    >
                        <div className="btn-inner">{isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}</div>
                    </button>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                {/* Map Container */}
                <div className="premium-card glass" style={{
                    flex: '2', minWidth: '300px', padding: '2rem', position: 'relative',
                    display: 'flex', justifyContent: 'center', overflow: 'hidden',
                    backgroundColor: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(10px)'
                }}>
                    <svg
                        viewBox="0 0 400 497"
                        style={{ width: '100%', height: 'auto', maxHeight: '100%', filter: 'drop-shadow(0 15px 25px rgba(0,0,0,0.1))' }}
                    >
                        <g transform="translate(0,497) scale(0.1,-0.1)">
                            {QUADRA_PATHS.map((path) => {
                                const stat = quadraStats[path.name] || {};
                                const isSelected = selectedQuadra === path.name;
                                const isHovered = hoveredQuadra === path.name;

                                return (
                                    <path
                                        key={path.id}
                                        d={path.d}
                                        fill={isSelected ? 'var(--primary-light)' : (isHovered ? '#cbd5e1' : (path.name === 'outline' ? 'none' : stat.color || '#f1f5f9'))}
                                        stroke={isSelected ? 'var(--primary)' : '#64748b'}
                                        strokeWidth={isSelected ? '60' : '20'}
                                        style={{ cursor: 'pointer', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)' }}
                                        onClick={() => handleQuadraClick(path.name)}
                                        onMouseEnter={() => setHoveredQuadra(path.name)}
                                        onMouseLeave={() => setHoveredQuadra(null)}
                                    />
                                );
                            })}
                        </g>

                        {/* Labels */}
                        {QUADRA_PATHS.filter(p => !!p.name && p.name !== 'outline').map((path) => {
                            const points = path.d.match(/(\d+)/g) || [];
                            let xTotal = 0, yTotal = 0, count = 0;
                            for (let i = 0; i < points.length; i += 2) {
                                xTotal += parseInt(points[i]);
                                yTotal += parseInt(points[i + 1]);
                                count++;
                            }
                            const labelX = (xTotal / count) * 0.1;
                            const labelY = 497 - (yTotal / count) * 0.1;

                            return (
                                <text
                                    key={path.id + '-label'}
                                    x={labelX}
                                    y={labelY}
                                    fontSize="8"
                                    fontWeight="900"
                                    textAnchor="middle"
                                    fill={selectedQuadra === path.name ? 'white' : (hoveredQuadra === path.name ? 'var(--primary)' : '#475569')}
                                    style={{
                                        pointerEvents: 'none',
                                        textShadow: '0 0 3px white, 0 0 1px rgba(0,0,0,0.2)',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    {path.name}
                                </text>
                            );
                        })}
                    </svg>
                </div>

                {/* Sidebar Info */}
                <div style={{ flex: '1', minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {selectedQuadra ? (
                        <div className="premium-card" style={{ animation: 'slideInRight 0.3s ease', borderLeft: '6px solid var(--primary)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h3 style={{ fontSize: '1.8rem', fontWeight: '900' }}>Quadra {selectedQuadra}</h3>
                                <button onClick={() => setSelectedQuadra(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}>
                                    <X size={20} />
                                </button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                                <div style={{ padding: '1rem', backgroundColor: quadraStats[selectedQuadra].color, borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                    {quadraStats[selectedQuadra].icon}
                                    <span style={{ fontWeight: '800', fontSize: '0.85rem' }}>{quadraStats[selectedQuadra].status}</span>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div className="stat-card" style={{ padding: '0.8rem', backgroundColor: '#f8fafc', borderRadius: '10px' }}>
                                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: '800', textTransform: 'uppercase' }}>Última Chuva</div>
                                        <div style={{ fontSize: '1rem', fontWeight: '900' }}>{quadraStats[selectedQuadra].lastRain ? `${quadraStats[selectedQuadra].lastRain.mm} mm` : 'N/A'}</div>
                                    </div>
                                    <div className="stat-card" style={{ padding: '0.8rem', backgroundColor: '#f8fafc', borderRadius: '10px' }}>
                                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: '800', textTransform: 'uppercase' }}>Dias s/ Tratam.</div>
                                        <div style={{ fontSize: '1rem', fontWeight: '900' }}>{quadraStats[selectedQuadra].daysSince !== null ? `${quadraStats[selectedQuadra].daysSince} d` : 'N/A'}</div>
                                    </div>
                                </div>

                                {quadraStats[selectedQuadra].lastRecord && (
                                    <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
                                        <div style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '0.8rem' }}>HISTÓRICO RECENTE</div>
                                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', marginBottom: '0.6rem' }}>
                                            <Calendar size={14} style={{ marginTop: '0.2rem' }} />
                                            <div>
                                                <div style={{ fontSize: '0.85rem', fontWeight: '700' }}>{quadraStats[selectedQuadra].lastRecord.receita}</div>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Finalizado em {format(parseISO(quadraStats[selectedQuadra].lastRecord.data_final), 'dd/MM/yyyy')}</div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <button className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
                                    <div className="btn-inner">Ver Ficha Completa</div>
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="premium-card glass" style={{ textAlign: 'center', padding: '3rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.7 }}>
                            <MousePointer2 size={48} style={{ color: 'var(--primary)', marginBottom: '1.5rem', opacity: 0.2 }} />
                            <p style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-muted)' }}>Selecione uma quadra no mapa para visualizar os detalhes e o status atual.</p>
                        </div>
                    )}

                    {/* Legend */}
                    <div className="premium-card">
                        <div style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '1rem', textTransform: 'uppercase' }}>Legenda de Status</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                <div style={{ width: '14px', height: '14px', borderRadius: '4px', backgroundColor: '#dcfce7', border: '1px solid #16a34a' }}></div>
                                <span style={{ fontSize: '0.75rem', fontWeight: '700' }}>Tratado (até 7 dias)</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                <div style={{ width: '14px', height: '14px', borderRadius: '4px', backgroundColor: '#fef9c3', border: '1px solid #ca8a04' }}></div>
                                <span style={{ fontSize: '0.75rem', fontWeight: '700' }}>Tratado (8 a 15 dias)</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                <div style={{ width: '14px', height: '14px', borderRadius: '4px', backgroundColor: '#ffedd5', border: '1px solid #ea580c' }}></div>
                                <span style={{ fontSize: '0.75rem', fontWeight: '700' }}>Transbordado / Pendente</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
