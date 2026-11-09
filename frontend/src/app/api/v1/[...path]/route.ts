import { NextRequest, NextResponse } from "next/server";

function getBackendBaseUrl(): string {
  return process.env.INTERNAL_BACKEND_URL || "http://backend:8000";
}

async function handleProxy(request: NextRequest, { params }: { params: { path: string[] } }) {
  const backendBase = getBackendBaseUrl();
  const subPath = params.path ? params.path.join("/") : "";
  const query = request.nextUrl.search;
  const targetUrl = `${backendBase}/api/v1/${subPath}${query}`;

  try {
    const forwardHeaders = new Headers();
    request.headers.forEach((val, key) => {
      // Do not forward host to prevent hostname mismatch inside Docker
      if (key.toLowerCase() !== "host" && key.toLowerCase() !== "connection") {
        forwardHeaders.set(key, val);
      }
    });

    forwardHeaders.set("x-forwarded-host", request.headers.get("host") || "");
    forwardHeaders.set("x-forwarded-proto", request.nextUrl.protocol.replace(":", ""));

    const bodyBuffer = ["GET", "HEAD"].includes(request.method) ? undefined : await request.arrayBuffer();

    const response = await fetch(targetUrl, {
      method: request.method,
      headers: forwardHeaders,
      body: bodyBuffer,
      redirect: "manual",
    });

    const responseHeaders = new Headers();
    response.headers.forEach((val, key) => {
      if (key.toLowerCase() !== "content-encoding") {
        responseHeaders.set(key, val);
      }
    });

    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error: any) {
    console.error(`[Next.js API Proxy Error] Failed to reach backend at ${targetUrl}:`, error);
    return NextResponse.json(
      {
        error: "Backend Service Connection Failure",
        message: `Failed to proxy ${request.method} request to backend container at ${targetUrl}.`,
        details: error?.message || String(error),
        tip: "Ensure backend container 'phillip_backend' is running on port 8000 and accessible via INTERNAL_BACKEND_URL.",
      },
      { status: 502 }
    );
  }
}

export const GET = handleProxy;
export const POST = handleProxy;
export const PUT = handleProxy;
export const DELETE = handleProxy;
export const PATCH = handleProxy;
export const OPTIONS = handleProxy;

