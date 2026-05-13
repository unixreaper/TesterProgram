/* eslint-disable react/prop-types */
import { CheckCircle2 } from "lucide-react";

export function WizardStepper({ steps, activeStep, maxStep, onStepClick, t, labelPrefix, vertical = false }) {
  const trackColor = "bg-[#343434]";
  const progressColor = "bg-[#0e639c]";

  return (
    <div className={vertical ? "h-full min-h-0 overflow-auto pr-1" : "mb-4"}>
      <div className={vertical ? "flex flex-col gap-3" : "grid auto-cols-fr grid-flow-col gap-3"}>
        {steps.map((stepKey, index) => {
          const active = activeStep === index;
          const unlocked = index <= maxStep;
          const completed = index < maxStep;
          const connectorComplete = index < maxStep;

          let containerStyles = "border-[#343434] bg-[#1f1f1f] hover:border-[#454545]";
          if (active) {
            containerStyles = "border-[#0e639c] bg-[#0e639c22] shadow-[0_0_15px_rgba(14,99,156,0.15)] ring-1 ring-[#0e639c]";
          } else if (completed) {
            containerStyles = "border-[#2f6f63] bg-[#1e3b36]";
          }

          let badgeStyles = "bg-[#343434] text-[#9da1a6] group-hover:bg-[#404040]";
          if (active) {
            badgeStyles = "bg-[#0e639c] text-white";
          } else if (completed) {
            badgeStyles = "bg-[#2f6f63] text-[#e7fff8]";
          }

          return (
            <div key={stepKey} className="relative">
              <button
                type="button"
                onClick={() => onStepClick(index)}
                disabled={!unlocked}
                className={`w-full group rounded-lg border px-3 py-3 text-left transition-all duration-200 ${containerStyles} disabled:opacity-50`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[11px] font-bold transition-colors ${badgeStyles}`}
                  >
                    {completed ? <CheckCircle2 className="w-3 h-3" /> : index + 1}
                  </span>
                  <div className="min-w-0">
                    <div className="text-[9px] uppercase tracking-widest font-bold opacity-60 mb-0.5">{t("modals.step")} {index + 1}</div>
                    <div className={`${vertical ? "" : "truncate"} text-xs font-semibold ${active ? "text-[#3794ff]" : "text-[#d4d4d4]"}`}>
                      {t(`${labelPrefix}.${stepKey}`)}
                    </div>
                  </div>
                </div>
              </button>

              {index < steps.length - 1 && (
                vertical ? (
                  <div className="relative ml-5.5 h-4 w-px left-[1px]">
                    <div className={`absolute inset-0 w-px ${trackColor}`} />
                    {connectorComplete && <div className={`absolute inset-0 w-px ${progressColor}`} />}
                  </div>
                ) : null
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
