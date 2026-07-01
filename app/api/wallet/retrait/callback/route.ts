// Webhook Flutterwave — confirmation de virement sortant
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const payload = await req.json();

  const { event, data } = payload;
  if (event !== "transfer.completed" && event !== "transfer.failed") {
    return NextResponse.json({ received: true });
  }

  const reference = data?.reference as string | undefined;
  if (!reference?.startsWith("AXSO-")) return NextResponse.json({ received: true });

  const retraitId = reference.replace("AXSO-", "");
  const statut = event === "transfer.completed" ? "complete" : "echoue";

  await prisma.retrait.update({
    where: { id: retraitId },
    data: { statut, updatedAt: new Date() },
  }).catch(() => {});

  return NextResponse.json({ received: true });
}
