import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from '../store/hooks';
import { Link, useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBath,
  faBed,
  faBuilding,
  faCity,
  faHeart,
  faMapMarkerAlt,
  faRulerCombined,
  faStar
} from '@fortawesome/free-solid-svg-icons';
import { clearSelectedProperty, fetchProperty } from '../features/properties/propertySlice.js';
import { addFavorite, removeFavorite } from '../features/favorites/favoriteSlice.js';
import api from '../services/api.js';
import { useLanguage } from '../i18n/LanguageContext';

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

export default function PropertyDetailPage() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const property = useSelector((state) => state.properties.selected);
  const detailStatus = useSelector((state) => state.properties.detailStatus);
  const token = useSelector((state) => state.auth.token);
  const favorites = useSelector((state) => state.favorites.items);
  const { language, t } = useLanguage();
  const [reportReason, setReportReason] = useState('fake_property');
  const [reportDetails, setReportDetails] = useState('');
  const [reportOpen, setReportOpen] = useState(false);
  const [reportStatus, setReportStatus] = useState('');
  const [reportError, setReportError] = useState('');
  const [reporting, setReporting] = useState(false);

  useEffect(() => {
    dispatch(fetchProperty(id));
    return () => { dispatch(clearSelectedProperty()); };
  }, [dispatch, id]);

  if (detailStatus === 'loading' || !property) {
    return (
      <section className="page-shell">
        <div className="container"><div className="loading-card">Loading property details...</div></div>
      </section>
    );
  }

  const images = Array.isArray(property.images) ? property.images : [];
  const coverImage = images[0] ? getImageUrl(images[0].filePath) : getImageUrl();
  const isFavorite = favorites.some((favorite) => Number(favorite.id) === Number(property.id) || Number(favorite.property_id) === Number(property.id));
  const reportReasons = [
    ['fake_property', t('reportFakeProperty')],
    ['incorrect_information', t('reportIncorrectInformation')],
    ['wrong_price', t('reportWrongPrice')],
    ['duplicate_listing', t('reportDuplicateListing')],
    ['inappropriate_content', t('reportInappropriateContent')],
    ['other', t('reportOther')]
  ];

  const submitReport = async (event) => {
    event.preventDefault();
    setReporting(true);
    setReportError('');
    setReportStatus('');
    try {
      await api.post(`/properties/${property.id}/report`, { reason: reportReason, details: reportDetails });
      setReportStatus(t('reportSubmitted'));
      setReportDetails('');
      setReportOpen(false);
    } catch (error) {
      setReportError(error.response?.data?.message || t('reportFailed'));
    } finally {
      setReporting(false);
    }
  };

  return (
    <section className="page-shell property-detail-shell">
      <div className="container">
        <nav className="breadcrumb-row">
          <Link to="/">Home</Link>
          <span>/</span>
          <Link to="/properties">Properties</Link>
          <span>/</span>
          <span>{property.title}</span>
        </nav>

        <div className="property-detail-card">
          <div className="property-image-panel">
            <img src={coverImage} alt={property.title} className="property-main-image" onError={(event) => { if (event.currentTarget.src !== defaultPropertyImage) event.currentTarget.src = defaultPropertyImage; }} />
            <div className="property-thumb-row">
              {images.slice(0, 4).map((image, index) => (
                <img key={image.id || index} src={getImageUrl(image.filePath)} alt={`${property.title} ${index + 1}`} onError={(event) => { if (event.currentTarget.src !== defaultPropertyImage) event.currentTarget.src = defaultPropertyImage; }} />
              ))}
            </div>
          </div>

          <div className="property-info-panel">
            <div className="property-meta-header">
              <span className="property-chip">{property.purpose === 'sale' ? 'For sale' : 'For rent'}</span>
              <span className="property-chip light">{property.property_type}</span>
            </div>
            <h1>{property.title}</h1>
            {token ? <button type="button" className={`favorite-button detail-favorite-button ${isFavorite ? 'is-favorite' : ''}`} aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'} onClick={() => dispatch(isFavorite ? removeFavorite(property.id) : addFavorite(property.id))}><FontAwesomeIcon icon={faHeart} /> <span>{isFavorite ? 'Saved' : 'Save'}</span></button> : null}
            <div className="property-price-row">
              <strong>{Number(property.price).toLocaleString('en-EG')} {property.currency}</strong>
              <span>{property.city}</span>
            </div>
            <div className="location-line">
              <FontAwesomeIcon icon={faMapMarkerAlt} />
              <span>{property.address}</span>
            </div>
            <p className="property-description">{property.description}</p>

            <div className="stats-grid">
              <div><FontAwesomeIcon icon={faBed} /><strong>{property.bedrooms ?? 0}</strong><span>Bedrooms</span></div>
              <div><FontAwesomeIcon icon={faBath} /><strong>{property.bathrooms ?? 0}</strong><span>Bathrooms</span></div>
              <div><FontAwesomeIcon icon={faRulerCombined} /><strong>{property.area_sqm}</strong><span>sqm</span></div>
              <div><FontAwesomeIcon icon={faBuilding} /><strong>{property.floor ?? '—'}</strong><span>Floor</span></div>
            </div>

            <div className="detail-info-panel">
              <div><span>Governorate</span><strong>{property.governorate}</strong></div>
              <div><span>City</span><strong>{property.city}</strong></div>
              <div><span>Furnished</span><strong>{property.furnished ? 'Yes' : 'No'}</strong></div>
            </div>

            <div className="detail-actions">
              <Link to="/properties" className="btn btn-quiet dark-btn">Back to listings</Link>
              <button type="button" className="btn btn-primary rounded-pill">Contact owner</button>
              {token ? <button type="button" className="btn btn-outline-danger rounded-pill" onClick={() => { setReportOpen((current) => !current); setReportError(''); setReportStatus(''); }}>{t('reportProperty')}</button> : null}
            </div>
            {reportStatus ? <div className="alert alert-success mt-3">{reportStatus}</div> : null}
            {reportOpen ? (
              <form className="report-form mt-3" onSubmit={submitReport}>
                <label>
                  <span>{t('reportReason')}</span>
                  <select value={reportReason} onChange={(event) => setReportReason(event.target.value)}>
                    {reportReasons.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </label>
                <label>
                  <span>{t('reportDetails')}</span>
                  <textarea value={reportDetails} onChange={(event) => setReportDetails(event.target.value)} maxLength={1000} placeholder={t('reportDetailsPlaceholder')} />
                </label>
                {reportError ? <div className="alert alert-danger">{reportError}</div> : null}
                <button type="submit" className="btn btn-danger rounded-pill" disabled={reporting}>{reporting ? t('sending') : t('sendReport')}</button>
              </form>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
