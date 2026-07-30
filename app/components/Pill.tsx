type PillVariant = "urgent" | "high" | "normal" | "low" | "resolved" | "brand";

interface PillProps {
  variant: PillVariant;
  children: React.ReactNode;
  dot?: boolean;
}

export default function Pill({ variant, children, dot = true }: PillProps) {
  return (
    <span className={`pill ${variant}`}>
      {dot && <span className="dot-key" />}
      {children}
    </span>
  );
}

// Map DB enum values to pill variants
export function priorityVariant(priority: string): PillVariant {
  switch (priority.toUpperCase()) {
    case "URGENT": return "urgent";
    case "HIGH":   return "high";
    case "NORMAL": return "normal";
    case "LOW":    return "low";
    default:       return "normal";
  }
}

export function statusVariant(status: string): PillVariant {
  switch (status.toUpperCase()) {
    case "RESOLVED": return "resolved";
    case "CLOSED":   return "resolved";
    case "OPEN":     return "normal";
    default:         return "normal";
  }
}
