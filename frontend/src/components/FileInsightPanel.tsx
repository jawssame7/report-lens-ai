import type { FileAnalysisResult } from '../types/analysis';
import { formatBytes, formatDateTime, formatNumber } from '../utils/formatters';

interface FileInsightPanelProps {
  files: FileAnalysisResult[];
}

export const FileInsightPanel = ({ files }: FileInsightPanelProps) => (
  <section className="card">
    <p className="card-eyebrow">ファイル別詳細</p>
    <div className="file-panel">
      {files.map((file) => (
        <article key={file.fileId} className="file-card">
          <header>
            <div>
              <h3>{file.fileName}</h3>
              <span>
                {file.mimeType} / {formatBytes(file.size)}
              </span>
            </div>
            <span>{formatDateTime(file.uploadedAt)}</span>
          </header>
          <div className="file-metrics">
            {file.metrics.slice(0, 4).map((metric) => (
              <div key={metric.id}>
                <p>{metric.label}</p>
                <h4>{formatNumber(metric.currentValue, metric.unit)}</h4>
              </div>
            ))}
          </div>
          {file.rawTextPreview && <pre>{file.rawTextPreview}</pre>}
        </article>
      ))}
    </div>
  </section>
);
