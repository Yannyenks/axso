import type { ThemeColors } from "@/lib/theme-config";

// Props partagées par tous les widgets de la bibliothèque de blocs —
// utilisées à la fois par l'ancien système (CustomSectionsRenderer, liste
// plate) et le nouvel arbre libre (BlockTreeRenderer). `config` garde
// exactement la même forme que CustomSection.config par type, aucune
// migration de données nécessaire entre les deux systèmes.
export interface BlockRenderProps {
  id: string;
  config: Record<string, any>;
  colors: Pick<ThemeColors, "accent" | "texte" | "fond">;
  slug: string;
  container: string;
  sectionPy: string;
}
