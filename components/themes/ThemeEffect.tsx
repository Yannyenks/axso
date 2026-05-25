// Sélecteur d'effet de thème — rendu conditionnel selon themeId
"use client";
import dynamic from "next/dynamic";

const NoirObsidienEffect = dynamic(() => import("@/components/effects/NoirObsidienEffect").then((m) => ({ default: m.NoirObsidienEffect })), { ssr: false });
const VioletCosmosEffect = dynamic(() => import("@/components/effects/VioletCosmosEffect").then((m) => ({ default: m.VioletCosmosEffect })), { ssr: false });
const TerreEtOrEffect = dynamic(() => import("@/components/effects/TerreEtOrEffect").then((m) => ({ default: m.TerreEtOrEffect })), { ssr: false });
const OceanAtlantiqueEffect = dynamic(() => import("@/components/effects/OceanAtlantiqueEffect").then((m) => ({ default: m.OceanAtlantiqueEffect })), { ssr: false });
const KenteRoyalEffect = dynamic(() => import("@/components/effects/KenteRoyalEffect").then((m) => ({ default: m.KenteRoyalEffect })), { ssr: false });
const BwitiForestEffect = dynamic(() => import("@/components/effects/BwitiForestEffect").then((m) => ({ default: m.BwitiForestEffect })), { ssr: false });

export function ThemeEffect({ themeId }: { themeId: string }) {
  if (themeId === "noir-obsidien") return <NoirObsidienEffect />;
  if (themeId === "violet-cosmos") return <VioletCosmosEffect />;
  if (themeId === "terre-et-or") return <TerreEtOrEffect />;
  if (themeId === "ocean-atlantique") return <OceanAtlantiqueEffect />;
  if (themeId === "kente-royal") return <KenteRoyalEffect />;
  if (themeId === "bwiti-forest") return <BwitiForestEffect />;
  return null;
}
