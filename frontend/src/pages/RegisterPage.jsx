import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '@/store/authStore';

const INTERESTS_OPTIONS = [
  'fitness', 'gaming', 'technology', 'fashion',
  'cooking', 'outdoor', 'travel', 'wellness',
  'photography', 'art', 'music', 'sustainability',
];

export default function RegisterPage() {
  const { register } = useAuthStore();
  const navigate     = useNavigate();

  const [form, setForm] = useState({
    firstName: '',
    lastName:  '',
    email:     '',
    password:  '',
    age:       '',
    gender:    '',
    location:  '',
    interests: [],
  });
  const [errors,   setErrors]   = useState({});
  const [apiError, setApiError] = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: '' }));
    setApiError('');
  };

  const toggleInterest = (interest) => {
    setForm((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
    }));
  };

  const validate = () => {
    const errs = {};
    if (!form.firstName.trim()) errs.firstName = 'First name is required';
    if (!form.lastName.trim())  errs.lastName  = 'Last name is required';
    if (!form.email.trim())     errs.email     = 'Email is required';
    if (!form.password)         errs.password  = 'Password is required';
    else if (form.password.length < 8)
      errs.password = 'Password must be at least 8 characters';
    else if (!/[A-Z]/.test(form.password))
      errs.password = 'Password must contain an uppercase letter';
    else if (!/[0-9]/.test(form.password))
      errs.password = 'Password must contain a number';
    if (form.age && (isNaN(form.age) || form.age < 13 || form.age > 120))
      errs.age = 'Age must be between 13 and 120';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      const payload = {
        ...form,
        age: form.age ? parseInt(form.age) : undefined,
      };
      await register(payload);
      navigate('/');
    } catch (err) {
      setApiError(
        err.response?.data?.message || 'Registration failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center
                    bg-gradient-to-br from-primary-50 via-white to-surface-100
                    px-4 py-12">
      <div className="w-full max-w-lg">

        {/* Logo */}
        <div className="text-center mb-8">
          <span className="text-4xl text-primary-500 font-bold">✦</span>
          <h1 className="text-2xl font-bold text-slate-800 mt-2">Create your account</h1>
          <p className="text-sm text-slate-500 mt-1">
            Get personalised AI recommendations
          </p>
        </div>

        <div className="card">
          {apiError && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200
                            rounded-lg text-sm text-red-600">
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">

            {/* Name row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="label">First name</label>
                <input
                  id="firstName" name="firstName" type="text"
                  autoComplete="given-name"
                  value={form.firstName} onChange={handleChange}
                  className={`input ${errors.firstName ? 'input-error' : ''}`}
                  placeholder="Sarah"
                />
                {errors.firstName && <p className="error-text">{errors.firstName}</p>}
              </div>
              <div>
                <label htmlFor="lastName" className="label">Last name</label>
                <input
                  id="lastName" name="lastName" type="text"
                  autoComplete="family-name"
                  value={form.lastName} onChange={handleChange}
                  className={`input ${errors.lastName ? 'input-error' : ''}`}
                  placeholder="Chen"
                />
                {errors.lastName && <p className="error-text">{errors.lastName}</p>}
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="label">Email address</label>
              <input
                id="email" name="email" type="email"
                autoComplete="email"
                value={form.email} onChange={handleChange}
                className={`input ${errors.email ? 'input-error' : ''}`}
                placeholder="you@example.com"
              />
              {errors.email && <p className="error-text">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="label">Password</label>
              <input
                id="password" name="password" type="password"
                autoComplete="new-password"
                value={form.password} onChange={handleChange}
                className={`input ${errors.password ? 'input-error' : ''}`}
                placeholder="Min 8 chars, 1 uppercase, 1 number"
              />
              {errors.password && <p className="error-text">{errors.password}</p>}
            </div>

            {/* Age + Gender row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="age" className="label">
                  Age <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <input
                  id="age" name="age" type="number"
                  value={form.age} onChange={handleChange}
                  className={`input ${errors.age ? 'input-error' : ''}`}
                  placeholder="28" min="13" max="120"
                />
                {errors.age && <p className="error-text">{errors.age}</p>}
              </div>
              <div>
                <label htmlFor="gender" className="label">
                  Gender <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <select
                  id="gender" name="gender"
                  value={form.gender} onChange={handleChange}
                  className="input"
                >
                  <option value="">Select…</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
              </div>
            </div>

            {/* Location */}
            <div>
              <label htmlFor="location" className="label">
                Location <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <input
                id="location" name="location" type="text"
                value={form.location} onChange={handleChange}
                className="input"
                placeholder="New York, NY"
              />
            </div>

            {/* Interests */}
            <div>
              <label className="label">
                Interests <span className="text-slate-400 font-normal">(optional — improves recommendations)</span>
              </label>
              <div className="flex flex-wrap gap-2 mt-1">
                {INTERESTS_OPTIONS.map((interest) => (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleInterest(interest)}
                    className={`px-3 py-1 rounded-full text-xs font-medium
                                border transition-colors duration-150
                                ${form.interests.includes(interest)
                                  ? 'bg-primary-500 text-white border-primary-500'
                                  : 'bg-white text-slate-600 border-slate-200 hover:border-primary-300'
                                }`}
                  >
                    {interest}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-2.5"
            >
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-slate-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-600 font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
