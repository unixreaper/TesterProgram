import { cva } from "class-variance-authority";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#1177bb] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-[#0e639c] text-white hover:bg-[#1177bb]",
        secondary: "bg-[#2a2d2e] text-[#d4d4d4] border border-[#3a3a3a] hover:bg-[#34363a]",
        ghost: "bg-transparent text-[#9da1a6] hover:bg-[#2a2d2e] hover:text-[#d4d4d4]",
        outline: "border border-[#3a3a3a] bg-transparent text-[#d4d4d4] hover:bg-[#2a2d2e]"
      },
      size: {
        default: "h-8 px-3",
        sm: "h-7 rounded-md px-2",
        icon: "h-8 w-8"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

function Button({ className, variant, size, asChild = false, ...props }) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

export { Button, buttonVariants };
