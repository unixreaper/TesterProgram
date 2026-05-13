/* eslint-disable react/prop-types */
import { useMemo, useState } from "react";
import ReactECharts from "echarts-for-react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Clock3,
  Flame,
  Gauge,
  Layers3,
  LineChart,
  ListChecks,
  DatabaseZap,
  Target
} from "lucide-react";

const C = {
  pass: "#4ec9b0",
  fail: "#f48771",
  blocked: "#cca700",
  notRun: "#6f7680",
  blue: "#4dabf7",
  teal: "#2dd4bf",
  amber: "#d7ba7d",
  panel: "#202020",
  panel2: "#252526",
  line: "#343434",
  text: "#e0e0e0",
  muted: "#8a9199"
};

const TOOLTIP = {
  backgroundColor: "#181818",
  borderColor: "#3a3a3a",
  borderWidth: 1,
  textStyle: { color: "#e0e0e0", fontSize: 11 },
  extraCssText: "border-radius:8px;box-shadow:0 12px 28px #0009;"
};

function pct(value, total) {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

function parseDate(value) {
  if (!value) return null;
  const datePart = String(value).split(" ")[0];
  const date = new Date(`${datePart}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function keyOf(date) {
  return date.toISOString().slice(0, 10);
}

function labelOf(key) {
  const [, month, day] = key.split("-");
  return `${day}/${month}`;
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function daysBetween(start, end) {
  return Math.max(0, Math.round((end - start) / 86400000));
}

function latestCaseStatus(cases, results) {
  const map = new Map();
  results.forEach((result) => {
    const existing = map.get(result.caseId);
    if (!existing || String(result.executedAt || "").localeCompare(existing.executedAt || "") > 0) {
      map.set(result.caseId, result);
    }
  });

  return cases.map((testCase) => ({
    ...testCase,
    effectiveStatus: map.get(testCase.id)?.resultStatus || testCase.status || "not-run"
  }));
}

function ChartCard({ title, subtitle, icon: Icon, children, className = "", accent = C.blue }) {
  return (
    <section className={`rounded-xl border border-[#303030] bg-[#202020] shadow-[0_16px_40px_#0004] ${className}`}>
      <div className="flex items-start justify-between gap-3 border-b border-[#2d2d2d] px-3 py-2.5">
        <div className="flex min-w-0 items-start gap-2">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-[#343434]" style={{ background: `${accent}12`, color: accent }}>
            <Icon className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-[#e5e5e5]">{title}</h3>
            {subtitle && <p className="mt-0.5 truncate text-[10px] text-[#858585]">{subtitle}</p>}
          </div>
        </div>
      </div>
      <div className="p-3">{children}</div>
    </section>
  );
}

function MetricCard({ icon: Icon, label, value, hint, color }) {
  return (
    <div className="rounded-xl border border-[#303030] bg-gradient-to-b from-[#252526] to-[#1f1f1f] p-3">
      <div className="mb-3 flex items-center justify-between">
        <span className="grid h-7 w-7 place-items-center rounded-lg" style={{ background: `${color}18`, color }}>
          <Icon className="h-4 w-4" />
        </span>
        {hint && <span className="rounded-full border border-[#3a3a3a] px-2 py-0.5 text-[10px]" style={{ color }}>{hint}</span>}
      </div>
      <div className="text-2xl font-bold leading-none text-[#f0f0f0]">{value}</div>
      <div className="mt-1 text-[11px] text-[#858585]">{label}</div>
    </div>
  );
}

export function AnalyticsView({
  cases = [],
  plans = [],
  results = [],
  selectedProjectId,
  selectedPlanId,
  selectedProject,
  selectedPlan,
  onExportPowerBi,
  t
}) {
  let defaultScope = "all";
  if (selectedPlanId) defaultScope = "plan";
  else if (selectedProjectId) defaultScope = "project";

  const [scopeFilter, setScopeFilter] = useState(defaultScope);
  const [exportLoading, setExportLoading] = useState(false);

  const scopePlanIds = useMemo(() => {
    if (scopeFilter === "plan" && selectedPlanId) return [selectedPlanId];
    if (scopeFilter === "project" && selectedProjectId) {
      return plans.filter((plan) => plan.projectId === selectedProjectId).map((plan) => plan.id);
    }
    return plans.map((plan) => plan.id);
  }, [plans, scopeFilter, selectedPlanId, selectedProjectId]);

  const scopedCases = useMemo(() => {
    if (scopeFilter === "plan" && selectedPlanId) {
      return cases.filter((testCase) => (testCase.linkedPlanIds || []).includes(selectedPlanId));
    }
    if (scopeFilter === "project" && selectedProjectId) {
      return cases.filter((testCase) => (testCase.linkedPlanIds || []).some((id) => scopePlanIds.includes(id)));
    }
    return cases;
  }, [cases, scopeFilter, selectedPlanId, selectedProjectId, scopePlanIds]);

  const scopedResults = useMemo(() => {
    if (scopeFilter === "plan" && selectedPlanId) {
      return results.filter((result) => Number(result.planId) === Number(selectedPlanId));
    }
    if (scopeFilter === "project" && selectedProjectId) {
      return results.filter((result) => scopePlanIds.includes(Number(result.planId)));
    }
    return results;
  }, [results, scopeFilter, selectedPlanId, selectedProjectId, scopePlanIds]);

  const casesWithStatus = useMemo(() => latestCaseStatus(scopedCases, scopedResults), [scopedCases, scopedResults]);
  const total = casesWithStatus.length;
  const passed = casesWithStatus.filter((item) => item.effectiveStatus === "pass").length;
  const failed = casesWithStatus.filter((item) => item.effectiveStatus === "fail").length;
  const blocked = casesWithStatus.filter((item) => item.effectiveStatus === "blocked").length;
  const notRun = total - passed - failed - blocked;
  const remaining = total - passed;
  const completion = pct(passed, total);
  const executedCaseIds = new Set(scopedResults.map((result) => result.caseId));
  const executed = executedCaseIds.size;
  const risk = failed + blocked;

  const scopeLabel = useMemo(() => {
    if (scopeFilter === "plan" && selectedPlan) return selectedPlan.name;
    if (scopeFilter === "project" && selectedProject) return selectedProject.name;
    return t("filters.all");
  }, [scopeFilter, selectedPlan, selectedProject, t]);

  const burndown = useMemo(() => {
    const sortedResults = [...scopedResults]
      .filter((result) => result.executedAt)
      .sort((a, b) => String(a.executedAt).localeCompare(String(b.executedAt)));

    const firstResultDate = parseDate(sortedResults[0]?.executedAt);
    const planStart = scopeFilter === "plan" ? parseDate(selectedPlan?.startDate) : null;
    const planEnd = scopeFilter === "plan" ? parseDate(selectedPlan?.endDate) : null;
    const today = new Date();
    const start = planStart || firstResultDate || addDays(today, -6);
    let end = today;
    if (planEnd && planEnd >= start) {
      end = planEnd;
    } else if (today <= start) {
      end = addDays(start, 6);
    }
    const span = Math.max(1, daysBetween(start, end));

    const buckets = [];
    for (let i = 0; i <= span; i += 1) {
      const key = keyOf(addDays(start, i));
      buckets.push({ key, label: labelOf(key), executed: 0, passedToday: 0, failedToday: 0 });
    }

    const passedIds = new Set();
    const caseIds = new Set(scopedCases.map((testCase) => testCase.id));
    sortedResults.forEach((result) => {
      if (!caseIds.has(result.caseId)) return;
      const resultKey = String(result.executedAt || "").slice(0, 10);
      const bucket = buckets.find((item) => item.key === resultKey);
      if (bucket) {
        bucket.executed += 1;
        if (result.resultStatus === "pass") bucket.passedToday += 1;
        if (result.resultStatus === "fail") bucket.failedToday += 1;
      }
      if (result.resultStatus === "pass") passedIds.add(result.caseId);
    });

    const cumulativePassed = new Set();
    const actualRemaining = buckets.map((bucket) => {
      sortedResults.forEach((result) => {
        if (!caseIds.has(result.caseId)) return;
        if (String(result.executedAt || "").slice(0, 10) <= bucket.key && result.resultStatus === "pass") {
          cumulativePassed.add(result.caseId);
        }
      });
      return Math.max(0, total - cumulativePassed.size);
    });

    const idealRemaining = buckets.map((_, index) => Math.max(0, Math.round(total - (total * index) / span)));

    return {
      labels: buckets.map((item) => item.label),
      actualRemaining,
      idealRemaining,
      executed: buckets.map((item) => item.executed),
      passedToday: buckets.map((item) => item.passedToday),
      failedToday: buckets.map((item) => item.failedToday),
      start: keyOf(start),
      end: keyOf(end),
      passedByNow: passedIds.size
    };
  }, [scopedResults, scopedCases, scopeFilter, selectedPlan, total]);

  const burndownOption = useMemo(() => ({
    backgroundColor: "transparent",
    tooltip: { ...TOOLTIP, trigger: "axis" },
    legend: {
      top: 0,
      right: 8,
      icon: "roundRect",
      itemWidth: 10,
      itemHeight: 6,
      textStyle: { color: C.muted, fontSize: 10 }
    },
    grid: { top: 34, right: 18, bottom: 28, left: 36 },
    xAxis: {
      type: "category",
      data: burndown.labels,
      axisLine: { lineStyle: { color: "#343434" } },
      axisTick: { show: false },
      axisLabel: { color: C.muted, fontSize: 10 }
    },
    yAxis: [
      {
        type: "value",
        name: t("analyticsLabels.remaining"),
        minInterval: 1,
        splitLine: { lineStyle: { color: "#2a2a2a" } },
        axisLabel: { color: C.muted, fontSize: 10 }
      },
      {
        type: "value",
        name: t("analyticsLabels.executed"),
        minInterval: 1,
        splitLine: { show: false },
        axisLabel: { color: C.muted, fontSize: 10 }
      }
    ],
    series: [
      {
        name: t("analyticsLabels.actualRemaining"),
        type: "line",
        smooth: true,
        symbolSize: 6,
        data: burndown.actualRemaining,
        lineStyle: { color: C.fail, width: 3 },
        itemStyle: { color: C.fail },
        areaStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [{ offset: 0, color: "#f4877130" }, { offset: 1, color: "#f4877100" }]
          }
        }
      },
      {
        name: t("analyticsLabels.ideal"),
        type: "line",
        smooth: false,
        symbol: "none",
        data: burndown.idealRemaining,
        lineStyle: { color: C.blue, width: 2, type: "dashed" }
      },
      {
        name: t("analyticsLabels.executed"),
        type: "bar",
        yAxisIndex: 1,
        barWidth: 8,
        data: burndown.executed,
        itemStyle: { color: "#4dabf755", borderRadius: [4, 4, 0, 0] }
      }
    ]
  }), [burndown, t]);

  const statusOption = useMemo(() => ({
    backgroundColor: "transparent",
    tooltip: { ...TOOLTIP, trigger: "item", formatter: "{b}: {c} ({d}%)" },
    series: [{
      type: "pie",
      radius: ["58%", "78%"],
      center: ["50%", "52%"],
      padAngle: 3,
      itemStyle: { borderRadius: 6, borderColor: C.panel, borderWidth: 2 },
      label: { show: false },
      data: [
        { value: passed, name: t("status.pass"), itemStyle: { color: C.pass } },
        { value: failed, name: t("status.fail"), itemStyle: { color: C.fail } },
        { value: blocked, name: t("status.blocked"), itemStyle: { color: C.blocked } },
        { value: notRun, name: t("status.not-run"), itemStyle: { color: C.notRun } }
      ].filter((item) => item.value > 0)
    }]
  }), [passed, failed, blocked, notRun, t]);

  const velocityOption = useMemo(() => {
    const days = 14;
    const today = new Date();
    const buckets = [];
    for (let i = days - 1; i >= 0; i -= 1) {
      const key = keyOf(addDays(today, -i));
      buckets.push({ key, label: labelOf(key), pass: 0, fail: 0, blocked: 0 });
    }
    scopedResults.forEach((result) => {
      const bucket = buckets.find((item) => item.key === String(result.executedAt || "").slice(0, 10));
      if (!bucket) return;
      if (result.resultStatus === "pass") bucket.pass += 1;
      if (result.resultStatus === "fail") bucket.fail += 1;
      if (result.resultStatus === "blocked") bucket.blocked += 1;
    });

    return {
      backgroundColor: "transparent",
      tooltip: { ...TOOLTIP, trigger: "axis", axisPointer: { type: "shadow" } },
      legend: {
        top: 0,
        right: 8,
        icon: "circle",
        itemWidth: 8,
        itemHeight: 8,
        textStyle: { color: C.muted, fontSize: 10 }
      },
      grid: { top: 30, right: 12, bottom: 24, left: 28 },
      xAxis: {
        type: "category",
        data: buckets.map((item) => item.label),
        axisLine: { lineStyle: { color: "#343434" } },
        axisTick: { show: false },
        axisLabel: { color: C.muted, fontSize: 9 }
      },
      yAxis: {
        type: "value",
        minInterval: 1,
        splitLine: { lineStyle: { color: "#2a2a2a" } },
        axisLabel: { color: C.muted, fontSize: 9 }
      },
      series: [
        { name: t("status.pass"), type: "bar", stack: "status", data: buckets.map((item) => item.pass), itemStyle: { color: C.pass, borderRadius: [3, 3, 0, 0] } },
        { name: t("status.fail"), type: "bar", stack: "status", data: buckets.map((item) => item.fail), itemStyle: { color: C.fail } },
        { name: t("status.blocked"), type: "bar", stack: "status", data: buckets.map((item) => item.blocked), itemStyle: { color: C.blocked } }
      ]
    };
  }, [scopedResults, t]);

  const moduleHealth = useMemo(() => {
    const map = {};
    casesWithStatus.forEach((testCase) => {
      const names = testCase.moduleNames?.length ? testCase.moduleNames : [testCase.relatedFeature || "-"];
      names.forEach((name) => {
        if (!map[name]) map[name] = { total: 0, pass: 0, fail: 0, blocked: 0, notRun: 0 };
        map[name].total += 1;
        if (testCase.effectiveStatus === "pass") map[name].pass += 1;
        else if (testCase.effectiveStatus === "fail") map[name].fail += 1;
        else if (testCase.effectiveStatus === "blocked") map[name].blocked += 1;
        else map[name].notRun += 1;
      });
    });

    return Object.entries(map)
      .map(([name, counts]) => ({ name, ...counts, risk: counts.fail * 2 + counts.blocked, passRate: pct(counts.pass, counts.total) }))
      .sort((a, b) => b.risk - a.risk || b.total - a.total)
      .slice(0, 8);
  }, [casesWithStatus]);

  const recentFailures = useMemo(() => {
    return scopedResults
      .filter((result) => result.resultStatus === "fail" || result.resultStatus === "blocked")
      .sort((a, b) => String(b.executedAt || "").localeCompare(String(a.executedAt || "")))
      .slice(0, 7)
      .map((result) => {
        const testCase = cases.find((item) => item.id === result.caseId);
        return {
          ...result,
          testCaseId: testCase?.testCaseId || `#${result.caseId}`,
          title: testCase?.title || `Case #${result.caseId}`
        };
      });
  }, [scopedResults, cases]);

  return (
    <div className="min-h-0 flex-1 overflow-auto bg-[#1f1f1f] px-3 pb-4 pt-3 custom-scrollbar">
      <div className="mb-3 rounded-2xl border border-[#303030] bg-[radial-gradient(circle_at_top_left,#0e639c26,transparent_34%),linear-gradient(135deg,#242424,#1b1b1b)] p-4 shadow-[0_20px_60px_#0006]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#3a3a3a] bg-[#1a1a1a99] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#9da1a6]">
              <Activity className="h-3.5 w-3.5 text-[#4dabf7]" />
              {t("analyticsLabels.controlRoom")}
            </div>
            <h1 className="text-xl font-bold tracking-tight text-[#f5f5f5]">{t("analytics")}</h1>
            <p className="mt-1 text-xs text-[#9da1a6]">{scopeLabel}</p>
          </div>
          <div className="flex rounded-lg border border-[#343434] bg-[#181818] p-1">
            {[
              { id: "plan", label: t("plans") },
              { id: "project", label: t("projects") },
              { id: "all", label: t("filters.all") }
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setScopeFilter(item.id)}
                className={`rounded-md px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                  scopeFilter === item.id ? "bg-[#0e639c] text-white shadow" : "text-[#858585] hover:bg-[#252526] hover:text-[#d4d4d4]"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            disabled={exportLoading}
            onClick={async () => {
              setExportLoading(true);
              try {
                await onExportPowerBi();
              } finally {
                setExportLoading(false);
              }
            }}
            className={`inline-flex h-8 items-center gap-2 rounded-lg border border-[#343434] bg-[#202020] px-3 text-[11px] font-semibold text-[#9da1a6] transition-colors hover:border-[#4dabf7] hover:text-[#e0e0e0] ${exportLoading ? "opacity-50 cursor-not-allowed" : ""}`}
            title={t("buttons.exportPowerBi")}
          >
            <DatabaseZap className={`h-3.5 w-3.5 text-[#4dabf7] ${exportLoading ? "animate-pulse" : ""}`} />
            {exportLoading ? "Exporting..." : t("buttons.exportPowerBi", { defaultValue: "Export to Power BI" })}
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-5">
          <MetricCard icon={Target} label={t("analyticsLabels.totalScope")} value={total} hint={t("stats.cases")} color={C.blue} />
          <MetricCard icon={CheckCircle2} label={t("analyticsLabels.done")} value={passed} hint={`${completion}%`} color={C.pass} />
          <MetricCard icon={Clock3} label={t("analyticsLabels.remaining")} value={remaining} hint={total ? `${pct(remaining, total)}%` : "0%"} color={C.amber} />
          <MetricCard icon={ListChecks} label={t("analyticsLabels.executedCases")} value={executed} hint={`${pct(executed, total)}%`} color={C.teal} />
          <MetricCard icon={Flame} label={t("analyticsLabels.riskOpen")} value={risk} hint={risk ? t("analyticsLabels.watch") : t("status.pass")} color={risk ? C.fail : C.pass} />
        </div>
      </div>

      <div className="grid grid-cols-12 gap-3">
        <ChartCard
          className="col-span-12 xl:col-span-8"
          icon={LineChart}
          title={t("analyticsLabels.burndown")}
          subtitle={`${t("analyticsLabels.window")}: ${burndown.start} -> ${burndown.end}`}
          accent={C.fail}
        >
          <ReactECharts option={burndownOption} style={{ height: 320 }} theme="dark" />
        </ChartCard>

        <ChartCard className="col-span-12 xl:col-span-4" icon={Gauge} title={t("analyticsLabels.health")} subtitle={t("distribution")} accent={C.pass}>
          <div className="relative">
            <ReactECharts option={statusOption} style={{ height: 220 }} theme="dark" />
            <div className="pointer-events-none absolute inset-x-0 top-[86px] text-center">
              <div 
                className="text-3xl font-bold" 
                style={{ 
                  color: (() => {
                    if (completion >= 80) return C.pass;
                    if (completion >= 50) return C.blocked;
                    return C.fail;
                  })()
                }}
              >
                {completion}%
              </div>
              <div className="text-[10px] text-[#858585]">{t("pass_rate")}</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            {[
              [t("status.pass"), passed, C.pass],
              [t("status.fail"), failed, C.fail],
              [t("status.blocked"), blocked, C.blocked],
              [t("status.not-run"), notRun, C.notRun]
            ].map(([label, value, color]) => (
              <div key={label} className="flex items-center justify-between rounded-lg border border-[#303030] bg-[#1b1b1b] px-2 py-1.5">
                <span className="flex items-center gap-1.5 text-[#9da1a6]"><span className="h-2 w-2 rounded-full" style={{ background: color }} />{label}</span>
                <span className="font-bold text-[#e0e0e0]">{value}</span>
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard className="col-span-12 lg:col-span-7" icon={BarChart3} title={t("analyticsLabels.velocity")} subtitle={t("execution_trend")} accent={C.blue}>
          <ReactECharts option={velocityOption} style={{ height: 250 }} theme="dark" />
        </ChartCard>

        <ChartCard className="col-span-12 lg:col-span-5" icon={Layers3} title={t("analyticsLabels.moduleRisk")} subtitle={t("analyticsLabels.failBlockedFirst")} accent={C.blocked}>
          {moduleHealth.length === 0 ? (
            <div className="flex h-[230px] items-center justify-center text-xs text-[#6f7680]">{t("empty.cases")}</div>
          ) : (
            <div className="space-y-2">
              {moduleHealth.map((module, index) => (
                <div key={module.name} className="rounded-lg border border-[#303030] bg-[#1b1b1b] p-2">
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="text-[10px] font-bold text-[#6f7680]">#{index + 1}</span>
                      <span className="truncate text-xs font-semibold text-[#d4d4d4]" title={module.name}>{module.name}</span>
                    </div>
                    <span className="rounded-full border border-[#3a3a3a] px-2 py-0.5 text-[10px] text-[#9da1a6]">{module.total}</span>
                  </div>
                  <div className="flex h-1.5 overflow-hidden rounded-full bg-[#2d2d2d]">
                    {module.pass > 0 && <div style={{ width: `${pct(module.pass, module.total)}%`, background: C.pass }} />}
                    {module.fail > 0 && <div style={{ width: `${pct(module.fail, module.total)}%`, background: C.fail }} />}
                    {module.blocked > 0 && <div style={{ width: `${pct(module.blocked, module.total)}%`, background: C.blocked }} />}
                    {module.notRun > 0 && <div style={{ width: `${pct(module.notRun, module.total)}%`, background: C.notRun }} />}
                  </div>
                  <div className="mt-1.5 flex justify-between text-[10px] text-[#858585]">
                    <span>{t("pass_rate")}: {module.passRate}%</span>
                    <span style={{ color: module.risk ? C.fail : C.pass }}>{t("analyticsLabels.risk")}: {module.risk}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ChartCard>

        <ChartCard className="col-span-12" icon={AlertTriangle} title={t("analyticsLabels.recentProblems")} subtitle={t("analyticsLabels.latestFailBlocked")} accent={C.fail}>
          {recentFailures.length === 0 ? (
            <div className="flex h-24 flex-col items-center justify-center gap-2 text-xs text-[#6f7680]">
              <CheckCircle2 className="h-7 w-7 text-[#4ec9b066]" />
              {t("analyticsLabels.noProblems")}
            </div>
          ) : (
            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
              {recentFailures.map((result) => (
                <div key={result.id} className="rounded-lg border border-[#4b302f] bg-[#2a1f1f] p-2">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="font-mono text-[11px] font-bold text-[#f48771]">{result.testCaseId}</span>
                    <span className="text-[10px] text-[#858585]">{String(result.executedAt || "").slice(0, 16)}</span>
                  </div>
                  <div className="truncate text-xs text-[#e0e0e0]">{result.title}</div>
                  <div className="mt-1 flex items-center gap-2 text-[10px] text-[#9da1a6]">
                    <span className="rounded border border-[#5d3d3a] px-1.5 py-0.5 text-[#f48771]">{t(`status.${result.resultStatus}`)}</span>
                    {result.testedBy && <span className="truncate">{result.testedBy}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ChartCard>
      </div>
    </div>
  );
}
