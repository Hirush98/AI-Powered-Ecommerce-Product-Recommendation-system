import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '@/store/authStore';

export default function LoginPage() {
  const { login } = useAuthStore();
  const navigate  = useNavigate();
  const location  = useLocation();

  const from = location.state?.from?.pathname || '/';

  const [form,    setForm]    = useState({ email: '', password: '' });
  const [errors,  setErrors]  = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: '' }));
    setApiError('');
  };

  const validate = () => {
    const errs = {};
    if (!form.email)    errs.email    = 'Email is required';
    if (!form.password) errs.password = 'Password is required';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate(from, { replace: true });
    } catch (err) {
      setApiError(
        err.response?.data?.message || 'Login failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center
                    bg-gradient-to-br from-primary-50 via-white to-surface-100
                    px-4 py-12">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <span className="text-4xl text-primary-500 font-bold">✦</span>
          <h1 className="text-2xl font-bold text-slate-800 mt-2">Welcome back</h1>
          <p className="text-sm text-slate-500 mt-1">Sign in to your ShopAI account</p>
        </div>

        <div className="card">
          {apiError && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200
                            rounded-lg text-sm text-red-600">
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="email" className="label">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={handleChange}
                className={`input ${errors.email ? 'input-error' : ''}`}
                placeholder="you@example.com"
              />
              {errors.email && <p className="error-text">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="label">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={form.password}
                onChange={handleChange}
                className={`input ${errors.password ? 'input-error' : ''}`}
                placeholder="••••••••"
              />
              {errors.password && <p className="error-text">{errors.password}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-2.5"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div className="divider" />

          {/* Quick test accounts */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-500 text-center">
              Quick fill — test accounts
            </p>
            {[
              { label: 'Admin',   email: 'admin@store.com',   password: 'Admin1234'  },
              { label: 'Sarah',   email: 'sarah@example.com', password: 'Sarah1234'  },
              { label: 'Marcus',  email: 'marcus@example.com',password: 'Marcus1234' },
            ].map(({ label, email, password }) => (
              <button
                key={label}
                type="button"
                onClick={() => setForm({ email, password })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200
                           text-slate-600 hover:bg-surface-100 transition-colors text-left"
              >
                <span className="font-medium">{label}</span>
                <span className="text-slate-400 ml-2">{email}</span>
              </button>
            ))}
          </div>
        </div>

        <p className="text-center text-sm text-slate-500 mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-primary-600 font-medium hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
