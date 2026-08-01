"use client";
import { useEffect, useState } from "react";
import { Copy, Download, ExternalLink } from "lucide-react";

interface Lien {
  id: string;
  code: string;
  clics: number;
  conversions: number;
  montantGenere: number;
  cookieJours: number;
  actif: boolean;
  produit: { nom: string; images: string[]; prix: number } | null;
}

const COULEURS = ["#F5A623", "#7c3aed", "#22c55e", "#3b82f6", "#ef4444"];
const FORMATS = [
  { label: "Bandeau 728×90", w: 728, h: 90 },
  { label: "Carré 300×250", w: 300, h: 250 },
  { label: "Story 1080×1920", w: 1080, h: 1920 },
  { label: "Post 1080×1080", w: 1080, h: 1080 },
];

function BannierePreview({ lien, couleur, texte, baseUrl }: { lien: Lien; couleur: string; texte: string; baseUrl: string }) {
  const url = `${baseUrl}?ref=${lien.code}`;
  return (
    <div className="border border-[#E8E8E8] rounded-2xl overflow-hidden">
      {/* Préview visuelle */}
      <div
        className="flex items-center justify-between px-6 py-4 text-white"
        style={{ background: `linear-gradient(135deg, ${couleur}, ${couleur}dd)`, minHeight: 80 }}
      >
        <div>
          <p className="font-bold text-[15px]">{texte || "Découvrez nos produits"}</p>
          <p className="text-[11px] opacity-80 mt-0.5">{lien.produit ? `${lien.produit.nom} — ${lien.produit.prix.toLocaleString()} XAF` : "Boutique complète"}</p>
        </div>
        <div className="bg-white/20 border border-white/30 rounded-xl px-4 py-2 text-[12px] font-bold">
          Voir →
        </div>
      </div>
      <div className="bg-[#FAFAFA] p-3 flex items-center justify-between">
        <p className="text-[11px] text-[#888] font-mono truncate max-w-[60%]">{url}</p>
        <div className="flex gap-2">
          <button
            onClick={() => navigator.clipboard.writeText(url).then(() => alert("Lien copié !"))}
            className="flex items-center gap-1 text-[11px] border border-[#E8E8E8] px-2.5 py-1 rounded-lg text-[#666]"
          >
            <Copy size={10} /> Copier
          </button>
          <a href={url} target="_blank" rel="noreferrer"
            className="flex items-center gap-1 text-[11px] border border-[#E8E8E8] px-2.5 py-1 rounded-lg text-[#666]">
            <ExternalLink size={10} /> Tester
          </a>
        </div>
      </div>
    </div>
  );
}

