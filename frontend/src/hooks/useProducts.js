import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/api/axios';

// ── Fetch product list with filters ──────────────────────────────────────────
export const useProducts = (params = {}) => {
  return useQuery({
    queryKey: ['products', params],
    queryFn:  async () => {
      const { data } = await api.get('/products', { params });
      return data;
    },
    keepPreviousData: true, // smooth pagination — don't blank on page change
  });
};

// ── Fetch single product ──────────────────────────────────────────────────────
export const useProduct = (id) => {
  return useQuery({
    queryKey: ['products', id],
    queryFn:  async () => {
      const { data } = await api.get(`/products/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
};

// ── Fetch categories ──────────────────────────────────────────────────────────
export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn:  async () => {
      const { data } = await api.get('/products/categories');
      return data.data;
    },
    staleTime: 1000 * 60 * 30, // categories rarely change — 30min cache
  });
};

// ── Log interaction (view, like, add_to_cart, search) ────────────────────────
export const useLogInteraction = () => {
  return useMutation({
    mutationFn: (payload) => api.post('/interactions', payload),
  });
};

// ── Purchase a product ────────────────────────────────────────────────────────
export const usePurchase = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.post('/purchases', payload),
    onSuccess: () => {
      // Invalidate purchases list + recommendations (new purchase changes AI output)
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      queryClient.invalidateQueries({ queryKey: ['recommendations'] });
    },
  });
};
