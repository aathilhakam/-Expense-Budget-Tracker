import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { formatCurrency } from '../../utils/format.js';

const COLORS = ['#10B981', '#0F766E', '#34D399', '#6EE7B7', '#3B82F6', '#F59E0B', '#64748B', '#A78BFA'];

export default function ExpenseCategoryChart({ data, currency }) {
  return data.length ? (
    <div className="donut-layout">
      <div className="donut-chart"><ResponsiveContainer width="100%" height={210}>
        <PieChart><Pie data={data} dataKey="amount" nameKey="category" innerRadius={59} outerRadius={84} paddingAngle={3} stroke="none">
          {data.map((entry, index) => <Cell key={entry.category} fill={COLORS[index % COLORS.length]} />)}
        </Pie><Tooltip formatter={(value) => formatCurrency(value, currency)} /></PieChart>
      </ResponsiveContainer></div>
      <div className="legend-list">
        {data.slice(0, 6).map((item, index) => <div className="legend-row" key={item.category}>
          <span className="legend-label"><i style={{ background: COLORS[index % COLORS.length] }} />{item.category}</span>
          <strong>{formatCurrency(item.amount, currency)}</strong>
        </div>)}
      </div>
    </div>
  ) : <div className="chart-empty">Your expense categories will appear here.</div>;
}
