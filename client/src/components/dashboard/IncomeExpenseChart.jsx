import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatCurrency } from '../../utils/format.js';

export default function IncomeExpenseChart({ data, currency }) {
  return (
    <div className="chart-box">
      {data.length ? <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }} barGap={5}>
          <CartesianGrid vertical={false} stroke="#E2E8F0" strokeDasharray="4 4" />
          <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} />
          <YAxis tickLine={false} axisLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} tickFormatter={(value) => value >= 1000 ? `${Math.round(value / 1000)}k` : value} />
          <Tooltip formatter={(value) => formatCurrency(value, currency)} contentStyle={{ borderRadius: 12, borderColor: '#E2E8F0', boxShadow: '0 8px 24px rgba(15,23,42,.08)' }} />
          <Bar dataKey="income" name="Income" fill="#10B981" radius={[5, 5, 0, 0]} />
          <Bar dataKey="expenses" name="Expenses" fill="#F87171" radius={[5, 5, 0, 0]} />
        </BarChart>
      </ResponsiveContainer> : null}
    </div>
  );
}
