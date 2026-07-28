import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const maxDuration = 60;

const SYSTEM_BASE = `Tu es AXIA, l'agent IA expert d'Axso — la plateforme e-commerce numéro 1 pour entrepreneurs africains.
Tu es intelligent, analytique et tu réponds avec la qualité de Claude ou GPT-4 mais spécialisé e-commerce africain.
Tu parles exclusivement français, tu es direct, précis, et tes conseils sont immédiatement actionnables.
Tu analyses les données boutique fournies pour donner des réponses personnalisées et concrètes.
Ne dis jamais "en tant qu'IA" — réponds directement comme un expert qui connaît la boutique par cœur.`;

// ─── Pré-charge toutes les données boutique comme contexte ────────────────────

async function buildContext(tenantId: string): Promise<string> {
  try {
    const [tenant, produits, commandes, clients, revenus] = await Promise.all([
      prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { nomBoutique: true, pays: true, devise: true, categorie: true },
      }).catch(() => null),
      prisma.produit.findMany({
        where: { tenantId, actif: true },
        select: { nom: true, stock: true, prix: true, categorie: true, cout: true },
        take: 30,
        orderBy: { stock: "asc" },
      }).catch(() => []),
      prisma.commande.findMany({
        where: { tenantId },
        select: { statut: true, montantTotal: true, clientNom: true, ville: true, createdAt: true },
        take: 30,
        orderBy: { createdAt: "desc" },
      }).catch(() => []),
      prisma.client.findMany({
        where: { tenantId },
        select: { nom: true, totalDepense: true, totalCommandes: true, ville: true },
        take: 20,
        orderBy: { totalDepense: "desc" },
      }).catch(() => []),
      prisma.commande.aggregate({
        where: { tenantId, statut: "livree" },
        _sum: { montantTotal: true },
        _count: true,
      }).catch(() => null),
    ]);

    const parts: string[] = ["\n\n---\n## DONNÉES BOUTIQUE EN TEMPS RÉEL"];

    if (tenant) {
      parts.push(`**Boutique:** ${tenant.nomBoutique} | **Pays:** ${tenant.pays ?? "non défini"} | **Devise:** ${tenant.devise ?? "FCFA"} | **Catégorie:** ${tenant.categorie ?? "non définie"}`);
    }

    if (produits.length > 0) {
      const stockCritique = produits.filter(p => p.stock <= 5);
      const stockNormal = produits.filter(p => p.stock > 5);
      parts.push(`\n**Stock (${produits.length} produits actifs)**`);
      if (stockCritique.length > 0) {
        parts.push(`⚠️ Stock critique: ${stockCritique.map(p => `${p.nom} (${p.stock} restants, prix: ${p.prix})`).join(" | ")}`);
      }
      parts.push(`Produits: ${stockNormal.slice(0, 15).map(p => `${p.nom} — prix: ${p.prix}, stock: ${p.stock}`).join(" | ")}`);
    }

    if (commandes.length > 0) {
      const byStatut: Record<string, number> = {};
      commandes.forEach(c => { byStatut[c.statut] = (byStatut[c.statut] || 0) + 1; });
      const recent = commandes.slice(0, 5);
      parts.push(`\n**Commandes récentes (${commandes.length} affichées)**`);
      parts.push(`Statuts: ${Object.entries(byStatut).map(([k, v]) => `${k}(${v})`).join(", ")}`);
      parts.push(`Dernières: ${recent.map(c => `${c.clientNom ?? "Client"} — ${c.statut} — ${c.montantTotal ?? 0}`).join(" | ")}`);
    }

    if (clients.length > 0) {
      parts.push(`\n**Top clients (${clients.length})**`);
      parts.push(clients.slice(0, 10).map(c => `${c.nom} — ${c.totalCommandes} cmds — ${c.totalDepense ?? 0} dépensé`).join(" | "));
    }

    if (revenus) {
      parts.push(`\n**Revenus livrés:** ${(revenus._sum?.montantTotal ?? 0).toLocaleString("fr-FR")} (${revenus._count} commandes livrées)`);
    }

    return parts.join("\n");
  } catch {
    return "";
  }
}

// ─── Streaming Gemini ─────────────────────────────────────────────────────────

