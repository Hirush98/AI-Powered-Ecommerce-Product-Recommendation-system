import { Navigate, useLocation, Outlet } from 'react-router-dom';
import useAuthStore from '@/store/authStore';
import LoadingSpinner from './LoadingSpinner';

/**
 * Wraps routes that require authentication.
 * If not logged in → redirect to /login (remembers where they were going).
 * If role specified and doesn't match → redirect to /.
 *
 * Usage in App.jsx:
 *
 *   // Any logged-in user
 *   <Route element={<ProtectedRoute />}>
 *     <Route path="/dashboard" element={<Dashboard />} />
 *   </Route>
 *
 *   // Admin only
 *   <Route element={<ProtectedRoute requiredRole="admin" />}>
 *     <Route path="/analytics" element={<AnalyticsPage />} />
 *   </Route>
 */
export default function ProtectedRoute({ requiredRole }) {
  const { isAuthenticated, isLoading, user } = useAuthStore();
  const location = useLocation();

  // Still checking session on boot — show spinner instead of flashing /login
  if (isLoading) {
    return <LoadingSpinner fullPage />;
  }

  // Not logged in — redirect to login, preserve intended destination
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Logged in but wrong role — redirect to home
  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  // All checks passed — render child routes
  return <Outlet />;
}
