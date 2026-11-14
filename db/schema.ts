import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

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

export const profiles = sqliteTable("profiles", {
  userId: text("user_id").primaryKey(),
  displayName: text("display_name").notNull(),
  email: text("email").notNull(),
  pronouns: text("pronouns"),
  timezone: text("timezone").notNull().default("America/Chicago"),
  darkMode: integer("dark_mode").notNull().default(0),
  highContrast: integer("high_contrast").notNull().default(0),
  reducedMotion: integer("reduced_motion").notNull().default(0),
  density: text("density").notNull().default("comfortable"),
  textScale: text("text_scale").notNull().default("medium"),
  colorIntensity: text("color_intensity").notNull().default("soft"),
  notificationMode: text("notification_mode").notNull().default("gentle"),
  humorLevel: text("humor_level").notNull().default("full"),
  timerDirection: text("timer_direction").notNull().default("down"),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const terms = sqliteTable(
  "terms",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    name: text("name").notNull(),
    startDate: text("start_date"),
    endDate: text("end_date"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [index("terms_user_sort_idx").on(table.userId, table.sortOrder)],
);

export const courses = sqliteTable(
  "courses",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    termId: text("term_id").notNull(),
    name: text("name").notNull(),
    code: text("code"),
    instructor: text("instructor"),
    color: text("color").notNull().default("#36bde8"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [index("courses_user_term_idx").on(table.userId, table.termId)],
);

export const assignments = sqliteTable(
  "assignments",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    courseId: text("course_id").notNull(),
    title: text("title").notNull(),
    dueAt: text("due_at"),
    status: text("status").notNull().default("not_started"),
    notes: text("notes"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [index("assignments_user_course_idx").on(table.userId, table.courseId)],
);

export const courseFiles = sqliteTable(
  "course_files",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    courseId: text("course_id").notNull(),
    fileName: text("file_name").notNull(),
    objectKey: text("object_key").notNull(),
    contentType: text("content_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    searchText: text("search_text").notNull().default(""),
    uploadedAt: integer("uploaded_at").notNull(),
  },
  (table) => [index("course_files_user_course_idx").on(table.userId, table.courseId)],
);

export const acorns = sqliteTable(
  "acorns",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    content: text("content").notNull(),
    kind: text("kind").notNull().default("note"),
    status: text("status").notNull().default("loose"),
    energy: text("energy").notNull().default("medium"),
    estimatedMinutes: integer("estimated_minutes").notNull().default(15),
    brainLoad: text("brain_load").notNull().default("some"),
    dueAt: text("due_at"),
    location: text("location"),
    firstStep: text("first_step"),
    notes: text("notes"),
    priority: integer("priority").notNull().default(2),
    avoidCount: integer("avoid_count").notNull().default(0),
    lastSuggestedAt: integer("last_suggested_at"),
    completedAt: integer("completed_at"),
    delegatedTo: text("delegated_to"),
    context: text("context").notNull().default("anywhere"),
    source: text("source").notNull().default("capture"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [index("acorns_user_status_idx").on(table.userId, table.status, table.updatedAt)],
);

export const dailyCalibrations = sqliteTable(
  "daily_calibrations",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    localDate: text("local_date").notNull(),
    energy: text("energy").notNull().default("medium"),
    availableMinutes: integer("available_minutes").notNull().default(30),
    location: text("location").notNull().default("anywhere"),
    immovableObligation: text("immovable_obligation"),
    minimumDay: integer("minimum_day").notNull().default(0),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [uniqueIndex("daily_calibrations_user_date_idx").on(table.userId, table.localDate)],
);

export const acornEvents = sqliteTable(
  "acorn_events",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    acornId: text("acorn_id"),
    eventType: text("event_type").notNull(),
    reason: text("reason"),
    metadata: text("metadata"),
    createdAt: integer("created_at").notNull(),
  },
  (table) => [index("acorn_events_user_created_idx").on(table.userId, table.createdAt)],
);

export const medications = sqliteTable(
  "medications",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    name: text("name").notNull(),
    formulation: text("formulation"),
    dose: text("dose").notNull(),
    instructions: text("instructions"),
    scheduleLabel: text("schedule_label"),
    refillDueAt: text("refill_due_at"),
    active: integer("active").notNull().default(1),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [index("medications_user_active_idx").on(table.userId, table.active, table.updatedAt)],
);

export const medicationLogs = sqliteTable(
  "medication_logs",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    medicationId: text("medication_id").notNull(),
    status: text("status").notNull(),
    note: text("note"),
    loggedAt: integer("logged_at").notNull(),
  },
  (table) => [index("medication_logs_user_time_idx").on(table.userId, table.loggedAt)],
);

export const bodyDoubleSessions = sqliteTable(
  "body_double_sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    shareCode: text("share_code").notNull().unique(),
    taskLabel: text("task_label"),
    shareTaskDetails: integer("share_task_details").notNull().default(0),
    status: text("status").notNull().default("active"),
    startedAt: integer("started_at").notNull(),
    endedAt: integer("ended_at"),
    createdAt: integer("created_at").notNull(),
  },
  (table) => [index("body_double_sessions_user_status_idx").on(table.userId, table.status, table.createdAt)],
);
