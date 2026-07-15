"use client";
import { useState, useRef } from "react";
import {
  Search, Sparkles, Globe, ShoppingBag, Package, ExternalLink,
  Send, Loader2, Star, MapPin, TrendingUp, Clock, ChevronRight,
} from "lucide-react";

const FOURNISSEURS = [
  {
    id: "aliexpress",
    nom: "AliExpress",
    logo: "🛒",
    pays: "Chine → Monde",
    categories: ["Mode", "Tech", "Maison", "Beauté", "Sport"],
    tags: ["dropshipping", "petites-quantites", "worldwide"],
    couleur: "#e83e1a",
    description: "La plus grande marketplace dropshipping mondiale — expédition vers 220+ pays.",
    url: "https://www.aliexpress.com",
    note: 4.2,
    delai: "7–30 j",
    regions: ["Monde"],
  },
  {
    id: "alibaba",
    nom: "Alibaba",
    logo: "🏭",
    pays: "Chine",
    categories: ["Électronique", "Mode", "Industrie", "Alimentaire"],
    tags: ["grossiste", "import", "vrac"],
    couleur: "#ff6a00",
    description: "Fournisseurs grossistes B2B pour commandes en volume.",
    url: "https://www.alibaba.com",
    note: 4.0,
    delai: "15–45 j",
    regions: ["Monde"],
  },
  {
    id: "cjdropshipping",
    nom: "CJ Dropshipping",
    logo: "⚡",
    pays: "Chine → Monde",
    categories: ["Mode", "Bijoux", "Tech", "Maison"],
    tags: ["dropshipping", "auto-fulfillment", "branded"],
    couleur: "#6c47ff",
    description: "Dropshipping automatisé avec fulfillment et étiquetage marque blanche.",
    url: "https://cjdropshipping.com",
    note: 4.4,
    delai: "5–20 j",
    regions: ["Monde"],
  },
  {
    id: "jumia",
    nom: "Jumia Marketplace",
    logo: "🌍",
    pays: "Afrique",
    categories: ["Électronique", "Mode", "Alimentation", "Maison"],
    tags: ["afrique", "local", "marketplace"],
    couleur: "#ff8c00",
    description: "Marketplace leader en Afrique — accès aux fournisseurs locaux africains.",
    url: "https://www.jumia.com",
    note: 3.8,
    delai: "3–10 j",
    regions: ["NG", "KE", "GH", "CI", "SN", "EG", "MA", "TN"],
  },
  {
    id: "jiji",
    nom: "Jiji Afrique",
    logo: "🛍️",
    pays: "Afrique de l'Ouest",
    categories: ["Mode", "Electronique", "Véhicules", "Services"],
    tags: ["afrique", "petites-annonces", "local"],
    couleur: "#00a651",
    description: "Annonces de grossistes locaux — Nigeria, Ghana, Kenya, Tanzanie.",
    url: "https://jiji.com.gh",
    note: 3.6,
    delai: "1–7 j",
    regions: ["NG", "GH", "KE", "TZ", "UG"],
  },
  {
    id: "bigbuy",
    nom: "BigBuy",
    logo: "🇪🇺",
    pays: "Espagne → Europe",
    categories: ["Maison", "Tech", "Jouets", "Mode"],
    tags: ["europe", "dropshipping", "automatise"],
    couleur: "#003d99",
    description: "Fournisseur dropshipping n°1 en Europe, intégration API complète.",
    url: "https://www.bigbuy.eu",
    note: 4.3,
    delai: "2–7 j",
    regions: ["FR", "DE", "ES", "IT", "PT", "BE", "NL", "GB"],
  },
  {
    id: "spocket",
    nom: "Spocket",
    logo: "🔗",
    pays: "USA + Europe",
    categories: ["Mode", "Maison", "Beauté", "Tech"],
    tags: ["usa", "europe", "dropshipping", "marques"],
    couleur: "#7c3aed",
    description: "Fournisseurs dropshipping US & EU avec livraison rapide 2–5 jours.",
    url: "https://www.spocket.co",
    note: 4.5,
    delai: "2–7 j",
    regions: ["US", "CA", "GB", "FR", "DE", "AU"],
  },
  {
    id: "noon",
    nom: "Noon",
    logo: "🌙",
    pays: "Moyen-Orient",
    categories: ["Tech", "Mode", "Maison", "Beauté"],
    tags: ["golfe", "eau", "ksa", "marketplace"],
    couleur: "#fecc00",
    description: "Marketplace leader au Moyen-Orient — UAE, Arabie Saoudite, Égypte.",
    url: "https://www.noon.com",
    note: 4.0,
    delai: "2–5 j",
    regions: ["AE", "SA", "EG", "QA", "KW"],
  },
];

