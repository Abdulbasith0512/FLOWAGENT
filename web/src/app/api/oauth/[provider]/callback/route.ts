import { NextRequest, NextResponse } from "next/server";
import { OAUTH_PROVIDERS, redirectUri } from "@/lib/oauth/providers";
import { encryptSecret } from "@/lib/oauth/crypto";
import { requireUser } from "@/lib/session";
import { db, schema } from "@/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  const user = await requireUser();
  const { provider } = await params;
  const config = OAUTH_PROVIDERS[provider];
  const code = request.nextUrl.searchParams.get("code");
  if (!config || !code) {
    return NextResponse.redirect(new URL("/credentials?error=oauth", request.url));
  }

  const body = new URLSearchParams({
    client_id: config.clientId() ?? "",
    client_secret: config.clientSecret() ?? "",
    code,
    redirect_uri: redirectUri(provider),
    grant_type: "authorization_code",
  });

  const tokenRes = await fetch(config.tokenUrl, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const token = await tokenRes.json();
  const accessToken = token.access_token;
  if (!accessToken) {
    return NextResponse.redirect(new URL("/credentials?error=oauth", request.url));
  }

  const slug = `${provider}_oauth`;
  await db
    .insert(schema.credentials)
    .values({
      userId: user.id,
      name: `${provider} (OAuth)`,
      slug,
      type: "oauth2",
      ciphertext: encryptSecret(accessToken),
    })
    .onConflictDoUpdate({
      target: [schema.credentials.userId, schema.credentials.slug],
      set: { ciphertext: encryptSecret(accessToken), updatedAt: new Date() },
    });

  return NextResponse.redirect(new URL("/credentials?connected=" + provider, request.url));
}
