export type InsightSeverity = 'info' | 'warning' | 'critical';

export interface Insight {
  id: string;
  title: string;
  description: string;
  severity: InsightSeverity;
  category?: 'period-topic' | 'overall-summary';
  periodName?: string;
}

export interface MetricPoint {
  id: string;
  label: string;
  currentValue: number;
  previousValue?: number;
  changeAbsolute?: number;
  changeRate?: number;
  direction: 'up' | 'down' | 'flat';
  unit?: string;
}

export interface TrendSeriesPoint {
  axisLabel: string;
  value: number;
}

export interface PeriodInfo {
  period: number | null;
  fiscalYear: number | null;
  displayName: string;
  startDate?: string;
  endDate?: string;
}

export interface FileAnalysisResult {
  fileId: string;
  fileName: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
  metrics: MetricPoint[];
  insights: Insight[];
  rawTextPreview?: string;
  status: 'pending' | 'completed' | 'failed';
  errorMessage?: string;
  periodInfo?: PeriodInfo;
}

export interface PeriodSummary {
  periodInfo: PeriodInfo;
  files: FileAnalysisResult[];
  metrics: MetricPoint[];
  insights: Insight[];
}

export interface AnalysisSummary {
  requestId: string;
  generatedAt: string;
  files: FileAnalysisResult[];
  aggregatedMetrics: MetricPoint[];
  insights: Insight[];
  comparisonSeries: Record<string, TrendSeriesPoint[]>;
  periodSummaries?: PeriodSummary[];
}

export interface HistoryEntry extends AnalysisSummary {
  savedAt: string;
}
