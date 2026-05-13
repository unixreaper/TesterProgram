/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { 
  Plus, Search, LayoutDashboard, Settings2, FolderTree, PanelLeftOpen, PanelLeftClose, PanelRightOpen, PanelRightClose,
  RefreshCw, Languages, Home, ExternalLink, Layout, CheckCircle2, XCircle, AlertCircle, Clock, Target, ClipboardCheck, FlaskConical,
  FileSpreadsheet, Upload, Download, BarChart3, Keyboard
} from "lucide-react";

import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Card } from "./components/ui/card";
import { Badge } from "./components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";

import { ProjectSidebar } from "./components/ProjectSidebar";
import { TestCaseTable } from "./components/TestCaseTable";
import { TestResultsTable } from "./components/TestResultsTable";
import { StatsOverview } from "./components/StatsOverview";
import { ChecklistPanel } from "./components/ChecklistPanel";
import { AnalyticsView } from "./components/AnalyticsView";

import { ProjectModal } from "./components/modals/ProjectModal";
import { PlanModal } from "./components/modals/PlanModal";
import { CaseModal } from "./components/modals/CaseModal";
import { ConfirmModal } from "./components/modals/ConfirmModal";
import { ResultModal } from "./components/modals/ResultModal";
import { LinkModal } from "./components/modals/LinkModal";
import { ChecklistModal } from "./components/modals/ChecklistModal";
import { SettingsModal } from "./components/modals/SettingsModal";
import { CommandPalette } from "./components/CommandPalette";
import { Tooltip } from "./components/ui/tooltip";

import { useAppData } from "./hooks/useAppData";
import { useModals } from "./hooks/useModals";
import { useLayout } from "./hooks/useLayout";
import { useKeyboard, comboFromEvent } from "./hooks/useKeyboard";
import { useAppHandlers } from "./hooks/useAppHandlers";

const invoke = globalThis.__TAURI__?.core?.invoke;

function normalizeListText(value) {
  return String(value || "")
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean)
    .join("\n");
}

async function openExportPath(path) {
  if (!invoke) return;
  try {
    await invoke("open_path", { path });
  } catch (error) {
    console.error(error);
  }
}

async function onExportPowerBi() {
  if (!invoke) return;
  try {
    const path = await invoke("export_power_bi_dataset");
    await openExportPath(path);
  } catch (e) { 
    alert(`Export failed: ${e}`);
  }
}

function startWindowDrag(event) {
  if (event.button !== 0) return;
  const interactiveTarget = event.target.closest?.("button, a, input, textarea, select, [role='button'], [data-no-window-drag]");
  if (interactiveTarget) return;

  const windowApi = globalThis.__TAURI__?.window;
  const currentWindow = windowApi?.getCurrentWindow?.() ?? windowApi?.appWindow;
  if (currentWindow?.startDragging) {
    currentWindow.startDragging();
  } else {
    invoke?.("start_main_window_drag").catch(() => {});
  }
}

