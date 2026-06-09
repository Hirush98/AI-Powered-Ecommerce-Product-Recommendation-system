import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import useAuthStore from '@/store/authStore';
import ProtectedRoute from '@/components/ui/ProtectedRoute';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

// Pages — imported here, built in Chunk 8
import LoginPage        from '@/pages/LoginPage';
import RegisterPage     from '@/pages/RegisterPage';
import HomePage         from '@/pages/HomePage';
import ProductsPage     from '@/pages/ProductsPage';
import ProductDetailPage from '@/pages/ProductDetailPage';
import RecommendationsPage from '@/pages/RecommendationsPage';
import PurchasesPage    from '@/pages/PurchasesPage';
import ProfilePage      from '@/pages/ProfilePage';
import AnalyticsPage    from '@/pages/AnalyticsPage';
import NotFoundPage     from '@/pages/NotFoundPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5,     // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  const { initAuth, isLoading } = useAuthStore();

  // Restore session on app boot
  useEffect(() => {
    initAuth();
  }, []);

  // Listen for forced logout events (from axios interceptor)
  useEffect(() => {
    const handleForceLogout = () => {
      useAuthStore.getState().logout();
    };
    window.addEventListener('auth:logout', handleForceLogout);
    return () => window.removeEventListener('auth:logout', handleForceLogout);
  }, []);

  if (isLoading) {
    return <LoadingSpinner fullPage />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Routes>
        {/* Public routes */}
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected — any authenticated user */}
        <Route element={<ProtectedRoute />}>
          <Route path="/"                element={<HomePage />} />
          <Route path="/products"        element={<ProductsPage />} />
          <Route path="/products/:id"    element={<ProductDetailPage />} />
          <Route path="/recommendations" element={<RecommendationsPage />} />
          <Route path="/purchases"       element={<PurchasesPage />} />
          <Route path="/profile"         element={<ProfilePage />} />
        </Route>

        {/* Protected — admin only */}
        <Route element={<ProtectedRoute requiredRole="admin" />}>
          <Route path="/analytics" element={<AnalyticsPage />} />
        </Route>

        {/* Fallback */}
        <Route path="/404"  element={<NotFoundPage />} />
        <Route path="*"     element={<Navigate to="/404" replace />} />
      </Routes>

      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}
