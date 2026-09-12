import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from '../store/hooks';
import { useNavigate } from 'react-router-dom';
import { clearCredentials, login, register } from '../features/auth/authSlice.js';

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
              Sign in
            </button>
            <button
              type="button"
              className={mode === 'register' ? 'mode-btn active' : 'mode-btn'}
              onClick={() => handleModeChange('register')}
            >
              Create account
            </button>
          </div>

          {mode === 'login' ? (
            <form className="auth-form" onSubmit={handleLoginSubmit}>
              <p className="eyebrow dark">Welcome back</p>
              <h1>Sign in to Maskank</h1>
              <label>
                <span>Email</span>
                <input name="email" type="email" value={loginForm.email} onChange={handleLoginChange} placeholder="you@example.com" required />
              </label>
              <label>
                <span>Password</span>
                <input name="password" type="password" value={loginForm.password} onChange={handleLoginChange} placeholder="••••••••" required />
              </label>
              <button className="btn btn-primary w-100 rounded-pill" type="submit" disabled={status === 'loading'}>
                {status === 'loading' ? 'Signing in...' : 'Sign in'}
              </button>
            </form>
          ) : (
            <form className="auth-form" onSubmit={handleRegisterSubmit}>
              <p className="eyebrow dark">Join the market</p>
              <h1>Create your account</h1>
              <label>
                <span>Full name</span>
                <input name="fullName" value={registerForm.fullName} onChange={handleRegisterChange} placeholder="Your full name" required />
              </label>
              <div className="row g-3">
                <div className="col-md-6">
                  <label>
                    <span>Email</span>
                    <input name="email" type="email" value={registerForm.email} onChange={handleRegisterChange} placeholder="you@example.com" required />
                  </label>
                </div>
                <div className="col-md-6">
                  <label>
                    <span>Phone</span>
                    <input name="phone" value={registerForm.phone} onChange={handleRegisterChange} placeholder="01012345678" required />
                  </label>
                </div>
              </div>
              <label>
                <span>Password</span>
                <input name="password" type="password" value={registerForm.password} onChange={handleRegisterChange} placeholder="At least 8 characters" minLength="8" required />
              </label>
              <label>
                <span>Account type</span>
                <select name="role" value={registerForm.role} onChange={handleRegisterChange}>
                  <option value="USER">Buyer / renter</option>
                  <option value="OWNER">Property owner</option>
                  <option value="BROKER">Broker</option>
                </select>
              </label>
              <button className="btn btn-primary w-100 rounded-pill" type="submit" disabled={status === 'loading'}>
                {status === 'loading' ? 'Creating account...' : 'Create account'}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
