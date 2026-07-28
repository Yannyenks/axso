"use client";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";

interface DonneeVente { date: string; montant: number; commandes: number; }
interface SalesChartProps { donnees: DonneeVente[]; devise?: string; }

function TooltipCustom({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#fff",
      border: "1px solid #EBEBEB",
      borderRadius: "14px",
      padding: "10px 14px",
      boxShadow: "0 8px 32px rgba(0,0,0,0.10)",
      fontFamily: "'Poppins',system-ui,sans-serif",
      minWidth: "130px",
    }}>
      <p style={{ fontSize: "11px", color: "#AAA", marginBottom: "6px", fontWeight: 500 }}>{label}</p>
      <p style={{ fontSize: "15px", fontWeight: 700, color: "#111", marginBottom: "2px", fontVariantNumeric: "tabular-nums" }}>
        {payload[0]?.value?.toLocaleString("fr-FR")} <span style={{ fontSize: "11px", color: "#AAA", fontWeight: 500 }}>F</span>
      </p>
      {payload[1]?.value > 0 && (
        <p style={{ fontSize: "11.5px", color: "#888", fontWeight: 500 }}>
          {payload[1]?.value} commande{payload[1]?.value > 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}

export function SalesChart({ donnees, devise = "XOF" }: SalesChartProps) {
  const total   = donnees.reduce((s, d) => s + d.montant, 0);
  const maxVal  = Math.max(...donnees.map(d => d.montant), 1);
  const avgLine = total / Math.max(donnees.length, 1);

  if (!donnees?.length) {
    return (
      <div className="ax-card p-6 h-72 flex flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-[#F5F5F7] flex items-center justify-center">
          <span style={{ fontSize: "22px" }}>📊</span>
        </div>
        <p className="text-[13px] text-[#AAAAAA] font-medium">Aucune donnée disponible</p>
        <p className="text-[11.5px] text-[#CCCCCC]">Les ventes apparaîtront ici</p>
      </div>
    );
  }

  return (
    <div className="ax-card p-5">
      {/* Header */}
      <div className="flex items-start justify-between mb-5 gap-4">
        <div>
          <h3 className="text-[14px] font-bold text-[#111111] tracking-tight">Ventes — 30 derniers jours</h3>
          <p className="text-[11.5px] text-[#AAAAAA] mt-0.5">Chiffre d'affaires journalier</p>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span className="text-[13px] font-bold text-[#111]" style={{ fontVariantNumeric: "tabular-nums" }}>
            {total.toLocaleString("fr-FR")} F
          </span>
          <span className="text-[10.5px] text-[#F5A623] bg-[#FFF8EC] border border-[#F5A623]/20 px-2.5 py-0.5 rounded-full font-semibold">
            total période
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={230}>
        <AreaChart data={donnees} margin={{ top: 8, right: 4, left: -22, bottom: 0 }}>
          <defs>
            <linearGradient id="gradCA" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#F5A623" stopOpacity={0.18} />
              <stop offset="100%" stopColor="#F5A623" stopOpacity={0}    />
            </linearGradient>
            <linearGradient id="gradCmd" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#7C3AED" stopOpacity={0.1} />
              <stop offset="100%" stopColor="#7C3AED" stopOpacity={0}   />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="2 4" stroke="#F0F0F0" vertical={false} />
          <XAxis
            dataKey="date"
            stroke="transparent"
            tick={{ fill: "#C4C4C4", fontSize: 10.5, fontFamily: "'Poppins',sans-serif", fontWeight: 500 }}
            tickLine={false}
            axisLine={false}
            interval={4}
          />
          <YAxis
            stroke="transparent"
            tick={{ fill: "#C4C4C4", fontSize: 10.5, fontFamily: "'Poppins',sans-serif" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
          />
          <Tooltip content={<TooltipCustom />} cursor={{ stroke: "#F5A623", strokeWidth: 1.5, strokeDasharray: "4 3" }} />
          <ReferenceLine y={avgLine} stroke="#EBEBEB" strokeDasharray="4 3" />
          <Area
            type="monotone"
            dataKey="montant"
            stroke="#F5A623"
            strokeWidth={2.5}
            fill="url(#gradCA)"
            dot={false}
            activeDot={{ r: 5, fill: "#F5A623", stroke: "#fff", strokeWidth: 2 }}
          />
          <Area
            type="monotone"
            dataKey="commandes"
            stroke="#7C3AED"
            strokeWidth={1.5}
            fill="url(#gradCmd)"
            dot={false}
            activeDot={{ r: 4, fill: "#7C3AED", stroke: "#fff", strokeWidth: 2 }}
            strokeOpacity={0.5}
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[#F3F3F3]">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-1.5 rounded-full bg-[#F5A623]" />
          <span className="text-[11px] text-[#AAAAAA] font-medium">CA (F)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-1.5 rounded-full bg-[#7C3AED] opacity-60" />
          <span className="text-[11px] text-[#AAAAAA] font-medium">Commandes</span>
        </div>
        <div className="flex items-center gap-1.5 ml-auto">
          <div className="w-3 h-[1px] bg-[#EBEBEB]" style={{ borderTop: "1px dashed #EBEBEB" }} />
          <span className="text-[11px] text-[#CCCCCC]">Moyenne</span>
        </div>
      </div>
    </div>
  );
}
