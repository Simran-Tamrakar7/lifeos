import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const badgeVariants = cva(
  "inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-[var(--accent-soft)] text-[var(--accent)]",
        secondary: "bg-[var(--surface-2)] text-[var(--fg-muted)]",
        outline: "border border-[var(--border)] text-[var(--fg-muted)]",
        success: "bg-emerald-500/15 text-emerald-500",
        warning: "bg-amber-500/15 text-amber-500",
        danger: "bg-rose-500/15 text-rose-500",
        urgent: "bg-rose-500/15 text-rose-500",
        high: "bg-orange-500/15 text-orange-500",
        medium: "bg-amber-500/15 text-amber-500",
        low: "bg-sky-500/15 text-sky-500",
        none: "bg-[var(--surface-2)] text-[var(--fg-muted)]",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export function Badge({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof badgeVariants>) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
