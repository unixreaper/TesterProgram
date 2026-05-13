/* eslint-disable react/prop-types */
import {
  ChevronDown,
  ClipboardCheck,
  FileText,
  Folder,
  FolderOpen,
  GitBranch,
  Pencil,
  Plus,
  Trash2
} from "lucide-react";
import { Button } from "./ui/button";

const STATUS_DOT = {
  pass: "bg-[#4ec9b0]",
  fail: "bg-[#f48771]",
  blocked: "bg-[#cca700]",
  "not-run": "bg-[#6f7680]"
};

export function ProjectSidebar({
  width,
  onResizeStart,
  projects,
  plans,
  cases,
  selectedProjectId,
  selectedPlanId,
  expandedProjects,
  expandedPlans,
  setExpandedProjects,
  setExpandedPlans,
  setSelectedProjectId,
  setSelectedPlanId,
  openCreateProject,
  openEditProject,
  onDeleteProject,
  openCreatePlan,
  openEditPlan,
  onDeletePlan,
  linkedCaseCount,
  t
}) {
  const planProgress = {};
  plans.forEach((plan) => {
    const planCases = cases.filter((testCase) => (testCase.linkedPlanIds || []).includes(plan.id));
    const total = planCases.length;
    planProgress[plan.id] = total
      ? Math.round((planCases.filter((testCase) => testCase.status === "pass").length / total) * 100)
      : 0;
  });

  return (
    <aside
      className="relative flex min-h-0 flex-col border-r border-[#2d2d2d] bg-[#141414] text-[#cccccc] transition-all duration-300 ease-in-out"
      style={{ width: `${width}px`, flexShrink: 0 }}
    >
      <button
        type="button"
        className="absolute bottom-0 right-[-3px] top-0 z-50 w-1.5 cursor-col-resize border-none bg-transparent p-0 transition-colors hover:bg-[#0e639c]/50 focus:outline-none"
        onMouseDown={onResizeStart}
        aria-label="Resize Sidebar"
      />

      <div className="border-b border-[#2d2d2d] bg-gradient-to-b from-[#222426] to-[#181818] px-3 py-3">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-[#31506a] bg-[#0e639c24]">
            <GitBranch className="h-4 w-4 text-[#69b8ff]" />
          </span>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-[#f0f0f0]">{t("appName")}</div>
            <div className="truncate text-[10px] text-[#7f8891]">{t("workspace")}</div>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-1.5">
          <div className="rounded-md border border-[#303030] bg-[#1b1b1b] px-2 py-1">
            <div className="text-[10px] text-[#6f7680]">{t("projects")}</div>
            <div className="text-sm font-bold text-[#e0e0e0]">{projects.length}</div>
          </div>
          <div className="rounded-md border border-[#303030] bg-[#1b1b1b] px-2 py-1">
            <div className="text-[10px] text-[#6f7680]">{t("plans")}</div>
            <div className="text-sm font-bold text-[#e0e0e0]">{plans.length}</div>
          </div>
          <div className="rounded-md border border-[#303030] bg-[#1b1b1b] px-2 py-1">
            <div className="text-[10px] text-[#6f7680]">{t("stats.cases")}</div>
            <div className="text-sm font-bold text-[#e0e0e0]">{cases.length}</div>
          </div>
        </div>
      </div>

      <div className="flex h-9 shrink-0 items-center justify-between border-b border-[#242424] bg-[#171717] px-2">
        <div className="text-[10px] font-bold uppercase tracking-wide text-[#858585]">{t("projects")}</div>
        <Button size="icon" variant="secondary" className="h-6 w-6 border-[#343434] bg-[#242424]" onClick={openCreateProject} title={t("newProject")}>
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-auto py-2 custom-scrollbar">
        {projects.length === 0 && (
          <div className="mx-2 mt-3 rounded-md border border-[#323232] bg-[#1f1f1f] p-3 text-center">
            <Folder className="mx-auto mb-2 h-7 w-7 text-[#4dabf7]" />
            <div className="text-xs font-semibold">{t("empty.projects")}</div>
            <div className="mt-1 text-[10px] leading-relaxed text-[#858585]">{t("empty.projectsDescription")}</div>
            <Button size="sm" className="mt-3 h-7" onClick={openCreateProject}>
              <Plus className="mr-1 h-3.5 w-3.5" />
              {t("newProject")}
            </Button>
          </div>
        )}

        {projects.map((project) => {
          const plansForProject = plans.filter((plan) => plan.projectId === project.id);
          const expanded = expandedProjects[project.id] ?? true;
          const projectSelected = selectedProjectId === project.id;

          return (
            <div key={project.id} className="group/project mx-1 mb-1 rounded-lg border border-transparent">
              <div
                className={`flex min-h-9 items-center gap-1 rounded-md px-1.5 text-xs transition-colors ${
                  projectSelected ? "border border-[#31506a] bg-[#202a31] text-white shadow-[inset_2px_0_0_#69b8ff]" : "text-[#cccccc] hover:bg-[#202020]"
                }`}
              >
                <button
                  type="button"
                  className={`grid h-5 w-5 shrink-0 place-items-center rounded text-[#9da1a6] transition-transform ${expanded ? "rotate-0" : "-rotate-90"}`}
                  onClick={() => setExpandedProjects((previous) => ({ ...previous, [project.id]: !expanded }))}
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  className="flex min-w-0 flex-1 items-center gap-1.5 text-left"
                  onClick={() => {
                    setSelectedProjectId(project.id);
                    setSelectedPlanId(plansForProject[0]?.id || null);
                  }}
                >
                  {expanded ? <FolderOpen className="h-3.5 w-3.5 shrink-0 text-[#dcb67a]" /> : <Folder className="h-3.5 w-3.5 shrink-0 text-[#dcb67a]" />}
                  <span className="truncate font-medium">{project.name}</span>
                  <span className="ml-auto rounded-full border border-[#3a3a3a] bg-[#252526] px-1.5 py-0.5 text-[9px] text-[#9da1a6]">
                    {plansForProject.length}
                  </span>
                </button>
                <div className="flex shrink-0 opacity-70 transition-opacity group-hover/project:opacity-100">
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => openCreatePlan(project.id)} title={t("newPlan")}>
                    <Plus className="h-3 w-3" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => openEditProject(project)} title={t("buttons.edit")}>
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-6 w-6 hover:text-[#f48771]" onClick={() => onDeleteProject(project.id)} title={t("buttons.delete")}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <div className={`grid transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                <div className="overflow-hidden">
                  {plansForProject.length === 0 && (
                    <div className="ml-9 border-l border-[#2d2d2d] px-3 py-1.5 text-[10px] italic text-[#6f7680]">
                      {t("empty.plansInProject")}
                    </div>
                  )}

                  {plansForProject.map((plan) => {
                    const planCases = cases.filter((testCase) => (testCase.linkedPlanIds || []).includes(plan.id));
                    const progress = planProgress[plan.id] || 0;
                    const caseCount = linkedCaseCount[plan.id] || 0;
                    const planSelected = selectedPlanId === plan.id;
                    const planExpanded = expandedPlans[plan.id] ?? true;

                    return (
                      <div key={plan.id} className="group/plan">
                        <div
                          className={`mx-1 ml-5 flex min-h-10 items-center gap-1 rounded-md border border-transparent px-1.5 text-xs transition-all ${
                            planSelected
                              ? "border-[#0e639c55] bg-gradient-to-r from-[#062f4a] to-[#1f2529] text-white shadow-[inset_2px_0_0_#4dabf7]"
                              : "text-[#c9ced6] hover:border-[#31363c] hover:bg-[#1d1f21]"
                          }`}
                        >
                          <button
                            type="button"
                            className={`grid h-5 w-5 shrink-0 place-items-center rounded text-[#9da1a6] transition-transform ${planExpanded ? "rotate-0" : "-rotate-90"}`}
                            onClick={() => setExpandedPlans((previous) => ({ ...previous, [plan.id]: !planExpanded }))}
                            title={planExpanded ? "Collapse" : "Expand"}
                          >
                            <ChevronDown className="h-3.5 w-3.5" />
                          </button>
                          <span className="grid h-5 w-5 shrink-0 place-items-center rounded bg-[#0e639c18] text-[#4dabf7]">
                            <ClipboardCheck className="h-3.5 w-3.5" />
                          </span>
                          <button
                            type="button"
                            className="min-w-0 flex-1 text-left"
                            onClick={() => {
                              setSelectedProjectId(project.id);
                              setSelectedPlanId(plan.id);
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <span className="truncate font-medium">{plan.name}</span>
                              <span className="rounded-full border border-[#3a3a3a] bg-[#252526] px-1.5 py-0.5 text-[9px] text-[#9da1a6]">{caseCount}</span>
                            </div>
                            <div className="mt-0.5 flex items-center gap-1.5">
                              <div className="h-1 w-14 overflow-hidden rounded-full bg-[#2d2d2d]">
                                <div className="h-full rounded-full bg-[#4ec9b0] transition-all duration-300" style={{ width: `${progress}%` }} />
                              </div>
                              <span className="text-[9px] text-[#858585]">{progress}%</span>
                            </div>
                          </button>
                          <div className="flex shrink-0 opacity-60 transition-opacity group-hover/plan:opacity-100">
                            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => openEditPlan(plan)} title={t("buttons.edit")}>
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-6 w-6 hover:text-[#f48771]" onClick={() => onDeletePlan(plan.id)} title={t("buttons.delete")}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>

                        <div className={`grid transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${planExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                          <div className="ml-10 overflow-hidden border-l border-[#2d2d2d] py-1">
                            {planCases.length === 0 && (
                              <div className="mx-2 rounded-md border border-dashed border-[#303030] px-2 py-1 text-[10px] italic text-[#5f6670]">{t("empty.cases")}</div>
                            )}
                            {planCases.slice(0, 80).map((testCase) => (
                              <button
                                key={testCase.id}
                                type="button"
                                className="group/case relative ml-2 flex h-7 w-[calc(100%-8px)] items-center gap-1.5 rounded-md px-2 text-left text-[11px] text-[#aeb4bb] transition-colors before:absolute before:-left-2 before:top-1/2 before:h-px before:w-2 before:bg-[#2d2d2d] hover:bg-[#202a31] hover:text-[#e0e0e0]"
                                onClick={() => {
                                  setSelectedProjectId(project.id);
                                  setSelectedPlanId(plan.id);
                                }}
                                title={`${testCase.testCaseId} ${testCase.title}`}
                              >
                                <FileText className="h-3.5 w-3.5 shrink-0 text-[#9cdcfe]" />
                                <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${STATUS_DOT[testCase.status] || STATUS_DOT["not-run"]}`} />
                                <span className="shrink-0 font-mono text-[10px] text-[#4ec9b0]">{testCase.testCaseId || `TC-${testCase.id}`}</span>
                                <span className="truncate">{testCase.title}</span>
                              </button>
                            ))}
                            {planCases.length > 80 && (
                              <div className="px-3 py-1 text-[10px] text-[#6f7680]">+{planCases.length - 80}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
