/* eslint-disable react/prop-types */
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  CheckCircle2, XCircle, AlertTriangle, RotateCcw,
  Paperclip, User, Monitor, Globe, FileText, Bug, Clock,
  FolderOpen, Download, Eye
} from "lucide-react";
import { Card } from "./components/ui/card";
import { Button } from "./components/ui/button";
import "./index.css";
import "./i18n";

const invoke = globalThis.__TAURI__?.core?.invoke;

const STATUS_META = {
  pass:    { icon: CheckCircle2,  color: "#4ec9b0", bg: "#4ec9b018", label: "Pass" },
  fail:    { icon: XCircle,       color: "#f48771", bg: "#f4877118", label: "Fail" },
  blocked: { icon: AlertTriangle, color: "#cca700", bg: "#cca70018", label: "Blocked" },
  retest:  { icon: RotateCcw,     color: "#9cdcfe", bg: "#9cdcfe18", label: "Retest" },
};

const IMAGE_EXTS = new Set(["png", "jpg", "jpeg", "gif", "webp", "bmp"]);

function InfoRow({ icon: Icon, label, value, className = "" }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-[#2a2a2a] last:border-b-0">
      <div className="w-5 h-5 shrink-0 flex items-center justify-center mt-0.5">
        <Icon className="w-3.5 h-3.5 text-[#6f7680]" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[9px] uppercase tracking-wider text-[#555] mb-0.5">{label}</div>
        <div className={`text-[11px] text-[#d4d4d4] whitespace-pre-wrap break-words ${className}`}>{value}</div>
      </div>
    </div>
  );
}

function ImagePreview({ loadingPreview, preview, displayName, showFullPreview, setShowFullPreview }) {
  if (loadingPreview) {
    return (
      <div className="h-36 flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-[#4dabf7] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (preview) {
    return (
      <>
        <button
          type="button"
          className="w-full bg-transparent border-0 p-0 cursor-pointer"
          onClick={() => setShowFullPreview(!showFullPreview)}
        >
          <img src={preview} alt={displayName} className="w-full max-h-52 object-contain" />
        </button>
        {showFullPreview && (
          <button
            type="button"
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-8 cursor-pointer border-0"
            onClick={() => setShowFullPreview(false)}
          >
            <img src={preview} alt={displayName} className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" />
          </button>
        )}
      </>
    );
  }
  return (
    <div className="h-36 flex items-center justify-center text-[#555] text-[10px]">
      Preview unavailable
    </div>
  );
}

function AttachmentCard({ fileName, index, t }) {
  const [preview, setPreview] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [showFullPreview, setShowFullPreview] = useState(false);

  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  const isImage = IMAGE_EXTS.has(ext);

  // Load image preview
  useEffect(() => {
    if (!isImage || !invoke) return;
    setLoadingPreview(true);
    invoke("read_attachment_base64", { fileName })
      .then(dataUrl => setPreview(dataUrl))
      .catch(err => console.error("Preview failed:", err))
      .finally(() => setLoadingPreview(false));
  }, [fileName, isImage]);

  async function handleOpen() {
    if (!invoke) return;
    try {
      await invoke("open_attachment", { fileName });
    } catch (err) {
      console.error("Failed to open:", err);
    }
  }

  async function handleReveal() {
    if (!invoke) return;
    try {
      await invoke("reveal_attachment", { fileName });
    } catch (err) {
      console.error("Failed to reveal:", err);
    }
  }

  async function handleSaveAs() {
    if (!invoke) return;
    try {
      await invoke("save_attachment_as", { fileName });
    } catch (err) {
      console.error("Failed to save as:", err);
    }
  }

  // Strip timestamp prefix for display
  const displayName = fileName.length > 16 && fileName.charAt(15) === "_"
    ? fileName.substring(16)
    : fileName;

  return (
    <div className="rounded-xl border border-[#303030] bg-[#1a1a1a] overflow-hidden transition-all hover:border-[#404040]">
      {/* Image Preview */}
      {isImage && (
        <div className="relative bg-[#111] border-b border-[#2a2a2a]">
          <ImagePreview
            loadingPreview={loadingPreview}
            preview={preview}
            displayName={displayName}
            showFullPreview={showFullPreview}
            setShowFullPreview={setShowFullPreview}
          />
        </div>
      )}

      {/* File Info + Actions */}
      <div className="p-3">
        <div className="flex items-center gap-2.5 mb-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
            isImage ? "bg-[#9333ea20] text-[#c084fc]" : "bg-[#4dabf720] text-[#4dabf7]"
          }`}>
            {isImage ? (
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                <circle cx="9" cy="9" r="2" />
                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
              </svg>
            ) : (
              <FileText className="w-3.5 h-3.5" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] text-[#d4d4d4] truncate font-medium" title={displayName}>{displayName}</div>
            <div className="text-[9px] text-[#555] mt-0.5 uppercase">{isImage ? "Image" : ext.toUpperCase()} • Attachment {index + 1}</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 h-7 text-[10px] gap-1.5 border-[#333] bg-[#222] hover:bg-[#2a2a2a] text-[#d4d4d4]"
            onClick={handleOpen}
          >
            <Eye className="w-3 h-3" />
            {t("buttons.openFile")}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1 h-7 text-[10px] gap-1.5 border-[#333] bg-[#222] hover:bg-[#2a2a2a] text-[#d4d4d4]"
            onClick={handleReveal}
          >
            <FolderOpen className="w-3 h-3" />
            Show in Folder
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1 h-7 text-[10px] gap-1.5 border-[#333] bg-[#222] hover:bg-[#2a2a2a] text-[#d4d4d4]"
            onClick={handleSaveAs}
          >
            <Download className="w-3 h-3" />
            Save As
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function ResultDetailView() {
  const { t } = useTranslation();
  const [result, setResult] = useState(null);
  const [caseObj, setCaseObj] = useState(null);
  const [planObj, setPlanObj] = useState(null);

  useEffect(() => {
    const query = new URLSearchParams(globalThis.location.search);
    const resultId = Number(query.get("id"));
    if (!resultId || !invoke) return;

    (async () => {
      try {
        const res = await invoke("load_dashboard_data");
        const found = (res.testResults || []).find(r => r.id === resultId);
        if (found) {
          setResult(found);
          setCaseObj((res.cases || []).find(c => c.id === found.caseId) || null);
          setPlanObj((res.plans || []).find(p => p.id === found.planId) || null);
        }
      } catch (e) { console.error(e); }
    })();
  }, []);

  if (!result) {
    return (
      <div className="h-screen bg-[#1a1a1a] flex items-center justify-center">
        <div className="text-[#555] text-sm">Loading...</div>
      </div>
    );
  }

  const statusMeta = STATUS_META[result.resultStatus] || STATUS_META.pass;
  const StatusIcon = statusMeta.icon;

  const dateStr = (() => {
    if (!result.executedAt) return "-";
    try {
      const parts = result.executedAt.split(" ");
      const [y, m, d] = (parts[0] || "").split("-");
      const [hh, mm] = (parts[1] || "00:00").split(":");
      return `${d}/${m}/${y} ${hh}:${mm}`;
    } catch { return result.executedAt; }
  })();

  return (
    <div className="h-screen bg-[#1a1a1a] flex flex-col overflow-hidden">
      {/* Drag region */}
      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
      <div data-tauri-drag-region className="h-7 shrink-0 bg-[#181818]" onMouseDown={() => {}} />

      {/* Status Banner */}
      <div
        className="mx-4 mt-1 mb-3 rounded-xl p-4 flex items-center gap-4"
        style={{ background: statusMeta.bg, border: `1px solid ${statusMeta.color}25` }}
      >
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: `${statusMeta.color}20` }}
        >
          <StatusIcon className="w-6 h-6" style={{ color: statusMeta.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: statusMeta.color }}>
            {t(`status.${result.resultStatus}`)}
          </div>
          <div className="text-[13px] font-bold text-white truncate">
            {caseObj?.testCaseId || `TC-${result.caseId}`} — {caseObj?.title || "Test Case"}
          </div>
          {planObj && (
            <div className="text-[10px] text-[#888] mt-0.5 truncate">
              Plan: {planObj.name}
            </div>
          )}
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 min-h-0 overflow-auto px-4 pb-4 custom-scrollbar">
        {/* Detail Fields */}
        <Card className="bg-[#1e1e1e] border-[#2a2a2a] p-4 mb-3">
          <InfoRow icon={Clock}   label={t("grid.results.time")}   value={dateStr} />
          <InfoRow icon={User}    label={t("modals.testedBy")}     value={result.testedBy} />
          <InfoRow icon={Globe}   label={t("modals.environment")}  value={result.environment} />
          <InfoRow icon={Monitor} label={t("modals.testDevice")}   value={result.testedDevice} />
        </Card>

        <Card className="bg-[#1e1e1e] border-[#2a2a2a] p-4 mb-3">
          <InfoRow icon={FileText} label={t("modals.actualResult")} value={result.actualResult} className="font-mono text-[10px]" />
          <InfoRow icon={Bug}      label={t("modals.bugComment")}   value={result.bugIdOrComments} />
        </Card>

        {/* Attachments Section */}
        {(result.attachments || []).length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2.5">
              <Paperclip className="w-3.5 h-3.5 text-[#4dabf7]" />
              <span className="text-[11px] font-semibold text-[#d4d4d4]">
                {t("modals.attachments")} ({(result.attachments || []).length})
              </span>
            </div>
            <div className="space-y-3">
              {(result.attachments || []).map((fileName, idx) => (
                <AttachmentCard key={fileName} fileName={fileName} index={idx} t={t} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
