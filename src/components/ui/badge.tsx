import * as React from "react"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline"
}

const variantClasses: Record<string, string> = {
  default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
  secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
  destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
  outline: "text-foreground",
}

const baseClasses = "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"

function Badge({ className = "", variant = "default", ...props }: BadgeProps) {
  let variantClass = "border-transparent bg-primary text-primary-foreground hover:bg-primary/80";
  if (variant === "secondary") variantClass = "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80";
  if (variant === "destructive") variantClass = "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80";
  if (variant === "outline") variantClass = "text-foreground";

  return (
    <div
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${variantClass} ${className}`}
      {...props}
    />
  )
}

export { Badge } 