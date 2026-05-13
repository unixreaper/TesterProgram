/* eslint-disable react/prop-types */
import { useState } from "react";
import { ListChecks, CheckCircle2, ExternalLink, X, Edit2, Trash2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { EmptyState } from "./EmptyState";

function ChecklistItem({ item, toggleChecklist, onEditChecklist, onDeleteChecklist }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(item.title);
  
  const handleSave = () => {
    if (editTitle.trim() && onEditChecklist) {
      onEditChecklist(item.id, editTitle.trim());
      setIsEditing(false);
    }
  };
  
  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") { 
      setIsEditing(false); 
      setEditTitle(item.title); 
    }
  };
  
  return (
    <div
      className={`w-full group rounded-lg border px-3 py-2.5 text-left text-[11px] transition-all duration-200 ${
        item.done
          ? "border-[#2f6f63] bg-[#1e3b36]/40 text-[#9be2d3] opacity-80"
          : "border-[#323232] bg-[#1f1f1f] hover:border-[#454545] hover:bg-[#252525]"
      }`}
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={() => toggleChecklist?.(item)}
          className={`mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border transition-colors ${
            item.done
              ? "border-[#4ec9b0] bg-[#4ec9b0] text-[#1e3b36]"
              : "border-[#454545] bg-transparent"
          }`}
        >
          {item.done && <CheckCircle2 className="h-2.5 w-2.5" />}
        </button>
        
        {isEditing ? (
          <div className="flex-1 flex flex-col gap-1">
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
              className="bg-transparent border-b border-[#4dabf7] text-[#e0e0e0] text-[11px] px-1 py-0.5 outline-none"
            />
            <div className="flex items-center gap-1.5 text-[9px]">
              <button
                type="button"
                onClick={handleSave}
                className="text-[#4ec9b0] hover:underline"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => { setIsEditing(false); setEditTitle(item.title); }}
                className="text-[#6f7680] hover:underline"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-start justify-between gap-2">
            <span
              className={`leading-normal cursor-pointer ${item.done ? "line-through opacity-60" : "font-medium"}`}
              onClick={() => toggleChecklist?.(item)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleChecklist?.(item); }}
            >
              {item.title}
            </span>
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={() => { setIsEditing(true); setEditTitle(item.title); }}
                className="h-5 w-5 rounded grid place-items-center text-[#9da1a6] hover:text-[#4dabf7] hover:bg-[#4dabf715] transition-colors"
                title="Edit"
              >
                <Edit2 className="w-2.5 h-2.5" />
              </button>
              <button
                type="button"
                onClick={() => onDeleteChecklist?.(item.id)}
                className="h-5 w-5 rounded grid place-items-center text-[#9da1a6] hover:text-[#f48771] hover:bg-[#f4877115] transition-colors"
                title="Delete"
              >
                <Trash2 className="w-2.5 h-2.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function ChecklistPanel({
  selectedPlan,
  selectedChecklist,
  completionPercent,
  toggleChecklist,
  onEditChecklist,
  onDeleteChecklist,
  onAddClick,
  onDetach,
  onDestroy,
  isDetached,
  t
}) {
  const percent = typeof completionPercent === "function"
    ? completionPercent(selectedPlan?.id)
    : (completionPercent ?? 0);

  return (
    <Card className="min-h-0 flex flex-col h-full relative">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between mb-1">
          <CardTitle className="flex items-center gap-2 text-sm">
            <ListChecks className={`w-4 h-4 ${isDetached ? "text-[#6f7680]" : "text-[#4dabf7]"}`} />
            <span className={isDetached ? "text-[#6f7680]" : ""}>{t("checklist")}</span>
          </CardTitle>
          <div className="flex items-center gap-1">
            {!isDetached && selectedPlan && (
              <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                {percent}%
              </Badge>
            )}
            {onDetach && !isDetached && (
              <button
                type="button"
                className="h-5 w-5 rounded grid place-items-center text-[#9da1a6] hover:text-[#4dabf7] hover:bg-[#4dabf715] transition-colors"
                title={t("detachWindow")}
                onClick={onDetach}
              >
                <ExternalLink className="w-3 h-3" />
              </button>
            )}
            {isDetached && (
              <>
                <ExternalLink className="w-3 h-3 text-[#4dabf7] opacity-60" />
                {onDestroy && (
                  <button
                    type="button"
                    className="h-5 w-5 rounded grid place-items-center text-[#f48771] hover:bg-[#f4877115] transition-colors"
                    title="Close detached window"
                    onClick={onDestroy}
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </>
            )}
          </div>
        </div>
        {!isDetached && (
          <>
            <CardDescription className="text-[11px]">{t("executionReadiness")}</CardDescription>
            {selectedPlan && (
              <div className="mt-3 h-1.5 w-full bg-[#2d2d2d] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#0e639c] to-[#4dabf7] transition-all duration-500 ease-out"
                  style={{ width: `${percent}%` }}
                />
              </div>
            )}
          </>
        )}
      </CardHeader>

      {isDetached ? (
        <CardContent className="flex-1 flex flex-col items-center justify-center gap-3 text-center select-none pb-4">
          <div className="relative">
            <ListChecks className="w-10 h-10 text-[#2d2d2d]" />
            <ExternalLink className="w-4 h-4 text-[#4dabf7] absolute -top-1 -right-1" />
          </div>
          <p className="text-[11px] text-[#4f5258] max-w-[130px] leading-relaxed">
            {t("detachedHint")}
          </p>
        </CardContent>
      ) : (
        <CardContent className="min-h-0 overflow-auto space-y-2 p-3 pt-0 custom-scrollbar">
          {!selectedPlan && (
            <div className="py-8">
              <EmptyState
                icon={ListChecks}
                title={t("empty.checklist")}
                description={t("empty.plansInProject")}
              />
            </div>
          )}
          {selectedPlan && (selectedChecklist || []).length === 0 && (
            <div className="py-8">
              <EmptyState
                icon={ListChecks}
                title={t("empty.checklist")}
                description={t("empty.checklistDescription") || "Add items to verify before starting the test execution."}
                actionLabel={t("newChecklist")}
                onAction={onAddClick}
              />
            </div>
          )}
          {(selectedChecklist || []).map((item) => (
            <ChecklistItem
              key={item.id}
              item={item}
              toggleChecklist={toggleChecklist}
              onEditChecklist={onEditChecklist}
              onDeleteChecklist={onDeleteChecklist}
            />
          ))}
        </CardContent>
      )}
    </Card>
  );
}
