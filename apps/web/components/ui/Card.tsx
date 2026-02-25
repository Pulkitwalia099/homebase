import { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: "sm" | "md" | "lg" | "none";
}

export function Card({ children, padding = "md", className = "", ...props }: CardProps) {
  const paddings = {
    none: "",
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };

  return (
    <div
      className={`bg-white rounded-2xl border border-gray-200 shadow-sm ${paddings[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
