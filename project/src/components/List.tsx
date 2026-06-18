import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, Kapak } from '../lib/supabase';
import { Edit2, Trash2, Calendar, Building2, User, Mail, AlertCircle, Filter, X, ChevronDown } from 'lucide-react';

type SortField = 'vaka_tarihi' | 'created_at';
type SortOrder = 'asc' | 'desc';

interface Filters {
  dateFrom: string;
  dateTo: string;
  doktor: string;
  merkez: string;
  kapak_tipi: string;
  kapak_size: string;
  lot_no: string;
}

export default function List() {
  const navigate = useNavigate();
  const [kapaklar, setKapaklar] = useState<Kapak[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    dateFrom: '',
    dateTo: '',
    doktor: '',
    merkez: '',
    kapak_tipi: '',
    kapak_size: '',
    lot_no: '',
  });

  // Unique values for filter dropdowns
  const [uniqueDoktorlar, setUniqueDoktorlar] = useState<string[]>([]);
  const [uniqueMerkezler, setUniqueMerkezler] = useState<string[]>([]);
  const [uniqueLotlar, setUniqueLotlar] = useState<string[]>([]);

  const fetchKapaklar = useCallback(async () => {
    console.log('List verileri yukleniyor...');
    setLoading(true);

    try {
      let query = supabase.from('kapaklar').select('*');

      // Apply filters
      if (filters.dateFrom) query = query.gte('vaka_tarihi', filters.dateFrom);
      if (filters.dateTo) query = query.lte('vaka_tarihi', filters.dateTo);
      if (filters.doktor) query = query.eq('doktor', filters.doktor);
      if (filters.merkez) query = query.eq('merkez_hastane', filters.merkez);
      if (filters.kapak_tipi) query = query.eq('kapak_tipi', filters.kapak_tipi);
      if (filters.kapak_size) query = query.eq('kapak_size', filters.kapak_size);
      if (filters.lot_no) query = query.eq('lot_no', filters.lot_no);

      const { data, error } = await query.order(sortField, { ascending: sortOrder === 'asc' });

      if (error) {
        console.log('Veri yukleme hatasi:', error.message);
      }

      if (data) {
        setKapaklar(data as Kapak[]);

        // Extract unique values for filters
        setUniqueDoktorlar([...new Set(data.map((k) => k.doktor))].sort());
        setUniqueMerkezler([...new Set(data.map((k) => k.merkez_hastane))].sort());
        setUniqueLotlar([...new Set(data.map((k) => k.lot_no))].sort());
      }
    } catch (err) {
      console.error('List yukleme hatasi:', err);
    } finally {
      setLoading(false);
    }
  }, [sortField, sortOrder, filters]);

