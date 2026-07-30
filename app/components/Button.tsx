import React from "react";

type ButtonVariant = "primary" | "ghost" | "ghost-dark";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: "default" | "sm";
  as?: "button" | "a";
  href?: string;
}

export default function Button({
  variant = "primary",
  size = "default",
  as: Tag = "button",
  href,
  children,
  className = "",
  ...rest
}: ButtonProps) {
  const classes = [
    "btn",
    variant === "primary"    ? "btn-primary"    : "",
    variant === "ghost"      ? "btn-ghost"      : "",
    variant === "ghost-dark" ? "btn-ghost-dark" : "",
    size === "sm"            ? "btn-sm"         : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (Tag === "a" || href) {
    return (
      <a href={href} className={classes}>
        {children}
      </a>
    );
  }

  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  );
}
