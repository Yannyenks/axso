"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import {
  Send, Loader2, CheckCircle2, Zap, BrainCircuit,
  TrendingUp, Target, RefreshCw, ChevronRight, Sparkles
} from "lucide-react";
import { AgentAvatar3D, AGENT_META } from "@/components/dashboard/AgentAvatar3D";

// ── Suggestions rapides par catégorie ───────────────────────────────────────
const SUGGESTIONS = [
  { cat: "📊 Analytics",    items: ["Fais un rapport complet de mes ventes", "Quels sont mes produits les plus rentables ?", "Analyse mes clients VIP"] },
  { cat: "💰 Revenus",      items: ["Optimise mes prix pour maximiser le CA", "Crée une offre flash 24h", "Relance les paniers abandonnés"] },
  { cat: "📣 Marketing",    items: ["Génère un post Instagram pour mes produits", "Lance une campagne email à mes clients", "Crée un code promo -20%"] },
  { cat: "📦 Stocks",       items: ["Quels produits risquent d'être en rupture ?", "Prépare mes stocks pour la Tabaski", "Audit complet de mon inventaire"] },
  { cat: "👥 Clients",      items: ["Segmente mes clients en VIP / actifs / inactifs", "Génère un message de fidélité", "Qui n'a pas commandé depuis 30 jours ?"] },
  { cat: "🚚 Livraisons",   items: ["Assigne les livreurs disponibles", "Statut de toutes les livraisons en cours", "Combien de commandes à traiter ?"] },
];

interface Msg { role: "user" | "assistant"; content: string; actions?: string[] }

