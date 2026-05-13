/* eslint-disable react/prop-types */
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "../ui/dialog";

export function ProjectModal({ open, onOpenChange, mode, form, setForm, onSubmit, t }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "create" ? t("modals.createProject") : t("modals.editProject")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-2">
          <div>
            <label className="text-[11px] text-[#9da1a6]">{t("modals.name")}</label>
            <Input 
              value={form.name} 
              onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} 
              required 
            />
          </div>
          <div>
            <label className="text-[11px] text-[#9da1a6]">{t("modals.description")}</label>
            <Textarea 
              value={form.description} 
              onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))} 
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">{t("buttons.cancel")}</Button>
            </DialogClose>
            <Button type="submit">
              {mode === "create" ? t("buttons.create") : t("buttons.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
