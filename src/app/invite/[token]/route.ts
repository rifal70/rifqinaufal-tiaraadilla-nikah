import { NextRequest } from "next/server";
import { redirect } from "next/navigation";
import { validateTokenAndCreateSession } from "@/lib/auth/session";
import { isAllowed, clientIp } from "@/lib/rate-limit";

const NOT_FOUND = () =>
  new Response("Not Found", {
    status: 404,
    headers: { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" },
  });

/**
 * GET /invite/[token]
 * Hash token → look up → create session (HttpOnly cookie) → redirect to /.
 * Invalid/revoked/expired/rate-limited all return the same generic 404.
 * The raw token is never stored or logged.
 */
export async function GET(request: NextRequest, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;

  // Basic shape check: tokens are 43-char base64url (32 random bytes)
  if (!/^[A-Za-z0-9_-]{20,128}$/.test(token)) return NOT_FOUND();

  if (!(await isAllowed("invite", clientIp(request.headers), 10, 60))) return NOT_FOUND();

  const session = await validateTokenAndCreateSession(token);
  if (!session) return NOT_FOUND();

  redirect("/");
}
