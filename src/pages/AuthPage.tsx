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

function getLocalizedAuthError(error, language) {
  if (language !== 'ar') return error;

  const translations = {
    'Phone number is already registered': 'رقم الهاتف مسجل بالفعل.',
    'Email is already registered': 'البريد الإلكتروني مسجل بالفعل.',
    'Email or phone is already registered': 'البريد الإلكتروني أو رقم الهاتف مسجل بالفعل.',
    'A valid Egyptian mobile number is required': 'يرجى إدخال رقم هاتف مصري صحيح.',
    'Full name, email, phone, and password are required': 'الاسم والبريد الإلكتروني ورقم الهاتف وكلمة المرور حقول مطلوبة.',
    'Password must contain at least 8 characters': 'يجب أن تتكون كلمة المرور من 8 أحرف على الأقل.',
    'Invalid email or password': 'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
    'Unable to sign in': 'تعذر تسجيل الدخول.',
    'Unable to create account': 'تعذر إنشاء الحساب.'
  };

  return translations[error] || 'حدث خطأ أثناء تنفيذ الطلب. يرجى المحاولة مرة أخرى.';
}

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
      window.alert(getLocalizedAuthError(error, language));
    }
  }, [error, language, status]);

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
    if (!/^01[0125]\d{8}$/.test(registerForm.phone.trim())) {
      window.alert(language === 'ar'
        ? 'يرجى إدخال رقم هاتف مصري صحيح يبدأ بـ 010 أو 011 أو 012 أو 015 ويتكون من 11 رقمًا.'
        : 'Enter a valid Egyptian mobile number starting with 010, 011, 012, or 015 (11 digits).');
      return;
    }
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
                    <input
                      name="phone"
                      type="tel"
                      inputMode="numeric"
                      value={registerForm.phone}
                      onChange={handleRegisterChange}
                      placeholder="01012345678"
                      pattern="01[0125][0-9]{8}"
                      maxLength={11}
                      title={language === 'ar' ? 'أدخل رقم هاتف مصري من 11 رقمًا' : 'Enter an 11-digit Egyptian mobile number'}
                      required
                    />
                  </label>
                </div>
              </div>
              <label>
                <span>{language === 'ar' ? 'كلمة المرور' : 'Password'}</span>
                <input name="password" type="password" value={registerForm.password} onChange={handleRegisterChange} placeholder="At least 8 characters" minLength="8" required />
              </label>
              <label>
                <span>{language === 'ar' ? 'نوع الحساب' : 'Account type'}</span>
                <select name="role" value={registerForm.role} onChange={handleRegisterChange} required>
                  <option value="USER">{language === 'ar' ? 'مشتري / مستأجر' : 'Buyer / renter'}</option>
                  <option value="OWNER">{language === 'ar' ? 'مالك عقار' : 'Property owner'}</option>
                  <option value="BROKER">{language === 'ar' ? 'وسيط عقاري' : 'Broker'}</option>
                  <option value="COMPANY">{language === 'ar' ? 'صاحب شركة' : 'Company owner'}</option>
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
