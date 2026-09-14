import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from '../store/hooks';
import { fetchAdminProperties, fetchAdminReports } from '../features/admin/adminSlice.js';
import api from '../services/api.js';
import { useLanguage } from '../i18n/LanguageContext';
import { MapContainer, Marker, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';

const markerIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  shadowSize: [41, 41]
});

export default function ReviewPage() {
  const dispatch = useDispatch();
  const { t, language } = useLanguage();
  const adminRole = useSelector((state) => state.auth.user?.role || state.user.profile?.role);
  const properties = useSelector((state) => state.admin.properties);
  const reports = useSelector((state) => state.admin.reports);
  const [rejectionReasons, setRejectionReasons] = useState({});
  const [workingId, setWorkingId] = useState<number | null>(null);
  const [previewId, setPreviewId] = useState<number | null>(null);
  const [preview, setPreview] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [actionError, setActionError] = useState('');
  const [reportTab, setReportTab] = useState<'open' | 'closed'>('open');
  const formatReportDate = (value: string) => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat(language === 'ar' ? 'ar-EG' : 'en-EG', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(date);
  };
  const reportReasonLabel = (reason: string) => {
    const labels = {
      fake_property: language === 'ar' ? 'عقار وهمي' : 'Fake property',
      incorrect_information: language === 'ar' ? 'معلومات غير صحيحة' : 'Incorrect information',
      wrong_price: language === 'ar' ? 'سعر غير صحيح' : 'Wrong price',
      duplicate_listing: language === 'ar' ? 'إعلان مكرر' : 'Duplicate listing',
      inappropriate_content: language === 'ar' ? 'محتوى غير مناسب' : 'Inappropriate content',
      other: language === 'ar' ? 'سبب آخر' : 'Other'
    };
    return labels[reason] || reason || t('reportedListing');
  };

  useEffect(() => {
    if (adminRole === 'ADMIN') {
      dispatch(fetchAdminProperties({ status: 'pending', page: 1, limit: 20 }));
    }
  }, [adminRole, dispatch]);

  useEffect(() => {
    if (adminRole === 'ADMIN') {
      dispatch(fetchAdminReports({ page: 1, limit: 20, resolved: reportTab === 'closed' }));
    }
  }, [adminRole, dispatch, reportTab]);

  const approveProperty = async (id) => {
    setWorkingId(Number(id));
    setActionError('');
    try {
      await api.put(`/admin/properties/${id}/approve`);
      await dispatch(fetchAdminProperties({ status: 'pending', page: 1, limit: 20 }));
    } catch (error) {
      setActionError(error.response?.data?.message || t('approvePropertyFailed'));
    } finally {
      setWorkingId(null);
    }
  };

  const rejectProperty = async (id) => {
    const reason = rejectionReasons[id]?.trim();
    if (!reason) {
      setActionError(t('rejectionReasonRequired'));
      return;
    }
    setWorkingId(Number(id));
    setActionError('');
    try {
      await api.put(`/admin/properties/${id}/reject`, { reason });
      setRejectionReasons((current) => ({ ...current, [id]: '' }));
      await dispatch(fetchAdminProperties({ status: 'pending', page: 1, limit: 20 }));
    } catch (error) {
      setActionError(error.response?.data?.message || t('rejectPropertyFailed'));
    } finally {
      setWorkingId(null);
    }
  };

  const viewProperty = async (id) => {
    if (previewId === Number(id)) {
      setPreviewId(null);
      setPreview(null);
      setActiveImageIndex(0);
      return;
    }
    try {
      const response = await api.get(`/admin/properties/${id}`);
      setPreviewId(Number(id));
      setPreview(response.data.data);
      setActiveImageIndex(0);
      setActionError('');
    } catch (error) {
      setActionError(error.response?.data?.message || t('loadPropertyDetailsFailed'));
    }
  };

  const resolveReport = async (id) => {
    try {
      await api.put(`/admin/reports/${id}/resolve`);
      await dispatch(fetchAdminReports({ page: 1, limit: 20, resolved: false }));
    } catch (error) {
      setActionError(error.response?.data?.message || t('resolveReportFailed'));
    }
  };

  if (adminRole !== 'ADMIN') {
    return <section className="page-shell"><div className="container"><div className="empty-state">{t('adminAccessRequired')}</div></div></section>;
  }

  return (
    <section className="page-shell">
      <div className="container">
        <div className="section-heading mb-4">
          <p className="eyebrow dark">{t('moderation')}</p>
          <h2>{t('pendingSubmissions')}</h2>
        </div>
        {actionError ? <div className="alert alert-danger">{actionError}</div> : null}

        <div className="review-stack">
          {properties.length ? properties.map((property) => (
            <div key={property.id} className="review-item">
              <div>
                <strong>{property.title}</strong>
                <div className="review-summary">
                  <small>{property.status} · {property.property_type} · {property.purpose}</small>
                  <small>{language === 'ar' ? 'المالك: ' : 'Owner: '}{property.owner_name || t('user')} · {property.owner_email || '—'}</small>
                </div>
                {previewId === Number(property.id) && preview ? (
                  <div className="admin-property-preview">
                    {Array.isArray(preview.images) && preview.images.length ? (
                      <div className="admin-preview-section">
                        <h3>{language === 'ar' ? `صور الإعلان (${preview.images.length})` : `Listing images (${preview.images.length})`}</h3>
                        <div className="admin-image-slider">
                          <div className="admin-image-main">
                            <img src={preview.images[activeImageIndex]?.filePath} alt={preview.images[activeImageIndex]?.originalName || preview.title} />
                            {preview.images.length > 1 ? (
                              <>
                                <button type="button" className="admin-image-slider-button admin-image-slider-prev" onClick={() => setActiveImageIndex((current) => (current - 1 + preview.images.length) % preview.images.length)} aria-label={language === 'ar' ? 'الصورة السابقة' : 'Previous image'}>
                                  <FontAwesomeIcon icon={faChevronLeft} />
                                </button>
                                <button type="button" className="admin-image-slider-button admin-image-slider-next" onClick={() => setActiveImageIndex((current) => (current + 1) % preview.images.length)} aria-label={language === 'ar' ? 'الصورة التالية' : 'Next image'}>
                                  <FontAwesomeIcon icon={faChevronRight} />
                                </button>
                                <span className="admin-image-slider-counter">{activeImageIndex + 1} / {preview.images.length}</span>
                              </>
                            ) : null}
                          </div>
                          {preview.images.length > 1 ? (
                            <div className="admin-image-thumbs">
                              {preview.images.map((image, index) => (
                                <button type="button" className={`admin-image-thumb ${index === activeImageIndex ? 'active' : ''}`} key={image.id || index} onClick={() => setActiveImageIndex(index)} aria-label={`${language === 'ar' ? 'عرض الصورة' : 'Show image'} ${index + 1}`}>
                                  <img src={image.filePath} alt={image.originalName || preview.title} />
                                </button>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    ) : <small>{t('noImagesUploaded')}</small>}
                    <div className="admin-preview-section">
                      <h3>{language === 'ar' ? 'بيانات صاحب العقار' : 'Owner details'}</h3>
                      <div className="admin-preview-data">
                        <div><span>{language === 'ar' ? 'الاسم' : 'Name'}</span><strong>{preview.owner_name || property.owner_name || '—'}</strong></div>
                        <div><span>{language === 'ar' ? 'البريد الإلكتروني' : 'Email'}</span><strong>{preview.owner_email || property.owner_email || '—'}</strong></div>
                        <div><span>{language === 'ar' ? 'الهاتف' : 'Phone'}</span><strong>{preview.owner_phone || '—'}</strong></div>
                        <div><span>{language === 'ar' ? 'رقم العقار' : 'Property ID'}</span><strong>{preview.id || '—'}</strong></div>
                      </div>
                    </div>
                    <div className="admin-preview-section">
                      <h3>{language === 'ar' ? 'بيانات الإعلان' : 'Listing details'}</h3>
                      <div className="admin-preview-data">
                        <div><span>{t('title')}</span><strong>{preview.title || '—'}</strong></div>
                        <div><span>{t('price')}</span><strong>{Number(preview.price).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-EG')} {preview.currency || ''}</strong></div>
                        <div><span>{t('areaSqm')}</span><strong>{preview.area_sqm ?? '—'} m²</strong></div>
                        <div><span>{language === 'ar' ? 'النوع' : 'Type'}</span><strong>{preview.property_type || '—'}</strong></div>
                        <div><span>{language === 'ar' ? 'الغرض' : 'Purpose'}</span><strong>{preview.purpose || '—'}</strong></div>
                        <div><span>{language === 'ar' ? 'الحالة' : 'Status'}</span><strong>{preview.status || '—'}</strong></div>
                        <div><span>{language === 'ar' ? 'العملة' : 'Currency'}</span><strong>{preview.currency || '—'}</strong></div>
                        <div><span>{language === 'ar' ? 'غرف النوم' : 'Bedrooms'}</span><strong>{preview.bedrooms ?? '—'}</strong></div>
                        <div><span>{language === 'ar' ? 'الحمامات' : 'Bathrooms'}</span><strong>{preview.bathrooms ?? '—'}</strong></div>
                        <div><span>{language === 'ar' ? 'الطابق' : 'Floor'}</span><strong>{preview.floor ?? '—'}</strong></div>
                        <div><span>{language === 'ar' ? 'التأثيث' : 'Furnished'}</span><strong>{preview.furnished ? (language === 'ar' ? 'نعم' : 'Yes') : (language === 'ar' ? 'لا' : 'No')}</strong></div>
                        <div><span>{language === 'ar' ? 'سنة البناء' : 'Construction year'}</span><strong>{preview.construction_year ?? '—'}</strong></div>
                      </div>
                    </div>
                    <div className="admin-preview-section">
                      <h3>{language === 'ar' ? 'الموقع' : 'Location'}</h3>
                      <div className="admin-preview-data">
                        <div><span>{language === 'ar' ? 'المحافظة' : 'Governorate'}</span><strong>{preview.governorate || '—'}</strong></div>
                        <div><span>{language === 'ar' ? 'المدينة' : 'City'}</span><strong>{preview.city || '—'}</strong></div>
                        <div className="admin-preview-wide"><span>{t('address')}</span><strong>{preview.address || '—'}</strong></div>
                      </div>
                      {preview.latitude != null && preview.longitude != null ? (
                        <div className="admin-preview-map">
                          <MapContainer
                            center={[Number(preview.latitude), Number(preview.longitude)]}
                            zoom={14}
                            scrollWheelZoom={false}
                            style={{ height: '100%', width: '100%' }}
                          >
                            <TileLayer
                              attribution="&copy; OpenStreetMap contributors"
                              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            <Marker position={[Number(preview.latitude), Number(preview.longitude)]} icon={markerIcon} />
                          </MapContainer>
                        </div>
                      ) : (
                        <small>{language === 'ar' ? 'لم يتم تحديد الموقع على الخريطة' : 'No map location selected'}</small>
                      )}
                    </div>
                    <div className="admin-preview-section">
                      <h3>{language === 'ar' ? 'الوصف' : 'Description'}</h3>
                      <p>{preview.description || '—'}</p>
                    </div>
                    {preview.rejection_reason ? (
                      <div className="admin-preview-section">
                        <h3>{language === 'ar' ? 'سبب الرفض' : 'Rejection reason'}</h3>
                        <p>{preview.rejection_reason}</p>
                      </div>
                    ) : null}
                    <div className="admin-preview-dates">
                      <small>{language === 'ar' ? 'تاريخ الإرسال: ' : 'Submitted: '}{preview.created_at ? new Date(preview.created_at).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-EG') : '—'}</small>
                      <small>{language === 'ar' ? 'آخر تحديث: ' : 'Updated: '}{preview.updated_at ? new Date(preview.updated_at).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-EG') : '—'}</small>
                    </div>
                  </div>
                ) : null}
              </div>
              <div className="owner-listing-actions">
                <button type="button" className="btn btn-outline-primary rounded-pill" onClick={() => viewProperty(property.id)}>
                  {previewId === Number(property.id) ? t('hideDetails') : t('viewDetails')}
                </button>
                <button type="button" className="btn btn-primary rounded-pill" disabled={workingId === Number(property.id)} onClick={() => approveProperty(property.id)}>
                  {workingId === Number(property.id) ? t('saving') : t('approve')}
                </button>
                <input
                  value={rejectionReasons[property.id] || ''}
                  onChange={(event) => setRejectionReasons((current) => ({ ...current, [property.id]: event.target.value }))}
                  placeholder={t('rejectionReason')}
                  aria-label={`${t('rejectionReason')} ${property.title}`}
                  disabled={workingId === Number(property.id)}
                />
                <button type="button" className="btn btn-outline-danger rounded-pill" disabled={workingId === Number(property.id)} onClick={() => rejectProperty(property.id)}>{t('reject')}</button>
              </div>
            </div>
          )) : <div className="empty-state">{t('noPendingSubmissions')}</div>}
        </div>

        <div className="section-heading mt-5 mb-4">
          <p className="eyebrow dark">{t('reports')}</p>
          <h2>{reportTab === 'open' ? t('openReports') : t('closedReports')}</h2>
        </div>

        <div className="report-tabs" role="tablist" aria-label={t('reports')}>
          <button type="button" className={`btn rounded-pill ${reportTab === 'open' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setReportTab('open')} role="tab" aria-selected={reportTab === 'open'}>
            {t('openReports')}
          </button>
          <button type="button" className={`btn rounded-pill ${reportTab === 'closed' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setReportTab('closed')} role="tab" aria-selected={reportTab === 'closed'}>
            {t('closedReports')}
          </button>
        </div>

        <div className="review-stack">
          {reports.length ? reports.map((report) => (
            <div key={report.id} className="review-item">
              <div className="report-content">
                {report.property_id ? (
                  <Link className="report-property-link" to={`/properties/${report.property_id}`}>
                    {report.property_title || t('reportedListing')}
                  </Link>
                ) : (
                  <strong>{report.property_title || t('reportedListing')}</strong>
                )}
                <div className="report-meta">
                  <span className="report-reason">{reportReasonLabel(report.reason)}</span>
                  {report.reporter_id ? (
                    <Link className="report-reporter-link" to={`/users/${report.reporter_id}`}>
                      {report.reporter_name || t('user')}
                    </Link>
                  ) : (
                    <span>{report.reporter_name || t('user')}</span>
                  )}
                  <time dateTime={report.created_at}>{formatReportDate(report.created_at)}</time>
                </div>
                {report.details ? <p className="report-details">{report.details}</p> : null}
              </div>
              <div className="report-action">
                {reportTab === 'open' ? <button type="button" className="btn btn-outline-primary rounded-pill" onClick={() => resolveReport(report.id)}>{t('resolve')}</button> : <span className="report-status">{t('resolved')}</span>}
              </div>
            </div>
          )) : <div className="empty-state">{reportTab === 'open' ? t('noOpenReports') : t('noClosedReports')}</div>}
        </div>
      </div>
    </section>
  );
}
