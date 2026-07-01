"use client";
import { useState, useRef } from "react";
import {
  Search, Sparkles, Globe, ShoppingBag, Package, ExternalLink,
  ArrowRight, Send, Loader2, Star, MapPin, TrendingUp, Zap,
} from "lucide-react";

// ─── Catalogue fournisseurs par région ────────────────────────────────────────

const FOURNISSEURS = [
  // Asie / International
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
    delai: "7–30 jours",
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
    delai: "15–45 jours",
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
    description: "Dropshipping automatisé avec fulfillment, étiquetage marque blanche.",
    url: "https://cjdropshipping.com",
    note: 4.4,
    delai: "5–20 jours",
    regions: ["Monde"],
  },
  // Afrique
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
    delai: "3–10 jours",
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
    delai: "1–7 jours",
    regions: ["NG", "GH", "KE", "TZ", "UG"],
  },
  // Europe
  {
    id: "bigbuy",
    nom: "BigBuy",
    logo: "🇪🇺",
    pays: "Espagne → Europe",
    categories: ["Maison", "Tech", "Jouets", "Mode"],
    tags: ["europe", "dropshipping", "automatise"],
    couleur: "#003d99",
    description: "Fournisseur dropshipping n°1 en Europe, intégration API.",
    url: "https://www.bigbuy.eu",
    note: 4.3,
    delai: "2–7 jours",
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
    delai: "2–7 jours",
    regions: ["US", "CA", "GB", "FR", "DE", "AU"],
  },
  // Moyen-Orient
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
    delai: "2–5 jours",
    regions: ["AE", "SA", "EG", "QA", "KW"],
  },
];

const CATEGORIES = ["Toutes", "Mode", "Tech", "Maison", "Beauté", "Alimentation", "Sport", "Bijoux"];

// ─── Messages AXIA pré-formatés ───────────────────────────────────────────────

interface AXIAMsg { role: "user" | "axia"; content: string }

const SUGGESTIONS_SOURCING = [
  "Trouve-moi des fournisseurs de vêtements pour la France",
  "Meilleurs fournisseurs dropshipping pour l'Afrique de l'Ouest",
  "Je veux vendre des montres, comment m'approvisionner ?",
  "Quels produits tendance dropshipping pour le Moyen-Orient ?",
];

