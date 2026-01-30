// src/proxy.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

function unauthorized() {
  return new NextResponse("Unauthorized", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Habit App"' },
  });
}

function decodeBasicAuth(authHeader: string) {
  // "Basic base64(user:pass)"
  const base64 = authHeader.slice("Basic ".length).trim();
  try {
    const decoded = atob(base64);
    const idx = decoded.indexOf(":");
    if (idx === -1) return null;
    return {
      user: decoded.slice(0, idx),
      pass: decoded.slice(idx + 1),
    };
  } catch {
    return null;
  }
}

export function proxy(req: NextRequest) {
  const user = process.env.BASIC_AUTH_USER;
  const pass = process.env.BASIC_AUTH_PASS;

  // 未設定なら素通し（開発用）
  if (!user || !pass) return NextResponse.next();

  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Basic ")) return unauthorized();

  const creds = decodeBasicAuth(auth);
  if (!creds) return unauthorized();

  if (creds.user === user && creds.pass === pass) return NextResponse.next();
  return unauthorized();
}
