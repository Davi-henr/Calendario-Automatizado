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
        // If we are finalizing, calculate the next spraying date
        if (updates.situacao === 'Finalizada' && updates.data_final) {
            const { data: current } = await supabase.from('registros').select('dias_carencia').eq('id', id).single();
            const carencia = updates.dias_carencia || current?.dias_carencia || 0;

            const dateInput = parse(updates.data_final, 'yyyy-MM-dd', new Date());
            const nextSprayingDate = addDays(dateInput, parseInt(carencia));
            updates.proxima_pulverizacao = format(nextSprayingDate, 'yyyy-MM-dd');
        }

        const { data, error } = await supabase
            .from('registros')
            .update(updates)
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
