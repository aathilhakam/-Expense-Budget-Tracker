export default function StatCard({ label, amount, detail, icon: Icon, tone = 'neutral' }) {
  return (
    <article className="stat-card">
      <div className={`stat-icon stat-${tone}`}><Icon size={19} /></div>
      <span className="stat-label">{label}</span>
      <strong className="stat-amount">{amount}</strong>
      <span className="stat-detail">{detail}</span>
    </article>
  );
}
