import { useEffect } from 'react';
import { useDispatch, useSelector } from '../store/hooks';
import { Link } from 'react-router-dom';
import { deleteProperty, fetchMyProperties } from '../features/properties/propertySlice.js';
import { useLanguage } from '../i18n/LanguageContext';

export default function AccountPage() {
  const dispatch = useDispatch();
  const { language, t } = useLanguage();
  const authUser = useSelector((state) => state.auth.user ?? state.user.profile);
  const ownerProperties = useSelector((state) => state.properties.ownerItems);
  const role = authUser?.role || 'USER';
  const roleLabel = language === 'ar'
    ? ({ USER: 'مشتري / مستأجر', OWNER: 'مالك عقار', BROKER: 'وسيط عقاري', ADMIN: 'مدير' }[role] || role)
    : role;

  useEffect(() => {
    if (role === 'OWNER' || role === 'BROKER') {
      dispatch(fetchMyProperties());
    }
  }, [dispatch, role]);

  const handleDelete = async (propertyId) => {
    const confirmed = window.confirm(t('deleteListing'));
    if (!confirmed) return;
    await dispatch(deleteProperty(propertyId));
  };

  return (
    <section className="auth-page-shell">
      <div className="container">
        <div className="auth-card account-card mb-4">
          <p className="eyebrow dark">{t('myAccount')}</p>
          <h1>{t('welcomeBack')}, {authUser?.full_name || authUser?.fullName || t('account')}.</h1>
          <p className="page-copy">
            {t('manageAccount')}
          </p>
          <div className="account-summary">
            <div>
                <span>{t('email')}</span>
                <strong>{authUser?.email || t('unavailable')}</strong>
            </div>
            <div>
                <span>{t('role')}</span>
              <strong>{roleLabel}</strong>
            </div>
          </div>
        </div>

        {(role === 'OWNER' || role === 'BROKER') && (
          <div className="auth-card">
            <div className="d-flex justify-content-between align-items-center gap-3 mb-3 flex-wrap">
              <div>
                <p className="eyebrow dark">{t('ownerTools')}</p>
                <h2>{t('yourListings')}</h2>
              </div>
              <Link to="/add-property" className="btn btn-primary rounded-pill">{t('addProperty')}</Link>
            </div>

            {!ownerProperties.length ? (
              <div className="empty-state">{t('noListings')}</div>
            ) : (
              <div className="owner-listing-stack">
                {ownerProperties.map((property) => (
                  <div key={property.id} className="owner-listing-item">
                    <div className="owner-listing-copy">
                      <strong>{property.title}</strong>
                      <span>{property.status}</span>
                      <small>{property.address}</small>
                      {property.status === 'rejected' && property.rejection_reason ? <small className="text-danger">{language === 'ar' ? 'السبب: ' : 'Reason: '}{property.rejection_reason}</small> : null}
                      {property.status === 'rejected' ? <small>{language === 'ar' ? 'عدّل هذا الإعلان لإرساله للمراجعة مرة أخرى.' : 'Edit this listing to submit it for review again.'}</small> : null}
                    </div>
                    <div className="owner-listing-actions">
                      {property.status === 'approved' ? <Link to={`/properties/${property.id}`} className="btn btn-outline-primary rounded-pill">{t('view')}</Link> : null}
                      <Link to={`/properties/${property.id}/edit`} className="btn btn-outline-secondary rounded-pill">{t('edit')}</Link>
                      <button type="button" className="btn btn-outline-danger rounded-pill" onClick={() => handleDelete(property.id)}>{t('delete')}</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
