/* eslint-disable react/prop-types */
import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ClipboardList, Goal, Settings2 } from "lucide-react";
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

const PLAN_STEPS = [
  { key: "overview", icon: Goal, fields: ["projectId", "name", "testingGoal"] },
  { key: "scope", icon: ClipboardList, fields: ["scopeIn", "scopeOut"] },
  { key: "setup", icon: CalendarDays, fields: ["startDate", "endDate"] }
];

const FIELD_LABELS = {
  projectId: "modals.project",
  name: "modals.planName",
  testingGoal: "modals.testingGoal",
  scopeIn: "modals.scopeIn",
  scopeOut: "modals.scopeOut",
  testerName: "modals.testerName",
  testEnvironment: "modals.environment",
  startDate: "modals.startDate",
  endDate: "modals.endDate"
};

function RequiredMark() {
  return <span className="text-[#f48771]">*</span>;
}

function isFilled(value) {
  return typeof value === "string" ? value.trim().length > 0 : value != null && value !== "";
}

function FieldLabel({ children, required = false }) {
  return (
    <label className="mb-1 flex items-center gap-1 text-[11px] font-medium text-[#a8adb3]">
      {children}
      {required && <RequiredMark />}
    </label>
  );
}

function StepButton({ step, index, active, complete, unlocked, onClick, t }) {
  const Icon = step.icon;

  return (
    <button
      type="button"
      disabled={!unlocked}
      onClick={onClick}
      className={`flex w-full items-center gap-2 rounded-md border px-2 py-2 text-left transition-colors ${
        active
          ? "border-[#0e639c] bg-[#0e639c24] text-white"
          : complete
            ? "border-[#2f6f63] bg-[#1e3b36] text-[#c9fff4]"
            : "border-[#343434] bg-[#1f1f1f] text-[#aeb4bb] hover:border-[#464646]"
      } disabled:cursor-not-allowed disabled:opacity-45`}
    >
      <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-md ${active ? "bg-[#0e639c]" : complete ? "bg-[#2f6f63]" : "bg-[#2d2d2d]"}`}>
        <Icon className="h-3.5 w-3.5" />
      </span>
      <span className="min-w-0">
        <span className="block text-[10px] uppercase text-[#7f8891]">{t("modals.step")}{index + 1}</span>
        <span className="block truncate text-xs font-semibold">{t(`modals.planSteps.${step.key}`)}</span>
      </span>
    </button>
  );
}

export function PlanModal({
  open,
  onOpenChange,
  mode = "create",
  form,
  setForm,
  projects = [],
  environments = [],
  onSubmit,
  onManageSettings,
  t
}) {
  const [stepIndex, setStepIndex] = useState(0);
  const [maxStep, setMaxStep] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setStepIndex(0);
      setMaxStep(0);
      setError("");
    }
  }, [open]);

  const completedSteps = useMemo(
    () => PLAN_STEPS.map((step) => step.fields.every((field) => isFilled(form[field]))),
    [form]
  );

  const updateField = (field, value) => {
    setForm((state) => ({ ...state, [field]: value }));
    setError("");
  };

  const firstMissingField = (fields) => fields.find((field) => !isFilled(form[field]));

  const validateStep = (index) => {
    const missing = firstMissingField(PLAN_STEPS[index].fields);
    if (!missing) return true;
    setError(t("messages.fillRequiredField", { field: t(FIELD_LABELS[missing]) }));
    return false;
  };

  const goNext = () => {
    if (!validateStep(stepIndex)) return;
    const nextStep = Math.min(stepIndex + 1, PLAN_STEPS.length - 1);
    setStepIndex(nextStep);
    setMaxStep((value) => Math.max(value, nextStep));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    for (let index = 0; index < PLAN_STEPS.length; index += 1) {
      if (!validateStep(index)) {
        setStepIndex(index);
        setMaxStep((value) => Math.max(value, index));
        return;
      }
    }
    onSubmit();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(900px,94vw)] max-w-none max-h-[90vh] overflow-visible p-0">
        <DialogHeader className="border-b border-[#343434] px-4 py-3">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-[#4dabf7]" />
            <DialogTitle className="text-sm font-semibold text-[#e0e0e0]">
              {mode === "edit" ? t("buttons.edit") : t("modals.createPlan")}
            </DialogTitle>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-col">
          <div className="grid min-h-0 grid-cols-1 md:grid-cols-[220px_minmax(0,1fr)]">
            <aside className="border-b border-[#343434] bg-[#202020] p-3 md:border-b-0 md:border-r">
              <div className="space-y-2">
                {PLAN_STEPS.map((step, index) => (
                  <StepButton
                    key={step.key}
                    step={step}
                    index={index}
                    active={index === stepIndex}
                    complete={completedSteps[index]}
                    unlocked={index <= maxStep || completedSteps[index]}
                    onClick={() => {
                      setStepIndex(index);
                      setMaxStep((value) => Math.max(value, index));
                      setError("");
                    }}
                    t={t}
                  />
                ))}
              </div>
            </aside>

            <div className="min-h-0 overflow-y-auto p-4">
              {stepIndex === 0 && (
                <section className="space-y-3">
                  <div>
                    <FieldLabel required>{t("modals.project")}</FieldLabel>
                    <Select value={form.projectId ? String(form.projectId) : ""} onValueChange={(value) => updateField("projectId", Number(value))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={String(project.id)}>{project.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <FieldLabel required>{t("modals.planName")}</FieldLabel>
                    <Input value={form.name} onChange={(event) => updateField("name", event.target.value)} required autoFocus />
                  </div>
                  <div>
                    <FieldLabel required>{t("modals.testingGoal")}</FieldLabel>
                    <Textarea value={form.testingGoal} onChange={(event) => updateField("testingGoal", event.target.value)} className="min-h-[132px]" required />
                  </div>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div>
                      <FieldLabel>{t("modals.testerName")}</FieldLabel>
                      <Input value={form.testerName} onChange={(event) => updateField("testerName", event.target.value)} />
                    </div>
                    <div>
                      <FieldLabel>{t("modals.environment")}</FieldLabel>
                      <Select value={form.testEnvironment || ""} onValueChange={(value) => updateField("testEnvironment", value)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {environments.map((item) => (
                            <SelectItem key={item.id} value={item.name}>{item.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </section>
              )}

              {stepIndex === 1 && (
                <section className="space-y-3">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div>
                      <FieldLabel required>{t("modals.scopeIn")}</FieldLabel>
                      <Textarea value={form.scopeIn} onChange={(event) => updateField("scopeIn", event.target.value)} className="min-h-[140px]" required />
                    </div>
                    <div>
                      <FieldLabel required>{t("modals.scopeOut")}</FieldLabel>
                      <Textarea value={form.scopeOut} onChange={(event) => updateField("scopeOut", event.target.value)} className="min-h-[140px]" required />
                    </div>
                  </div>
                  <div>
                    <FieldLabel>{t("modals.risksNotes")}</FieldLabel>
                    <Textarea value={form.risksNotes} onChange={(event) => updateField("risksNotes", event.target.value)} className="min-h-[84px]" />
                  </div>
                </section>
              )}

              {stepIndex === 2 && (
                <section className="space-y-3">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div>
                      <FieldLabel required>{t("modals.startDate")}</FieldLabel>
                      <Input type="date" value={form.startDate} onChange={(event) => updateField("startDate", event.target.value)} required />
                    </div>
                    <div>
                      <FieldLabel required>{t("modals.endDate")}</FieldLabel>
                      <Input type="date" value={form.endDate} onChange={(event) => updateField("endDate", event.target.value)} required />
                    </div>
                  </div>
                  <Button type="button" variant="secondary" onClick={onManageSettings} className="h-8 gap-1 px-2">
                    <Settings2 className="h-3.5 w-3.5" />
                    {t("manageEnvironment")}
                  </Button>
                </section>
              )}

              {error && (
                <div className="mt-3 rounded-md border border-[#8f5148] bg-[#3d2623] px-3 py-2 text-xs text-[#f48771]">
                  {error}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="mt-0 border-t border-[#343434] bg-[#202020] px-4 py-3">
            <DialogClose asChild>
              <Button type="button" variant="secondary" className="h-8 text-[11px]">
                {t("buttons.cancel")}
              </Button>
            </DialogClose>
            {stepIndex > 0 && (
              <Button type="button" variant="secondary" className="h-8 text-[11px]" onClick={() => setStepIndex((value) => Math.max(0, value - 1))}>
                {t("buttons.back")}
              </Button>
            )}
            {stepIndex < PLAN_STEPS.length - 1 ? (
              <Button type="button" className="h-8 text-[11px]" onClick={goNext}>
                {t("buttons.next")}
              </Button>
            ) : (
              <Button type="submit" className="h-8 bg-[#0e639c] px-4 text-[11px] hover:bg-[#1177bb]">
                {mode === "edit" ? t("buttons.save") : t("buttons.create")}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
