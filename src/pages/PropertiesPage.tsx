import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from '../store/hooks';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBed, faBath, faRulerCombined, faMapMarkerAlt, faHeart, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { fetchProperties } from '../features/properties/propertySlice.js';
import { addFavorite, removeFavorite } from '../features/favorites/favoriteSlice.js';
import { useLanguage } from '../i18n/LanguageContext';
import api from '../services/api.js';

const uploadsBaseUrl = (import.meta.env.VITE_UPLOADS_URL || '/uploads').replace(/\/$/, '');
const defaultPropertyImage = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800">
    <defs>
      <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0%" stop-color="#eef3f0"/>
        <stop offset="100%" stop-color="#d9e5de"/>
      </linearGradient>
    </defs>
    <rect width="1200" height="800" fill="url(#g)"/>
    <rect x="140" y="120" width="920" height="560" rx="26" fill="#f8faf8" stroke="#c7d5cb" stroke-width="4"/>
    <circle cx="600" cy="310" r="126" fill="#dfe9e2"/>
    <path d="M505 390 L600 240 L695 390 Z" fill="#c9d8cf"/>
    <rect x="455" y="380" width="290" height="94" rx="18" fill="#e6efe7"/>
    <text x="600" y="560" text-anchor="middle" font-family="Arial, sans-serif" font-size="42" fill="#3d5d51" font-weight="700">No property image</text>
  </svg>
`)}`;

