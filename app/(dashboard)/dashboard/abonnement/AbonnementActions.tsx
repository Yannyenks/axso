"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface AbonnementActionsProps {
  planId: string;
  planActuel: string;
  couleur: string;
}

export default function AbonnementActions({
  planId,
  planActuel,
  couleur,
}: AbonnementActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const estActuel = planId === planActuel;

  const ORDRE: Record<string, number> = {
    gratuit: 0,
    starter: 1,
    pro: 2,
    business: 3,
  };

  const estSuperieur = ORDRE[planId] > ORDRE[planActuel];

  async function choisirPlan() {
    if (estActuel) return;
    setLoading(true);
    try {
      const res = await fetch("/api/abonnement/changer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur inconnue");
      toast.success(`Plan ${data.plan} activé avec succès !`);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message ?? "Erreur lors du changement de plan");
    } finally {
      setLoading(false);
    }
  }

  if (estActuel) {
    return (
      <button
        disabled
        className="w-full py-2.5 rounded-xl text-sm font-semibold text-gray-400 bg-gray-100 border border-gray-200 cursor-default"
      >
        Plan actuel
      </button>
    );
  }

  return (
    <button
      onClick={choisirPlan}
      disabled={loading}
      className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-70"
      style={
        estSuperieur
          ? {
              backgroundColor: couleur,
              color: couleur === "#F5A623" ? "#1a1a1a" : "#ffffff",
              boxShadow: `0 2px 8px ${couleur}30`,
            }
          : {
              backgroundColor: "#f3f4f6",
              color: "#6b7280",
              border: "1px solid #e5e7eb",
            }
      }
    >
      {loading && <Loader2 size={14} className="animate-spin" />}
      {loading
        ? "Changement..."
        : estSuperieur
        ? "Choisir ce plan"
        : "Rétrograder"}
    </button>
  );
}
