import Link from "next/link";

interface LogoProps {
  size?: "default" | "sm";
  href?: string;
}

export default function Logo({ size = "default", href = "/" }: LogoProps) {
  const content = (
    <span className="logo" style={size === "sm" ? { fontSize: "16px" } : {}}>
      <span className="mark" />
      SupportFlow
    </span>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}
