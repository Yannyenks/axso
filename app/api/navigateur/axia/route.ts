import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { pwSession } from "@/lib/playwright-session";

export const runtime = "nodejs";
export const maxDuration = 60;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

const SYSTEM_PROMPT = `Tu es AXIA, l'agent IA d'Axso qui contrôle un navigateur web réel via Playwright.
Tu aides l'utilisateur à gérer ses applications professionnelles (WhatsApp Business, Meta Ads, Gmail, TikTok, Mailchimp, Brevo, Buffer, Later, Facebook, Instagram, etc.).

Quand tu reçois une instruction + capture d'écran, tu dois :
1. Analyser l'écran actuel avec précision
2. Planifier les actions nécessaires en étapes claires et numérotées
3. Retourner un JSON structuré

Types d'actions disponibles :
- { type: "navigate", params: { url: "https://..." } }
- { type: "click", params: { x: number, y: number } }  — viewport 1280×800
- { type: "dblclick", params: { x: number, y: number } }
- { type: "type", params: { text: "..." } }
- { type: "key", params: { key: "Enter" | "Tab" | "Escape" | "Backspace" | "ArrowDown" | "Space" } }
- { type: "scroll", params: { deltaX: 0, deltaY: 300 } }  — positif = bas
- { type: "wait", params: { ms: 1200 } }
- { type: "back", params: {} }
- { type: "reload", params: {} }

Règles absolues :
- Ne JAMAIS stocker, transmettre ou afficher des mots de passe — demande à l'utilisateur de les saisir lui-même
- Utilise wait après navigate et click sur boutons importants
- Pour les campagnes email : navigue vers la plateforme, remplis les champs disponibles depuis le contexte fourni
- Pour les programmations de posts : ouvre Buffer/Later/Hootsuite selon ce qui est disponible
- Si l'écran montre une connexion requise, signale-le et arrête-toi
- Sois très précis sur les coordonnées (centre des éléments visibles)
- Fournis des stepLabels lisibles pour chaque action

Réponds UNIQUEMENT en JSON valide (sans markdown ni backticks) :
{
  "thinking": "Analyse de l'écran et stratégie en 2-4 phrases",
  "stepLabels": ["Description lisible étape 1", "Description lisible étape 2", ...],
  "actions": [...],
  "message": "Résumé de ce que tu vas faire / as fait",
  "requiresUserInput": false,
  "sensitiveAction": false
}`;

export async function POST(req: NextRequest) {
  if (process.env.VERCEL) {
    return NextResponse.json(
      { error: "Navigateur AXIA disponible uniquement en local — non supporté sur Vercel serverless.", available: false },
      { status: 503 }
    );
  }
  try {
    const body = await req.json();
    const { instruction, history = [], preview = false, executeActions = null } = body;

    // ── Mode execute : exécuter un plan pré-approuvé ───────────────────────
    if (executeActions) {
      const results: { label: string; status: "ok" | "error"; detail: string }[] = [];
      for (const item of executeActions) {
        try {
          await pwSession.action(item.action.type, item.action.params || {});
          results.push({ label: item.label, status: "ok", detail: item.action.type });
          if (["navigate", "click", "key"].includes(item.action.type)) {
            await new Promise(r => setTimeout(r, 700));
          }
        } catch (e: any) {
          results.push({ label: item.label, status: "error", detail: e.message });
        }
      }
      const finalShot = await pwSession.screenshot();
      return NextResponse.json({
        executed: true,
        results,
        screenshot: finalShot,
        tabs: pwSession.getTabList(),
        activeTabId: pwSession.getActiveTabId(),
      });
    }

    // ── Prendre screenshot frais avant raisonnement ─────────────────────────
    const screenshot = await pwSession.screenshot();
    if (!screenshot) {
      return NextResponse.json({
        message: "Aucun onglet ouvert. Ouvre un onglet d'abord.",
        actions: [], stepLabels: [], thinking: "", requiresUserInput: false,
      });
    }

    const tabs     = pwSession.getTabList();
    const activeId = pwSession.getActiveTabId();
    const activeTab = tabs.find(t => t.id === activeId);

    const messages: Anthropic.MessageParam[] = [
      ...history.slice(-6).map((m: any) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: "image/jpeg",
              data: screenshot.replace("data:image/jpeg;base64,", ""),
            },
          },
          {
            type: "text",
            text: `URL actuelle : ${activeTab?.url || "inconnue"}
Titre : ${activeTab?.title || "inconnue"}
Onglets : ${tabs.map(t => `${t.id === activeId ? "[ACTIF] " : ""}${t.title}`).join(", ")}

Instruction : ${instruction}`,
          },
        ],
      },
    ];

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages,
    });

    const raw = (response.content[0] as any).text;
    let parsed: any;
    try {
      const cleaned = raw.replace(/```json\n?|\n?```/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      return NextResponse.json({ message: raw, actions: [], stepLabels: [], thinking: "", requiresUserInput: false });
    }

    const { thinking = "", actions = [], stepLabels = [], message = "", requiresUserInput = false, sensitiveAction = false } = parsed;

    // ── Mode preview : plan uniquement, pas d'exécution ───────────────────
    if (preview) {
      return NextResponse.json({
        preview: true,
        thinking,
        actions,
        stepLabels,
        message,
        requiresUserInput,
        sensitiveAction,
        screenshot,
        tabs: pwSession.getTabList(),
        activeTabId: pwSession.getActiveTabId(),
      });
    }

    // ── Mode direct (autopilote) : exécution immédiate ────────────────────
    const results: string[] = [];
    for (const action of actions) {
      try {
        await pwSession.action(action.type, action.params || {});
        results.push(`✓ ${action.type}`);
        if (["navigate", "click", "key"].includes(action.type)) {
          await new Promise(r => setTimeout(r, 700));
        }
      } catch (e: any) {
        results.push(`✗ ${action.type}: ${e.message}`);
      }
    }

    const finalShot = await pwSession.screenshot();

    return NextResponse.json({
      thinking,
      message,
      actionsExecuted: results,
      screenshot: finalShot,
      tabs: pwSession.getTabList(),
      activeTabId: pwSession.getActiveTabId(),
    });
  } catch (err: any) {
    console.error("[navigateur/axia]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
