import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        "flex h-12 w-full rounded-xl border border-charcoal-700 bg-charcoal-900 px-4 text-base text-white placeholder:text-charcoal-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-proof-500",
        className
      )}
      ref={ref}
      {...props}
    />
  )
);
Input.displayName = "Input";

export { Input };
