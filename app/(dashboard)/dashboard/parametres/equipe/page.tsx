"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Users, Shield, Eye, Edit, Trash2, UserPlus } from "lucide-react";
import { formatDate } from "@/lib/utils";

const ROLES: Record<string, { label: string; color: string; desc: string }> = {
  admin: { label: "Admin", color: "#F5A623", desc: "Accès complet à tous les paramètres" },
  editeur: { label: "Éditeur", color: "#7c3aed", desc: "Peut gérer produits et commandes" },
  lecteur: { label: "Lecteur", color: "#6b7280", desc: "Accès en lecture seule" },
};

export default function EquipePage() {
  const [membres, setMembres] = useState<any[]>([]);
  const [form, setForm] = useState({ email: "", nom: "", role: "editeur" });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [supprimant, setSupprimant] = useState<string | null>(null);

  async function charger() {
    const res = await fetch("/api/tenants/moi-complet");
    const tenant = await res.json();
    if (tenant?.id) {
      const res2 = await fetch("/api/equipe/liste");
      const data = await res2.json();
      setMembres(data.membres || []);
    }
    setLoading(false);
  }

  useEffect(() => { charger(); }, []);

  async function inviter(e: React.FormEvent) {
    e.preventDefault();
    if (!form.email) return;
    setSaving(true);
    try {
      const res = await fetch("/api/equipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      toast.success("Invitation envoyée !");
      setForm({ email: "", nom: "", role: "editeur" });
      charger();
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de l'invitation");
    } finally {
      setSaving(false);
    }
  }

  async function supprimer(id: string) {
    if (!confirm("Retirer ce membre de l'équipe ?")) return;
    setSupprimant(id);
    try {
      await fetch(`/api/equipe?id=${id}`, { method: "DELETE" });
      toast.success("Membre retiré");
      charger();
    } catch {
      toast.error("Erreur");
    } finally {
      setSupprimant(null);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-poppins">Équipe</h1>
          <p className="text-gray-400 text-sm mt-1">{membres.length} membre(s) dans votre équipe</p>
        </div>
      </div>

      {/* Liste membres */}
      <div className="bg-white border border-white/5 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-white/5 flex items-center gap-2">
          <Users size={15} className="text-[#F5A623]" />
          <h2 className="text-gray-800 font-semibold">Membres de l'équipe</h2>
        </div>
        {loading ? (
          <div className="p-12 text-center text-gray-600">Chargement...</div>
        ) : membres.length === 0 ? (
          <div className="p-12 text-center text-gray-600">
            <Users size={32} className="mx-auto mb-3 opacity-30" />
            <p>Aucun membre ajouté</p>
            <p className="text-xs mt-1">Invitez des collaborateurs pour gérer votre boutique</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {membres.map((m) => {
              const role = ROLES[m.role] || ROLES.lecteur;
              return (
                <div key={m.id} className="p-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                      <span className="text-gray-900 font-bold text-sm">{(m.nom || m.email).slice(0, 2).toUpperCase()}</span>
                    </div>
                    <div>
                      <p className="text-gray-800 font-medium text-sm">{m.nom || m.email}</p>
                      <p className="text-gray-500 text-xs">{m.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs px-2 py-0.5 rounded-lg font-medium" style={{ color: role.color, backgroundColor: `${role.color}15`, border: `1px solid ${role.color}30` }}>
                          {role.label}
                        </span>
                        <span className={`text-xs ${m.actif ? "text-green-400" : "text-yellow-400"}`}>
                          {m.actif ? "Actif" : "Invitation en attente"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-gray-600 text-xs hidden sm:block">{formatDate(m.createdAt)}</p>
                    <button onClick={() => supprimer(m.id)} disabled={supprimant === m.id} className="text-gray-600 hover:text-red-400 transition-colors disabled:opacity-50">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Rôles */}
      <div className="bg-white border border-white/5 rounded-2xl p-5">
        <h3 className="text-gray-800 font-semibold text-sm mb-3">Niveaux d'accès</h3>
        <div className="space-y-2">
          {Object.entries(ROLES).map(([key, role]) => (
            <div key={key} className="flex items-start gap-3">
              <span className="text-xs px-2 py-0.5 rounded-lg mt-0.5 font-medium flex-shrink-0" style={{ color: role.color, backgroundColor: `${role.color}15`, border: `1px solid ${role.color}30` }}>
                {role.label}
              </span>
              <p className="text-gray-400 text-xs">{role.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Formulaire d'invitation */}
      <form onSubmit={inviter} className="bg-white border border-white/5 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <UserPlus size={15} className="text-[#F5A623]" />
          <h2 className="text-gray-800 font-semibold">Inviter un membre</h2>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-gray-400 text-xs block mb-2">Email *</label>
            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required placeholder="collaborateur@example.com" className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-gray-900 text-sm focus:outline-none focus:border-[#F5A623]/50" />
          </div>
          <div>
            <label className="text-gray-400 text-xs block mb-2">Prénom / Nom</label>
            <input value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} placeholder="Ex: Aminata Diallo" className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-gray-900 text-sm focus:outline-none focus:border-[#F5A623]/50" />
          </div>
        </div>
        <div>
          <label className="text-gray-400 text-xs block mb-2">Rôle</label>
          <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-gray-900 text-sm focus:outline-none focus:border-[#F5A623]/50">
            {Object.entries(ROLES).map(([key, role]) => (
              <option key={key} value={key}>{role.label}  {role.desc}</option>
            ))}
          </select>
        </div>
        <button type="submit" disabled={saving} className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-50" style={{ backgroundColor: "#F5A623", color: "#0a0a0a" }}>
          <UserPlus size={15} />
          {saving ? "Invitation..." : "Envoyer l'invitation"}
        </button>
      </form>
    </div>
  );
}

