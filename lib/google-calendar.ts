export const GOOGLE_CALENDAR_SCOPE =
  "https://www.googleapis.com/auth/calendar.events.owned";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_REVOKE_URL = "https://oauth2.googleapis.com/revoke";
const GOOGLE_CALENDAR_API = "https://www.googleapis.com/calendar/v3";
const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;
const ACCESS_TOKEN_SAFETY_WINDOW_MS = 60 * 1000;

type RuntimeEnv = {
  DB?: D1Database;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GOOGLE_TOKEN_ENCRYPTION_KEY?: string;
  GOOGLE_OAUTH_REDIRECT_URI?: string;
};

type GoogleTokenSet = {
  access_token: string;
  refresh_token?: string;
  expires_at: number;
  scope: string;
  token_type: string;
};

type StoredConnection = {
  encrypted_tokens: string;
  encryption_iv: string;
  granted_scope: string;
};

type GoogleTokenResponse = {
  access_token?: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
  token_type?: string;
  error?: string;
  error_description?: string;
};

export class CalendarApiError extends Error {
  constructor(
    message: string,
    public status = 500,
    public code = "calendar_error",
  ) {
    super(message);
  }
}

function runtimeEnv(): RuntimeEnv {
  return (
    globalThis as typeof globalThis & {
      __SQUIRREL_RUNTIME_ENV__?: RuntimeEnv;
    }
  ).__SQUIRREL_RUNTIME_ENV__ || {};
}

function database(): D1Database {
  const db = runtimeEnv().DB;
  if (!db) {
    throw new CalendarApiError(
      "Calendar storage is not available yet.",
      503,
      "calendar_storage_unavailable",
    );
  }
  return db;
}

function requiredConfig(request?: Request) {
  const current = runtimeEnv();
  const redirectUri =
    current.GOOGLE_OAUTH_REDIRECT_URI?.trim() ||
    (request
      ? new URL("/api/calendar/oauth/callback", request.url).toString()
      : "");

  const missing = [
    ["GOOGLE_CLIENT_ID", current.GOOGLE_CLIENT_ID],
    ["GOOGLE_CLIENT_SECRET", current.GOOGLE_CLIENT_SECRET],
    ["GOOGLE_TOKEN_ENCRYPTION_KEY", current.GOOGLE_TOKEN_ENCRYPTION_KEY],
  ]
    .filter(([, value]) => !value?.trim())
    .map(([key]) => key);

  if (missing.length) {
    throw new CalendarApiError(
      `Google Calendar setup is incomplete: ${missing.join(", ")}.`,
      503,
      "calendar_not_configured",
    );
  }

  return {
    clientId: current.GOOGLE_CLIENT_ID!.trim(),
    clientSecret: current.GOOGLE_CLIENT_SECRET!.trim(),
    encryptionKey: current.GOOGLE_TOKEN_ENCRYPTION_KEY!.trim(),
    redirectUri,
  };
}

export function calendarConfigStatus(request: Request) {
  try {
    requiredConfig(request);
    database();
    return { configured: true, missing: [] as string[] };
  } catch (error) {
    if (error instanceof CalendarApiError) {
      const missing = error.message.includes(":")
        ? error.message
            .split(":")[1]
            .replace(".", "")
            .split(",")
            .map((item) => item.trim())
        : [];
      return { configured: false, missing };
    }
    return { configured: false, missing: [] as string[] };
  }
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array<ArrayBuffer> {
  let binary: string;
  try {
    binary = atob(value);
  } catch {
    throw new CalendarApiError(
      "The calendar token encryption key is not valid base64.",
      503,
      "invalid_encryption_key",
    );
  }

  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function encryptionKey(): Promise<CryptoKey> {
  const rawKey = base64ToBytes(requiredConfig().encryptionKey);
  if (rawKey.byteLength !== 32) {
    throw new CalendarApiError(
      "The calendar token encryption key must decode to exactly 32 bytes.",
      503,
      "invalid_encryption_key",
    );
  }

  return crypto.subtle.importKey("raw", rawKey, "AES-GCM", false, [
    "encrypt",
    "decrypt",
  ]);
}

async function encryptTokens(tokens: GoogleTokenSet) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plaintext = new TextEncoder().encode(JSON.stringify(tokens));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    await encryptionKey(),
    plaintext,
  );

  return {
    encryptedTokens: bytesToBase64(new Uint8Array(encrypted)),
    encryptionIv: bytesToBase64(iv),
  };
}

