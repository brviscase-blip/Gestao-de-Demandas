
import { createClient } from '@supabase/supabase-js';

// CREDENCIAIS DO SUPABASE
const SUPABASE_URL = 'https://fvjbrwywixgtdiuxtudt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2amJyd3l3aXhndGRpdXh0dWR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDAxNjEwOSwiZXhwIjoyMDc5NTkyMTA5fQ.78eqLtDPX1mz5DGrEWemgelbZjUvI9or2EactoKHaIM';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
