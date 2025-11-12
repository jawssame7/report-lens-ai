import type { PeriodSummary } from '../types/analysis';
import { TrendingUp, TrendingDown, Calendar, FileText } from 'lucide-react';
import { formatNumber } from '../utils/formatters';

interface PeriodComparisonProps {
  periodSummaries: PeriodSummary[];
}

export const PeriodComparison = ({ periodSummaries }: PeriodComparisonProps) => {
  if (!periodSummaries || periodSummaries.length === 0) {
    return null;
  }

  return (
    <div className="period-comparison">
      <header className="period-header">
        <h2>📊 期間別分析</h2>
        <p className="period-subtitle">{periodSummaries.length}期間のデータを比較</p>
      </header>

      <div className="period-grid">
        {periodSummaries.map((period) => (
          <div key={period.periodInfo.displayName} className="period-card">
            <div className="period-card-header">
              <div className="period-title">
                <Calendar size={20} />
                <h3>{period.periodInfo.displayName}</h3>
              </div>
              {period.periodInfo.startDate && period.periodInfo.endDate && (
                <p className="period-dates">
                  {period.periodInfo.startDate} ～ {period.periodInfo.endDate}
                </p>
              )}
            </div>

            <div className="period-files">
              <FileText size={16} />
              <span>
                {period.files.length}件のレポート
              </span>
            </div>

            <div className="period-metrics">
              <h4>主要財務項目</h4>
              <div className="metrics-list">
                {(() => {
                  // 主要財務項目の優先順序
                  const priorityLabels = ['売上高', '販管費', '経常利益', '純利益'];

                  // 優先項目を抽出
                  const priorityMetrics = priorityLabels
                    .map(label => period.metrics.find(m => m.label === label))
                    .filter((m): m is typeof period.metrics[number] => m !== undefined);

                  // 優先項目以外も追加（最大8項目）
                  const otherMetrics = period.metrics
                    .filter(m => !priorityLabels.includes(m.label))
                    .slice(0, 8 - priorityMetrics.length);

                  const displayMetrics = [...priorityMetrics, ...otherMetrics];

                  return displayMetrics.map((metric) => (
                    <div key={metric.id} className="metric-row">
                      <span className="metric-label">{metric.label}</span>
                      <div className="metric-value-container">
                        <span className="metric-value">
                          {formatNumber(metric.currentValue, metric.unit)}
                        </span>
                        {metric.direction !== 'flat' && (
                          metric.direction === 'up' ? (
                            <TrendingUp size={16} className="trend-up" />
                          ) : (
                            <TrendingDown size={16} className="trend-down" />
                          )
                        )}
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>

            {period.insights.length > 0 && (
              <div className="period-insights">
                <h4>この期のインサイト</h4>
                <ul>
                  {period.insights.slice(0, 3).map((insight) => (
                    <li key={insight.id} className={`insight-${insight.severity}`}>
                      {insight.title}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>

      {periodSummaries.length >= 2 && (
        <div className="comparison-summary">
          <h3>期間比較サマリー</h3>
          <p>
            {periodSummaries[0].periodInfo.displayName} と{' '}
            {periodSummaries[periodSummaries.length - 1].periodInfo.displayName} を比較しています。
            詳細なトレンド分析は下記のAIインサイトをご確認ください。
          </p>
        </div>
      )}
    </div>
  );
};
