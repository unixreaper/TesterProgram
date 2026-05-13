/* eslint-disable react/prop-types */
import { FlaskConical, Edit2, Trash2, Paperclip } from "lucide-react";
import { EmptyState } from "./EmptyState";
import { Button } from "./ui/button";

export function TestResultsTable({ 
  visibleResults = [], 
  cases = [], 
  plans = [], 
  getStatusConfig, 
  setOpenResultModal, 
  onEditResult, 
  onDeleteResult,
  t 
}) {
  const results = visibleResults || [];
  
  if (results.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center h-full">
        <EmptyState
          icon={FlaskConical}
          title={t("empty.results")}
          description={t("empty.resultsDescription")}
          actionLabel={t("addResult")}
          onAction={() => setOpenResultModal?.(true)}
        />
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 relative h-full">
      <div className="absolute inset-0 overflow-auto custom-scrollbar">
        <table className="w-full text-[10px] border-collapse table-fixed">
          <thead className="sticky top-0 bg-[#1a1a1a] z-10">
            <tr className="text-[#6f7680] border-b border-[#333] text-left uppercase tracking-tighter">
              <th className="p-2 font-bold w-[70px]">{t("grid.results.time")}</th>
              <th className="p-2 font-bold">{t("grid.results.case")}</th>
              <th className="p-2 font-bold w-[65px]">{t("grid.results.status")}</th>
              <th className="p-2 font-bold w-[45px] text-right pr-2">{t("grid.cases.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {results.slice(0, 50).map((row) => {
              const caseObj = cases.find(c => c.id === row.caseId);
              const config = getStatusConfig ? getStatusConfig(row.resultStatus) : null;
              
              const dateStr = (() => {
                if (!row.executedAt) return "-";
                try {
                  const parts = row.executedAt.split(" ");
                  const dateParts = parts[0]?.split("-") || [];
                  const timeParts = parts[1]?.split(":") || ["00","00"];
                  return `${dateParts[2]}/${dateParts[1]} ${timeParts[0]}:${timeParts[1]}`;
                } catch (err) {
                  console.warn("Failed to parse date:", err);
                  return row.executedAt;
                }
              })();

              return (
                <tr
                  key={row.id}
                  className="border-b border-[#242424] hover:bg-[#ffffff08] transition-colors cursor-pointer"
                  onClick={async () => {
                    const inv = globalThis.__TAURI__?.core?.invoke;
                    if (inv) {
                      try { await inv("open_result_detail_window", { resultId: row.id }); }
                      catch (err) { console.error("Failed to open detail:", err); }
                    }
                  }}
                >
                  <td className="p-2 text-[#8a9199] whitespace-nowrap align-top">{dateStr}</td>
                  <td className="p-2 align-top">
                    <div className="flex flex-col min-w-0">
                      <span className="truncate font-medium text-[#e0e0e0] leading-tight" title={caseObj?.title}>
                        {caseObj?.testCaseId || "TC"} {caseObj?.title}
                      </span>
                      <span className="text-[9px] text-[#6f7680] truncate mt-0.5 flex items-center gap-2">
                         {row.testedBy || row.environment || t("labels.tester")}
                         {(row.attachments && row.attachments.length > 0) && (
                           <span className="flex items-center gap-1 text-[#4dabf7] bg-[#4dabf710] px-1 rounded">
                             <Paperclip 
                               className="w-2.5 h-2.5 cursor-pointer hover:text-white" 
                               title={t("buttons.openFile")}
                               onClick={async (e) => {
                                 e.stopPropagation();
                                 const invoke = globalThis.__TAURI__?.core?.invoke;
                                 if (invoke) {
                                   try {
                                     const fileName = row.attachments[0];
                                     await invoke("open_attachment", { fileName });
                                   } catch (err) {
                                     console.error("Failed to open attachment:", err);
                                   }
                                 }
                               }}
                             />
                             <span className="text-[8px]">{row.attachments.length}</span>
                           </span>
                         )}
                      </span>
                    </div>
                  </td>
                  <td className="p-2 align-top">
                    {config && (
                      <span 
                        className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-tighter inline-block whitespace-nowrap"
                        style={{ color: config.color, backgroundColor: config.bg, border: `1px solid ${config.border}` }}
                      >
                        {config.label}
                      </span>
                    )}
                  </td>
                  <td className="p-2 align-top text-right pr-1">
                    <div className="flex items-center justify-end gap-0.5">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 text-[#4dabf7] hover:bg-[#4dabf715]" 
                        onClick={() => onEditResult?.(row)}
                        title="Edit"
                      >
                        <Edit2 className="w-2.5 h-2.5" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 text-[#f48771] hover:bg-[#f4877115]" 
                        onClick={() => onDeleteResult?.(row.id)}
                        title="Delete"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
