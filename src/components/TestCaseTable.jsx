import { useMemo, useState } from "react";
/* eslint-disable react/prop-types */
import { ArrowDownUp, ChevronDown, ChevronUp, Play, Link2, Trash2, Edit } from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { EmptyState } from "./EmptyState";

const PRIORITY_WEIGHT = { high: 3, medium: 2, low: 1 };
const STATUS_WEIGHT = { fail: 4, blocked: 3, "not-run": 2, pass: 1 };

export function TestCaseTable({ 
  visibleCases = [], 
  latestResultMap = {}, 
  priorityDot = {}, 
  getStatusConfig,
  openRunTest, 
  onLink, 
  onEdit, 
  onDelete, 
  t 
}) {
  const [sortState, setSortState] = useState({ key: "caseId", direction: "asc" });
  const [filters, setFilters] = useState({ priority: "all", status: "all", type: "all" });

  const filteredAndSortedCases = useMemo(() => {
    let list = [...visibleCases];

    // Apply Filters
    if (filters.priority !== "all") {
      list = list.filter(c => c.priority === filters.priority);
    }
    if (filters.type !== "all") {
      list = list.filter(c => c.caseType === filters.type);
    }
    if (filters.status !== "all") {
      list = list.filter(c => {
        const latest = latestResultMap[c.id];
        const status = latest?.resultStatus || "not-run";
        return status === filters.status;
      });
    }

    const getValue = (row) => {
      const latest = latestResultMap[row.id];
      switch (sortState.key) {
        case "caseId":
          return row.testCaseId || `TC-${row.id}`;
        case "title":
          return row.title || "";
        case "type":
          return row.caseType || "";
        case "modules":
          return (row.moduleNames?.length ? row.moduleNames : [row.relatedFeature].filter(Boolean)).join(", ");
        case "priority":
          return PRIORITY_WEIGHT[row.priority] || 0;
        case "status":
          return STATUS_WEIGHT[latest?.resultStatus || "not-run"] || 0;
        default:
          return "";
      }
    };

    list.sort((left, right) => {
      const a = getValue(left);
      const b = getValue(right);
      let result = 0;
      if (typeof a === "number" && typeof b === "number") {
        result = a - b;
      } else {
        result = String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: "base" });
      }
      return sortState.direction === "asc" ? result : -result;
    });
    return list;
  }, [visibleCases, latestResultMap, sortState, filters]);

  const toggleSort = (key) => {
    setSortState((current) =>
      current.key === key
        ? { key, direction: current.direction === "asc" ? "desc" : "asc" }
        : { key, direction: "asc" }
    );
  };

  const sortIcon = (key) => {
    if (sortState.key !== key) return <ArrowDownUp className="h-3.5 w-3.5 opacity-50" />;
    return sortState.direction === "asc" ? <ChevronUp className="h-3.5 w-3.5 text-[#4dabf7]" /> : <ChevronDown className="h-3.5 w-3.5 text-[#4dabf7]" />;
  };

  if (visibleCases.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
        <EmptyState
          icon={Play}
          title={t("empty.cases")}
          description={t("empty.casesDescription")}
          actionLabel={t("addCase")}
          onAction={() => {}} // Handled by App.jsx
        />
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 relative">
      <div className="absolute inset-0 overflow-auto custom-scrollbar">
        <table className="w-full text-[11px] border-collapse">
          <thead className="sticky top-0 bg-[#1e1e1e] z-10">
            <tr className="text-[#6f7680] border-b border-[#2d2d2d] text-left uppercase tracking-tighter">
              <th className="p-2 font-bold w-24">
                <button type="button" className="flex items-center gap-1" onClick={() => toggleSort("caseId")}>
                  {t("grid.cases.caseId")}
                  {sortIcon("caseId")}
                </button>
              </th>
              <th className="p-2 font-bold">
                <button type="button" className="flex items-center gap-1" onClick={() => toggleSort("title")}>
                  {t("grid.cases.title")}
                  {sortIcon("title")}
                </button>
              </th>
              <th className="p-2 font-bold w-28">
                <div className="flex flex-col gap-1">
                  <button type="button" className="flex items-center gap-1" onClick={() => toggleSort("type")}>
                    {t("grid.cases.type")}
                    {sortIcon("type")}
                  </button>
                  <select 
                    className="bg-[#1a1a1a] border border-[#303030] rounded px-1 py-0.5 text-[9px] text-[#858585] outline-none hover:border-[#4dabf7]"
                    value={filters.type}
                    onChange={(e) => setFilters(s => ({ ...s, type: e.target.value }))}
                  >
                    <option value="all">All Types</option>
                    <option value="functional">Functional</option>
                    <option value="ui">UI</option>
                    <option value="performance">Perf</option>
                    <option value="security">Sec</option>
                  </select>
                </div>
              </th>
              <th className="p-2 font-bold w-32">
                <button type="button" className="flex items-center gap-1" onClick={() => toggleSort("modules")}>
                  {t("grid.cases.modules")}
                  {sortIcon("modules")}
                </button>
              </th>
              <th className="p-2 font-bold w-24">
                <div className="flex flex-col gap-1">
                  <button type="button" className="flex items-center gap-1" onClick={() => toggleSort("priority")}>
                    {t("grid.cases.priority")}
                    {sortIcon("priority")}
                  </button>
                  <select 
                    className="bg-[#1a1a1a] border border-[#303030] rounded px-1 py-0.5 text-[9px] text-[#858585] outline-none hover:border-[#4dabf7]"
                    value={filters.priority}
                    onChange={(e) => setFilters(s => ({ ...s, priority: e.target.value }))}
                  >
                    <option value="all">All</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </th>
              <th className="p-2 font-bold w-32">
                <div className="flex flex-col gap-1">
                  <button type="button" className="flex items-center gap-1" onClick={() => toggleSort("status")}>
                    {t("grid.cases.status")}
                    {sortIcon("status")}
                  </button>
                  <select 
                    className="bg-[#1a1a1a] border border-[#303030] rounded px-1 py-0.5 text-[9px] text-[#858585] outline-none hover:border-[#4dabf7]"
                    value={filters.status}
                    onChange={(e) => setFilters(s => ({ ...s, status: e.target.value }))}
                  >
                    <option value="all">All Status</option>
                    <option value="pass">Pass</option>
                    <option value="fail">Fail</option>
                    <option value="blocked">Blocked</option>
                    <option value="not-run">Not Run</option>
                  </select>
                </div>
              </th>
              <th className="p-2 font-bold w-32 text-center">{t("grid.cases.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedCases.slice(0, 500).map((row) => {
              const latest = latestResultMap[row.id];
              const config = latest && getStatusConfig ? getStatusConfig(latest.resultStatus) : null;
              
              return (
                <tr key={row.id} className="border-b border-[#2d2d2d] transition-colors hover:bg-[#242424]">
                  <td 
                    className="p-2 font-mono text-[11px] text-[#4ec9b0] cursor-pointer hover:underline hover:text-[#4dabf7]"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigator.clipboard.writeText(row.testCaseId || `TC-${row.id}`);
                    }}
                    title={t("clickToCopy")}
                  >
                    {row.testCaseId || `TC-${row.id}`}
                  </td>
                  <td className="p-2 font-medium text-[#d4d4d4]">
                    <div className="flex flex-col">
                      <span>{row.title}</span>
                      {row.notes?.trim() && (
                        <span className="text-[9px] text-[#6f7680] mt-0.5 truncate" title={row.notes}>
                          {row.notes.length > 60 ? row.notes.substring(0, 57) + "..." : row.notes}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-2">
                    <Badge variant="outline" className="text-[10px] bg-[#2d2d2d]/30 border-[#333] uppercase">
                      {t(`caseType.${row.caseType}`, { defaultValue: row.caseType })}
                    </Badge>
                  </td>
                  <td className="p-2">
                    <div className="flex flex-wrap gap-1">
                      {(row.moduleNames?.length ? row.moduleNames : [row.relatedFeature].filter(Boolean)).map((name) => (
                        <span key={name} className="rounded border border-[#3a3a3a] bg-[#252525] px-1.5 py-0.5 text-[10px] text-[#c9ced6]">
                          {name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-2">
                    <div className="flex items-center gap-1.5 text-[#9da1a6]">
                      <span className={`h-1.5 w-1.5 rounded-full ${priorityDot[row.priority] || "bg-gray-400"}`} />
                      {t(`priority.${row.priority}`)}
                    </div>
                  </td>
                  <td className="p-2">
                    {config ? (
                      <div className="flex flex-col gap-0.5">
                        <span 
                          className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-tighter w-fit"
                          style={{ color: config.color, backgroundColor: config.bg, border: `1px solid ${config.border}` }}
                        >
                          {config.label}
                        </span>
                        <span className="text-[9px] text-[#6f7680]">
                          {(() => {
                            if (!latest.executedAt) return "";
                            const parts = latest.executedAt.split(" ");
                            const dateParts = parts[0].split("-");
                            const timeParts = parts[1] ? parts[1].split(":") : ["00","00"];
                            return `${dateParts[2]}-${dateParts[1]}-${dateParts[0]} ${timeParts[0]}:${timeParts[1]}`;
                          })()}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[#6f7680] italic opacity-50">{t("status.not-run")}</span>
                    )}
                  </td>
                  <td className="p-2">
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-8 w-8 border-[#214a67] bg-[#173245] text-[#69b8ff] hover:bg-[#1e425b]"
                        onClick={() => openRunTest(row)}
                        title={t("buttons.run")}
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-[#9da1a6] hover:bg-[#333]"
                        onClick={() => onLink(row.id)}
                        title={t("buttons.link")}
                      >
                        <Link2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-[#9da1a6] hover:bg-[#333]"
                        onClick={() => onEdit(row)}
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-[#9da1a6] hover:bg-[#382423] hover:text-[#f48771]"
                        onClick={() => onDelete(row.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
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
