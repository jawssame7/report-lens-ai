import { jsPDF } from 'jspdf';
import type { AnalysisSummary, MetricPoint } from '../types/analysis';
import { formatDateTime, formatNumber, formatPercent } from './formatters';

const buildCsvRow = (values: string[]) =>
  values.map((value) => `"${value.replace(/"/g, '""')}"`).join(',');

export const downloadMetricsCsv = (metrics: MetricPoint[]) => {
  const header = buildCsvRow(['指標', '最新値', '前回値', '差分', '増減率']);
  const rows = metrics.map((metric) =>
    buildCsvRow([
      metric.label,
      formatNumber(metric.currentValue, metric.unit),
      formatNumber(metric.previousValue, metric.unit),
      formatNumber(metric.changeAbsolute, metric.unit),
      formatPercent(metric.changeRate),
    ]),
  );
  const csv = [header, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'reportlens-metrics.csv';
  link.click();
  URL.revokeObjectURL(url);
};

export const downloadSummaryPdf = (summary: AnalysisSummary) => {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  doc.setFontSize(16);
  doc.text('ReportLensAI 分析サマリー', 40, 40);
  doc.setFontSize(10);
  doc.text(`生成日時: ${formatDateTime(summary.generatedAt)}`, 40, 60);

  let y = 90;
  doc.setFontSize(12);
  doc.text('主要指標', 40, y);
  y += 20;

  summary.aggregatedMetrics.slice(0, 6).forEach((metric) => {
    doc.text(
      `${metric.label}: ${formatNumber(metric.currentValue, metric.unit)} (差分 ${formatNumber(
        metric.changeAbsolute,
        metric.unit,
      )}, 増減率 ${formatPercent(metric.changeRate)})`,
      40,
      y,
    );
    y += 18;
  });

  y += 10;
  doc.setFontSize(12);
  doc.text('AI インサイト', 40, y);
  doc.setFontSize(10);
  y += 20;

  summary.insights.forEach((insight) => {
    doc.text(
      `・[${insight.severity}] ${insight.title}: ${insight.description}`,
      40,
      y,
      {
        maxWidth: 520,
      },
    );
    y += 30;
  });

  doc.save('reportlens-summary.pdf');
};
