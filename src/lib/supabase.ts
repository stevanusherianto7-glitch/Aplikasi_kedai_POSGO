import { createClient } from '@supabase/supabase-js';

// Hard-coded credentials to ensure absolute connection reliability in APK build
const supabaseUrl = 'https://mrrfmrzhumcmhmqjceul.supabase.co';
const supabaseAnonKey = 'sb_publishable__YgmAFLxNl1Tr5XmeKikXA_Q1SnPa1f';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
