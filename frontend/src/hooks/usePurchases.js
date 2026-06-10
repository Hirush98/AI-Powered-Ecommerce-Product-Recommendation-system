import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/api/axios';

export const usePurchases = (params = {}) => {
  return useQuery({
    queryKey: ['purchases', params],
    queryFn:  async () => {
      const { data } = await api.get('/purchases', { params });
      return data;
    },
  });
};

export const useSubmitReview = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ purchaseId, rating, review }) =>
      api.patch(`/purchases/${purchaseId}/review`, { rating, review }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
    },
  });
};
