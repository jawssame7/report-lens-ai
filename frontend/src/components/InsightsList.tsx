import { AlertTriangle, Flame, Info, TrendingUp } from 'lucide-react';
import type { ReactElement } from 'react';
import type { Insight } from '../types/analysis';

interface InsightsListProps {
  insights: Insight[];
}

const iconMap: Record<Insight['severity'], ReactElement> = {
  critical: <Flame size={18} className="icon-critical" />,
  warning: <AlertTriangle size={18} className="icon-warning" />,
  info: <Info size={18} />,
};

export const InsightsList = ({ insights }: InsightsListProps) => {
  // カテゴリ別に分類
  const periodTopics = insights.filter((i) => i.category === 'period-topic');
  const overallSummary = insights.filter((i) => i.category === 'overall-summary');
  const otherInsights = insights.filter((i) => !i.category);

  // 期でグループ化
  const topicsByPeriod = periodTopics.reduce(
    (acc, insight) => {
      const period = insight.periodName || 'その他';
      if (!acc[period]) {
        acc[period] = [];
      }
      acc[period].push(insight);
      return acc;
    },
    {} as Record<string, Insight[]>
  );

  return (
    <section className="card insights-container">
      <div className="insights-header">
        <h2>💡 AI インサイト</h2>
        <p className="insights-subtitle">
          Gemini AIによる財務分析結果
        </p>
      </div>

      {/* 全体サマリー */}
      {overallSummary.length > 0 && (
        <div className="insight-section">
          <h3 className="section-title">
            <TrendingUp size={20} />
            全体サマリー
          </h3>
          <ul className="insight-list">
            {overallSummary.map((insight) => (
              <li key={insight.id} className={`insight-item severity-${insight.severity}`}>
                {iconMap[insight.severity]}
                <div className="insight-content">
                  <h4>{insight.title}</h4>
                  <p>{insight.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 期別トピック */}
      {Object.keys(topicsByPeriod).length > 0 && (
        <div className="insight-section">
          <h3 className="section-title">
            📅 期別トピック
          </h3>
          {Object.entries(topicsByPeriod).map(([period, topics]) => (
            <div key={period} className="period-topics">
              <h4 className="period-label">{period}</h4>
              <ul className="insight-list">
                {topics.map((insight) => (
                  <li
                    key={insight.id}
                    className={`insight-item severity-${insight.severity}`}
                  >
                    {iconMap[insight.severity]}
                    <div className="insight-content">
                      <h4>{insight.title.replace(/^第\d+期:\s*/, '')}</h4>
                      <p>{insight.description}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* その他のインサイト */}
      {otherInsights.length > 0 && (
        <div className="insight-section">
          <h3 className="section-title">その他の分析結果</h3>
          <ul className="insight-list">
            {otherInsights.slice(0, 5).map((insight) => (
              <li
                key={insight.id}
                className={`insight-item severity-${insight.severity}`}
              >
                {iconMap[insight.severity]}
                <div className="insight-content">
                  <h4>{insight.title}</h4>
                  <p>{insight.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
};
