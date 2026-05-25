"use client";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

interface DonneeVente {
  date: string;
  montant: number;
  commandes: number;
}

interface SalesChartProps {
  donnees: DonneeVente[];
  devise?: string;
}

function TooltipCustom({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-3 shadow-xl">
      <p className="text-gray-400 text-xs mb-2">{label}</p>
      <p className="text-[#F5A623] font-bold text-sm">
        {payload[0]?.value?.toLocaleString("fr-FR")} F
      </p>
      <p className="text-gray-400 text-xs">{payload[1]?.value} commandes</p>
    </div>
  );
}

export function SalesChart({ donnees, devise = "XOF" }: SalesChartProps) {
  if (!donnees?.length) {
    return (
      <div className="bg-white border border-gray-100 rounded-2xl p-6 h-72 flex items-center justify-center shadow-sm">
        <p className="text-gray-400">Aucune donnée disponible</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-gray-900 font-semibold">Ventes — 30 derniers jours</h3>
        <span className="text-[#F5A623] text-xs bg-amber-50 border border-amber-100 px-3 py-1 rounded-lg font-medium">
          {donnees.reduce((s, d) => s + d.montant, 0).toLocaleString("fr-FR")} F total
        </span>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={donnees} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="gradOr" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#F5A623" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#F5A623" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis dataKey="date" stroke="#e5e7eb" tick={{ fill: "#9ca3af", fontSize: 11 }} />
          <YAxis stroke="#e5e7eb" tick={{ fill: "#9ca3af", fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
          <Tooltip content={<TooltipCustom />} />
          <Area type="monotone" dataKey="montant" stroke="#F5A623" strokeWidth={2} fill="url(#gradOr)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
