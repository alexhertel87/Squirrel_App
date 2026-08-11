import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const googleCalendarConnections = sqliteTable(
  "google_calendar_connections",
  {
    userId: text("user_id").primaryKey(),
    encryptedTokens: text("encrypted_tokens").notNull(),
    encryptionIv: text("encryption_iv").notNull(),
    grantedScope: text("granted_scope").notNull(),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
);

export const googleOauthStates = sqliteTable("google_oauth_states", {
  state: text("state").primaryKey(),
  userId: text("user_id").notNull(),
  expiresAt: integer("expires_at").notNull(),
  createdAt: integer("created_at").notNull(),
});
