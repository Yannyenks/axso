import { NavbarMarketing } from "@/components/marketing/NavbarMarketing";
import { HeroSection } from "@/components/marketing/HeroSection";
import { DouleurSection } from "@/components/marketing/DouleurSection";
import { VideoSection } from "@/components/marketing/VideoSection";
import { TarifsSection } from "@/components/marketing/TarifsSection";
import { TemoignagesSection } from "@/components/marketing/TemoignagesSection";
import { CtaFinal } from "@/components/marketing/CtaFinal";
import { FooterMarketing } from "@/components/marketing/FooterMarketing";

export default function HomePage() {
  return (
    <main className="overflow-x-hidden bg-white text-gray-900">
      <NavbarMarketing/>
      <HeroSection/>
      <DouleurSection/>
      <VideoSection/>
      <TarifsSection/>
      <TemoignagesSection/>
      <CtaFinal/>
      <FooterMarketing/>
    </main>
  );
}
