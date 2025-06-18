import * as React from "react"

const Progress = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { value?: number; max?: number }
>(({ className = "", value, max = 100, ...props }, ref) => (
  <div
    ref={ref}
    className={["relative h-2 w-full overflow-hidden rounded-full bg-muted", className].join(" ")}
    {...props}
  >
    <div
      className="h-full w-full flex-1 bg-primary/20 transition-all"
      style={{ transform: `translateX(-${100 - (value ?? 0)}%)` }}
    />
  </div>
))
Progress.displayName = "Progress"

export { Progress } 