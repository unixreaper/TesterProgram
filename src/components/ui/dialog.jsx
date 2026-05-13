/* eslint-disable react/prop-types */
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";

function Dialog({ modal = false, ...props }) {
  return <DialogPrimitive.Root modal={modal} {...props} />;
}
const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;
const DialogClose = DialogPrimitive.Close;

function DialogOverlay({ className, ...props }) {
  return (
    <DialogPrimitive.Overlay
      className={cn("fixed inset-0 z-50 bg-black/60 animate-overlay-show", className)}
      {...props}
    />
  );
}

function DialogContent({ className, children, ...props }) {
  return (
    <DialogPortal>
      <DialogOverlay className="animate-overlay-show" />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <DialogPrimitive.Content
          className={cn(
            "w-full max-w-[560px] rounded-md border border-[#343434] bg-[#252526] p-4 shadow-xl animate-content-show focus:outline-none pointer-events-auto",
            className
          )}
          {...props}
        >
          {children}
          <DialogPrimitive.Close className="absolute right-3 top-3 rounded-sm opacity-70 hover:opacity-100">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </div>
    </DialogPortal>
  );
}

function DialogHeader({ className, ...props }) {
  return <div className={cn("mb-3", className)} {...props} />;
}

function DialogTitle({ className, ...props }) {
  return <DialogPrimitive.Title className={cn("text-sm font-semibold", className)} {...props} />;
}

function DialogFooter({ className, ...props }) {
  return <div className={cn("mt-3 flex justify-end gap-2", className)} {...props} />;
}

function DialogDescription({ className, ...props }) {
  return <DialogPrimitive.Description className={cn("text-xs text-[#9da1a6]", className)} {...props} />;
}

export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
};
