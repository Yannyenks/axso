import { NextRequest, NextResponse } from "next/server";
import { pwSession } from "@/lib/playwright-session";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { type, params } = await req.json();
    await pwSession.action(type, params || {});

    // Return updated state
    const screenshot = await pwSession.screenshot();
    return NextResponse.json({
      ok: true,
      screenshot,
      tabs: pwSession.getTabList(),
      activeTabId: pwSession.getActiveTabId(),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
