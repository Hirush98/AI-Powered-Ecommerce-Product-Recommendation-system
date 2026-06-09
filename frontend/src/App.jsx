import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import useAuthStore from '@/store/authStore';
import ProtectedRoute from '@/components/ui/ProtectedRoute';
import Layout from '@/components/layout/Layout';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

// Pages
import LoginPage            from '@/pages/LoginPage';
import RegisterPage         from '@/pages/RegisterPage';
import HomePage             from '@/pages/HomePage';
import ProductsPage         from '@/pages/ProductsPage';
import ProductDetailPage    from '@/pages/ProductDetailPage';
import RecommendationsPage  from '@/pages/RecommendationsPage';
import PurchasesPage        from '@/pages/PurchasesPage';
import ProfilePage          from '@/pages/ProfilePage';
import AnalyticsPage        from '@/pages/AnalyticsPage';
import NotFoundPage         from '@/pages/NotFoundPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  const { initAuth, isLoading } = useAuthStore();

  useEffect(() => {
    initAuth();
  }, []);

  useEffect(() => {
    const handleForceLogout = () => useAuthStore.getState().logout();
    window.addEventListener('auth:logout', handleForceLogout);
    return () => window.removeEventListener('auth:logout', handleForceLogout);
  }, []);

  if (isLoading) return <LoadingSpinner fullPage />;

  return (
    <QueryClientProvider client={queryClient}>
      <Routes>
        {/* Public — no layout */}
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected — with navbar/footer layout */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/"                  element={<HomePage />} />
            <Route path="/products"          element={<ProductsPage />} />
            <Route path="/products/:id"      element={<ProductDetailPage />} />
            <Route path="/recommendations"   element={<RecommendationsPage />} />
            <Route path="/purchases"         element={<PurchasesPage />} />
            <Route path="/profile"           element={<ProfilePage />} />
          </Route>
        </Route>

        {/* Admin only — with layout */}
        <Route element={<ProtectedRoute requiredRole="admin" />}>
          <Route element={<Layout />}>
            <Route path="/analytics" element={<AnalyticsPage />} />
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="/404" element={<NotFoundPage />} />
        <Route path="*"    element={<Navigate to="/404" replace />} />
      </Routes>

      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}
