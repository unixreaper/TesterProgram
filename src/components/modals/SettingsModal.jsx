/* eslint-disable react/prop-types */
import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "../ui/dialog";
import { Plus, Trash2, Settings, Smartphone, Cpu, Binary, Boxes } from "lucide-react";
import { Badge } from "../ui/badge";

export function SettingsModal({
  open,
  onOpenChange,
  environments,
  devices,
  modules = [],
  selectedProject,
  newEnv,
  setNewEnv,
  newDevice,
  setNewDevice,
  newModule,
  setNewModule,
  idPattern,
  setIdPattern,
  onAddEnv,
  onDeleteEnv,
  onAddDevice,
  onDeleteDevice,
  onAddModule,
  onUpdateModule,
  onDeleteModule,
  onSavePattern,
  onCleanupAttachments,
  t
}) {
  const [editingModuleId, setEditingModuleId] = useState(null);
  const [editingModuleName, setEditingModuleName] = useState("");

  const startEditModule = (item) => {
    setEditingModuleId(item.id);
    setEditingModuleName(item.name);
  };

  const saveEditModule = async () => {
    if (!editingModuleName.trim()) return;
    await onUpdateModule(editingModuleId, editingModuleName.trim());
    setEditingModuleId(null);
    setEditingModuleName("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(800px,96vw)] max-h-[88vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><Settings className="w-5 h-5" /> {t("modals.manageEnvironmentDevice")}</DialogTitle></DialogHeader>
        
        <div className="space-y-6 py-2">
          {/* Environment Catalog */}
          <section className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-[#4dabf7] uppercase tracking-wider">
              <Cpu className="w-3.5 h-3.5" /> {t("modals.environmentCatalog")}
            </div>
            <p className="text-[10px] text-[#9da1a6]">{t("modals.environmentCatalogHint")}</p>
            <div className="flex gap-2">
              <Input placeholder={t("modals.newEnvironmentPlaceholder")} value={newEnv} onChange={(e) => setNewEnv(e.target.value)} onKeyDown={(e) => e.key === "Enter" && onAddEnv()} />
              <Button size="sm" onClick={onAddEnv}><Plus className="w-3.5 h-3.5 mr-1" />{t("buttons.add")}</Button>
            </div>
            <div className="flex flex-wrap gap-1.5 min-h-[40px] p-2 rounded-lg bg-[#1a1a1a] border border-[#343434]">
              {environments.map((item) => (
                <Badge key={item.id} variant="secondary" className="pl-2 pr-1 py-1 gap-1 flex items-center bg-[#252525] border-[#404040]">
                  {item.name}
                  <button onClick={() => onDeleteEnv(item.id)} className="hover:text-[#f48771] p-0.5 rounded-sm hover:bg-[#ff000011] transition-colors">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </section>

          {/* Device Catalog */}
          <section className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-[#4dabf7] uppercase tracking-wider">
              <Smartphone className="w-3.5 h-3.5" /> {t("modals.deviceCatalog")}
            </div>
            <p className="text-[10px] text-[#9da1a6]">{t("modals.deviceCatalogHint")}</p>
            <div className="flex gap-2">
              <Input placeholder={t("modals.newDevicePlaceholder")} value={newDevice} onChange={(e) => setNewDevice(e.target.value)} onKeyDown={(e) => e.key === "Enter" && onAddDevice()} />
              <Button size="sm" onClick={onAddDevice}><Plus className="w-3.5 h-3.5 mr-1" />{t("buttons.add")}</Button>
            </div>
            <div className="flex flex-wrap gap-1.5 min-h-[40px] p-2 rounded-lg bg-[#1a1a1a] border border-[#343434]">
              {devices.map((item) => (
                <Badge key={item.id} variant="secondary" className="pl-2 pr-1 py-1 gap-1 flex items-center bg-[#252525] border-[#404040]">
                  {item.name}
                  <button onClick={() => onDeleteDevice(item.id)} className="hover:text-[#f48771] p-0.5 rounded-sm hover:bg-[#ff000011] transition-colors">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </section>

          <section className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-[#4dabf7] uppercase tracking-wider">
              <Boxes className="w-3.5 h-3.5" /> {t("modals.moduleCatalog")}
            </div>
            <p className="text-[10px] text-[#9da1a6]">
              {selectedProject ? selectedProject.name : t("empty.projects")}
            </p>
            <div className="flex gap-2">
              <Input
                placeholder={t("modals.newModulePlaceholder")}
                value={newModule}
                onChange={(e) => setNewModule(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onAddModule()}
                disabled={!selectedProject}
              />
              <Button size="sm" onClick={onAddModule} disabled={!selectedProject}>
                <Plus className="w-3.5 h-3.5 mr-1" />{t("buttons.add")}
              </Button>
            </div>
            <div className="flex flex-wrap gap-1.5 min-h-[40px] p-2 rounded-lg bg-[#1a1a1a] border border-[#343434]">
              {modules.length === 0 && (
                <span className="text-[10px] text-[#7f8891] px-1 py-1">{t("empty.modules")}</span>
              )}
              {modules.map((item) => (
                editingModuleId === item.id ? (
                  <span key={item.id} className="flex items-center gap-1 rounded border border-[#404040] bg-[#252525] p-1">
                    <Input
                      value={editingModuleName}
                      onChange={(e) => setEditingModuleName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && saveEditModule()}
                      className="h-6 w-32"
                      autoFocus
                    />
                    <Button size="sm" className="h-6 px-2" onClick={saveEditModule}>{t("buttons.save")}</Button>
                    <Button size="sm" variant="ghost" className="h-6 px-2" onClick={() => setEditingModuleId(null)}>{t("buttons.cancel")}</Button>
                  </span>
                ) : (
                  <Badge key={item.id} variant="secondary" className="pl-2 pr-1 py-1 gap-1 flex items-center bg-[#252525] border-[#404040]">
                    <button className="hover:text-[#4dabf7]" onClick={() => startEditModule(item)}>
                      {item.name}
                    </button>
                    <button onClick={() => onDeleteModule(item.id)} className="hover:text-[#f48771] p-0.5 rounded-sm hover:bg-[#ff000011] transition-colors">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </Badge>
                )
              ))}
            </div>
          </section>

          {/* Case ID Pattern */}
          <section className="space-y-3 p-4 rounded-xl bg-[#0e639c08] border border-[#0e639c22]">
            <div className="flex items-center gap-2 text-xs font-bold text-[#4dabf7] uppercase tracking-wider">
              <Binary className="w-3.5 h-3.5" /> {t("modals.caseIdPattern")}
            </div>
            <p className="text-[10px] text-[#9da1a6]">{t("modals.caseIdPatternHint")}</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="text-[10px] text-[#8a9199] mb-1 block uppercase tracking-tighter">{t("modals.caseIdPrefix")}</label>
                <Input value={idPattern.prefix} onChange={(e) => setIdPattern((s) => ({ ...s, prefix: e.target.value }))} />
              </div>
              <div>
                <label className="text-[10px] text-[#8a9199] mb-1 block uppercase tracking-tighter">{t("modals.caseIdSeparator")}</label>
                <Input value={idPattern.separator} onChange={(e) => setIdPattern((s) => ({ ...s, separator: e.target.value }))} />
              </div>
              <div>
                <label className="text-[10px] text-[#8a9199] mb-1 block uppercase tracking-tighter">{t("modals.caseIdPadding")}</label>
                <Input type="number" min="0" max="6" value={idPattern.padding} onChange={(e) => setIdPattern((s) => ({ ...s, padding: Number.parseInt(e.target.value, 10) || 0 }))} />
              </div>
              <div>
                <label className="text-[10px] text-[#8a9199] mb-1 block uppercase tracking-tighter">{t("modals.caseIdNextNumber")}</label>
                <Input type="number" min="1" value={idPattern.nextNumber} onChange={(e) => setIdPattern((s) => ({ ...s, nextNumber: Number.parseInt(e.target.value, 10) || 1 }))} />
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-[#1a1a1a] border border-[#343434]">
              <div className="text-[10px] text-[#9da1a6]">
                {t("modals.caseIdPreview")}: <span className="text-[#4dabf7] font-mono text-xs ml-2">
                  {idPattern.prefix}{idPattern.separator}{String(idPattern.nextNumber).padStart(idPattern.padding, "0")}
                </span>
              </div>
              <Button size="sm" onClick={onSavePattern}>{t("buttons.save")}</Button>
            </div>
          </section>

          {/* Maintenance Section */}
          <section className="space-y-3 p-4 rounded-xl bg-[#ff000008] border border-[#ff000022]">
            <div className="flex items-center gap-2 text-xs font-bold text-[#f48771] uppercase tracking-wider">
              <Trash2 className="w-3.5 h-3.5" /> {t("modals.maintenance")}
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-[10px] text-[#9da1a6] leading-relaxed">
                  {t("modals.cleanupAttachmentsHint", { defaultValue: "Remove attachment files that are no longer referenced by any test results to free up disk space." })}
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onCleanupAttachments}
                className="border-[#f4877144] hover:bg-[#f4877111] hover:text-[#f48771] shrink-0"
              >
                {t("buttons.cleanupNow", { defaultValue: "Cleanup Now" })}
              </Button>
            </div>
          </section>
        </div>

        <DialogFooter>
          <DialogClose asChild><Button variant="secondary">{t("buttons.cancel")}</Button></DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
