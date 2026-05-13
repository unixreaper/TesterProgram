import { useCallback } from "react";

export function useAppHandlers({
  invoke,
  t,
  loadAll,
  // States & Setters from useAppData
  projects, setProjects,
  plans, setPlans,
  cases, setCases,
  testResults, setTestResults,
  projectModules,
  idPattern,
  // States & Setters from useModals
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
  // Translation
  normalizeListText
}) {

  const onSaveProject = async () => {
    if (!invoke) return;
    try {
      if (projectMode === "create") {
        await invoke("create_project", { input: { name: projectForm.name, description: projectForm.description } });
      } else {
        await invoke("update_project", { input: { id: projectForm.id, name: projectForm.name, description: projectForm.description } });
      }
      setOpenProjectModal(false);
      loadAll();
    } catch (e) { console.error(e); }
  };

  const onDeleteProject = async (id) => {
    if (!invoke || !globalThis.confirm(t("modals.confirmDelete"))) return;
    try {
      await invoke("delete_project", { projectId: id });
      if (selectedProjectId === id) {
        setSelectedProjectId(null);
        setSelectedPlanId(null);
      }
      loadAll();
    } catch (e) { console.error(e); }
  };

  const onSavePlan = async () => {
    if (!invoke) return;
    try {
      const payload = {
        projectId: Number(planForm.projectId),
        name: planForm.name,
        featureModule: planForm.featureModule || "",
        testingGoal: planForm.testingGoal,
        scopeIn: planForm.scopeIn,
        scopeOut: planForm.scopeOut,
        testerName: planForm.testerName,
        startDate: planForm.startDate,
        endDate: planForm.endDate,
        testEnvironment: planForm.testEnvironment,
        risksNotes: planForm.risksNotes
      };
      if (planForm.id) {
        await invoke("update_test_plan", { id: planForm.id, input: payload });
      } else {
        const newPlanId = await invoke("create_test_plan", { input: payload });
        setSelectedProjectId(Number(planForm.projectId));
        setSelectedPlanId(Number(newPlanId));
      }
      setOpenPlanModal(false);
      loadAll();
    } catch (e) { console.error(e); }
  };

  const openCreatePlan = (projectId = selectedProjectId) => {
    setPlanMode("create");
    setPlanForm({
      id: null,
      projectId,
      name: "",
      featureModule: "",
      testingGoal: "",
      scopeIn: "",
      scopeOut: "",
      testerName: "",
      startDate: "",
      endDate: "",
      testEnvironment: "",
      risksNotes: ""
    });
    setOpenPlanModal(true);
  };

  const openEditPlan = (plan) => {
    setPlanMode("edit");
    setPlanForm({
      id: plan.id,
      projectId: plan.projectId,
      name: plan.name,
      featureModule: plan.featureModule,
      testingGoal: plan.testingGoal,
      scopeIn: plan.scopeIn,
      scopeOut: plan.scopeOut,
      testerName: plan.testerName,
      startDate: plan.startDate,
      endDate: plan.endDate,
      testEnvironment: plan.testEnvironment,
      risksNotes: plan.risksNotes
    });
    setOpenPlanModal(true);
  };

  const onDeletePlan = async (id) => {
    if (!invoke || !globalThis.confirm(t("modals.confirmDelete"))) return;
    try {
      await invoke("delete_test_plan", { id });
      if (selectedPlanId === id) {
        const plan = plans.find((item) => item.id === id);
        const nextPlan = plans.find((item) => item.projectId === plan?.projectId && item.id !== id);
        setSelectedPlanId(nextPlan?.id || null);
      }
      loadAll();
    } catch (e) { console.error(e); }
  };

  const openCreateCaseModal = useCallback(async () => {
    if (!invoke) return;
    try {
      const nextId = await invoke("reserve_next_test_case_id");
      setCaseForm({ 
        id: null, testCaseId: nextId, title: "", caseType: "functional", 
        relatedFeature: "", moduleIds: [], priority: "medium", preconditions: "", 
        steps: "", testData: "", expectedResult: "", actualResult: "", 
        status: "not-run", bugIdOrComments: "", notes: "", 
        linkedPlanIds: selectedPlanId ? [selectedPlanId] : [] 
      });
      setOpenCaseModal(true);
    } catch (e) { console.error(e); }
  }, [invoke, selectedPlanId, setCaseForm, setOpenCaseModal]);

  const onSaveCase = async () => {
    if (!invoke) return;
    try {
      const payload = {
        testCaseId: caseForm.testCaseId,
        title: caseForm.title,
        caseType: caseForm.caseType,
        relatedFeature: (caseForm.moduleIds || [])
          .map((id) => projectModules.find((module) => module.id === id)?.name)
          .filter(Boolean)
          .join(", "),
        moduleIds: caseForm.moduleIds || [],
        priority: caseForm.priority,
        preconditions: normalizeListText(caseForm.preconditions),
        steps: normalizeListText(caseForm.steps),
        testData: normalizeListText(caseForm.testData),
        expectedResult: normalizeListText(caseForm.expectedResult),
        actualResult: caseForm.actualResult,
        status: caseForm.status,
        bugIdOrComments: caseForm.bugIdOrComments,
        notes: caseForm.notes || "",
        linkedPlanIds: caseForm.linkedPlanIds
      };
      if (caseForm.id) {
        await invoke("update_test_case", { id: caseForm.id, input: payload });
      } else {
        await invoke("create_test_case", { input: payload });
      }
      setOpenCaseModal(false);
      loadAll();
    } catch (e) { console.error(e); }
  };

  const onDeleteResult = async (id) => {
    const result = testResults.find((item) => item.id === id);
    const testCase = cases.find((item) => item.id === result?.caseId);
    setConfirmData({
      open: true,
      id,
      kind: "result",
      label: testCase?.testCaseId || testCase?.title || ""
    });
  };

  const handleConfirmDelete = async () => {
    if (!invoke || !confirmData.id) return;
    try {
      if (confirmData.kind === "case") {
        await invoke("delete_test_case", { id: confirmData.id });
      } else {
        await invoke("delete_test_result", { id: confirmData.id });
      }
      setConfirmData({ open: false, id: null, kind: "result", label: "" });
      loadAll();
    } catch (e) { console.error(e); }
  };

  const onEditResult = (row) => {
    setResultForm({
      id: row.id,
      caseId: String(row.caseId),
      planId: row.planId ? String(row.planId) : "",
      resultStatus: row.resultStatus,
      testedBy: row.testedBy || "",
      environment: row.environment || "",
      testedDevice: row.testedDevice || "",
      actualResult: row.actualResult || "",
      bugIdOrComments: row.bugIdOrComments || "",
      attachments: row.attachments || []
    });
    setOpenResultModal(true);
  };

  const onSaveResult = async () => {
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
        bugIdOrComments: resultForm.bugIdOrComments,
        attachments: resultForm.attachments || []
      };
      
      if (resultForm.id) {
        await invoke("update_test_result", { id: resultForm.id, input: payload });
      } else {
        await invoke("create_test_result", { input: payload });
      }
      
      setOpenResultModal(false);
      loadAll();
    } catch (e) { console.error(e); }
  };

  const applyCasePlanLink = async (linkCurrentState) => {
    if (!invoke || !linkForm.caseId || !linkForm.planId) return;
    try {
      await invoke("set_case_plan_link", {
        caseId: Number(linkForm.caseId),
        planId: Number(linkForm.planId),
        linked: !linkCurrentState
      });
      loadAll();
    } catch (e) { console.error(e); }
  };

  const toggleChecklist = async (id, done) => {
    if (!invoke) return;
    try {
      await invoke("set_checklist_done", { checklistId: id, done });
      loadAll();
    } catch (e) { console.error(e); }
  };

  const onSaveChecklist = async () => {
    if (!invoke) return;
    try {
      await invoke("create_checklist_item", { planId: Number(selectedPlanId), title: checklistForm.title });
      setOpenChecklistModal(false);
      loadAll();
    } catch (e) { console.error(e); }
  };

  const onEditChecklist = async (id, newTitle) => {
    if (!invoke) return;
    try {
      await invoke("update_checklist_item", { id, title: newTitle });
      loadAll();
    } catch (e) { console.error(e); }
  };

  const onDeleteChecklist = async (id) => {
    if (!invoke || !globalThis.confirm(t("modals.confirmDelete"))) return;
    try {
      await invoke("delete_checklist_item", { id });
      loadAll();
    } catch (e) { console.error(e); }
  };

  const onAddEnv = async () => {
    if (!invoke || !newEnv.trim()) return;
    try {
      await invoke("create_environment_option", { input: { name: newEnv } });
      setNewEnv("");
      loadAll();
    } catch (e) { console.error(e); }
  };

  const onDeleteEnv = async (id) => {
    if (!invoke) return;
    try {
      await invoke("delete_environment_option", { optionId: id });
      loadAll();
    } catch (e) { console.error(e); }
  };

  const onAddDevice = async () => {
    if (!invoke || !newDevice.trim()) return;
    try {
      await invoke("create_device_option", { input: { name: newDevice } });
      setNewDevice("");
      loadAll();
    } catch (e) { console.error(e); }
  };

  const onDeleteDevice = async (id) => {
    if (!invoke) return;
    try {
      await invoke("delete_device_option", { optionId: id });
      loadAll();
    } catch (e) { console.error(e); }
  };

  const onAddModule = async () => {
    if (!invoke || !selectedProjectId || !newModule.trim()) return;
    try {
      await invoke("create_project_module", {
        input: { projectId: selectedProjectId, name: newModule.trim(), description: "" }
      });
      setNewModule("");
      loadAll();
    } catch (e) { console.error(e); }
  };

  const onDeleteModule = async (id) => {
    if (!invoke) return;
    try {
      await invoke("delete_project_module", { id });
      loadAll();
    } catch (e) { console.error(e); }
  };

  const onUpdateModule = async (id, name) => {
    if (!invoke) return;
    try {
      await invoke("update_project_module", {
        input: { id, name, description: "" }
      });
      loadAll();
    } catch (e) { console.error(e); }
  };

  const onSaveIdPattern = async () => {
    if (!invoke) return;
    try {
      await invoke("update_test_case_id_settings", { input: idPattern });
      loadAll();
    } catch (e) { console.error(e); }
  };

  const onExportExcel = async () => {
    if (!invoke) return;
    try {
      const path = await invoke("export_excel_report");
      setExportStatus(path);
    } catch (e) { if (!String(e).toLowerCase().includes("cancelled")) console.error(e); }
  };

  const onDownloadImportTemplate = async () => {
    if (!invoke) return;
    try {
      const path = await invoke("download_import_template");
      setImportStatus(`Template saved: ${path}`);
    } catch (e) { if (!String(e).toLowerCase().includes("cancelled")) console.error(e); }
  };

  const onPickImportFile = () => { importInputRef.current?.click(); };

  const runImport = async (fileBytes, skipInvalid) => {
    if (!invoke || !fileBytes) return;
    const summary = await invoke("import_test_cases_from_template", { fileBytes, skipInvalid });
    setImportErrors(summary.failures || []);
    setShowImportErrors(Boolean(summary.failures?.length));
    if (summary.requiresDecision) {
      setImportDecision({ open: true, fileBytes, summary });
      setImportStatus(`${summary.successRows}/${summary.totalRows} success (${summary.failedRows} failed)`);
      return;
    }
    setImportDecision({ open: false, fileBytes: null, summary: null });
    setImportStatus(`${summary.successRows}/${summary.totalRows} success (${summary.failedRows} failed)`);
    await loadAll();
  };

  const onImportTemplateFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const arrayBuffer = await file.arrayBuffer();
      const fileBytes = Array.from(new Uint8Array(arrayBuffer));
      await runImport(fileBytes, false);
    } catch (e) { console.error(e); }
  };

  const onCleanupAttachments = async () => {
    if (!invoke) return;
    try {
      const count = await invoke("cleanup_orphaned_attachments");
      alert(t("messages.cleanupSuccess", { count, defaultValue: `Successfully cleaned up ${count} orphaned files.` }));
    } catch (e) {
      console.error(e);
      alert(`Cleanup failed: ${e}`);
    }
  };

  return {
    onSaveProject, onDeleteProject,
    onSavePlan, openCreatePlan, openEditPlan, onDeletePlan,
    openCreateCaseModal, onSaveCase,
    onDeleteResult, handleConfirmDelete, onEditResult, onSaveResult,
    applyCasePlanLink, toggleChecklist, onSaveChecklist, onEditChecklist, onDeleteChecklist,
    onAddEnv, onDeleteEnv, onAddDevice, onDeleteDevice,
    onAddModule, onDeleteModule, onUpdateModule, onSaveIdPattern,
    onExportExcel, onDownloadImportTemplate, onPickImportFile, onImportTemplateFile, runImport,
    onCleanupAttachments
  };
}
