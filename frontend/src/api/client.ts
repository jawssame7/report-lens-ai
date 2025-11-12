import axios from 'axios';
import type { AnalysisSummary, HistoryEntry } from '../types/analysis';

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/api';

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 60_000,
});

export const analyzeReports = async (
  files: File[],
): Promise<AnalysisSummary> => {
  const formData = new FormData();
  for (const file of files) {
    formData.append('files', file);
  }

  const { data } = await client.post<AnalysisSummary>('/analyze', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return data;
};

export const fetchHistory = async (): Promise<HistoryEntry[]> => {
  const { data } = await client.get<{ entries: HistoryEntry[] }>('/history');
  return data.entries;
};

export const fetchHealth = async () => {
  const { data } = await client.get('/health');
  return data;
};
