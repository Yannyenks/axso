import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Check, X, CreditCard, Zap, Crown, HelpCircle, Globe } from "lucide-react";
import { PlanBadge } from "@/components/dashboard/PlanBadge";
import AbonnementActions from "./AbonnementActions";
import { PAYS_DEVISES } from "@/lib/ai-agent";
import { convertirDepuisXAF } from "@/lib/paiement-securite";
import { planActif } from "@/lib/abonnement";

// ─── Plans Axso ──────────────────────────────────────────────────────────────
const PLANS = [
  {
    id: "palier0",
    nom: "Essentiel",
    palier: "Palier 0",
    prixXAF: 0,
    description: "Démarrez votre activité en ligne",
    couleur: "#6b7280",
    bg: "rgba(107,114,128,0.08)",
    border: "rgba(107,114,128,0.2)",
    icone: CreditCard,
    recommande: false,
    features: [
      { label: "Commandes limitées (30/mois)", ok: true },
      { label: "WhatsApp Business intégré", ok: true },
      { label: "AXIA IA — outils essentiels", ok: true },
      { label: "Social Media intégré", ok: true },
      { label: "1 boutique en ligne", ok: true },
      { label: "Commandes illimitées", ok: false },
      { label: "IA avancée (agents, automatisations)", ok: false },
      { label: "Sourcing dropshipping mondial", ok: false },
      { label: "Analytics avancés", ok: false },
    ],
  },
  {
    id: "palier1",
    nom: "Pro",
    palier: "Palier 1",
    prixXAF: 6000,
    description: "Scalez sans contrainte",
    couleur: "#F5A623",
    bg: "rgba(245,166,35,0.08)",
    border: "rgba(245,166,35,0.3)",
    icone: Zap,
    recommande: true,
    features: [
      { label: "Commandes illimitées", ok: true },
      { label: "WhatsApp Business intégré", ok: true },
      { label: "AXIA IA — outils avancés (agents, automatisations)", ok: true },
      { label: "Marketing & campagnes (email, SMS, réseaux sociaux)", ok: true },
      { label: "Analytics avancés — historique complet", ok: true },
      { label: "Sourcing dropshipping mondial", ok: false },
      { label: "Analytics temps réel", ok: false },
      { label: "Multi-boutique", ok: false },
    ],
  },
  {
    id: "palier2",
    nom: "Illimité",
    palier: "Palier 2",
    prixXAF: 20000,
    description: "Aucune limite — puissance totale",
    couleur: "#1B2A4A",
    bg: "rgba(124,58,237,0.08)",
    border: "rgba(124,58,237,0.35)",
    icone: Crown,
    recommande: false,
    features: [
      { label: "AUCUNE LIMITE — tout inclus", ok: true },
      { label: "AXIA IA — tous les outils (médias, ads, entrepôts…)", ok: true },
      { label: "Sourcing dropshipping mondial", ok: true },
      { label: "Analytics temps réel", ok: true },
      { label: "Multi-boutique", ok: true },
      { label: "Support prioritaire 24/7", ok: true },
    ],
  },
] as const;

type PlanId = (typeof PLANS)[number]["id"];

const FAQ = [
  {
    q: "Puis-je changer de plan à tout moment ?",
    r: "Oui. Le changement est immédiat. Si vous montez de palier, vous accédez instantanément aux nouvelles fonctionnalités.",
  },
  {
    q: "Comment fonctionne la limite de commandes au Palier 0 ?",
    r: "Au Palier 0 vous pouvez recevoir jusqu'à 30 commandes par mois. Au-delà, vos commandes continuent d'arriver normalement, mais vous ne pouvez plus les gérer (statuts, livreurs, retours, factures) ni utiliser WhatsApp tant que vous n'upgradez pas ou que le mois ne change pas.",
  },
  {
    q: "Le Palier 2 inclut vraiment tout sans supplément ?",
    r: "Oui. Le Palier 2 'Illimité' supprime toutes les limites : commandes, IA, sourcing mondial, analytics et boutiques. Aucun frais caché.",
  },
  {
    q: "Les prix sont-ils affichés en ma devise locale ?",
    r: "Oui, les prix sont automatiquement convertis dans la devise de votre pays pour vous donner une idée du coût. La facturation s'effectue en FCFA ou via votre opérateur local.",
  },
];

