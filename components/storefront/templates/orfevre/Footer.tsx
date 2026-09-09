import Link from "next/link";
import type { ThemeConfig } from "@/lib/theme-config";

interface Props { tenant: any; cfg: ThemeConfig; slug: string }

export function OrfevreFooter({ tenant, cfg, slug }: Props) {
  const c = cfg.colors;
  const navLinks = [
    { label: "Accueil", href: `/${slug}` },
    { label: "Produits", href: `/${slug}/produits` },
    ...(cfg.aboutPage?.actif ? [{ label: "À propos", href: `/${slug}/a-propos` }] : []),
    ...(cfg.contactPage?.actif ? [{ label: "Contact", href: `/${slug}/contact` }] : []),
    { label: "Suivi commande", href: "/suivi" },
  ];

  return (
    <footer style={{ padding: "70px 4vw 30px", textAlign: "center" }}>
      <ul className="flex flex-wrap justify-center gap-9 list-none text-[12.5px] uppercase tracking-widest mb-10">
        {navLinks.map((l) => <li key={l.href}><Link href={l.href}>{l.label}</Link></li>)}
      </ul>
      <div className="text-[11.5px] uppercase tracking-wide pt-6" style={{ color: c.texteMuted, borderTop: `1px solid ${c.bordure}` }}>
        © {new Date().getFullYear()} {tenant.nomBoutique} · Propulsé par Axso
      </div>
    </footer>
  );
}
