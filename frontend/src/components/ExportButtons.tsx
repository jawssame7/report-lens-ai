import type { AnalysisSummary } from '../types/analysis';
import { downloadMetricsCsv, downloadSummaryPdf } from '../utils/exporters';

interface ExportButtonsProps {
  summary: AnalysisSummary;
}

export const ExportButtons = ({ summary }: ExportButtonsProps) => (
  <div className="export-bar">
    <button
      type="button"
      className="secondary"
      onClick={() => downloadMetricsCsv(summary.aggregatedMetrics)}
    >
      CSV ダウンロード
    </button>
    <button
      type="button"
      className="secondary"
      onClick={() => downloadSummaryPdf(summary)}
    >
      PDF サマリー出力
    </button>
  </div>
);