// ─── Page ────────────────────────────────────────────────────────────────────
export default async function AbonnementPage() {
  const session = await auth();
  if (!session) redirect("/connexion");

  const tenantId = (session.user as any)?.tenantId;
  if (!tenantId) redirect("/inscription");

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { planType: true, nomBoutique: true, pays: true, devise: true },
  });

  // planActif() normalise les valeurs héritées ("gratuit", "premium"...) en
  // palier0 — évite d'afficher aucune carte comme "actuelle" pour les
  // boutiques créées avant l'introduction des paliers.
  const { plan: planActuel } = await planActif(tenantId);
  const nomPlan = PLANS.find(p => p.id === planActuel)?.nom ?? "Essentiel";
  const pays    = tenant?.pays ?? "CM";
  const devise  = tenant?.devise ?? PAYS_DEVISES[pays] ?? "XAF";

  return (
    <div className="space-y-8 max-w-4xl" style={{ fontFamily: "'Poppins','Century Gothic',system-ui,sans-serif" }}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <CreditCard size={18} className="text-[#F5A623]" />
            <h1 className="text-2xl font-bold text-gray-900">
              Abonnement · <span style={{ color: "#F5A623" }}>{nomPlan}</span>
            </h1>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-gray-400 text-sm">Choisissez votre palier Axso</p>
            {devise !== "XAF" && devise !== "XOF" && (
              <span className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                <Globe size={9} /> Prix en {devise}
              </span>
            )}
          </div>
        </div>
        <PlanBadge plan={planActuel} />
      </div>

      {/* ── Cards plans ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {PLANS.map((plan) => {
          const estActuel = plan.id === planActuel;
          const Icone = plan.icone;

          // Conversion prix
          const prixLocal = convertirDepuisXAF(plan.prixXAF, devise);
          const afficherXAF = devise === "XAF" || devise === "XOF";

          return (
            <div key={plan.id}
              className="relative flex flex-col rounded-3xl bg-white border transition-all"
              style={{
                borderColor: plan.recommande ? plan.border : estActuel ? plan.border : "#e5e7eb",
                boxShadow: plan.recommande
                  ? `0 12px 40px ${plan.couleur}18`
                  : estActuel ? `0 4px 20px ${plan.couleur}15` : "0 1px 6px #0000000a",
                transform: plan.recommande ? "scale(1.02)" : "none",
              }}>

              {plan.recommande && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-white text-[10px] font-black px-4 py-1.5 rounded-full shadow-lg whitespace-nowrap"
                  style={{ background: `linear-gradient(135deg, ${plan.couleur}, #c97a10)` }}>
                  ⚡ Recommandé
                </div>
              )}
              {estActuel && !plan.recommande && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-white text-[10px] font-bold px-3 py-1 rounded-full whitespace-nowrap"
                  style={{ background: plan.couleur }}>
                  Plan actuel
                </div>
              )}

              <div className="p-6 flex-1 flex flex-col">
                {/* Label palier */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[9px] font-black tracking-widest uppercase px-2.5 py-1 rounded-full"
                    style={{ background: plan.bg, color: plan.couleur, border: `1px solid ${plan.border}` }}>
                    {plan.palier}
                  </span>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ background: plan.bg, border: `1px solid ${plan.border}` }}>
                    <Icone size={15} style={{ color: plan.couleur }} />
                  </div>
                </div>

                {/* Nom + description */}
                <h3 className="text-xl font-black text-gray-900 mb-0.5">{plan.nom}</h3>
                <p className="text-gray-400 text-xs mb-4 leading-snug">{plan.description}</p>

                {/* Prix */}
                <div className="mb-5">
                  {plan.prixXAF === 0 ? (
                    <div className="flex items-baseline gap-1">
                      <p className="text-4xl font-black" style={{ color: plan.couleur }}>Gratuit</p>
                    </div>
                  ) : (
                    <div className="flex items-baseline gap-1">
                      <p className="text-4xl font-black" style={{ color: plan.couleur }}>
                        {afficherXAF
                          ? plan.prixXAF.toLocaleString("fr-FR")
                          : prixLocal.toLocaleString("fr-FR")}
                      </p>
                      <span className="text-gray-400 text-sm font-semibold">
                        {afficherXAF ? "FCFA" : devise}/mois
                      </span>
                    </div>
                  )}
                  {plan.prixXAF !== 0 && !afficherXAF && (
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      ≈ {plan.prixXAF.toLocaleString("fr-FR")} FCFA/mois
                    </p>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-2 flex-1 mb-6">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2">
                      {f.ok ? (
                        <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                          style={{ background: plan.bg, border: `1px solid ${plan.border}` }}>
                          <Check size={9} style={{ color: plan.couleur }} />
                        </div>
                      ) : (
                        <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 bg-gray-50 border border-gray-100">
                          <X size={9} className="text-gray-300" />
                        </div>
                      )}
                      <span className={`text-xs leading-tight ${f.ok ? "text-gray-700 font-medium" : "text-gray-400"}`}>
                        {f.label}
                      </span>
                    </li>
                  ))}
                </ul>

                <AbonnementActions planId={plan.id} planActuel={planActuel} couleur={plan.couleur} />
              </div>
            </div>
          );
        })}
      </div>

      {/* ── FAQ ─────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-5">
          <HelpCircle size={16} className="text-[#F5A623]" />
          <h2 className="font-bold text-gray-900">Questions fréquentes</h2>
        </div>
        <div className="space-y-4">
          {FAQ.map((item, i) => (
            <div key={i} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
              <p className="font-semibold text-gray-800 text-sm mb-1">{item.q}</p>
              <p className="text-gray-500 text-sm leading-relaxed">{item.r}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
