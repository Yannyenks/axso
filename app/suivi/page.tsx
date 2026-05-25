"use client";
import { useState } from "react";
import { Search, Package, Truck, CheckCircle, Clock, MapPin, Phone, ArrowLeft, AlertCircle } from "lucide-react";
import Link from "next/link";

const ETAPES = [
  { statut: "en_attente", label: "Commande reçue", icon: Clock },
  { statut: "confirmee", label: "Confirmée", icon: CheckCircle },
  { statut: "en_preparation", label: "En préparation", icon: Package },
  { statut: "en_livraison", label: "En livraison", icon: Truck },
  { statut: "livree", label: "Livrée", icon: CheckCircle },
];

const ORDRE = ["en_attente", "confirmee", "en_preparation", "en_livraison", "livree"];

export default function SuiviPage() {
  const [numero, setNumero] = useState("");
  const [commande, setCommande] = useState<any>(null);
  const [erreur, setErreur] = useState("");
  const [recherche, setRecherche] = useState(false);

  async function chercher(e: React.FormEvent) {
    e.preventDefault();
    if (!numero.trim()) return;
    setRecherche(true);
    setErreur("");
    setCommande(null);
    try {
      const res = await fetch(`/api/suivi?numero=${encodeURIComponent(numero.trim())}`);
      const data = await res.json();
      if (!res.ok || !data.commande) {
        setErreur("Commande introuvable. Vérifiez votre numéro de commande.");
      } else {
        setCommande(data.commande);
      }
    } catch {
      setErreur("Erreur de connexion. Réessayez dans quelques instants.");
    } finally {
      setRecherche(false);
    }
  }

  const etapeActuelle = commande ? ORDRE.indexOf(commande.statut) : -1;

  const statutColors: Record<string, string> = {
    en_attente: "#f59e0b",
    confirmee: "#60a5fa",
    en_preparation: "#a78bfa",
    en_livraison: "#F5A623",
    livree: "#34d399",
    annulee: "#f87171",
  };

  return (
    <div className="min-h-screen bg-[#050508] text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-white/5 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
            <ArrowLeft size={16} />
            <span className="text-sm">Accueil</span>
          </Link>
          <div className="font-playfair font-bold text-[#F5A623] text-lg">Axso</div>
          <div className="w-20" />
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-12 space-y-8">
        {/* Titre */}
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#F5A623]/10 border border-[#F5A623]/20 flex items-center justify-center mx-auto mb-4">
            <Package size={28} className="text-[#F5A623]" />
          </div>
          <h1 className="text-3xl font-bold font-playfair mb-2">Suivre ma commande</h1>
          <p className="text-gray-400">Entrez votre numéro de commande pour voir l'état de votre livraison</p>
        </div>

        {/* Formulaire de recherche */}
        <form onSubmit={chercher} className="bg-white border border-white/5 rounded-2xl p-6">
          <label className="text-gray-400 text-sm block mb-3">Numéro de commande</label>
          <div className="flex gap-3">
            <input
              value={numero}
              onChange={e => setNumero(e.target.value.toUpperCase())}
              placeholder="AXS-2024-XXXX"
              className="flex-1 bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-[#F5A623]/50 placeholder:text-gray-600"
            />
            <button
              type="submit"
              disabled={recherche || !numero.trim()}
              className="flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: "#F5A623", color: "#0a0a0a" }}
            >
              {recherche ? (
                <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                <Search size={16} />
              )}
              {recherche ? "..." : "Suivre"}
            </button>
          </div>
          <p className="text-gray-600 text-xs mt-2">Le numéro de commande figure sur votre email de confirmation.</p>
        </form>

        {/* Erreur */}
        {erreur && (
          <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-2xl p-5">
            <AlertCircle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-300 text-sm">{erreur}</p>
          </div>
        )}

        {/* Résultat */}
        {commande && (
          <div className="space-y-4">
            {/* Header commande */}
            <div className="bg-white border border-white/5 rounded-2xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-gray-400 text-xs mb-1">Commande</p>
                  <p className="text-white font-mono font-bold text-lg">{commande.numero}</p>
                  <p className="text-gray-500 text-xs mt-1">{commande.tenant?.nomBoutique}</p>
                </div>
                {commande.statut === "annulee" ? (
                  <span className="text-xs px-3 py-1.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/20 font-medium">Annulée</span>
                ) : (
                  <span className="text-xs px-3 py-1.5 rounded-full font-medium border" style={{
                    backgroundColor: `${statutColors[commande.statut]}15`,
                    color: statutColors[commande.statut],
                    borderColor: `${statutColors[commande.statut]}30`,
                  }}>
                    {ETAPES.find(e => e.statut === commande.statut)?.label || commande.statut}
                  </span>
                )}
              </div>

              {/* Progression */}
              {commande.statut !== "annulee" && (
                <div className="mt-6">
                  <div className="flex items-center gap-0">
                    {ETAPES.map((etape, i) => {
                      const actif = i <= etapeActuelle;
                      const courant = i === etapeActuelle;
                      const Icon = etape.icon;
                      return (
                        <div key={etape.statut} className="flex items-center flex-1">
                          <div className="flex flex-col items-center">
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all"
                              style={{
                                backgroundColor: actif ? "#F5A623" : "#1a1a2e",
                                borderColor: actif ? "#F5A623" : "#2a2a3e",
                              }}
                            >
                              <Icon size={14} className={actif ? "text-black" : "text-gray-600"} />
                            </div>
                            <p className={`text-[9px] mt-1.5 text-center leading-tight max-w-[60px] ${actif ? "text-[#F5A623]" : "text-gray-600"} ${courant ? "font-bold" : ""}`}>
                              {etape.label}
                            </p>
                          </div>
                          {i < ETAPES.length - 1 && (
                            <div className="flex-1 h-0.5 mx-1 mb-5" style={{ backgroundColor: i < etapeActuelle ? "#F5A623" : "#1a1a2e" }} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Détails livraison */}
            <div className="bg-white border border-white/5 rounded-2xl p-6 space-y-4">
              <h3 className="text-white font-semibold">Informations de livraison</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <MapPin size={15} className="text-[#F5A623] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-gray-400 text-xs">Adresse de livraison</p>
                    <p className="text-white text-sm">{commande.adresseLivraison}, {commande.ville}</p>
                  </div>
                </div>
                {commande.livreur && (
                  <div className="flex items-start gap-3">
                    <Truck size={15} className="text-[#F5A623] mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-gray-400 text-xs">Livreur assigné</p>
                      <p className="text-white text-sm">{commande.livreur.nom}</p>
                      {commande.livreur.telephone && (
                        <a href={`tel:${commande.livreur.telephone}`} className="flex items-center gap-1 text-[#F5A623] text-xs mt-0.5 hover:underline">
                          <Phone size={11} />
                          {commande.livreur.telephone}
                        </a>
                      )}
                    </div>
                  </div>
                )}
                {commande.numeroSuivi && (
                  <div className="flex items-start gap-3">
                    <Package size={15} className="text-[#F5A623] mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-gray-400 text-xs">Numéro de suivi transporteur</p>
                      <p className="text-white text-sm font-mono">{commande.numeroSuivi}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Articles */}
            <div className="bg-white border border-white/5 rounded-2xl p-6">
              <h3 className="text-white font-semibold mb-4">Articles commandés</h3>
              <div className="space-y-3">
                {commande.lignes?.map((ligne: any, i: number) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white/5 flex-shrink-0 overflow-hidden">
                      {ligne.imageUrl
                        ? <img src={ligne.imageUrl} alt={ligne.nom} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-sm">📦</div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm truncate">{ligne.nom}</p>
                      {ligne.variante && <p className="text-gray-500 text-xs">{ligne.variante}</p>}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-white text-sm">x{ligne.quantite}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Contact boutique */}
            {commande.tenant?.whatsapp && (
              <div className="bg-white border border-white/5 rounded-2xl p-5 flex items-center justify-between">
                <div>
                  <p className="text-white font-medium text-sm">Besoin d'aide ?</p>
                  <p className="text-gray-500 text-xs">Contactez {commande.tenant.nomBoutique}</p>
                </div>
                <a
                  href={`https://wa.me/${commande.tenant.whatsapp.replace(/\D/g, "")}?text=Bonjour, j'ai une question sur ma commande ${commande.numero}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-green-500/15 text-green-400 border border-green-500/20 hover:bg-green-500/20 transition-colors"
                >
                  <Phone size={14} />
                  WhatsApp
                </a>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
