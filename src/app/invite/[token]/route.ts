import { NextRequest, NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { validateTokenAndCreateSession } from "@/lib/auth/session";
import { isAllowed, isAllowedInMemory, clientIp } from "@/lib/rate-limit";

const NOT_FOUND = () =>
  new Response("Not Found", {
    status: 404,
    headers: { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" },
  });

/**
 * GET /invite/[token]
 * Hash token → look up → create session (HttpOnly cookie) → redirect to /.
 * When traffic is busy, redirects to /?status=busy to show the waiting screen.
 */
export async function GET(request: NextRequest, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;

  // Basic shape check: tokens are 43-char base64url (32 random bytes)
  if (!/^[A-Za-z0-9_-]{20,128}$/.test(token)) return NOT_FOUND();

  const ip = clientIp(request.headers);

  // In-memory guard first (0 database calls)
  if (!isAllowedInMemory(`invite:${ip}`, 15, 60)) {
    return NextResponse.redirect(new URL("/?status=busy", request.url));
  }

  // DB-backed rate limit check
  if (!(await isAllowed("invite", ip, 15, 60))) {
    return NextResponse.redirect(new URL("/?status=busy", request.url));
  }

  const session = await validateTokenAndCreateSession(token);
  if (!session) return NOT_FOUND();

  redirect("/");
}
