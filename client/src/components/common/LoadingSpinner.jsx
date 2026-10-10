export default function LoadingSpinner({ fullPage = false }) {
  return <div className={`loading-wrap ${fullPage ? 'loading-full' : ''}`} role="status" aria-label="Loading">
    <span className="spinner" />
  </div>;
}
