import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold tracking-wider font-heading uppercase transition-colors",
  {
    variants: {
      variant: {
        default:
          "bg-palette-olive text-palette-cream",
        secondary:
          "bg-palette-sage/20 text-palette-brown border border-palette-sage/30",
        outline:
          "border border-border text-palette-brown bg-card",
        marketing:
          "bg-palette-sage/25 text-palette-brown border border-palette-sage/40",
        it:
          "bg-palette-olive/20 text-palette-olive border border-palette-olive/30",
        priorityHigh:
          "bg-[#6E3511]/15 text-[#6E3511] border border-[#6E3511]/30",
        priorityMedium:
          "bg-palette-olive/15 text-palette-olive border border-palette-olive/30",
        priorityLow:
          "bg-palette-cream text-muted-foreground border border-border",
        statusTodo:
          "bg-palette-cream text-palette-brown border border-border",
        statusInProgress:
          "bg-palette-olive/20 text-palette-olive border border-palette-olive/40",
        statusDone:
          "bg-palette-sage/30 text-palette-brown border border-palette-sage/50",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
