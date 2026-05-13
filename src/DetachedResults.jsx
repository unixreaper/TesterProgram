/* eslint-disable react/prop-types */
import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { TestResultsTable } from "./components/TestResultsTable";
import { Card } from "./components/ui/card";
import { Search, RefreshCcw } from "lucide-react";
import { Input } from "./components/ui/input";
import { ResultModal } from "./components/modals/ResultModal";
import { ConfirmModal } from "./components/modals/ConfirmModal";
import "./index.css";
import "./i18n";

const invoke = globalThis.__TAURI__?.core?.invoke;
const listen = globalThis.__TAURI__?.event?.listen;

export default function DetachedResults() {
  const { t } = useTranslation();
  const [testResults, setTestResults] = useState([]);
  const [cases, setCases] = useState([]);
  const [plans, setPlans] = useState([]);
  const [environments, setEnvironments] = useState([]);
  const [devices, setDevices] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modals state
  const [openResultModal, setOpenResultModal] = useState(false);
  const [resultForm, setResultForm] = useState({ id: null, caseId: "", planId: "", resultStatus: "pass", testedBy: "", environment: "", testedDevice: "", actualResult: "", bugIdOrComments: "" });
  const [confirmData, setConfirmData] = useState({ open: false, id: null });

  const loadData = async () => {
    if (!invoke) return;
    try {
      const res = await invoke("load_dashboard_data");
      setTestResults(res.testResults || []);
      setCases(res.cases || []);
      setPlans(res.plans || []);
      setEnvironments(res.environments || []);
      setDevices(res.devices || []);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    let unlistenFn = null;
    if (listen) {
      listen("dashboard-updated", () => loadData()).then(fn => { unlistenFn = fn; });
    }
    return () => {
      clearInterval(interval);
      if (unlistenFn) unlistenFn();
    };
  }, []);

  const visibleResults = useMemo(() => {
    const list = [...(testResults || [])].sort((a, b) => (b.executedAt || "").localeCompare(a.executedAt || ""));
    if (!searchQuery) return list;
    return list.filter(r => {
      const c = cases.find(item => item.id === r.caseId);
      return c?.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
             c?.testCaseId?.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [testResults, searchQuery, cases]);

  const getStatusConfig = (s) => {
    switch (s) {
      case "pass": return { label: t("status.pass"), color: "#4ec9b0", bg: "#4ec9b015", border: "#4ec9b030" };
      case "fail": return { label: t("status.fail"), color: "#f48771", bg: "#f4877115", border: "#f4877130" };
      case "blocked": return { label: t("status.blocked"), color: "#cca700", bg: "#cca70015", border: "#cca70030" };
      default: return { label: t("status.not-run"), color: "#8a9199", bg: "#8a919915", border: "#8a919930" };
    }
  };

  function onEditResult(row) {
    setResultForm({
      id: row.id,
      caseId: String(row.caseId),
      planId: row.planId ? String(row.planId) : "",
      resultStatus: row.resultStatus,
      testedBy: row.testedBy || "",
      environment: row.environment || "",
      testedDevice: row.testedDevice || "",
      actualResult: row.actualResult || "",
      bugIdOrComments: row.bugIdOrComments || ""
    });
    setOpenResultModal(true);
  }

  async function onSaveResult() {
    if (!invoke) return;
    try {
      const payload = {
        caseId: Number(resultForm.caseId),
        planId: resultForm.planId ? Number(resultForm.planId) : null,
        resultStatus: resultForm.resultStatus,
        testedBy: resultForm.testedBy,
        environment: resultForm.environment,
        testedDevice: resultForm.testedDevice,
        actualResult: resultForm.actualResult,
        bugIdOrComments: resultForm.bugIdOrComments
      };
      if (resultForm.id) {
        await invoke("update_test_result", { id: resultForm.id, input: payload });
      } else {
        await invoke("create_test_result", { input: payload });
      }
      setOpenResultModal(false);
      loadData();
    } catch (e) { console.error(e); }
  }

  async function handleConfirmDelete() {
    if (!invoke || !confirmData.id) return;
    try {
      await invoke("delete_test_result", { id: confirmData.id });
      setConfirmData({ open: false, id: null });
      loadData();
    } catch (e) { console.error(e); }
  }

  return (
    <div className="h-screen bg-[#1a1a1a] flex flex-col p-4">
       <div className="h-6 shrink-0" data-tauri-drag-region />

       <div className="flex items-center justify-between mb-4 gap-4">
          <div className="flex items-center gap-2">
             <div className="w-8 h-8 rounded-lg bg-[#0e639c]/20 flex items-center justify-center">
                <RefreshCcw className="w-4 h-4 text-[#4dabf7]" />
             </div>
             <h1 className="text-lg font-bold text-white tracking-tight">Recent Test Results</h1>
          </div>
          <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-[#6f7680]" />
            <Input
              placeholder="Search results..."
              className="pl-9 h-9 bg-[#222] border-[#333] text-xs"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          </div>
       </div>

       <Card className="flex-1 min-h-0 bg-[#1e1e1e] border-[#333] overflow-hidden">
          <TestResultsTable
            visibleResults={visibleResults}
            cases={cases}
            plans={plans}
            getStatusConfig={getStatusConfig}
            onEditResult={onEditResult}
            onDeleteResult={(id) => setConfirmData({ open: true, id })}
            t={t}
          />
       </Card>
       
       <div className="mt-2 text-[9px] text-[#444] text-right uppercase tracking-widest">
         Auto-refreshing every 5s | Total Results: {testResults.length}
       </div>

       <ResultModal 
          open={openResultModal} 
          onOpenChange={setOpenResultModal} 
          form={resultForm} 
          setForm={setResultForm} 
          cases={cases} 
          plans={plans} 
          environments={environments} 
          devices={devices} 
          onSubmit={onSaveResult} 
          t={t} 
       />
       
       <ConfirmModal 
          open={confirmData.open} 
          onOpenChange={(open) => setConfirmData(s => ({ ...s, open }))} 
          title={t("modals.confirmDelete")} 
          description={t("modals.deleteDescription", { defaultValue: "This action cannot be undone. This result will be permanently removed from history." })}
          onConfirm={handleConfirmDelete}
          confirmText={t("buttons.delete")}
          t={t}
       />
    </div>
  );
}
