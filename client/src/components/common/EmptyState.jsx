import { Inbox } from 'lucide-react';

export default function EmptyState({ title, message, action }) {
  return (
    <div className="empty-state">
      <span className="empty-icon"><Inbox size={22} /></span>
      <h3>{title}</h3>
      <p>{message}</p>
      {action}
    </div>
  );
}
