import Link from "next/link";
import type { ThemeConfig } from "@/lib/theme-config";

interface Props { tenant: any; cfg: ThemeConfig; slug: string }

export function ForgeFooter({ tenant, cfg, slug }: Props) {
  const c = cfg.colors;
  const navLinks = [
    { label: "Accueil", href: `/${slug}` },
    { label: "Produits", href: `/${slug}/produits` },
    ...(cfg.aboutPage?.actif ? [{ label: "À propos", href: `/${slug}/a-propos` }] : []),
    ...(cfg.contactPage?.actif ? [{ label: "Contact", href: `/${slug}/contact` }] : []),
    { label: "Suivi commande", href: "/suivi" },
  ];

  return (
    <footer style={{ padding: "60px 4vw 30px" }}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 pb-11" style={{ borderBottom: `1px solid ${c.bordure}` }}>
        <div className="lg:col-span-2">
          {tenant.logoUrl ? <img src={tenant.logoUrl} alt={tenant.nomBoutique} className="h-8 mb-3.5 object-contain" /> : <p className="text-lg uppercase font-extrabold mb-3.5">{tenant.nomBoutique}</p>}
          <p className="max-w-[28ch] text-[12.5px]" style={{ color: c.texteMuted }}>{tenant.description || "Équipement technique testé sur le terrain."}</p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wide mb-4" style={{ color: c.texteMuted }}>Boutique</p>
          <div className="flex flex-col gap-2.5">{navLinks.map((l) => <Link key={l.href} href={l.href} className="text-[13.5px]">{l.label}</Link>)}</div>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wide mb-4" style={{ color: c.texteMuted }}>Marque</p>
          <div className="flex flex-col gap-2.5">
            {tenant.email && <a href={`mailto:${tenant.email}`} className="text-[13.5px]">{tenant.email}</a>}
            {tenant.whatsapp && <a href={`https://wa.me/${tenant.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="text-[13.5px]">{tenant.whatsapp}</a>}
          </div>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-5 text-[11px]" style={{ color: c.texteMuted }}>
        <span>© {new Date().getFullYear()} {tenant.nomBoutique}</span>
        <span>Propulsé par Axso</span>
      </div>
    </footer>
  );
}