const CATEGORIES = ["Toutes", "Mode", "Tech", "Maison", "Beauté", "Alimentation", "Sport", "Bijoux"];

interface AXIAMsg { role: "user" | "axia"; content: string }

const SUGGESTIONS = [
  "Meilleurs fournisseurs pour l'Afrique de l'Ouest",
  "Je veux vendre des vêtements en France",
  "Produits tendance dropshipping Moyen-Orient",
  "Comment négocier avec un fournisseur Alibaba ?",
];

function StarRating({ note }: { note: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <svg key={n} width="10" height="10" viewBox="0 0 10 10" fill={n <= Math.round(note) ? "#F97316" : "#E5E7EB"}>
          <polygon points="5,1 6.2,4 9.5,4 7,6.2 8,9.5 5,7.5 2,9.5 3,6.2 0.5,4 3.8,4" />
        </svg>
      ))}
      <span className="text-[11px] font-semibold text-gray-500 ml-0.5">{note}</span>
    </div>
  );
}

export default function SourcingPage() {
  const [search, setSearch]       = useState("");
  const [categorie, setCategorie] = useState("Toutes");
  const [messages, setMessages]   = useState<AXIAMsg[]>([]);
  const [inputIA, setInputIA]     = useState("");
  const [loadingIA, setLoadingIA] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const filtres = FOURNISSEURS.filter(f => {
    const q = search.toLowerCase();
    const ok = !q || f.nom.toLowerCase().includes(q) || f.description.toLowerCase().includes(q)
      || f.pays.toLowerCase().includes(q) || f.tags.some(t => t.includes(q));
    return ok && (categorie === "Toutes" || f.categories.includes(categorie));
  });

  const askAxia = async (question: string) => {
    const q = question.trim();
    if (!q || loadingIA) return;
    setInputIA("");
    const msgs: AXIAMsg[] = [...messages, { role: "user", content: q }];
    setMessages(msgs);
    setLoadingIA(true);
    try {
      const ctx = `[Module Sourcing Dropshipping] ${q}\n\nFournisseurs disponibles : ${FOURNISSEURS.map(f => `${f.nom} (${f.pays}) — ${f.categories.join(", ")}`).join("; ")}`;
      const res = await fetch("/api/ai/universal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: ctx }], fast: false }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "axia", content: data.reponse || "Je n'ai pas pu répondre." }]);
    } catch {
      setMessages(prev => [...prev, { role: "axia", content: "Erreur de connexion. Réessaie." }]);
    } finally {
      setLoadingIA(false);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  };

  return (
    <div className="space-y-5" style={{ fontFamily: "'Poppins','Century Gothic',system-ui,sans-serif" }}>

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <div className="relative bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 60% 80% at 100% 50%, rgba(249,115,22,0.07) 0%, transparent 70%)" }} />
        <div className="relative p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-bold mb-3 tracking-wide"
                style={{ background: "#FFF7ED", color: "#C2410C", border: "1px solid #FDBA74" }}>
                <Globe size={10} strokeWidth={2.5} />
                SOURCING MONDIAL
              </div>
              <h1 className="text-[22px] font-bold text-gray-900 leading-tight tracking-tight">
                Sourcing & Fournisseurs
              </h1>
              <p className="text-gray-400 text-sm mt-1.5 max-w-md leading-relaxed">
                Les meilleurs fournisseurs dropshipping mondiaux, recommandés par AXIA selon votre marché.
              </p>
            </div>
            <div className="flex items-center gap-2 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-lg"
              style={{ background: "linear-gradient(135deg,#F97316,#EA580C)", boxShadow: "0 4px 14px rgba(249,115,22,0.3)" }}>
              <Sparkles size={13} />
              AXIA Sourcing
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-5">
            {[
              { val: "220+", label: "Pays livrés", icon: Globe },
              { val: `${FOURNISSEURS.length}`, label: "Fournisseurs vérifiés", icon: ShoppingBag },
              { val: "0 %", label: "Commission Axso", icon: TrendingUp },
            ].map(s => {
              const Ic = s.icon;
              return (
                <div key={s.label} className="flex items-center gap-3 p-3.5 rounded-xl"
                  style={{ background: "#FFF7ED", border: "1px solid #FED7AA" }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(249,115,22,0.12)" }}>
                    <Ic size={15} style={{ color: "#F97316" }} />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-gray-900 leading-none">{s.val}</p>
                    <p className="text-gray-500 text-[11px] mt-0.5">{s.label}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ── Colonne gauche: filtres + grille ──────────────────── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Filtres */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 transition-all"
              style={{ outlineStyle: "solid", outlineWidth: 0 }}
              onFocusCapture={e => (e.currentTarget.style.borderColor = "#FDBA74")}
              onBlurCapture={e => (e.currentTarget.style.borderColor = "#e5e7eb")}>
              <Search size={14} className="text-gray-400 flex-shrink-0" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher un fournisseur, pays, catégorie…"
                className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none"
              />
              {search && (
                <button onClick={() => setSearch("")} className="text-gray-300 hover:text-gray-500 text-xs">✕</button>
              )}
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {CATEGORIES.map(c => (
                <button key={c} onClick={() => setCategorie(c)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                  style={categorie === c
                    ? { background: "#F97316", color: "white", boxShadow: "0 2px 8px rgba(249,115,22,0.25)" }
                    : { background: "#F3F4F6", color: "#6B7280" }}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Résultats */}
          <div className="flex items-center justify-between px-1">
            <p className="text-xs text-gray-400 font-medium">
              {filtres.length} fournisseur{filtres.length !== 1 ? "s" : ""}
              {search && ` pour "${search}"`}
            </p>
          </div>

          {/* Grille fournisseurs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {filtres.map(f => (
              <div key={f.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 group cursor-default transition-all duration-200"
                style={{ ["--hover-border" as any]: "#FDBA74" }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = "#FDBA74";
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px rgba(249,115,22,0.08)";
                  (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = "#f3f4f6";
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)";
                  (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                }}>

                {/* Header */}
                <div className="flex items-start justify-between mb-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 shadow-sm"
                      style={{ background: f.couleur + "12", border: `1.5px solid ${f.couleur}22` }}>
                      {f.logo}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm leading-tight">{f.nom}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <MapPin size={9} className="text-gray-300" />
                        <p className="text-gray-400 text-[11px]">{f.pays}</p>
                      </div>
                    </div>
                  </div>
                  <StarRating note={f.note} />
                </div>

                {/* Description */}
                <p className="text-gray-500 text-xs leading-relaxed mb-3.5 line-clamp-2">{f.description}</p>

                {/* Catégories */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {f.categories.slice(0, 3).map(c => (
                    <span key={c} className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                      style={{ background: "#F9FAFB", color: "#6B7280", border: "1px solid #E5E7EB" }}>
                      {c}
                    </span>
                  ))}
                  {f.categories.length > 3 && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                      style={{ background: "#F9FAFB", color: "#9CA3AF", border: "1px solid #E5E7EB" }}>
                      +{f.categories.length - 3}
                    </span>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-1.5">
                    <Clock size={11} className="text-gray-300" />
                    <span className="text-[11px] text-gray-400 font-medium">{f.delai}</span>
                  </div>
                  <a href={f.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
                    style={{ color: "#F97316", background: "#FFF7ED" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#FFEDD5")}
                    onMouseLeave={e => (e.currentTarget.style.background = "#FFF7ED")}>
                    Visiter <ExternalLink size={10} />
                  </a>
                </div>
              </div>
            ))}

            {filtres.length === 0 && (
              <div className="col-span-2 bg-white border border-dashed border-gray-200 rounded-2xl p-12 text-center">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3"
                  style={{ background: "#FFF7ED" }}>
                  <ShoppingBag size={22} style={{ color: "#FDBA74" }} />
                </div>
                <p className="text-gray-600 font-semibold text-sm">Aucun fournisseur trouvé</p>
                <p className="text-gray-400 text-xs mt-1">Demandez à AXIA de vous en recommander un</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Chat AXIA ──────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden"
          style={{ maxHeight: "calc(100vh - 160px)", minHeight: 480 }}>

          {/* Header chat */}
          <div className="px-4 py-3.5 flex-shrink-0"
            style={{ background: "linear-gradient(135deg,#F97316,#EA580C)" }}>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Sparkles size={14} className="text-white" />
              </div>
              <div>
                <p className="text-white text-sm font-bold leading-none">AXIA Sourcing</p>
                <p className="text-white/60 text-[10px] mt-0.5">Agent IA • Fournisseurs mondiaux</p>
              </div>
              <div className="ml-auto flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-white/60 text-[10px]">En ligne</span>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" style={{ minHeight: 0 }}>
            {messages.length === 0 && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5"
                    style={{ background: "linear-gradient(135deg,#F97316,#EA580C)" }}>
                    <Sparkles size={10} className="text-white" />
                  </div>
                  <div className="bg-orange-50 border border-orange-100 rounded-2xl rounded-bl-sm px-3.5 py-2.5 text-sm text-gray-700 leading-relaxed">
                    Bonjour ! Je suis AXIA, votre agent sourcing. Quel type de produit cherchez-vous à importer ?
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 pl-8">
                  {SUGGESTIONS.map(s => (
                    <button key={s} onClick={() => askAxia(s)}
                      className="text-xs text-left px-3 py-2 rounded-xl border transition-all text-gray-600"
                      style={{ borderColor: "#F3F4F6", background: "#FAFAFA" }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.borderColor = "#FDBA74";
                        (e.currentTarget as HTMLElement).style.background = "#FFF7ED";
                        (e.currentTarget as HTMLElement).style.color = "#C2410C";
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.borderColor = "#F3F4F6";
                        (e.currentTarget as HTMLElement).style.background = "#FAFAFA";
                        (e.currentTarget as HTMLElement).style.color = "#6B7280";
                      }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                {m.role === "axia" && (
                  <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5"
                    style={{ background: "linear-gradient(135deg,#F97316,#EA580C)" }}>
                    <Sparkles size={10} className="text-white" />
                  </div>
                )}
                <div className="max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap"
                  style={m.role === "user"
                    ? { background: "linear-gradient(135deg,#F97316,#EA580C)", color: "white", borderBottomRightRadius: 4 }
                    : { background: "#FFF7ED", border: "1px solid #FDBA74", color: "#1f2937", borderBottomLeftRadius: 4 }}>
                  {m.content}
                </div>
              </div>
            ))}

            {loadingIA && (
              <div className="flex gap-2 justify-start">
                <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg,#F97316,#EA580C)" }}>
                  <Sparkles size={10} className="text-white" />
                </div>
                <div className="bg-orange-50 border border-orange-100 rounded-2xl rounded-bl-sm px-4 py-3">
                  <div className="flex gap-1 items-center">
                    {[0, 1, 2].map(j => (
                      <div key={j} className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-bounce"
                        style={{ animationDelay: `${j * 150}ms` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-3 py-3 border-t border-gray-100 flex-shrink-0">
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 transition-all"
              onFocusCapture={e => (e.currentTarget.style.borderColor = "#FDBA74")}
              onBlurCapture={e => (e.currentTarget.style.borderColor = "#e5e7eb")}>
              <input
                value={inputIA}
                onChange={e => setInputIA(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); askAxia(inputIA); } }}
                placeholder="Demandez à AXIA…"
                className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none"
              />
              <button onClick={() => askAxia(inputIA)} disabled={!inputIA.trim() || loadingIA}
                className="w-7 h-7 rounded-full flex items-center justify-center transition-all disabled:opacity-40"
                style={{ background: "linear-gradient(135deg,#F97316,#EA580C)" }}>
                <Send size={11} className="text-white" />
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
