import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase, Kapak } from '../lib/supabase';
import { ArrowLeft, Copy, ExternalLink, Check, Mail, Edit2, Calendar, Building2, User } from 'lucide-react';

export default function ViewCase() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [kapak, setKapak] = useState<Kapak | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCase = useCallback(async (caseId: string) => {
    console.log('Vaka detaylari yukleniyor...', caseId);

    try {
      const { data, error: fetchError } = await supabase
        .from('kapaklar')
        .select('*')
        .eq('id', caseId)
        .single();

      if (fetchError) {
        console.log('Vaka bulunamadi:', fetchError.message);
        setError('Vaka bulunamadi');
      } else if (data) {
        setKapak(data as Kapak);
      }
    } catch (err) {
      console.error('Vaka yukleme hatasi:', err);
      setError('Vaka yuklenirken hata olustu');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!id) return;

    // Timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (loading) {
        console.log('ViewCase yukleme timeout');
        setLoading(false);
        setError('Yukleme zaman asimina ugradi');
      }
    }, 5000);

    fetchCase(id).then(() => clearTimeout(timeout));

    return () => clearTimeout(timeout);
  }, [id, fetchCase, loading]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  const generateMailContent = () => {
    if (!kapak) return '';

    const lines: string[] = [];
    lines.push(`[${formatDate(kapak.vaka_tarihi)}]\n`);
    lines.push(`${kapak.hasta_adi} isimli hastaya Medtronic ${kapak.kapak_tipi} ${kapak.kapak_size} kapak Lot No (${kapak.lot_no}) Dr. ${kapak.doktor} tarafindan basarili bir sekilde implante edildi.`);
    lines.push(`\nParavalvuler AY ${kapak.paravalvuler_ay}.`);

    if (kapak.pre_balon !== 'Yok') {
      lines.push(`\n${kapak.pre_balon} pre balon yapildi.`);
    }

    if (kapak.post_balon !== 'Yok') {
      lines.push(`\n${kapak.post_balon} post balon yapildi.`);
    }

    lines.push(`\nFokus'tan ${kapak.proglide_adedi} Proglide kullanildi.`);
    lines.push(`\nSaygilarimla,\n${kapak.crimp_yapan}`);

    return lines.join('');
  };

  const handleCopy = async () => {
    try {
      const content = generateMailContent();
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Kopyalama hatasi:', err);
    }
  };

  const handleOpenOutlook = () => {
    if (!kapak) return;
    const subject = encodeURIComponent(`TAVI Vaka Bildirimi - ${kapak.hasta_adi}`);
    const body = encodeURIComponent(generateMailContent());
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !kapak) {
    return (
      <div className="max-w-3xl mx-auto p-4 text-center">
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-8">
          <p className="text-slate-400 mb-4">{error || 'Vaka bulunamadi'}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => navigate('/list')}
              className="text-cyan-400 hover:text-cyan-300 font-medium"
            >
              Listeye don
            </button>
            <button
              onClick={() => {
                setLoading(true);
                setError(null);
                if (id) fetchCase(id);
              }}
              className="text-slate-400 hover:text-white font-medium"
            >
              Tekrar dene
            </button>
          </div>
        </div>
      </div>
    );
  }

  const mailContent = generateMailContent();

  return (
    <div className="max-w-3xl mx-auto p-4">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        Geri
      </button>

      {/* Case Details */}
      <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl overflow-hidden mb-6">
        <div className="p-5 border-b border-slate-700/50 flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">{kapak.hasta_adi}</h1>
          <button
            onClick={() => navigate(`/edit/${kapak.id}`)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-400 rounded-xl hover:bg-blue-500/30 transition-all text-sm"
          >
            <Edit2 className="w-4 h-4" />
            Duzenle
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Vaka Bilgileri */}
          <div>
            <h3 className="text-xs font-semibold text-cyan-400 uppercase tracking-wide mb-3">Vaka Bilgileri</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-slate-500" />
                <div>
                  <p className="text-slate-500 text-xs">Vaka Tarihi</p>
                  <p className="text-white">{formatDate(kapak.vaka_tarihi)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="w-4 h-4 text-slate-500" />
                <div>
                  <p className="text-slate-500 text-xs">Merkez</p>
                  <p className="text-white">{kapak.merkez_hastane}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-slate-500" />
                <div>
                  <p className="text-slate-500 text-xs">Doktor</p>
                  <p className="text-white">{kapak.doktor}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Kapak Bilgileri */}
          <div>
            <h3 className="text-xs font-semibold text-emerald-400 uppercase tracking-wide mb-3">Kapak Bilgileri</h3>
            <div className="flex flex-wrap gap-3">
              <span className="px-3 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg text-sm font-medium">
                {kapak.kapak_tipi}
              </span>
              <span className="px-3 py-1.5 bg-cyan-500/20 text-cyan-400 rounded-lg text-sm font-medium">
                {kapak.kapak_size}
              </span>
              <span className="px-3 py-1.5 bg-slate-600/50 text-slate-300 rounded-lg text-sm">
                Lot: {kapak.lot_no}
              </span>
              <span className="px-3 py-1.5 bg-purple-500/20 text-purple-400 rounded-lg text-sm">
                SKT: {formatDate(kapak.son_kul_tarihi)}
              </span>
            </div>
          </div>

          {/* İşlem Bilgileri */}
          <div>
            <h3 className="text-xs font-semibold text-orange-400 uppercase tracking-wide mb-3">Islem Bilgileri</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-slate-500 text-xs">Pre Balon</p>
                <p className="text-white">{kapak.pre_balon}</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs">Post Balon</p>
                <p className="text-white">{kapak.post_balon}</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs">Paravalvuler AY</p>
                <p className="text-white">{kapak.paravalvuler_ay}</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs">Proglide Adedi</p>
                <p className="text-white">{kapak.proglide_adedi}</p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-700/50">
              <p className="text-slate-500 text-xs">Crimp Yapan</p>
              <p className="text-white">{kapak.crimp_yapan}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Mail Generation */}
      <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-slate-700/50">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Mail className="w-5 h-5 text-cyan-400" />
            Mail Olustur
          </h2>
        </div>

        <div className="p-5">
          <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4 mb-4">
            <pre className="whitespace-pre-wrap text-slate-300 text-sm font-sans">{mailContent}</pre>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleCopy}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-xl shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all"
            >
              {copied ? (
                <>
                  <Check className="w-5 h-5" />
                  Kopyalandi
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5" />
                  Kopyala
                </>
              )}
            </button>
            <button
              onClick={handleOpenOutlook}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-700/50 border border-slate-600 text-slate-200 rounded-xl hover:bg-slate-600/50 transition-all"
            >
              <ExternalLink className="w-5 h-5" />
              Outlook'ta Ac
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
