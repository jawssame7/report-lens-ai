import { Minus, TrendingDown, TrendingUp } from 'lucide-react';
import type { MetricPoint } from '../types/analysis';
import { formatNumber, formatPercent } from '../utils/formatters';

interface MetricCardGridProps {
  metrics: MetricPoint[];
}

const DirectionIcon = ({
  direction,
}: {
  direction: MetricPoint['direction'];
}) => {
  switch (direction) {
    case 'up':
      return <TrendingUp size={18} className="icon-positive" />;
    case 'down':
      return <TrendingDown size={18} className="icon-negative" />;
    default:
      return <Minus size={18} />;
  }
};

export const MetricCardGrid = ({ metrics }: MetricCardGridProps) => (
  <section className="card">
    <p className="card-eyebrow">主要指標</p>
    <div className="grid metric-grid">
      {metrics.slice(0, 6).map((metric) => (
        <article key={metric.id} className="metric-card">
          <header>
            <p>{metric.label}</p>
            <DirectionIcon direction={metric.direction} />
          </header>
          <h3>{formatNumber(metric.currentValue, metric.unit)}</h3>
          <div className="metric-footer">
            <span>差分 {formatNumber(metric.changeAbsolute, metric.unit)}</span>
            <span>増減率 {formatPercent(metric.changeRate)}</span>
          </div>
        </article>
      ))}
    </div>
  </section>
);
