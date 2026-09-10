import type { ThemeConfig } from "@/lib/theme-config";

// Rendu d'un thème importé tel quel (voir lib/theme-import-clone.ts) : le
// HTML/CSS envoyé par le marchand est conservé littéralement (même
// copywriting, même mise en page) — seuls les produits, le panier et la
// navigation ont été branchés sur de vraies données AXSO au moment de
// l'import. Aucun script n'a jamais été exécuté ni conservé.
interface Props {
  cfg: ThemeConfig;
}

export function ImportedLiteralHomePage({ cfg }: Props) {
  return (
    <>
      {cfg.builderCss && <style dangerouslySetInnerHTML={{ __html: cfg.builderCss }} />}
      {cfg.builderHtml && <div dangerouslySetInnerHTML={{ __html: cfg.builderHtml }} />}
    </>
  );
}
