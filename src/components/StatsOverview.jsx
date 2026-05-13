/* eslint-disable react/prop-types */
import { CardContent } from "./ui/card";
// eslint-disable-next-line no-unused-vars
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

export function StatsOverview({ stats, t }) {
  const chartData = (stats || [])
    .filter(s => ["pass", "fail", "blocked", "not-run"].includes(s.key))
    .map(s => ({ name: t(`stats.${s.key}`), value: s.value, color: s.color }));

  const total = chartData.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <CardContent className="p-3 flex flex-wrap gap-4 items-center justify-between bg-[#1a1a1a]/30">
      <div className="flex flex-wrap gap-2">
        {(stats || []).map((item) => (
          <div key={item.key} className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-[#2d2d2d] bg-[#1f1f1f] shadow-sm transition-all hover:border-[#404040]">
            <div className="p-1 rounded bg-[#2d2d2d]" style={{ color: item.color }}>
              <item.icon className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-[10px] text-[#8a9199] font-medium leading-none mb-1">{t(`stats.${item.key}`)}</div>
              <div className="text-xs font-bold text-[#e0e0e0] leading-none">{item.value}</div>
            </div>
          </div>
        ))}
      </div>

      {total > 0 && (
        <div className="h-12 w-12 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                innerRadius={15}
                outerRadius={22}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {chartData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333", fontSize: "10px", borderRadius: "4px" }}
                itemStyle={{ color: "#d4d4d4" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </CardContent>
  );
}
