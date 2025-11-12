import type { AnalysisSummary } from '../types/analysis';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from 'lucide-react';

interface ExecutiveSummaryProps {
  summary: AnalysisSummary;
}

export const ExecutiveSummary = ({ summary }: ExecutiveSummaryProps) => {
  const criticalInsights = summary.insights.filter((i) => i.severity === 'critical');
  const warningInsights = summary.insights.filter((i) => i.severity === 'warning');
  const positiveInsights = summary.insights.filter((i) => i.severity === 'info');

  const topMetrics = summary.aggregatedMetrics.slice(0, 4);

  return (
    <div className="executive-summary">
      <header className="summary-header">
        <h2>経営サマリー</h2>
        <p className="summary-subtitle">
          {summary.files.length}件のレポートを分析 ・{' '}
          {new Date(summary.generatedAt).toLocaleDateString('ja-JP')}
        </p>
      </header>

      {/* 総合評価 */}
      <section className="overall-status">
        <div className={`status-badge ${criticalInsights.length > 0 ? 'critical' : warningInsights.length > 0 ? 'warning' : 'healthy'}`}>
          {criticalInsights.length > 0 ? (
            <>
              <AlertTriangle size={24} />
              <span>要注意</span>
            </>
          ) : warningInsights.length > 0 ? (
            <>
              <AlertTriangle size={24} />
              <span>注意</span>
            </>
          ) : (
            <>
              <CheckCircle size={24} />
              <span>良好</span>
            </>
          )}
        </div>
        <div className="status-summary">
          <p className="status-text">
            {criticalInsights.length > 0
              ? `${criticalInsights.length}件の重要な課題が検出されました。早急な対応が必要です。`
              : warningInsights.length > 0
                ? `${warningInsights.length}件の注意事項があります。継続的な監視が推奨されます。`
                : '財務状況は概ね良好です。引き続き成長トレンドを維持しましょう。'}
          </p>
        </div>
      </section>

      {/* 主要指標 */}
      <section className="key-metrics-summary">
        <h3>主要指標の動向</h3>
        <div className="metrics-overview">
          {topMetrics.map((metric) => (
            <div key={metric.id} className="metric-summary-card">
              <div className="metric-label">{metric.label}</div>
              <div className="metric-value-row">
                <span className="metric-value">
                  {metric.currentValue.toLocaleString('ja-JP')}
                  {metric.unit}
                </span>
                {metric.direction === 'up' ? (
                  <TrendingUp size={20} className="trend-up" />
                ) : metric.direction === 'down' ? (
                  <TrendingDown size={20} className="trend-down" />
                ) : null}
              </div>
              {metric.changeRate !== undefined && (
                <div className={`change-indicator ${metric.direction}`}>
                  {metric.changeRate > 0 ? '+' : ''}
                  {(metric.changeRate * 100).toFixed(1)}% vs 前期
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 重要アラート */}
      {criticalInsights.length > 0 && (
        <section className="critical-alerts">
          <h3>🔥 早急な対応が必要</h3>
          <ul className="alert-list">
            {criticalInsights.map((insight) => (
              <li key={insight.id} className="alert-item critical">
                <strong>{insight.title}</strong>
                <p>{insight.description}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 注意事項 */}
      {warningInsights.length > 0 && (
        <section className="warnings">
          <h3>⚠️ 注意が必要な項目</h3>
          <ul className="alert-list">
            {warningInsights.map((insight) => (
              <li key={insight.id} className="alert-item warning">
                <strong>{insight.title}</strong>
                <p>{insight.description}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ポジティブな発見 */}
      {positiveInsights.length > 0 && (
        <section className="positive-findings">
          <h3>✨ 良好な傾向</h3>
          <ul className="alert-list">
            {positiveInsights.map((insight) => (
              <li key={insight.id} className="alert-item info">
                <strong>{insight.title}</strong>
                <p>{insight.description}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};
