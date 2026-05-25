// Landing page Axso — Le Shopify de l'Afrique
import { HeroSection } from "@/components/marketing/HeroSection";
import { StatsSection } from "@/components/marketing/StatsSection";
import { ThemesSection } from "@/components/marketing/ThemesSection";
import { PaiementsSection } from "@/components/marketing/PaiementsSection";
import { TarifsSection } from "@/components/marketing/TarifsSection";
import { TemoignagesSection } from "@/components/marketing/TemoignagesSection";
import { FaqSection } from "@/components/marketing/FaqSection";
import { PresseSection } from "@/components/marketing/PresseSection";
import { CtaFinal } from "@/components/marketing/CtaFinal";
import { NavbarMarketing } from "@/components/marketing/NavbarMarketing";
import { FooterMarketing } from "@/components/marketing/FooterMarketing";

export default function HomePage() {
  return (
    <main className="bg-white text-gray-900 overflow-x-hidden">
      <NavbarMarketing />
      <HeroSection />
      <StatsSection />
      <ThemesSection />
      <PaiementsSection />
      <TarifsSection />
      <TemoignagesSection />
      <PresseSection />
      <FaqSection />
      <CtaFinal />
      <FooterMarketing />
    </main>
  );
}
