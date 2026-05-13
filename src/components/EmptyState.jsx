/* eslint-disable react/prop-types */
import { Plus } from "lucide-react";
import { Button } from "./ui/button";

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center p-6 text-center border border-dashed border-[#343434] rounded-lg bg-[#1a1a1a]/50 transition-all hover:bg-[#1a1a1a] hover:border-[#454545]">
      <div className="h-10 w-10 rounded-full bg-[#0e639c10] flex items-center justify-center mb-3">
        <Icon className="h-5 w-5 text-[#4dabf7]" />
      </div>
      <h3 className="text-[12px] font-semibold text-[#d4d4d4] mb-1">{title}</h3>
      <p className="text-[10px] text-[#8a9199] max-w-[160px] mb-4 leading-relaxed">{description}</p>
      {actionLabel && (
        <Button size="sm" variant="secondary" className="h-7 text-[10px]" onClick={onAction}>
          <Plus className="w-3 h-3 mr-1" />
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
