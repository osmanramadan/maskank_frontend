import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from '../store/hooks';
import { useNavigate } from 'react-router-dom';
import { clearCredentials, login, register } from '../features/auth/authSlice.js';
import { useLanguage } from '../i18n/LanguageContext';

const emptyRegisterForm = {
  fullName: '',
  email: '',
  phone: '',
  password: '',
  role: 'USER'
};

const emptyLoginForm = {
  email: '',
  password: ''
};

export default function AuthPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { token, status, error } = useSelector((state) => state.auth);
  const [mode, setMode] = useState('login');
  const [loginForm, setLoginForm] = useState(emptyLoginForm);
  const [registerForm, setRegisterForm] = useState(emptyRegisterForm);

  useEffect(() => {
    if (token) {
      navigate('/account', { replace: true });
    }
  }, [navigate, token]);

  useEffect(() => {
    if (status === 'failed' && error) {
      window.alert(error);
    }
  }, [error, status]);

  const handleLoginChange = (event) => {
    const { name, value } = event.target;
    setLoginForm((current) => ({ ...current, [name]: value }));
  };

  const handleRegisterChange = (event) => {
    const { name, value } = event.target;
    setRegisterForm((current) => ({ ...current, [name]: value }));
  };

  const handleLoginSubmit = async (event) => {
    event.preventDefault();
    const result = await dispatch(login(loginForm));
    if (login.fulfilled.match(result)) {
      navigate('/account', { replace: true });
    }
  };

  const handleRegisterSubmit = async (event) => {
    event.preventDefault();
    const result = await dispatch(register(registerForm));
    if (register.fulfilled.match(result)) {
      navigate('/account', { replace: true });
    }
  };

  const handleModeChange = (nextMode) => {
    dispatch(clearCredentials());
    setMode(nextMode);
  };

  return (
    <section className="auth-page-shell">
      <div className="container auth-page-wrap">
        <div className="auth-card">
          <div className="auth-mode-toggle" role="tablist" aria-label="Authentication mode">
            <button
              type="button"
              className={mode === 'login' ? 'mode-btn active' : 'mode-btn'}
              onClick={() => handleModeChange('login')}
            >
              {language === 'ar' ? 'دخول' : 'Sign in'}
            </button>
            <button
              type="button"
              className={mode === 'register' ? 'mode-btn active' : 'mode-btn'}
              onClick={() => handleModeChange('register')}
            >
              {language === 'ar' ? 'إنشاء حساب' : 'Create account'}
            </button>
          </div>

          {mode === 'login' ? (
            <form className="auth-form" onSubmit={handleLoginSubmit}>
              <p className="eyebrow dark">{language === 'ar' ? 'مرحباً بعودتك' : 'Welcome back'}</p>
              <h1>{language === 'ar' ? 'سجّل الدخول إلى عقارات مصر' : 'Sign in to Egypt Real Estate'}</h1>
              <label>
                <span>{language === 'ar' ? 'البريد الإلكتروني' : 'Email'}</span>
                <input name="email" type="email" value={loginForm.email} onChange={handleLoginChange} placeholder="you@example.com" required />
              </label>
              <label>
                <span>{language === 'ar' ? 'كلمة المرور' : 'Password'}</span>
                <input name="password" type="password" value={loginForm.password} onChange={handleLoginChange} placeholder="••••••••" required />
              </label>
              <button className="btn btn-primary w-100 rounded-pill" type="submit" disabled={status === 'loading'}>
                {status === 'loading' ? (language === 'ar' ? 'جارٍ تسجيل الدخول...' : 'Signing in...') : (language === 'ar' ? 'دخول' : 'Sign in')}
              </button>
            </form>
          ) : (
            <form className="auth-form" onSubmit={handleRegisterSubmit}>
              <p className="eyebrow dark">{language === 'ar' ? 'انضم إلى السوق' : 'Join the market'}</p>
              <h1>{language === 'ar' ? 'أنشئ حسابك' : 'Create your account'}</h1>
              <label>
                <span>{language === 'ar' ? 'الاسم بالكامل' : 'Full name'}</span>
                <input name="fullName" value={registerForm.fullName} onChange={handleRegisterChange} placeholder="Your full name" required />
              </label>
              <div className="row g-3">
                <div className="col-md-6">
                  <label>
                    <span>{language === 'ar' ? 'البريد الإلكتروني' : 'Email'}</span>
                    <input name="email" type="email" value={registerForm.email} onChange={handleRegisterChange} placeholder="you@example.com" required />
                  </label>
                </div>
                <div className="col-md-6">
                  <label>
                    <span>{language === 'ar' ? 'رقم الهاتف' : 'Phone'}</span>
                    <input name="phone" value={registerForm.phone} onChange={handleRegisterChange} placeholder="01012345678" required />
                  </label>
                </div>
              </div>
              <label>
                <span>{language === 'ar' ? 'كلمة المرور' : 'Password'}</span>
                <input name="password" type="password" value={registerForm.password} onChange={handleRegisterChange} placeholder="At least 8 characters" minLength="8" required />
              </label>
              <label>
                <span>{language === 'ar' ? 'نوع الحساب' : 'Account type'}</span>
                <select name="role" value={registerForm.role} onChange={handleRegisterChange}>
                  <option value="USER">{language === 'ar' ? 'مشتري / مستأجر' : 'Buyer / renter'}</option>
                  <option value="OWNER">{language === 'ar' ? 'مالك عقار' : 'Property owner'}</option>
                  <option value="BROKER">{language === 'ar' ? 'وسيط عقاري' : 'Broker'}</option>
                </select>
              </label>
              <button className="btn btn-primary w-100 rounded-pill" type="submit" disabled={status === 'loading'}>
                {status === 'loading' ? (language === 'ar' ? 'جارٍ إنشاء الحساب...' : 'Creating account...') : (language === 'ar' ? 'إنشاء حساب' : 'Create account')}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
