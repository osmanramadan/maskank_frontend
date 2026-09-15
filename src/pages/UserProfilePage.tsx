import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../services/api.js';
import { useLanguage } from '../i18n/LanguageContext';

const roleLabels = {
  USER: ['مشتري / مستأجر', 'Buyer / renter'],
  OWNER: ['مالك عقار', 'Property owner'],
  BROKER: ['وسيط عقاري', 'Real estate broker'],
  COMPANY: ['صاحب شركة', 'Company owner'],
  ADMIN: ['مدير', 'Administrator']
};

export default function UserProfilePage() {
  const { id } = useParams();
  const { language } = useLanguage();
  const [profile, setProfile] = useState(null);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    let active = true;
    setStatus('loading');
    api.get(`/users/${id}`)
      .then((response) => { if (active) { setProfile(response.data.data); setStatus('succeeded'); } })
      .catch(() => { if (active) setStatus('failed'); });
    return () => { active = false; };
  }, [id]);

  if (status === 'loading') return <section className="page-shell"><div className="container"><div className="loading-card">{language === 'ar' ? 'جارٍ تحميل الملف...' : 'Loading profile...'}</div></div></section>;
  if (status === 'failed' || !profile) return <section className="page-shell"><div className="container"><div className="empty-state">{language === 'ar' ? 'الملف الشخصي غير موجود.' : 'Profile not found.'}</div></div></section>;

  const { user, properties } = profile;
  const name = user.full_name;
  const initials = name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
  const role = roleLabels[user.role] || [user.role, user.role];
  return (
    <section className="page-shell">
      <div className="container user-profile-layout">
        <div className="auth-card user-profile-card">
          {user.avatar_url ? <img className="user-profile-avatar" src={user.avatar_url} alt={name} /> : <div className="user-profile-avatar user-profile-avatar-fallback">{initials || '?'}</div>}
          <h1>{name}</h1>
          <p className="profile-role">{language === 'ar' ? role[0] : role[1]}</p>
          <div className="profile-details">
            {user.email ? <div><span>{language === 'ar' ? 'البريد الإلكتروني' : 'Email'}</span><strong>{user.email}</strong></div> : null}
            {user.phone ? <div><span>{language === 'ar' ? 'رقم الهاتف' : 'Phone'}</span><strong>{user.phone}</strong></div> : null}
            <div><span>{language === 'ar' ? 'تاريخ الانضمام' : 'Joined'}</span><strong>{new Date(user.created_at).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-EG')}</strong></div>
          </div>
        </div>
        <div className="auth-card">
          <h2>{language === 'ar' ? 'الأماكن التي أضافها' : 'Added properties'}</h2>
          {!properties.length ? <div className="empty-state">{language === 'ar' ? 'لا توجد أماكن متاحة.' : 'No public properties yet.'}</div> : (
            <div className="profile-properties">
              {properties.map((property) => (
                <Link className="profile-property-item" to={`/properties/${property.id}`} key={property.id}>
                  <strong>{property.title}</strong>
                  <span>{Number(property.price).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-EG')} {property.currency}</span>
                  <small>{property.city}، {property.governorate}</small>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
