import { NextResponse } from "next/server";
import { pwSession } from "@/lib/playwright-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const dataUrl = await pwSession.screenshot();
    if (!dataUrl) {
      return NextResponse.json({ screenshot: null, tabs: [], activeTabId: null });
    }
    return NextResponse.json({
      screenshot: dataUrl,
      tabs: pwSession.getTabList(),
      activeTabId: pwSession.getActiveTabId(),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
