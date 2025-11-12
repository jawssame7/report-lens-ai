import { v4 as uuidv4 } from 'uuid';
import { parseFile } from './fileParser';
import { requestGeminiAnalysis } from './geminiClient';
import { requestPeriodComparisonInsights } from './periodComparisonClient';
import { historyStore } from '../store/historyStore';
import {
  AnalysisSummary,
  FileAnalysisResult,
  Insight,
  MetricPoint,
  PeriodSummary,
} from '../types/analysis';
import { calculateChange } from '../utils/numberUtils';
import { extractPeriodInfo, getPeriodSortKey } from '../utils/periodExtractor';

interface AnalyzeOptions {
  files: Express.Multer.File[];
}

const MAX_PREVIEW_LENGTH = 800;

const buildFileResult = async (file: Express.Multer.File): Promise<FileAnalysisResult> => {
  const fileId = uuidv4();
  const baseResult: FileAnalysisResult = {
    fileId,
    fileName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
    uploadedAt: new Date().toISOString(),
    metrics: [],
    insights: [],
    rawTextPreview: '',
    status: 'pending'
  };

  try {
    const parsed = await parseFile(file);

    // Gemini APIで主要財務項目とインサイトを取得
    const geminiResult = await requestGeminiAnalysis(parsed.textContent);
    const periodInfo = extractPeriodInfo(file.originalname, parsed.textContent);

    // Geminiから取得したメトリクスと、ファイルパーサーで検出したメトリクスをマージ
    const detectedMetrics: MetricPoint[] = parsed.detectedMetrics.map((metric, index) => {
      const point: MetricPoint = {
        id: `${fileId}-detected-${index}`,
        label: metric.label,
        currentValue: metric.value,
        direction: 'flat'
      };

      if (metric.unit) {
        point.unit = metric.unit;
      }

      return point;
    });

    // Geminiのメトリクスに一意のIDを付与
    const geminiMetrics = geminiResult.metrics.map((metric, index) => ({
      ...metric,
      id: `${fileId}-gemini-${index}`
    }));

    // 主要財務項目（Gemini）を優先し、その他の検出メトリクスを追加
    const allMetrics = [...geminiMetrics, ...detectedMetrics];

    return {
      ...baseResult,
      metrics: allMetrics,
      insights: geminiResult.insights,
      rawTextPreview: parsed.textContent.slice(0, MAX_PREVIEW_LENGTH),
      status: 'completed',
      periodInfo
    };
  } catch (error) {
    console.error('Analysis error', error);
    return {
      ...baseResult,
      status: 'failed',
      errorMessage: '解析に失敗しました。再度お試しください。'
    };
  }
};

interface MetricWithOrder {
  metric: MetricPoint;
  fileIndex: number;
}

const aggregateMetrics = (files: FileAnalysisResult[]): MetricPoint[] => {
  const map = new Map<string, MetricWithOrder[]>();

  files.forEach((file, fileIndex) => {
    file.metrics.forEach((metric) => {
      if (!map.has(metric.label)) {
        map.set(metric.label, []);
      }
      map.get(metric.label)!.push({ metric, fileIndex });
    });
  });

  const aggregated: MetricPoint[] = [];

  map.forEach((metricList, label) => {
    const sorted = metricList.sort((a, b) => a.fileIndex - b.fileIndex);
    const latest = sorted[0]?.metric;
    const previous = sorted[1]?.metric;

    if (!latest) return;

    const { changeAbsolute, changeRate, direction } = calculateChange(
      latest.currentValue,
      previous?.currentValue
    );

    const aggregatedMetric: MetricPoint = {
      id: `agg-${label}`,
      label,
      currentValue: latest.currentValue,
      previousValue: previous?.currentValue,
      changeAbsolute,
      changeRate,
      direction
    };

    if (latest.unit) {
      aggregatedMetric.unit = latest.unit;
    }

    aggregated.push(aggregatedMetric);
  });

  return aggregated.slice(0, 8);
};

const buildSeries = (files: FileAnalysisResult[]) => {
  const series: AnalysisSummary['comparisonSeries'] = {};

  files.forEach((file) => {
    file.metrics.forEach((metric) => {
      if (!series[metric.label]) {
        series[metric.label] = [];
      }
      const points = series[metric.label]!;
      points.push({
        axisLabel: file.fileName,
        value: metric.currentValue
      });
    });
  });

  return series;
};

const mergeInsights = (files: FileAnalysisResult[]): Insight[] => {
  const allInsights = files.flatMap((file) => file.insights);
  const uniqueMap = new Map(allInsights.map((insight) => [insight.id, insight]));
  return Array.from(uniqueMap.values()).slice(0, 10);
};

/**
 * 期間別にファイルをグループ化してサマリーを作成
 */
const buildPeriodSummaries = (files: FileAnalysisResult[]): PeriodSummary[] => {
  // 期間ごとにファイルをグループ化
  const periodMap = new Map<string, FileAnalysisResult[]>();

  files.forEach((file) => {
    if (file.periodInfo) {
      const key = file.periodInfo.displayName;
      if (!periodMap.has(key)) {
        periodMap.set(key, []);
      }
      periodMap.get(key)!.push(file);
    }
  });

  // 期間サマリーを作成
  const summaries: PeriodSummary[] = [];

  periodMap.forEach((periodFiles, _key) => {
    if (periodFiles.length === 0) return;

    const firstFile = periodFiles[0];
    if (!firstFile?.periodInfo) return;

    const periodInfo = firstFile.periodInfo;

    // 期間内のメトリクスを集約
    const metricsMap = new Map<string, MetricPoint>();
    periodFiles.forEach((file) => {
      file.metrics.forEach((metric) => {
        if (!metricsMap.has(metric.label)) {
          metricsMap.set(metric.label, metric);
        }
      });
    });

    // 期間内のインサイトをマージ
    const insights = periodFiles.flatMap((file) => file.insights);

    summaries.push({
      periodInfo,
      files: periodFiles,
      metrics: Array.from(metricsMap.values()),
      insights,
    });
  });

  // 期でソート（新しい順）
  summaries.sort((a, b) => {
    const aKey = getPeriodSortKey(a.periodInfo);
    const bKey = getPeriodSortKey(b.periodInfo);
    return bKey - aKey;
  });

  return summaries;
};

export const analyzeFiles = async ({ files }: AnalyzeOptions): Promise<AnalysisSummary> => {
  const requestId = uuidv4();
  const fileResults = await Promise.all(files.map((file) => buildFileResult(file)));

  const periodSummaries = buildPeriodSummaries(fileResults);

  // 期間比較インサイトを生成（2期以上ある場合）
  let comparisonInsights: Insight[] = [];
  if (periodSummaries.length >= 2) {
    const periodData = periodSummaries.map((ps) => ({
      periodName: ps.periodInfo.displayName,
      text: ps.files.map((f) => f.rawTextPreview || '').join('\n\n'),
    }));

    comparisonInsights = await requestPeriodComparisonInsights(periodData);
  }

  // 個別ファイルのインサイトと期間比較インサイトをマージ
  const allInsights = [...comparisonInsights, ...mergeInsights(fileResults)];

  const summary: AnalysisSummary = {
    requestId,
    generatedAt: new Date().toISOString(),
    files: fileResults,
    aggregatedMetrics: aggregateMetrics(fileResults),
    insights: allInsights,
    comparisonSeries: buildSeries(fileResults),
    periodSummaries
  };

  historyStore.save({ ...summary, savedAt: new Date().toISOString() });

  return summary;
};