// ── Panneau Orchestrateur ────────────────────────────────────────────────────
function OrchestratorPanel({ onClose }: { onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const [etat, setEtat] = useState<any>(null);
  const [actions, setActions] = useState<string[]>([]);
  const [objectifForm, setObjectifForm] = useState(false);
  const [objectifOk, setObjectifOk] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [cible, setCible] = useState("1000000");
  const [deadline, setDeadline] = useState(() => {
    const d = new Date(); d.setMonth(d.getMonth() + 1);
    return d.toISOString().split("T")[0];
  });

  const charger = useCallback(() =>
    fetch("/api/ai/orchestrator")
      .then(r => r.json())
      .then(d => { if (!d.error) setEtat(d); })
      .catch(() => {}), []);

  useEffect(() => { charger(); }, [charger]);

  const orchestrer = async () => {
    setLoading(true); setActions([]); setErreur(null);
    try {
      const res = await fetch("/api/ai/orchestrator", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "orchestrer" }),
      });
      const data = await res.json();
      if (data.error) setErreur(data.error);
      else setActions(data.actions || []);
      await charger();
    } catch { setErreur("Erreur réseau — réessayez."); }
    finally { setLoading(false); }
  };

  const creerObjectif = async () => {
    setErreur(null);
    try {
      const res = await fetch("/api/ai/orchestrator", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "creer_objectif", type: "revenu_mensuel",
          titre: `Objectif ${new Date(deadline).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}`,
          cible: parseFloat(cible), devise: "XAF", deadline,
        }),
      });
      const data = await res.json();
      if (data.error) { setErreur(data.error); return; }
      setObjectifForm(false); setObjectifOk(true);
      setTimeout(() => setObjectifOk(false), 3000);
      await charger();
    } catch { setErreur("Erreur lors de la création."); }
  };

  const objectifs = etat?.objectifs ?? [];
  const decisions = etat?.decisions ?? [];

  return (
    <div className="absolute inset-0 bg-white z-20 flex flex-col rounded-3xl shadow-2xl overflow-hidden border border-purple-100">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-purple-100 bg-gradient-to-r from-purple-50 to-indigo-50">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-gradient-to-br from-purple-600 to-indigo-600">
          <BrainCircuit size={18} className="text-white"/>
        </div>
        <div>
          <p className="font-bold text-[#111111]">Mode Autonome</p>
          <p className="text-xs text-purple-600">AXIA coordonne tout en arrière-plan</p>
        </div>
        <button onClick={onClose} className="ml-auto text-xs text-gray-400 hover:text-gray-700 px-3 py-1.5 rounded-xl hover:bg-gray-100 transition-all">
          ✕ Fermer
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {erreur && <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 text-xs text-red-700">{erreur}</div>}
        {objectifOk && (
          <div className="bg-green-50 border border-green-200 rounded-2xl px-4 py-3 flex items-center gap-2 text-xs text-green-700">
            <CheckCircle2 size={13}/> Objectif créé !
          </div>
        )}

        <button onClick={orchestrer} disabled={loading}
          className="w-full py-3.5 rounded-2xl text-white font-bold text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2"
          style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}>
          {loading ? <><Loader2 size={14} className="animate-spin"/> Orchestration en cours…</> : <><Zap size={14}/> Activer les agents maintenant</>}
        </button>

        {actions.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 space-y-2">
            <p className="text-xs font-bold text-green-700">{actions.length} agent(s) activé(s)</p>
            {actions.map((a, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-green-700">
                <CheckCircle2 size={11} className="mt-0.5 flex-shrink-0"/><span>{a}</span>
              </div>
            ))}
          </div>
        )}

        {/* Objectifs */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Objectifs Revenus</p>
            <button onClick={() => setObjectifForm(!objectifForm)} className="text-xs text-purple-600 font-semibold hover:underline">+ Ajouter</button>
          </div>
          {objectifForm && (
            <div className="bg-purple-50 border border-purple-200 rounded-2xl p-3 mb-3 space-y-2">
              <input type="number" value={cible} onChange={e => setCible(e.target.value)} placeholder="Cible en XAF" className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-purple-400"/>
              <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-purple-400"/>
              <button onClick={creerObjectif} disabled={!cible || parseFloat(cible) <= 0} className="w-full py-2 bg-purple-600 text-white rounded-xl text-sm font-bold disabled:opacity-50">Créer</button>
            </div>
          )}
          {objectifs.length === 0 ? (
            <div className="text-center py-6 text-[#AAAAAA] text-xs bg-[#F9F9F9] rounded-2xl">Aucun objectif défini</div>
          ) : objectifs.map((obj: any) => {
            const pct = obj.cible > 0 ? Math.min(100, Math.round((obj.actuel / obj.cible) * 100)) : 0;
            return (
              <div key={obj.id} className="ax-card p-3 mb-2">
                <div className="flex justify-between mb-1.5">
                  <p className="text-sm font-semibold text-gray-800">{obj.titre}</p>
                  <span className="text-xs font-bold" style={{ color: pct >= 100 ? "#16a34a" : "#7c3aed" }}>{pct}%</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "linear-gradient(90deg,#7c3aed,#4f46e5)" }}/>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[10px] text-gray-400">{obj.actuel.toLocaleString()} {obj.devise}</span>
                  <span className="text-[10px] text-gray-400">{obj.cible.toLocaleString()} {obj.devise}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Décisions récentes */}
        {decisions.length > 0 && (
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Décisions récentes</p>
            <div className="space-y-2">
              {decisions.slice(0, 5).map((d: any) => (
                <div key={d.id} className="flex items-start gap-2.5 bg-purple-50/50 border border-purple-100 rounded-xl p-3">
                  <Zap size={12} className="text-purple-500 mt-0.5 flex-shrink-0"/>
                  <div>
                    <p className="text-xs text-gray-700">{d.description}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{d.agentId} · {new Date(d.createdAt).toLocaleDateString("fr-FR")}</p>
                  </div>
                  {d.impactEstime && <span className="text-[10px] text-green-600 font-bold ml-auto flex-shrink-0">+{d.impactEstime.toLocaleString()} XAF</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Page principale ──────────────────────────────────────────────────────────
export default function AgentsPage() {
  const meta = AGENT_META["axia"];
  const [messages, setMessages] = useState<Msg[]>([{
    role: "assistant",
    content: "Bonjour 👋 Je suis **AXIA**, votre agent IA tout-en-un.\n\nJe peux gérer votre boutique de A à Z : analytics, marketing, stocks, clients, livraisons, revenus — dites-moi simplement ce que vous voulez faire.",
  }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOrchestrator, setShowOrchestrator] = useState(false);
  const [catOuverte, setCatOuverte] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const envoyer = async (txt?: string) => {
    const msg = (txt ?? input).trim();
    if (!msg || loading) return;
    const hist: Msg[] = [...messages, { role: "user", content: msg }];
    setMessages(hist);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/ai/universal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: hist.map(m => ({ role: m.role, content: m.content })) }),
      });
      const data = await res.json();
      setMessages([...hist, {
        role: "assistant",
        content: data.reponse ?? data.message ?? "✅ Action effectuée.",
        actions: data.actions,
      }]);
    } catch {
      setMessages([...hist, { role: "assistant", content: "Une erreur s'est produite — réessayez." }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const showSuggestions = messages.length <= 1 && !loading;

  return (
    <div className="h-full flex flex-col min-h-0 bg-gray-50/50">

      {/* ── Header ── */}
      <div className="flex-shrink-0 flex items-center gap-4 px-6 py-4 bg-white border-b border-[#F3F3F3]">
        <div style={{ filter: `drop-shadow(0 0 14px ${meta.glow})` }}>
          <AgentAvatar3D agentId="axia" size={46} pulse={loading}/>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-[18px] font-bold text-[#111111]">AXIA</h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full text-white" style={{ background: `linear-gradient(135deg, ${meta.color}, ${meta.color}bb)` }}>
              Agent IA
            </span>
            <span className="flex items-center gap-1 text-[11px] text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"/>
              En ligne
            </span>
          </div>
          <p className="text-[12px] text-[#AAAAAA] mt-0.5">Marketing · Stocks · Revenus · Analytics · Livraisons · Clients</p>
        </div>

        <button
          onClick={() => setShowOrchestrator(true)}
          className="ml-auto flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all border hover:shadow-md"
          style={{ background: "linear-gradient(135deg, #7c3aed12, #4f46e512)", borderColor: "#7c3aed30", color: "#7c3aed" }}
        >
          <BrainCircuit size={14}/>
          Mode Autonome
          <span className="text-[9px] bg-purple-600 text-white px-1.5 py-0.5 rounded-full">AUTO</span>
        </button>
      </div>

      {/* ── Corps ── */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        <div className="flex-1 flex flex-col min-h-0 relative">

          {/* Overlay orchestrateur */}
          {showOrchestrator && (
            <div className="absolute inset-4 z-20">
              <OrchestratorPanel onClose={() => setShowOrchestrator(false)}/>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4 min-h-0">

            {/* Suggestions après le message d'accueil */}
            {showSuggestions && (
              <div className="space-y-3 pb-2">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider text-center">Que voulez-vous faire ?</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {SUGGESTIONS.map((cat) => (
                    <div key={cat.cat} className="ax-card overflow-hidden">
                      <button
                        onClick={() => setCatOuverte(catOuverte === cat.cat ? null : cat.cat)}
                        className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all"
                      >
                        <span>{cat.cat}</span>
                        <ChevronRight size={14} className={`text-gray-400 transition-transform ${catOuverte === cat.cat ? "rotate-90" : ""}`}/>
                      </button>
                      {catOuverte === cat.cat && (
                        <div className="border-t border-gray-50 divide-y divide-gray-50">
                          {cat.items.map((item) => (
                            <button
                              key={item}
                              onClick={() => { setCatOuverte(null); envoyer(item); }}
                              className="w-full text-left px-4 py-2.5 text-xs text-gray-600 hover:bg-amber-50 hover:text-gray-900 transition-all flex items-center gap-2"
                            >
                              <Sparkles size={10} className="text-[#F5A623] flex-shrink-0"/>
                              {item}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bulles de messages */}
            {messages.map((m, i) => {
              const estIA = m.role === "assistant";
              return (
                <div key={i} className={`flex gap-3 ${estIA ? "" : "flex-row-reverse"}`}>
                  {estIA ? (
                    <div className="flex-shrink-0 mt-1" style={{ filter: `drop-shadow(0 0 8px ${meta.glow})` }}>
                      <AgentAvatar3D agentId="axia" size={38} pulse={loading && i === messages.length - 1}/>
                    </div>
                  ) : (
                    <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-sm">👤</span>
                    </div>
                  )}
                  <div className={`flex flex-col gap-1.5 ${estIA ? "max-w-[78%]" : "max-w-[70%]"}`}>
                    <div
                      className="rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap shadow-sm"
                      style={estIA
                        ? { background: "white", border: `1px solid ${meta.color}18`, color: "#111827" }
                        : { background: `linear-gradient(135deg, ${meta.color}, ${meta.color}cc)`, color: "white" }
                      }
                    >
                      {m.content}
                    </div>
                    {m.actions?.map((a, j) => (
                      <span key={j} className="inline-flex items-center gap-1 text-[10px] bg-green-50 border border-green-200 text-green-700 px-2.5 py-1 rounded-lg w-fit">
                        <CheckCircle2 size={9}/>{a}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Thinking */}
            {loading && (
              <div className="flex gap-3">
                <div className="flex-shrink-0 mt-1" style={{ filter: `drop-shadow(0 0 8px ${meta.glow})` }}>
                  <AgentAvatar3D agentId="axia" size={38} pulse/>
                </div>
                <div className="bg-white border rounded-2xl px-4 py-3 flex items-center gap-2 shadow-sm" style={{ borderColor: meta.color + "25" }}>
                  <Loader2 size={13} className="animate-spin" style={{ color: meta.color }}/>
                  <span className="text-sm text-gray-400">AXIA analyse…</span>
                  {[0, 1, 2].map(i => (
                    <span key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: meta.color, animation: `dot 1s ${i * 0.2}s ease-in-out infinite` }}/>
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef}/>
          </div>

          {/* Zone de saisie */}
          <div className="flex-shrink-0 p-4 bg-white border-t border-gray-100">
            <div
              className="flex items-end gap-3 rounded-2xl border px-4 py-3 transition-all focus-within:border-[#F5A623]/50 focus-within:shadow-sm"
              style={{ background: "#fafafa", borderColor: "#e5e7eb" }}
            >
              <div className="flex-shrink-0 pb-0.5">
                <AgentAvatar3D agentId="axia" size={22} pulse={loading}/>
              </div>
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); envoyer(); }}}
                placeholder="Parlez à AXIA… (Entrée pour envoyer)"
                rows={1}
                disabled={loading}
                className="flex-1 bg-transparent text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none resize-none"
                style={{ maxHeight: 120 }}
                onInput={e => {
                  const t = e.target as HTMLTextAreaElement;
                  t.style.height = "auto";
                  t.style.height = Math.min(t.scrollHeight, 120) + "px";
                }}
              />
              <button
                onClick={() => envoyer()}
                disabled={!input.trim() || loading}
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-40"
                style={{ background: input.trim() && !loading ? `linear-gradient(135deg, ${meta.color}, ${meta.color}cc)` : "#f3f4f6" }}
              >
                {loading ? <Loader2 size={13} className="animate-spin text-gray-400"/> : <Send size={13} className={input.trim() ? "text-white" : "text-gray-400"}/>}
              </button>
            </div>
            <p className="text-center text-[10px] text-gray-300 mt-2">
              AXIA peut créer des produits, envoyer des emails, publier sur Meta, analyser vos ventes et bien plus.
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes dot { 0%,80%,100%{transform:scale(.5);opacity:.3} 40%{transform:scale(1.2);opacity:1} }
      `}</style>
    </div>
  );
}
