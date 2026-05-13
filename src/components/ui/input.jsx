import { cn } from "../../lib/utils";

function Input({ className, ...props }) {
  return (
    <input
      className={cn(
        "flex h-8 w-full rounded-md border border-[#3a3a3a] bg-[#1e1e1e] px-2 py-1 text-xs text-[#d4d4d4] placeholder:text-[#6f7680] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#1177bb]",
        className
      )}
      {...props}
    />
  );
}

export { Input };
