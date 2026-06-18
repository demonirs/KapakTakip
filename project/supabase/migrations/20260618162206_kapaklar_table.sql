CREATE TABLE kapaklar (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vaka_tarihi DATE NOT NULL,
  merkez_hastane TEXT NOT NULL,
  doktor TEXT NOT NULL,
  hasta_bilgileri TEXT NOT NULL,
  kapak_size TEXT NOT NULL,
  lot_no TEXT NOT NULL,
  son_kul_tarihi DATE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
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