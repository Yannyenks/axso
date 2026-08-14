import { NavbarMarketing } from "@/components/marketing/NavbarMarketing";
import { HeroSection } from "@/components/marketing/HeroSection";
import { PartenairesSection } from "@/components/marketing/PartenairesSection";
import { ConstructeurSection } from "@/components/marketing/ConstructeurSection";
import { XiaSection } from "@/components/marketing/XiaSection";
import { VideoSection } from "@/components/marketing/VideoSection";
import { TarifsSection } from "@/components/marketing/TarifsSection";
import { TemoignagesSection } from "@/components/marketing/TemoignagesSection";
import { FaqSection } from "@/components/marketing/FaqSection";
import { CtaFinal } from "@/components/marketing/CtaFinal";
import { FooterMarketing } from "@/components/marketing/FooterMarketing";

export default function HomePage() {
  return (
    <main className="overflow-x-hidden bg-white text-gray-900">
      <NavbarMarketing/>
      <HeroSection/>
      <PartenairesSection/>
      <ConstructeurSection/>
      <XiaSection/>
      <VideoSection/>
      <TarifsSection/>
      <TemoignagesSection/>
      <FaqSection/>
      <CtaFinal/>
      <FooterMarketing/>
    </main>
  );
}