export default function SourcingPage() {
  const [search, setSearch]         = useState("");
  const [categorie, setCategorie]   = useState("Toutes");
  const [messages, setMessages]     = useState<AXIAMsg[]>([]);
  const [inputIA, setInputIA]       = useState("");
  const [loadingIA, setLoadingIA]   = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fournisseursFiltres = FOURNISSEURS.filter(f => {
    const q = search.toLowerCase();
    const matchSearch = !q || f.nom.toLowerCase().includes(q) || f.description.toLowerCase().includes(q)
      || f.pays.toLowerCase().includes(q) || f.tags.some(t => t.includes(q));
    const matchCat = categorie === "Toutes" || f.categories.includes(categorie);
    return matchSearch && matchCat;
  });

  const askAxia = async (question: string) => {
    const q = question.trim();
    if (!q || loadingIA) return;
    setInputIA("");

    const msgs: AXIAMsg[] = [...messages, { role: "user", content: q }];
    setMessages(msgs);
    setLoadingIA(true);

    try {
      const contextualQ = `[Module Sourcing Dropshipping International] ${q}\n\nFournisseurs disponibles dans Axso : ${FOURNISSEURS.map(f => `${f.nom} (${f.pays}) — ${f.categories.join(", ")}`).join("; ")}`;
      const res = await fetch("/api/ai/copilote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: contextualQ }],
        }),
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
    <div className="space-y-6" style={{ fontFamily: "'Poppins','Century Gothic',system-ui,sans-serif" }}>

      {/* ── Hero ──────────────────────────────────────────────── */}
      <div className="relative bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 80% 50%, #7c3aed08 0%, transparent 70%)" }} />
        <div className="relative p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="inline-flex items-center gap-2 bg-violet-50 border border-violet-200 rounded-full px-3 py-1 text-violet-700 text-xs font-semibold mb-3">
                <Globe size={12} /> Sourcing mondial
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Sourcing & Fournisseurs</h1>
              <p className="text-gray-400 text-sm mt-1 max-w-lg">
                Trouvez les meilleurs fournisseurs dropshipping dans le monde entier. AXIA vous recommande les sources adaptées à votre marché.
              </p>
            </div>
            <div className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm shadow-violet-200">
              <Sparkles size={14} />
              AXIA Sourcing
            </div>
          </div>

          {/* Stats rapides */}
          <div className="grid grid-cols-3 gap-4 mt-5">
            {[
              { val: "220+", label: "Pays livrés", icon: Globe },
              { val: `${FOURNISSEURS.length}`, label: "Fournisseurs vérifiés", icon: ShoppingBag },
              { val: "0€", label: "Commission d'import", icon: TrendingUp },
            ].map(s => (
              <div key={s.label} className="text-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-xl font-bold text-gray-900">{s.val}</p>
                <p className="text-gray-400 text-[11px] mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Liste fournisseurs ─────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Filtres */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex gap-3 flex-wrap">
              <div className="flex items-center gap-2 flex-1 min-w-[200px] bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 focus-within:border-violet-300 focus-within:ring-2 focus-within:ring-violet-100 transition-all">
                <Search size={14} className="text-gray-400 flex-shrink-0" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Chercher un fournisseur, pays, catégorie..."
                  className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none"
                />
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {CATEGORIES.map(c => (
                  <button key={c} onClick={() => setCategorie(c)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                    style={categorie === c
                      ? { background: "#7c3aed", color: "white" }
                      : { background: "#f3f4f6", color: "#6b7280" }}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Grille fournisseurs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {fournisseursFiltres.map(f => (
              <div key={f.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md hover:-translate-y-0.5 transition-all group">

                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                      style={{ background: f.couleur + "15", border: `1.5px solid ${f.couleur}25` }}>
                      {f.logo}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm">{f.nom}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <MapPin size={10} className="text-gray-400" />
                        <p className="text-gray-400 text-[11px]">{f.pays}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-amber-500">
                    <Star size={11} fill="currentColor" />
                    <span className="text-xs font-semibold text-gray-600">{f.note}</span>
                  </div>
                </div>

                <p className="text-gray-500 text-xs leading-relaxed mb-3">{f.description}</p>

                <div className="flex flex-wrap gap-1 mb-3">
                  {f.categories.slice(0, 4).map(c => (
                    <span key={c} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">
                      {c}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-gray-400">⏱ {f.delai}</span>
                  <a href={f.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs font-semibold transition-colors"
                    style={{ color: f.couleur }}>
                    Visiter <ExternalLink size={11} />
                  </a>
                </div>
              </div>
            ))}

            {fournisseursFiltres.length === 0 && (
              <div className="col-span-2 text-center py-10">
                <ShoppingBag size={32} className="text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium text-sm">Aucun fournisseur trouvé</p>
                <p className="text-gray-400 text-xs mt-1">Demandez à AXIA de vous en recommander</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Chat AXIA Sourcing ─────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden" style={{ maxHeight: "calc(100vh - 160px)" }}>
          <div className="px-4 py-3 flex-shrink-0" style={{ background: "linear-gradient(135deg,#7c3aed,#5b21b6)" }}>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Sparkles size={14} className="text-white" />
              </div>
              <div>
                <p className="text-white text-sm font-bold leading-none">AXIA Sourcing</p>
                <p className="text-white/60 text-[10px] mt-0.5">IA • Fournisseurs mondiaux</p>
              </div>
              <div className="ml-auto w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" style={{ minHeight: 0 }}>
            {messages.length === 0 && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5"
                    style={{ background: "linear-gradient(135deg,#7c3aed,#5b21b6)" }}>
                    <Sparkles size={10} className="text-white" />
                  </div>
                  <div className="bg-gray-50 border border-gray-100 rounded-2xl rounded-bl-sm px-3.5 py-2.5 text-sm text-gray-700 leading-relaxed">
                    Bonjour ! Je suis AXIA, votre agent sourcing. Je vous aide à trouver les meilleurs fournisseurs dropshipping selon votre marché et vos produits.
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 pl-8">
                  {SUGGESTIONS_SOURCING.map(s => (
                    <button key={s} onClick={() => askAxia(s)}
                      className="text-xs text-left px-3 py-2 rounded-xl border border-gray-100 hover:border-violet-200 hover:bg-violet-50/50 transition-all text-gray-600 hover:text-violet-700">
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
                    style={{ background: "linear-gradient(135deg,#7c3aed,#5b21b6)" }}>
                    <Sparkles size={10} className="text-white" />
                  </div>
                )}
                <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                  m.role === "user"
                    ? "rounded-br-sm text-white"
                    : "rounded-bl-sm bg-gray-50 border border-gray-100 text-gray-800"
                }`}
                style={m.role === "user" ? { background: "linear-gradient(135deg,#7c3aed,#5b21b6)" } : {}}>
                  {m.content}
                </div>
              </div>
            ))}

            {loadingIA && (
              <div className="flex gap-2 justify-start">
                <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg,#7c3aed,#5b21b6)" }}>
                  <Sparkles size={10} className="text-white" />
                </div>
                <div className="bg-gray-50 border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3">
                  <div className="flex gap-1 items-center">
                    {[0, 1, 2].map(j => (
                      <div key={j} className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce"
                        style={{ animationDelay: `${j * 150}ms` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="px-3 py-3 border-t border-gray-100 flex-shrink-0">
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus-within:border-violet-300 focus-within:ring-2 focus-within:ring-violet-100 transition-all">
              <input
                value={inputIA}
                onChange={e => setInputIA(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); askAxia(inputIA); } }}
                placeholder="Demandez à AXIA…"
                className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none"
              />
              <button onClick={() => askAxia(inputIA)} disabled={!inputIA.trim() || loadingIA}
                className="w-7 h-7 rounded-full flex items-center justify-center disabled:opacity-40"
                style={{ background: "linear-gradient(135deg,#7c3aed,#5b21b6)" }}>
                <Send size={11} className="text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
