export interface OAuthProvider {
  authorizeUrl: string;
  tokenUrl: string;
  scope: string;
  clientId: () => string | undefined;
  clientSecret: () => string | undefined;
}

export const OAUTH_PROVIDERS: Record<string, OAuthProvider> = {
  google: {
    authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    scope: "https://www.googleapis.com/auth/userinfo.email",
    clientId: () => process.env.GOOGLE_OAUTH_CLIENT_ID,
    clientSecret: () => process.env.GOOGLE_OAUTH_CLIENT_SECRET,
  },
  github: {
    authorizeUrl: "https://github.com/login/oauth/authorize",
    tokenUrl: "https://github.com/login/oauth/access_token",
    scope: "repo",
    clientId: () => process.env.GITHUB_OAUTH_CLIENT_ID,
    clientSecret: () => process.env.GITHUB_OAUTH_CLIENT_SECRET,
  },
  slack: {
    authorizeUrl: "https://slack.com/oauth/v2/authorize",
    tokenUrl: "https://slack.com/api/oauth.v2.access",
    scope: "chat:write",
    clientId: () => process.env.SLACK_OAUTH_CLIENT_ID,
    clientSecret: () => process.env.SLACK_OAUTH_CLIENT_SECRET,
  },
};

export function redirectUri(provider: string): string {
  const base = process.env.APP_BASE_URL ?? "http://localhost:3000";
  return `${base}/api/oauth/${provider}/callback`;
}
