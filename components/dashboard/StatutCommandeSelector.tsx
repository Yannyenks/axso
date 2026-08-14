"use client";
import { useState } from "react";
import { ChevronDown, Loader2, MessageCircle, CheckCircle2, Check } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const STATUTS = [
  { value: "en_attente",     label: "En attente",      color: "#f59e0b" },
  { value: "confirmee",      label: "Confirmée",       color: "#60a5fa" },
  { value: "en_preparation", label: "En préparation",  color: "#FFD280" },
  { value: "expediee",       label: "Expédiée",        color: "#38bdf8" },
  { value: "livree",         label: "Livrée",          color: "#34d399" },
  { value: "annulee",        label: "Annulée",         color: "#f87171" },
];

const LABELS_NOTIF: Record<string, string> = {
  confirmee:      "Commande confirmée",
  en_preparation: "En préparation",
  expediee:       "Expédiée",
  livree:         "Livrée",
  annulee:        "Annulée",
};

interface Props {
  commandeId: string;
  statutActuel: string;
}

export function StatutCommandeSelector({ commandeId, statutActuel }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [statut, setStatut] = useState(statutActuel);
  const [loading, setLoading] = useState(false);
  const [whatsappUrl, setWhatsappUrl] = useState<string | null>(null);
  const [notifEnvoyee, setNotifEnvoyee] = useState(false);

  const current = STATUTS.find(s => s.value === statut) || STATUTS[0];

  async function changerStatut(nouveau: string) {
    if (nouveau === statut) { setOpen(false); return; }
    setLoading(true);
    setOpen(false);
    setWhatsappUrl(null);
    setNotifEnvoyee(false);
    try {
      const res = await fetch(`/api/commandes/${commandeId}/statut`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statut: nouveau }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setStatut(nouveau);

      if (data.envoyeAuto) {
        setNotifEnvoyee(true);
        toast.success(`Statut → ${LABELS_NOTIF[nouveau] ?? nouveau} · Client notifié sur WhatsApp ✅`);
      } else if (data.whatsappUrl) {
        setWhatsappUrl(data.whatsappUrl);
        toast.success(`Statut mis à jour → ${LABELS_NOTIF[nouveau] ?? nouveau}`);
      } else {
        toast.success(`Statut mis à jour → ${LABELS_NOTIF[nouveau] ?? nouveau}`);
      }
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Selector statut */}
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
            <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-gray-100 rounded-xl shadow-xl z-50 overflow-hidden">
              {STATUTS.map(s => (
                <button
                  key={s.value}
                  onClick={() => changerStatut(s.value)}
                  className={`w-full flex items-center gap-2.5 px-4 py-3 text-sm text-left hover:bg-gray-50 transition-colors ${s.value === statut ? "bg-amber-50" : ""}`}
                >
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                  <span className={s.value === statut ? "text-gray-900 font-medium" : "text-gray-600"}>{s.label}</span>
                  {s.value === statut && <Check size={12} className="ml-auto text-[#F5A623]" />}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Notification auto envoyée */}
      {notifEnvoyee && (
        <div className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 border border-green-200 px-3 py-2 rounded-xl">
          <CheckCircle2 size={13} /> Client notifié WhatsApp
        </div>
      )}

      {/* Bouton WhatsApp fallback (quand pas d'API automatique) */}
      {whatsappUrl && !notifEnvoyee && (
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 shadow-sm"
          style={{ background: "#25D366", boxShadow: "0 2px 10px rgba(37,211,102,0.35)" }}
          onClick={() => setWhatsappUrl(null)}
        >
          <MessageCircle size={14} />
          Notifier le client
        </a>
      )}
    </div>
  );
}
