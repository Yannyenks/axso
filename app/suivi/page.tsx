"use client";
import { useState } from "react";
import { Search, Package, Truck, CheckCircle, Clock, MapPin, Phone, ArrowLeft, AlertCircle, ShoppingBag } from "lucide-react";
import Link from "next/link";

const ETAPES = [
  { statut: "en_attente",    label: "Reçue",        Icon: Clock         },
  { statut: "confirmee",     label: "Confirmée",    Icon: CheckCircle   },
  { statut: "en_preparation",label: "Préparation",  Icon: Package       },
  { statut: "en_livraison",  label: "En route",     Icon: Truck         },
  { statut: "livree",        label: "Livrée",       Icon: CheckCircle   },
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

  return (
    <div className="min-h-screen bg-[#080808] text-white flex flex-col"
      style={{ fontFamily: "'Poppins','Century Gothic',system-ui,sans-serif" }}>

      {/* Glow ambiant */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] pointer-events-none"
        style={{ background: "radial-gradient(ellipse, rgba(245,166,35,0.07) 0%, transparent 70%)" }} />

      {/* Header */}
      <header className="relative z-10 border-b border-white/5 px-5 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors text-[13px]">
            <ArrowLeft size={15} />
            Accueil
          </Link>
          <span className="font-bold text-[17px] tracking-tight"
            style={{ background: "linear-gradient(135deg,#F5A623,#d4880d)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
            AXSO
          </span>
          <div className="w-20" />
        </div>
      </header>

      <main className="relative z-10 flex-1 max-w-2xl mx-auto w-full px-5 py-14 space-y-6">

        {/* Hero */}
        <div className="text-center mb-10">
          <div className="w-14 h-14 rounded-2xl mx-auto mb-5 flex items-center justify-center"
            style={{ background: "rgba(245,166,35,0.08)", border: "1px solid rgba(245,166,35,0.2)" }}>
            <Package size={24} style={{ color: "#F5A623" }} />
          </div>
          <h1 className="text-3xl font-bold mb-2 tracking-tight">Suivre ma commande</h1>
          <p className="text-white/35 text-[14px]">Entrez votre numéro pour voir l'état en temps réel</p>
        </div>

        {/* Formulaire */}
        <form onSubmit={chercher}
          className="rounded-2xl p-5 space-y-3"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <label className="text-[11px] font-bold text-white/35 uppercase tracking-widest">
            Numéro de commande
          </label>
          <div className="flex gap-2">
            <input
              value={numero}
              onChange={e => setNumero(e.target.value.toUpperCase())}
              placeholder="AXS-2024-XXXX"
              className="flex-1 rounded-xl px-4 py-3 text-white font-mono text-[13px] outline-none transition-all"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
              onFocus={e => (e.target.style.borderColor = "rgba(245,166,35,0.4)")}
              onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
            />
            <button
              type="submit"
              disabled={recherche || !numero.trim()}
              className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-[13px] transition-all disabled:opacity-40"
              style={{ background: "linear-gradient(135deg,#F5A623,#d4880d)", color: "#080808" }}>
              {recherche
                ? <div className="w-4 h-4 border-2 border-black/20 border-t-black/70 rounded-full animate-spin" />
                : <Search size={15} />}
              {recherche ? "…" : "Suivre"}
            </button>
          </div>
          <p className="text-white/25 text-[11px]">Le numéro figure sur votre email de confirmation.</p>
        </form>

        {/* Erreur */}
        {erreur && (
          <div className="flex items-start gap-3 rounded-2xl p-4"
            style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
            <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
            <p className="text-red-300 text-[13px]">{erreur}</p>
          </div>
        )}

        {/* Résultat */}
        {commande && (
          <div className="space-y-4">

            {/* Card statut */}
            <div className="rounded-2xl p-6"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="flex items-start justify-between mb-6">
                <div>
                  <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1">Commande</p>
                  <p className="font-mono font-bold text-[18px] text-white">{commande.numero}</p>
                  {commande.tenant?.nomBoutique && (
                    <p className="text-[11px] text-white/35 mt-1">{commande.tenant.nomBoutique}</p>
                  )}
                </div>
                {commande.statut === "annulee" ? (
                  <span className="text-[11px] font-bold px-3 py-1.5 rounded-full"
                    style={{ background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)" }}>
                    Annulée
                  </span>
                ) : commande.statut === "livree" ? (
                  <span className="text-[11px] font-bold px-3 py-1.5 rounded-full"
                    style={{ background: "rgba(16,185,129,0.1)", color: "#34d399", border: "1px solid rgba(16,185,129,0.2)" }}>
                    ✓ Livrée
                  </span>
                ) : (
                  <span className="text-[11px] font-bold px-3 py-1.5 rounded-full"
                    style={{ background: "rgba(245,166,35,0.1)", color: "#F5A623", border: "1px solid rgba(245,166,35,0.25)" }}>
                    {ETAPES.find(e => e.statut === commande.statut)?.label ?? commande.statut}
                  </span>
                )}
              </div>

              {/* Timeline */}
              {commande.statut !== "annulee" && (
                <div className="flex items-start">
                  {ETAPES.map((etape, i) => {
                    const fait    = i < etapeActuelle;
                    const courant = i === etapeActuelle;
                    const futur   = i > etapeActuelle;
                    const { Icon } = etape;
                    return (
                      <div key={etape.statut} className="flex items-center flex-1">
                        <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
                            style={
                              fait    ? { background: "rgba(245,166,35,0.15)", border: "1.5px solid rgba(245,166,35,0.4)" } :
                              courant ? { background: "#F5A623", border: "1.5px solid #F5A623" } :
                                        { background: "rgba(255,255,255,0.04)", border: "1.5px solid rgba(255,255,255,0.08)" }
                            }>
                            <Icon size={13}
                              style={{ color: fait ? "#F5A623" : courant ? "#080808" : "rgba(255,255,255,0.2)" }} />
                          </div>
                          <p className="text-[9px] text-center leading-tight max-w-[52px]"
                            style={{ color: fait || courant ? (courant ? "#F5A623" : "rgba(245,166,35,0.7)") : "rgba(255,255,255,0.2)", fontWeight: courant ? 700 : 400 }}>
                            {etape.label}
                          </p>
                        </div>
                        {i < ETAPES.length - 1 && (
                          <div className="flex-1 h-px mx-1 mb-5 transition-all"
                            style={{ background: fait ? "rgba(245,166,35,0.4)" : "rgba(255,255,255,0.06)" }} />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Livraison */}
            <div className="rounded-2xl p-5 space-y-4"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <p className="text-[11px] font-bold text-white/30 uppercase tracking-widest">Livraison</p>
              <div className="space-y-3">
                {commande.adresseLivraison && (
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: "rgba(245,166,35,0.08)", border: "1px solid rgba(245,166,35,0.15)" }}>
                      <MapPin size={12} style={{ color: "#F5A623" }} />
                    </div>
                    <div>
                      <p className="text-[10px] text-white/30 mb-0.5">Adresse</p>
                      <p className="text-[13px] text-white">{commande.adresseLivraison}, {commande.ville}</p>
                    </div>
                  </div>
                )}
                {commande.livreur && (
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: "rgba(245,166,35,0.08)", border: "1px solid rgba(245,166,35,0.15)" }}>
                      <Truck size={12} style={{ color: "#F5A623" }} />
                    </div>
                    <div>
                      <p className="text-[10px] text-white/30 mb-0.5">Livreur</p>
                      <p className="text-[13px] text-white">{commande.livreur.nom}</p>
                      {commande.livreur.telephone && (
                        <a href={`tel:${commande.livreur.telephone}`}
                          className="flex items-center gap-1 text-[11px] mt-0.5 hover:underline"
                          style={{ color: "#F5A623" }}>
                          <Phone size={10} /> {commande.livreur.telephone}
                        </a>
                      )}
                    </div>
                  </div>
                )}
                {commande.numeroSuivi && (
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: "rgba(245,166,35,0.08)", border: "1px solid rgba(245,166,35,0.15)" }}>
                      <Package size={12} style={{ color: "#F5A623" }} />
                    </div>
                    <div>
                      <p className="text-[10px] text-white/30 mb-0.5">Numéro de suivi</p>
                      <p className="text-[13px] text-white font-mono">{commande.numeroSuivi}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Articles */}
            <div className="rounded-2xl p-5"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <p className="text-[11px] font-bold text-white/30 uppercase tracking-widest mb-4">Articles</p>
              <div className="space-y-3">
                {commande.lignes?.map((ligne: any, i: number) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)" }}>
                      {ligne.imageUrl
                        ? <img src={ligne.imageUrl} alt={ligne.nom} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center">
                            <ShoppingBag size={14} className="text-white/20" />
                          </div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-white truncate">{ligne.nom}</p>
                      {ligne.variante && <p className="text-[11px] text-white/35">{ligne.variante}</p>}
                    </div>
                    <span className="text-[12px] font-bold text-white/50 shrink-0">×{ligne.quantite}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Contact boutique */}
            {commande.tenant?.whatsapp && (
              <div className="rounded-2xl p-5 flex items-center justify-between"
                style={{ background: "rgba(37,211,102,0.05)", border: "1px solid rgba(37,211,102,0.15)" }}>
                <div>
                  <p className="text-[13px] font-semibold text-white">Besoin d'aide ?</p>
                  <p className="text-[11px] text-white/35 mt-0.5">Contactez {commande.tenant.nomBoutique}</p>
                </div>
                <a href={`https://wa.me/${commande.tenant.whatsapp.replace(/\D/g, "")}?text=Bonjour, j'ai une question sur ma commande ${commande.numero}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-bold transition-all hover:opacity-80"
                  style={{ background: "rgba(37,211,102,0.15)", color: "#25D366", border: "1px solid rgba(37,211,102,0.25)" }}>
                  <Phone size={13} /> WhatsApp
                </a>
              </div>
            )}

          </div>
        )}
      </main>
    </div>
  );
}
