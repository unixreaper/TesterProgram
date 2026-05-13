/* eslint-disable react/prop-types */
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import { AlertTriangle } from "lucide-react";

export function ConfirmModal({ open, onOpenChange, title, description, onConfirm, confirmText, variant = "destructive", t }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[400px] bg-[#1a1a1a] border-[#333]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${variant === "destructive" ? "bg-red-500/10 text-red-500" : "bg-yellow-500/10 text-yellow-500"}`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
            <DialogTitle className="text-white">{title}</DialogTitle>
          </div>
          <DialogDescription className="text-[#9da1a6] text-sm">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4 gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-[#666] hover:text-white">
            {t("buttons.cancel")}
          </Button>
          <Button 
            variant={variant === "destructive" ? "destructive" : "default"} 
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
          >
            {confirmText || t("buttons.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
