/* eslint-disable react/prop-types */
import { useMemo } from "react";
import { AlertTriangle, CheckCircle2, RotateCcw, XCircle, Paperclip, Trash2, Plus } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

const RESULT_STATUS_META = {
  pass: {
    icon: CheckCircle2,
    color: "text-[#4ec9b0]"
  },
  fail: {
    icon: XCircle,
    color: "text-[#f48771]"
  },
  blocked: {
    icon: AlertTriangle,
    color: "text-[#cca700]"
  },
  retest: {
    icon: RotateCcw,
    color: "text-[#9cdcfe]"
  }
};

function AttachmentItem({ file, onRemove }) {
  return (
    <div className="relative group">
      <div className="flex items-center gap-2 rounded-md border border-[#303030] bg-[#1a1a1a] p-2 pr-8 text-[10px] text-[#d4d4d4]">
        <Paperclip className="h-3 w-3 shrink-0 text-[#4dabf7]" />
        <span className="truncate" title={file}>
          {file.length > 16 && file.charAt(15) === "_" ? file.substring(16) : file}
        </span>
        <button
          type="button"
          onClick={onRemove}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-1 text-[#f48771] hover:bg-[#f4877115]"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

function AddAttachmentButton({ onAdd, t }) {
  const handleAdd = async () => {
    const inv = globalThis.__TAURI__?.core?.invoke;
    if (!inv) return;
    try {
      const selected = await inv("pick_file");
      if (!selected) return;
      const savedName = await inv("save_attachment", { tempPath: selected });
      onAdd(savedName);
    } catch (err) {
      console.error("Failed to save attachment:", err);
    }
  };

  return (
    <button
      type="button"
      onClick={handleAdd}
      className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-[#303030] bg-[#1a1a1a] py-2 text-[10px] text-[#858585] transition-colors hover:border-[#4dabf7] hover:bg-[#202020]"
    >
      <Plus className="h-3 w-3" />
      {t("buttons.addFile")}
    </button>
  );
}

export function ResultModal({
  open,
  onOpenChange,
  form,
  setForm,
  cases,
  environments,
  devices,
  onSubmit,
  t
}) {
  const selectedStatus = RESULT_STATUS_META[form.resultStatus] || RESULT_STATUS_META.pass;
  const SelectedStatusIcon = selectedStatus.icon;

  const handleRemoveAttachment = (file) => {
    setForm(s => ({ 
      ...s, 
      attachments: s.attachments.filter(f => f !== file) 
    }));
  };

  const handleAddAttachment = (savedName) => {
    setForm(s => ({ 
      ...s, 
      attachments: [...(s.attachments || []), savedName] 
    }));
  };

  const currentCase = useMemo(() => 
    cases.find(c => String(c.id) === String(form.caseId)), 
    [cases, form.caseId]
  );

  const steps = useMemo(() => 
    (currentCase?.steps || "").split("\n").map(s => s.trim()).filter(s => s.length > 0),
    [currentCase]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(720px,96vw)] max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>{form.id ? t("modals.editResult") : t("modals.addResult")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="rounded-lg border border-[#2d2d2d] bg-[#1d1d1d] px-3 py-2 text-[11px] text-[#8a9199]">
            {t("modals.resultSingleRecordHint")}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] text-[#9da1a6]">{t("modals.testCase")}</label>
              <Select value={form.caseId} onValueChange={(value) => setForm((s) => ({ ...s, caseId: value }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {cases.map((item) => (
                    <SelectItem key={item.id} value={String(item.id)}>{item.testCaseId || `TC-${item.id}`} • {item.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[11px] text-[#9da1a6]">{t("modals.resultStatus")}</label>
              <Select value={form.resultStatus} onValueChange={(value) => setForm((s) => ({ ...s, resultStatus: value }))}>
                <SelectTrigger>
                  <span className="flex items-center gap-2">
                    <SelectedStatusIcon className={`h-3.5 w-3.5 ${selectedStatus.color}`} />
                    <span>{t(`status.${form.resultStatus}`)}</span>
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(RESULT_STATUS_META).map(([value, meta]) => {
                    const Icon = meta.icon;
                    return (
                      <SelectItem key={value} value={value}>
                        <span className="flex items-center gap-2">
                          <Icon className={`h-3.5 w-3.5 ${meta.color}`} />
                          <span>{t(`status.${value}`)}</span>
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Step-by-Step Helper */}
          {steps.length > 0 && (
            <div className="rounded-xl border border-[#303030] bg-[#1a1a1a] p-3 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-[#4ec9b0] flex items-center gap-2">
                  <RotateCcw className="w-3 h-3" /> Execution Steps ({steps.length})
                </label>
                <button 
                  type="button"
                  className="text-[10px] text-[#4dabf7] hover:underline"
                  onClick={() => {
                    const text = steps.map((s, i) => `Step ${i+1}: OK`).join("\n");
                    setForm(s => ({ ...s, actualResult: text, resultStatus: "pass" }));
                  }}
                >
                  Mark All OK
                </button>
              </div>
              <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
                {steps.map((step, idx) => {
                  const stepNum = idx + 1;
                  const stepKey = `Step ${stepNum}:`;
                  const isOk = (form.actualResult || "").includes(`${stepKey} OK`);
                  const isFailed = (form.actualResult || "").includes(`${stepKey} FAILED`);
                  const isMarked = (form.actualResult || "").includes(stepKey);

                  let checkClass = "hover:border-[#4dabf7]";
                  if (isOk) checkClass = "bg-[#4ec9b0] border-[#4ec9b0]";
                  else if (isFailed) checkClass = "bg-[#f48771] border-[#f48771]";

                  return (
                    <div key={`${stepNum}-${step}`} className="flex items-start gap-3 group">
                      <button
                        type="button"
                        onClick={() => {
                          const currentText = form.actualResult || "";
                          let newText = "";
                          if (currentText.includes(stepKey)) {
                             // Toggle OK/Failed if already exists
                             if (currentText.includes(`${stepKey} OK`)) {
                               newText = currentText.replace(`${stepKey} OK`, `${stepKey} FAILED`);
                             } else {
                               newText = currentText.replace(`${stepKey} FAILED`, `${stepKey} OK`);
                             }
                          } else {
                             newText = currentText ? `${currentText}\n${stepKey} OK` : `${stepKey} OK`;
                          }
                          setForm(s => ({ ...s, actualResult: newText }));
                        }}
                        className={`mt-0.5 h-4 w-4 shrink-0 rounded border border-[#444] transition-colors flex items-center justify-center ${checkClass}`}
                      >
                        {isMarked && (
                          <CheckCircle2 className="w-3 h-3 text-white" />
                        )}
                      </button>
                      <span className="text-[11px] text-[#d4d4d4] leading-relaxed select-none">
                        <span className="text-[#858585] font-mono mr-1.5">{stepNum}.</span>
                        {step}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <div>
              <label className="text-[11px] text-[#9da1a6]">{t("modals.testedBy")}</label>
              <Input value={form.testedBy} onChange={(e) => setForm((s) => ({ ...s, testedBy: e.target.value }))} />
            </div>
            <div>
              <label className="text-[11px] text-[#9da1a6]">{t("modals.environment")}</label>
              <Select value={form.environment} onValueChange={(value) => setForm((s) => ({ ...s, environment: value }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {environments.map((item) => (
                    <SelectItem key={item.id} value={item.name}>{item.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[11px] text-[#9da1a6]">{t("modals.testDevice")}</label>
              <Select value={form.testedDevice} onValueChange={(value) => setForm((s) => ({ ...s, testedDevice: value }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {devices.map((item) => (
                    <SelectItem key={item.id} value={item.name}>{item.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <label className="text-[11px] text-[#9da1a6]">{t("modals.actualResult")}</label>
            <Textarea value={form.actualResult} onChange={(e) => setForm((s) => ({ ...s, actualResult: e.target.value }))} />
          </div>
          <div>
            <label className="text-[11px] text-[#9da1a6]">{t("modals.bugComment")}</label>
            <Input value={form.bugIdOrComments} onChange={(e) => setForm((s) => ({ ...s, bugIdOrComments: e.target.value }))} />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] text-[#9da1a6]">{t("modals.attachments")} (Max 10)</label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {(form.attachments || []).map((file) => (
                <AttachmentItem 
                  key={file} 
                  file={file} 
                  onRemove={() => handleRemoveAttachment(file)} 
                />
              ))}
              {(form.attachments || []).length < 10 && (
                <AddAttachmentButton onAdd={handleAddAttachment} t={t} />
              )}
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="secondary">{t("buttons.cancel")}</Button></DialogClose>
            <Button type="submit">{t("buttons.save")}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