async function decryptTokens(row: StoredConnection): Promise<GoogleTokenSet> {
  try {
    const plaintext = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: base64ToBytes(row.encryption_iv) },
      await encryptionKey(),
      base64ToBytes(row.encrypted_tokens),
    );
    return JSON.parse(new TextDecoder().decode(plaintext)) as GoogleTokenSet;
  } catch (error) {
    if (error instanceof CalendarApiError) throw error;
    throw new CalendarApiError(
      "The saved Google Calendar connection could not be unlocked. Please reconnect.",
      401,
      "calendar_reconnect_required",
    );
  }
}

async function connectionRow(userId: string): Promise<StoredConnection | null> {
  return database()
    .prepare(
      `SELECT encrypted_tokens, encryption_iv, granted_scope
       FROM google_calendar_connections
       WHERE user_id = ?`,
    )
    .bind(userId)
    .first<StoredConnection>();
}

async function saveTokens(userId: string, tokens: GoogleTokenSet) {
  const encrypted = await encryptTokens(tokens);
  const now = Date.now();
  await database()
    .prepare(
      `INSERT INTO google_calendar_connections
        (user_id, encrypted_tokens, encryption_iv, granted_scope, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(user_id) DO UPDATE SET
         encrypted_tokens = excluded.encrypted_tokens,
         encryption_iv = excluded.encryption_iv,
         granted_scope = excluded.granted_scope,
         updated_at = excluded.updated_at`,
    )
    .bind(
      userId,
      encrypted.encryptedTokens,
      encrypted.encryptionIv,
      tokens.scope,
      now,
      now,
    )
    .run();
}

export async function hasCalendarConnection(userId: string) {
  return Boolean(await connectionRow(userId));
}

export async function createOAuthAuthorizationUrl(
  request: Request,
  userId: string,
  loginHint?: string,
) {
  const config = requiredConfig(request);
  const state = bytesToBase64(
    crypto.getRandomValues(new Uint8Array(32)),
  )
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
  const now = Date.now();

  await database().batch([
    database()
      .prepare("DELETE FROM google_oauth_states WHERE expires_at <= ?")
      .bind(now),
    database()
      .prepare(
        `INSERT INTO google_oauth_states (state, user_id, expires_at, created_at)
         VALUES (?, ?, ?, ?)`,
      )
      .bind(state, userId, now + OAUTH_STATE_TTL_MS, now),
  ]);

  const url = new URL(GOOGLE_AUTH_URL);
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", GOOGLE_CALENDAR_SCOPE);
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("include_granted_scopes", "true");
  url.searchParams.set("prompt", "consent select_account");
  url.searchParams.set("state", state);
  if (loginHint) url.searchParams.set("login_hint", loginHint);
  return url;
}

async function consumeOAuthState(state: string, userId: string) {
  const consumed = await database()
    .prepare(
      `DELETE FROM google_oauth_states
       WHERE state = ? AND user_id = ? AND expires_at > ?
       RETURNING state`,
    )
    .bind(state, userId, Date.now())
    .first<{ state: string }>();

  if (!consumed) {
    throw new CalendarApiError(
      "This Google connection attempt expired or could not be verified. Please try again.",
      400,
      "invalid_oauth_state",
    );
  }
}

