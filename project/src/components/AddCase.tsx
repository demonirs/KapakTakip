import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  supabase,
  KAPAK_TIPLERI,
  KAPAK_SIZES,
  BALON_SIZES,
  PARAVALVULER_OPTIONS,
  PROGLIDE_OPTIONS,
} from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Save, ArrowLeft, AlertCircle, Camera, Upload, Loader2 } from 'lucide-react';

const initialFormData = {
  vaka_tarihi: '',
  merkez_hastane: '',
  doktor: '',
  hasta_adi: '',
  kapak_tipi: 'Evolut Pro+' as const,
  kapak_size: '23 mm' as const,
  lot_no: '',
  son_kul_tarihi: '',
  pre_balon: 'Yok' as const,
  post_balon: 'Yok' as const,
  paravalvuler_ay: 'Yok' as const,
  proglide_adedi: 1 as const,
};

type FormData = typeof initialFormData;

type FormFieldProps = {
  label: string;
  name: keyof FormData;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  type?: string;
  required?: boolean;
  options?: readonly (string | number)[];
};

function SectionTitle({ title }: { title: string }) {
  return (
    <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wide mb-4">
      {title}
    </h3>
  );
}

function FormField({
  label,
  name,
  value,
  onChange,
  type = 'text',
  required = true,
  options,
}: FormFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-2">
        {label} {required && <span className="text-red-400">*</span>}
      </label>

      {options ? (
        <select
          name={String(name)}
          value={String(value ?? '')}
          onChange={onChange}
          className="w-full px-4 py-3.5 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all appearance-none"
          required={required}
        >
          <option value="">Seciniz</option>
          {options.map((opt) => (
            <option key={String(opt)} value={String(opt)}>
              {opt}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          name={String(name)}
          value={String(value ?? '')}
          onChange={onChange}
          className="w-full px-4 py-3.5 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
          required={required}
        />
      )}
    </div>
  );
}

export default function AddCase() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [fetchingCase, setFetchingCase] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>(initialFormData);

  const crimpYapan =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.email?.split('@')[0] ||
    '';

  useEffect(() => {
    const fetchCase = async (caseId: string) => {
      setFetchingCase(true);
      setError(null);

      try {
        const { data, error: fetchError } = await supabase
          .from('kapaklar')
          .select('*')
          .eq('id', caseId)
          .maybeSingle();

        if (fetchError) {
          console.error('VAKA YUKLEME HATASI:', fetchError);
          setError(fetchError.message || 'Vaka yuklenirken hata olustu');
          return;
        }

        if (data) {
          setFormData({
            vaka_tarihi: data.vaka_tarihi || '',
            merkez_hastane: data.merkez_hastane || '',
            doktor: data.doktor || '',
            hasta_adi: data.hasta_adi || '',
            kapak_tipi: data.kapak_tipi || 'Evolut Pro+',
            kapak_size: data.kapak_size || '23 mm',
            lot_no: data.lot_no || '',
            son_kul_tarihi: data.son_kul_tarihi || '',
            pre_balon: data.pre_balon || 'Yok',
            post_balon: data.post_balon || 'Yok',
            paravalvuler_ay: data.paravalvuler_ay || 'Yok',
            proglide_adedi: data.proglide_adedi || 1,
          });
        }
      } catch (err: any) {
        console.error('VAKA YUKLEME CATCH:', err);
        setError(err?.message || 'Vaka yuklenirken hata olustu');
      } finally {
        setFetchingCase(false);
      }
    };

    if (id) {
      fetchCase(id);
    }
  }, [id]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: name === 'proglide_adedi' ? Number(value) || 1 : value,
    }));
  };

  const handlePhotoUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setOcrLoading(true);
    setError(null);

    try {
      const reader = new FileReader();

      reader.onload = async () => {
        try {
          const base64 = reader.result as string;

          const { data, error: ocrError } = await supabase.functions.invoke(
            'ocr-form',
            {
              body: { image: base64 },
            }
          );

          if (ocrError) {
            console.error('OCR HATASI:', ocrError);
            setError(
              'OCR servisi su an kullanilamiyor. Lutfen alanlari manuel doldurun.'
            );
            return;
          }

          if (data) {
            setFormData((prev) => ({
              ...prev,
              hasta_adi: data.hasta_adi || prev.hasta_adi,
              doktor: data.doktor || prev.doktor,
              merkez_hastane: data.merkez || prev.merkez_hastane,
              kapak_size: data.kapak_size || prev.kapak_size,
              lot_no: data.lot_no || prev.lot_no,
              son_kul_tarihi: data.son_kul_tarihi || prev.son_kul_tarihi,
              vaka_tarihi: data.vaka_tarihi || prev.vaka_tarihi,
            }));
          }
        } catch (err: any) {
          console.error('OCR CATCH:', err);
          setError(err?.message || 'Fotoğraf okunurken hata olustu');
        } finally {
          setOcrLoading(false);
        }
      };

      reader.onerror = () => {
        setOcrLoading(false);
        setError('Fotoğraf yuklenirken hata olustu');
      };

      reader.readAsDataURL(file);
    } catch (err: any) {
      console.error('FOTO YUKLEME HATASI:', err);
      setError(err?.message || 'Fotoğraf yuklenirken hata olustu');
      setOcrLoading(false);
    }
  };

  const validateForm = () => {
    if (!user?.id) return 'Kullanici oturumu bulunamadi. Cikis yapip tekrar gir.';
    if (!crimpYapan) return 'Crimp yapan kullanici adi bulunamadi.';
    if (!formData.vaka_tarihi) return 'Vaka tarihi zorunlu.';
    if (!formData.merkez_hastane) return 'Merkez hastane zorunlu.';
    if (!formData.doktor) return 'Doktor zorunlu.';
    if (!formData.hasta_adi) return 'Hasta adi zorunlu.';
    if (!formData.kapak_tipi) return 'Kapak tipi zorunlu.';
    if (!formData.kapak_size) return 'Kapak size zorunlu.';
    if (!formData.lot_no) return 'Lot no zorunlu.';
    if (!formData.son_kul_tarihi) return 'Son kullanma tarihi zorunlu.';

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    const payload = {
      vaka_tarihi: formData.vaka_tarihi,
      merkez_hastane: formData.merkez_hastane.trim(),
      doktor: formData.doktor.trim(),
      hasta_adi: formData.hasta_adi.trim(),
      kapak_tipi: formData.kapak_tipi,
      kapak_size: formData.kapak_size,
      lot_no: formData.lot_no.trim(),
      son_kul_tarihi: formData.son_kul_tarihi,
      pre_balon: formData.pre_balon,
      post_balon: formData.post_balon,
      paravalvuler_ay: formData.paravalvuler_ay,
      proglide_adedi: Number(formData.proglide_adedi) || 1,
      crimp_yapan: crimpYapan,
    };

    console.log('USER:', user);
    console.log('PROFILE:', profile);
    console.log('PAYLOAD:', payload);

    try {
      if (isEdit) {
        const { error: updateError } = await supabase
          .from('kapaklar')
          .update(payload)
          .eq('id', id);

        if (updateError) {
          console.error('UPDATE HATASI:', updateError);
          throw updateError;
        }
      } else {
        const { error: insertError } = await supabase.from('kapaklar').insert({
          ...payload,
          user_id: user!.id,
        });

        if (insertError) {
          console.error('INSERT HATASI:', insertError);
          throw insertError;
        }
      }

      navigate('/list');
    } catch (err: any) {
      console.error('KAYIT CATCH:', err);

      setError(
        err?.message ||
          err?.details ||
          err?.hint ||
          JSON.stringify(err) ||
          'Kayit sirasinda bir hata olustu'
      );
    } finally {
      setLoading(false);
    }
  };

  if (fetchingCase) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        Geri
      </button>

      <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-700/50 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">
            {isEdit ? 'Vakayi Duzenle' : 'Yeni Vaka Ekle'}
          </h1>

          {!isEdit && (
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              capture="environment"
              onChange={handlePhotoUpload}
              className="hidden"
            />
          )}
        </div>

        {!isEdit && (
          <div className="px-6 pt-6">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={ocrLoading}
              className="w-full flex items-center justify-center gap-3 py-4 border-2 border-dashed border-slate-600 rounded-xl text-slate-300 hover:border-cyan-500 hover:text-cyan-400 transition-all disabled:opacity-50"
            >
              {ocrLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Fotograf Okunuyor...
                </>
              ) : (
                <>
                  <Camera className="w-5 h-5" />
                  <span className="font-medium">Form Fotograf Yukle (OCR)</span>
                  <Upload className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          <section>
            <SectionTitle title="Vaka Bilgileri" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Vaka Tarihi"
                name="vaka_tarihi"
                value={formData.vaka_tarihi}
                onChange={handleChange}
                type="date"
              />
              <FormField
                label="Merkez Hastane"
                name="merkez_hastane"
                value={formData.merkez_hastane}
                onChange={handleChange}
              />
              <FormField
                label="Doktor"
                name="doktor"
                value={formData.doktor}
                onChange={handleChange}
              />
              <FormField
                label="Hasta Adı"
                name="hasta_adi"
                value={formData.hasta_adi}
                onChange={handleChange}
              />
            </div>
          </section>

          <section>
            <SectionTitle title="Kapak Bilgileri" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Kapak Tipi"
                name="kapak_tipi"
                value={formData.kapak_tipi}
                onChange={handleChange}
                options={KAPAK_TIPLERI}
              />
              <FormField
                label="Kapak Size"
                name="kapak_size"
                value={formData.kapak_size}
                onChange={handleChange}
                options={KAPAK_SIZES}
              />
              <FormField
                label="Lot No"
                name="lot_no"
                value={formData.lot_no}
                onChange={handleChange}
              />
              <FormField
                label="Son Kullanma Tarihi"
                name="son_kul_tarihi"
                value={formData.son_kul_tarihi}
                onChange={handleChange}
                type="date"
              />
            </div>
          </section>

          <section>
            <SectionTitle title="Islem Bilgileri" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Pre Balon"
                name="pre_balon"
                value={formData.pre_balon}
                onChange={handleChange}
                options={BALON_SIZES}
              />
              <FormField
                label="Post Balon"
                name="post_balon"
                value={formData.post_balon}
                onChange={handleChange}
                options={BALON_SIZES}
              />
              <FormField
                label="Paravalvüler AY"
                name="paravalvuler_ay"
                value={formData.paravalvuler_ay}
                onChange={handleChange}
                options={PARAVALVULER_OPTIONS}
              />
              <FormField
                label="Proglide Adedi"
                name="proglide_adedi"
                value={formData.proglide_adedi}
                onChange={handleChange}
                options={PROGLIDE_OPTIONS}
              />
            </div>

            <div className="mt-4 p-4 bg-slate-700/30 rounded-xl border border-slate-600">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Crimp Yapan</span>
                <span className="text-white font-medium">
                  {crimpYapan || 'Kullanici adi yok'}
                </span>
              </div>
            </div>
          </section>

          {error && (
            <div className="flex items-start gap-2 p-4 bg-red-500/15 border border-red-500/25 rounded-xl text-red-400">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm break-words">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || ocrLoading}
            className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-xl shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-5 h-5" />
            {loading ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </form>
      </div>
    </div>
  );
}
