import { useEffect, useState } from 'react';
import type { ChangeEvent } from 'react';
import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useDispatch, useSelector } from '../store/hooks';
import { useNavigate, useParams } from 'react-router-dom';
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
  construction_year: '',
  governorate_id: '',
  city_id: '',
  address: '',
  latitude: '',
  longitude: ''
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

function SearchableLocation({
  id,
  options,
  language,
  listId,
  placeholder,
  disabled,
  onSelect
}: {
  id: string | number;
  options: Location[];
  language: string;
  listId: string;
  placeholder: string;
  disabled?: boolean;
  onSelect: (id: string) => void;
}) {
  const selected = options.find((option) => Number(option.id) === Number(id));
  const [value, setValue] = useState(selected ? locationLabel(selected, language) : '');

  useEffect(() => {
    setValue(selected ? locationLabel(selected, language) : '');
  }, [selected, language]);

  return (
    <>
      <input
        list={listId}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(event) => {
          const nextValue = event.target.value;
          setValue(nextValue);
          const match = options.find((option) => locationLabel(option, language) === nextValue);
          onSelect(match ? String(match.id) : '');
        }}
        required
      />
      <datalist id={listId}>
        {options.map((option) => <option key={option.id} value={locationLabel(option, language)} />)}
      </datalist>
    </>
  );
}

export default function OwnerPropertyFormPage() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const token = useSelector((state) => state.auth.token);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [governorates, setGovernorates] = useState<Location[]>([]);
  const [cities, setCities] = useState<City[]>([]);

  useEffect(() => {
    if (!token) {
      navigate('/auth', { replace: true });
      return;
    }

    api.get('/locations').then((response) => {
      setGovernorates(response.data.data.governorates);
      setCities(response.data.data.cities);
    }).catch((loadError) => {
      setError(loadError.response?.data?.message || t('loadPropertyFailed'));
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
          construction_year: property.construction_year ?? '',
          governorate_id: property.governorate_id,
          city_id: property.city_id,
          address: property.address,
          latitude: property.latitude ?? '',
          longitude: property.longitude ?? ''
        });
      } catch (loadError) {
        setError(loadError.response?.data?.message || t('loadPropertyFailed'));
      }
    };

    loadExisting();
  }, [id, navigate, token]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
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
        construction_year: form.construction_year === '' ? null : Number(form.construction_year),
        governorate_id: Number(form.governorate_id),
        city_id: Number(form.city_id),
        latitude: form.latitude === '' ? null : Number(form.latitude),
        longitude: form.longitude === '' ? null : Number(form.longitude)
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
      navigate('/account');
    } catch (submitError) {
      setError(submitError.response?.data?.message || t('savePropertyFailed'));
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

  const handleMapSelect = async ([latitude, longitude]: MapPosition) => {
    setForm((current) => ({ ...current, latitude, longitude }));
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&accept-language=${language}`
      );
      if (!response.ok) throw new Error('Reverse geocoding failed');
      const data = await response.json();
      if (data.display_name) {
        setForm((current) => ({ ...current, address: data.display_name, latitude, longitude }));
      }
    } catch {
      setError(language === 'ar' ? 'تم تحديد الموقع، لكن تعذر جلب العنوان تلقائياً' : 'Location selected, but the address could not be loaded automatically');
    }
  };

  return (
    <section className="page-shell">
      <div className="container" style={{ maxWidth: 980 }}>
        <div className="section-heading mb-4">
          <p className="eyebrow dark">{t('ownerTools')}</p>
          <h2>{id ? t('editProperty') : t('listProperty')}</h2>
        </div>

        <form className="auth-card property-form" onSubmit={handleSubmit}>
          {error ? <div className="alert alert-danger">{error}</div> : null}

          <div className="row g-3">
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
            <div className="col-12">
              <label>
                <span>{t('description')}</span>
                <textarea name="description" rows="5" value={form.description} onChange={handleChange} required />
              </label>
            </div>

            <div className="col-md-4">
              <label>
                <span>{t('governorate')}</span>
                <SearchableLocation
                  id={form.governorate_id}
                  options={governorates}
                  language={language}
                  listId="governorate-options"
                  placeholder={language === 'ar' ? 'ابحث عن المحافظة' : 'Search governorate'}
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
                  listId="city-options"
                  placeholder={language === 'ar' ? 'ابحث عن المدينة' : 'Search city'}
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

            <div className="col-12">
              <label>
                <span>{t('address')}</span>
                <input name="address" value={form.address} onChange={handleChange} required />
              </label>
              {mapPosition ? <small className="form-hint">Latitude: {mapPosition[0].toFixed(6)} · Longitude: {mapPosition[1].toFixed(6)}</small> : null}
            </div>

            <div className="col-12">
              <label>
                <span>{language === 'ar' ? 'اختر صور العقار' : 'Choose property images'}</span>
                <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={handleImagesChange} disabled={loading} />
                <small className="form-hint">
                  {images.length ? `${images.length} ${language === 'ar' ? 'صور مختارة' : 'images selected'}` : (language === 'ar' ? 'يمكنك اختيار حتى 10 صور' : 'You can choose up to 10 images')}
                </small>
              </label>
            </div>
          </div>

          <div className="detail-actions mt-4">
            <button type="submit" className="btn btn-primary rounded-pill" disabled={loading}>
              {loading ? t('saving') : (id ? t('updateListing') : t('submitListing'))}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
