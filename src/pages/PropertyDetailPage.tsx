import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from '../store/hooks';
import { Link, useNavigate, useParams } from 'react-router-dom';
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
  faXmark,
  faSpinner,
  faShareNodes,
  faFlag,
  faComment
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
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const property = useSelector((state) => state.properties.selected);
  const detailStatus = useSelector((state) => state.properties.detailStatus);
  const detailError = useSelector((state) => state.properties.error);
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
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  useEffect(() => {
    dispatch(fetchProperty(id));
    setActiveImageIndex(0);
    setLightboxOpen(false);
    return () => { dispatch(clearSelectedProperty()); };
  }, [dispatch, id]);

  useEffect(() => {
    if (detailStatus === 'failed' && detailError === 'Property not found') {
      navigate('/properties', { replace: true });
    }
  }, [detailError, detailStatus, navigate]);

  if (detailStatus === 'loading' || !property) {
    return (
      <section className="page-shell">
        <div className="container"><div className="loading-card">{t('loading')}</div></div>
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
  const propertyTypeKey = String(property.property_type || '').toLowerCase();
  const propertyTypeLabel = propertyTypeKey === 'apartment'
    ? t('apartment')
    : propertyTypeKey === 'villa'
      ? t('villa')
      : propertyTypeKey === 'shop'
        ? t('shop')
        : propertyTypeKey === 'office'
          ? t('office')
          : propertyTypeKey === 'land'
            ? t('land')
            : property.property_type;

  const submitReport = async (event) => {
    event.preventDefault();
    if (!token) {
      setReportOpen(false);
      setReportError(language === 'ar' ? 'يجب تسجيل الدخول أولًا لإرسال بلاغ عن العقار.' : 'You must sign in first to report this property.');
      return;
    }
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

  const handleFavoriteClick = async () => {
    if (favoriteLoading) return;
    setFavoriteLoading(true);
    try {
      await dispatch(isFavorite ? removeFavorite(property.id) : addFavorite(property.id));
    } finally {
      setFavoriteLoading(false);
    }
  };


  const openReport = () => {
    setReportError('');
    setReportStatus('');
    if (!token) {
      setReportError(language === 'ar' ? 'يجب تسجيل الدخول أولًا لإرسال بلاغ عن العقار.' : 'You must sign in first to report this property.');
      return;
    }
    setReportOpen((current) => !current);
  };

  return (
    <section className="page-shell property-detail-shell">
      <div className="container">
        <nav className="breadcrumb-row">
          <Link to="/">{language === 'ar' ? 'الرئيسية' : 'Home'}</Link><span>/</span>
          <Link to="/properties">{language === 'ar' ? 'العقارات' : 'Properties'}</Link><span>/</span>
          <span>{property.title}</span>
        </nav>

        <header className="property-detail-header">
          <div className="property-detail-heading">
            <div className="property-detail-price">
              <strong>{Number(property.price).toLocaleString('en-EG')} {property.currency}{property.purpose === 'rent' ? ` / ${t('perMonth')}` : ''}</strong>
              <small>{language === 'ar' ? `${Number(property.view_count || 0).toLocaleString('ar-EG')} مشاهدة` : `${Number(property.view_count || 0).toLocaleString('en-EG')} views`}</small>
            </div>
            <div className="property-meta-header">
              <Link className="property-chip property-chip-link" to={`/properties?purpose=${property.purpose === 'sale' ? 'sale' : 'rent'}`}>
                {property.purpose === 'sale' ? (language === 'ar' ? 'للبيع' : 'For sale') : (language === 'ar' ? 'للإيجار' : 'For rent')}
              </Link>
              <Link className="property-chip property-chip-link light" to={`/properties?type=${encodeURIComponent(propertyTypeKey)}`}>{propertyTypeLabel}</Link>
            </div>
            <h1>{property.title}</h1>
            <div className="property-detail-location"><FontAwesomeIcon icon={faMapMarkerAlt} /> {property.address || `${language === 'ar' ? (property.city_ar || property.city) : property.city}, ${language === 'ar' ? (property.governorate_ar || property.governorate) : property.governorate}`}</div>
          </div>
        </header>

        <div className="property-gallery">
          <div className="property-gallery-main property-slider">
            <img src={coverImage} alt={`${property.title} ${activeImageIndex + 1}`} onClick={() => setLightboxOpen(true)} onError={(event) => { if (event.currentTarget.src !== defaultPropertyImage) event.currentTarget.src = defaultPropertyImage; }} />
            {images.length > 1 ? <><button type="button" className="property-slider-button property-slider-prev" onClick={showPreviousImage} aria-label="Previous image"><FontAwesomeIcon icon={faChevronLeft} /></button><button type="button" className="property-slider-button property-slider-next" onClick={showNextImage} aria-label="Next image"><FontAwesomeIcon icon={faChevronRight} /></button><span className="property-slider-counter">{activeImageIndex + 1} / {images.length}</span></> : null}
          </div>
          <div className="property-gallery-side">
            {images.slice(1, 3).map((image, index) => (
              <button type="button" className="property-gallery-side-image" key={image.id || index} onClick={() => setActiveImageIndex(index + 1)}>
                <img src={getImageUrl(image.filePath)} alt={`${property.title} ${index + 2}`} onError={(event) => { if (event.currentTarget.src !== defaultPropertyImage) event.currentTarget.src = defaultPropertyImage; }} />
                {index === 1 && images.length > 3 ? <span>+{images.length - 3} {language === 'ar' ? 'صور' : 'photos'}</span> : null}
              </button>
            ))}
            {images.length < 2 ? <div className="property-gallery-placeholder" /> : null}
          </div>
        </div>

        <nav className="property-section-nav" aria-label={language === 'ar' ? 'أقسام الإعلان' : 'Listing sections'}>
          <a href="#property-details">{language === 'ar' ? 'التفاصيل' : 'Details'}</a>
          <a href="#property-description">{language === 'ar' ? 'الوصف' : 'Description'}</a>
          <a href="#property-location">{language === 'ar' ? 'الموقع' : 'Location'}</a>
          <a href="#property-contact">{language === 'ar' ? 'تواصل مع المعلن' : 'Contact'}</a>
        </nav>

        <div className="property-detail-actions">
          <button type="button" className={`property-action-button ${isFavorite ? 'is-favorite' : ''}`} disabled={!token || favoriteLoading} onClick={() => void handleFavoriteClick()}><FontAwesomeIcon icon={favoriteLoading ? faSpinner : faHeart} spin={favoriteLoading} /><span>{language === 'ar' ? 'حفظ' : 'Save'}</span></button>
          <button type="button" className="property-action-button" onClick={() => { if (navigator.share) void navigator.share({ title: property.title, url: window.location.href }); }}><FontAwesomeIcon icon={faShareNodes} /><span>{language === 'ar' ? 'مشاركة' : 'Share'}</span></button>
          <button type="button" className="property-action-button" onClick={openReport}><FontAwesomeIcon icon={faFlag} /><span>{language === 'ar' ? 'إبلاغ' : 'Report'}</span></button>
        </div>
        {reportStatus ? <div className="alert alert-success mt-3">{reportStatus}</div> : null}
        {reportError && !reportOpen ? <div className="alert alert-warning mt-3">{reportError}</div> : null}
        {reportOpen ? (
          <form className="report-form mt-3" onSubmit={submitReport}>
            <label><span>{t('reportReason')}</span><select value={reportReason} onChange={(event) => setReportReason(event.target.value)}>{reportReasons.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <label><span>{t('reportDetails')}</span><textarea value={reportDetails} onChange={(event) => setReportDetails(event.target.value)} maxLength={1000} placeholder={t('reportDetailsPlaceholder')} /></label>
            {reportError ? <div className="alert alert-danger">{reportError}</div> : null}
            <button type="submit" className="btn btn-danger rounded-pill" disabled={reporting}>{reporting ? t('sending') : t('sendReport')}</button>
          </form>
        ) : null}

        <div className="property-content-layout">
          <main className="property-content-main">
            <section id="property-details" className="property-detail-section">
              <h2>{language === 'ar' ? 'تفاصيل الإعلان' : 'Listing details'}</h2>
              <div className="stats-grid">
                <div><FontAwesomeIcon icon={faBed} /><strong>{property.bedrooms ?? 0}</strong><span>{language === 'ar' ? 'غرف نوم' : 'Bedrooms'}</span></div>
                <div><FontAwesomeIcon icon={faBath} /><strong>{property.bathrooms ?? 0}</strong><span>{language === 'ar' ? 'حمامات' : 'Bathrooms'}</span></div>
                <div><FontAwesomeIcon icon={faRulerCombined} /><strong>{property.area_sqm}</strong><span>{language === 'ar' ? 'م²' : 'sqm'}</span></div>
                <div><FontAwesomeIcon icon={faBuilding} /><strong>{property.floor ?? '—'}</strong><span>{language === 'ar' ? 'الطابق' : 'Floor'}</span></div>
              </div>
              <div className="detail-info-panel">
                <div><span>{language === 'ar' ? 'المحافظة' : 'Governorate'}</span><strong>{language === 'ar' ? (property.governorate_ar || property.governorate) : property.governorate}</strong></div>
                <div><span>{language === 'ar' ? 'المدينة' : 'City'}</span><strong>{language === 'ar' ? (property.city_ar || property.city) : property.city}</strong></div>
                <div><span>{language === 'ar' ? 'نوع الإعلان' : 'Listing type'}</span><strong>{propertyTypeLabel}</strong></div>
                <div><span>{language === 'ar' ? 'مفروش' : 'Furnished'}</span><strong>{property.furnished ? (language === 'ar' ? 'نعم' : 'Yes') : (language === 'ar' ? 'لا' : 'No')}</strong></div>
                <div><span>{language === 'ar' ? 'سعر المتر' : 'Price per sqm'}</span><strong>{property.area_sqm ? `${(Number(property.price) / Number(property.area_sqm)).toLocaleString('en-EG', { maximumFractionDigits: 0 })} ${property.currency}/${language === 'ar' ? 'م²' : 'sqm'}` : '—'}</strong></div>
                <div><span>{language === 'ar' ? 'رقم الإعلان' : 'Listing number'}</span><strong>EG-{property.id}</strong></div>
              </div>
            </section>

            <section id="property-description" className="property-detail-section">
              <h2>{language === 'ar' ? 'وصف العقار' : 'Property description'}</h2>
              <p className="property-description">{property.description || (language === 'ar' ? 'لا يوجد وصف لهذا العقار.' : 'No description provided.')}</p>
            </section>

            <section id="property-location" className="property-detail-section">
              <h2>{language === 'ar' ? 'الموقع على الخريطة' : 'Location on map'}</h2>
              {property.latitude && property.longitude ? (
                <div className="detail-map-wrapper">
                  <MapContainer className="property-location-map" center={[Number(property.latitude), Number(property.longitude)]} zoom={8} scrollWheelZoom={false}>
                    <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <Marker position={[Number(property.latitude), Number(property.longitude)]} icon={markerIcon} />
                  </MapContainer>
                </div>
              ) : <p className="property-description">{property.address}</p>}
            </section>
          </main>

          <aside id="property-contact" className="property-detail-sidebar">
            <section className="property-contact-card">
              <h2><FontAwesomeIcon icon={faComment} /> {language === 'ar' ? 'تواصل مع المعلن' : 'Contact advertiser'}</h2>
              {property.owner_id ? <Link className="property-owner-link" to={`/users/${property.owner_id}`}>{property.owner_avatar_url ? <img src={property.owner_avatar_url} alt="" /> : null}<strong>{property.owner_name || (language === 'ar' ? 'صاحب الإعلان' : 'Advertiser')}</strong><span>{language === 'ar' ? 'عرض الملف' : 'View profile'}</span></Link> : null}
              <div className="property-contact-actions">
                {property.whatsapp_phone ? <a className="property-contact-button whatsapp" href={`https://wa.me/20${String(property.whatsapp_phone).slice(1)}`} target="_blank" rel="noreferrer">{language === 'ar' ? 'واتساب' : 'WhatsApp'}</a> : null}
                {property.contact_phone ? <a className="property-contact-button phone" href={`tel:${property.contact_phone}`}>{language === 'ar' ? 'اتصال' : 'Call'} <span dir="ltr">{property.contact_phone}</span></a> : null}
              </div>
            </section>
            <Link to="/properties" className="btn btn-quiet dark-btn property-back-button">{language === 'ar' ? 'العودة إلى العقارات' : 'Back to listings'}</Link>
          </aside>
        </div>
      </div>
      {(property.whatsapp_phone || property.contact_phone) ? (
        <div className="mobile-contact-bar">
          {property.contact_phone ? <a className="mobile-contact-call" href={`tel:${property.contact_phone}`} aria-label={language === 'ar' ? 'اتصال' : 'Call'}>☎</a> : null}
          {property.whatsapp_phone ? <a className="property-contact-button whatsapp" href={`https://wa.me/20${String(property.whatsapp_phone).slice(1)}`} target="_blank" rel="noreferrer">{language === 'ar' ? 'واتساب' : 'WhatsApp'}</a> : null}
        </div>
      ) : null}
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
