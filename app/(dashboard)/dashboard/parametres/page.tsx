"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Save, Globe, Bell, Users, ExternalLink, Copy, Check, Settings } from "lucide-react";
import Link from "next/link";

const PAYS = ["Sénégal", "Côte d'Ivoire", "Mali", "Burkina Faso", "Guinée", "Cameroun", "Bénin", "Togo", "Niger", "Mauritanie", "Gabon", "Congo", "RDC", "Madagascar", "France", "Maroc", "Tunisie", "Algérie", "Autre"];
const DEVISES = ["XOF", "XAF", "GNF", "MAD", "TND", "EUR", "USD"];
const CATEGORIES = ["Mode & Vêtements", "Électronique", "Alimentation", "Beauté & Cosmétiques", "Maison & Décoration", "Sport & Loisirs", "Livres & Culture", "Artisanat", "Services", "Autre"];

export default function ParametresPage() {
  const [tenant, setTenant] = useState<any>(null);
  const [form, setForm] = useState({
    nomBoutique: "", description: "", whatsapp: "", telephone: "", adresse: "", email: "",
    categorie: "", pays: "", devise: "XOF",
  });
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/tenants/moi-complet").then(r => r.json()).then(data => {
      if (data) {
        setTenant(data);
        setForm({
          nomBoutique: data.nomBoutique || "",
          description: data.description || "",
          whatsapp: data.whatsapp || "",
          telephone: data.telephone || "",
          adresse: data.adresse || "",
          email: data.email || "",
          categorie: data.categorie || "",
          pays: data.pays || "",
          devise: data.devise || "XOF",
        });
      }
    });
  }, []);

  async function sauvegarder(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/tenants", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      toast.success("Informations mises à jour !");
    } catch {
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  }

  function copier(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const boutiquUrl = tenant ? `https://${tenant.slug}.axso.com` : "";

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 font-playfair">Paramètres</h1>
        <p className="text-gray-400 text-sm mt-1">Gérez votre boutique {tenant?.nomBoutique || ""}</p>
      </div>

      {/* URL boutique */}
      {tenant && (
        <div className="bg-[#F5A623]/10 border border-[#F5A623]/30 rounded-2xl p-5">
          <p className="text-[#F5A623] text-sm font-semibold mb-2">Votre boutique en ligne</p>
          <div className="flex items-center gap-3">
            <p className="text-gray-700 font-mono text-sm flex-1">{boutiquUrl}</p>
            <button onClick={() => copier(boutiquUrl)} className="text-[#F5A623] hover:text-gray-700 transition-colors">
              {copied ? <Check size={15} /> : <Copy size={15} />}
            </button>
            <a href={`/${tenant.slug}`} target="_blank" rel="noopener noreferrer" className="text-[#F5A623] hover:text-gray-700 transition-colors">
              <ExternalLink size={15} />
            </a>
          </div>
        </div>
      )}

      {/* Navigation paramètres */}
      <div className="grid grid-cols-1 gap-2">
        {[
          { icone: Globe, titre: "Domaine personnalisé", desc: "Connectez votre propre nom de domaine", href: "/dashboard/parametres/domaine", couleur: "#10b981" },
          { icone: Bell, titre: "Notifications", desc: "Configurez vos alertes WhatsApp et email", href: "/dashboard/parametres/notifications", couleur: "#f59e0b" },
          { icone: Users, titre: "Équipe", desc: "Gérez les accès de vos collaborateurs", href: "/dashboard/parametres/equipe", couleur: "#ec4899" },
        ].map((s, i) => {
          const Icone = s.icone;
          return (
            <Link key={i} href={s.href}>
              <div className="flex items-center gap-4 bg-white border border-white/5 rounded-2xl p-4 hover:border-white/10 transition-all group cursor-pointer">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${s.couleur}15`, border: `1px solid ${s.couleur}30` }}>
                  <Icone size={16} style={{ color: s.couleur }} />
                </div>
                <div className="flex-1">
                  <p className="text-gray-800 font-medium text-sm group-hover:text-[#F5A623] transition-colors">{s.titre}</p>
                  <p className="text-gray-500 text-xs">{s.desc}</p>
                </div>
                <span className="text-gray-600 text-sm">?</span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Formulaire informations générales */}
      <form onSubmit={sauvegarder} className="bg-white border border-white/5 rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-2 mb-2">
          <Settings size={15} className="text-[#F5A623]" />
          <h2 className="text-gray-800 font-semibold">Informations générales</h2>
        </div>

        <div>
          <label className="text-gray-400 text-xs block mb-2">Nom de la boutique *</label>
          <input value={form.nomBoutique} onChange={e => setForm({ ...form, nomBoutique: e.target.value })} required className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-gray-900 text-sm focus:outline-none focus:border-[#F5A623]/50" />
        </div>

        <div>
          <label className="text-gray-400 text-xs block mb-2">Description</label>
          <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Décrivez votre boutique en quelques mots..." className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-gray-900 text-sm focus:outline-none focus:border-[#F5A623]/50 resize-none" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-gray-400 text-xs block mb-2">Email de contact</label>
            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-gray-900 text-sm focus:outline-none focus:border-[#F5A623]/50" />
          </div>
          <div>
            <label className="text-gray-400 text-xs block mb-2">WhatsApp *</label>
            <input value={form.whatsapp} onChange={e => setForm({ ...form, whatsapp: e.target.value })} placeholder="+221700000000" className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-gray-900 text-sm focus:outline-none focus:border-[#F5A623]/50" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-gray-400 text-xs block mb-2">Téléphone</label>
            <input value={form.telephone} onChange={e => setForm({ ...form, telephone: e.target.value })} className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-gray-900 text-sm focus:outline-none focus:border-[#F5A623]/50" />
          </div>
          <div>
            <label className="text-gray-400 text-xs block mb-2">Adresse physique</label>
            <input value={form.adresse} onChange={e => setForm({ ...form, adresse: e.target.value })} className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-gray-900 text-sm focus:outline-none focus:border-[#F5A623]/50" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="text-gray-400 text-xs block mb-2">Catégorie</label>
            <select value={form.categorie} onChange={e => setForm({ ...form, categorie: e.target.value })} className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-gray-900 text-sm focus:outline-none focus:border-[#F5A623]/50">
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-gray-400 text-xs block mb-2">Pays</label>
            <select value={form.pays} onChange={e => setForm({ ...form, pays: e.target.value })} className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-gray-900 text-sm focus:outline-none focus:border-[#F5A623]/50">
              {PAYS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="text-gray-400 text-xs block mb-2">Devise</label>
            <select value={form.devise} onChange={e => setForm({ ...form, devise: e.target.value })} className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-gray-900 text-sm focus:outline-none focus:border-[#F5A623]/50">
              {DEVISES.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>

        <button type="submit" disabled={saving} className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-50" style={{ backgroundColor: "#F5A623", color: "#0a0a0a" }}>
          <Save size={15} />
          {saving ? "Enregistrement..." : "Enregistrer"}
        </button>
      </form>

      {/* Plan actuel */}
      {tenant && (
        <div className="bg-white border border-white/5 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-gray-800 font-semibold">Plan actuel</h3>
            <span className="text-[#F5A623] text-xs bg-[#F5A623]/10 px-3 py-1 rounded-lg border border-[#F5A623]/20 font-medium">
              {tenant.planType?.toUpperCase()}
            </span>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Commission Axso</span>
              <span className="text-gray-700">{((tenant.commissionRate || 0.03) * 100).toFixed(0)}% par vente</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Actif depuis</span>
              <span className="text-gray-700">{new Date(tenant.createdAt).toLocaleDateString("fr-FR")}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

