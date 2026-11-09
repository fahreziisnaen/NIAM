import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const backendBase = process.env.INTERNAL_BACKEND_URL || "http://backend:8000";
  const targetUrl = `${backendBase}/health`;

  try {
    const res = await fetch(targetUrl);
    const data = await res.json();
    return NextResponse.json({
      frontend: "online",
      backend_proxy: data,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        frontend: "online",
        backend_proxy: "unreachable",
        target: targetUrl,
        error: error?.message || String(error),
      },
      { status: 502 }
    );
  }
}

