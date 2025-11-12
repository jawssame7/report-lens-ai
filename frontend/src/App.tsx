import { useState } from 'react';
import './App.css';
import './components/ExecutiveSummary.css';
import './components/PeriodComparison.css';
import { ExportButtons } from './components/ExportButtons';
import { FileInsightPanel } from './components/FileInsightPanel';
import { HistoryTimeline } from './components/HistoryTimeline';
import { InsightsList } from './components/InsightsList';
import { ExecutiveSummary } from './components/ExecutiveSummary';
import { PeriodComparison } from './components/PeriodComparison';
import { UploadPanel } from './components/UploadPanel';
import { useAnalyzeReports, useHistory } from './hooks/useAnalysis';
import type { AnalysisSummary } from './types/analysis';

const MAX_FILES = 10;
const MAX_TOTAL_BYTES = 100 * 1024 * 1024;

function App() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [summary, setSummary] = useState<AnalysisSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { mutateAsync, isPending } = useAnalyzeReports();
  const historyQuery = useHistory();

  const handleAnalyze = async () => {
    if (!selectedFiles.length) return;
    setError(null);
    try {
      const result = await mutateAsync(selectedFiles);
      setSummary(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : '分析に失敗しました';
      setError(message);
    }
  };

  const updateFiles = (files: File[]) => {
    if (files.length > MAX_FILES) {
      setError(`最大 ${MAX_FILES} ファイルまでアップロードできます。`);
      return;
    }
    const size = files.reduce((sum, file) => sum + file.size, 0);
    if (size > MAX_TOTAL_BYTES) {
      setError('合計 100MB を超えています。不要なファイルを削除してください。');
    } else {
      setError(null);
    }
    setSelectedFiles(files);
  };

  return (
    <div className="app-shell">
      <header>
        <div>
          <p className="tag">Gemini パワード</p>
          <h1>ReportLensAI</h1>
          <p>
            PDF や Office レポートから主要指標と AI
            インサイトを数分で抽出します。
          </p>
        </div>
        <div className="header-meta">
          <span>対応ファイル: PDF / Office / 画像</span>
          <span>変換コスト目安: 月額 5,000 円以内</span>
        </div>
      </header>

      <main>
        <UploadPanel
          files={selectedFiles}
          onFilesChange={updateFiles}
          onAnalyze={handleAnalyze}
          isAnalyzing={isPending}
          error={error}
          maxFiles={MAX_FILES}
          maxTotalBytes={MAX_TOTAL_BYTES}
        />

        {summary && (
          <>
            <ExportButtons summary={summary} />
            <ExecutiveSummary summary={summary} />
            {summary.periodSummaries && summary.periodSummaries.length > 0 && (
              <PeriodComparison periodSummaries={summary.periodSummaries} />
            )}
            <InsightsList insights={summary.insights} />
            <FileInsightPanel files={summary.files} />
          </>
        )}

        <HistoryTimeline
          entries={historyQuery.data}
          isLoading={historyQuery.isLoading}
        />
      </main>
    </div>
  );
}

export default App;
