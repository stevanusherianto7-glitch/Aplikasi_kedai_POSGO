import { supabase } from './lib/supabase';

async function test() {
  console.log('Memulai pengetesan fetch data dari Supabase...');
  const { data, error } = await supabase.from('menu_items').select('*');
  console.log('--- HASIL ---');
  console.log('Data:', data);
  console.log('Error:', error);
}

test();
