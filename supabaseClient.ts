
import { createClient } from '@supabase/supabase-js';

// SUBSTITUA PELAS SUAS CREDENCIAIS DO SUPABASE
// Você encontra isso em Project Settings -> API
const SUPABASE_URL = 'SUA_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'SUA_SUPABASE_ANON_KEY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
