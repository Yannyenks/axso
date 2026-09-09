import Link from "next/link";
import { Mail, Phone, MapPin, MessageCircle } from "lucide-react";
import type { ThemeConfig } from "@/lib/theme-config";
import { ThemeEffect } from "@/components/themes/ThemeEffect";
import { CustomSectionsRenderer } from "@/components/storefront/CustomSectionsRenderer";
import { ContactForm } from "@/components/storefront/ContactForm";
import { ForgeNav } from "./Nav";
import { ForgeFooter } from "./Footer";

interface Props { tenant: any; cfg: ThemeConfig; slug: string }

export function ForgeContactPage({ tenant, cfg, slug }: Props) {
  const c = cfg.colors;
  const contactPage = cfg.contactPage;
  const afficherFormulaire = contactPage?.afficherFormulaire ?? true;
  const coordonnees = [
    tenant.telephone && { Icon: Phone, label: "Téléphone", value: tenant.telephone, href: `tel:${tenant.telephone.replace(/\s/g, "")}` },
    tenant.whatsapp && { Icon: MessageCircle, label: "WhatsApp", value: tenant.whatsapp, href: `https://wa.me/${tenant.whatsapp.replace(/\D/g, "")}` },
    tenant.email && { Icon: Mail, label: "Email", value: tenant.email, href: `mailto:${tenant.email}` },
    tenant.adresse && { Icon: MapPin, label: "Adresse", value: tenant.adresse, href: undefined },
  ].filter(Boolean) as Array<{ Icon: any; label: string; value: string; href?: string }>;

  return (
    <div style={{ backgroundColor: c.fond, color: c.texte, minHeight: "100vh" }}>
      <ThemeEffect themeId={tenant.themeId} />
      <ForgeNav tenant={tenant} cfg={cfg} slug={slug} />
      <div style={{ padding: "50px 4vw 10px" }}>
        <h1 className="text-[32px]">Contact</h1>
        <p className="mt-2 text-sm font-mono" style={{ color: c.texteMuted }}><Link href={`/${slug}`}>{tenant.nomBoutique}</Link> · Contact</p>
        {contactPage?.intro && <p className="mt-4 max-w-xl font-mono text-[13px]" style={{ color: c.texteMuted }}>{contactPage.intro}</p>}
      </div>
      <section style={{ padding: "30px 4vw 80px" }}>
        <div className="grid lg:grid-cols-2 gap-10">
          <div className="space-y-3">
            {coordonnees.length === 0 && <p className="text-sm font-mono" style={{ color: c.texteMuted }}>Aucune coordonnée renseignée pour l'instant.</p>}
            {coordonnees.map((item, i) => {
              const content = (
                <div className="flex items-center gap-3 p-4" style={{ border: `1px solid ${c.bordure}` }}>
                  <item.Icon size={16} style={{ color: c.accent }} />
                  <div className="min-w-0"><p className="text-[11px]" style={{ color: c.texteMuted }}>{item.label.toUpperCase()}</p><p className="text-sm truncate">{item.value}</p></div>
                </div>
              );
              return item.href ? <a key={i} href={item.href} target={item.href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" className="block">{content}</a> : <div key={i}>{content}</div>;
            })}
          </div>
          {afficherFormulaire && <ContactForm slug={slug} accent={c.accent} texte={c.texte} fond={c.fond} />}
        </div>
      </section>
      {contactPage?.sections?.length ? <CustomSectionsRenderer sections={contactPage.sections} slug={slug} colors={{ accent: c.accent, texte: c.texte, fond: c.fond }} container="max-w-[1280px]" sectionPy="py-16" /> : null}
      <ForgeFooter tenant={tenant} cfg={cfg} slug={slug} />
    </div>
  );
}
