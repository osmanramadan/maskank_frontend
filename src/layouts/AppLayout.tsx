import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from '../store/hooks';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faLocationDot } from '@fortawesome/free-solid-svg-icons';
import { clearCredentials } from '../features/auth/authSlice.js';
import { useLanguage } from '../i18n/LanguageContext';

export default function AppLayout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const token = useSelector((state) => state.auth.token);
  const user = useSelector((state) => state.auth.user ?? state.user.profile);
  const role = useSelector((state) => state.auth.user?.role || state.user.profile?.role);
  const isAdmin = role === 'ADMIN';
  const canCreateProperty = !token || role !== 'USER';
  const { language, toggleLanguage, t } = useLanguage();

  const handleLogout = () => {
    dispatch(clearCredentials());
    navigate('/');
  };

  return (
    <div className="app-shell">
      <header className="site-header">
        <nav className="navbar navbar-expand-lg">
          <div className="container py-2 header-inner">
            <NavLink className="brand-mark" to="/" aria-label="الصفحة الرئيسية لعقارات مصر">
              <img className="brand-logo" src="/logo-header-current.png?v=2" alt="عقارات مصر" />
            </NavLink>
            <button className="language-toggle header-language" type="button" onClick={toggleLanguage} aria-label={language === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}>
              {language === 'ar' ? 'EN' : 'عربي'}
            </button>
            <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#mainNav" aria-controls="mainNav" aria-label="Toggle navigation">
              <span className="navbar-toggler-icon" />
            </button>
            <div className="collapse navbar-collapse" id="mainNav">
              <div className="header-nav">
                <div className="primary-nav">
                  <NavLink className="nav-link" to="/">{t('home')}</NavLink>
                  <div className="dropdown properties-dropdown">
                    <NavLink className="nav-link properties-link" to="/properties">{t('properties')}</NavLink>
                    <button className="nav-link dropdown-toggle properties-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false" aria-label={language === 'ar' ? 'فتح قائمة العقارات' : 'Open properties menu'} />
                    <ul className="dropdown-menu dropdown-menu-end">
                      <li><Link className="dropdown-item" to="/properties?purpose=rent">{t('rent')}</Link></li>
                      <li><Link className="dropdown-item" to="/properties?purpose=sale">{t('buy')}</Link></li>
                    </ul>
                  </div>
                  <NavLink className="nav-link" to="/contact">{t('footerContact')}</NavLink>
                  <NavLink className="nav-link" to="/map">{t('map')}</NavLink>
                  <>
                    <NavLink className="nav-link" to="/favorites">{t('favorites')}</NavLink>
                    {canCreateProperty ? <NavLink className="nav-link" to="/add-property">{t('addProperty')}</NavLink> : null}
                      {token && isAdmin ? <><NavLink className="nav-link" to="/admin">{t('admin')}</NavLink><NavLink className="nav-link" to="/admin/review">{t('review')}</NavLink></> : null}
                  </>
                </div>
                <div className="account-nav">
                {token ? (
                  <>
                    <NavLink
                      className="nav-link account-nav-link"
                      to="/account"
                      title={user?.full_name || user?.fullName || t('account')}
                    >
                      {user?.full_name || user?.fullName || t('account')}
                    </NavLink>
                    <button className="btn btn-outline-light rounded-pill px-3" type="button" onClick={handleLogout}>
                      {t('logout')}
                    </button>
                  </>
                ) : (
                  <NavLink className="btn btn-outline-light rounded-pill px-3" to="/auth">
                    {t('signIn')}
                  </NavLink>
                )}
                </div>
              </div>
            </div>
          </div>
        </nav>
      </header>
      <main><Outlet /></main>
      <footer className="site-footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <NavLink className="footer-logo" to="/">
                <img className="footer-logo-image" src="/logo-header-current.png?v=2" alt="عقارات مصر" />
                <strong>عقارات مصر</strong>
              </NavLink>
              <p>{t('footerDescription')}</p>
              <div className="footer-socials">
                <a href="#" aria-label="Facebook"><strong>f</strong></a>
                <a href="#" aria-label="Instagram"><strong>◎</strong></a>
                <a href="mailto:info@maskank.com" aria-label={language === 'ar' ? 'البريد الإلكتروني' : 'Email'}><FontAwesomeIcon icon={faEnvelope} /></a>
              </div>
            </div>
            <div className="footer-column">
              <h3>{t('footerExplore')}</h3>
              <NavLink to="/properties">{t('properties')}</NavLink>
              <NavLink to="/properties?purpose=sale">{t('buy')}</NavLink>
              <NavLink to="/properties?purpose=rent">{t('rent')}</NavLink>
            </div>
            <div className="footer-column">
              <h3>{t('footerAccount')}</h3>
              <NavLink to="/account">{t('account')}</NavLink>
              <NavLink to="/favorites">{t('favorites')}</NavLink>
            </div>
            <div className="footer-column footer-contact">
              <h3>{t('footerContact')}</h3>
              <span><FontAwesomeIcon icon={faLocationDot} /> {language === 'ar' ? 'دمياط، دمياط الجديدة' : 'Damietta, New Damietta'}</span>
              <NavLink to="/contact">{t('footerContact')}</NavLink>
              <a href="mailto:aqaratmesr@gmail.com">aqaratmesr@gmail.com</a>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© 2026 عقارات مصر · {language === 'ar' ? 'صُنع لمصر' : 'Built for Egypt'}</span>
            <span>{t('footerTagline')}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
