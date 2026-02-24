import React from 'react';
import { Sprout } from 'lucide-react';

// Shared page header with company logo + gradient title underline
// Usage: <PageHeader title="Gestão de Lançamentos" subtitle="Controle diário..." logo={logo} />
export default function PageHeader({ title, subtitle, logo }) {
    return (
        <div className="page-header">
            {logo ? (
                <img src={logo} alt="Logo" className="page-logo" />
            ) : (
                <div
                    className="page-logo-placeholder"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                    <Sprout size={20} color="white" />
                </div>
            )}
            <div className="page-title-block">
                <h2 className="page-title">{title}</h2>
                {subtitle && <p className="page-subtitle">{subtitle}</p>}
            </div>
        </div>
    );
}
