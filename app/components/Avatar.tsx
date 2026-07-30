interface AvatarProps {
  name?: string | null;
  size?: "default" | "lg";
  className?: string;
}

function getInitials(name?: string | null): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function Avatar({ name, size = "default", className = "" }: AvatarProps) {
  return (
    <div
      className={`avatar ${size === "lg" ? "avatar-lg" : ""} ${className}`}
      title={name ?? undefined}
      aria-label={name ?? "User avatar"}
    >
      {getInitials(name)}
    </div>
  );
}
