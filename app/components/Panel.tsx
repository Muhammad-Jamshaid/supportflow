interface PanelProps {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export default function Panel({ title, action, children, className = "" }: PanelProps) {
  return (
    <div className={`panel ${className}`}>
      {title && (
        <div className="panel-head">
          <h3>{title}</h3>
          {action && <span>{action}</span>}
        </div>
      )}
      {children}
    </div>
  );
}
