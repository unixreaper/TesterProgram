/* eslint-disable react/prop-types */
import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Check,
  ClipboardList,
  ChevronDown,
  FileText,
  Flag,
  ListChecks,
  PlayCircle,
  Plus,
  Search,
  Trash2,
  X
} from "lucide-react";
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

const CASE_TYPE_OPTIONS = ["functional", "integration", "regression", "smoke", "uat", "api", "ui"];
const PRIORITY_OPTIONS = ["high", "medium", "low"];
const PRIORITY_DOT = {
  high: "bg-[#f48771]",
  medium: "bg-[#d7ba7d]",
  low: "bg-[#9cdcfe]"
};

const STEP_CONFIG = [
  {
    key: "identity",
    icon: ClipboardList,
    fields: ["testCaseId", "title", "caseType", "priority", "moduleIds"],
    requiredFields: ["testCaseId", "title", "caseType", "priority", "moduleIds"]
  },
  {
    key: "setup",
    icon: Flag,
    fields: ["preconditions", "testData"],
    requiredFields: []
  },
  {
    key: "execution",
    icon: ListChecks,
    fields: ["steps"],
    requiredFields: ["steps"]
  },
  {
    key: "result",
    icon: PlayCircle,
    fields: ["expectedResult", "notes"],
    requiredFields: ["expectedResult"]
  }
];

const FIELD_LABELS = {
  testCaseId: "modals.caseId",
  title: "modals.title",
  caseType: "modals.type",
  priority: "modals.priority",
  moduleIds: "modals.relatedModules",
  preconditions: "modals.preconditions",
  testData: "modals.testData",
  steps: "modals.steps",
  expectedResult: "modals.expected",
  status: "modals.resultStatus"
};

function requiredMark() {
  return <span className="text-[#f48771]">*</span>;
}

function isFilled(value) {
  if (Array.isArray(value)) return value.length > 0;
  return typeof value === "string" ? value.trim().length > 0 : value != null;
}

function splitList(value) {
  const list = String(value || "").split("\n");
  return list.length ? list : [""];
}

function joinList(items) {
  return items.join("\n");
}

function hasListContent(value) {
  return splitList(value).some((item) => item.trim().length > 0);
}

