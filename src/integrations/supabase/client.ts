// Este arquivo foi gerado para centralizar a conexão com o banco de dados.
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://kzugjtdsgxckpimedktw.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_bGN5VNSMI5RaDLLUsCJF9Q_dF7HSHDQ";

// Cliente Supabase que deve ser importado em todo o projeto para consultas ao banco
export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);