import { useState, useRef } from "react";

const SHORTCUT_STORAGE_KEY = "tester-desk-shortcuts";
const DEFAULT_SHORTCUTS = {
  openCommandPalette: "Meta+K",
  openDashboard: "Meta+1",
  openAnalytics: "Meta+2",
  openShortcuts: "Meta+3",
  reloadData: "Meta+R",
  newCase: "Meta+N"
};

function readSavedShortcuts() {
  try {
    const raw = globalThis.localStorage?.getItem(SHORTCUT_STORAGE_KEY);
    return raw ? { ...DEFAULT_SHORTCUTS, ...JSON.parse(raw) } : DEFAULT_SHORTCUTS;
  } catch {
    return DEFAULT_SHORTCUTS;
  }
}

export function useModals() {
  // Modal visibility
  const [openProjectModal, setOpenProjectModal] = useState(false);
  const [openPlanModal, setOpenPlanModal] = useState(false);
  const [openCaseModal, setOpenCaseModal] = useState(false);
  const [openResultModal, setOpenResultModal] = useState(false);
  const [openLinkModal, setOpenLinkModal] = useState(false);
  const [openChecklistModal, setOpenChecklistModal] = useState(false);
  const [openSettingsModal, setOpenSettingsModal] = useState(false);
  const [openCommandPalette, setOpenCommandPalette] = useState(false);

  // Export / Import
  const [exportStatus, setExportStatus] = useState("");
  const [importStatus, setImportStatus] = useState("");
  const [importDecision, setImportDecision] = useState({ open: false, fileBytes: null, summary: null });
  const [importErrors, setImportErrors] = useState([]);
  const [showImportErrors, setShowImportErrors] = useState(false);
  const importInputRef = useRef(null);

  // Shortcuts
  const [shortcuts, setShortcuts] = useState(readSavedShortcuts);
  const [shortcutDraft, setShortcutDraft] = useState(readSavedShortcuts);

  // Form States
  const [projectMode, setProjectMode] = useState("create");
  const [projectForm, setProjectForm] = useState({ id: null, name: "", description: "" });
  const [planForm, setPlanForm] = useState({ projectId: null, name: "", featureModule: "", testingGoal: "", scopeIn: "", scopeOut: "", testerName: "", startDate: "", endDate: "", testEnvironment: "", risksNotes: "" });
  const [planMode, setPlanMode] = useState("create");
  const [caseForm, setCaseForm] = useState({ id: null, testCaseId: "", title: "", caseType: "functional", relatedFeature: "", moduleIds: [], priority: "medium", preconditions: "", steps: "", testData: "", expectedResult: "", actualResult: "", status: "not-run", bugIdOrComments: "", notes: "", linkedPlanIds: [] });
  const [resultForm, setResultForm] = useState({ caseId: "", planId: "", resultStatus: "pass", testedBy: "", environment: "", testedDevice: "", actualResult: "", bugIdOrComments: "", attachments: [] });
  const [linkForm, setLinkForm] = useState({ caseId: "", planId: "" });
  const [checklistForm, setChecklistForm] = useState({ planId: null, title: "" });

  // Settings form
  const [newEnv, setNewEnv] = useState("");
  const [newDevice, setNewDevice] = useState("");
  const [newModule, setNewModule] = useState("");

  // Confirm dialog
  const [confirmData, setConfirmData] = useState({ open: false, id: null, kind: "result", label: "" });

  // Command query
  const [commandQuery, setCommandQuery] = useState("");

  function onSaveShortcuts() {
    setShortcuts(shortcutDraft);
    globalThis.localStorage?.setItem(SHORTCUT_STORAGE_KEY, JSON.stringify(shortcutDraft));
  }

  function onResetShortcuts() {
    setShortcutDraft(DEFAULT_SHORTCUTS);
    setShortcuts(DEFAULT_SHORTCUTS);
    globalThis.localStorage?.setItem(SHORTCUT_STORAGE_KEY, JSON.stringify(DEFAULT_SHORTCUTS));
  }

  return {
    // Modals
    openProjectModal, setOpenProjectModal,
    openPlanModal, setOpenPlanModal,
    openCaseModal, setOpenCaseModal,
    openResultModal, setOpenResultModal,
    openLinkModal, setOpenLinkModal,
    openChecklistModal, setOpenChecklistModal,
    openSettingsModal, setOpenSettingsModal,
    openCommandPalette, setOpenCommandPalette,

    // Export / Import
    exportStatus, setExportStatus,
    importStatus, setImportStatus,
    importDecision, setImportDecision,
    importErrors, setImportErrors,
    showImportErrors, setShowImportErrors,
    importInputRef,

    // Shortcuts
    shortcuts, setShortcuts,
    shortcutDraft, setShortcutDraft,
    onSaveShortcuts,
    onResetShortcuts,
    DEFAULT_SHORTCUTS,
    SHORTCUT_STORAGE_KEY,

    // Forms
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
  };
}