function FieldLabel({ children, required = false }) {
  return (
    <label className="mb-1 flex items-center gap-1 text-[11px] font-medium text-[#a8adb3]">
      {children}
      {required && requiredMark()}
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
      className={`group relative flex w-full items-center gap-2 rounded-md border px-2 py-2 text-left transition-colors ${
        active
          ? "border-[#0e639c] bg-[#0e639c24] text-white"
          : complete
            ? "border-[#2f6f63] bg-[#1e3b36] text-[#c9fff4]"
            : "border-[#343434] bg-[#1f1f1f] text-[#aeb4bb] hover:border-[#464646]"
      } disabled:cursor-not-allowed disabled:opacity-45`}
    >
      <span
        className={`grid h-6 w-6 shrink-0 place-items-center rounded-md ${
          active ? "bg-[#0e639c] text-white" : complete ? "bg-[#2f6f63] text-white" : "bg-[#2d2d2d] text-[#8f98a0]"
        }`}
      >
        {complete ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
      </span>
      <span className="min-w-0">
        <span className="block text-[10px] uppercase text-[#7f8891]">{t("modals.step")}{index + 1}</span>
        <span className="block truncate text-xs font-semibold">{t(`modals.caseWizard.${step.key}`)}</span>
      </span>
    </button>
  );
}

function ModuleMultiSelect({ modules, selectedIds, onToggle, onClear, t }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selectedModules = modules.filter((module) => selectedIds.includes(module.id));
  const filteredModules = modules.filter((module) =>
    module.name.toLowerCase().includes(query.trim().toLowerCase())
  );

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={`flex min-h-8 w-full items-center justify-between gap-2 rounded-md border px-2 py-1 text-left text-xs focus:outline-none focus:ring-1 focus:ring-[#1177bb] ${
          open ? "border-[#1177bb] bg-[#1f252b]" : "border-[#3a3a3a] bg-[#1e1e1e]"
        }`}
      >
        <span className="flex min-w-0 flex-1 flex-wrap gap-1">
          {selectedModules.length === 0 ? (
            <span className="py-0.5 text-[#6f7680]">{t("modals.pickModules")}</span>
          ) : (
            selectedModules.slice(0, 3).map((module) => (
              <span key={module.id} className="rounded border border-[#3a3a3a] bg-[#2a2a2a] px-1.5 py-0.5 text-[10px] text-[#d4d4d4]">
                {module.name}
              </span>
            ))
          )}
          {selectedModules.length > 3 && (
            <span className="rounded border border-[#3a3a3a] px-1.5 py-0.5 text-[10px] text-[#9da1a6]">
              +{selectedModules.length - 3}
            </span>
          )}
        </span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[#9da1a6]" />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-[260] rounded-md border border-[#3a3a3a] bg-[#252526] p-2 shadow-2xl">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-[#6f7680]" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("modals.searchModules")}
              className="pl-7"
              autoFocus
            />
          </div>

          <div className="mt-2 max-h-[220px] overflow-y-auto pr-1">
            {filteredModules.length === 0 && (
              <div className="px-2 py-3 text-xs text-[#7f8891]">{t("empty.modules")}</div>
            )}
            {filteredModules.map((module) => {
              const active = selectedIds.includes(module.id);
              return (
                <button
                  key={module.id}
                  type="button"
                  onClick={() => onToggle(module.id)}
                  className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs transition-colors ${
                    active ? "bg-[#0e639c24] text-white" : "text-[#c9ced6] hover:bg-[#2d2d30]"
                  }`}
                >
                  <span className={`grid h-4 w-4 place-items-center rounded border ${active ? "border-[#0e639c] bg-[#0e639c]" : "border-[#555]"}`}>
                    {active && <Check className="h-3 w-3" />}
                  </span>
                  <span className="truncate">{module.name}</span>
                </button>
              );
            })}
          </div>

          {selectedModules.length > 0 && (
            <div className="mt-2 flex justify-end border-t border-[#343434] pt-2">
              <Button type="button" variant="ghost" size="sm" onClick={onClear} className="h-7 gap-1">
                <X className="h-3.5 w-3.5" />
                {t("buttons.clear")}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ListEditor({ label, required = false, value, onChange, placeholder, compact = false, t }) {
  const items = splitList(value);

  const updateItem = (index, nextValue) => {
    const nextItems = [...items];
    nextItems[index] = nextValue;
    onChange(joinList(nextItems));
  };

  const addItem = () => onChange(joinList([...items, ""]));

  const removeItem = (index) => {
    const nextItems = items.filter((_, itemIndex) => itemIndex !== index);
    onChange(joinList(nextItems.length ? nextItems : [""]));
  };

  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2">
        <FieldLabel required={required}>{label}</FieldLabel>
        <Button type="button" variant="ghost" size="sm" onClick={addItem} className="h-6 gap-1 px-2 text-[10px]">
          <Plus className="h-3 w-3" />
          {t("buttons.add")}
        </Button>
      </div>

      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={`${label}-${index}`} className="group flex items-start gap-2 rounded-md border border-[#343434] bg-[#1d1d1d] p-1.5">
            <span className="mt-1 grid h-5 w-5 shrink-0 place-items-center rounded bg-[#2d2d30] font-mono text-[10px] text-[#9da1a6]">
              {index + 1}
            </span>
            {compact ? (
              <Input
                value={item}
                onChange={(event) => updateItem(index, event.target.value)}
                placeholder={placeholder}
                className="border-transparent bg-transparent px-1 focus-visible:ring-0"
              />
            ) : (
              <Textarea
                value={item}
                onChange={(event) => updateItem(index, event.target.value)}
                placeholder={placeholder}
                className="min-h-[46px] resize-y border-transparent bg-transparent px-1 py-0.5 focus-visible:ring-0"
              />
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeItem(index)}
              className="h-7 w-7 shrink-0 text-[#858585] opacity-80 hover:text-[#f48771] group-hover:opacity-100"
              disabled={items.length === 1 && !item.trim()}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CaseModal({
  open,
  onOpenChange,
  form,
  setForm,
  modules = [],
  onSubmit,
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

  const currentStep = STEP_CONFIG[stepIndex];
  const requiredFields = currentStep.requiredFields || currentStep.fields;

  const completedSteps = useMemo(
    () => STEP_CONFIG.map((step) => {
      const stepRequiredFields = step.requiredFields || step.fields;
      if (stepRequiredFields.length > 0) {
        return stepRequiredFields.every((field) => isFilled(form[field]));
      }
      return step.fields.some((field) => hasListContent(form[field]));
    }),
    [form]
  );

  const updateField = (field, value) => {
    setForm((state) => ({ ...state, [field]: value }));
    setError("");
  };

  const toggleModule = (moduleId) => {
    const selectedIds = form.moduleIds || [];
    updateField(
      "moduleIds",
      selectedIds.includes(moduleId)
        ? selectedIds.filter((id) => id !== moduleId)
        : [...selectedIds, moduleId]
    );
  };

  const clearModules = () => updateField("moduleIds", []);

  const firstMissingField = (fields) => fields.find((field) => !isFilled(form[field]));

  const validateCurrentStep = () => {
    const missing = firstMissingField(requiredFields);
    if (!missing) return true;

    setError(t("messages.fillRequiredField", { field: t(FIELD_LABELS[missing]) }));
    return false;
  };

  const goToStep = (targetStep) => {
    if (targetStep <= maxStep || completedSteps[targetStep]) {
      setStepIndex(targetStep);
      setMaxStep((value) => Math.max(value, targetStep));
      setError("");
    }
  };

  const goNext = () => {
    if (!validateCurrentStep()) return;

    const nextStep = Math.min(stepIndex + 1, STEP_CONFIG.length - 1);
    setStepIndex(nextStep);
    setMaxStep((value) => Math.max(value, nextStep));
    setError("");
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    for (let index = 0; index < STEP_CONFIG.length; index += 1) {
      const stepRequiredFields = STEP_CONFIG[index].requiredFields || STEP_CONFIG[index].fields;
      const missing = firstMissingField(stepRequiredFields);
      if (missing) {
        setStepIndex(index);
        setMaxStep((value) => Math.max(value, index));
        setError(t("messages.fillRequiredField", { field: t(FIELD_LABELS[missing]) }));
        return;
      }
    }

    onSubmit();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(980px,94vw)] max-w-none max-h-[92vh] overflow-visible p-0">
        <DialogHeader className="border-b border-[#343434] px-4 py-3">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-[#4dabf7]" />
            <DialogTitle className="text-sm font-semibold text-[#e0e0e0]">
              {form.id ? t("buttons.edit") : t("modals.createCase")}
            </DialogTitle>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-col">
          <div className="grid min-h-0 grid-cols-1 md:grid-cols-[230px_minmax(0,1fr)]">
            <aside className="border-b border-[#343434] bg-[#202020] p-3 md:border-b-0 md:border-r">
              <div className="space-y-2">
                {STEP_CONFIG.map((step, index) => (
                  <StepButton
                    key={step.key}
                    step={step}
                    index={index}
                    active={index === stepIndex}
                    complete={completedSteps[index]}
                    unlocked={index <= maxStep || completedSteps[index]}
                    onClick={() => goToStep(index)}
                    t={t}
                  />
                ))}
              </div>

              <div className="mt-3 rounded-md border border-[#343434] bg-[#1a1a1a] p-2 text-[11px]">
                <div className="text-[#7f8891]">{t("modals.caseId")}</div>
                <div className="mt-1 truncate font-mono text-[#4ec9b0]">{form.testCaseId || "-"}</div>
                <div className="mt-2 text-[#7f8891]">{t("modals.priority")}</div>
                <div className="mt-1 flex items-center gap-2 text-[#d4d4d4]">
                  <span className={`h-2 w-2 rounded-full ${PRIORITY_DOT[form.priority]}`} />
                  {t(`priority.${form.priority}`)}
                </div>
              </div>
            </aside>

            <div className={`min-h-0 p-4 ${stepIndex === 0 ? "overflow-visible" : "overflow-y-auto"}`}>
              {stepIndex === 0 && (
                <section className="space-y-3">
                  <div className="grid grid-cols-1 gap-3 lg:grid-cols-[170px_minmax(0,1fr)]">
                    <div>
                      <FieldLabel required>{t("modals.caseId")}</FieldLabel>
                      <Input value={form.testCaseId} onChange={(event) => updateField("testCaseId", event.target.value)} required />
                    </div>
                    <div>
                      <FieldLabel required>{t("modals.title")}</FieldLabel>
                      <Input value={form.title} onChange={(event) => updateField("title", event.target.value)} required autoFocus />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 lg:grid-cols-[150px_150px_minmax(0,1fr)]">
                    <div>
                      <FieldLabel required>{t("modals.type")}</FieldLabel>
                      <Select value={form.caseType} onValueChange={(value) => updateField("caseType", value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CASE_TYPE_OPTIONS.map((item) => (
                            <SelectItem key={item} value={item}>{t(`caseType.${item}`)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <FieldLabel required>{t("modals.priority")}</FieldLabel>
                      <Select value={form.priority} onValueChange={(value) => updateField("priority", value)}>
                        <SelectTrigger>
                          <span className="flex items-center gap-2">
                            <span className={`h-2 w-2 rounded-full ${PRIORITY_DOT[form.priority]}`} />
                            {t(`priority.${form.priority}`)}
                          </span>
                        </SelectTrigger>
                        <SelectContent>
                          {PRIORITY_OPTIONS.map((item) => (
                            <SelectItem key={item} value={item}>
                              <span className="flex items-center gap-2">
                                <span className={`h-2 w-2 rounded-full ${PRIORITY_DOT[item]}`} />
                                {t(`priority.${item}`)}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <FieldLabel required>{t("modals.relatedModules")}</FieldLabel>
                      <ModuleMultiSelect
                        modules={modules}
                        selectedIds={form.moduleIds || []}
                        onToggle={toggleModule}
                        onClear={clearModules}
                        t={t}
                      />
                    </div>
                  </div>
                </section>
              )}

              {stepIndex === 1 && (
                <section className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                  <ListEditor
                    label={t("modals.preconditions")}
                    value={form.preconditions}
                    onChange={(value) => updateField("preconditions", value)}
                    placeholder={t("modals.preconditionPlaceholder")}
                    compact
                    t={t}
                  />
                  <ListEditor
                    label={t("modals.testData")}
                    value={form.testData}
                    onChange={(value) => updateField("testData", value)}
                    placeholder={t("modals.testDataPlaceholder")}
                    compact
                    t={t}
                  />
                </section>
              )}

              {stepIndex === 2 && (
                <section className="max-w-[720px]">
                  <ListEditor
                    label={t("modals.steps")}
                    required
                    value={form.steps}
                    onChange={(value) => updateField("steps", value)}
                    placeholder={t("modals.stepPlaceholder")}
                    t={t}
                  />
                </section>
              )}

              {stepIndex === 3 && (
                <section className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_260px]">
                  <ListEditor
                    label={t("modals.expected")}
                    required
                    value={form.expectedResult}
                    onChange={(value) => updateField("expectedResult", value)}
                    placeholder={t("modals.expectedPlaceholder")}
                    t={t}
                  />

                  <div>
                    <FieldLabel>{t("modals.notes")}</FieldLabel>
                    <Textarea
                      value={form.notes || ""}
                      onChange={(event) => updateField("notes", event.target.value)}
                      placeholder={t("modals.notesPlaceholder")}
                      className="min-h-[80px]"
                    />
                  </div>
                </section>
              )}

              {error && (
                <div className="mt-3 flex items-center gap-2 rounded-md border border-[#8f5148] bg-[#3d2623] px-3 py-2 text-xs text-[#f48771]">
                  <AlertCircle className="h-3.5 w-3.5" />
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
            {stepIndex < STEP_CONFIG.length - 1 ? (
              <Button type="button" className="h-8 text-[11px]" onClick={goNext}>
                {t("buttons.next")}
              </Button>
            ) : (
              <Button type="submit" className="h-8 bg-[#0e639c] px-4 text-[11px] hover:bg-[#1177bb]">
                {form.id ? t("buttons.save") : t("buttons.create")}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
