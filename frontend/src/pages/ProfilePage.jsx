import { useState } from 'react';
import useAuthStore from '@/store/authStore';
import api from '@/api/axios';

const INTERESTS_OPTIONS = [
  'fitness','gaming','technology','fashion',
  'cooking','outdoor','travel','wellness',
  'photography','art','music','sustainability',
];

export default function ProfilePage() {
  const { user, updateUser, logoutAll } = useAuthStore();

  const [form, setForm] = useState({
    firstName: user?.firstName || '',
    lastName:  user?.lastName  || '',
    age:       user?.age       || '',
    gender:    user?.gender    || '',
    location:  user?.location  || '',
    interests: user?.interests || [],
  });

  const [pwForm, setPwForm] = useState({
    currentPassword: '',
    newPassword:     '',
  });

  const [profileMsg, setProfileMsg] = useState({ text:'', error: false });
  const [pwMsg,      setPwMsg]      = useState({ text:'', error: false });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPw,      setSavingPw]      = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const toggleInterest = (interest) => {
    setForm((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
    }));
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    setProfileMsg({ text:'', error: false });
    try {
      const { data } = await api.patch('/users/profile', {
        ...form,
        age: form.age ? parseInt(form.age) : undefined,
      });
      updateUser(data.user);
      setProfileMsg({ text: 'Profile updated.', error: false });
    } catch (err) {
      setProfileMsg({
        text:  err.response?.data?.message || 'Update failed.',
        error: true,
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    setSavingPw(true);
    setPwMsg({ text:'', error: false });
    try {
      await api.patch('/users/change-password', pwForm);
      setPwForm({ currentPassword:'', newPassword:'' });
      setPwMsg({ text: 'Password changed.', error: false });
    } catch (err) {
      setPwMsg({
        text:  err.response?.data?.message || 'Password change failed.',
        error: true,
      });
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <div className="page-container max-w-2xl">
      <div className="page-header">
        <h1 className="page-title">Profile</h1>
        <p className="page-subtitle">{user?.email}</p>
      </div>

      {/* ── Profile info ─────────────────────────────────────────── */}
      <div className="card mb-6">
        <h2 className="section-title">Personal information</h2>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="label">First name</label>
            <input name="firstName" className="input"
                   value={form.firstName} onChange={handleChange} />
          </div>
          <div>
            <label className="label">Last name</label>
            <input name="lastName" className="input"
                   value={form.lastName} onChange={handleChange} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="label">Age</label>
            <input name="age" type="number" className="input"
                   value={form.age} onChange={handleChange}
                   min="13" max="120" />
          </div>
          <div>
            <label className="label">Gender</label>
            <select name="gender" className="input"
                    value={form.gender} onChange={handleChange}>
              <option value="">Select…</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="prefer_not_to_say">Prefer not to say</option>
            </select>
          </div>
        </div>

        <div className="mb-4">
          <label className="label">Location</label>
          <input name="location" className="input"
                 value={form.location} onChange={handleChange}
                 placeholder="New York, NY" />
        </div>

        <div className="mb-5">
          <label className="label">
            Interests
            <span className="text-slate-400 font-normal ml-1">
              (used to improve recommendations)
            </span>
          </label>
          <div className="flex flex-wrap gap-2 mt-1">
            {INTERESTS_OPTIONS.map((interest) => (
              <button
                key={interest}
                type="button"
                onClick={() => toggleInterest(interest)}
                className={`px-3 py-1 rounded-full text-xs font-medium
                            border transition-colors
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

        {profileMsg.text && (
          <div className={`text-sm px-4 py-2 rounded-lg mb-4
            ${profileMsg.error
              ? 'bg-red-50 text-red-600'
              : 'bg-green-50 text-green-600'
            }`}>
            {profileMsg.text}
          </div>
        )}

        <button
          onClick={handleSaveProfile}
          disabled={savingProfile}
          className="btn-primary"
        >
          {savingProfile ? 'Saving…' : 'Save changes'}
        </button>
      </div>

      {/* ── Change password ──────────────────────────────────────── */}
      <div className="card mb-6">
        <h2 className="section-title">Change password</h2>

        <div className="flex flex-col gap-4">
          <div>
            <label className="label">Current password</label>
            <input
              type="password" className="input"
              value={pwForm.currentPassword}
              onChange={(e) => setPwForm((p) => ({
                ...p, currentPassword: e.target.value
              }))}
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="label">New password</label>
            <input
              type="password" className="input"
              value={pwForm.newPassword}
              onChange={(e) => setPwForm((p) => ({
                ...p, newPassword: e.target.value
              }))}
              placeholder="Min 8 chars, 1 uppercase, 1 number"
            />
          </div>
        </div>

        {pwMsg.text && (
          <div className={`text-sm px-4 py-2 rounded-lg mt-4
            ${pwMsg.error
              ? 'bg-red-50 text-red-600'
              : 'bg-green-50 text-green-600'
            }`}>
            {pwMsg.text}
          </div>
        )}

        <button
          onClick={handleChangePassword}
          disabled={savingPw || !pwForm.currentPassword || !pwForm.newPassword}
          className="btn-primary mt-4"
        >
          {savingPw ? 'Updating…' : 'Update password'}
        </button>
      </div>

      {/* ── Danger zone ──────────────────────────────────────────── */}
      <div className="card border-red-100">
        <h2 className="section-title text-red-500">Danger zone</h2>
        <p className="text-sm text-slate-500 mb-4">
          Sign out from all devices. Your session on every browser and
          device will be terminated immediately.
        </p>
        <button
          onClick={logoutAll}
          className="btn-danger"
        >
          Sign out all devices
        </button>
      </div>
    </div>
  );
}
