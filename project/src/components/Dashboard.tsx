import { useState, useEffect, useCallback } from 'react';
import { supabase, Kapak } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Activity, Building2, User, Calendar, Layers, Plus, ArrowRight, TrendingUp } from 'lucide-react';

interface MonthlyStats {
  totalCases: number;
  monthlyCases: number;
  monthlyCenters: number;
  monthlyDoctors: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<MonthlyStats>({
    totalCases: 0,
    monthlyCases: 0,
    monthlyCenters: 0,
    monthlyDoctors: 0,
  });
  const [recentKapaklar, setRecentKapaklar] = useState<Kapak[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    console.log('Dashboard verileri yukleniyor...');

    try {
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

      // Total cases
      const { count: totalCount, error: countError } = await supabase
        .from('kapaklar')
        .select('*', { count: 'exact', head: true });

      if (countError) {
        console.log('Toplam vaka hatasi:', countError.message);
      }

      // Monthly cases
      const { data: monthlyData, error: monthlyError } = await supabase
        .from('kapaklar')
        .select('merkez_hastane, doktor')
        .gte('vaka_tarihi', firstDayOfMonth);

      if (monthlyError) {
        console.log('Aylik veri hatasi:', monthlyError.message);
      }

      // Recent 10 cases
      const { data: recentData, error: recentError } = await supabase
        .from('kapaklar')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (recentError) {
        console.log('Son vakalar hatasi:', recentError.message);
        throw recentError;
      }

      const uniqueCenters = new Set(monthlyData?.map((k) => k.merkez_hastane) || []);
      const uniqueDoctors = new Set(monthlyData?.map((k) => k.doktor) || []);

      setStats({
        totalCases: totalCount || 0,
        monthlyCases: monthlyData?.length || 0,
        monthlyCenters: uniqueCenters.size,
        monthlyDoctors: uniqueDoctors.size,
      });

      setRecentKapaklar((recentData as Kapak[]) || []);
      setError(null);
    } catch (err) {
      console.error('Veri yukleme hatasi:', err);
      setError('Veriler yuklenirken hata olustu');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
  if (!user) {
    setLoading(false);
    return;
  }

  setLoading(true);

  const timeout = setTimeout(() => {
    console.log('Dashboard yukleme timeout');
    setLoading(false);
  }, 5000);

  fetchData().finally(() => {
    clearTimeout(timeout);
  });

  return () => clearTimeout(timeout);
}, [user, fetchData]);
        }
      }, 5000);

      fetchData().then(() => clearTimeout(timeout));

      return () => clearTimeout(timeout);
    }
  }, [user, fetchData]);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-4">
        <div className="bg-slate-800/40 border border-red-500/30 rounded-2xl p-8 text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => {
              setLoading(true);
              fetchData();
            }}
            className="text-cyan-400 hover:text-cyan-300 font-medium"
          >
            Tekrar Dene
          </button>
        </div>
      </div>
    );
  }

  const statsCards = [
    {
      label: 'Toplam Vaka',
      value: stats.totalCases,
      icon: Layers,
      color: 'from-cyan-500/20 to-blue-500/10',
      iconColor: 'text-cyan-400',
      border: 'border-cyan-500/20',
    },
    {
      label: 'Bu Ay Kapak',
      value: stats.monthlyCases,
      icon: Activity,
      color: 'from-emerald-500/20 to-teal-500/10',
      iconColor: 'text-emerald-400',
      border: 'border-emerald-500/20',
    },
    {
      label: 'Bu Ay Merkez',
      value: stats.monthlyCenters,
      icon: Building2,
      color: 'from-purple-500/20 to-pink-500/10',
      iconColor: 'text-purple-400',
      border: 'border-purple-500/20',
    },
    {
      label: 'Bu Ay Doktor',
      value: stats.monthlyDoctors,
      icon: User,
      color: 'from-orange-500/20 to-amber-500/10',
      iconColor: 'text-orange-400',
      border: 'border-orange-500/20',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Ana Sayfa</h1>
          <p className="text-slate-400">TAVI Kapak Takip Sistemi</p>
        </div>
        <button
          onClick={() => navigate('/add')}
          className="hidden lg:flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-xl shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all"
        >
          <Plus className="w-5 h-5" />
          Yeni Vaka
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              className={`bg-gradient-to-br ${stat.color} border ${stat.border} rounded-2xl p-5`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${stat.iconColor}`} />
                </div>
                <TrendingUp className="w-4 h-4 text-slate-500" />
              </div>
              <p className="text-3xl font-bold text-white mb-1">{stat.value}</p>
              <p className="text-sm text-slate-400">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Recent Cases */}
      <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-slate-700/50 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-cyan-400" />
            Son 10 Vaka
          </h2>
          <button
            onClick={() => navigate('/list')}
            className="flex items-center gap-1 text-sm text-slate-400 hover:text-cyan-400 transition-colors"
          >
            Tumu
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {recentKapaklar.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-slate-700/50 rounded-2xl mx-auto flex items-center justify-center mb-4">
              <Layers className="w-8 h-8 text-slate-500" />
            </div>
            <p className="text-slate-400 mb-4">Henuz vaka kaydi yok</p>
            <button
              onClick={() => navigate('/add')}
              className="text-cyan-400 hover:text-cyan-300 font-medium"
            >
              Ilk vakayi ekleyin
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-700/50">
            {recentKapaklar.map((kapak) => (
              <button
                key={kapak.id}
                onClick={() => navigate(`/view/${kapak.id}`)}
                className="w-full p-4 hover:bg-slate-700/30 transition-colors text-left"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className="text-white font-medium truncate">{kapak.hasta_adi}</span>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-lg border ${getKapakTipiColor(kapak.kapak_tipi)}`}>
                        {kapak.kapak_tipi}
                      </span>
                      <span className="px-2 py-0.5 text-xs font-medium rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                        {kapak.kapak_size}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-400">
                      <span className="truncate">{kapak.merkez_hastane}</span>
                      <span className="text-slate-600">|</span>
                      <span className="truncate">{kapak.doktor}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm text-slate-500">Vaka Tarihi</p>
                    <p className="text-sm text-white font-medium">{formatDate(kapak.vaka_tarihi)}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
