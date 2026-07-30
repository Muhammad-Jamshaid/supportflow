interface StatCardProps {
  label: string;
  value: string | number;
  delta?: string;
  deltaVariant?: "normal" | "urgent";
}

export default function StatCard({
  label,
  value,
  delta,
  deltaVariant = "normal",
}: StatCardProps) {
  return (
    <div className="stat">
      <div className="slabel">{label}</div>
      <div className="sval">{value}</div>
      {delta && (
        <div className={`sdelta${deltaVariant === "urgent" ? " urgent" : ""}`}>
          {delta}
        </div>
      )}
    </div>
  );
}
