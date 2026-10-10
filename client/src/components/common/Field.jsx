export default function Field({ label, error, as: Element = 'input', children, className = '', ...props }) {
  return (
    <label className={`form-field ${className}`}>
      <span>{label}</span>
      <Element className={error ? 'field-control field-error' : 'field-control'} {...props}>{children}</Element>
      {error ? <small className="field-error-text">{error}</small> : null}
    </label>
  );
}
