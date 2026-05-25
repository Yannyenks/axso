import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface MetricCardProps {
  titre: string;
  valeur: string;
  tendance?: number;
  icone: LucideIcon;
  couleur?: string;
  description?: string;
}

export function MetricCard({ titre, valeur, tendance, icone: Icone, couleur = "#F5A623", description }: MetricCardProps) {
  const hausse = tendance !== undefined && tendance >= 0;

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 hover:border-[#F5A623]/30 hover:shadow-md transition-all group shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
          style={{ backgroundColor: `${couleur}15`, border: `1px solid ${couleur}30` }}
        >
          <Icone size={18} style={{ color: couleur }} />
        </div>
        {tendance !== undefined && (
          <div className={cn(
            "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg",
            hausse ? "bg-green-50 text-green-600 border border-green-100" : "bg-red-50 text-red-500 border border-red-100"
          )}>
            {hausse ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {Math.abs(tendance)}%
          </div>
        )}
      </div>

      <div>
        <p className="text-gray-400 text-sm mb-1">{titre}</p>
        <p className="text-gray-900 text-2xl font-bold font-playfair">{valeur}</p>
        {description && <p className="text-gray-400 text-xs mt-1">{description}</p>}
      </div>
    </div>
  );
}