export default function App() {
  const { t, i18n } = useTranslation();

  // 1. Core Data State
  const {
    projects, setProjects,
    plans, setPlans,
    projectModules, setProjectModules,
    cases, setCases,
    checklists, setChecklists,
    testResults, setTestResults,
    environments, setEnvironments,
    devices, setDevices,
    idPattern, setIdPattern,
    loadAll,
    invoke
  } = useAppData();

  // 2. UI & Modal State
  const {
    openProjectModal, setOpenProjectModal,
    openPlanModal, setOpenPlanModal,
    openCaseModal, setOpenCaseModal,
    openResultModal, setOpenResultModal,
    openLinkModal, setOpenLinkModal,
    openChecklistModal, setOpenChecklistModal,
    openSettingsModal, setOpenSettingsModal,
    openCommandPalette, setOpenCommandPalette,
    exportStatus, setExportStatus,
    importStatus, setImportStatus,
    importDecision, setImportDecision,
    importErrors, setImportErrors,
    showImportErrors, setShowImportErrors,
    importInputRef,
    shortcuts, setShortcuts,
    shortcutDraft, setShortcutDraft,
    onSaveShortcuts,
    onResetShortcuts,
    projectMode, setProjectMode,
    projectForm, setProjectForm,
    planForm, setPlanForm,
    planMode, setPlanMode,
    caseForm, setCaseForm,
    resultForm, setResultForm,
    linkForm, setLinkForm,
    checklistForm, setChecklistForm,
    newEnv, setNewEnv,
    newDevice, setNewDevice,
    newModule, setNewModule,
    confirmData, setConfirmData,
    commandQuery, setCommandQuery
  } = useModals();

  // 3. Layout State
  const {
    showSidebar, setShowSidebar,
    showRightPanel, setShowRightPanel,
    sidebarWidth, setSidebarWidth,
    rightPanelWidth, setRightPanelWidth,
    isResizingSidebar, setIsResizingSidebar,
    isResizingRight, setIsResizingRight,
    viewMode, setViewMode,
    isResultsDetached, setIsResultsDetached,
    isChecklistDetached, setIsChecklistDetached,
    layoutMode, setLayoutMode
  } = useLayout();

  // 4. Selection State (Keep here for derived state logic)
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [expandedProjects, setExpandedProjects] = useState({});
  const [expandedPlans, setExpandedPlans] = useState({});
  const [caseQuery, setCaseQuery] = useState("");

  // 5. Handlers
  const {
    onSaveProject, onDeleteProject,
    onSavePlan, openCreatePlan, openEditPlan, onDeletePlan,
    openCreateCaseModal, onSaveCase,
    onDeleteResult, handleConfirmDelete, onEditResult, onSaveResult,
    applyCasePlanLink, toggleChecklist, onSaveChecklist, onEditChecklist, onDeleteChecklist,
    onAddEnv, onDeleteEnv, onAddDevice, onDeleteDevice,
    onAddModule, onDeleteModule, onUpdateModule, onSaveIdPattern,
    onExportExcel, onDownloadImportTemplate, onPickImportFile, onImportTemplateFile, runImport,
    onCleanupAttachments
  } = useAppHandlers({
    invoke, t, loadAll,
    projects, setProjects, plans, setPlans, cases, setCases, testResults, setTestResults, projectModules, idPattern,
    projectForm, setProjectForm, setOpenProjectModal, projectMode, setProjectMode,
    planForm, setPlanForm, setOpenPlanModal, setPlanMode,
    caseForm, setCaseForm, setOpenCaseModal,
    resultForm, setResultForm, setOpenResultModal,
    linkForm, setOpenLinkModal,
    checklistForm, setOpenChecklistModal,
    confirmData, setConfirmData,
    newEnv, setNewEnv,
    newDevice, setNewDevice,
    newModule, setNewModule,
    selectedProjectId, setSelectedProjectId,
    selectedPlanId, setSelectedPlanId,
    normalizeListText
  });

  // 6. Keyboard Shortcuts
  useKeyboard({ shortcuts, setOpenCommandPalette, setViewMode, loadAll, openCreateCaseModal });

  // 7. Data Sync & Listeners
  useEffect(() => {
    if (projects.length > 0 && selectedProjectId === null) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  useEffect(() => {
    if (plans.length > 0 && selectedPlanId === null && selectedProjectId !== null) {
      const firstPlan = plans.find(p => p.projectId === selectedProjectId);
      if (firstPlan) setSelectedPlanId(firstPlan.id);
    }
  }, [plans, selectedPlanId, selectedProjectId]);

  useEffect(() => {
    loadAll();
    let unlisten;
    const setupListener = async () => {
      if (globalThis.__TAURI__?.event) {
        unlisten = await globalThis.__TAURI__.event.listen("results-window-closed", () => setIsResultsDetached(false));
        const unlisten2 = await globalThis.__TAURI__.event.listen("checklist-window-closed", () => setIsChecklistDetached(false));
        return () => { if (unlisten) unlisten(); if (unlisten2) unlisten2(); };
      }
    };
    setupListener();
    const timer = setInterval(loadAll, 10000);
    return () => clearInterval(timer);
  }, [loadAll, setIsResultsDetached, setIsChecklistDetached]);

  // 8. Derived State
  const selectedProject = useMemo(() => (projects || []).find((p) => p.id === selectedProjectId), [projects, selectedProjectId]);
  const selectedPlan = useMemo(() => (plans || []).find((p) => p.id === selectedPlanId), [plans, selectedPlanId]);

  const visibleCases = useMemo(() => {
    let list = (cases || []);
    if (selectedPlanId) list = list.filter((c) => (c.linkedPlanIds || []).includes(selectedPlanId));
    if (caseQuery.trim()) {
      const q = caseQuery.toLowerCase();
      list = list.filter((c) => {
        const moduleText = (c.moduleNames || []).join(" ");
        return c.title.toLowerCase().includes(q) || c.testCaseId.toLowerCase().includes(q) || moduleText.toLowerCase().includes(q);
      });
    }
    return list;
  }, [cases, selectedPlanId, caseQuery]);

  const visibleResults = useMemo(() => {
    let list = [...(testResults || [])];
    if (selectedPlanId) list = list.filter((r) => String(r.planId) === String(selectedPlanId));
    return list.sort((a, b) => (b.executedAt || "").localeCompare(a.executedAt || ""));
  }, [testResults, selectedPlanId]);

  const latestResultMap = useMemo(() => {
    const map = {};
    const source = selectedPlanId ? (testResults || []).filter((result) => String(result.planId) === String(selectedPlanId)) : (testResults || []);
    source.forEach((r) => {
      if (!map[r.caseId] || (r.executedAt || "").localeCompare(map[r.caseId].executedAt || "") > 0) map[r.caseId] = r;
    });
    return map;
  }, [testResults, selectedPlanId]);

  const stats = useMemo(() => {
    const list = selectedPlanId ? (cases || []).filter(c => (c.linkedPlanIds || []).includes(selectedPlanId)) : (cases || []);
    const total = list.length;
    const passed = list.filter(c => c.status === "pass").length;
    const failed = list.filter(c => c.status === "fail").length;
    const blocked = list.filter(c => c.status === "blocked").length;
    const notRun = list.filter(c => c.status === "not-run").length;

    return [
      { key: "total", value: total, icon: Target, color: "#4dabf7" },
      { key: "passed", value: passed, icon: CheckCircle2, color: "#4ec9b0" },
      { key: "failed", value: failed, icon: XCircle, color: "#f48771" },
      { key: "blocked", value: blocked, icon: AlertCircle, color: "#cca700" },
      { key: "notRun", value: notRun, icon: Clock, color: "#6f7680" }
    ];
  }, [cases, selectedPlanId]);

  const selectedChecklist = useMemo(() => (checklists || []).filter((c) => c.planId === selectedPlanId), [checklists, selectedPlanId]);
  const completionPercent = useMemo(() => {
    if (selectedChecklist.length === 0) return 0;
    const done = selectedChecklist.filter(c => c.done).length;
    return Math.round((done / selectedChecklist.length) * 100);
  }, [selectedChecklist]);

  const linkedCaseCount = useMemo(() => {
    const map = {};
    (plans || []).forEach(p => { map[p.id] = (cases || []).filter(c => (c.linkedPlanIds || []).includes(p.id)).length; });
    return map;
  }, [plans, cases]);

  const filteredCommands = useMemo(() => {
    const cmds = [
      { id: "new-project", title: t("newProject"), icon: Plus, action: () => { setProjectMode("create"); setProjectForm({ id: null, name: "", description: "" }); setOpenProjectModal(true); } },
      { id: "new-plan", title: t("newPlan"), icon: Plus, action: () => openCreatePlan(selectedProjectId) },
      { id: "new-case", title: t("newCase"), icon: Plus, action: openCreateCaseModal },
      { id: "add-result", title: t("addResult"), icon: Plus, action: () => {
        setResultForm({ id: null, caseId: "", planId: String(selectedPlanId || ""), resultStatus: "pass", testedBy: "", environment: selectedPlan?.testEnvironment || "", testedDevice: "", actualResult: "", bugIdOrComments: "" });
        setOpenResultModal(true);
      } },
      { id: "shortcut-keys", title: t("shortcuts.pageTitle", { defaultValue: "Shortcut Keys" }), icon: Keyboard, action: () => setViewMode("shortcuts") },
    ];
    if (!commandQuery) return cmds;
    return cmds.filter(c => c.title.toLowerCase().includes(commandQuery.toLowerCase()));
  }, [commandQuery, selectedProjectId, t, selectedPlanId, selectedPlan?.testEnvironment, openCreateCaseModal, setProjectMode, setProjectForm, setOpenProjectModal, openCreatePlan, setResultForm, setOpenResultModal, setViewMode]);

  const openRunTest = (c) => {
    const existingResult = (testResults || []).filter((result) => String(result.caseId) === String(c.id) && String(result.planId || "") === String(selectedPlanId || "")).sort((a, b) => String(b.executedAt || "").localeCompare(String(a.executedAt || "")))[0];
    setResultForm(existingResult ? { id: existingResult.id, caseId: String(existingResult.caseId), planId: existingResult.planId ? String(existingResult.planId) : "", resultStatus: existingResult.resultStatus, testedBy: existingResult.testedBy || "", environment: existingResult.environment || selectedPlan?.testEnvironment || "", testedDevice: existingResult.testedDevice || "", actualResult: existingResult.actualResult || "", bugIdOrComments: existingResult.bugIdOrComments || "" } : { id: null, caseId: String(c.id), planId: String(selectedPlanId || ""), resultStatus: "pass", testedBy: "", environment: selectedPlan?.testEnvironment || "", testedDevice: "", actualResult: "", bugIdOrComments: "" });
    setOpenResultModal(true);
  };

  const openEditCase = (c) => {
    setCaseForm({ id: c.id, testCaseId: c.testCaseId, title: c.title, caseType: c.caseType, relatedFeature: c.relatedFeature, moduleIds: c.moduleIds || [], priority: c.priority, preconditions: c.preconditions, steps: c.steps, testData: c.testData, expectedResult: c.expectedResult, actualResult: c.actualResult, status: c.status, bugIdOrComments: c.bugIdOrComments, notes: c.notes || "", linkedPlanIds: c.linkedPlanIds || [] });
    setOpenCaseModal(true);
  };

  const onDeleteCase = (id) => {
    const testCase = cases.find((item) => item.id === id);
    setConfirmData({ open: true, id, kind: "case", label: testCase?.testCaseId || testCase?.title || "" });
  };

  const linkCurrentState = useMemo(() => {
    const tc = (cases || []).find((c) => c.id === Number(linkForm.caseId));
    return (tc?.linkedPlanIds || []).includes(Number(linkForm.planId)) || false;
  }, [cases, linkForm]);

  const canLinkCurrent = useMemo(() => linkForm.caseId && linkForm.planId, [linkForm]);

  function onCaptureShortcut(actionKey, event) {
    event.preventDefault();
    const combo = comboFromEvent(event);
    if (!combo) return;
    setShortcutDraft((prev) => ({ ...prev, [actionKey]: combo }));
  }

  const getStatusConfig = (s) => {
    switch (s) {
      case "pass": return { label: t("status.pass"), color: "#4ec9b0", bg: "#4ec9b015", border: "#4ec9b030" };
      case "fail": return { label: t("status.fail"), color: "#f48771", bg: "#f4877115", border: "#f4877130" };
      case "blocked": return { label: t("status.blocked"), color: "#cca700", bg: "#cca70015", border: "#cca70030" };
      default: return { label: t("status.not-run"), color: "#8a9199", bg: "#8a919915", border: "#8a919930" };
    }
  };

  const priorityDot = { high: "bg-[#f48771]", medium: "bg-[#cca700]", low: "bg-[#4ec9b0]" };

  // ─── Render helpers (plain functions, not components, to avoid remount) ───
  const renderMainTableCard = (className = "") => (
    <Card className={`min-h-0 flex flex-col overflow-hidden ${className}`}>
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#2d2d2d] shrink-0">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="w-4 h-4 text-[#4dabf7]" />
          <span className="text-sm font-semibold text-[#e0e0e0]">{t("testCases")}</span>
          <Badge variant="outline" className="text-[9px] px-1.5 py-0">{visibleCases.length}</Badge>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[#6f7680]" />
            <Input
              value={caseQuery}
              onChange={e => setCaseQuery(e.target.value)}
              placeholder={t("search")}
              className="h-6 pl-6 pr-2 text-[10px] w-32 bg-[#2d2d2d] border-[#3a3a3a]"
            />
          </div>
          <Button size="sm" className="h-6 px-2 text-[10px] gap-1" onClick={openCreateCaseModal}>
            <Plus className="w-3 h-3" />{t("addCase")}
          </Button>
        </div>
      </div>
      <TestCaseTable
        visibleCases={visibleCases}
        latestResultMap={latestResultMap}
        priorityDot={priorityDot}
        getStatusConfig={getStatusConfig}
        openRunTest={openRunTest}
        onLink={(caseId) => { setLinkForm({ caseId: String(caseId), planId: String(selectedPlanId || "") }); setOpenLinkModal(true); }}
        onEdit={openEditCase}
        onDelete={onDeleteCase}
        t={t}
      />
    </Card>
  );

  const renderResultsCard = (className = "") => (
    <Card className={`min-h-0 flex flex-col overflow-hidden ${className}`}>
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#2d2d2d] shrink-0">
        <div className="flex items-center gap-2">
          <FlaskConical className={`w-4 h-4 ${isResultsDetached ? "text-[#6f7680]" : "text-[#4ec9b0]"}`} />
          <span className={`text-sm font-semibold ${isResultsDetached ? "text-[#6f7680]" : "text-[#e0e0e0]"}`}>{t("testResults")}</span>
          {!isResultsDetached && <Badge variant="outline" className="text-[9px] px-1.5 py-0">{visibleResults.length}</Badge>}
        </div>
        <div className="flex items-center gap-1">
          {!isResultsDetached && (
            <>
              <Button size="sm" className="h-6 px-2 text-[10px] gap-1" onClick={() => setOpenResultModal(true)}>
                <Plus className="w-3 h-3" />{t("addResult")}
              </Button>
              <Button
                size="icon" variant="ghost"
                className="h-6 w-6 text-[#9da1a6] hover:text-[#4dabf7]"
                title={t("detachWindow")}
                onClick={async () => { if (invoke) { await invoke("open_results_window"); setIsResultsDetached(true); } }}
              >
                <ExternalLink className="w-3 h-3" />
              </Button>
            </>
          )}
          {isResultsDetached && (
            <>
              <ExternalLink className="w-3 h-3 text-[#4dabf7] opacity-60" />
              <Button
                size="icon" variant="ghost"
                className="h-6 w-6 text-[#f48771] hover:bg-[#f4877115]"
                title="Close detached window"
                onClick={async () => { if (invoke) { await invoke("close_window", { label: "results" }); setIsResultsDetached(false); } }}
              >
                <XCircle className="w-3 h-3" />
              </Button>
            </>
          )}
        </div>
      </div>

      {isResultsDetached ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center select-none">
          <div className="relative">
            <FlaskConical className="w-10 h-10 text-[#2d2d2d]" />
            <ExternalLink className="w-4 h-4 text-[#4dabf7] absolute -top-1 -right-1" />
          </div>
          <p className="text-[11px] text-[#4f5258] max-w-[140px] leading-relaxed">
            {t("detachedHint")}
          </p>
        </div>
      ) : (
        <TestResultsTable
          visibleResults={visibleResults}
          cases={cases}
          plans={plans}
          getStatusConfig={getStatusConfig}
          setOpenResultModal={setOpenResultModal}
          onEditResult={onEditResult}
          onDeleteResult={onDeleteResult}
          t={t}
        />
      )}
    </Card>
  );

  const renderChecklistCard = (className = "") => (
    <div className={`min-h-0 flex flex-col ${className}`}>
      <ChecklistPanel
        selectedPlan={selectedPlan}
        selectedChecklist={selectedChecklist}
        completionPercent={completionPercent}
        toggleChecklist={(item) => toggleChecklist(item.id, !item.done)}
        onEditChecklist={onEditChecklist}
        onDeleteChecklist={onDeleteChecklist}
        onAddClick={() => { setChecklistForm({ planId: selectedPlanId, title: "" }); setOpenChecklistModal(true); }}
        onDetach={isChecklistDetached ? null : async () => {
          if (invoke) {
            await invoke("open_checklist_window");
            setIsChecklistDetached(true);
          }
        }}
        onDestroy={isChecklistDetached ? async () => {
          if (invoke) {
            await invoke("close_window", { label: "checklist" });
            setIsChecklistDetached(false);
          }
        } : null}
        isDetached={isChecklistDetached}
        t={t}
      />
    </div>
  );

  const renderShortcutsPage = () => (
    <Card className="min-h-0 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#2d2d2d] shrink-0">
        <div className="flex items-center gap-2">
          <Keyboard className="w-4 h-4 text-[#4dabf7]" />
          <span className="text-sm font-semibold text-[#e0e0e0]">{t("shortcuts.pageTitle", { defaultValue: "Shortcut Keys / ปุ่มลัด" })}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" className="h-7 px-2 text-[11px]" onClick={onResetShortcuts}>
            Reset
          </Button>
          <Button size="sm" className="h-7 px-2 text-[11px]" onClick={onSaveShortcuts}>
            Save
          </Button>
        </div>
      </div>
      <div className="p-3 overflow-y-auto">
        <div className="text-[11px] text-[#9da1a6] mb-3">
          {t("shortcuts.hintBoth", { defaultValue: "Click input แล้วกดคีย์ลัดที่ต้องการ / Click an input then press shortcut (e.g. Meta+K)" })}
        </div>
        <div className="space-y-2">
          {SHORTCUT_DEFS.map((item) => (
            <div key={item.key} className="grid grid-cols-[1fr_220px] gap-3 items-center">
              <div className="text-xs text-[#d4d4d4]">
                {t(item.i18nKey, { defaultValue: item.i18nKey })}
              </div>
              <Input
                value={shortcutDraft[item.key] || ""}
                onKeyDown={(event) => onCaptureShortcut(item.key, event)}
                onChange={() => {}}
                className="h-8 text-xs bg-[#171717] border-[#303030]"
              />
            </div>
          ))}
        </div>
      </div>
    </Card>
  );

  return (
    <div className="h-screen flex bg-[#1e1e1e] text-[#d4d4d4] flex-col">
      <div className="flex-1 flex min-h-0">
        {/* DEBUG */}
        <div className="fixed bottom-2 right-2 text-[9px] text-white/20 pointer-events-none z-[100]">
          Projects: {projects?.length} | Plans: {plans?.length} | Cases: {cases?.length} | Tauri: {globalThis.__TAURI__ ? "Yes" : "No"}
        </div>
        {/* Activity Bar */}
        <aside className="w-12 bg-[#333] border-r border-[#2a2a2a] flex flex-col items-center gap-2 py-2 shrink-0">
          <Tooltip content={t("commands.openDashboard")}>
            <button
              type="button"
              className={`w-8 h-8 rounded-md grid place-items-center cursor-pointer transition-colors ${viewMode === "dashboard" ? "bg-[#0e639c55] border border-[#0e639c] text-white" : "hover:bg-[#2a2d2e] text-[#9da1a6]"}`}
              onClick={() => setViewMode("dashboard")}
              aria-label={t("commands.openDashboard")}
            >
              <FolderTree className="w-4 h-4" />
            </button>
          </Tooltip>

          <Tooltip content={t("commands.openAnalytics")}>
            <button
              type="button"
              className={`w-8 h-8 rounded-md grid place-items-center cursor-pointer transition-colors ${viewMode === "analytics" ? "bg-[#0e639c55] border border-[#0e639c] text-white" : "hover:bg-[#2a2d2e] text-[#9da1a6]"}`}
              onClick={() => setViewMode("analytics")}
              aria-label={t("commands.openAnalytics")}
            >
              <BarChart3 className="w-4 h-4" />
            </button>
          </Tooltip>

          <Tooltip content={t("shortcuts.pageTitle")}>
            <button
              type="button"
              className={`w-8 h-8 rounded-md grid place-items-center cursor-pointer transition-colors ${viewMode === "shortcuts" ? "bg-[#0e639c55] border border-[#0e639c] text-white" : "hover:bg-[#2a2d2e] text-[#9da1a6]"}`}
              onClick={() => setViewMode("shortcuts")}
              aria-label={t("shortcuts.pageTitle")}
            >
              <Keyboard className="w-4 h-4" />
            </button>
          </Tooltip>

          <div className="h-px w-6 bg-[#333] my-1" />
          
          <Tooltip content={t("commands.title")}>
            <button
              type="button"
              className="w-8 h-8 rounded-md hover:bg-[#2a2d2e] grid place-items-center text-[#9da1a6] cursor-pointer bg-transparent border-none p-0 focus:outline-none focus:ring-1 focus:ring-[#0e639c]"
              onClick={() => setOpenCommandPalette(true)}
              aria-label={t("commands.title")}
            >
              <Search className="w-4 h-4" />
            </button>
          </Tooltip>
        </aside>

      {showSidebar && (
        <ProjectSidebar
          width={sidebarWidth}
          onResizeStart={() => setIsResizingSidebar(true)}
          projects={projects}
          plans={plans}
          cases={cases}
          testResults={testResults}
          selectedProjectId={selectedProjectId}
          selectedPlanId={selectedPlanId}
          expandedProjects={expandedProjects}
          expandedPlans={expandedPlans}
          setExpandedProjects={setExpandedProjects}
          setExpandedPlans={setExpandedPlans}
          setSelectedProjectId={setSelectedProjectId}
          setSelectedPlanId={setSelectedPlanId}
          openCreateProject={() => { setProjectMode("create"); setProjectForm({ id: null, name: "", description: "" }); setOpenProjectModal(true); }}
          openEditProject={(p) => { setProjectMode("edit"); setProjectForm(p); setOpenProjectModal(true); }}
          onDeleteProject={onDeleteProject}
          openCreatePlan={openCreatePlan}
          openEditPlan={openEditPlan}
          onDeletePlan={onDeletePlan}
          linkedCaseCount={linkedCaseCount}
          t={t}
        />
      )}

      <main className="flex-1 min-w-0 min-h-0 flex flex-col bg-[#1f1f1f]">
        {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
        <div
          data-tauri-drag-region
          onMouseDown={startWindowDrag}
          className="h-10 border-b border-[#343434] bg-[#181818] flex items-center justify-between px-3 shrink-0 select-none cursor-default"
        >
          <div data-tauri-drag-region className="flex items-center gap-2 min-w-0">
            <Button size="icon" variant="ghost" className="h-7 w-7 text-[#9da1a6]" onClick={() => setShowSidebar(!showSidebar)}>
              {showSidebar ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
            </Button>
            <div data-tauri-drag-region className="flex items-center gap-1.5 text-[11px] font-medium text-[#9da1a6] truncate">
              <Home className="w-3 h-3" />
              <span>/</span>
              <span>{t("workspace")}</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button size="icon" variant="ghost" className="h-7 w-7 text-[#9da1a6]" onClick={loadAll} title={t("reload")}><RefreshCw className="w-3.5 h-3.5" /></Button>
            <Button size="icon" variant="ghost" className="h-7 w-7 text-[#9da1a6]" onClick={onExportExcel} title={t("buttons.exportExcel")}>
              <FileSpreadsheet className="w-3.5 h-3.5" />
            </Button>
            <Button size="icon" variant="ghost" className="h-7 w-7 text-[#9da1a6]" onClick={onDownloadImportTemplate} title={t("buttons.downloadTemplate", { defaultValue: "Download Template" })}>
              <Download className="w-3.5 h-3.5" />
            </Button>
            <Button size="icon" variant="ghost" className="h-7 w-7 text-[#9da1a6]" onClick={onPickImportFile} title={t("buttons.importTemplate", { defaultValue: "Import Template" })}>
              <Upload className="w-3.5 h-3.5" />
            </Button>
            <div className="flex bg-[#2d2d2d] rounded-md p-0.5 mx-1">
              {[
                { id: "classic",    icon: PanelRightOpen,  label: "Classic" },
                { id: "horizontal", icon: Layout,           label: "Horizontal" },
                { id: "full",       icon: LayoutDashboard,  label: "Full" },
                { id: "zen",        icon: ClipboardCheck,   label: "Zen" }
              ].map(mode => (
                <Button
                  key={mode.id}
                  variant="ghost"
                  size="icon"
                  className={`h-6 w-6 rounded-sm transition-all ${layoutMode === mode.id ? "bg-[#0e639c] text-white shadow-lg" : "text-[#9da1a6] hover:text-white"}`}
                  onClick={() => setLayoutMode(mode.id)}
                  title={mode.label}
                >
                  <mode.icon className="w-3.5 h-3.5" />
                </Button>
              ))}
            </div>

            {layoutMode === "classic" && (
              <Button
                size="icon"
                variant="ghost"
                className={`h-7 w-7 transition-colors ${showRightPanel ? "text-[#4dabf7]" : "text-[#9da1a6]"}`}
                onClick={() => setShowRightPanel(!showRightPanel)}
                title={t("commands.toggleRightPanel")}
              >
                {showRightPanel ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
              </Button>
            )}

            <div className="h-4 w-px bg-[#343434] mx-1" />
            <Button size="sm" variant="ghost" className="h-7 px-2 gap-1.5 text-[#9da1a6]" onClick={() => i18n.changeLanguage(i18n.language === "en" ? "th" : "en")}>
              <Languages className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold uppercase">{i18n.language}</span>
            </Button>
            <Button size="icon" variant="ghost" className="h-7 w-7 text-[#9da1a6]" onClick={() => setOpenSettingsModal(true)}><Settings2 className="w-3.5 h-3.5" /></Button>
          </div>
        </div>

        <div className="p-2 flex-1 min-h-0 flex flex-col gap-2 overflow-hidden">
          {exportStatus && (
            <div className="shrink-0 rounded-md border border-[#2f6f63] bg-[#1e3b36] px-3 py-1.5 text-[11px] text-[#9be2d3] flex items-center justify-between gap-2">
              <div className="truncate">
                {t("messages.exportSaved")}: {exportStatus}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 text-[#9be2d3] hover:text-white"
                  onClick={() => openExportPath(exportStatus)}
                  title={t("buttons.openFile", { defaultValue: "Open file / เปิดไฟล์" })}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 text-[#9be2d3] hover:text-white"
                  onClick={() => setExportStatus("")}
                  title={t("buttons.close", { defaultValue: "Close" })}
                >
                  <XCircle className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}
          {importStatus && (
            <div className="shrink-0 rounded-md border border-[#5f4e1d] bg-[#3d3212] px-3 py-1.5 text-[11px] text-[#f5de8f]">
              {t("messages.importStatus", { defaultValue: "Import status" })}: {importStatus}
            </div>
          )}
          {importErrors.length > 0 && (
            <div className="shrink-0 rounded-md border border-[#5a2a2a] bg-[#341b1b] px-3 py-2 text-[11px] text-[#ffb4b4]">
              <div className="flex items-center justify-between gap-2">
                <span>
                  {t("messages.importErrorsFound", { defaultValue: "Import errors found" })}: {importErrors.length}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2 text-[11px] text-[#ffb4b4]"
                  onClick={() => setShowImportErrors((s) => !s)}
                >
                  {showImportErrors
                    ? t("buttons.collapseErrors", { defaultValue: "Collapse errors" })
                    : t("buttons.expandErrors", { defaultValue: "Expand errors" })}
                </Button>
              </div>
              {showImportErrors && (
                <div className="mt-2 max-h-44 overflow-y-auto rounded border border-[#6b2c2c] bg-[#2a1414]">
                  {importErrors.map((item, index) => (
                    <div key={`${item.rowNumber}-${index}`} className="border-b border-[#4a2323] px-2 py-1.5 last:border-b-0">
                      Row {item.rowNumber}: {item.reason}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {(() => {
            if (viewMode === "analytics") {
              return (
                <AnalyticsView
                  cases={cases}
                  plans={plans}
                  projects={projects}
                  results={testResults}
                  selectedProjectId={selectedProjectId}
                  selectedPlanId={selectedPlanId}
                  selectedProject={selectedProject}
                  selectedPlan={selectedPlan}
                  onScopeChange={(projId, planId) => {
                    setSelectedProjectId(projId ? Number(projId) : null);
                    setSelectedPlanId(planId ? Number(planId) : null);
                  }}
                  onExportPowerBi={onExportPowerBi}
                  t={t}
                />
              );
            }
            if (viewMode === "shortcuts") {
              return renderShortcutsPage();
            }
            
            // Default "dashboard" view
            return (
              <>
                <StatsOverview stats={stats} t={t} />

                <div className="flex-1 min-h-0 relative">
                  <AnimatePresence mode="wait">
                    <motion.div 
                      key={layoutMode}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="h-full w-full flex flex-col gap-2"
                    >
                      {layoutMode === "classic" && (
                        <div className="grid flex-1 min-h-0 gap-2" style={{ gridTemplateColumns: showRightPanel ? `1fr ${rightPanelWidth}px` : "1fr" }}>
                          {renderMainTableCard()}
                          {showRightPanel && (
                            <div className="flex flex-col gap-2 min-h-0 relative">
                              {renderResultsCard("flex-[3]" )}
                              {renderChecklistCard("flex-[2]")}
                            </div>
                          )}
                        </div>
                      )}

                      {layoutMode === "horizontal" && (
                        <div className="flex flex-col gap-2 flex-1 min-h-0">
                          {renderMainTableCard("flex-[2]")}
                          <div className="flex-1 flex gap-2 min-h-0">
                            {renderResultsCard("flex-1")}
                            {renderChecklistCard("flex-1")}
                          </div>
                        </div>
                      )}

                      {layoutMode === "full" && (
                        <div className="flex gap-2 flex-1 min-h-0">
                          {renderResultsCard("flex-1")}
                          {renderMainTableCard("flex-[2]")}
                          {renderChecklistCard("flex-1")}
                        </div>
                      )}

                      {layoutMode === "zen" && (
                        <div className="flex-1 min-h-0 flex flex-col">
                          {renderMainTableCard("flex-1")}
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </>
            );
          })()}
        </div>
      </main>

      {/* Modals */}
      <ProjectModal open={openProjectModal} onOpenChange={setOpenProjectModal} mode={projectMode} form={projectForm} setForm={setProjectForm} onSubmit={onSaveProject} t={t} />
      <PlanModal
        open={openPlanModal}
        onOpenChange={setOpenPlanModal}
        mode={planMode}
        form={planForm}
        setForm={setPlanForm}
        projects={projects}
        environments={environments}
        onSubmit={onSavePlan}
        onManageSettings={() => setOpenSettingsModal(true)}
        t={t}
      />
      <CaseModal
        open={openCaseModal}
        onOpenChange={setOpenCaseModal}
        form={caseForm}
        setForm={setCaseForm}
        modules={projectModules.filter((module) => module.projectId === selectedProjectId)}
        onSubmit={onSaveCase}
        t={t}
      />
      <ResultModal open={openResultModal} onOpenChange={setOpenResultModal} form={resultForm} setForm={setResultForm} cases={cases} plans={plans} environments={environments} devices={devices} onSubmit={onSaveResult} t={t} />
      <ConfirmModal 
        open={confirmData.open} 
        onOpenChange={(open) => setConfirmData(s => ({ ...s, open }))} 
        title={confirmData.kind === "case" ? t("modals.confirmDeleteCase") : t("modals.confirmDeleteResult")} 
        description={
          confirmData.kind === "case"
            ? t("modals.deleteCaseDescription", {
                defaultValue: "This test case and its linked results will be permanently removed" + (confirmData.label ? `: ${confirmData.label}.` : ".")
              })
            : t("modals.deleteResultDescription", {
                defaultValue: "This test result will be permanently removed" + (confirmData.label ? `: ${confirmData.label}.` : ".")
              })
        }
        onConfirm={handleConfirmDelete}
        confirmText={t("buttons.delete")}
        t={t}
      />
      <ConfirmModal
        open={importDecision.open}
        onOpenChange={(open) => setImportDecision((state) => ({ ...state, open }))}
        title={t("modals.importDecisionTitle", { defaultValue: "Import has invalid rows" })}
        description={t("modals.importDecisionDescription", {
          defaultValue: `${importDecision.summary?.successRows || 0}/${importDecision.summary?.totalRows || 0} success. Some rows failed validation. Skip failed rows and continue import?`
        })}
        onConfirm={async () => {
          try {
            await runImport(importDecision.fileBytes, true);
          } catch (e) {
            console.error(e);
          }
        }}
        confirmText={t("buttons.skipAndContinue", { defaultValue: "Skip & Continue" })}
        variant="default"
        t={t}
      />
      <LinkModal open={openLinkModal} onOpenChange={setOpenLinkModal} form={linkForm} setForm={setLinkForm} plans={plans} canLinkCurrent={canLinkCurrent} linkCurrentState={linkCurrentState} onApplyLink={applyCasePlanLink} t={t} />
      <ChecklistModal open={openChecklistModal} onOpenChange={setOpenChecklistModal} form={checklistForm} setForm={setChecklistForm} t={t} onSubmit={onSaveChecklist} />
      <SettingsModal
        open={openSettingsModal}
        onOpenChange={setOpenSettingsModal}
        environments={environments}
        devices={devices}
        modules={projectModules.filter((module) => module.projectId === selectedProjectId)}
        selectedProject={selectedProject}
        newEnv={newEnv}
        setNewEnv={setNewEnv}
        newDevice={newDevice}
        setNewDevice={setNewDevice}
        newModule={newModule}
        setNewModule={setNewModule}
        idPattern={idPattern}
        setIdPattern={setIdPattern}
        onAddEnv={onAddEnv}
        onDeleteEnv={onDeleteEnv}
        onAddDevice={onAddDevice}
        onDeleteDevice={onDeleteDevice}
        onAddModule={onAddModule}
        onUpdateModule={onUpdateModule}
        onDeleteModule={onDeleteModule}
        onSavePattern={onSaveIdPattern}
        onCleanupAttachments={onCleanupAttachments}
        t={t}
      />
      <CommandPalette open={openCommandPalette} onOpenChange={setOpenCommandPalette} query={commandQuery} setQuery={setCommandQuery} filteredCommands={filteredCommands} t={t} />
      <input ref={importInputRef} type="file" accept=".xlsx" className="hidden" onChange={onImportTemplateFile} />
    </div>
    </div>
  );
}
