import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  full_name: string;
  created_at: string;
};

export type Kapak = {
  id: string;
  user_id: string;

  // Vaka Bilgileri
  vaka_tarihi: string;
  merkez_hastane: string;
  doktor: string;
  hasta_adi: string;

  // Kapak Bilgileri
  kapak_tipi: 'Evolut Pro+' | 'Evolut FX' | 'Evolut FX+';
  kapak_size: '23 mm' | '26 mm' | '29 mm' | '34 mm';
  lot_no: string;
  son_kul_tarihi: string;

  // İşlem Bilgileri
  pre_balon: 'Yok' | '18 mm' | '20 mm' | '23 mm' | '25 mm' | '28 mm';
  post_balon: 'Yok' | '18 mm' | '20 mm' | '23 mm' | '25 mm' | '28 mm';
  paravalvuler_ay: 'Yok' | 'Hafif' | 'Orta' | 'Ciddi';
  proglide_adedi: 1 | 2 | 3 | 4;
  crimp_yapan: string;

  created_at: string;
};

export const KAPAK_TIPLERI = ['Evolut Pro+', 'Evolut FX', 'Evolut FX+'] as const;
export const KAPAK_SIZES = ['23 mm', '26 mm', '29 mm', '34 mm'] as const;
export const BALON_SIZES = ['Yok', '18 mm', '20 mm', '23 mm', '25 mm', '28 mm'] as const;
export const PARAVALVULER_OPTIONS = ['Yok', 'Hafif', 'Orta', 'Ciddi'] as const;
export const PROGLIDE_OPTIONS = [1, 2, 3, 4] as const;
