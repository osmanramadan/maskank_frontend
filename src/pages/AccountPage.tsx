import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from '../store/hooks';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { deleteProperty, fetchMyProperties } from '../features/properties/propertySlice.js';
import { updateAccountName, updateAccountPhone, updateAccountRole, uploadAccountAvatar } from '../features/auth/authSlice.js';
import { useLanguage } from '../i18n/LanguageContext';

export default function AccountPage() {
  const dispatch = useDispatch();
  const { language, t } = useLanguage();
  const authUser = useSelector((state) => state.auth.user ?? state.user.profile);
  const ownerProperties = useSelector((state) => state.properties.ownerItems);
  const role = authUser?.role || 'USER';
  const authStatus = useSelector((state) => state.auth.status);
  const roleLabel = language === 'ar'
    ? ({ USER: 'مشتري / مستأجر', OWNER: 'مالك عقار', BROKER: 'وسيط عقاري', COMPANY: 'صاحب شركة', ADMIN: 'مدير' }[role] || role)
    : ({ USER: 'Buyer / renter', OWNER: 'Property owner', BROKER: 'Real estate broker', COMPANY: 'Company owner', ADMIN: 'Administrator' }[role] || role);
  const avatarInputRef = useRef(null);
  const [phone, setPhone] = useState('');
  const [editingPhone, setEditingPhone] = useState(false);
  const [name, setName] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const displayName = authUser?.full_name || authUser?.fullName || t('account');
  const initials = displayName.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
  const statusLabel = (status) => {
    const labels = {
      approved: language === 'ar' ? 'مقبول' : 'Approved',
      pending: language === 'ar' ? 'قيد المراجعة' : 'Pending review',
      rejected: language === 'ar' ? 'مرفوض' : 'Rejected',
      draft: language === 'ar' ? 'مسودة' : 'Draft'
    };
    return labels[status] || status;
  };

  useEffect(() => {
    if (authUser) {
      setPhone(authUser.phone || '');
      setName(authUser.full_name || authUser.fullName || '');
      dispatch(fetchMyProperties());
    }
  }, [dispatch, authUser]);

  const handleDelete = async (propertyId) => {
    const confirmed = window.confirm(t('deleteListing'));
    if (!confirmed) return;
    await dispatch(deleteProperty(propertyId));
  };

  const handleRoleChange = async (event) => {
    const result = await dispatch(updateAccountRole(event.target.value));
    if (updateAccountRole.rejected.match(result)) {
      window.alert(String(result.payload || (language === 'ar' ? 'تعذر تغيير نوع الحساب' : 'Unable to update account type')));
    }
  };

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const result = await dispatch(uploadAccountAvatar(file));
      if (uploadAccountAvatar.rejected.match(result)) {
        window.alert(String(result.payload || (language === 'ar' ? 'تعذر رفع صورة الحساب' : 'Unable to upload profile image')));
      }
    } finally {
      setAvatarUploading(false);
      event.target.value = '';
    }
  };

  const handleNameSave = async (event) => {
    event.preventDefault();
    const normalizedName = name.trim();
    if (normalizedName.length < 2 || normalizedName.length > 120) {
      window.alert(language === 'ar' ? 'الاسم يجب أن يكون بين حرفين و120 حرفًا.' : 'Name must be between 2 and 120 characters.');
      return;
    }
    const result = await dispatch(updateAccountName(normalizedName));
    if (updateAccountName.fulfilled.match(result)) {
      setEditingName(false);
    } else {
      window.alert(String(result.payload || (language === 'ar' ? 'تعذر تحديث الاسم.' : 'Unable to update your name.')));
    }
  };

  const handlePhoneSave = async (event) => {
    event.preventDefault();
    if (!/^01[0125]\d{8}$/.test(phone.trim())) {
      window.alert(language === 'ar'
        ? 'يرجى إدخال رقم هاتف مصري صحيح من 11 رقمًا.'
        : 'Enter a valid 11-digit Egyptian mobile number.');
      return;
    }
    const result = await dispatch(updateAccountPhone(phone.trim()));
    if (updateAccountPhone.fulfilled.match(result)) {
      setEditingPhone(false);
    } else {
      const message = String(result.payload || '');
      const translated = message === 'Phone number is already registered'
        ? (language === 'ar' ? 'رقم الهاتف مسجل بالفعل.' : message)
        : message;
      window.alert(translated || (language === 'ar' ? 'تعذر تحديث رقم الهاتف.' : 'Unable to update phone number.'));
    }
  };

  return (
    <section className="auth-page-shell">
      <div className="container account-layout">
        <div className="auth-card account-card mb-4">
          <p className="eyebrow dark">{t('myAccount')}</p>
          <div className="account-profile-header">
            {authUser?.avatar_url ? (
              <img className="account-avatar" src={authUser.avatar_url} alt={displayName} />
            ) : (
              <div className="account-avatar account-avatar-fallback" aria-label={displayName}>{initials || '?'}</div>
            )}
            <div className="account-profile-copy">
              <h1>{t('welcomeBack')}, {displayName}.</h1>
              <button type="button" className="btn btn-outline-primary rounded-pill account-avatar-button" onClick={() => avatarInputRef.current?.click()} disabled={avatarUploading || authStatus === 'loading'}>
                {avatarUploading ? <><FontAwesomeIcon icon={faSpinner} spin /> {language === 'ar' ? 'جارٍ رفع الصورة...' : 'Uploading...'}</> : (language === 'ar' ? 'رفع صورة الحساب' : 'Upload profile image')}
              </button>
              <input ref={avatarInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleAvatarChange} hidden />
            </div>
          </div>
          <div className="account-name-edit">
            <span>{language === 'ar' ? 'الاسم' : 'Name'}</span>
            {editingName ? (
              <form className="account-phone-edit" onSubmit={handleNameSave}>
                <input type="text" value={name} onChange={(event) => setName(event.target.value)} minLength={2} maxLength={120} required />
                <div className="account-phone-actions">
                  <button type="submit" className="btn btn-primary rounded-pill" disabled={authStatus === 'loading'}>
                    {authStatus === 'loading' ? <FontAwesomeIcon icon={faSpinner} spin /> : (language === 'ar' ? 'حفظ' : 'Save')}
                  </button>
                  <button type="button" className="btn btn-outline-secondary rounded-pill" onClick={() => { setName(displayName); setEditingName(false); }}>
                    {language === 'ar' ? 'إلغاء' : 'Cancel'}
                  </button>
                </div>
              </form>
            ) : (
              <>
                <strong>{displayName}</strong>
                <button type="button" className="btn btn-link p-0 account-edit-phone" onClick={() => setEditingName(true)}>
                  {language === 'ar' ? 'تعديل الاسم' : 'Edit name'}
                </button>
              </>
            )}
          </div>
          <p className="page-copy">
            {t('manageAccount')}
          </p>
          <div className="account-summary">
            <div className="account-email-cell">
                <span>{t('email')}</span>
                <strong className="account-email-value" title={authUser?.email || t('unavailable')}>
                  {authUser?.email || t('unavailable')}
                </strong>
            </div>
            <div>
              <span>{language === 'ar' ? 'رقم الهاتف' : 'Phone number'}</span>
              {editingPhone ? (
                <form className="account-phone-edit" onSubmit={handlePhoneSave}>
                  <input
                    type="tel"
                    inputMode="numeric"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    pattern="01[0125][0-9]{8}"
                    maxLength={11}
                    required
                  />
                  <div className="account-phone-actions">
                    <button type="submit" className="btn btn-primary rounded-pill" disabled={authStatus === 'loading'}>
                      {language === 'ar' ? 'حفظ' : 'Save'}
                    </button>
                    <button type="button" className="btn btn-outline-secondary rounded-pill" onClick={() => { setPhone(authUser?.phone || ''); setEditingPhone(false); }}>
                      {language === 'ar' ? 'إلغاء' : 'Cancel'}
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <strong>{authUser?.phone || t('unavailable')}</strong>
                  <button type="button" className="btn btn-link p-0 account-edit-phone" onClick={() => setEditingPhone(true)}>
                    {language === 'ar' ? 'تعديل رقم الهاتف' : 'Edit phone number'}
                  </button>
                </>
              )}
            </div>
            <div>
                <span>{t('role')}</span>
              <strong>{roleLabel}</strong>
              {role !== 'ADMIN' ? (
                <select
                  className="form-select mt-2"
                  value={role}
                  onChange={handleRoleChange}
                  disabled={authStatus === 'loading'}
                  aria-label={language === 'ar' ? 'تغيير نوع الحساب' : 'Change account type'}
                >
                  <option value="USER">{language === 'ar' ? 'مشتري / مستأجر' : 'Buyer / renter'}</option>
                  <option value="OWNER">{language === 'ar' ? 'مالك عقار' : 'Property owner'}</option>
                  <option value="BROKER">{language === 'ar' ? 'وسيط عقاري' : 'Real estate broker'}</option>
                  <option value="COMPANY">{language === 'ar' ? 'صاحب شركة' : 'Company owner'}</option>
                </select>
              ) : null}
            </div>
          </div>
        </div>

        {((role === 'USER' || role === 'OWNER' || role === 'BROKER' || role === 'COMPANY' || role === 'ADMIN') || ownerProperties.length > 0) && (
          <div className="auth-card account-listings-card">
            <div className="d-flex justify-content-between align-items-center gap-3 mb-3 flex-wrap">
              <div>
                <h2>{t('yourListings')}</h2>
              </div>
              {role === 'USER' || role === 'OWNER' || role === 'BROKER' || role === 'COMPANY' || role === 'ADMIN' ? (
                <Link to="/add-property" className="btn account-add-property">
                  <FontAwesomeIcon icon={faPlus} aria-hidden="true" />
                  <span>{t('addProperty')}</span>
                </Link>
              ) : null}
            </div>

            {!ownerProperties.length ? (
              <div className="empty-state">{t('noListings')}</div>
            ) : (
              <div className="owner-listing-stack">
                {ownerProperties.map((property) => (
                  <div key={property.id} className="owner-listing-item">
                    <div className="owner-listing-copy">
                      <strong>{property.title}</strong>
                      <span>{statusLabel(property.status)}</span>
                      <small>{property.address}</small>
                      {property.status === 'rejected' && property.rejection_reason ? <small className="text-danger">{t('rejectionReason')}: {property.rejection_reason}</small> : null}
                      {property.status === 'rejected' ? <small>{t('editListingHint')}</small> : null}
                    </div>
                    <div className="owner-listing-actions">
                      {property.status === 'approved' ? <Link to={`/properties/${property.id}`} className="btn btn-outline-primary rounded-pill">{t('view')}</Link> : null}
                      {role === 'USER' || role === 'OWNER' || role === 'BROKER' || role === 'COMPANY' || role === 'ADMIN' ? (
                        <>
                          <Link to={`/properties/${property.id}/edit`} className="btn btn-outline-secondary rounded-pill">{t('edit')}</Link>
                          <button type="button" className="btn btn-outline-danger rounded-pill" onClick={() => handleDelete(property.id)}>{t('delete')}</button>
                        </>
                      ) : null}
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
