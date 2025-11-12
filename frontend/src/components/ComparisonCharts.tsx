import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { AnalysisSummary } from '../types/analysis';

interface ComparisonChartsProps {
  summary: AnalysisSummary;
}

const COLORS = ['#2563eb', '#db2777', '#059669'];

export const ComparisonCharts = ({ summary }: ComparisonChartsProps) => {
  const metricKeys = Object.keys(summary.comparisonSeries).slice(0, 3);

  if (!metricKeys.length) {
    return null;
  }

  return (
    <section className="card">
      <p className="card-eyebrow">時系列比較</p>
      <div className="charts-grid">
        {metricKeys.map((key, index) => (
          <div key={key} className="chart-wrapper">
            <h3>{key}</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart
                data={summary.comparisonSeries[key]}
                margin={{ top: 16, right: 16, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="axisLabel"
                  hide={summary.comparisonSeries[key].length > 6}
                />
                <YAxis hide domain={[0, 'dataMax']} />
                <Tooltip
                  formatter={(value: number) => value.toLocaleString()}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={COLORS[index % COLORS.length]}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ))}
      </div>
    </section>
  );
};
