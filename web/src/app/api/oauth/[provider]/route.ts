import { NextRequest, NextResponse } from "next/server";
import { OAUTH_PROVIDERS, redirectUri } from "@/lib/oauth/providers";
import { requireUser } from "@/lib/session";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  await requireUser();
  const { provider } = await params;
  const config = OAUTH_PROVIDERS[provider];
  if (!config) {
    return NextResponse.json({ error: "Unknown provider" }, { status: 404 });
  }
  const clientId = config.clientId();
  if (!clientId) {
    return NextResponse.json(
      { error: `${provider} OAuth is not configured` },
      { status: 400 },
    );
  }

  const url = new URL(config.authorizeUrl);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri(provider));
  url.searchParams.set("scope", config.scope);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("access_type", "offline");

  return NextResponse.redirect(url.toString());
}
