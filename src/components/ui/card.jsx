import { cn } from "../../lib/utils";

function Card({ className, ...props }) {
  return <div className={cn("rounded-md border border-[#343434] bg-[#252526]", className)} {...props} />;
}

function CardHeader({ className, ...props }) {
  return <div className={cn("p-3 pb-2", className)} {...props} />;
}

function CardTitle({ className, ...props }) {
  return <h3 className={cn("text-sm font-semibold text-[#d4d4d4]", className)} {...props} />;
}

function CardDescription({ className, ...props }) {
  return <p className={cn("text-xs text-[#9da1a6]", className)} {...props} />;
}

function CardContent({ className, ...props }) {
  return <div className={cn("p-3 pt-0", className)} {...props} />;
}

export { Card, CardHeader, CardTitle, CardDescription, CardContent };
