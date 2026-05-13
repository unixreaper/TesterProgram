/* eslint-disable react/prop-types */
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "../ui/dialog";

export function ChecklistModal({ open, onOpenChange, form, setForm, onSubmit, t }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{t("modals.createChecklist")}</DialogTitle></DialogHeader>
        <form onSubmit={onSubmit} className="space-y-2">
          <div>
            <label className="text-[11px] text-[#9da1a6]">{t("modals.itemTitle")}</label>
            <Input value={form.title} onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))} required />
          </div>
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="secondary">{t("buttons.cancel")}</Button></DialogClose>
            <Button type="submit">{t("buttons.create")}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
