import { NextRequest, NextResponse } from "next/server";
import { pwSession } from "@/lib/playwright-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function state(screenshot: string | null) {
  return {
    tabs: pwSession.getTabList(),
    activeTabId: pwSession.getActiveTabId(),
    screenshot,
    error: pwSession.lastError || null,
    ready: pwSession.isReady(),
  };
}

export async function GET() {
  return NextResponse.json(state(null));
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const id = await pwSession.newTab(body.url || "https://www.google.com");
    const screenshot = await pwSession.screenshot();
    return NextResponse.json({ tabId: id, ...state(screenshot) });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, tabs: [], activeTabId: null, screenshot: null, ready: false }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id } = await req.json();
    pwSession.setActiveTab(id);
    const screenshot = await pwSession.screenshot();
    return NextResponse.json(state(screenshot));
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    await pwSession.closeTab(id);
    const screenshot = await pwSession.screenshot();
    return NextResponse.json(state(screenshot));
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