export default function MaterielAffiliesPage() {
  const [liens, setLiens] = useState<Lien[]>([]);
  const [lienChoisi, setLienChoisi] = useState<Lien | null>(null);
  const [couleur, setCouleur] = useState(COULEURS[0]);
  const [texte, setTexte] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [cookieJours, setCookieJours] = useState(30);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setBaseUrl(window.location.origin);
    fetch("/api/affiliation/liens")
      .then(r => r.json())
      .then(d => {
        const l = d.liens ?? [];
        setLiens(l);
        if (l.length) setLienChoisi(l[0]);
      });
  }, []);

  async function updateCookieJours(lienId: string, jours: number) {
    setLoading(true);
    await fetch("/api/affiliation/liens", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: lienId, cookieJours: jours }),
    }).catch(() => null);
    const r = await fetch("/api/affiliation/liens").then(r => r.json());
    setLiens(r.liens ?? []);
    setLoading(false);
  }

  function genererHTML(lien: Lien) {
    const url = `${baseUrl}?ref=${lien.code}`;
    const html = `<a href="${url}" style="display:inline-block;background:${couleur};color:white;padding:12px 28px;border-radius:12px;font-family:sans-serif;font-weight:bold;font-size:14px;text-decoration:none;">${texte || "Découvrez notre boutique"}</a>`;
    navigator.clipboard.writeText(html).then(() => alert("Code HTML copié !"));
  }

  const inp = "border border-[#E8E8E8] rounded-xl px-3 py-2 text-[13px] outline-none focus:border-[#F5A623]/60 bg-white";

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-[22px] font-bold text-[#111]">Matériel marketing affiliés</h1>
        <p className="text-[13px] text-[#888] mt-0.5">Bannières, liens trackés et ressources pour vos affiliés</p>
      </div>

      {/* Attribution cookieWindow */}
      <div className="bg-white border border-[#F0F0F0] rounded-2xl p-5">
        <h2 className="text-[14px] font-bold text-[#111] mb-3">Attribution multi-touch — Fenêtre cookie</h2>
        <p className="text-[12px] text-[#888] mb-4">La fenêtre d'attribution détermine combien de jours après le clic un affilié perçoit sa commission. Dernier clic gagne.</p>
        <div className="space-y-3">
          {liens.map(l => (
            <div key={l.id} className="flex items-center gap-4 p-3 bg-[#FAFAFA] rounded-xl">
              <div className="flex-1">
                <p className="text-[13px] font-semibold text-[#111]">Code: <span className="font-mono text-[#F5A623]">{l.code}</span></p>
                <p className="text-[11px] text-[#888]">{l.produit?.nom ?? "Boutique entière"} · {l.clics} clics · {l.conversions} conv.</p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  className={inp}
                  value={l.cookieJours}
                  onChange={e => updateCookieJours(l.id, parseInt(e.target.value))}
                >
                  {[1, 7, 14, 30, 60, 90].map(j => <option key={j} value={j}>{j} jours</option>)}
                </select>
              </div>
            </div>
          ))}
          {!liens.length && <p className="text-[13px] text-[#AAA] text-center py-4">Aucun lien d'affiliation. Crée-en depuis l'onglet Affiliation.</p>}
        </div>
      </div>

      {/* Générateur de bannières */}
      <div className="bg-white border border-[#F0F0F0] rounded-2xl p-5 space-y-4">
        <h2 className="text-[14px] font-bold text-[#111]">Générateur de bannières</h2>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] text-[#888] font-medium mb-1 block">Lien affilié</label>
            <select className={`w-full ${inp}`} value={lienChoisi?.id ?? ""} onChange={e => setLienChoisi(liens.find(l => l.id === e.target.value) ?? null)}>
              {liens.map(l => <option key={l.id} value={l.id}>{l.code} — {l.produit?.nom ?? "Boutique"}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[11px] text-[#888] font-medium mb-1 block">Texte du bouton</label>
            <input className={`w-full ${inp}`} placeholder="Découvrez nos produits" value={texte} onChange={e => setTexte(e.target.value)} />
          </div>
        </div>

        <div>
          <label className="text-[11px] text-[#888] font-medium mb-2 block">Couleur</label>
          <div className="flex gap-2">
            {COULEURS.map(c => (
              <button
                key={c}
                onClick={() => setCouleur(c)}
                className="w-8 h-8 rounded-full border-2 transition-all"
                style={{ background: c, borderColor: couleur === c ? "#111" : "transparent" }}
              />
            ))}
            <input type="color" value={couleur} onChange={e => setCouleur(e.target.value)}
              className="w-8 h-8 rounded-full cursor-pointer border-0 p-0 bg-transparent" title="Couleur personnalisée" />
          </div>
        </div>

        {lienChoisi && (
          <div className="space-y-3">
            <BannierePreview lien={lienChoisi} couleur={couleur} texte={texte} baseUrl={baseUrl} />
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => lienChoisi && genererHTML(lienChoisi)} className="flex items-center gap-1.5 border border-[#E8E8E8] px-3 py-2 rounded-xl text-[12px] text-[#666]">
                <Copy size={12} /> Code HTML
              </button>
              <button
                onClick={() => lienChoisi && navigator.clipboard.writeText(`${baseUrl}?ref=${lienChoisi.code}`).then(() => alert("URL copiée !"))}
                className="flex items-center gap-1.5 border border-[#E8E8E8] px-3 py-2 rounded-xl text-[12px] text-[#666]"
              >
                <Copy size={12} /> URL simple
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Guide textes pour affiliés */}
      <div className="bg-white border border-[#F0F0F0] rounded-2xl p-5">
        <h2 className="text-[14px] font-bold text-[#111] mb-3">Textes clé-en-main pour affiliés</h2>
        <p className="text-[12px] text-[#888] mb-4">Copie-colle ces textes à partager avec tes affiliés pour qu'ils puissent promouvoir efficacement.</p>
        {lienChoisi && (
          <div className="space-y-3">
            {[
              {
                label: "WhatsApp / SMS",
                texte: `🛍️ Je te recommande cette boutique ! Ils ont des produits top qualité. Commande ici : ${baseUrl}?ref=${lienChoisi.code}`,
              },
              {
                label: "Post Instagram / Facebook",
                texte: `✨ ${texte || "Découvrez cette boutique incroyable"} ! Des produits de qualité livrés rapidement. Lien en bio → ${baseUrl}?ref=${lienChoisi.code}`,
              },
              {
                label: "Email",
                texte: `Bonjour,\n\nJe voulais vous partager une boutique que j'aime beaucoup. Vous pouvez découvrir leurs produits ici :\n${baseUrl}?ref=${lienChoisi.code}\n\nBonne découverte !`,
              },
            ].map(t => (
              <div key={t.label} className="bg-[#FAFAFA] rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[11px] font-bold text-[#666]">{t.label}</p>
                  <button onClick={() => navigator.clipboard.writeText(t.texte).then(() => alert("Copié !"))}
                    className="flex items-center gap-1 text-[10px] border border-[#E8E8E8] px-2 py-0.5 rounded-lg text-[#666]">
                    <Copy size={9} /> Copier
                  </button>
                </div>
                <p className="text-[11px] text-[#666] leading-relaxed whitespace-pre-line">{t.texte}</p>
              </div>
            ))}
          </div>
        )}
        {!lienChoisi && <p className="text-[13px] text-[#AAA] text-center py-4">Sélectionne un lien affilié pour générer les textes.</p>}
      </div>
    </div>
  );
}
