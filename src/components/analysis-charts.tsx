"use client";

import type { ReactNode } from "react";
import type {
  DepartmentMergerPlan,
  FailurePointDetail,
  IntegrationTimelinePhase,
  SuccessGauge,
} from "@/lib/types/analysis";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const TOOLTIP_STYLE = {
  background: "rgba(0,0,0,0.92)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 8,
  fontSize: 12,
};

function shorten(label: string, max = 28): string {
  const t = label.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

function clampPct(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.round(Math.max(0, Math.min(100, n)));
}

function validGauges(gauges: SuccessGauge[] | undefined): SuccessGauge[] {
  return (gauges ?? []).filter(
    (g): g is SuccessGauge => typeof g?.label === "string" && typeof g?.value === "number"
  );
}

function chartHeight(rows: number, min = 220, perRow = 28): number {
  return Math.max(min, Math.min(520, rows * perRow + 72));
}

function ChartFrame({
  height,
  title,
  subtitle,
  children,
}: {
  height: number;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-black/35 p-3 ring-1 ring-cyan-500/10">
      <div className="mb-2 px-1">
        <p className="text-xs font-semibold text-foreground/90">{title}</p>
        {subtitle ? <p className="text-[11px] text-muted-foreground">{subtitle}</p> : null}
      </div>
      <div style={{ height }} className="w-full">
        {children}
      </div>
    </div>
  );
}

export function AnalysisHealthSnapshotChart({
  risk,
  gauges,
}: {
  risk: number;
  gauges: SuccessGauge[];
}) {
  const rows = validGauges(gauges);
  const avg =
    rows.length > 0 ? rows.reduce((sum, g) => sum + clampPct(g.value), 0) / rows.length : 0;
  const data = [
    { name: "Culture / retention risk", value: clampPct(risk), fill: "#f97316" },
    { name: "Program health (avg.)", value: clampPct(avg), fill: "#38bdf8" },
    {
      name: "Headroom to 100",
      value: clampPct(100 - (clampPct(risk) + clampPct(avg)) / 2),
      fill: "#334155",
    },
  ];

  return (
    <ChartFrame height={240} title="At-a-glance indices" subtitle="Qualitative 0–100 scores from analysis">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
          <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} interval={0} />
          <YAxis domain={[0, 100]} stroke="#64748b" fontSize={11} tickLine={false} />
          <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [`${Number(v ?? 0)}`, "Index"]} />
          <Bar dataKey="value" radius={[6, 6, 0, 0]}>
            {data.map((row) => (
              <Cell key={row.name} fill={row.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

export function CultureRetentionRiskChart({ risk }: { risk: number }) {
  const score = clampPct(risk);
  const data = [
    { name: "Risk signals", value: score, fill: "#fb923c" },
    { name: "Remaining scale", value: 100 - score, fill: "rgba(51,65,85,0.55)" },
  ];

  return (
    <ChartFrame
      height={220}
      title="Risk vs. remaining scale"
      subtitle="Higher orange share = more inherent risk in sources"
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={52}
            outerRadius={78}
            paddingAngle={2}
            stroke="rgba(0,0,0,0.35)"
          >
            {data.map((row) => (
              <Cell key={row.name} fill={row.fill} />
            ))}
          </Pie>
          <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [`${Number(v ?? 0)}`, "Index"]} />
          <Legend wrapperStyle={{ fontSize: 11, color: "#94a3b8" }} />
        </PieChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

export function ProgramHealthGaugesChart({ gauges }: { gauges: SuccessGauge[] }) {
  const rows = validGauges(gauges)
    .map((g) => ({ label: shorten(g.label, 36), value: clampPct(g.value) }))
    .sort((a, b) => b.value - a.value);

  if (rows.length === 0) return null;

  return (
    <ChartFrame
      height={chartHeight(rows.length, 260, 30)}
      title="Program health by dimension"
      subtitle="Directional readiness indices (0–100)"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 16, left: 4, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
          <XAxis type="number" domain={[0, 100]} stroke="#64748b" fontSize={11} tickLine={false} />
          <YAxis
            type="category"
            dataKey="label"
            width={148}
            stroke="#94a3b8"
            fontSize={10}
            tickLine={false}
          />
          <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [`${Number(v ?? 0)}%`, "Index"]} />
          <Bar dataKey="value" fill="#38bdf8" radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

export function IntegrationPhaseWorkloadChart({ phases }: { phases: IntegrationTimelinePhase[] }) {
  const rows = (phases ?? []).map((p, i) => ({
    phase: shorten(typeof p.phase === "string" ? p.phase : `Phase ${i + 1}`, 22),
    milestones: Array.isArray(p.milestones) ? p.milestones.length : 0,
    steps: Array.isArray(p.actionableSteps) ? p.actionableSteps.length : 0,
  }));

  if (rows.length === 0) return null;

  return (
    <ChartFrame
      height={chartHeight(rows.length, 240, 32)}
      title="Playbook workload by phase"
      subtitle="Milestone vs. actionable-step counts (not calendar duration)"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 16, left: 4, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
          <XAxis type="number" stroke="#64748b" fontSize={11} allowDecimals={false} tickLine={false} />
          <YAxis type="category" dataKey="phase" width={120} stroke="#94a3b8" fontSize={10} tickLine={false} />
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Legend wrapperStyle={{ fontSize: 11, color: "#94a3b8" }} />
          <Bar dataKey="milestones" name="Milestones" fill="#818cf8" radius={[0, 4, 4, 0]} />
          <Bar dataKey="steps" name="Actionable steps" fill="#22d3ee" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

export function FailureSignalsChart({ failures }: { failures: FailurePointDetail[] }) {
  const rows = (failures ?? []).map((f, i) => ({
    mode: shorten(typeof f.title === "string" ? f.title : `Failure ${i + 1}`, 26),
    warnings: (f.earlyWarningSignals ?? []).length,
    mitigations: (f.mitigationSteps ?? []).length,
  }));

  if (rows.length === 0) return null;

  return (
    <ChartFrame
      height={chartHeight(rows.length, 260, 30)}
      title="Failure-mode coverage"
      subtitle="Early-warning signals vs. mitigation steps per mode"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 16, left: 4, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
          <XAxis type="number" stroke="#64748b" fontSize={11} allowDecimals={false} tickLine={false} />
          <YAxis type="category" dataKey="mode" width={132} stroke="#94a3b8" fontSize={10} tickLine={false} />
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Legend wrapperStyle={{ fontSize: 11, color: "#94a3b8" }} />
          <Bar dataKey="warnings" name="Early warnings" fill="#fbbf24" radius={[0, 4, 4, 0]} />
          <Bar dataKey="mitigations" name="Mitigations" fill="#34d399" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

export function DepartmentTaskLoadChart({ plans }: { plans: DepartmentMergerPlan[] }) {
  const rows = (plans ?? [])
    .map((p, i) => ({
      department: shorten(typeof p.department === "string" ? p.department : `Dept ${i + 1}`, 24),
      tasks: (p.priorityTasks ?? []).length,
    }))
    .filter((r) => r.tasks > 0)
    .sort((a, b) => b.tasks - a.tasks);

  if (rows.length === 0) return null;

  return (
    <ChartFrame
      height={chartHeight(rows.length, 220, 30)}
      title="Priority tasks by function"
      subtitle="Count of assigned priority tasks in the departmental plan"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 16, left: 4, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
          <XAxis type="number" stroke="#64748b" fontSize={11} allowDecimals={false} tickLine={false} />
          <YAxis
            type="category"
            dataKey="department"
            width={132}
            stroke="#94a3b8"
            fontSize={10}
            tickLine={false}
          />
          <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [Number(v ?? 0), "Tasks"]} />
          <Bar dataKey="tasks" fill="#a78bfa" radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}
