import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { analyzeReports, fetchHistory } from '../api/client';
import type { AnalysisSummary, HistoryEntry } from '../types/analysis';

export const historyQueryKey = ['analysis-history'];

export const useHistory = () =>
  useQuery<HistoryEntry[]>({
    queryKey: historyQueryKey,
    queryFn: fetchHistory,
    staleTime: 1000 * 30,
  });

export const useAnalyzeReports = () => {
  const queryClient = useQueryClient();
  return useMutation<AnalysisSummary, Error, File[]>({
    mutationFn: analyzeReports,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: historyQueryKey });
    },
  });
};
