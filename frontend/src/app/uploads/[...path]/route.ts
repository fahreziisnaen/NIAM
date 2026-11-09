import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, { params }: { params: { path: string[] } }) {
  const backendBase = process.env.INTERNAL_BACKEND_URL || "http://backend:8000";
  const subPath = params.path ? params.path.join("/") : "";
  const targetUrl = `${backendBase}/uploads/${subPath}`;

  try {
    const res = await fetch(targetUrl);
    const body = await res.arrayBuffer();
    const headers = new Headers();
    const contentType = res.headers.get("content-type");
    if (contentType) headers.set("content-type", contentType);

    return new NextResponse(body, {
      status: res.status,
      headers: headers,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Upload file not found or backend unreachable", details: error?.message },
      { status: 502 }
    );
  }
}

