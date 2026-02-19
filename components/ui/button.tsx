"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "ghost" | "link" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:pointer-events-none disabled:opacity-50",
          {
            "bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800": variant === "default",
            "bg-red-600 text-white hover:bg-red-700 active:bg-red-800": variant === "destructive",
            "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 active:bg-gray-100": variant === "outline",
            "text-gray-700 hover:bg-gray-100 active:bg-gray-200": variant === "ghost",
            "text-indigo-600 underline-offset-4 hover:underline": variant === "link",
            "bg-gray-100 text-gray-900 hover:bg-gray-200 active:bg-gray-300": variant === "secondary",
          },
          {
            "h-10 px-4 py-2": size === "default",
            "h-8 rounded-md px-3 text-xs": size === "sm",
            "h-12 rounded-lg px-6 text-base": size === "lg",
            "h-10 w-10 p-0": size === "icon",
          },
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
