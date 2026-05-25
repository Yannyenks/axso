"use client";
// Dashboard  Email Marketing
"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Send, Users } from "lucide-react";

const TEMPLATES = [
  { id: "promotion", titre: "Promotion spéciale", desc: "Annoncez une promotion ou un solde" },
  { id: "nouveau-produit", titre: "Nouveau produit", desc: "Présentez une nouveauté" },
  { id: "bienvenue", titre: "Message de bienvenue", desc: "Accueillez les nouveaux clients" },
  { id: "relance", titre: "Relance panier", desc: "Relancez les abandons de panier" },
];

export default function EmailMarketingPage() {
  const [template, setTemplate] = useState("promotion");
  const [sujet, setSujet] = useState("");
  const [corps, setCorps] = useState("");
  const [segment, setSegment] = useState("tous");
  const [sending, setSending] = useState(false);

  async function envoyer() {
    if (!sujet || !corps) { toast.error("Remplissez le sujet et le message"); return; }
    setSending(true);
    try {
      const res = await fetch("/api/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template, sujet, corps, segment }),
      });
      if (!res.ok) throw new Error();
      toast.success("Campagne email envoyée !");
      setSujet("");
      setCorps("");
    } catch {
      toast.error("Erreur lors de l'envoi");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 font-playfair">Email Marketing</h1>
        <p className="text-gray-400 text-sm mt-1">Contactez vos clients directement par email</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {TEMPLATES.map((t) => (
          <button key={t.id} onClick={() => setTemplate(t.id)} className="text-left p-4 rounded-2xl border-2 transition-all" style={{ borderColor: template === t.id ? "#F5A623" : "#1a1a1a", backgroundColor: template === t.id ? "#F5A62310" : "#111" }}>
            <p className="text-gray-800 font-semibold text-sm">{t.titre}</p>
            <p className="text-gray-400 text-xs mt-1">{t.desc}</p>
          </button>
        ))}
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4">
        <h2 className="text-gray-800 font-semibold">Composer la campagne</h2>

        <div>
          <label className="text-gray-400 text-xs block mb-2">Segment destinataires</label>
          <select value={segment} onChange={(e) => setSegment(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 text-sm focus:outline-none focus:border-[#F5A623]/50">
            <option value="tous">Tous les clients</option>
            <option value="nouveaux">Nouveaux clients (1 commande)</option>
            <option value="reguliers">Clients réguliers (2-4 commandes)</option>
            <option value="vip">Clients VIP (5+ commandes)</option>
          </select>
        </div>

        <div>
          <label className="text-gray-400 text-xs block mb-2">Sujet de l'email *</label>
          <input value={sujet} onChange={(e) => setSujet(e.target.value)} placeholder="Ex: Soldes d'été  -25% sur tout !" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 text-sm focus:outline-none focus:border-[#F5A623]/50" />
        </div>

        <div>
          <label className="text-gray-400 text-xs block mb-2">Corps du message *</label>
          <textarea value={corps} onChange={(e) => setCorps(e.target.value)} placeholder="Bonjour {prenom},&#10;&#10;Nous avons une offre exceptionnelle pour vous..." rows={6} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 text-sm focus:outline-none focus:border-[#F5A623]/50 resize-none" />
          <p className="text-gray-500 text-xs mt-1">Utilisez {"{prenom}"} et {"{boutique}"} comme variables</p>
        </div>

        <button onClick={envoyer} disabled={sending} className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-50" style={{ backgroundColor: "#F5A623", color: "#0a0a0a" }}>
          <Send size={16} />
          {sending ? "Envoi en cours..." : "Envoyer la campagne"}
        </button>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-3">
          <Users size={16} className="text-[#F5A623]" />
          <span className="text-gray-800 font-semibold">Powered by Resend</span>
        </div>
        <p className="text-gray-400 text-sm">Les emails sont envoyés via Resend avec un template HTML responsive adapté pour les clients africains.</p>
      </div>
    </div>
  );
}

