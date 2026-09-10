import type { BlockNode } from "@/lib/theme-config";
import type { TreeRenderCtx } from "./context";
import { BLOCK_REGISTRY } from "./registry";
import { blockStyleToCss } from "./styleUtils";
import { SectionContainer } from "./containers/SectionContainer";
import { RowContainer } from "./containers/RowContainer";
import { ColumnContainer } from "./containers/ColumnContainer";

// Rendu récursif de l'arbre du constructeur libre — utilisé à la fois par le
// canevas du tableau de bord (édition, ctx.editable=true) et par le
// storefront public (lecture seule, SSR). Même sortie visuelle dans les deux
// cas ; seules les affordances de sélection changent.
export function BlockTreeRenderer({ nodes, ctx }: { nodes: BlockNode[]; ctx: TreeRenderCtx }) {
  return (
    <>
      {(nodes ?? []).filter((n) => n.actif !== false).map((node) => {
        if (node.type === "section") return <SectionContainer key={node.id} node={node} ctx={ctx} />;
        if (node.type === "row") return <RowContainer key={node.id} node={node} ctx={ctx} />;
        if (node.type === "column") return <ColumnContainer key={node.id} node={node} ctx={ctx} />;

        const Widget = BLOCK_REGISTRY[node.type];
        if (!Widget) return null;
        const selectionne = ctx.editable && ctx.selectedId === node.id;
        return (
          <div
            key={node.id}
            data-axs-id={node.id}
            style={blockStyleToCss(node.style)}
            className={[node.style?.customClass, selectionne ? "ax-libre-selected" : "", ctx.editable ? "ax-libre-hoverable" : ""].filter(Boolean).join(" ")}
            onClick={ctx.editable ? (e) => { e.stopPropagation(); ctx.onSelect?.(node.id); } : undefined}
          >
            <Widget id={node.id} config={node.config ?? {}} colors={ctx.colors} slug={ctx.slug} container={ctx.container} sectionPy={ctx.sectionPy} />
          </div>
        );
      })}
    </>
  );
}
