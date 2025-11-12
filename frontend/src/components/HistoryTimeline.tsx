import type { HistoryEntry } from '../types/analysis';
import { formatDateTime } from '../utils/formatters';

interface HistoryTimelineProps {
  entries: HistoryEntry[] | undefined;
  isLoading: boolean;
}

export const HistoryTimeline = ({
  entries,
  isLoading,
}: HistoryTimelineProps) => {
  const validEntries = Array.isArray(entries) ? entries : [];

  return (
    <section className="card">
      <p className="card-eyebrow">分析履歴 (最新 20 件)</p>
      {isLoading && <p>読み込み中…</p>}
      {!isLoading && validEntries.length === 0 && (
        <p>まだ履歴がありません。</p>
      )}
      <ul className="history-list">
        {validEntries.map((entry) => (
          <li key={entry.requestId}>
            <div>
              <h3>{formatDateTime(entry.savedAt)}</h3>
              <p>{entry.files.map((file) => file.fileName).join(', ')}</p>
            </div>
            <span>
              {entry.aggregatedMetrics.length} 指標 / {entry.insights.length}{' '}
              インサイト
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
};
