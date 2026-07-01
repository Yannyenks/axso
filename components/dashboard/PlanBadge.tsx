import { cn } from "@/lib/utils";

type Plan = "gratuit" | "starter" | "pro" | "business";

const PLAN_CONFIG: Record<Plan, { label: string; couleur: string; bg: string; border: string }> = {
  gratuit:  { label: "Gratuit",  couleur: "#6b7280", bg: "#6b728015", border: "#6b728030" },
  starter:  { label: "Starter",  couleur: "#3b82f6", bg: "#3b82f615", border: "#3b82f630" },
  pro:      { label: "Pro",      couleur: "#7c3aed", bg: "#7c3aed15", border: "#7c3aed30" },
  business: { label: "Business", couleur: "#F5A623", bg: "#F5A62315", border: "#F5A62330" },
};

interface PlanBadgeProps {
  plan: string;
  className?: string;
  size?: "sm" | "md";
}

export function PlanBadge({ plan, className, size = "md" }: PlanBadgeProps) {
  const key = (plan?.toLowerCase() ?? "gratuit") as Plan;
  const config = PLAN_CONFIG[key] ?? PLAN_CONFIG.gratuit;

  return (
    <span
      className={cn(
        "inline-flex items-center font-semibold rounded-full",
        size === "sm" ? "text-[10px] px-2 py-0.5" : "text-xs px-3 py-1",
        className
      )}
      style={{
        color: config.couleur,
        backgroundColor: config.bg,
        border: `1px solid ${config.border}`,
      }}
    >
      {config.label}
    </span>
  );
}