async function tokenRequest(body: URLSearchParams): Promise<GoogleTokenResponse> {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });
  const result = (await response.json()) as GoogleTokenResponse;
  if (!response.ok || !result.access_token) {
    throw new CalendarApiError(
      result.error_description || "Google did not complete the calendar connection.",
      400,
      result.error || "google_token_exchange_failed",
    );
  }
  return result;
}

export async function completeOAuthConnection(
  request: Request,
  userId: string,
  state: string,
  code: string,
) {
  await consumeOAuthState(state, userId);
  const config = requiredConfig(request);
  const existingRow = await connectionRow(userId);
  const existingTokens = existingRow ? await decryptTokens(existingRow) : null;
  const result = await tokenRequest(
    new URLSearchParams({
      code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.redirectUri,
      grant_type: "authorization_code",
    }),
  );

  await saveTokens(userId, {
    access_token: result.access_token!,
    refresh_token: result.refresh_token || existingTokens?.refresh_token,
    expires_at: Date.now() + (result.expires_in ?? 3600) * 1000,
    scope: result.scope || GOOGLE_CALENDAR_SCOPE,
    token_type: result.token_type || "Bearer",
  });
}

async function accessToken(userId: string, forceRefresh = false) {
  const row = await connectionRow(userId);
  if (!row) {
    throw new CalendarApiError(
      "Google Calendar is not connected.",
      401,
      "calendar_not_connected",
    );
  }
  const tokens = await decryptTokens(row);
  if (
    !forceRefresh &&
    tokens.access_token &&
    tokens.expires_at > Date.now() + ACCESS_TOKEN_SAFETY_WINDOW_MS
  ) {
    return tokens.access_token;
  }
  if (!tokens.refresh_token) {
    throw new CalendarApiError(
      "Google Calendar needs to be reconnected.",
      401,
      "calendar_reconnect_required",
    );
  }

  const config = requiredConfig();
  const result = await tokenRequest(
    new URLSearchParams({
      refresh_token: tokens.refresh_token,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      grant_type: "refresh_token",
    }),
  );
  const refreshed: GoogleTokenSet = {
    ...tokens,
    access_token: result.access_token!,
    expires_at: Date.now() + (result.expires_in ?? 3600) * 1000,
    scope: result.scope || tokens.scope,
    token_type: result.token_type || tokens.token_type,
  };
  await saveTokens(userId, refreshed);
  return refreshed.access_token;
}

export async function googleCalendarRequest<T>(
  userId: string,
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const makeRequest = async (token: string) =>
    fetch(`${GOOGLE_CALENDAR_API}${path}`, {
      ...init,
      headers: {
        accept: "application/json",
        ...(init.body ? { "content-type": "application/json" } : {}),
        ...init.headers,
        authorization: `Bearer ${token}`,
      },
    });

  let response = await makeRequest(await accessToken(userId));
  if (response.status === 401) {
    response = await makeRequest(await accessToken(userId, true));
  }

  if (!response.ok) {
    let message = `Google Calendar returned ${response.status}.`;
    try {
      const result = (await response.json()) as {
        error?: { message?: string };
      };
      message = result.error?.message || message;
    } catch {
      // Keep the bounded fallback message.
    }
    throw new CalendarApiError(
      message,
      response.status === 403 ? 403 : 502,
      "google_calendar_api_error",
    );
  }

  return (await response.json()) as T;
}

export async function disconnectCalendar(userId: string) {
  const row = await connectionRow(userId);
  if (row) {
    try {
      const tokens = await decryptTokens(row);
      const token = tokens.refresh_token || tokens.access_token;
      if (token) {
        await fetch(GOOGLE_REVOKE_URL, {
          method: "POST",
          headers: { "content-type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ token }),
        });
      }
    } catch {
      // Removing the local token remains the safe fallback if Google is unavailable.
    }
  }
  await database()
    .prepare("DELETE FROM google_calendar_connections WHERE user_id = ?")
    .bind(userId)
    .run();
}
