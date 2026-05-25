"use client";
import { useState } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const STATUTS = [
  { value: "en_attente",     label: "En attente",      color: "#f59e0b" },
  { value: "confirmee",      label: "Confirmée",       color: "#60a5fa" },
  { value: "en_preparation", label: "En préparation",  color: "#a78bfa" },
  { value: "expediee",       label: "Expédiée",        color: "#38bdf8" },
  { value: "livree",         label: "Livrée",          color: "#34d399" },
  { value: "annulee",        label: "Annulée",         color: "#f87171" },
];

interface Props {
  commandeId: string;
  statutActuel: string;
}

export function StatutCommandeSelector({ commandeId, statutActuel }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [statut, setStatut] = useState(statutActuel);
  const [loading, setLoading] = useState(false);

  const current = STATUTS.find(s => s.value === statut) || STATUTS[0];

  async function changerStatut(nouveau: string) {
    if (nouveau === statut) { setOpen(false); return; }
    setLoading(true);
    setOpen(false);
    try {
      const res = await fetch(`/api/commandes/${commandeId}/statut`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statut: nouveau }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setStatut(nouveau);
      toast.success(`Statut mis à jour : ${STATUTS.find(s => s.value === nouveau)?.label}`);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        disabled={loading || statut === "livree" || statut === "annulee"}
        className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-xl text-sm hover:border-[#F5A623]/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
      >
        {loading ? (
          <Loader2 size={13} className="animate-spin text-[#F5A623]" />
        ) : (
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: current.color }} />
        )}
        <span className="text-gray-800 font-medium">{current.label}</span>
        {!loading && statut !== "livree" && statut !== "annulee" && (
          <ChevronDown size={13} className="text-gray-500" />
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-xl z-50 overflow-hidden">
            {STATUTS.map(s => (
              <button
                key={s.value}
                onClick={() => changerStatut(s.value)}
                className={`w-full flex items-center gap-2.5 px-4 py-3 text-sm text-left hover:bg-gray-50 transition-colors ${s.value === statut ? "bg-amber-50" : ""}`}
              >
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                <span className={s.value === statut ? "text-gray-900 font-medium" : "text-gray-600"}>{s.label}</span>
                {s.value === statut && <span className="ml-auto text-[#F5A623] text-xs">✓</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
