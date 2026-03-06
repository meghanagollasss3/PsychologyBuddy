import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/src/lib/cn";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-regular transition-colors focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:ring-offset-2",
  {
    variants: {
      variant: {
        primary:"border-transparent bg-[#3B82F6]/10 text-[#3B82F6] hover:bg-[#3B82F6]/80",
        default: "border-transparent bg-[#3B82F6] text-[#FFFFFF] hover:bg-[#3B82F6]/80",
        secondary: "border-transparent bg-[#F1F5F9] text-[#1E293B] hover:bg-[#F1F5F9]/80",
        destructive: "border-transparent bg-[#EF4444] text-[#FFFFFF] hover:bg-[#EF4444]/80",
        outline: "text-[#1E293B]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
