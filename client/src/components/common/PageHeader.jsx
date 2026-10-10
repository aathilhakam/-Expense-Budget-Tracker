export default function PageHeader({ title, subtitle, action }) {
  return (
    <div className="page-heading">
      <div><h1>{title}</h1>{subtitle ? <p>{subtitle}</p> : null}</div>
      {action ? <div className="page-heading-action">{action}</div> : null}
    </div>
  );
}
