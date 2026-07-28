"use client";
import { useState, useRef, useEffect } from "react";
import {
  Send, Loader2, Bot, User, Zap, Calculator, Trophy,
  MessageSquare, Megaphone, Copy, Check,
} from "lucide-react";
import { toast } from "sonner";

interface ChatMsg { role: "user" | "assistant"; content: string; }
type Suite = "roi" | "winners" | "relances" | "copywriting";

interface ROI { budget: number; cpc: number; conversion: number; aov: number; cogs: number; }

const QUICK_PROMPTS = [
  "Quel est mon stock critique ?",
  "Analyse mes meilleures ventes",
  "Quels clients VIP relancer ?",
  "Résumé de mes revenus",
];

const SUITE_TABS: { id: Suite; label: string; Icon: any }[] = [
  { id: "roi",        label: "ROI",       Icon: Calculator  },
  { id: "winners",    label: "Winners",   Icon: Trophy      },
  { id: "relances",   label: "Relances",  Icon: MessageSquare },
  { id: "copywriting",label: "Copywriting",Icon: Megaphone   },
];

export default function AxiaPage() {
  // ── Chat ──────────────────────────────────────────────────────────────
  const [msgs, setMsgs] = useState<ChatMsg[]>([{
    role: "assistant",
    content: "Bonjour ! Je suis AXIA. Je consulte votre stock, vos commandes et vos clients en temps réel. Posez-moi n'importe quelle question sur votre boutique.",
  }]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // ── Suite ──────────────────────────────────────────────────────────────
  const [tab, setTab] = useState<Suite>("roi");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [copied, setCopied] = useState(false);

  // ROI
  const [roi, setROI] = useState<ROI>({ budget: 50000, cpc: 500, conversion: 2, aov: 15000, cogs: 6000 });

  // Winners
  const [wNiche, setWNiche] = useState("");

  // Relances
  const [rCanal, setRCanal] = useState<"whatsapp" | "gmail">("whatsapp");
  const [rCtx, setRCtx] = useState("");

  // Copywriting
  const [cProduit, setCProduit] = useState("");
  const [cCible, setCCible] = useState("");

  // ROI computed
  const clics       = roi.cpc > 0 ? Math.floor(roi.budget / roi.cpc) : 0;
  const conversions = Math.floor(clics * (roi.conversion / 100));
  const revenu      = conversions * roi.aov;
  const coutProd    = conversions * roi.cogs;
  const benefice    = revenu - coutProd - roi.budget;
  const roas        = roi.budget > 0 ? (revenu / roi.budget).toFixed(2) : "0.00";
  const roiPct      = roi.budget > 0 ? Math.round((benefice / roi.budget) * 100) : 0;

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  async function sendMsg() {
    if (!input.trim() || streaming) return;
    const userMsg: ChatMsg = { role: "user", content: input.trim() };
    const history = [...msgs, userMsg];
    setMsgs([...history, { role: "assistant", content: "" }]);
    setInput("");
    setStreaming(true);

    // Strip leading assistant messages — LLM APIs require first message to be user
    const toSend = history
      .map(m => ({ role: m.role, content: m.content }))
      .slice(history.findIndex(m => m.role === "user"));

    try {
      const res = await fetch("/api/axia/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: toSend, stream: true }),
      });
      if (!res.ok || !res.body) throw new Error(`Erreur ${res.status}`);

      const reader = res.body!.getReader();
      const dec = new TextDecoder();
      let buf = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const chunk = JSON.parse(line.slice(6).trim());
            if (chunk.type === "token" && chunk.text) {
              setMsgs(prev => {
                const upd = [...prev];
                upd[upd.length - 1] = { role: "assistant", content: upd[upd.length - 1].content + chunk.text };
                return upd;
              });
            }
          } catch {}
        }
      }
    } catch {
      toast.error("Erreur de connexion AXIA");
      setMsgs(prev => {
        const upd = [...prev];
        upd[upd.length - 1] = { role: "assistant", content: "Une erreur est survenue. Réessaie." };
        return upd;
      });
    } finally {
      setStreaming(false);
    }
  }

  async function callOutil(prompt: string) {
    setLoading(true);
    setResult("");
    setCopied(false);
    try {
      const res = await fetch("/api/axia/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: prompt }], stream: false }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Erreur");
      setResult(data.reponse || "");
    } catch (err: any) {
      toast.error(err.message || "Erreur IA");
    } finally {
      setLoading(false);
    }
  }

  function copyResult() {
    navigator.clipboard.writeText(result);
    setCopied(true);
    toast.success("Copié !");
    setTimeout(() => setCopied(false), 2000);
  }

  const inputCls = "w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 outline-none focus:border-[#F5A623] placeholder:text-gray-400";

  return (
    <div className="space-y-5">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-[#111111] flex items-center justify-center flex-shrink-0">
          <Bot size={22} className="text-[#F5A623]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AXIA</h1>
          <p className="text-gray-400 text-sm">Agent IA — données boutique en temps réel</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 bg-green-50 border border-green-200 rounded-full px-3 py-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs font-semibold text-green-700">En ligne</span>
        </div>
      </div>

      {/* ── Main grid ───────────────────────────────────────────────────── */}
      <div className="grid lg:grid-cols-[1fr_400px] gap-5 items-start">

        {/* ── Chat ──────────────────────────────────────────────────────── */}
        <div className="bg-white border border-gray-100 rounded-2xl flex flex-col overflow-hidden"
          style={{ height: "calc(100vh - 220px)", minHeight: 520 }}>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {msgs.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  msg.role === "assistant" ? "bg-[#111111]" : "bg-[#F5A623]"}`}>
                  {msg.role === "assistant"
                    ? <Bot size={14} className="text-[#F5A623]" />
                    : <User size={14} className="text-white" />}
                </div>
                <div className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "assistant"
                    ? "bg-gray-50 border border-gray-100 text-gray-800"
                    : "bg-[#111111] text-white"
                }`}>
                  {msg.content
                    ? <span style={{ whiteSpace: "pre-wrap" }}>{msg.content}</span>
                    : streaming && i === msgs.length - 1
                      ? <span className="flex gap-1 py-1">
                          {[0,1,2].map(j => (
                            <span key={j} className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-bounce"
                              style={{ animationDelay: `${j * 0.12}s` }} />
                          ))}
                        </span>
                      : null}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Quick prompts (only on first message) */}
          {msgs.length === 1 && (
            <div className="px-5 pb-3 flex flex-wrap gap-2">
              {QUICK_PROMPTS.map(q => (
                <button key={q} onClick={() => setInput(q)}
                  className="text-xs px-3 py-1.5 rounded-xl border border-gray-200 text-gray-500 hover:border-[#F5A623] hover:text-[#F5A623] transition-colors">
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-gray-100">
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2.5 focus-within:border-[#F5A623] transition-colors">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMsg(); } }}
                placeholder="Posez une question sur votre boutique…"
                className="flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
                disabled={streaming}
              />
              <button onClick={sendMsg} disabled={streaming || !input.trim()}
                className="w-8 h-8 rounded-xl flex items-center justify-center disabled:opacity-40 transition-all flex-shrink-0"
                style={{ background: "#111111" }}>
                {streaming
                  ? <Loader2 size={13} className="text-white animate-spin" />
                  : <Send size={13} className="text-white" />}
              </button>
            </div>
          </div>
        </div>

        {/* ── MillionaireSuite ──────────────────────────────────────────── */}
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">

          {/* Tabs */}
          <div className="grid grid-cols-4 border-b border-gray-100">
            {SUITE_TABS.map(({ id, label, Icon }) => (
              <button key={id} onClick={() => { setTab(id); setResult(""); setCopied(false); }}
                className="flex flex-col items-center gap-1 py-3 text-[11px] transition-all"
                style={{
                  color: tab === id ? "#111111" : "#AAAAAA",
                  fontWeight: tab === id ? 700 : 400,
                  borderBottom: tab === id ? "2px solid #F5A623" : "2px solid transparent",
                }}>
                <Icon size={15} />
                {label}
              </button>
            ))}
          </div>

          <div className="p-5 space-y-4">

            {/* ── ROI Calculator ────────────────────────────────────────── */}
            {tab === "roi" && (
              <>
                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-400">Simulateur ROI Publicité</p>

                {([
                  { k: "budget"     as keyof ROI, label: "Budget pub (XOF)",   min: 10000, max: 500000, step: 5000   },
                  { k: "cpc"        as keyof ROI, label: "CPC estimé (XOF)",   min: 50,    max: 5000,   step: 50     },
                  { k: "conversion" as keyof ROI, label: "Taux conversion (%)", min: 0.5,  max: 15,     step: 0.5    },
                  { k: "aov"        as keyof ROI, label: "Panier moyen (XOF)", min: 2000,  max: 150000, step: 1000   },
                  { k: "cogs"       as keyof ROI, label: "Coût produit (XOF)", min: 500,   max: 80000,  step: 500    },
                ] as const).map(({ k, label, min, max, step }) => (
                  <div key={k}>
                    <div className="flex justify-between mb-1.5">
                      <span className="text-xs text-gray-500">{label}</span>
                      <span className="text-xs font-bold text-gray-900">{roi[k].toLocaleString("fr-FR")}</span>
                    </div>
                    <input type="range" min={min} max={max} step={step} value={roi[k]}
                      onChange={e => setROI(r => ({ ...r, [k]: Number(e.target.value) }))}
                      className="w-full h-1 bg-gray-200 rounded-full appearance-none cursor-pointer"
                      style={{ accentColor: "#F5A623" }} />
                  </div>
                ))}

                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  {[
                    { label: "Clics",        val: clics.toLocaleString("fr-FR"),                         good: false  },
                    { label: "Conversions",  val: conversions.toLocaleString("fr-FR"),                   good: false  },
                    { label: "Revenu",       val: revenu.toLocaleString("fr-FR") + " XOF",               good: false  },
                    { label: "Bénéfice",     val: (benefice >= 0 ? "+" : "") + benefice.toLocaleString("fr-FR") + " XOF", good: benefice > 0 },
                    { label: "ROAS",         val: `×${roas}`,                                            good: parseFloat(roas) >= 2 },
                    { label: "ROI",          val: `${roiPct}%`,                                          good: roiPct > 0 },
                  ].map(({ label, val, good }) => (
                    <div key={label} className="bg-gray-50 rounded-xl p-3">
                      <p className="text-[10px] text-gray-400 mb-0.5">{label}</p>
                      <p className="text-sm font-bold" style={{ color: good ? "#16a34a" : "#111111" }}>{val}</p>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* ── Winners ───────────────────────────────────────────────── */}
            {tab === "winners" && (
              <>
                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-400">Dénicheur de Produits Gagnants</p>
                <input value={wNiche} onChange={e => setWNiche(e.target.value)}
                  placeholder="Niche ou marché (ex: mode africaine, tech, cosmétiques…)"
                  className={inputCls} />
                <button onClick={() => callOutil(`Trouve 3 produits gagnants à vendre en ligne maintenant.\nNiche : ${wNiche || "e-commerce général"}\nPays cible : Afrique de l'Ouest\nPour chaque produit : nom, pourquoi ça marche, prix source / prix vente / marge brute, canal marketing principal. Format : liste numérotée, concis.`)}

                  disabled={loading || !wNiche.trim()}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-50"
                  style={{ background: "#111111" }}>
                  {loading ? <Loader2 size={14} className="animate-spin" /> : <Trophy size={14} />}
                  Trouver les winners
                </button>
                {result && <ResultBox result={result} onCopy={copyResult} copied={copied} />}
              </>
            )}

            {/* ── Relances ──────────────────────────────────────────────── */}
            {tab === "relances" && (
              <>
                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-400">Relances VIP Automatiques</p>
                <div className="grid grid-cols-2 gap-2">
                  {(["whatsapp", "gmail"] as const).map(c => (
                    <button key={c} onClick={() => setRCanal(c)}
                      className="py-2.5 rounded-xl text-sm font-semibold transition-all border"
                      style={{
                        background: rCanal === c ? "#111111" : "transparent",
                        color:      rCanal === c ? "white" : "#666666",
                        borderColor: rCanal === c ? "#111111" : "#E8E8E8",
                      }}>
                      {c === "whatsapp" ? "💬 WhatsApp" : "📧 Gmail"}
                    </button>
                  ))}
                </div>
                <textarea value={rCtx} onChange={e => setRCtx(e.target.value)}
                  placeholder="Contexte : produit ciblé, promotion, raison d'inactivité…"
                  rows={3} className={inputCls + " resize-none"} />
                <button onClick={() => callOutil(`Rédige un message de relance ${rCanal === "gmail" ? "email (objet + corps)" : "WhatsApp court avec emojis"} pour un client VIP inactif.\nContexte : ${rCtx || "Client n'a pas commandé depuis 30 jours"}.\nStyle : chaleureux, personnalisé, avec offre attractive. Réponds uniquement avec le message.`)}

                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-50"
                  style={{ background: "#111111" }}>
                  {loading ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
                  Générer la relance
                </button>
                {result && <ResultBox result={result} onCopy={copyResult} copied={copied} />}
              </>
            )}

            {/* ── Copywriting ───────────────────────────────────────────── */}
            {tab === "copywriting" && (
              <>
                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-400">Générateur de Publicités IA</p>
                <input value={cProduit} onChange={e => setCProduit(e.target.value)}
                  placeholder="Produit (ex: Robe Ankara, Crème naturelle…)"
                  className={inputCls} />
                <input value={cCible} onChange={e => setCCible(e.target.value)}
                  placeholder="Cible (ex: femmes 25-40 ans, entrepreneurs…)"
                  className={inputCls} />
                <button onClick={() => callOutil(`Rédige une publicité Facebook/Instagram percutante.\nProduit : ${cProduit}\nCible : ${cCible || "femmes entrepreneurs africaines 25-45 ans"}\nFormat : Accroche (hook) + Corps + CTA. Avec emojis stratégiques, style africain authentique. Donne 2 variantes distinctes.`)}

                  disabled={loading || !cProduit.trim()}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-50"
                  style={{ background: "#111111" }}>
                  {loading ? <Loader2 size={14} className="animate-spin" /> : <Megaphone size={14} />}
                  Créer la publicité
                </button>
                {result && <ResultBox result={result} onCopy={copyResult} copied={copied} />}
              </>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Result box ─────────────────────────────────────────────────────────────── */
function ResultBox({ result, onCopy, copied }: { result: string; onCopy: () => void; copied: boolean }) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 relative">
      <button onClick={onCopy}
        className="absolute top-3 right-3 flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-700 px-2 py-1 rounded-lg hover:bg-gray-200 transition-all">
        {copied ? <Check size={11} className="text-green-500" /> : <Copy size={11} />}
        {copied ? "Copié" : "Copier"}
      </button>
      <pre className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed font-sans pr-14 max-h-64 overflow-y-auto">
        {result}
      </pre>
    </div>
  );
}
