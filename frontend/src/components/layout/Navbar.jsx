import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import useAuthStore from '@/store/authStore';
import clsx from 'clsx';

const navLinks = [
  { to: '/',                 label: 'Home'            },
  { to: '/products',         label: 'Products'        },
  { to: '/recommendations',  label: '✦ For You'       },
  { to: '/purchases',        label: 'My Orders'       },
];

const adminLinks = [
  { to: '/analytics', label: 'Analytics' },
];

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate  = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const allLinks = [
    ...navLinks,
    ...(user?.role === 'admin' ? adminLinks : []),
  ];

  return (
    <nav className="bg-white border-b border-slate-100 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* ── Logo ──────────────────────────────────────────── */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <span className="text-primary-500 text-xl font-bold">✦</span>
            <span className="font-bold text-slate-800 text-lg tracking-tight">ShopAI</span>
          </Link>

          {/* ── Desktop nav links ──────────────────────────────── */}
          {isAuthenticated && (
            <div className="hidden md:flex items-center gap-1">
              {allLinks.map(({ to, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  className={({ isActive }) =>
                    clsx(
                      'px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150',
                      isActive
                        ? 'bg-primary-50 text-primary-600'
                        : 'text-slate-600 hover:bg-surface-100 hover:text-slate-800'
                    )
                  }
                >
                  {label}
                </NavLink>
              ))}
            </div>
          )}

          {/* ── Right side ────────────────────────────────────── */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                {/* User dropdown */}
                <div className="relative hidden md:block">
                  <button
                    onClick={() => setDropOpen((v) => !v)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg
                               text-sm font-medium text-slate-700
                               hover:bg-surface-100 transition-colors"
                  >
                    {/* Avatar circle */}
                    <span className="w-7 h-7 rounded-full bg-primary-500
                                     text-white text-xs font-bold
                                     flex items-center justify-center shrink-0">
                      {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </span>
                    <span>{user?.firstName}</span>
                    <svg className={clsx('w-4 h-4 text-slate-400 transition-transform',
                                        dropOpen && 'rotate-180')}
                         fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round"
                            strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {dropOpen && (
                    <>
                      {/* Backdrop */}
                      <div className="fixed inset-0 z-10"
                           onClick={() => setDropOpen(false)} />
                      {/* Menu */}
                      <div className="absolute right-0 mt-1 w-48 bg-white rounded-xl
                                      shadow-card-hover border border-slate-100
                                      py-1 z-20">
                        <div className="px-4 py-2 border-b border-slate-100">
                          <p className="text-xs font-medium text-slate-800">
                            {user?.firstName} {user?.lastName}
                          </p>
                          <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                          {user?.role === 'admin' && (
                            <span className="badge-primary mt-1">Admin</span>
                          )}
                        </div>
                        <Link
                          to="/profile"
                          onClick={() => setDropOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm
                                     text-slate-700 hover:bg-surface-100"
                        >
                          Profile
                        </Link>
                        <button
                          onClick={() => { setDropOpen(false); handleLogout(); }}
                          className="w-full flex items-center gap-2 px-4 py-2
                                     text-sm text-red-500 hover:bg-red-50 text-left"
                        >
                          Sign out
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {/* Mobile hamburger */}
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="md:hidden p-2 rounded-lg text-slate-600
                             hover:bg-surface-100 transition-colors"
                  aria-label="Toggle menu"
                >
                  {menuOpen ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round"
                            strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round"
                            strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  )}
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login"    className="btn-secondary text-sm">Sign in</Link>
                <Link to="/register" className="btn-primary  text-sm">Get started</Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Mobile menu ───────────────────────────────────────── */}
      {isAuthenticated && menuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white px-4 pb-4 pt-2">
          <div className="flex flex-col gap-1">
            {allLinks.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  clsx(
                    'px-3 py-2.5 rounded-lg text-sm font-medium',
                    isActive
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-slate-600 hover:bg-surface-100'
                  )
                }
              >
                {label}
              </NavLink>
            ))}

            <div className="divider" />

            <Link
              to="/profile"
              onClick={() => setMenuOpen(false)}
              className="px-3 py-2.5 rounded-lg text-sm font-medium
                         text-slate-600 hover:bg-surface-100"
            >
              Profile
            </Link>
            <button
              onClick={() => { setMenuOpen(false); handleLogout(); }}
              className="px-3 py-2.5 rounded-lg text-sm font-medium
                         text-red-500 hover:bg-red-50 text-left"
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
