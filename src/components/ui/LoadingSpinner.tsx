import React from "react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LoadingSpinner({ size = "md", className = "" }: LoadingSpinnerProps) {
  const sizePx = size === "sm" ? 32 : size === "lg" ? 80 : 48;
  
  return (
    <div className={`flex items-center justify-center w-full h-full ${className}`}>
      <div 
        className="animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"
        style={{ width: sizePx, height: sizePx }}
      />
    </div>
  );
}
