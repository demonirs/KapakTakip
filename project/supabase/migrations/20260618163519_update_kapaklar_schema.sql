-- Create user profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Drop old kapaklar table and recreate with new schema
DROP TABLE IF EXISTS kapaklar CASCADE;

CREATE TABLE kapaklar (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  
  -- Vaka Bilgileri
  vaka_tarihi DATE NOT NULL,
  merkez_hastane TEXT NOT NULL,
  doktor TEXT NOT NULL,
  hasta_adi TEXT NOT NULL,
  
  -- Kapak Bilgileri
  kapak_tipi TEXT NOT NULL CHECK (kapak_tipi IN ('Evolut Pro+', 'Evolut FX', 'Evolut FX+')),
  kapak_size TEXT NOT NULL CHECK (kapak_size IN ('23mm', '26mm', '29mm', '34mm')),
  lot_no TEXT NOT NULL,
  son_kul_tarihi DATE NOT NULL,
  
  -- İşlem Bilgileri
  pre_balon TEXT NOT NULL DEFAULT 'Yok' CHECK (pre_balon IN ('Yok', '18mm', '20mm', '23mm', '25mm', '28mm')),
  post_balon TEXT NOT NULL DEFAULT 'Yok' CHECK (post_balon IN ('Yok', '18mm', '20mm', '23mm', '25mm', '28mm')),
  paravalvuler_ay TEXT NOT NULL DEFAULT 'Yok' CHECK (paravalvuler_ay IN ('Yok', 'Hafif', 'Orta', 'Ciddi')),
  proglide_adedi INTEGER NOT NULL DEFAULT 1 CHECK (proglide_adedi BETWEEN 1 AND 4),
  crimp_yapan TEXT NOT NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE kapaklar ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_kapaklar" ON kapaklar FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_kapaklar" ON kapaklar FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_kapaklar" ON kapaklar FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_kapaklar" ON kapaklar FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_kapaklar_vaka_tarihi ON kapaklar(vaka_tarihi);
CREATE INDEX idx_kapaklar_merkez ON kapaklar(merkez_hastane);
CREATE INDEX idx_kapaklar_doktor ON kapaklar(doktor);
CREATE INDEX idx_kapaklar_lot_no ON kapaklar(lot_no);
CREATE INDEX idx_kapaklar_kapak_tipi ON kapaklar(kapak_tipi);
CREATE INDEX idx_kapaklar_kapak_size ON kapaklar(kapak_size);
CREATE INDEX idx_kapaklar_user_id ON kapaklar(user_id);
CREATE INDEX idx_kapaklar_created_at ON kapaklar(created_at);