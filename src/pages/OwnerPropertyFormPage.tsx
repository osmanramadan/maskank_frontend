import { useEffect, useState } from 'react';
import type { ChangeEvent } from 'react';
import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useDispatch, useSelector } from '../store/hooks';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { fetchProperties } from '../features/properties/propertySlice.js';
import api from '../services/api.js';
import { useLanguage } from '../i18n/LanguageContext';

const emptyForm = {
  title: '',
  description: '',
  property_type: 'apartment',
  purpose: 'sale',
  price: '',
  currency: 'EGP',
  area_sqm: '',
  bedrooms: '',
  bathrooms: '',
  floor: '',
  furnished: false,
  construction_year: '',
  governorate_id: '',
  city_id: '',
  latitude: '',
  longitude: '',
  contact_mode: 'account',
  contact_phone: '',
  whatsapp_mode: 'account',
  whatsapp_phone: ''
};

const maxImageSizeBytes = 5 * 1024 * 1024;
type Location = { id: number; name_ar: string; name_en: string };
type City = Location & { governorate_id: number };
type MapPosition = [number, number];

const markerIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  shadowSize: [41, 41]
});

function LocationPicker({ onSelect }: { onSelect: (position: MapPosition) => void }) {
  useMapEvents({
    click(event) {
      onSelect([event.latlng.lat, event.latlng.lng]);
    }
  });
  return null;
}

function locationLabel(location: Location, language: string) {
  return language === 'ar'
    ? `${location.name_ar} - ${location.name_en}`
    : `${location.name_en} - ${location.name_ar}`;
}

