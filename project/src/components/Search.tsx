import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, Kapak } from '../lib/supabase';
import { Search as SearchIcon, Building2, User, Hash, Mail } from 'lucide-react';

type SearchType = 'hasta' | 'doktor' | 'merkez' | 'lot';

export default function Search() {
  const navigate = useNavigate();
  const [searchType, setSearchType] = useState<SearchType>('hasta');
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<Kapak[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;

    setLoading(true);
    setSearched(true);

    const columnMap: Record<SearchType, string> = {
      hasta: 'hasta_adi',
      doktor: 'doktor',
      merkez: 'merkez_hastane',
      lot: 'lot_no',
    };

    const { data } = await supabase
      .from('kapaklar')
      .select('*')
      .ilike(columnMap[searchType], `%${searchTerm}%`)
      .order('created_at', { ascending: false });

    setResults((data as Kapak[]) || []);
    setLoading(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

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

  const searchTypes: { key: SearchType; label: string; icon: typeof User }[] = [
    { key: 'hasta', label: 'Hasta Adi', icon: User },
    { key: 'doktor', label: 'Doktor', icon: User },
    { key: 'merkez', label: 'Merkez', icon: Building2 },
    { key: 'lot', label: 'Lot No', icon: Hash },
  ];

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div className="text-center py-4">
        <h1 className="text-2xl font-bold text-white mb-2">Vaka Arama</h1>
        <p className="text-slate-400">Hasta adi, doktor, merkez veya lot numarasi ile arayin</p>
      </div>

      {/* Search Type Selection */}
      <div className="flex flex-wrap gap-2 justify-center">
        {searchTypes.map((type) => {
          const Icon = type.icon;
          return (
            <button
              key={type.key}
              onClick={() => setSearchType(type.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
                searchType === type.key
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'bg-slate-700/50 text-slate-300 border border-slate-600 hover:border-slate-500'
              }`}
            >
              <Icon className="w-4 h-4" />
              {type.label}
            </button>
          );
        })}
      </div>

      {/* Search Input */}
      <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-4">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder={`${searchTypes.find((t) => t.key === searchType)?.label} ile ara...`}
              className="w-full pl-12 pr-4 py-4 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading}
            className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-xl shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all disabled:opacity-50"
          >
            {loading ? 'Ara...' : 'Ara'}
          </button>
        </div>
      </div>

      {/* Results */}
      {searched && (
        <div className="space-y-4">
          <p className="text-slate-400 text-sm">
            {results.length} sonuc bulundu
          </p>

          {results.length === 0 ? (
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-8 text-center">
              <p className="text-slate-400">Sonuc bulunamadi</p>
            </div>
          ) : (
            <div className="space-y-3">
              {results.map((kapak) => (
                <div
                  key={kapak.id}
                  className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-4"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
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

                      <div className="flex items-center gap-4 text-sm text-slate-400">
                        <span className="flex items-center gap-1.5">
                          <Building2 className="w-4 h-4" />
                          {kapak.merkez_hastane}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <User className="w-4 h-4" />
                          {kapak.doktor}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="text-right mr-4">
                        <p className="text-xs text-slate-500">Vaka Tarihi</p>
                        <p className="text-sm text-white">{formatDate(kapak.vaka_tarihi)}</p>
                      </div>
                      <button
                        onClick={() => navigate(`/view/${kapak.id}`)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-xl hover:bg-cyan-500/30 transition-all text-sm"
                      >
                        <Mail className="w-4 h-4" />
                        Mail
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