async function streamGemini(
  controller: ReadableStreamDefaultController<Uint8Array>,
  encoder: TextEncoder,
  systemPrompt: string,
  messages: Array<{ role: string; content: string }>
): Promise<void> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY manquant");

  const res = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
    {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "gemini-2.5-flash",
        max_tokens: 4096,
        stream: true,
        messages: [{ role: "system", content: systemPrompt }, ...messages],
      }),
    }
  );

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Gemini ${res.status}: ${txt.slice(0, 100)}`);
  }

  const reader = res.body!.getReader();
  const dec = new TextDecoder();
  let buf = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const payload = line.slice(6).trim();
      if (payload === "[DONE]") return;
      try {
        const chunk = JSON.parse(payload);
        const text = chunk.choices?.[0]?.delta?.content;
        if (text) controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "token", text })}\n\n`));
      } catch {}
    }
  }
}

// ─── Streaming Groq ───────────────────────────────────────────────────────────

async function streamGroq(
  controller: ReadableStreamDefaultController<Uint8Array>,
  encoder: TextEncoder,
  systemPrompt: string,
  messages: Array<{ role: string; content: string }>
): Promise<void> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY manquant");

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      max_tokens: 4096,
      stream: true,
      messages: [{ role: "system", content: systemPrompt }, ...messages],
    }),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Groq ${res.status}: ${txt.slice(0, 100)}`);
  }

  const reader = res.body!.getReader();
  const dec = new TextDecoder();
  let buf = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const payload = line.slice(6).trim();
      if (payload === "[DONE]") return;
      try {
        const chunk = JSON.parse(payload);
        const text = chunk.choices?.[0]?.delta?.content;
        if (text) controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "token", text })}\n\n`));
      } catch {}
    }
  }
}

// ─── Complétion simple (non-streaming, pour les outils MillionaireSuite) ─────

async function completeSimple(systemPrompt: string, userPrompt: string): Promise<string> {
  // Gemini
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    try {
      const res = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${geminiKey}` },
          body: JSON.stringify({
            model: "gemini-2.5-flash",
            max_tokens: 2048,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
          }),
        }
      );
      if (res.ok) {
        const data = await res.json();
        return data.choices?.[0]?.message?.content ?? "";
      }
    } catch {}
  }

  // Groq fallback
  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${groqKey}` },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          max_tokens: 2048,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        }),
      });
      if (res.ok) {
        const data = await res.json();
        return data.choices?.[0]?.message?.content ?? "";
      }
    } catch {}
  }

  return "Service IA momentanément indisponible.";
}

// ─── Handler principal ────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return new Response("Non autorisé", { status: 401 });

  const tenantId = (session.user as any)?.tenantId as string | undefined;
  const body = await req.json();
  const { messages, stream: wantStream } = body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response("Messages requis", { status: 400 });
  }

  // Pré-charge les données boutique
  const context = tenantId ? await buildContext(tenantId) : "";
  const systemPrompt = SYSTEM_BASE + context;

  // Filtre les messages assistant initiaux (les LLM exigent que le premier message soit user)
  const idx = messages.findIndex((m: any) => m.role === "user");
  const toSend: Array<{ role: string; content: string }> = (idx >= 0 ? messages.slice(idx) : messages)
    .map((m: any) => ({ role: m.role, content: m.content }));

  // ── Mode non-streaming (outils MillionaireSuite) ──────────────────────────
  if (!wantStream) {
    const userPrompt = toSend[toSend.length - 1]?.content ?? "";
    const reponse = await completeSimple(systemPrompt, userPrompt);
    return Response.json({ reponse });
  }

  // ── Mode streaming (chat AXIA) ────────────────────────────────────────────
  const encoder = new TextEncoder();
  const readableStream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let done = false;

      const finish = () => {
        if (done) return;
        done = true;
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`));
          controller.close();
        } catch {}
      };

      // Gemini en priorité
      try {
        await streamGemini(controller, encoder, systemPrompt, toSend);
        finish();
        return;
      } catch (e1) {
        console.warn("[AXIA] Gemini failed:", (e1 as Error).message?.slice(0, 80));
      }

      // Groq en fallback
      try {
        await streamGroq(controller, encoder, systemPrompt, toSend);
        finish();
        return;
      } catch (e2) {
        console.warn("[AXIA] Groq failed:", (e2 as Error).message?.slice(0, 80));
      }

      // Message d'erreur final
      try {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "token", text: "Service IA momentanément indisponible. Vérifie tes clés API (GEMINI_API_KEY / GROQ_API_KEY) dans les variables d'environnement Vercel." })}\n\n`)
        );
      } catch {}
      finish();
    },
  });

  return new Response(readableStream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
