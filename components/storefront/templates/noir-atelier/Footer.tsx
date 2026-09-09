import Link from "next/link";
import type { ThemeConfig } from "@/lib/theme-config";

interface Props {
  tenant: any;
  cfg: ThemeConfig;
  slug: string;
}

export function NoirAtelierFooter({ tenant, cfg, slug }: Props) {
  const c = cfg.colors;
  const collections: Array<{ slug: string; nom: string }> = tenant.collections || [];

  const navLinks = [
    { label: "Accueil", href: `/${slug}` },
    { label: "Produits", href: `/${slug}/produits` },
    ...(cfg.aboutPage?.actif ? [{ label: "À propos", href: `/${slug}/a-propos` }] : []),
    ...(cfg.contactPage?.actif ? [{ label: "Contact", href: `/${slug}/contact` }] : []),
    { label: "Suivi commande", href: "/suivi" },
  ];

  return (
    <footer style={{ padding: "60px 4vw 30px" }}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 pb-12" style={{ borderBottom: `1px solid ${c.bordure}` }}>
        <div className="lg:col-span-2">
          {tenant.logoUrl ? (
            <img src={tenant.logoUrl} alt={tenant.nomBoutique} className="h-9 mb-4 object-contain" />
          ) : (
            <p className="text-[19px] mb-4" style={{ fontFamily: "'Fraunces',serif" }}>{tenant.nomBoutique}</p>
          )}
          <p className="max-w-[32ch] text-[13.5px] leading-relaxed" style={{ fontFamily: "'Archivo Narrow',sans-serif", color: c.texteMuted }}>
            {tenant.description || `Pièces façonnées en petite série. ${tenant.pays ? `Basé à ${tenant.pays}.` : ""}`}
          </p>
        </div>

        <div>
          <p className="text-[13px] font-medium mb-4 uppercase tracking-wide" style={{ fontFamily: "'Archivo Narrow',sans-serif", color: c.texteMuted }}>Navigation</p>
          <div className="flex flex-col gap-2.5">
            {navLinks.map((l) => (
              <Link key={l.href} href={l.href} className="text-sm" style={{ fontFamily: "'Archivo Narrow',sans-serif" }}>{l.label}</Link>
            ))}
            {collections.slice(0, 3).map((col) => (
              <Link key={col.slug} href={`/${slug}/collections/${col.slug}`} className="text-sm" style={{ fontFamily: "'Archivo Narrow',sans-serif" }}>{col.nom}</Link>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[13px] font-medium mb-4 uppercase tracking-wide" style={{ fontFamily: "'Archivo Narrow',sans-serif", color: c.texteMuted }}>Contact</p>
          <div className="flex flex-col gap-2.5">
            {tenant.email && <a href={`mailto:${tenant.email}`} className="text-sm" style={{ fontFamily: "'Archivo Narrow',sans-serif" }}>{tenant.email}</a>}
            {tenant.whatsapp && (
              <a href={`https://wa.me/${tenant.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="text-sm" style={{ fontFamily: "'Archivo Narrow',sans-serif" }}>
                {tenant.whatsapp}
              </a>
            )}
            {tenant.adresse && <p className="text-sm" style={{ fontFamily: "'Archivo Narrow',sans-serif", color: c.texteMuted }}>{tenant.adresse}</p>}
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-5 text-xs" style={{ fontFamily: "'Archivo Narrow',sans-serif", color: c.texteMuted }}>
        <span>© {new Date().getFullYear()} {tenant.nomBoutique}</span>
        <span>Propulsé par Axso</span>
      </div>
    </footer>
  );
}
