import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/api/axios';

export const useRecommendations = ({ enabled = true } = {}) => {
  return useQuery({
    queryKey: ['recommendations'],
    queryFn:  async () => {
      const { data } = await api.get('/recommendations');
      return data;
    },
    enabled,
    staleTime: 1000 * 60 * 30, // matches backend Redis TTL
  });
};

export const useRefreshRecommendations = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.get('/recommendations?refresh=true'),
    onSuccess: (res) => {
      queryClient.setQueryData(['recommendations'], res.data);
    },
  });
};
