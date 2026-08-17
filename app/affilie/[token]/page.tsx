"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import {
  Copy, Check, TrendingUp, MousePointerClick, Percent, Wallet,
  MessageCircle, Camera, Mail, Award, ChevronRight, Clock, CheckCircle2, XCircle,
} from "lucide-react";

export default function PortailAffiliePage() {
  const params = useParams<{ token: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copie, setCopie] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/affilie/${params.token}`)
      .then((r) => r.json())
      .then((d) => { if (!d.error) setData(d); })
      .finally(() => setLoading(false));
  }, [params.token]);

  function copier(texte: string, id: string) {
    navigator.clipboard.writeText(texte).then(() => {
      setCopie(id);
      toast.success("Copié !");
      setTimeout(() => setCopie(null), 2000);
    });
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#FAFAFA" }}>
        <div style={{ width: 32, height: 32, border: "3px solid #F5A623", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#FAFAFA", fontFamily: "system-ui,sans-serif" }}>
        <p style={{ color: "#888" }}>Portail introuvable.</p>
      </div>
    );
  }

  const { affilie, programme, palier, tenant, commissions, paiements } = data;
  const appUrl = typeof window !== "undefined" ? window.location.origin : "";
  const lienPartage = `${appUrl}/${tenant.slug}?ref=${affilie.codeParrainage}`;

  const textes = [
    { id: "whatsapp", label: "WhatsApp", Icon: MessageCircle, couleur: "#25D366",
      texte: `🛍️ Je te recommande *${tenant.nomBoutique}* ! Des produits top qualité. Commande ici : ${lienPartage}` },
    { id: "instagram", label: "Instagram / Facebook", Icon: Camera, couleur: "#E1306C",
      texte: `✨ Découvrez ${tenant.nomBoutique} ! Des produits de qualité livrés rapidement. Lien en bio → ${lienPartage}` },
    { id: "email", label: "Email", Icon: Mail, couleur: "#6b7280",
      texte: `Bonjour,\n\nJe voulais vous partager une boutique que j'aime beaucoup : ${tenant.nomBoutique}.\nDécouvrez leurs produits ici :\n${lienPartage}\n\nBonne découverte !` },
  ];

  const STATUT_BADGE: Record<string, { label: string; color: string }> = {
    pending: { label: "En attente", color: "#F5A623" },
    approuvee: { label: "Approuvée", color: "#3b82f6" },
    payee: { label: "Payée", color: "#10b981" },
    rejetee: { label: "Rejetée", color: "#ef4444" },
  };

  return (
    <div style={{ minHeight: "100vh", background: "#FAFAFA", fontFamily: "'Poppins',system-ui,sans-serif" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#1B2A4A,#111827)", padding: "32px 20px 60px", color: "white" }}>
        <div style={{ maxWidth: 560, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            {tenant.logoUrl && <img src={tenant.logoUrl} alt="" style={{ height: 28, borderRadius: 6 }} />}
            <span style={{ fontSize: 12, fontWeight: 600, opacity: 0.7, letterSpacing: "0.08em", textTransform: "uppercase" }}>{tenant.nomBoutique} · Programme partenaires</span>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Bonjour, {affilie.nom.split(" ")[0]} 👋</h1>
          <p style={{ fontSize: 13, opacity: 0.65 }}>
            {affilie.statut === "actif" ? "Votre compte partenaire est actif — partagez votre lien pour commencer à gagner." : "Votre candidature est en cours d'examen par le marchand."}
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 560, margin: "-40px auto 0", padding: "0 20px 60px" }}>
        {/* Lien de parrainage */}
        <div style={{ background: "white", borderRadius: 20, padding: 20, boxShadow: "0 8px 30px rgba(0,0,0,0.08)", marginBottom: 16 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Votre lien de parrainage</p>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#FAFAFA", border: "1px solid #F0F0F0", borderRadius: 14, padding: "10px 14px" }}>
            <span style={{ flex: 1, fontSize: 13, fontFamily: "monospace", color: "#111", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{lienPartage}</span>
            <button onClick={() => copier(lienPartage, "lien")} style={{ flexShrink: 0, background: "#F5A623", border: "none", borderRadius: 10, padding: "8px 12px", display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
              {copie === "lien" ? <Check size={13} color="white" /> : <Copy size={13} color="white" />}
            </button>
          </div>
          <p style={{ fontSize: 12, color: "#F5A623", fontWeight: 700, marginTop: 10, fontFamily: "monospace" }}>Code : {affilie.codeParrainage}</p>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12, marginBottom: 16 }}>
          {[
            { label: "Clics", value: affilie.clics, Icon: MousePointerClick, color: "#3b82f6" },
            { label: "Conversions", value: affilie.conversions, Icon: TrendingUp, color: "#10b981" },
            { label: "Taux de conversion", value: `${affilie.tauxConversion}%`, Icon: Percent, color: "#8b5cf6" },
            { label: "Palier actuel", value: palier?.nom ?? "—", Icon: Award, color: "#F5A623" },
          ].map((s) => (
            <div key={s.label} style={{ background: "white", borderRadius: 16, padding: 16, boxShadow: "0 4px 16px rgba(0,0,0,0.04)" }}>
              <s.Icon size={14} style={{ color: s.color, marginBottom: 6 }} />
              <p style={{ fontSize: 18, fontWeight: 800, color: "#111" }}>{s.value}</p>
              <p style={{ fontSize: 10.5, color: "#999" }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Palier / progression */}
        {palier && palier.prochainPalier && (
          <div style={{ background: "white", borderRadius: 20, padding: 20, marginBottom: 16, boxShadow: "0 4px 16px rgba(0,0,0,0.04)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <p style={{ fontSize: 12.5, fontWeight: 700, color: "#111" }}>Palier {palier.nom} — {palier.tauxActuel}%</p>
              <p style={{ fontSize: 11, color: "#888" }}>{palier.conversionsRestantes} vente{palier.conversionsRestantes! > 1 ? "s" : ""} avant {palier.prochainPalier}</p>
            </div>
            <div style={{ height: 8, background: "#F0F0F0", borderRadius: 99, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${Math.min(100, (affilie.conversions / (affilie.conversions + palier.conversionsRestantes)) * 100)}%`, background: "linear-gradient(90deg,#F5A623,#FFD280)", borderRadius: 99 }} />
            </div>
          </div>
        )}

        {/* Gains */}
        <div style={{ background: "linear-gradient(135deg,#F5A623,#e09520)", borderRadius: 20, padding: 20, marginBottom: 16, color: "white" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <Wallet size={16} />
            <p style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", opacity: 0.9 }}>Vos gains</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <p style={{ fontSize: 22, fontWeight: 800 }}>{affilie.commissionTotal.toLocaleString()} <span style={{ fontSize: 12 }}>{tenant.devise}</span></p>
              <p style={{ fontSize: 11, opacity: 0.85 }}>Total gagné</p>
            </div>
            <div>
              <p style={{ fontSize: 22, fontWeight: 800 }}>{affilie.commissionPending.toLocaleString()} <span style={{ fontSize: 12 }}>{tenant.devise}</span></p>
              <p style={{ fontSize: 11, opacity: 0.85 }}>En attente de paiement</p>
            </div>
          </div>
        </div>

        {/* Textes prêts à partager */}
        <div style={{ background: "white", borderRadius: 20, padding: 20, marginBottom: 16, boxShadow: "0 4px 16px rgba(0,0,0,0.04)" }}>
          <p style={{ fontSize: 12.5, fontWeight: 700, color: "#111", marginBottom: 14 }}>Textes prêts à partager</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {textes.map((t) => (
              <div key={t.id} style={{ border: "1px solid #F0F0F0", borderRadius: 14, padding: 14 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <t.Icon size={13} style={{ color: t.couleur }} />
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: "#111" }}>{t.label}</span>
                  </div>
                  <button onClick={() => copier(t.texte, t.id)} style={{ background: "#FAFAFA", border: "1px solid #F0F0F0", borderRadius: 8, padding: "4px 10px", fontSize: 10.5, fontWeight: 700, color: "#666", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                    {copie === t.id ? <Check size={11} /> : <Copy size={11} />} Copier
                  </button>
                </div>
                <p style={{ fontSize: 11.5, color: "#666", whiteSpace: "pre-line", lineHeight: 1.5 }}>{t.texte}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Commissions récentes */}
        <div style={{ background: "white", borderRadius: 20, padding: 20, marginBottom: 16, boxShadow: "0 4px 16px rgba(0,0,0,0.04)" }}>
          <p style={{ fontSize: 12.5, fontWeight: 700, color: "#111", marginBottom: 12 }}>Commissions récentes</p>
          {commissions.length === 0 ? (
            <p style={{ fontSize: 12, color: "#999", textAlign: "center", padding: "16px 0" }}>Aucune commission pour le moment — partagez votre lien pour commencer !</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {commissions.map((c: any) => {
                const b = STATUT_BADGE[c.statut] ?? { label: c.statut, color: "#888" };
                return (
                  <div key={c.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #F8F8F8" }}>
                    <div>
                      <p style={{ fontSize: 12, color: "#111", fontWeight: 600 }}>{c.montantCommission.toLocaleString()} {tenant.devise}</p>
                      <p style={{ fontSize: 10.5, color: "#AAA" }}>{new Date(c.createdAt).toLocaleDateString("fr-FR")}</p>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 99, color: b.color, background: `${b.color}15` }}>{b.label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Historique paiements */}
        {paiements.length > 0 && (
          <div style={{ background: "white", borderRadius: 20, padding: 20, boxShadow: "0 4px 16px rgba(0,0,0,0.04)" }}>
            <p style={{ fontSize: 12.5, fontWeight: 700, color: "#111", marginBottom: 12 }}>Historique de paiement</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {paiements.map((p: any) => (
                <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid #F8F8F8" }}>
                  {p.statut === "traite" ? <CheckCircle2 size={14} color="#10b981" /> : p.statut === "echec" ? <XCircle size={14} color="#ef4444" /> : <Clock size={14} color="#F5A623" />}
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 12, color: "#111", fontWeight: 600 }}>{p.montant.toLocaleString()} {tenant.devise}</p>
                    <p style={{ fontSize: 10.5, color: "#AAA" }}>{new Date(p.createdAt).toLocaleDateString("fr-FR")}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <p style={{ textAlign: "center", fontSize: 11, color: "#BBB", marginTop: 24 }}>
          Propulsé par <span style={{ color: "#F5A623", fontWeight: 700 }}>Axso</span>
        </p>
      </div>
    </div>
  );
}
