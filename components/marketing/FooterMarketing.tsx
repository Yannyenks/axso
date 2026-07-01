import Link from "next/link";

const liens = {
  Produit: [
    { label: "Thèmes", href: "/themes" },
    { label: "Tarifs", href: "/pricing" },
    { label: "Intégrations", href: "/#paiements" },
    { label: "Fonctionnalités", href: "/#fonctionnalites" },
  ],
  Ressources: [
    { label: "Blog", href: "/blog" },
    { label: "Documentation", href: "/docs" },
    { label: "Tutoriels vidéo", href: "/tutorials" },
    { label: "Communauté", href: "/community" },
  ],
  Entreprise: [
    { label: "À propos", href: "/about" },
    { label: "Carrières", href: "/jobs" },
    { label: "Presse", href: "/press" },
    { label: "Contact", href: "/contact" },
  ],
  Légal: [
    { label: "Conditions d'utilisation", href: "/legal/cgu" },
    { label: "Politique de confidentialité", href: "/legal/privacy" },
    { label: "Cookies", href: "/legal/cookies" },
    { label: "Commissions", href: "/legal/commissions" },
  ],
};

export function FooterMarketing() {
  return (
    <footer className="bg-gray-900 pt-16 pb-8">
      <div className="w-full px-6 sm:px-10 lg:px-16 xl:px-24">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          <div className="col-span-2 lg:col-span-1">
            <Link href="/" className="inline-block mb-4">
              <div className="bg-white rounded-xl px-2 py-1 inline-block">
                <img src="/logo.png" alt="axso" style={{ height: "44px", width: "auto", objectFit: "contain" }} />
              </div>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed mb-4">
              Le Shopify de l'Afrique. Lancez votre boutique en ligne en 3 minutes.
            </p>
            <div className="flex gap-3">
              {["T", "F", "I", "L"].map((s, i) => (
                <a key={i} href="#"
                  className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center text-gray-400 hover:text-[#1B4FD8] hover:bg-gray-700 transition-all text-xs font-bold">
                  {s}
                </a>
              ))}
            </div>
          </div>

          {Object.entries(liens).map(([section, items]) => (
            <div key={section}>
              <h4 className="text-white font-semibold mb-4 text-sm">{section}</h4>
              <ul className="space-y-2.5">
                {items.map((lien) => (
                  <li key={lien.label}>
                    <Link href={lien.href} className="text-gray-400 text-sm hover:text-[#1B4FD8] transition-colors">
                      {lien.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-sm">© {new Date().getFullYear()} Axso Technologies. Tous droits réservés.</p>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>🇫🇷 Français</span>
            <span>|</span>
            <span>🇬🇧 English</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
