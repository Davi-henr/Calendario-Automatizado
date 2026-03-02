import { supabase } from './supabase';
import { addDays, format, parse } from 'date-fns';

export const registrosService = {
    async getAll() {
        const { data, error } = await supabase
            .from('registros')
            .select('*')
            .order('data_inicial', { ascending: false });

        if (error) throw error;
        return data;
    },

    async create(registro) {
        const { data: { user } } = await supabase.auth.getUser();

        // Initial status is 'Iniciada' usually
        const { data, error } = await supabase
            .from('registros')
            .insert([{
                ...registro,
                user_id: user.id,
                situacao: registro.situacao || 'Iniciada'
            }])
            .select();

        if (error) throw error;
        return data[0];
    },

    async update(id, updates) {
        // 1. Extraímos o comando "nao_agendar" para não ser enviado ao Supabase
        const { nao_agendar, ...dadosParaSalvar } = updates;

        // 2. Se estamos finalizando, calculamos a próxima data de pulverização
        if (dadosParaSalvar.situacao === 'Finalizada' && dadosParaSalvar.data_final) {
            // Se o utilizador marcou a checkbox para NÃO agendar
            if (nao_agendar) {
                dadosParaSalvar.proxima_pulverizacao = null; 
            } else {
                // Comportamento normal: busca a carência e soma à data final
                const { data: current } = await supabase.from('registros').select('dias_carencia').eq('id', id).single();
                const carencia = dadosParaSalvar.dias_carencia || current?.dias_carencia || 0;

                const dateInput = parse(dadosParaSalvar.data_final, 'yyyy-MM-dd', new Date());
                const nextSprayingDate = addDays(dateInput, parseInt(carencia));
                dadosParaSalvar.proxima_pulverizacao = format(nextSprayingDate, 'yyyy-MM-dd');
            }
        }

        // 3. Enviamos para o banco apenas os 'dadosParaSalvar', sem a coluna que não existe
        const { data, error } = await supabase
            .from('registros')
            .update(dadosParaSalvar)
            .eq('id', id)
            .select();

        if (error) throw error;
        return data[0];
    },

    async delete(id) {
        const { error } = await supabase
            .from('registros')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};

export const chuvasService = {
    async getAll() {
        const { data, error } = await supabase
            .from('chuvas')
            .select('*')
            .order('data', { ascending: false });

        if (error) throw error;
        return data;
    },

    async create(chuva) {
        const { data: { user } } = await supabase.auth.getUser();
        const { data, error } = await supabase
            .from('chuvas')
            .insert([{ ...chuva, user_id: user.id }])
            .select();

        if (error) throw error;
        return data[0];
    },

    async delete(id) {
        const { error } = await supabase
            .from('chuvas')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};

export const settingsService = {
    async get() {
        const { data, error } = await supabase
            .from('system_settings')
            .select('*')
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data || { logo_url: null };
    },

    async updateLogo(logoUrl) {
        const { data, error } = await supabase
            .from('system_settings')
            .upsert({ id: 1, logo_url: logoUrl })
            .select();

        if (error) throw error;
        return data[0];
    },

    async updateMapSvg(svgCode) {
        const { data, error } = await supabase
            .from('system_settings')
            .upsert({ id: 1, map_svg: svgCode })
            .select();

        if (error) throw error;
        return data[0];
    }
};

export const osService = {
    async getAll() {
        const { data, error } = await supabase
            .from('ordens_servico')
            .select(`
                *,
                registros(id, data_final, quantidade_bombas, pes_tratados)
            `)
            .order('data_prescricao', { ascending: false });
        if (error) throw error;
        return data;
    },

    async create(os) {
        const { data: { user } } = await supabase.auth.getUser();
        const { data, error } = await supabase
            .from('ordens_servico')
            .insert([{
                ...os,
                user_id: user.id,
                situacao: os.situacao || 'Pendente' // Default to Pendente
            }])
            .select();

        if (error) throw error;
        return data[0];
    },

    async update(id, updates) {
        const { data, error } = await supabase
            .from('ordens_servico')
            .update(updates)
            .eq('id', id)
            .select();

        if (error) throw error;
        return data[0];
    },

    async delete(id) {
        // First unbind any linked stock outbounds to avoid FK violation
        await supabase.from('ordens_saida').update({ os_id: null }).eq('os_id', id);

        const { error } = await supabase
            .from('ordens_servico')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    async getPending() {
        const { data, error } = await supabase
            .from('ordens_servico')
            .select('*, ordens_saida(id, situacao)')
            .or('situacao.is.null,situacao.eq.Pendente,situacao.eq.PENDENTE,situacao.eq.Iniciada,situacao.eq.Parcial')
            .order('data_prescricao', { ascending: false });

        if (error) throw error;
        return data;
    }
};

export const insumosService = {
    async getAll() {
        const { data, error } = await supabase
            .from('insumos')
            .select('*')
            .order('insumo', { ascending: true });

        if (error) throw error;
        return data;
    },

    async create(insumo) {
        const { data, error } = await supabase
            .from('insumos')
            .insert([insumo])
            .select();

        if (error) throw error;
        return data[0];
    },

    async update(id, updates) {
        const { data, error } = await supabase
            .from('insumos')
            .update(updates)
            .eq('id', id)
            .select();

        if (error) throw error;
        return data[0];
    },

    async delete(id) {
        const { error } = await supabase
            .from('insumos')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    async bulkCreate(insumos) {
        const { data, error } = await supabase
            .from('insumos')
            .insert(insumos)
            .select();

        if (error) throw error;
        return data;
    }
};

export const quadrasService = {
    async getAll() {
        const { data, error } = await supabase
            .from('quadras')
            .select('*')
            .order('nome', { ascending: true });
        if (error) throw error;
        return data;
    },

    async create(quadra) {
        const { data, error } = await supabase
            .from('quadras')
            .insert([quadra])
            .select();
        if (error) throw error;
        return data[0];
    },

    async update(id, updates) {
        const { data, error } = await supabase
            .from('quadras')
            .update(updates)
            .eq('id', id)
            .select();
        if (error) throw error;
        return data[0];
    },

    async delete(id) {
        const { error } = await supabase
            .from('quadras')
            .delete()
            .eq('id', id);
        if (error) throw error;
    },

    async bulkCreate(quadras) {
        const { data, error } = await supabase
            .from('quadras')
            .insert(quadras)
            .select();
        if (error) throw error;
        return data;
    }
};

export const atividadesService = {
    async getAll() {
        const { data, error } = await supabase
            .from('atividades')
            .select('*')
            .order('nome', { ascending: true });
        if (error) throw error;
        return data;
    },

    async create(atividade) {
        const { data, error } = await supabase
            .from('atividades')
            .insert([atividade])
            .select();
        if (error) throw error;
        return data[0];
    },

    async update(id, updates) {
        const { data, error } = await supabase
            .from('atividades')
            .update(updates)
            .eq('id', id)
            .select();
        if (error) throw error;
        return data[0];
    },

    async delete(id) {
        const { error } = await supabase
            .from('atividades')
            .delete()
            .eq('id', id);
        if (error) throw error;
    },

    async bulkCreate(atividades) {
        const { data, error } = await supabase
            .from('atividades')
            .insert(atividades)
            .select();
        if (error) throw error;
        return data;
    }
};

export const entradasService = {
    async getAll() {
        const { data, error } = await supabase
            .from('entradas')
            .select('*, insumos(insumo)')
            .order('data_entrada', { ascending: false });
        if (error) throw error;
        return data;
    },
    async create(entrada) {
        const { data, error } = await supabase.from('entradas').insert([entrada]).select();
        if (error) throw error;
        return data[0];
    },
    async update(id, updates) {
        const { data, error } = await supabase.from('entradas').update(updates).eq('id', id).select();
        if (error) throw error;
        return data[0];
    },
    async delete(id) {
        const { error } = await supabase.from('entradas').delete().eq('id', id);
        if (error) throw error;
    }
};

export const pedidosService = {
    async getAll() {
        const { data, error } = await supabase
            .from('pedidos')
            .select('*, insumos(insumo, classificacao)')
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    },
    async create(pedido) {
        const { data, error } = await supabase.from('pedidos').insert([pedido]).select();
        if (error) throw error;
        return data[0];
    },
    async update(id, updates) {
        const { data, error } = await supabase.from('pedidos').update(updates).eq('id', id).select();
        if (error) throw error;
        return data[0];
    },
    async delete(id) {
        const { error } = await supabase.from('pedidos').delete().eq('id', id);
        if (error) throw error;
    }
};

export const saidasService = {
    async getAll() {
        const { data, error } = await supabase
            .from('saidas')
            .select('*, insumos(insumo, codigo), quadras(nome), atividades(nome), ordens_saida(*)')
            .order('data_saida', { ascending: false });
        if (error) throw error;
        return data;
    },
    async create(saida) {
        const { data, error } = await supabase.from('saidas').insert([saida]).select();
        if (error) throw error;
        return data[0];
    },
    async update(id, updates) {
        const { data, error } = await supabase.from('saidas').update(updates).eq('id', id).select();
        if (error) throw error;
        return data[0];
    },
    async delete(id) {
        const { error } = await supabase.from('saidas').delete().eq('id', id);
        if (error) throw error;
    }
};

export const ordensSaidaService = {
    async getAll() {
        const { data, error } = await supabase
            .from('ordens_saida')
            .select('*, quadras(nome), atividades(nome), saidas(*, insumos(insumo, codigo))')
            .order('data', { ascending: false });
        if (error) throw error;
        return data;
    },

    async create(header, items) {
        // 1. Create header
        const { data: headerData, error: headerError } = await supabase
            .from('ordens_saida')
            .insert([{
                ...header,
                os_id: header.os_id || null // Link back to prescription if available
            }])
            .select();

        if (headerError) throw headerError;
        const headerId = headerData[0].id;

        // 2. Create items linked to header
        const itemsWithHeader = items.map(item => ({
            insumo_id: item.insumo_id,
            dosagem: item.dosagem,
            quantidade: item.quantidade,
            quantidade_sobra: item.quantidade_sobra || 0,
            ordem_saida_id: headerId,
            data_saida: header.data,
            quadra_id: header.quadra_id,
            atividade_id: header.atividade_id
        }));

        const { data: itemsData, error: itemsError } = await supabase
            .from('saidas')
            .insert(itemsWithHeader)
            .select();

        if (itemsError) throw itemsError;

        return { header: headerData[0], items: itemsData };
    },

    async update(id, headerUpdates, itemsUpdates) {
        // 1. Update header
        const { error: headerError } = await supabase
            .from('ordens_saida')
            .update(headerUpdates)
            .eq('id', id);

        if (headerError) throw headerError;

        // 2. Update items if provided
        if (itemsUpdates && itemsUpdates.length > 0) {
            for (const item of itemsUpdates) {
                const { error: itemError } = await supabase
                    .from('saidas')
                    .update({
                        insumo_id: item.insumo_id,
                        dosagem: item.dosagem,
                        quantidade: item.quantidade,
                        quantidade_sobra: item.quantidade_sobra,
                        devolucao: item.devolucao,
                        observacao_divergencia: item.observacao_divergencia
                    })
                    .eq('id', item.id);
                if (itemError) throw itemError;
            }
        }
    },

    async getById(id) {
        const { data, error } = await supabase
            .from('ordens_saida')
            .select('*, quadras(nome), atividades(nome), saidas(*, insumos(insumo, codigo))')
            .eq('id', id)
            .single();
        if (error) throw error;
        return data;
    },

    async delete(id) {
        const { error } = await supabase.from('ordens_saida').delete().eq('id', id);
        if (error) throw error;
    },
    async getByOsId(osId) {
        if (!osId) return [];
        const { data, error } = await supabase
            .from('ordens_saida')
            .select('*, saidas(*, insumos(insumo, codigo))')
            .eq('os_id', osId);
        if (error) throw error;
        return data;
    },
    async getPumpsSummary(osId) {
        if (!osId) return 0;
        const { data, error } = await supabase
            .from('ordens_saida')
            .select('bombas_aplicadas')
            .eq('os_id', osId);
        if (error) throw error;
        return data.reduce((sum, item) => sum + (parseFloat(item.bombas_aplicadas) || 0), 0);
    }
};
