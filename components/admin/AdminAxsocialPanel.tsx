"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Megaphone, Loader2, Trash2, Send } from "lucide-react";

interface Post { id: string; contenu: string | null; type: string; createdAt: string; vues: number; _count: { reactions: number; commentaires: number } }

function tempsEcoule(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return "à l'instant";
  if (h < 24) return `il y a ${h}h`;
  return `il y a ${Math.floor(h / 24)}j`;
}

export function AdminAxsocialPanel({ peutPublier }: { peutPublier: boolean }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [contenu, setContenu] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function charger() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/axsocial");
      const data = await res.json();
      setPosts(data.posts ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { charger(); }, []);

  async function publier() {
    if (!contenu.trim()) { toast.error("Écris un message"); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/axsocial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contenu, type: "post" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Publié sur Axsocial");
      setContenu("");
      charger();
    } catch (e: any) {
      toast.error(e.message ?? "Erreur");
    } finally {
      setSubmitting(false);
    }
  }

  async function supprimer(id: string) {
    if (!confirm("Supprimer cette publication ?")) return;
    try {
      const res = await fetch(`/api/admin/axsocial/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Supprimée");
      charger();
    } catch (e: any) {
      toast.error(e.message ?? "Erreur");
    }
  }

  return (
    <div className="space-y-6">
      {peutPublier && (
        <div className="rounded-2xl p-6 border space-y-3" style={{ background: "#0E1220", borderColor: "rgba(245,166,35,0.2)" }}>
          <div className="flex items-center gap-2">
            <Megaphone size={16} style={{ color: "#F5A623" }} />
            <h2 className="font-semibold" style={{ color: "#ffffff" }}>Nouvelle annonce officielle</h2>
          </div>
          <textarea
            value={contenu} onChange={e => setContenu(e.target.value)} maxLength={2000} rows={4}
            placeholder="Ex : Nouvelle fonctionnalité disponible, maintenance prévue, félicitations aux meilleurs vendeurs du mois…"
            className="w-full px-4 py-3 text-sm rounded-xl border focus:outline-none resize-none"
            style={{ background: "#0B0F1A", borderColor: "rgba(255,255,255,0.1)", color: "#ffffff" }}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs" style={{ color: "#4A5268" }}>{contenu.length}/2000</span>
            <button onClick={publier} disabled={submitting}
              className="flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-xl disabled:opacity-50"
              style={{ background: "linear-gradient(135deg,#F5A623,#d4880d)", color: "#0B0F1A" }}>
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Publier à tous les marchands
            </button>
          </div>
        </div>
      )}

      <div className="rounded-2xl overflow-hidden border" style={{ background: "#0E1220", borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="px-6 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <h2 className="font-semibold" style={{ color: "#ffffff" }}>Publications Axso récentes</h2>
        </div>
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 size={18} className="animate-spin" style={{ color: "#8A93A8" }} /></div>
        ) : posts.length === 0 ? (
          <p className="text-xs text-center py-10" style={{ color: "#4A5268" }}>Aucune publication pour l'instant</p>
        ) : (
          <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            {posts.map(p => (
              <div key={p.id} className="px-6 py-4 flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm" style={{ color: "#ffffff" }}>{p.contenu}</p>
                  <p className="text-[10px] mt-2" style={{ color: "#8A93A8" }}>
                    {tempsEcoule(p.createdAt)} · {p.vues} vues · {p._count.reactions} réactions · {p._count.commentaires} commentaires
                  </p>
                </div>
                {peutPublier && (
                  <button onClick={() => supprimer(p.id)} className="p-1.5 rounded-lg transition-all hover:bg-white/5 flex-shrink-0" style={{ color: "#f87171" }}>
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
