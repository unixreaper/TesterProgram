import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
  {
    variants: {
      variant: {
        default: "border-[#3a3a3a] bg-[#2a2a2a] text-[#d4d4d4]",
        pass: "border-[#2f6f63] bg-[#1e3b36] text-[#4ec9b0]",
        fail: "border-[#8f5148] bg-[#3d2623] text-[#f48771]",
        blocked: "border-[#846c42] bg-[#3a3021] text-[#d7ba7d]",
        retest: "border-[#695586] bg-[#2f2741] text-[#b392f0]",
        high: "border-[#8f5148] bg-[#3d2623] text-[#f48771]",
        medium: "border-[#846c42] bg-[#3a3021] text-[#d7ba7d]",
        low: "border-[#4f6c80] bg-[#233441] text-[#9cdcfe]"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);

function Badge({ className, variant, ...props }) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
