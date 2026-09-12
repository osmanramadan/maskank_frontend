import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from '../store/hooks';
import { fetchAdminProperties, fetchAdminReports } from '../features/admin/adminSlice.js';
import api from '../services/api.js';
import { useLanguage } from '../i18n/LanguageContext';

export default function ReviewPage() {
  const dispatch = useDispatch();
  const { t } = useLanguage();
  const adminRole = useSelector((state) => state.auth.user?.role || state.user.profile?.role);
  const properties = useSelector((state) => state.admin.properties);
  const reports = useSelector((state) => state.admin.reports);
  const [rejectionReasons, setRejectionReasons] = useState({});
  const [workingId, setWorkingId] = useState<number | null>(null);
  const [previewId, setPreviewId] = useState<number | null>(null);
  const [preview, setPreview] = useState(null);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    if (adminRole === 'ADMIN') {
      dispatch(fetchAdminProperties({ status: 'pending', page: 1, limit: 20 }));
      dispatch(fetchAdminReports({ page: 1, limit: 20, resolved: false }));
    }
  }, [adminRole, dispatch]);

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
      return;
    }
    try {
      const response = await api.get(`/admin/properties/${id}`);
      setPreviewId(Number(id));
      setPreview(response.data.data);
      setActionError('');
    } catch (error) {
      setActionError(error.response?.data?.message || t('loadPropertyDetailsFailed'));
    }
  };

  const resolveReport = async (id) => {
    await api.put(`/admin/reports/${id}/resolve`);
    dispatch(fetchAdminReports({ page: 1, limit: 20, resolved: false }));
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
                <small>{property.status} · {property.property_type} · {property.purpose}</small>
                {previewId === Number(property.id) && preview ? (
                  <div className="admin-property-preview">
                    <p>{preview.description}</p>
                    <small>{t('price')}: {preview.price} {preview.currency} · {t('areaSqm')}: {preview.area_sqm}</small>
                    <small>{t('location')}: {preview.city}, {preview.governorate}</small>
                    {preview.address ? <small>{t('address')}: {preview.address}</small> : null}
                    {Array.isArray(preview.images) && preview.images.length ? (
                      <div className="admin-preview-images">
                        {preview.images.map((image) => <img key={image.id} src={image.filePath} alt={image.originalName || preview.title} />)}
                      </div>
                    ) : <small>{t('noImagesUploaded')}</small>}
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
          <h2>{t('openReports')}</h2>
        </div>

        <div className="review-stack">
          {reports.length ? reports.map((report) => (
            <div key={report.id} className="review-item">
              <div>
                <strong>{report.property_title || t('reportedListing')}</strong>
                <small>{report.reason || t('reportedListing')} · {report.reporter_name || t('user')} · {report.created_at}</small>
                {report.details ? <p className="mb-0 mt-2">{report.details}</p> : null}
              </div>
              <button type="button" className="btn btn-outline-primary rounded-pill" onClick={() => resolveReport(report.id)}>{t('resolve')}</button>
            </div>
          )) : <div className="empty-state">{t('noOpenReports')}</div>}
        </div>
      </div>
    </section>
  );
}
