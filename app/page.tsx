import { NavbarMarketing } from "@/components/marketing/NavbarMarketing";
import { HeroSection } from "@/components/marketing/HeroSection";
import { VideoSection } from "@/components/marketing/VideoSection";
import { TarifsSection } from "@/components/marketing/TarifsSection";
import { CtaFinal } from "@/components/marketing/CtaFinal";
import { FooterMarketing } from "@/components/marketing/FooterMarketing";

export default function HomePage() {
  return (
    <main className="overflow-x-hidden bg-white text-gray-900">
      <NavbarMarketing/>
      <HeroSection/>
      <VideoSection/>
      <TarifsSection/>
      <CtaFinal/>
      <FooterMarketing/>
    </main>
  );
}
