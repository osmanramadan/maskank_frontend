import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from '../store/hooks';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faHeart, faHouse, faInbox, faPlus, faSignOutAlt, faUser } from '@fortawesome/free-solid-svg-icons';
import { clearCredentials } from '../features/auth/authSlice.js';
import { useLanguage } from '../i18n/LanguageContext';

export default function AppLayout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const token = useSelector((state) => state.auth.token);
  const user = useSelector((state) => state.auth.user ?? state.user.profile);
  const isAdmin = useSelector((state) => state.auth.user?.role || state.user.profile?.role) === 'ADMIN';
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
            <NavLink className="brand-mark" to="/" aria-label="الصفحة الرئيسية لمسكنك">
              <span className="brand-symbol"><FontAwesomeIcon icon={faHouse} /></span>
              <span>Maskank</span>
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
                  <div className="dropdown">
                    <button className="nav-link dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                      {t('properties')} <FontAwesomeIcon icon={faChevronDown} className="dropdown-chevron" />
                    </button>
                    <ul className="dropdown-menu dropdown-menu-end">
                      <li><NavLink className="dropdown-item" to="/properties">{t('properties')}</NavLink></li>
                      <li><NavLink className="dropdown-item" to="/properties?purpose=rent">{t('rent')}</NavLink></li>
                      <li><NavLink className="dropdown-item" to="/properties?purpose=sale">{t('buy')}</NavLink></li>
                    </ul>
                  </div>
                  {token ? (
                    <>
                      <NavLink className="nav-link" to="/favorites"><FontAwesomeIcon icon={faHeart} className="me-2" />{t('favorites')}</NavLink>
                      <NavLink className="nav-link" to="/messages"><FontAwesomeIcon icon={faInbox} className="me-2" />{t('messages')}</NavLink>
                      <NavLink className="nav-link" to="/add-property"><FontAwesomeIcon icon={faPlus} className="me-2" />{t('addProperty')}</NavLink>
                      {isAdmin ? <><NavLink className="nav-link" to="/admin">{t('admin')}</NavLink><NavLink className="nav-link" to="/admin/review">{t('review')}</NavLink></> : null}
                    </>
                  ) : null}
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
                      <FontAwesomeIcon icon={faSignOutAlt} className="me-2" />{t('logout')}
                    </button>
                  </>
                ) : (
                  <NavLink className="btn btn-outline-light rounded-pill px-3" to="/auth">
                    <FontAwesomeIcon icon={faUser} className="me-2" />{t('signIn')}
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
        <div className="container d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
          <div><strong>Maskank</strong><span className="footer-muted ms-3">{t('brandTagline')}</span></div>
          <div className="footer-muted">© 2026 Maskank · {language === 'ar' ? 'صُنع لمصر' : 'Built for Egypt'}</div>
        </div>
      </footer>
    </div>
  );
}