useEffect(() => {
  const timeout = setTimeout(() => {
    console.log('List yukleme timeout');
    setLoading(false);
  }, 5000);

  fetchKapaklar().finally(() => {
    clearTimeout(timeout);
  });

  return () => clearTimeout(timeout);
}, [fetchKapaklar]);
  const handleDelete = async (id: string) => {
    try {
      await supabase.from('kapaklar').delete().eq('id', id);
      setKapaklar(kapaklar.filter((k) => k.id !== id));
    } catch (err) {
      console.error('Silme hatasi:', err);
    }
    setDeleteConfirm(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  const clearFilters = () => {
    setFilters({
      dateFrom: '',
      dateTo: '',
      doktor: '',
      merkez: '',
      kapak_tipi: '',
      kapak_size: '',
      lot_no: '',
    });
  };

  const hasActiveFilters = Object.values(filters).some((v) => v);

  const getKapakTipiColor = (tipi: string) => {
    switch (tipi) {
      case 'Evolut Pro+':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'Evolut FX':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'Evolut FX+':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default:
        return 'bg-slate-500/20 text-slate-400';
    }
  };

  const FilterSelect = ({
    label,
    value,
    options,
    onChange,
  }: {
    label: string;
    value: string;
    options: string[];
    onChange: (v: string) => void;
  }) => (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2.5 bg-slate-700/50 border border-slate-600 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
    >
      <option value="">{label}</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  );

  if (loading && kapaklar.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Tum Vakalar</h1>
          <p className="text-slate-400">{kapaklar.length} kayit</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${
              showFilters || hasActiveFilters
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                : 'bg-slate-700/50 text-slate-300 border border-slate-600'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span className="text-sm font-medium">Filtreler</span>
            {hasActiveFilters && (
              <span className="w-5 h-5 bg-cyan-500 rounded-full text-xs flex items-center justify-center text-white">
                !
              </span>
            )}
          </button>
          <button
            onClick={() => {
              setSortField(sortField === 'vaka_tarihi' ? 'created_at' : 'vaka_tarihi');
              setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-xl text-slate-300 hover:bg-slate-600/50 transition-all"
          >
            <ChevronDown className={`w-4 h-4 transition-transform ${sortOrder === 'asc' ? 'rotate-180' : ''}`} />
            <span className="text-sm">{sortField === 'vaka_tarihi' ? 'Vaka Tarihi' : 'Olusturma'}</span>
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Filtreleri Uygula</h3>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 text-sm text-red-400 hover:text-red-300"
              >
                <X className="w-4 h-4" />
                Temizle
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            <input
              type="date"
              placeholder="Baslangic"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              className="w-full px-3 py-2.5 bg-slate-700/50 border border-slate-600 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
            <input
              type="date"
              placeholder="Bitis"
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              className="w-full px-3 py-2.5 bg-slate-700/50 border border-slate-600 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
            <FilterSelect
              label="Doktor"
              value={filters.doktor}
              options={uniqueDoktorlar}
              onChange={(v) => setFilters({ ...filters, doktor: v })}
            />
            <FilterSelect
              label="Merkez"
              value={filters.merkez}
              options={uniqueMerkezler}
              onChange={(v) => setFilters({ ...filters, merkez: v })}
            />
            <FilterSelect
              label="Kapak Tipi"
              value={filters.kapak_tipi}
              options={['Evolut Pro+', 'Evolut FX', 'Evolut FX+']}
              onChange={(v) => setFilters({ ...filters, kapak_tipi: v })}
            />
            <FilterSelect
              label="Kapak Size"
              value={filters.kapak_size}
              options={['23 mm', '26 mm', '29 mm', '34 mm']}
              onChange={(v) => setFilters({ ...filters, kapak_size: v })}
            />
            <FilterSelect
              label="Lot No"
              value={filters.lot_no}
              options={uniqueLotlar}
              onChange={(v) => setFilters({ ...filters, lot_no: v })}
            />
          </div>
        </div>
      )}

      {/* Results */}
      {kapaklar.length === 0 && !loading ? (
        <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-8 text-center">
          <p className="text-slate-400 mb-4">Sonuc bulunamadi</p>
          <button
            onClick={() => navigate('/add')}
            className="text-cyan-400 hover:text-cyan-300 font-medium"
          >
            Yeni vaka ekleyin
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {kapaklar.map((kapak) => (
            <div
              key={kapak.id}
              className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-4"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span className="text-white font-medium">{kapak.hasta_adi}</span>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-lg border ${getKapakTipiColor(kapak.kapak_tipi)}`}>
                      {kapak.kapak_tipi}
                    </span>
                    <span className="px-2 py-0.5 text-xs font-medium rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                      {kapak.kapak_size}
                    </span>
                    <span className="px-2 py-0.5 text-xs font-medium rounded-lg bg-slate-600/50 text-slate-300">
                      Lot: {kapak.lot_no}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-cyan-400" />
                      {formatDate(kapak.vaka_tarihi)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-purple-400" />
                      {kapak.merkez_hastane}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <User className="w-4 h-4 text-orange-400" />
                      {kapak.doktor}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => navigate(`/view/${kapak.id}`)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-xl hover:bg-cyan-500/30 transition-all text-sm"
                  >
                    <Mail className="w-4 h-4" />
                    Mail
                  </button>
                  <button
                    onClick={() => navigate(`/edit/${kapak.id}`)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-500/20 text-blue-400 rounded-xl hover:bg-blue-500/30 transition-all text-sm"
                  >
                    <Edit2 className="w-4 h-4" />
                    Duzenle
                  </button>

                  {deleteConfirm === kapak.id ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDelete(kapak.id)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all text-sm"
                      >
                        <AlertCircle className="w-4 h-4" />
                        Onayla
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="px-4 py-2 bg-slate-600 text-slate-200 rounded-xl hover:bg-slate-500 transition-all text-sm"
                      >
                        Iptal
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirm(kapak.id)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30 transition-all text-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                      Sil
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
