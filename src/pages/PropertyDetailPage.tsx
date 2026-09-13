import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from '../store/hooks';
import { Link, useParams } from 'react-router-dom';
import { MapContainer, Marker, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBath,
  faBed,
  faBuilding,
  faCity,
  faHeart,
  faMapMarkerAlt,
  faRulerCombined,
  faChevronLeft,
  faChevronRight,
  faXmark
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

const markerIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  shadowSize: [41, 41]
});

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
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchProperty(id));
    setActiveImageIndex(0);
    setLightboxOpen(false);
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
  const hasImages = images.length > 0;
  const currentImage = hasImages ? images[activeImageIndex % images.length] : null;
  const coverImage = currentImage ? getImageUrl(currentImage.filePath) : getImageUrl();
  const showPreviousImage = () => setActiveImageIndex((current) => (current - 1 + images.length) % images.length);
  const showNextImage = () => setActiveImageIndex((current) => (current + 1) % images.length);
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
            <div className="property-slider">
              <img
                src={coverImage}
                alt={`${property.title} ${activeImageIndex + 1}`}
                className="property-main-image"
                onClick={() => setLightboxOpen(true)}
                onError={(event) => { if (event.currentTarget.src !== defaultPropertyImage) event.currentTarget.src = defaultPropertyImage; }}
              />
              {images.length > 1 ? (
                <>
                  <button type="button" className="property-slider-button property-slider-prev" onClick={showPreviousImage} aria-label="Previous image">
                    <FontAwesomeIcon icon={faChevronLeft} />
                  </button>
                  <button type="button" className="property-slider-button property-slider-next" onClick={showNextImage} aria-label="Next image">
                    <FontAwesomeIcon icon={faChevronRight} />
                  </button>
                  <span className="property-slider-counter">{activeImageIndex + 1} / {images.length}</span>
                </>
              ) : null}
            </div>
            <div className="property-thumb-row">
              {images.map((image, index) => (
                <button type="button" className={`property-thumb-button ${index === activeImageIndex ? 'active' : ''}`} key={image.id || index} onClick={() => setActiveImageIndex(index)} aria-label={`Show image ${index + 1}`}>
                  <img src={getImageUrl(image.filePath)} alt={`${property.title} ${index + 1}`} onError={(event) => { if (event.currentTarget.src !== defaultPropertyImage) event.currentTarget.src = defaultPropertyImage; }} />
                </button>
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
            </div>
            <div className="location-line">
              <FontAwesomeIcon icon={faMapMarkerAlt} />
              {property.latitude && property.longitude ? (
                <div className="detail-map-wrapper" style={{ width: '100%', maxWidth: 420, height: 360 }}>
                  <MapContainer
                    className="property-location-map"
                    center={[Number(property.latitude), Number(property.longitude)]}
                    zoom={8}
                    scrollWheelZoom={false}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      attribution='&copy; OpenStreetMap contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker position={[Number(property.latitude), Number(property.longitude)]} icon={markerIcon} />
                  </MapContainer>
                </div>
              ) : (
                <span>{property.address}</span>
              )}
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
              {property.approved_at ? (
                <div><span>{language === 'ar' ? 'تاريخ موافقة الإدارة' : 'Admin approval date'}</span><strong>{new Date(property.approved_at).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-EG')}</strong></div>
              ) : null}
            </div>

            <div className="detail-actions">
              <Link to="/properties" className="btn btn-quiet dark-btn">Back to listings</Link>
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
      {lightboxOpen ? (
        <div className="property-lightbox" role="dialog" aria-modal="true" aria-label="Property image gallery" onClick={() => setLightboxOpen(false)}>
          <button type="button" className="property-lightbox-close" onClick={() => setLightboxOpen(false)} aria-label="Close gallery">
            <FontAwesomeIcon icon={faXmark} />
          </button>
          {images.length > 1 ? <button type="button" className="property-lightbox-button property-lightbox-prev" onClick={(event) => { event.stopPropagation(); showPreviousImage(); }} aria-label="Previous image"><FontAwesomeIcon icon={faChevronLeft} /></button> : null}
          <img src={coverImage} alt={`${property.title} ${activeImageIndex + 1}`} onClick={(event) => event.stopPropagation()} />
          {images.length > 1 ? <button type="button" className="property-lightbox-button property-lightbox-next" onClick={(event) => { event.stopPropagation(); showNextImage(); }} aria-label="Next image"><FontAwesomeIcon icon={faChevronRight} /></button> : null}
          <span className="property-lightbox-counter">{activeImageIndex + 1} / {images.length}</span>
        </div>
      ) : null}
    </section>
  );
}
