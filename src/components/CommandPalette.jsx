/* eslint-disable react/prop-types */
import { Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";

export function CommandPalette({
  open,
  onOpenChange,
  query,
  setQuery,
  filteredCommands,
  t
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{t("commandPalette")}</DialogTitle></DialogHeader>
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2 top-2.5 text-[#6f7680]" />
          <Input 
            className="pl-7" 
            placeholder={t("searchPlaceholder")} 
            value={query} 
            onChange={(e) => setQuery(e.target.value)} 
            autoFocus 
          />
        </div>
        <div className="max-h-72 overflow-auto mt-2 space-y-1">
          {filteredCommands.map((cmd) => (
            <button
              key={cmd.id}
              type="button"
              className="w-full text-left px-2 py-2 rounded-md border border-[#343434] bg-[#1f1f1f] hover:bg-[#272727] flex items-center gap-2 group"
              onClick={() => {
                cmd.action();
                onOpenChange(false);
              }}
            >
              <cmd.icon className="w-3.5 h-3.5 text-[#6f7680] group-hover:text-[#4dabf7]" />
              <span className="text-[11px] font-medium">{cmd.title}</span>
            </button>
          ))}
          {filteredCommands.length === 0 && <div className="text-xs text-[#9da1a6] px-2 py-3">No command</div>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
