import type { BlockNode } from "@/lib/theme-config";
import type { TreeRenderCtx } from "../context";
import { blockStyleToCss } from "../styleUtils";
import { BlockTreeRenderer } from "../BlockTreeRenderer";

export function SectionContainer({ node, ctx }: { node: BlockNode; ctx: TreeRenderCtx }) {
  const selectionne = ctx.editable && ctx.selectedId === node.id;
  return (
    <section
      data-axs-id={node.id}
      style={blockStyleToCss(node.style)}
      className={[node.style?.customClass, selectionne ? "ax-libre-selected" : "", ctx.editable ? "ax-libre-hoverable" : ""].filter(Boolean).join(" ")}
      onClick={ctx.editable ? (e) => { e.stopPropagation(); ctx.onSelect?.(node.id); } : undefined}
    >
      <BlockTreeRenderer nodes={node.children ?? []} ctx={ctx} />
    </section>
  );
}
