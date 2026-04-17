import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const addr = req.nextUrl.searchParams.get("addr");
  if (!addr) {
    return NextResponse.json({ error: "Missing addr" }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://friendbot.stellar.org?addr=${encodeURIComponent(addr)}`
    );
    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Friendbot request failed" }, { status: 500 });
  }
}
