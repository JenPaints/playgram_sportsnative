import * as React from "react"
import { Slot } from "@radix-ui/react-slot"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "default", size = "default", asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    // Use only literal classes for the main button
    let variantClass = "bg-primary text-primary-foreground shadow hover:bg-primary/90";
    if (variant === "destructive") variantClass = "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90";
    if (variant === "outline") variantClass = "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground";
    if (variant === "secondary") variantClass = "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80";
    if (variant === "ghost") variantClass = "hover:bg-accent hover:text-accent-foreground";
    if (variant === "link") variantClass = "text-primary underline-offset-4 hover:underline";

    let sizeClass = "h-9 px-4 py-2";
    if (size === "sm") sizeClass = "h-8 rounded-md px-3 text-xs";
    if (size === "lg") sizeClass = "h-10 rounded-md px-8";
    if (size === "icon") sizeClass = "h-9 w-9";

    return (
      <Comp
        className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 ${variantClass} ${sizeClass} ${className}`}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
