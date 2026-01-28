
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hrybqjomrcmwdxfdhrmh.supabase.co';
const supabaseAnonKey = 'sb_publishable_RDeGw0uDoZCLDeNUtYAcEg_TDX42vDA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
