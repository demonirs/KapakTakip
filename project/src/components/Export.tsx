import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, Kapak } from '../lib/supabase';
import * as XLSX from 'xlsx';
import { Download, FileSpreadsheet, ArrowLeft, Check } from 'lucide-react';

export default function Export() {
  const navigate = useNavigate();
  const [kapaklar, setKapaklar] = useState<Kapak[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exported, setExported] = useState(false);

  const fetchKapaklar = useCallback(async () => {
    console.log('Export verileri yukleniyor...');

    try {
      const { data, error } = await supabase
        .from('kapaklar')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.log('Export hatasi:', error.message);
      }

      setKapaklar((data as Kapak[]) || []);
    } catch (err) {
      console.error('Export yukleme hatasi:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (loading) {
        console.log('Export yukleme timeout');
        setLoading(false);
      }
    }, 5000);

    fetchKapaklar().then(() => clearTimeout(timeout));

    return () => clearTimeout(timeout);
  }, [fetchKapaklar, loading]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  const handleExport = () => {
    setExporting(true);

    try {
      const exportData = kapaklar.map((k, index) => ({
        'No': index + 1,
        'Vaka Tarihi': formatDate(k.vaka_tarihi),
        'Merkez': k.merkez_hastane,
        'Doktor': k.doktor,
        'Hasta Adi': k.hasta_adi,
        'Kapak Tipi': k.kapak_tipi,
        'Kapak Size': k.kapak_size,
        'Lot No': k.lot_no,
        'Son Kullanma Tarihi': formatDate(k.son_kul_tarihi),
        'Pre Balon': k.pre_balon,
        'Post Balon': k.post_balon,
        'Paravalvuler AY': k.paravalvuler_ay,
        'Proglide Adedi': k.proglide_adedi,
        'Crimp Yapan': k.crimp_yapan,
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Kapaklar');

      const colWidths = [
        { wch: 5 },
        { wch: 12 },
        { wch: 30 },
        { wch: 25 },
        { wch: 25 },
        { wch: 15 },
        { wch: 12 },
        { wch: 15 },
        { wch: 20 },
        { wch: 12 },
        { wch: 12 },
        { wch: 15 },
        { wch: 15 },
        { wch: 25 },
      ];
      ws['!cols'] = colWidths;

      XLSX.writeFile(wb, `Fokus_KapakTakip_${new Date().toISOString().split('T')[0]}.xlsx`);

      setExported(true);
      setTimeout(() => setExported(false), 3000);
    } catch (err) {
      console.error('Excel export hatasi:', err);
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        Geri
      </button>

      <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-700/50 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-500/20 to-teal-500/10 rounded-2xl mx-auto flex items-center justify-center mb-4">
            <FileSpreadsheet className="w-10 h-10 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Excel'e Aktar</h1>
          <p className="text-slate-400">Tum kayitlari Excel dosyasi olarak indirin</p>
        </div>

        <div className="p-6">
          <div className="bg-slate-700/30 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Toplam Kayit</span>
              <span className="text-2xl font-bold text-white">{kapaklar.length}</span>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <p className="text-sm text-slate-400">Excel dosyasinda asagidaki sutunlar bulunacaktir:</p>
            <div className="grid grid-cols-2 gap-2 text-sm text-slate-300">
              <span>* Vaka Tarihi</span>
              <span>* Merkez</span>
              <span>* Doktor</span>
              <span>* Hasta Adi</span>
              <span>* Kapak Tipi</span>
              <span>* Kapak Size</span>
              <span>* Lot No</span>
              <span>* Son Kullanma Tarihi</span>
              <span>* Pre Balon</span>
              <span>* Post Balon</span>
              <span>* Paravalvuler AY</span>
              <span>* Proglide Adedi</span>
              <span>* Crimp Yapan</span>
            </div>
          </div>

          <button
            onClick={handleExport}
            disabled={exporting || kapaklar.length === 0}
            className={`w-full flex items-center justify-center gap-3 py-4 rounded-xl font-semibold transition-all ${
              exported
                ? 'bg-emerald-500 text-white'
                : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {exported ? (
              <>
                <Check className="w-5 h-5" />
                Indirildi
              </>
            ) : exporting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Hazirlaniyor...
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                Excel Olarak Indir
              </>
            )}
          </button>

          {kapaklar.length === 0 && (
            <p className="text-center text-slate-400 mt-4">
              Disa aktarilacak kayit bulunamadi
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