function getImageUrl(filePath?: string | null) {
  if (!filePath) return defaultPropertyImage;
  const value = String(filePath).trim();
  if (value.startsWith('http')) return value;
  const normalized = value.replace(/\\/g, '/').replace(/^.*?uploads\//, '').replace(/^\/+/, '');
  return `${uploadsBaseUrl}/${normalized}`;
}

export default function PropertiesPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const { items, pagination, status, error } = useSelector((state) => state.properties);
  const token = useSelector((state) => state.auth.token);
  const favorites = useSelector((state) => state.favorites.items);
  const [locations, setLocations] = useState({ governorates: [], cities: [] });
  const [favoriteRequests, setFavoriteRequests] = useState<Record<string, boolean>>({});

  useEffect(() => {
    api.get('/locations').then((response) => {
      setLocations({
        governorates: response.data.data.governorates,
        cities: response.data.data.cities
      });
    }).catch(() => {
      setLocations({ governorates: [], cities: [] });
    });
  }, []);

  const filters = useMemo(() => ({
    keyword: searchParams.get('keyword') || '',
    purpose: searchParams.get('purpose') || '',
    type: searchParams.get('type') || '',
    governorate: searchParams.get('governorate') || '',
    city: searchParams.get('city') || '',
    page: Number(searchParams.get('page') || 1),
    limit: Number(searchParams.get('limit') || 12)
  }), [searchParams]);

  useEffect(() => {
    dispatch(fetchProperties(filters));
  }, [dispatch, filters]);

  const updateQuery = (nextFilters) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(nextFilters).forEach(([key, value]) => {
      if (!value) params.delete(key);
      else params.set(key, String(value));
    });
    params.set('page', '1');
    setSearchParams(params);
  };

  const handleFavoriteClick = async (propertyId: number, isFavorite: boolean) => {
    const key = String(propertyId);
    if (favoriteRequests[key]) return;
    setFavoriteRequests((current) => ({ ...current, [key]: true }));
    try {
      await dispatch(isFavorite ? removeFavorite(propertyId) : addFavorite(propertyId));
    } finally {
      setFavoriteRequests((current) => {
        const next = { ...current };
        delete next[key];
        return next;
      });
    }
  };

  const availableCities = locations.cities.filter(
    (city) => {
      const selectedGovernorate = locations.governorates.find(
        (governorate) => governorate.name_en === filters.governorate
      );
      return selectedGovernorate && String(city.governorate_id) === String(selectedGovernorate.id);
    }
  );

  if (status === 'loading' && items.length === 0) {
    return <section className="page-shell"><div className="container"><div className="loading-card">{t('loading')}</div></div></section>;
  }

  return (
    <section className="page-shell">
      <div className="container">
        <div className="section-heading d-flex justify-content-between align-items-end mb-4">
          <div>
            <p className="eyebrow dark">{t('propertySearch')}</p>
            <h2>{t('nextAddress')}</h2>
          </div>
        </div>

        <div className="filter-card mb-4">
          <div className="filter-grid">
            <select value={filters.purpose} onChange={(event) => updateQuery({ purpose: event.target.value })} className="form-select">
              <option value="">{t('buyOrRent')}</option>
              <option value="sale">{t('forSale')}</option>
              <option value="rent">{t('forRent')}</option>
            </select>
            <select value={filters.type} onChange={(event) => updateQuery({ type: event.target.value })} className="form-select">
              <option value="">{t('propertyType')}</option>
              <option value="apartment">{t('apartment')}</option>
              <option value="villa">{t('villa')}</option>
              <option value="shop">{t('shop')}</option>
              <option value="office">{t('office')}</option>
              <option value="land">{t('land')}</option>
            </select>
            <select value={filters.governorate} onChange={(event) => updateQuery({ governorate: event.target.value, city: '' })} className="form-select">
              <option value="">{t('governorate')}</option>
              {locations.governorates.map((governorate) => (
                <option key={governorate.id} value={governorate.name_en}>
                  {governorate.name_ar} - {governorate.name_en}
                </option>
              ))}
            </select>
            <select value={filters.city} onChange={(event) => updateQuery({ city: event.target.value })} className="form-select" disabled={!filters.governorate}>
              <option value="">{t('city')}</option>
              {availableCities.map((city) => (
                <option key={city.id} value={city.name_en}>
                  {city.name_ar} - {city.name_en}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error ? <div className="alert alert-danger">{error}</div> : null}

        <div className="results-grid">
          
          {
          
          items.map((property) => {
            const imageUrl = getImageUrl(Array.isArray(property.images) ? property.images[0]?.filePath : null);
            const isFavorite = favorites.some((favorite) => Number(favorite.id) === Number(property.id) || Number(favorite.property_id) === Number(property.id));
            return (
              <div key={property.id} className="property-card property-card-with-favorite">
                <img src={imageUrl} alt={property.title} className="property-card-image" onError={(event) => { if (event.currentTarget.src !== defaultPropertyImage) event.currentTarget.src = defaultPropertyImage; }} />
                <button
                  type="button"
                  className={`favorite-button ${isFavorite ? 'is-favorite' : ''}`}
                  disabled={Boolean(favoriteRequests[String(property.id)])}
                  aria-label={isFavorite ? 'Unlike' : 'Like'}
                  onClick={() => token
                    ? void handleFavoriteClick(Number(property.id), isFavorite)
                    : navigate('/auth')}
                >
                  <FontAwesomeIcon icon={favoriteRequests[String(property.id)] ? faSpinner : faHeart} spin={Boolean(favoriteRequests[String(property.id)])} />
                </button>
                <Link to={`/properties/${property.id}`} className="property-card-link">
                <div className="property-card-body">
                  <div className="property-card-topline">
                    <span>{property.purpose === 'sale' ? t('forSale') : t('forRent')}</span>
                    <strong>{Number(property.price).toLocaleString('en-EG')} {property.currency}</strong>
                  </div>
                  <h3>{property.title}</h3>
                  <div className="location-chip">
                    <FontAwesomeIcon icon={faMapMarkerAlt} />
                    <span>{property.city}, {property.governorate}</span>
                  </div>
                  <div className="meta-row">
                    <span><FontAwesomeIcon icon={faBed} /> {property.bedrooms ?? 0}</span>
                    <span><FontAwesomeIcon icon={faBath} /> {property.bathrooms ?? 0}</span>
                    <span><FontAwesomeIcon icon={faRulerCombined} /> {property.area_sqm} sqm</span>
                    <span>{language === 'ar' ? `${Number(property.view_count || 0).toLocaleString('ar-EG')} مشاهدة` : `${Number(property.view_count || 0).toLocaleString('en-EG')} views`}</span>
                  </div>
                </div>
                </Link>
              </div>
            );
          })}
        </div>

        {!items.length && status !== 'loading' ? (
          <div className="empty-state">{t('noProperties')}</div>
        ) : null}

        {pagination && pagination.totalPages > 1 ? (
          <div className="pagination-row">
            <button type="button" className="btn btn-outline-primary" disabled={pagination.page <= 1} onClick={() => setSearchParams({ ...Object.fromEntries(searchParams.entries()), page: String(pagination.page - 1) })}>
              {t('previous')}
            </button>
            <span>Page {pagination.page} of {pagination.totalPages}</span>
            <button type="button" className="btn btn-outline-primary" disabled={pagination.page >= pagination.totalPages} onClick={() => setSearchParams({ ...Object.fromEntries(searchParams.entries()), page: String(pagination.page + 1) })}>
              {t('next')}
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
