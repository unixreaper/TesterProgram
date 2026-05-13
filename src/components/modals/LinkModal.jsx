/* eslint-disable react/prop-types */
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "../ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

export function LinkModal({
  open,
  onOpenChange,
  form,
  setForm,
  plans,
  canLinkCurrent,
  linkCurrentState,
  onApplyLink,
  t
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{t("modals.linkCase")}</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <label className="text-[11px] text-[#9da1a6]">{t("modals.testPlan")}</label>
            <Select value={form.planId} onValueChange={(value) => setForm((s) => ({ ...s, planId: value }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {plans.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" onClick={onApplyLink} disabled={!canLinkCurrent}>
            {linkCurrentState ? t("buttons.unlink") : t("buttons.link")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
