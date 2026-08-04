import { NavbarMarketing } from "@/components/marketing/NavbarMarketing";
import { FooterMarketing } from "@/components/marketing/FooterMarketing";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact — AXSO",
  description: "Contactez l'équipe AXSO. Support, partenariats, presse : nous répondons en moins de 24h.",
};

const CHANNELS = [
  { emoji: "💬", titre: "Chat en direct", desc: "Réponse en quelques minutes", lien: "#", label: "Ouvrir le chat", accent: "#F5A623" },
  { emoji: "📧", titre: "Email support", desc: "support@axso.app", lien: "mailto:support@axso.app", label: "Envoyer un email", accent: "#7c3aed" },
  { emoji: "📱", titre: "WhatsApp Business", desc: "+221 77 000 00 00", lien: "https://wa.me/221770000000", label: "Envoyer un message", accent: "#25D366" },
];

export default function ContactPage() {
  return (
    <main className="bg-[#080808] text-white min-h-screen" style={{ fontFamily: "'Poppins','Century Gothic',system-ui,sans-serif" }}>
      <NavbarMarketing />

      {/* Hero */}
      <section className="pt-36 pb-24 px-6 sm:px-10 lg:px-16 xl:px-24 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(ellipse, rgba(245,166,35,0.1) 0%, transparent 65%)" }} />
        <div className="max-w-2xl mx-auto text-center relative">
          <span className="inline-block text-xs font-bold uppercase tracking-[0.2em] mb-5" style={{ color: "#F5A623" }}>
            ✉️ Contactez-nous
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold mb-6 leading-tight">
            Une question ?<br />
            <span style={{ background: "linear-gradient(135deg,#F5A623,#d4880d)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              Nous sommes là.
            </span>
          </h1>
          <p className="text-white/50 text-lg leading-relaxed">
            Notre équipe répond en moins de 24h. Pour les urgences, utilisez le chat en direct.
          </p>
        </div>
      </section>

      {/* Channels */}
      <section className="px-6 sm:px-10 lg:px-16 xl:px-24 pb-20">
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-5 mb-20">
          {CHANNELS.map(ch => (
            <a key={ch.titre} href={ch.lien} target="_blank" rel="noopener noreferrer"
              className="group rounded-3xl p-7 border transition-all duration-300 hover:-translate-y-1 block"
              style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.08)" }}>
              <div className="text-4xl mb-4">{ch.emoji}</div>
              <h3 className="font-bold text-white mb-1">{ch.titre}</h3>
              <p className="text-white/45 text-sm mb-5">{ch.desc}</p>
              <span className="text-xs font-bold px-4 py-2 rounded-full inline-block transition-all group-hover:scale-105"
                style={{ background: `${ch.accent}15`, color: ch.accent, border: `1px solid ${ch.accent}30` }}>
                {ch.label} →
              </span>
            </a>
          ))}
        </div>

        {/* Contact form */}
        <div className="max-w-xl mx-auto">
          <div className="rounded-3xl p-8 border"
            style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(245,166,35,0.2)", backdropFilter: "blur(20px)" }}>
            <h2 className="text-2xl font-bold mb-2">Envoyer un message</h2>
            <p className="text-white/40 text-sm mb-7">Nous répondons sous 24h en jours ouvrés.</p>

            <style>{`
              .axso-input { background:#0d0d0d; border:1px solid rgba(255,255,255,0.1); color:#fff; width:100%; border-radius:12px; padding:14px 16px; font-size:14px; outline:none; transition:all .2s; }
              .axso-input::placeholder { color:rgba(255,255,255,0.3); }
              .axso-input:focus { border-color:rgba(245,166,35,0.5); box-shadow:0 0 0 3px rgba(245,166,35,0.08); }
            `}</style>
            <form className="space-y-4" action="mailto:support@axso.app" method="get">
              <div>
                <label className="block text-white/55 text-sm font-medium mb-1.5">Votre nom</label>
                <input type="text" name="name" placeholder="Aminata Diallo" className="axso-input" />
              </div>
              <div>
                <label className="block text-white/55 text-sm font-medium mb-1.5">Email</label>
                <input type="email" name="email" placeholder="aminata@example.com" className="axso-input" />
              </div>
              <div>
                <label className="block text-white/55 text-sm font-medium mb-1.5">Sujet</label>
                <input type="text" name="subject" placeholder="Support, partenariat, presse..." className="axso-input" />
              </div>
              <div>
                <label className="block text-white/55 text-sm font-medium mb-1.5">Message</label>
                <textarea rows={4} name="body" placeholder="Décrivez votre demande..." className="axso-input" style={{ resize: "none" }} />
              </div>
              <button type="submit"
                className="w-full font-bold py-4 rounded-xl transition-all hover:scale-[1.02] active:scale-95"
                style={{ background: "linear-gradient(135deg,#F5A623,#d4880d)", color: "#080808", boxShadow: "0 8px 30px rgba(245,166,35,0.3)" }}>
                Envoyer le message →
              </button>
            </form>
          </div>
        </div>
      </section>

      <FooterMarketing />
    </main>
  );
}
