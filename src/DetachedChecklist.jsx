/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { RefreshCw, ClipboardCheck } from "lucide-react";
import { ChecklistPanel } from "./components/ChecklistPanel";
import { ChecklistModal } from "./components/modals/ChecklistModal";
import { Card } from "./components/ui/card";
import "./index.css";
import "./i18n";

const invoke = globalThis.__TAURI__?.core?.invoke;

export default function DetachedChecklist() {
  const { t } = useTranslation();
  const [plans, setPlans] = useState([]);
  const [checklists, setChecklists] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [openChecklistModal, setOpenChecklistModal] = useState(false);
  const [checklistForm, setChecklistForm] = useState({ title: "", description: "", planId: "" });

  async function loadData() {
    if (!invoke) return;
    try {
      const res = await invoke("load_dashboard_data");
      setPlans(res.plans || []);
      setChecklists(res.checklists || []);
    } catch (e) { console.error(e); }
  }

  useEffect(() => {
    loadData();
    const timer = setInterval(loadData, 5000);
    return () => clearInterval(timer);
  }, []);

  const selectedPlan = plans.find(p => p.id === selectedPlanId) || plans[0];
  const planChecklists = checklists.filter(c => c.planId === (selectedPlan?.id || -1));
  const doneCount = planChecklists.filter(c => c.done).length;
  const completionPercent = planChecklists.length > 0 ? Math.round((doneCount / planChecklists.length) * 100) : 0;

  async function toggleChecklist(item) {
    if (!invoke) return;
    try {
      await invoke("set_checklist_done", { checklistId: item.id, done: !item.done });
      loadData();
    } catch (e) { console.error(e); }
  }

  async function onSaveChecklist() {
    if (!invoke) return;
    try {
      await invoke("create_checklist_item", {
        planId: selectedPlan?.id,
        title: checklistForm.title,
        description: checklistForm.description
      });
      setOpenChecklistModal(false);
      loadData();
    } catch (e) { console.error(e); }
  }

  return (
    <div className="h-screen w-screen bg-[#1e1e1e] text-[#d4d4d4] flex flex-col overflow-hidden p-2">
      {/* macOS Spacer */}
      <div className="h-6 shrink-0" data-tauri-drag-region />

      <div className="fixed bottom-2 right-2 text-[9px] text-white/20 pointer-events-none z-[100]">
        Plans: {plans.length} | Items: {checklists.length} | Tauri: {globalThis.__TAURI__ ? "Yes" : "No"}
      </div>

      <Card className="flex-1 min-h-0 flex flex-col relative overflow-hidden border-[#333] shadow-2xl">
        <div className="p-3 border-b border-[#343434] bg-[#1a1a1a]/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="w-4 h-4 text-[#4dabf7]" />
            <div className="text-xs uppercase tracking-wider text-[#9da1a6] font-bold">
              {t("checklist")}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button size="icon" variant="ghost" className="h-7 w-7 text-[#9da1a6]" onClick={loadData}>
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden p-2 flex flex-col">
          {plans.length > 1 && (
            <div className="mb-2 flex gap-1 overflow-x-auto pb-1 shrink-0 custom-scrollbar">
              {plans.map(p => (
                <button 
                  key={p.id}
                  onClick={() => setSelectedPlanId(p.id)}
                  className={`px-2 py-1 rounded text-[10px] whitespace-nowrap transition-colors ${ (selectedPlanId === p.id || (!selectedPlanId && p === plans[0])) ? "bg-[#0e639c] text-white" : "bg-[#2d2d2d] text-[#9da1a6] hover:bg-[#333]"}`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          )}

          <div className="flex-1 min-h-0">
            <ChecklistPanel
              selectedPlan={selectedPlan}
              selectedChecklist={planChecklists}
              completionPercent={() => completionPercent}
              setOpenChecklistModal={setOpenChecklistModal}
              toggleChecklist={toggleChecklist}
              t={t}
            />
          </div>
        </div>
      </Card>

      <ChecklistModal 
        open={openChecklistModal} 
        onOpenChange={setOpenChecklistModal} 
        form={checklistForm} 
        setForm={setChecklistForm} 
        t={t} 
        onSubmit={onSaveChecklist} 
      />
    </div>
  );
}

function Button({ children, className, variant = "primary", size = "sm", ...props }) {
  const variants = {
    primary: "bg-[#0e639c] text-white hover:bg-[#1177bb]",
    ghost: "bg-transparent hover:bg-[#ffffff11]",
    outline: "border border-[#343434] hover:bg-[#ffffff08]"
  };
  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    icon: "p-1.5"
  };
  return (
    <button className={`rounded font-medium transition-colors disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  );
}
