import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from '../store/hooks';
import { Link } from 'react-router-dom';
import { fetchAdminProperties, fetchAdminStats } from '../features/admin/adminSlice.js';
import api from '../services/api.js';
import { useLanguage } from '../i18n/LanguageContext';

export default function AdminPage() {
  const dispatch = useDispatch();
  const { t, language } = useLanguage();
  const stats = useSelector((state) => state.admin.stats);
  const properties = useSelector((state) => state.admin.properties);
  const status = useSelector((state) => state.admin.status);
  const [propertiesLoading, setPropertiesLoading] = useState(true);
  const [actionError, setActionError] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    dispatch(fetchAdminStats());
    setPropertiesLoading(true);
    dispatch(fetchAdminProperties({ page: 1, limit: 100 })).finally(() => setPropertiesLoading(false));
  }, [dispatch]);

  const deleteProperty = async (property) => {
    if (!window.confirm(`${t('deleteListing')}\n\n${property.title}`)) return;
    setDeletingId(Number(property.id));
    setActionError('');
    try {
      await api.delete(`/admin/properties/${property.id}`);
      await dispatch(fetchAdminProperties({ page: 1, limit: 100 }));
      await dispatch(fetchAdminStats());
    } catch (error) {
      setActionError(error.response?.data?.message || (language === 'ar' ? 'تعذر حذف العقار' : 'Unable to delete property'));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="page-shell">
      <div className="container">
        <div className="section-heading mb-4">
          <p className="eyebrow dark">Admin dashboard</p>
          <h2>Market overview</h2>
        </div>

        {status === 'loading' || !stats ? (
          <div className="loading-card">Loading dashboard...</div>
        ) : (
          <div className="stats-grid admin-grid">
            <div>
              <strong>{stats.totalUsers ?? 0}</strong>
              <span>Total users</span>
            </div>
            <div>
              <strong>{stats.totalProperties ?? 0}</strong>
              <span>Properties</span>
            </div>
            <div>
              <strong>{stats.pendingProperties ?? 0}</strong>
              <span>Pending approvals</span>
            </div>
            <div>
              <strong>{stats.totalReports ?? 0}</strong>
              <span>Total reports</span>
            </div>
          </div>
        )}

        <div className="section-heading mt-5 mb-4">
          <p className="eyebrow dark">{t('properties')}</p>
          <h2>{language === 'ar' ? 'جميع عقارات المستخدمين' : 'All user properties'}</h2>
        </div>
        {actionError ? <div className="alert alert-danger">{actionError}</div> : null}
        {propertiesLoading ? (
          <div className="loading-card">{t('loading')}</div>
        ) : properties.length ? (
          <div className="review-stack">
            {properties.map((property) => (
              <div key={property.id} className="review-item">
                <div className="admin-property-info">
                  <strong>{property.title}</strong>
                  <div className="admin-property-data">
                    <div><span>{language === 'ar' ? 'المالك' : 'Owner'}</span><strong>{property.owner_name || t('user')}</strong></div>
                    <div><span>{language === 'ar' ? 'البريد الإلكتروني' : 'Email'}</span><strong>{property.owner_email || '—'}</strong></div>
                    <div><span>{language === 'ar' ? 'الحالة' : 'Status'}</span><strong>{property.status}</strong></div>
                    <div><span>{language === 'ar' ? 'النوع' : 'Type'}</span><strong>{property.property_type}</strong></div>
                    <div><span>{language === 'ar' ? 'الغرض' : 'Purpose'}</span><strong>{property.purpose}</strong></div>
                    <div><span>{language === 'ar' ? 'السعر' : 'Price'}</span><strong>{Number(property.price).toLocaleString('en-EG')} {property.currency}</strong></div>
                  </div>
                </div>
                <div className="owner-listing-actions">
                  <Link to={`/properties/${property.id}`} className="btn btn-primary rounded-pill">
                    {language === 'ar' ? 'عرض' : 'View'}
                  </Link>
                  <button
                    type="button"
                    className="btn btn-outline-danger rounded-pill"
                    disabled={deletingId === Number(property.id)}
                    onClick={() => deleteProperty(property)}
                  >
                    {deletingId === Number(property.id) ? (language === 'ar' ? 'جارٍ الحذف...' : 'Deleting...') : t('delete')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">{t('noProperties')}</div>
        )}
      </div>
    </section>
  );
}