function localizedError(error: unknown, language: string, fallback: string) {
  const response = typeof error === 'object' && error !== null && 'response' in error
    ? error.response
    : null;
  const message = typeof response === 'object' && response !== null && 'data' in response
    && typeof response.data === 'object' && response.data !== null && 'message' in response.data
    && typeof response.data.message === 'string'
    ? response.data.message
    : fallback;
  if (language !== 'ar') return message;

  const translations: Array<[RegExp, string]> = [
    [/governorate_id must be a valid whole number/i, 'يجب اختيار المحافظة'],
    [/city_id must be a valid whole number/i, 'يجب اختيار المدينة'],
    [/governorate_id is required/i, 'المحافظة مطلوبة'],
    [/city_id is required/i, 'المدينة مطلوبة'],
    [/title must be between 5 and 180 characters/i, 'العنوان يجب أن يكون بين 5 و180 حرفًا'],
    [/description is required/i, 'الوصف مطلوب'],
    [/invalid property type/i, 'نوع العقار غير صحيح'],
    [/purpose must be sale or rent/i, 'الغرض يجب أن يكون بيعًا أو إيجارًا'],
    [/area must be a valid number/i, 'المساحة يجب أن تكون رقمًا صحيحًا'],
    [/area is required/i, 'المساحة مطلوبة'],
    [/price must be a valid number/i, 'السعر يجب أن يكون رقمًا صحيحًا'],
    [/price is required/i, 'السعر مطلوب'],
    [/latitude and longitude must be provided together/i, 'يجب تحديد الموقع كاملًا على الخريطة'],
    [/invalid construction year/i, 'سنة البناء غير صحيحة'],
    [/null value in column ["']address["'] violates not-null constraint/i, 'تم حذف حقل العنوان من النموذج، لكن قاعدة البيانات لم تُحدّث بعد. شغّل migration الخاصة بجعل العنوان اختياريًا'],
    [/column ["']address["'] of relation ["']properties["'] contains null values/i, 'يجب تحديث قاعدة البيانات للسماح بأن يكون العنوان فارغًا']
  ];
  const translation = translations.find(([pattern]) => pattern.test(message));
  return translation ? translation[1] : 'تعذر حفظ العقار، يرجى مراجعة البيانات المدخلة';
}

function SearchableLocation({
  id,
  options,
  language,
  placeholder,
  disabled,
  onSelect
}: {
  id: string | number;
  options: Location[];
  language: string;
  placeholder: string;
  disabled?: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <select
        value={id || ''}
        disabled={disabled}
        onChange={(event) => onSelect(event.target.value)}
        required
      >
        <option value="">{placeholder}</option>
        {options.map((option) => <option key={option.id} value={option.id}>{locationLabel(option, language)}</option>)}
      </select>
  );
}

export default function OwnerPropertyFormPage() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const token = useSelector((state) => state.auth.token);
  const role = useSelector((state) => state.auth.user?.role || state.user.profile?.role);
  const accountPhone = useSelector((state) => state.auth.user?.phone || state.user.profile?.phone || '');
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [governorates, setGovernorates] = useState<Location[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [step, setStep] = useState(1);
  const [submittedPropertyId, setSubmittedPropertyId] = useState<number | string | null>(null);

  useEffect(() => {
    if (!token || !['USER', 'OWNER', 'BROKER', 'COMPANY', 'ADMIN'].includes(role || '')) return;

    api.get('/locations').then((response) => {
      setGovernorates(response.data.data.governorates);
      setCities(response.data.data.cities);
    }).catch((loadError) => {
      setError(localizedError(loadError, language, t('loadPropertyFailed')));
    });

    if (!id) return;

    const loadExisting = async () => {
      try {
        const response = await api.get(`/properties/mine/${id}`);
        const property = response.data.data;
        setForm({
          title: property.title,
          description: property.description,
          property_type: property.property_type,
          purpose: property.purpose,
          price: property.price,
          currency: property.currency,
          area_sqm: property.area_sqm,
          bedrooms: property.bedrooms ?? '',
          bathrooms: property.bathrooms ?? '',
          floor: property.floor ?? '',
          furnished: property.furnished ?? false,
          construction_year: property.construction_year ?? '',
          governorate_id: property.governorate_id,
          city_id: property.city_id,
          latitude: property.latitude ?? '',
          longitude: property.longitude ?? ''
          , contact_mode: property.contact_phone && property.contact_phone !== accountPhone ? 'custom' : 'account'
          , contact_phone: property.contact_phone || accountPhone
          , whatsapp_mode: property.whatsapp_phone && property.whatsapp_phone !== accountPhone ? 'custom' : 'account'
          , whatsapp_phone: property.whatsapp_phone || accountPhone
        });
      } catch (loadError) {
        setError(localizedError(loadError, language, t('loadPropertyFailed')));
      }
    };

    loadExisting();
  }, [id, navigate, token, role]);

  if (!token) {
    return (
      <section className="page-shell">
        <div className="container">
          <div className="auth-card mx-auto text-center">
            <h2>{language === 'ar' ? 'يجب تسجيل الدخول لإضافة عقار' : 'Sign in to add your property'}</h2>
            <p className="page-copy">{language === 'ar' ? 'سجّل الدخول للمتابعة وإدارة عقاراتك.' : 'Sign in to continue and manage your properties.'}</p>
            <button type="button" className="btn btn-primary rounded-pill" onClick={() => navigate('/auth')}>{language === 'ar' ? 'تسجيل الدخول' : 'Sign in'}</button>
          </div>
        </div>
      </section>
    );
  }

  if (!['USER', 'OWNER', 'BROKER', 'COMPANY', 'ADMIN'].includes(role || '')) {
    return (
      <section className="page-shell">
        <div className="container">
          <div className="auth-card mx-auto text-center">
            <h2>{language === 'ar' ? 'غير مسموح لنوع الحساب هذا بإضافة عقار' : 'This account type cannot add properties'}</h2>
            <p className="page-copy">{language === 'ar' ? 'حساب المشتري مخصص لتصفح العقارات وحفظها. يمكنك تغيير نوع الحساب من لوحة الحساب ثم العودة لإضافة عقار.' : 'Buyer accounts are for browsing and saving properties. Change your account type from your account page, then return to add a property.'}</p>
            <Link className="btn btn-primary rounded-pill" to="/account">{language === 'ar' ? 'الذهاب إلى إعدادات الحساب' : 'Go to account settings'}</Link>
          </div>
        </div>
      </section>
    );
  }

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
      ...(name === 'property_type' && value === 'land' ? { furnished: false } : {})
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (step !== 3) {
      setError(language === 'ar' ? 'انتقل إلى مرحلة الصور والتواصل قبل الحفظ.' : 'Go to the images and contact step before saving.');
      return;
    }
    if (!id && images.length === 0) {
      setError(language === 'ar' ? 'يجب اختيار صورة واحدة على الأقل عند إضافة عقار جديد.' : 'Choose at least one property image before submitting a new listing.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const payload = {
        ...form,
        price: Number(form.price),
        area_sqm: Number(form.area_sqm),
        bedrooms: form.bedrooms === '' ? null : Number(form.bedrooms),
        bathrooms: form.bathrooms === '' ? null : Number(form.bathrooms),
        floor: form.floor === '' ? null : Number(form.floor),
        furnished: form.property_type === 'land' ? false : form.furnished === true,
        construction_year: form.construction_year === '' ? null : Number(form.construction_year),
        governorate_id: Number(form.governorate_id),
        city_id: Number(form.city_id),
        latitude: form.latitude === '' ? null : Number(form.latitude),
        longitude: form.longitude === '' ? null : Number(form.longitude)
        , contact_phone: form.contact_mode === 'account' ? accountPhone : form.contact_phone
        , whatsapp_phone: form.whatsapp_mode === 'account' ? accountPhone : form.whatsapp_phone
      };

      let propertyId = id;
      if (id) {
        await api.put(`/properties/${id}`, payload);
      } else {
        const response = await api.post('/properties', payload);
        propertyId = response.data.data.id;
      }

      if (propertyId && images.length) {
        const imageData = new FormData();
        images.forEach((image) => imageData.append('images', image));
        await api.post(`/properties/${propertyId}/images`, imageData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      dispatch(fetchProperties({ page: 1, limit: 12 }));
      if (id) {
        navigate('/account');
        return;
      }
      setSubmittedPropertyId(propertyId);
      setStep(4);
    } catch (submitError) {
      setError(localizedError(submitError, language, t('savePropertyFailed')));
    } finally {
      setLoading(false);
    }
  };

  const handleImagesChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedImages = event.target.files ? Array.from(event.target.files) : [];
    if (selectedImages.some((image) => image.size > maxImageSizeBytes)) {
      setImages([]);
      setError(language === 'ar' ? 'حجم كل صورة يجب ألا يتجاوز 5 ميجابايت' : 'Each image must be 5 MB or smaller');
      event.target.value = '';
      return;
    }
    setError('');
    setImages(selectedImages);
  };

  const selectedGovernorateId = Number(form.governorate_id);
  const availableCities = cities.filter((city) => Number(city.governorate_id) === selectedGovernorateId);
  const mapPosition: MapPosition | null = form.latitude !== '' && form.longitude !== ''
    ? [Number(form.latitude), Number(form.longitude)]
    : null;

  const handleMapSelect = ([latitude, longitude]: MapPosition) => {
    setForm((current) => ({ ...current, latitude, longitude }));
  };

  const goToNextStep = () => {
    if (step === 1 && (!String(form.title).trim() || !String(form.description).trim() || !form.price || !form.area_sqm)) {
      setError(language === 'ar' ? 'أكمل العنوان والوصف والسعر والمساحة أولًا.' : 'Complete the title, description, price, and area first.');
      return;
    }
    if (step === 2 && (!form.governorate_id || !form.city_id)) {
      setError(language === 'ar' ? 'اختر المحافظة والمدينة أولًا.' : 'Select the governorate and city first.');
      return;
    }
    if (step === 2) {
      setError('');
      setStep(3);
      return;
    }
    setError('');
    setStep(2);
  };

  const stepLabels = id
    ? (language === 'ar'
      ? ['البيانات الأساسية', 'التفاصيل والموقع', 'الصور والتواصل']
      : ['Basic information', 'Details and location', 'Images and contact'])
    : (language === 'ar'
      ? ['البيانات الأساسية', 'التفاصيل والموقع', 'الصور والتواصل', 'الدفع والنجاح']
      : ['Basic information', 'Details and location', 'Images and contact', 'Payment and success']);

  if (step === 4 && submittedPropertyId) {
    return (
      <section className="page-shell">
        <div className="container" style={{ maxWidth: 760 }}>
          <div className="auth-card property-success-card text-center">
            <div className="property-success-icon">✓</div>
            <p className="eyebrow dark">{language === 'ar' ? 'تمت إضافة الإعلان' : 'Listing submitted'}</p>
            <h2>{language === 'ar' ? 'إعلانك جاهز للمراجعة' : 'Your listing is ready for review'}</h2>
            <p className="page-copy">
              {language === 'ar'
                ? 'سيتم عرض الإعلان بعد مراجعة وموافقة الأدمن. لإكمال النشر، يرجى تحويل 200 جنيه.'
                : 'The listing will be published after admin approval. To complete publishing, please transfer EGP 200.'}
            </p>
            <div className="payment-instructions" dir={language === 'ar' ? 'rtl' : 'ltr'}>
              <strong>{language === 'ar' ? 'تحويل فودافون كاش' : 'Vodafone Cash transfer'}</strong>
              <span>{language === 'ar' ? 'المبلغ: 200 جنيه' : 'Amount: EGP 200'}</span>
              <a className="payment-transfer-link" href="tel:*9*7*01027528199*200%23" dir="ltr">
                {language === 'ar' ? 'اضغط لتحويل 200 جنيه' : 'Tap to transfer EGP 200'}
                <span className="payment-phone">01027528199</span>
              </a>
              <small>
                {language === 'ar'
                  ? 'سيتم فتح تطبيق الاتصال بكود فودافون كاش الجاهز للتحويل.'
                  : 'Your phone dialer will open with the Vodafone Cash transfer code.'}
              </small>
              <a
                className="payment-receipt-link"
                href={`https://wa.me/201027528199?text=${encodeURIComponent(language === 'ar' ? 'مرحبًا،ارسال إيصال دفع إعلان العقار رقم ' + submittedPropertyId : `Hello, I am sending the payment receipt for property ${submittedPropertyId}`)}`}
                target="_blank"
                rel="noreferrer"
              >
                {language === 'ar' ? 'إرسال إيصال الدفع عبر واتساب' : 'Send payment receipt on WhatsApp'}
              </a>
            </div>
            <p className="form-hint">
              {language === 'ar'
                ? 'بعد التحويل، أرسل إثبات الدفع للإدارة عند الحاجة. سيظل الإعلان قيد المراجعة حتى اعتماد الأدمن.'
                : 'After transferring, send proof of payment to the administration if requested. The listing remains pending until approved.'}
            </p>
            <button type="button" className="btn btn-primary rounded-pill" onClick={() => navigate('/account')}>
              {language === 'ar' ? 'الذهاب إلى حسابي' : 'Go to my account'}
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="page-shell">
      <div className="container" style={{ maxWidth: 980 }}>
        <div className="section-heading mb-4">
          <p className="eyebrow dark">{t('ownerTools')}</p>
          <h2>{id ? t('editProperty') : t('listProperty')}</h2>
        </div>
        <div className="property-stepper" aria-label={language === 'ar' ? 'مراحل إضافة العقار' : 'Property listing steps'}>
          {stepLabels.map((label, index) => (
            <div className={`property-step ${step >= index + 1 ? 'active' : ''}`} key={label}>
              <span>{index + 1}</span><small>{label}</small>
            </div>
          ))}
        </div>

        <form className="auth-card property-form" onSubmit={handleSubmit}>
          {error ? <div className="alert alert-danger">{error}</div> : null}

          {step === 1 && (<div className="row g-3">
            <div className="col-md-8">
              <label>
                <span>{t('title')}</span>
                <input name="title" value={form.title} onChange={handleChange} required />
              </label>
            </div>
            <div className="col-md-4">
              <label>
                <span>{t('purpose')}</span>
                <select name="purpose" value={form.purpose} onChange={handleChange}>
                  <option value="sale">{t('sale')}</option>
                  <option value="rent">{t('rent')}</option>
                </select>
              </label>
            </div>

            <div className="col-md-4">
              <label>
                <span>{t('propertyType')}</span>
                <select name="property_type" value={form.property_type} onChange={handleChange}>
                  <option value="apartment">{t('apartment')}</option>
                  <option value="villa">{t('villa')}</option>
                  <option value="shop">{t('shop')}</option>
                  <option value="office">{t('office')}</option>
                  <option value="land">{t('land')}</option>
                </select>
              </label>
            </div>
            <div className="col-md-4">
              <label>
                <span>{t('price')}</span>
                <input name="price" type="number" value={form.price} onChange={handleChange} required />
              </label>
            </div>
            <div className="col-md-4">
              <label>
                <span>{t('areaSqm')}</span>
                <input name="area_sqm" type="number" value={form.area_sqm} onChange={handleChange} required />
              </label>
            </div>

            <div className="col-md-4">
              <label>
                <span>{t('bedrooms')}</span>
                <input name="bedrooms" type="number" min="0" value={form.bedrooms} onChange={handleChange} />
              </label>
            </div>
            <div className="col-md-4">
              <label>
                <span>{t('bathrooms')}</span>
                <input name="bathrooms" type="number" min="0" value={form.bathrooms} onChange={handleChange} />
              </label>
            </div>
            <div className="col-md-4">
              <label>
                <span>{t('floor')}</span>
                <input name="floor" type="number" min="0" value={form.floor} onChange={handleChange} />
              </label>
            </div>

            {form.property_type !== 'land' ? (
              <div className="col-md-4">
                <label>
                  <span>{t('furnished')}</span>
                  <select
                    name="furnished"
                    value={form.furnished ? 'true' : 'false'}
                    onChange={(e) => setForm((current) => ({ ...current, furnished: e.target.value === 'true' }))}
                  >
                    <option value="false">{language === 'ar' ? 'غير مفروش' : 'Unfurnished'}</option>
                    <option value="true">{language === 'ar' ? 'مفروش' : 'Furnished'}</option>
                  </select>
                </label>
              </div>
            ) : null}

            <div className="col-12">
              <label>
                <span>{t('description')}</span>
                <textarea name="description" rows="5" value={form.description} onChange={handleChange} required />
              </label>
            </div>
          </div>)}

          {step === 2 && (<div className="row g-3">
            <div className="col-md-6">
              <label>
                <span>{language === 'ar' ? 'رقم الاتصال بالإعلان' : 'Listing call number'}</span>
                <select name="contact_mode" value={form.contact_mode} onChange={handleChange}>
                  <option value="account">{language === 'ar' ? `رقم الحساب (${accountPhone})` : `Account number (${accountPhone})`}</option>
                  <option value="custom">{language === 'ar' ? 'إضافة رقم جديد لهذا الإعلان' : 'Use a different number'}</option>
                </select>
                {form.contact_mode === 'custom' ? <input name="contact_phone" type="tel" inputMode="numeric" value={form.contact_phone} onChange={handleChange} placeholder="01012345678" pattern="01[0125][0-9]{8}" maxLength={11} required /> : null}
              </label>
            </div>
            <div className="col-md-6">
              <label>
                <span>{language === 'ar' ? 'رقم واتساب الإعلان' : 'Listing WhatsApp number'}</span>
                <select name="whatsapp_mode" value={form.whatsapp_mode} onChange={handleChange}>
                  <option value="account">{language === 'ar' ? `رقم الحساب (${accountPhone})` : `Account number (${accountPhone})`}</option>
                  <option value="custom">{language === 'ar' ? 'إضافة رقم جديد لهذا الإعلان' : 'Use a different number'}</option>
                </select>
                {form.whatsapp_mode === 'custom' ? <input name="whatsapp_phone" type="tel" inputMode="numeric" value={form.whatsapp_phone} onChange={handleChange} placeholder="01012345678" pattern="01[0125][0-9]{8}" maxLength={11} required /> : null}
              </label>
            </div>

            <div className="col-md-4">
              <label>
                <span>{t('governorate')}</span>
                <SearchableLocation
                  id={form.governorate_id}
                  options={governorates}
                  language={language}
                  placeholder={language === 'ar' ? 'اختر المحافظة' : 'Select governorate'}
                  onSelect={(governorateId) => {
                  setForm((current) => ({ ...current, governorate_id: governorateId, city_id: '' }));
                  }}
                />
              </label>
            </div>
            <div className="col-md-4">
              <label>
                <span>{t('city')}</span>
                <SearchableLocation
                  id={form.city_id}
                  options={availableCities}
                  language={language}
                  placeholder={language === 'ar' ? 'اختر المدينة' : 'Select city'}
                  disabled={!form.governorate_id}
                  onSelect={(cityId) => setForm((current) => ({ ...current, city_id: cityId }))}
                />
              </label>
            </div>
            <div className="col-md-4">
              <label>
                <span>{t('constructionYear')}</span>
                <input name="construction_year" type="number" value={form.construction_year} onChange={handleChange} />
              </label>
            </div>

            <div className="col-12">
              <label>
                <span>{language === 'ar' ? 'اختر عنوان المكان من الخريطة' : 'Choose the property location on the map'}</span>
                <MapContainer
                  className="property-location-map"
                  center={mapPosition || [26.8206, 30.8025]}
                  zoom={mapPosition ? 14 : 6}
                  scrollWheelZoom
                >
                  <TileLayer
                    attribution='&copy; OpenStreetMap contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <LocationPicker onSelect={handleMapSelect} />
                  {mapPosition ? (
                    <Marker
                      position={mapPosition}
                      icon={markerIcon}
                      draggable
                      eventHandlers={{
                        dragend: (event) => {
                          const position = event.target.getLatLng();
                          void handleMapSelect([position.lat, position.lng]);
                        }
                      }}
                    />
                  ) : null}
                </MapContainer>
                <small className="form-hint">
                  {language === 'ar' ? 'اضغط على الخريطة لتحديد الموقع' : 'Click the map to select the location'}
                </small>
              </label>
            </div>
          </div>)}

          {step === 3 && (<div className="row g-3">
            <div className="col-12">
              <label>
                <span>{language === 'ar' ? 'اختر صور العقار' : 'Choose property images'}</span>
                <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={handleImagesChange} disabled={loading} required={!id} />
                <small className="form-hint">
                  {images.length ? `${images.length} ${language === 'ar' ? 'صور مختارة' : 'images selected'}` : (language === 'ar' ? 'يجب اختيار صورة واحدة على الأقل، ويمكنك اختيار حتى 10 صور' : 'At least one image is required; you can choose up to 10 images')}
                </small>
              </label>
            </div>
          </div>)}

          <div className="detail-actions mt-4 property-step-actions">
            {step > 1 ? (
              <button type="button" className="btn btn-quiet dark-btn rounded-pill" onClick={() => setStep((current) => current - 1)} disabled={loading}>
                {language === 'ar' ? 'السابق' : 'Back'}
              </button>
            ) : null}
            {step === 1 || step === 2 ? (
              <button
                type="button"
                className="btn btn-primary rounded-pill"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  goToNextStep();
                }}
              >
                {language === 'ar' ? 'التالي' : 'Next'}
              </button>
            ) : (
              <button type="submit" className="btn btn-primary rounded-pill" disabled={loading}>
                {loading ? t('saving') : (id ? t('updateListing') : (language === 'ar' ? 'إضافة الإعلان والمتابعة للدفع' : 'Submit and continue to payment'))}
              </button>
            )}
          </div>
        </form>
      </div>
    </section>
  );
}
